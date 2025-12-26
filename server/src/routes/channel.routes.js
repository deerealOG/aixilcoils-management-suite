/**
 * Channel Routes
 * 
 * Chat channel management for internal communication
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate, validationRules } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/channels
 * Get all channels for current user
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type } = req.query;

  const where = {
    members: {
      some: { userId },
    },
  };

  if (type) where.type = type;

  const channels = await global.prisma.channel.findMany({
    where,
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Get unread counts for each channel
  const channelsWithUnread = await Promise.all(
    channels.map(async (channel) => {
      const member = channel.members.find(m => m.userId === userId);
      const unreadCount = await global.prisma.message.count({
        where: {
          channelId: channel.id,
          createdAt: { gt: member?.lastRead || new Date(0) },
          senderId: { not: userId },
        },
      });
      return {
        ...channel,
        unreadCount,
      };
    })
  );

  res.json(channelsWithUnread);
}));

/**
 * GET /api/channels/:id
 * Get channel details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const channel = await global.prisma.channel.findFirst({
    where: {
      id: req.params.id,
      members: {
        some: { userId: req.user.id },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              status: true,
              position: true,
            },
          },
        },
      },
      department: {
        select: { id: true, name: true },
      },
    },
  });

  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  res.json(channel);
}));

/**
 * POST /api/channels
 * Create a new channel
 */
router.post('/', authenticate, authorize('channels:create'), validate(validationRules.channel), asyncHandler(async (req, res) => {
  const { name, description, type, isPrivate, departmentId, memberIds } = req.body;
  const userId = req.user.id;

  // Create channel
  const channel = await global.prisma.channel.create({
    data: {
      name,
      description,
      type: type || 'GROUP',
      isPrivate: isPrivate || false,
      departmentId,
      members: {
        create: [
          { userId, role: 'OWNER' },
          ...(memberIds || []).map(id => ({ userId: id, role: 'MEMBER' })),
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json(channel);
}));

/**
 * POST /api/channels/direct
 * Create or get direct message channel
 */
router.post('/direct', authenticate, asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.body;
  const currentUserId = req.user.id;

  if (targetUserId === currentUserId) {
    return res.status(400).json({ error: 'Cannot create DM with yourself' });
  }

  // Check if target user exists
  const targetUser = await global.prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Find existing DM channel
  const existingChannel = await global.prisma.channel.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { members: { some: { userId: currentUserId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (existingChannel) {
    return res.json(existingChannel);
  }

  // Create new DM channel
  const channel = await global.prisma.channel.create({
    data: {
      name: `DM-${currentUserId}-${targetUserId}`,
      type: 'DIRECT',
      isPrivate: true,
      members: {
        create: [
          { userId: currentUserId, role: 'MEMBER' },
          { userId: targetUserId, role: 'MEMBER' },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json(channel);
}));

/**
 * PUT /api/channels/:id
 * Update channel
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { name, description, isPrivate } = req.body;

  // Check if user is owner/admin of channel
  const member = await global.prisma.channelMember.findFirst({
    where: {
      channelId: req.params.id,
      userId: req.user.id,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!member && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized to update this channel' });
  }

  const channel = await global.prisma.channel.update({
    where: { id: req.params.id },
    data: { name, description, isPrivate },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
    },
  });

  res.json(channel);
}));

/**
 * POST /api/channels/:id/members
 * Add members to channel
 */
router.post('/:id/members', authenticate, asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const channelId = req.params.id;

  // Check if user can add members
  const member = await global.prisma.channelMember.findFirst({
    where: {
      channelId,
      userId: req.user.id,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!member && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized to add members' });
  }

  // Add members
  await global.prisma.channelMember.createMany({
    data: userIds.map(userId => ({
      channelId,
      userId,
      role: 'MEMBER',
    })),
    skipDuplicates: true,
  });

  const channel = await global.prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
    },
  });

  res.json(channel);
}));

/**
 * DELETE /api/channels/:id/members/:userId
 * Remove member from channel
 */
router.delete('/:id/members/:userId', authenticate, asyncHandler(async (req, res) => {
  const { id: channelId, userId } = req.params;

  // Check if user can remove members
  const member = await global.prisma.channelMember.findFirst({
    where: {
      channelId,
      userId: req.user.id,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  // Allow self-removal
  const isSelfRemoval = userId === req.user.id;

  if (!member && !isSelfRemoval && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized to remove members' });
  }

  await global.prisma.channelMember.deleteMany({
    where: { channelId, userId },
  });

  res.json({ message: 'Member removed successfully' });
}));

/**
 * DELETE /api/channels/:id
 * Delete channel
 */
router.delete('/:id', authenticate, authorize('channels:delete'), asyncHandler(async (req, res) => {
  await global.prisma.channel.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Channel deleted successfully' });
}));

module.exports = router;
