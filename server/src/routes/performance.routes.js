/**
 * Performance Review Routes
 * 
 * Employee performance review management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, authorizeOwnerOrPermission } = require('../middleware/authorize');
const { validate, validationRules } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta, getCurrentPeriodLabel } = require('../utils/helpers');
const { sendNotification } = require('../websocket/socketServer');
const { sendTemplatedEmail } = require('../utils/email');

/**
 * GET /api/performance/reviews
 * Get all performance reviews
 */
router.get('/reviews', authenticate, authorize('performance:read'), asyncHandler(async (req, res) => {
  const { page, limit, employeeId, reviewerId, period, type, status } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  if (employeeId) where.employeeId = employeeId;
  if (reviewerId) where.reviewerId = reviewerId;
  if (period) where.period = period;
  if (type) where.type = type;
  if (status) where.status = status;

  // If user is employee, show only their reviews
  if (req.user.role === 'EMPLOYEE') {
    where.employeeId = req.user.id;
  }
  // If manager, show reviews for their subordinates
  else if (req.user.role === 'MANAGER') {
    const subordinates = await global.prisma.user.findMany({
      where: { managerId: req.user.id },
      select: { id: true },
    });
    where.employeeId = { in: subordinates.map(s => s.id) };
  }

  const [reviews, total] = await Promise.all([
    global.prisma.performanceReview.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
            department: { select: { name: true } },
          },
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        scores: true,
      },
    }),
    global.prisma.performanceReview.count({ where }),
  ]);

  res.json({
    data: reviews,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/performance/reviews/:id
 * Get review details
 */
router.get('/reviews/:id', authenticate, asyncHandler(async (req, res) => {
  const review = await global.prisma.performanceReview.findUnique({
    where: { id: req.params.id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
          position: true,
          department: { select: { name: true } },
        },
      },
      reviewer: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      scores: true,
    },
  });

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  // Check access
  if (
    req.user.role === 'EMPLOYEE' &&
    review.employeeId !== req.user.id
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(review);
}));

/**
 * POST /api/performance/reviews
 * Create a new performance review
 */
router.post('/reviews', authenticate, authorize('performance:create'), validate(validationRules.performanceReview), asyncHandler(async (req, res) => {
  const { employeeId, period, type, overallScore, strengths, improvements, goals, comments, scores } = req.body;

  const review = await global.prisma.performanceReview.create({
    data: {
      employeeId,
      reviewerId: req.user.id,
      period: period || getCurrentPeriodLabel('quarter'),
      type: type || 'QUARTERLY',
      overallScore,
      strengths,
      improvements,
      goals,
      comments,
      status: 'DRAFT',
      scores: scores ? {
        create: scores.map(s => ({
          category: s.category,
          score: s.score,
          weight: s.weight || 1,
          comments: s.comments,
        })),
      } : undefined,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
      scores: true,
    },
  });

  res.status(201).json(review);
}));

/**
 * PUT /api/performance/reviews/:id
 * Update performance review
 */
router.put('/reviews/:id', authenticate, authorize('performance:update'), asyncHandler(async (req, res) => {
  const { overallScore, strengths, improvements, goals, comments, status, scores } = req.body;

  const updateData = {};
  if (overallScore !== undefined) updateData.overallScore = overallScore;
  if (strengths !== undefined) updateData.strengths = strengths;
  if (improvements !== undefined) updateData.improvements = improvements;
  if (goals !== undefined) updateData.goals = goals;
  if (comments !== undefined) updateData.comments = comments;
  if (status) {
    updateData.status = status;
    if (status === 'SUBMITTED') {
      updateData.submittedAt = new Date();
    }
  }

  // Update scores if provided
  if (scores) {
    // Delete existing scores and create new ones
    await global.prisma.reviewScore.deleteMany({
      where: { reviewId: req.params.id },
    });
    await global.prisma.reviewScore.createMany({
      data: scores.map(s => ({
        reviewId: req.params.id,
        category: s.category,
        score: s.score,
        weight: s.weight || 1,
        comments: s.comments,
      })),
    });
  }

  const review = await global.prisma.performanceReview.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      scores: true,
    },
  });

  // If submitted, notify employee
  if (status === 'SUBMITTED') {
    const notification = await global.prisma.notification.create({
      data: {
        userId: review.employeeId,
        type: 'REVIEW',
        title: 'Performance Review Available',
        message: `Your ${review.type.toLowerCase()} performance review is ready for viewing`,
        data: { reviewId: review.id },
      },
    });
    sendNotification(review.employeeId, notification);
    sendTemplatedEmail('performanceReview', { employee: review.employee, review }, review.employee.email);
  }

  res.json(review);
}));

/**
 * POST /api/performance/reviews/:id/acknowledge
 * Employee acknowledges review
 */
router.post('/reviews/:id/acknowledge', authenticate, asyncHandler(async (req, res) => {
  const review = await global.prisma.performanceReview.findUnique({
    where: { id: req.params.id },
  });

  if (!review || review.employeeId !== req.user.id) {
    return res.status(404).json({ error: 'Review not found' });
  }

  if (review.status !== 'SUBMITTED') {
    return res.status(400).json({ error: 'Review must be submitted first' });
  }

  const updated = await global.prisma.performanceReview.update({
    where: { id: req.params.id },
    data: { status: 'ACKNOWLEDGED' },
  });

  res.json(updated);
}));

/**
 * DELETE /api/performance/reviews/:id
 * Delete performance review
 */
router.delete('/reviews/:id', authenticate, authorize('performance:delete'), asyncHandler(async (req, res) => {
  await global.prisma.performanceReview.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Review deleted successfully' });
}));

/**
 * GET /api/performance/feedback
 * Get peer feedback for user
 */
router.get('/feedback', authenticate, asyncHandler(async (req, res) => {
  const { receiverId, giverId, type } = req.query;

  const where = {};
  if (receiverId) where.receiverId = receiverId;
  if (giverId) where.giverId = giverId;
  if (type) where.type = type;

  // Employees can only see feedback received by them
  if (req.user.role === 'EMPLOYEE') {
    where.receiverId = req.user.id;
  }

  const feedback = await global.prisma.peerFeedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      giver: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      receiver: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Hide giver info for anonymous feedback
  const sanitized = feedback.map(f => ({
    ...f,
    giver: f.isAnonymous ? null : f.giver,
    giverId: f.isAnonymous ? null : f.giverId,
  }));

  res.json(sanitized);
}));

/**
 * POST /api/performance/feedback
 * Give peer feedback
 */
router.post('/feedback', authenticate, asyncHandler(async (req, res) => {
  const { receiverId, type, message, isAnonymous } = req.body;

  if (receiverId === req.user.id) {
    return res.status(400).json({ error: 'Cannot give feedback to yourself' });
  }

  const feedback = await global.prisma.peerFeedback.create({
    data: {
      giverId: req.user.id,
      receiverId,
      type: type || 'APPRECIATION',
      message,
      isAnonymous: isAnonymous || false,
    },
    include: {
      receiver: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Notify receiver
  const notification = await global.prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'REVIEW',
      title: 'New Peer Feedback',
      message: isAnonymous 
        ? 'You received anonymous peer feedback'
        : `${req.user.firstName} ${req.user.lastName} gave you feedback`,
      data: { feedbackId: feedback.id },
    },
  });
  sendNotification(receiverId, notification);

  res.status(201).json(feedback);
}));

module.exports = router;
