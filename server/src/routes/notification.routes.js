/**
 * Notification Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, isRead, type } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit || 20);
  const where = { userId: req.user.id };
  if (isRead !== undefined) where.isRead = isRead === 'true';
  if (type) where.type = type;

  const [notifications, total, unreadCount] = await Promise.all([
    global.prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    global.prisma.notification.count({ where }),
    global.prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);
  res.json({ data: notifications, unreadCount, pagination: createPaginationMeta(total, pageNum, limitNum) });
}));

router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
  const count = await global.prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ count });
}));

router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const updated = await global.prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true, readAt: new Date() },
  });
  res.json(updated);
}));

router.put('/read-all', authenticate, asyncHandler(async (req, res) => {
  await global.prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ message: 'All notifications marked as read' });
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await global.prisma.notification.delete({ where: { id: req.params.id } });
  res.json({ message: 'Notification deleted' });
}));

module.exports = router;
