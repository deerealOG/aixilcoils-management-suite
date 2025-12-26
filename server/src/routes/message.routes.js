/**
 * Message Routes
 * 
 * Chat message operations
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadAttachment } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');

/**
 * GET /api/messages/channel/:channelId
 * Get messages for a channel
 */
router.get('/channel/:channelId', authenticate, asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page, limit, before } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit || 50);

  // Verify user is member of channel
  const member = await global.prisma.channelMember.findFirst({
    where: { channelId, userId: req.user.id },
  });

  if (!member) {
    return res.status(403).json({ error: 'Not a member of this channel' });
  }

  const where = {
    channelId,
    isDeleted: false,
  };

  if (before) {
    where.createdAt = { lt: new Date(before) };
  }

  const [messages, total] = await Promise.all([
    global.prisma.message.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        attachments: true,
        readReceipts: {
          select: {
            userId: true,
            readAt: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            sender: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    }),
    global.prisma.message.count({ where }),
  ]);

  // Update last read
  await global.prisma.channelMember.update({
    where: { id: member.id },
    data: { lastRead: new Date() },
  });

  res.json({
    data: messages.reverse(), // Return in chronological order
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * POST /api/messages
 * Send a message (REST fallback for WebSocket)
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { channelId, content, parentId } = req.body;
  const userId = req.user.id;

  // Verify user is member of channel
  const member = await global.prisma.channelMember.findFirst({
    where: { channelId, userId },
  });

  if (!member) {
    return res.status(403).json({ error: 'Not a member of this channel' });
  }

  const message = await global.prisma.message.create({
    data: {
      content,
      channelId,
      senderId: userId,
      parentId,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      attachments: true,
    },
  });

  // Update channel timestamp
  await global.prisma.channel.update({
    where: { id: channelId },
    data: { updatedAt: new Date() },
  });

  // Update member last read
  await global.prisma.channelMember.update({
    where: { id: member.id },
    data: { lastRead: new Date() },
  });

  // Emit via WebSocket
  const { getIO } = require('../websocket/socketServer');
  const io = getIO();
  if (io) {
    io.to(`channel:${channelId}`).emit('message:new', message);
  }

  res.status(201).json(message);
}));

/**
 * POST /api/messages/:id/attachments
 * Upload attachments to a message
 */
router.post('/:id/attachments', authenticate, uploadAttachment, asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;

  // Verify message ownership
  const message = await global.prisma.message.findFirst({
    where: { id: messageId, senderId: req.user.id },
  });

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // Create attachment records
  const attachments = await Promise.all(
    req.files.map(file => 
      global.prisma.attachment.create({
        data: {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: `/uploads/${file.filename}`,
          messageId,
        },
      })
    )
  );

  res.status(201).json(attachments);
}));

/**
 * PUT /api/messages/:id
 * Edit a message
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { content } = req.body;

  const message = await global.prisma.message.findFirst({
    where: { id: req.params.id, senderId: req.user.id },
  });

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const updated = await global.prisma.message.update({
    where: { id: req.params.id },
    data: { content, isEdited: true },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      attachments: true,
    },
  });

  // Emit via WebSocket
  const { getIO } = require('../websocket/socketServer');
  const io = getIO();
  if (io) {
    io.to(`channel:${message.channelId}`).emit('message:updated', updated);
  }

  res.json(updated);
}));

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const message = await global.prisma.message.findFirst({
    where: { id: req.params.id },
  });

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // Allow deletion by sender or admin
  if (message.senderId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized to delete this message' });
  }

  await global.prisma.message.update({
    where: { id: req.params.id },
    data: { isDeleted: true },
  });

  // Emit via WebSocket
  const { getIO } = require('../websocket/socketServer');
  const io = getIO();
  if (io) {
    io.to(`channel:${message.channelId}`).emit('message:deleted', { messageId: req.params.id });
  }

  res.json({ message: 'Message deleted successfully' });
}));

/**
 * POST /api/messages/:id/read
 * Mark message as read
 */
router.post('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const userId = req.user.id;

  await global.prisma.readReceipt.upsert({
    where: {
      messageId_userId: { messageId, userId },
    },
    update: { readAt: new Date() },
    create: { messageId, userId },
  });

  res.json({ message: 'Message marked as read' });
}));

/**
 * GET /api/messages/search
 * Search messages
 */
router.get('/search', authenticate, asyncHandler(async (req, res) => {
  const { q, channelId, limit = 20 } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  // Get channels user is member of
  const channelIds = channelId 
    ? [channelId]
    : (await global.prisma.channelMember.findMany({
        where: { userId: req.user.id },
        select: { channelId: true },
      })).map(m => m.channelId);

  const messages = await global.prisma.message.findMany({
    where: {
      channelId: { in: channelIds },
      content: { contains: q, mode: 'insensitive' },
      isDeleted: false,
    },
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      channel: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  res.json(messages);
}));

module.exports = router;
