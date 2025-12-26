/**
 * OKR Routes
 * 
 * Objectives and Key Results management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate, validationRules } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta, calculatePercentage, getCurrentPeriodLabel } = require('../utils/helpers');

/**
 * GET /api/okrs
 * Get all OKRs
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, userId, period, status } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  if (userId) where.userId = userId;
  if (period) where.period = period;
  if (status) where.status = status;

  // Employees can only see their own OKRs
  if (req.user.role === 'EMPLOYEE') {
    where.userId = req.user.id;
  }

  const [okrs, total] = await Promise.all([
    global.prisma.oKR.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        keyResults: {
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    global.prisma.oKR.count({ where }),
  ]);

  res.json({
    data: okrs,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/okrs/my-okrs
 * Get current user's OKRs
 */
router.get('/my-okrs', authenticate, asyncHandler(async (req, res) => {
  const { period } = req.query;
  const currentPeriod = period || getCurrentPeriodLabel('quarter');

  const okrs = await global.prisma.oKR.findMany({
    where: {
      userId: req.user.id,
      period: currentPeriod,
    },
    include: {
      keyResults: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  res.json(okrs);
}));

/**
 * GET /api/okrs/:id
 * Get OKR details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const okr = await global.prisma.oKR.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true, position: true },
      },
      keyResults: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!okr) {
    return res.status(404).json({ error: 'OKR not found' });
  }

  res.json(okr);
}));

/**
 * POST /api/okrs
 * Create a new OKR
 */
router.post('/', authenticate, authorize('okrs:create'), validate(validationRules.okr), asyncHandler(async (req, res) => {
  const { objective, period, keyResults } = req.body;
  const userId = req.body.userId || req.user.id;

  const okr = await global.prisma.oKR.create({
    data: {
      objective,
      userId,
      period: period || getCurrentPeriodLabel('quarter'),
      status: 'ACTIVE',
      progress: 0,
      keyResults: keyResults ? {
        create: keyResults.map(kr => ({
          description: kr.description,
          targetValue: kr.targetValue,
          currentValue: kr.currentValue || 0,
          unit: kr.unit,
          progress: 0,
        })),
      } : undefined,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
      keyResults: true,
    },
  });

  res.status(201).json(okr);
}));

/**
 * PUT /api/okrs/:id
 * Update OKR
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { objective, status } = req.body;

  const okr = await global.prisma.oKR.findUnique({
    where: { id: req.params.id },
  });

  if (!okr) {
    return res.status(404).json({ error: 'OKR not found' });
  }

  // Check permissions
  if (req.user.role === 'EMPLOYEE' && okr.userId !== req.user.id) {
    return res.status(403).json({ error: 'Cannot update this OKR' });
  }

  const updateData = {};
  if (objective) updateData.objective = objective;
  if (status) updateData.status = status;

  const updated = await global.prisma.oKR.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      keyResults: true,
    },
  });

  res.json(updated);
}));

/**
 * POST /api/okrs/:id/key-results
 * Add key result to OKR
 */
router.post('/:id/key-results', authenticate, asyncHandler(async (req, res) => {
  const { description, targetValue, currentValue, unit } = req.body;

  const okr = await global.prisma.oKR.findUnique({
    where: { id: req.params.id },
  });

  if (!okr) {
    return res.status(404).json({ error: 'OKR not found' });
  }

  // Check permissions
  if (req.user.role === 'EMPLOYEE' && okr.userId !== req.user.id) {
    return res.status(403).json({ error: 'Cannot modify this OKR' });
  }

  const keyResult = await global.prisma.keyResult.create({
    data: {
      okrId: req.params.id,
      description,
      targetValue,
      currentValue: currentValue || 0,
      unit,
      progress: calculatePercentage(Number(currentValue || 0), Number(targetValue)),
    },
  });

  // Recalculate OKR progress
  await recalculateOKRProgress(req.params.id);

  res.status(201).json(keyResult);
}));

/**
 * PUT /api/okrs/:okrId/key-results/:krId
 * Update key result
 */
router.put('/:okrId/key-results/:krId', authenticate, asyncHandler(async (req, res) => {
  const { description, targetValue, currentValue, unit } = req.body;

  const kr = await global.prisma.keyResult.findFirst({
    where: {
      id: req.params.krId,
      okrId: req.params.okrId,
    },
    include: {
      okr: true,
    },
  });

  if (!kr) {
    return res.status(404).json({ error: 'Key result not found' });
  }

  // Check permissions
  if (req.user.role === 'EMPLOYEE' && kr.okr.userId !== req.user.id) {
    return res.status(403).json({ error: 'Cannot modify this key result' });
  }

  const updateData = {};
  if (description) updateData.description = description;
  if (targetValue !== undefined) updateData.targetValue = targetValue;
  if (currentValue !== undefined) updateData.currentValue = currentValue;
  if (unit !== undefined) updateData.unit = unit;

  // Calculate progress
  const newTarget = targetValue !== undefined ? targetValue : kr.targetValue;
  const newCurrent = currentValue !== undefined ? currentValue : kr.currentValue;
  updateData.progress = calculatePercentage(Number(newCurrent), Number(newTarget));

  const updated = await global.prisma.keyResult.update({
    where: { id: req.params.krId },
    data: updateData,
  });

  // Recalculate OKR progress
  await recalculateOKRProgress(req.params.okrId);

  res.json(updated);
}));

/**
 * PUT /api/okrs/:okrId/key-results/:krId/progress
 * Quick update key result progress
 */
router.put('/:okrId/key-results/:krId/progress', authenticate, asyncHandler(async (req, res) => {
  const { currentValue } = req.body;

  const kr = await global.prisma.keyResult.findFirst({
    where: {
      id: req.params.krId,
      okrId: req.params.okrId,
    },
  });

  if (!kr) {
    return res.status(404).json({ error: 'Key result not found' });
  }

  const progress = calculatePercentage(Number(currentValue), Number(kr.targetValue));

  const updated = await global.prisma.keyResult.update({
    where: { id: req.params.krId },
    data: { currentValue, progress },
  });

  // Recalculate OKR progress
  await recalculateOKRProgress(req.params.okrId);

  res.json(updated);
}));

/**
 * DELETE /api/okrs/:okrId/key-results/:krId
 * Delete key result
 */
router.delete('/:okrId/key-results/:krId', authenticate, asyncHandler(async (req, res) => {
  await global.prisma.keyResult.delete({
    where: { id: req.params.krId },
  });

  // Recalculate OKR progress
  await recalculateOKRProgress(req.params.okrId);

  res.json({ message: 'Key result deleted successfully' });
}));

/**
 * DELETE /api/okrs/:id
 * Delete OKR
 */
router.delete('/:id', authenticate, authorize('okrs:delete'), asyncHandler(async (req, res) => {
  await global.prisma.oKR.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'OKR deleted successfully' });
}));

/**
 * Helper function to recalculate OKR progress
 */
async function recalculateOKRProgress(okrId) {
  const keyResults = await global.prisma.keyResult.findMany({
    where: { okrId },
  });

  if (keyResults.length === 0) {
    await global.prisma.oKR.update({
      where: { id: okrId },
      data: { progress: 0 },
    });
    return;
  }

  const avgProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length;

  await global.prisma.oKR.update({
    where: { id: okrId },
    data: { 
      progress: Math.round(avgProgress),
      status: avgProgress >= 100 ? 'COMPLETED' : 'ACTIVE',
    },
  });
}

module.exports = router;
