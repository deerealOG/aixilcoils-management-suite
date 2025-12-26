/**
 * Analytics Routes - Company dashboard and metrics
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPeriodDates } = require('../utils/helpers');

router.get('/dashboard', authenticate, authorize('analytics:read'), asyncHandler(async (req, res) => {
  const [userCount, departmentCount, projectCount, taskCount] = await Promise.all([
    global.prisma.user.count({ where: { status: 'ACTIVE' } }),
    global.prisma.department.count(),
    global.prisma.project.count(),
    global.prisma.task.count(),
  ]);

  const taskStats = await global.prisma.task.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const projectStats = await global.prisma.project.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  res.json({
    overview: { userCount, departmentCount, projectCount, taskCount },
    taskStats: Object.fromEntries(taskStats.map(t => [t.status, t._count.status])),
    projectStats: Object.fromEntries(projectStats.map(p => [p.status, p._count.status])),
  });
}));

router.get('/users', authenticate, authorize('analytics:read'), asyncHandler(async (req, res) => {
  const roleDistribution = await global.prisma.user.groupBy({
    by: ['role'],
    where: { status: 'ACTIVE' },
    _count: { role: true },
  });

  const departmentDistribution = await global.prisma.user.groupBy({
    by: ['departmentId'],
    where: { status: 'ACTIVE', departmentId: { not: null } },
    _count: { departmentId: true },
  });

  res.json({ roleDistribution, departmentDistribution });
}));

router.get('/performance', authenticate, authorize('analytics:read'), asyncHandler(async (req, res) => {
  const { startDate, endDate } = getPeriodDates('month');
  
  const [kpiStats, reviewStats] = await Promise.all([
    global.prisma.kPI.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    global.prisma.performanceReview.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ]);

  res.json({ kpiStats, reviewStats });
}));

router.get('/departments/:id', authenticate, asyncHandler(async (req, res) => {
  const departmentId = req.params.id;
  
  const [userCount, projectCount, taskStats] = await Promise.all([
    global.prisma.user.count({ where: { departmentId, status: 'ACTIVE' } }),
    global.prisma.project.count({ where: { departmentId } }),
    global.prisma.task.groupBy({
      by: ['status'],
      where: { project: { departmentId } },
      _count: { status: true },
    }),
  ]);

  res.json({ departmentId, userCount, projectCount, taskStats });
}));

module.exports = router;
