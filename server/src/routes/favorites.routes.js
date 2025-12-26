/**
 * Favorites/Bookmarks Routes
 * 
 * Allow users to bookmark any entity for quick access
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/favorites
 * Get all favorites for the current user
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type } = req.query;

  const where = { userId };
  if (type) {
    where.entityType = type;
  }

  const favorites = await global.prisma.favorite.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Enrich favorites with entity data
  const enrichedFavorites = await Promise.all(
    favorites.map(async (fav) => {
      let entityData = null;
      
      try {
        switch (fav.entityType) {
          case 'project':
            entityData = await global.prisma.project.findUnique({
              where: { id: fav.entityId },
              select: { id: true, name: true, status: true },
            });
            break;
          case 'task':
            entityData = await global.prisma.task.findUnique({
              where: { id: fav.entityId },
              select: { id: true, title: true, status: true, project: { select: { name: true } } },
            });
            break;
          case 'document':
            entityData = await global.prisma.document.findUnique({
              where: { id: fav.entityId },
              select: { id: true, name: true, type: true },
            });
            break;
          case 'channel':
            entityData = await global.prisma.channel.findUnique({
              where: { id: fav.entityId },
              select: { id: true, name: true, type: true },
            });
            break;
          case 'user':
            entityData = await global.prisma.user.findUnique({
              where: { id: fav.entityId },
              select: { id: true, firstName: true, lastName: true, avatar: true, position: true },
            });
            break;
        }
      } catch (error) {
        console.error(`Failed to fetch entity for favorite ${fav.id}:`, error);
      }

      return {
        ...fav,
        entity: entityData,
      };
    })
  );

  // Filter out favorites where entity no longer exists
  const validFavorites = enrichedFavorites.filter(f => f.entity !== null);

  res.json({ favorites: validFavorites });
}));

/**
 * POST /api/favorites
 * Add a new favorite
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { entityType, entityId } = req.body;

  if (!entityType || !entityId) {
    return res.status(400).json({ error: 'entityType and entityId are required' });
  }

  const validTypes = ['project', 'task', 'document', 'channel', 'user'];
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({ error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}` });
  }

  // Check if already favorited
  const existing = await global.prisma.favorite.findUnique({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType,
        entityId,
      },
    },
  });

  if (existing) {
    return res.status(409).json({ error: 'Already favorited', favorite: existing });
  }

  const favorite = await global.prisma.favorite.create({
    data: {
      userId,
      entityType,
      entityId,
    },
  });

  res.status(201).json({ favorite, message: 'Added to favorites' });
}));

/**
 * DELETE /api/favorites/:id
 * Remove a favorite by ID
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const favorite = await global.prisma.favorite.findFirst({
    where: { id, userId },
  });

  if (!favorite) {
    return res.status(404).json({ error: 'Favorite not found' });
  }

  await global.prisma.favorite.delete({ where: { id } });

  res.json({ message: 'Removed from favorites' });
}));

/**
 * DELETE /api/favorites/entity/:entityType/:entityId
 * Remove a favorite by entity
 */
router.delete('/entity/:entityType/:entityId', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { entityType, entityId } = req.params;

  const result = await global.prisma.favorite.deleteMany({
    where: {
      userId,
      entityType,
      entityId,
    },
  });

  if (result.count === 0) {
    return res.status(404).json({ error: 'Favorite not found' });
  }

  res.json({ message: 'Removed from favorites' });
}));

/**
 * GET /api/favorites/check/:entityType/:entityId
 * Check if an entity is favorited
 */
router.get('/check/:entityType/:entityId', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { entityType, entityId } = req.params;

  const favorite = await global.prisma.favorite.findUnique({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType,
        entityId,
      },
    },
  });

  res.json({ isFavorited: !!favorite, favorite });
}));

module.exports = router;
