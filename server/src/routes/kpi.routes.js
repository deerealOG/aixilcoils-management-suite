/**
 * KPI Routes
 * 
 * Key Performance Indicator management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate, validationRules } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta, calculatePercentage, getCurrentPeriodLabel } = require('../utils/helpers');

/**
 * GET /api/kpis
 * Get all KPIs
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, userId, departmentId, period, status } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  if (userId) where.userId = userId;
  if (departmentId) where.departmentId = departmentId;
  if (period) where.period = period;
  if (status) where.status = status;

  // Employees can only see their own KPIs
  if (req.user.role === 'EMPLOYEE') {
    where.userId = req.user.id;
  }
  // Managers can see department KPIs
  else if (req.user.role === 'MANAGER') {
    where.OR = [
      { userId: req.user.id },
      { departmentId: req.user.departmentId },
    ];
  }

  const [kpis, total] = await Promise.all([
    global.prisma.kPI.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    }),
    global.prisma.kPI.count({ where }),
  ]);

  // Calculate progress percentage for each KPI
  const kpisWithProgress = kpis.map(kpi => ({
    ...kpi,
    progress: calculatePercentage(Number(kpi.currentValue), Number(kpi.targetValue)),
  }));

  res.json({
    data: kpisWithProgress,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/kpis/dashboard
 * Get KPI dashboard data for current user
 */
router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  const { period } = req.query;
  const currentPeriod = period || getCurrentPeriodLabel('quarter');

  // Get user's KPIs
  const userKpis = await global.prisma.kPI.findMany({
    where: {
      userId: req.user.id,
      period: currentPeriod,
    },
  });

  // Get department KPIs if applicable
  let departmentKpis = [];
  if (req.user.departmentId) {
    departmentKpis = await global.prisma.kPI.findMany({
      where: {
        departmentId: req.user.departmentId,
        userId: null,
        period: currentPeriod,
      },
    });
  }

  // Calculate overall progress
  const allKpis = [...userKpis, ...departmentKpis];
  const totalProgress = allKpis.length > 0
    ? allKpis.reduce((sum, kpi) => sum + calculatePercentage(Number(kpi.currentValue), Number(kpi.targetValue)), 0) / allKpis.length
    : 0;

  // Status breakdown
  const statusBreakdown = {
    ON_TRACK: allKpis.filter(k => k.status === 'ON_TRACK').length,
    AT_RISK: allKpis.filter(k => k.status === 'AT_RISK').length,
    BEHIND: allKpis.filter(k => k.status === 'BEHIND').length,
    ACHIEVED: allKpis.filter(k => k.status === 'ACHIEVED').length,
    EXCEEDED: allKpis.filter(k => k.status === 'EXCEEDED').length,
  };

  res.json({
    period: currentPeriod,
    userKpis: userKpis.map(k => ({
      ...k,
      progress: calculatePercentage(Number(k.currentValue), Number(k.targetValue)),
    })),
    departmentKpis: departmentKpis.map(k => ({
      ...k,
      progress: calculatePercentage(Number(k.currentValue), Number(k.targetValue)),
    })),
    totalProgress: Math.round(totalProgress),
    totalKpis: allKpis.length,
    statusBreakdown,
  });
}));

/**
 * GET /api/kpis/:id
 * Get KPI details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const kpi = await global.prisma.kPI.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true, position: true },
      },
      department: {
        select: { id: true, name: true },
      },
    },
  });

  if (!kpi) {
    return res.status(404).json({ error: 'KPI not found' });
  }

  res.json({
    ...kpi,
    progress: calculatePercentage(Number(kpi.currentValue), Number(kpi.targetValue)),
  });
}));

/**
 * POST /api/kpis
 * Create a new KPI
 */
router.post('/', authenticate, authorize('kpis:create'), validate(validationRules.kpi), asyncHandler(async (req, res) => {
  const { name, description, userId, departmentId, targetValue, currentValue, unit, period, status } = req.body;

  const kpi = await global.prisma.kPI.create({
    data: {
      name,
      description,
      userId,
      departmentId,
      targetValue,
      currentValue: currentValue || 0,
      unit,
      period: period || getCurrentPeriodLabel('quarter'),
      status: status || 'ON_TRACK',
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
      department: {
        select: { id: true, name: true },
      },
    },
  });

  res.status(201).json({
    ...kpi,
    progress: calculatePercentage(Number(kpi.currentValue), Number(kpi.targetValue)),
  });
}));

/**
 * PUT /api/kpis/:id
 * Update KPI
 */
router.put('/:id', authenticate, authorize('kpis:update'), asyncHandler(async (req, res) => {
  const { name, description, targetValue, currentValue, unit, status } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (targetValue !== undefined) updateData.targetValue = targetValue;
  if (currentValue !== undefined) updateData.currentValue = currentValue;
  if (unit !== undefined) updateData.unit = unit;
  if (status) updateData.status = status;

  // Auto-update status based on progress
  if (currentValue !== undefined && targetValue !== undefined) {
    const progress = calculatePercentage(Number(currentValue), Number(targetValue));
    if (progress >= 100) {
      updateData.status = progress > 100 ? 'EXCEEDED' : 'ACHIEVED';
    } else if (progress >= 75) {
      updateData.status = 'ON_TRACK';
    } else if (progress >= 50) {
      updateData.status = 'AT_RISK';
    } else {
      updateData.status = 'BEHIND';
    }
  }

  const kpi = await global.prisma.kPI.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.json({
    ...kpi,
    progress: calculatePercentage(Number(kpi.currentValue), Number(kpi.targetValue)),
  });
}));

/**
 * PUT /api/kpis/:id/progress
 * Quick update KPI progress
 */
router.put('/:id/progress', authenticate, asyncHandler(async (req, res) => {
  const { currentValue } = req.body;

  const kpi = await global.prisma.kPI.findUnique({
    where: { id: req.params.id },
  });

  if (!kpi) {
    return res.status(404).json({ error: 'KPI not found' });
  }

  // Check if user can update this KPI
  if (req.user.role === 'EMPLOYEE' && kpi.userId !== req.user.id) {
    return res.status(403).json({ error: 'Cannot update this KPI' });
  }

  const progress = calculatePercentage(Number(currentValue), Number(kpi.targetValue));
  let status = kpi.status;
  
  if (progress >= 100) {
    status = progress > 100 ? 'EXCEEDED' : 'ACHIEVED';
  } else if (progress >= 75) {
    status = 'ON_TRACK';
  } else if (progress >= 50) {
    status = 'AT_RISK';
  } else {
    status = 'BEHIND';
  }

  const updated = await global.prisma.kPI.update({
    where: { id: req.params.id },
    data: { currentValue, status },
  });

  res.json({
    ...updated,
    progress,
  });
}));

/**
 * DELETE /api/kpis/:id
 * Delete KPI
 */
router.delete('/:id', authenticate, authorize('kpis:delete'), asyncHandler(async (req, res) => {
  await global.prisma.kPI.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'KPI deleted successfully' });
}));

module.exports = router;
