/**
 * WebSocket Server
 * 
 * Real-time communication using Socket.IO
 */

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { cacheSet, cacheGet, cacheDelete } = require('../config/redis');

let io;
const userSockets = new Map(); // userId -> Set of socket IDs
const typingUsers = new Map(); // channelId -> Map of userId -> timestamp

/**
 * Initialize WebSocket server
 */
const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      // Get user from database
      const user = await global.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          departmentId: true,
          avatar: true,
        },
      });

      if (!user || user.status === 'INACTIVE') {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    
    logger.info(`User connected: ${socket.user.email} (${socket.id})`);

    // Track user sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Update user online status in cache
    cacheSet(`user:online:${userId}`, true, 300);

    // Emit online status to all connections
    io.emit('user:online', { userId, online: true });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join department room if applicable
    if (socket.user.departmentId) {
      socket.join(`department:${socket.user.departmentId}`);
    }

    // ==================== CHANNEL EVENTS ====================

    // Join channel
    socket.on('channel:join', async (channelId) => {
      try {
        // Verify user is member of channel
        const member = await global.prisma.channelMember.findFirst({
          where: { channelId, userId },
        });

        if (member) {
          socket.join(`channel:${channelId}`);
          logger.debug(`User ${userId} joined channel ${channelId}`);
        }
      } catch (error) {
        logger.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Leave channel
    socket.on('channel:leave', (channelId) => {
      socket.leave(`channel:${channelId}`);
      logger.debug(`User ${userId} left channel ${channelId}`);
    });

    // ==================== MESSAGE EVENTS ====================

    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { channelId, content, parentId, tempId } = data;

        // Verify user is member of channel
        const member = await global.prisma.channelMember.findFirst({
          where: { channelId, userId },
        });

        if (!member) {
          socket.emit('error', { message: 'Not a member of this channel' });
          return;
        }

        // Create message
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
          },
        });

        // Update channel member's last read
        await global.prisma.channelMember.update({
          where: { id: member.id },
          data: { lastRead: new Date() },
        });

        // Emit to channel
        io.to(`channel:${channelId}`).emit('message:new', {
          ...message,
          tempId, // Include temp ID for sender to match
        });

        // Clear typing indicator
        clearTyping(channelId, userId);

        logger.debug(`Message sent in channel ${channelId} by ${userId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Edit message
    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await global.prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message || message.senderId !== userId) {
          socket.emit('error', { message: 'Cannot edit this message' });
          return;
        }

        const updated = await global.prisma.message.update({
          where: { id: messageId },
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
          },
        });

        io.to(`channel:${message.channelId}`).emit('message:updated', updated);
      } catch (error) {
        logger.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Delete message
    socket.on('message:delete', async (messageId) => {
      try {
        const message = await global.prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message || message.senderId !== userId) {
          socket.emit('error', { message: 'Cannot delete this message' });
          return;
        }

        await global.prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true },
        });

        io.to(`channel:${message.channelId}`).emit('message:deleted', { messageId });
      } catch (error) {
        logger.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // ==================== TYPING EVENTS ====================

    // Start typing
    socket.on('typing:start', (channelId) => {
      if (!typingUsers.has(channelId)) {
        typingUsers.set(channelId, new Map());
      }
      typingUsers.get(channelId).set(userId, Date.now());

      socket.to(`channel:${channelId}`).emit('typing:update', {
        channelId,
        users: getTypingUsers(channelId, userId),
      });
    });

    // Stop typing
    socket.on('typing:stop', (channelId) => {
      clearTyping(channelId, userId);
      socket.to(`channel:${channelId}`).emit('typing:update', {
        channelId,
        users: getTypingUsers(channelId, userId),
      });
    });

    // ==================== READ RECEIPTS ====================

    socket.on('message:read', async (data) => {
      try {
        const { messageId, channelId } = data;

        // Create or update read receipt
        await global.prisma.readReceipt.upsert({
          where: {
            messageId_userId: { messageId, userId },
          },
          update: { readAt: new Date() },
          create: { messageId, userId },
        });

        // Update channel member's last read
        await global.prisma.channelMember.updateMany({
          where: { channelId, userId },
          data: { lastRead: new Date() },
        });

        socket.to(`channel:${channelId}`).emit('message:read', {
          messageId,
          userId,
          readAt: new Date(),
        });
      } catch (error) {
        logger.error('Error marking message as read:', error);
      }
    });

    // ==================== PRESENCE EVENTS ====================

    // Request online users
    socket.on('presence:request', async (userIds) => {
      const onlineStatus = {};
      for (const id of userIds) {
        onlineStatus[id] = userSockets.has(id);
      }
      socket.emit('presence:response', onlineStatus);
    });

    // ==================== NOTIFICATION EVENTS ====================

    socket.on('notification:read', async (notificationId) => {
      try {
        await global.prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true, readAt: new Date() },
        });
      } catch (error) {
        logger.error('Error marking notification as read:', error);
      }
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.email} (${socket.id})`);

      // Remove socket from tracking
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          cacheDelete(`user:online:${userId}`);
          
          // Emit offline status
          io.emit('user:online', { userId, online: false });
        }
      }
    });
  });

  logger.info('✅ WebSocket server initialized');
  return io;
};

/**
 * Get typing users for a channel (excluding specified user)
 */
const getTypingUsers = (channelId, excludeUserId) => {
  const channelTyping = typingUsers.get(channelId);
  if (!channelTyping) return [];

  const now = Date.now();
  const activeTypers = [];

  channelTyping.forEach((timestamp, id) => {
    // Remove stale typing indicators (older than 5 seconds)
    if (now - timestamp > 5000) {
      channelTyping.delete(id);
    } else if (id !== excludeUserId) {
      activeTypers.push(id);
    }
  });

  return activeTypers;
};

/**
 * Clear typing indicator for user
 */
const clearTyping = (channelId, userId) => {
  const channelTyping = typingUsers.get(channelId);
  if (channelTyping) {
    channelTyping.delete(userId);
  }
};

/**
 * Send notification to user
 */
const sendNotification = (userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

/**
 * Send notification to department
 */
const sendDepartmentNotification = (departmentId, notification) => {
  io.to(`department:${departmentId}`).emit('notification:new', notification);
};

/**
 * Broadcast to all connected users
 */
const broadcast = (event, data) => {
  io.emit(event, data);
};

/**
 * Get Socket.IO instance
 */
const getIO = () => io;

/**
 * Check if user is online
 */
const isUserOnline = (userId) => userSockets.has(userId);

/**
 * Get online users count
 */
const getOnlineUsersCount = () => userSockets.size;

module.exports = {
  initializeWebSocket,
  sendNotification,
  sendDepartmentNotification,
  broadcast,
  getIO,
  isUserOnline,
  getOnlineUsersCount,
};
