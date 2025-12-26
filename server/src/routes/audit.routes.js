/**
 * Audit Log Routes
 * 
 * View and export audit logs (OWNER only)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/errorHandler');
const { AUDIT_ACTIONS } = require('../utils/auditLogger');

// Get audit logs (OWNER only)
router.get('/', authenticate, requireRole('OWNER'), asyncHandler(async (req, res) => {
  const { 
    action, 
    entityType, 
    userId, 
    startDate, 
    endDate, 
    limit = 100, 
    offset = 0 
  } = req.query;

  const where = {};
  
  if (action) where.action = { contains: action };
  if (entityType) where.entityType = entityType;
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    global.prisma.auditLog.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        }
      }
    }),
    global.prisma.auditLog.count({ where })
  ]);

  res.json({
    data: logs,
    total,
    limit: Number(limit),
    offset: Number(offset),
  });
}));

// Get available action types
router.get('/actions', authenticate, requireRole('OWNER'), (req, res) => {
  res.json(Object.keys(AUDIT_ACTIONS));
});

// Export audit logs as CSV
router.get('/export', authenticate, requireRole('OWNER'), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const logs = await global.prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  });

  // Generate CSV
  const headers = ['Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
    log.user?.email || 'N/A',
    log.action,
    log.entityType,
    log.entityId || 'N/A',
    log.ipAddress || 'N/A',
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
}));

// Get high-risk action summary
router.get('/summary', authenticate, requireRole('OWNER'), asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayCount, deniedCount, roleChanges] = await Promise.all([
    global.prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
    global.prisma.auditLog.count({ 
      where: { 
        action: { contains: 'PERMISSION_DENIED' },
        createdAt: { gte: today }
      } 
    }),
    global.prisma.auditLog.count({ 
      where: { 
        action: { contains: 'ROLE_CHANGE' },
        createdAt: { gte: today }
      } 
    }),
  ]);

  res.json({
    todayTotal: todayCount,
    deniedAttempts: deniedCount,
    roleChangesToday: roleChanges,
  });
}));

module.exports = router;
