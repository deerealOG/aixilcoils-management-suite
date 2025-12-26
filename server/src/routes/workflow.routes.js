/**
 * Workflow Routes
 * 
 * Workflow automation and approval management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');
const { sendNotification } = require('../websocket/socketServer');

/**
 * GET /api/workflows
 * Get all workflows
 */
router.get('/', authenticate, authorize('workflows:read'), asyncHandler(async (req, res) => {
  const { page, limit, type, isActive } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [workflows, total] = await Promise.all([
    global.prisma.workflow.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    global.prisma.workflow.count({ where }),
  ]);

  res.json({
    data: workflows,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/workflows/:id
 * Get workflow details
 */
router.get('/:id', authenticate, authorize('workflows:read'), asyncHandler(async (req, res) => {
  const workflow = await global.prisma.workflow.findUnique({
    where: { id: req.params.id },
    include: {
      approvals: {
        orderBy: { step: 'asc' },
        include: {
          approver: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  res.json(workflow);
}));

/**
 * POST /api/workflows
 * Create a new workflow
 */
router.post('/', authenticate, authorize('workflows:create'), asyncHandler(async (req, res) => {
  const { name, description, type, steps, isActive } = req.body;

  const workflow = await global.prisma.workflow.create({
    data: {
      name,
      description,
      type,
      steps: steps || [],
      isActive: isActive !== false,
    },
  });

  res.status(201).json(workflow);
}));

/**
 * PUT /api/workflows/:id
 * Update workflow
 */
router.put('/:id', authenticate, authorize('workflows:update'), asyncHandler(async (req, res) => {
  const { name, description, type, steps, isActive } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (type) updateData.type = type;
  if (steps) updateData.steps = steps;
  if (isActive !== undefined) updateData.isActive = isActive;

  const workflow = await global.prisma.workflow.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json(workflow);
}));

/**
 * DELETE /api/workflows/:id
 * Delete workflow
 */
router.delete('/:id', authenticate, authorize('workflows:delete'), asyncHandler(async (req, res) => {
  await global.prisma.workflow.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Workflow deleted successfully' });
}));

/**
 * GET /api/workflows/approvals/pending
 * Get pending approvals for current user
 */
router.get('/approvals/pending', authenticate, asyncHandler(async (req, res) => {
  const approvals = await global.prisma.workflowApproval.findMany({
    where: {
      approverId: req.user.id,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'asc' },
    include: {
      workflow: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  res.json(approvals);
}));

/**
 * GET /api/workflows/approvals/:entityType/:entityId
 * Get approvals for a specific entity
 */
router.get('/approvals/:entityType/:entityId', authenticate, asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;

  const approvals = await global.prisma.workflowApproval.findMany({
    where: { entityType, entityId },
    orderBy: { step: 'asc' },
    include: {
      workflow: {
        select: { id: true, name: true },
      },
      approver: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.json(approvals);
}));

/**
 * POST /api/workflows/:workflowId/start
 * Start a workflow for an entity
 */
router.post('/:workflowId/start', authenticate, asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.body;
  const { workflowId } = req.params;

  const workflow = await global.prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow || !workflow.isActive) {
    return res.status(404).json({ error: 'Workflow not found or inactive' });
  }

  const steps = workflow.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'Workflow has no steps defined' });
  }

  // Create approval records for each step
  const approvals = await global.prisma.workflowApproval.createMany({
    data: steps.map((step, index) => ({
      workflowId,
      entityType,
      entityId,
      approverId: step.approverId,
      step: index + 1,
      status: index === 0 ? 'PENDING' : 'PENDING',
    })),
  });

  // Get created approvals
  const createdApprovals = await global.prisma.workflowApproval.findMany({
    where: { workflowId, entityType, entityId },
    orderBy: { step: 'asc' },
    include: {
      approver: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Notify first approver
  if (steps[0]?.approverId) {
    const notification = await global.prisma.notification.create({
      data: {
        userId: steps[0].approverId,
        type: 'APPROVAL',
        title: 'Approval Required',
        message: `You have a new ${entityType} approval request`,
        data: { workflowId, entityType, entityId },
      },
    });
    sendNotification(steps[0].approverId, notification);
  }

  res.status(201).json(createdApprovals);
}));

/**
 * POST /api/workflows/approvals/:id/approve
 * Approve an approval step
 */
router.post('/approvals/:id/approve', authenticate, authorize('workflows:approve'), asyncHandler(async (req, res) => {
  const { comments } = req.body;

  const approval = await global.prisma.workflowApproval.findUnique({
    where: { id: req.params.id },
    include: {
      workflow: true,
    },
  });

  if (!approval) {
    return res.status(404).json({ error: 'Approval not found' });
  }

  if (approval.approverId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized to approve' });
  }

  if (approval.status !== 'PENDING') {
    return res.status(400).json({ error: 'Approval is not pending' });
  }

  // Update approval
  const updated = await global.prisma.workflowApproval.update({
    where: { id: req.params.id },
    data: {
      status: 'APPROVED',
      comments,
      decidedAt: new Date(),
    },
  });

  // Check if there's a next step
  const nextApproval = await global.prisma.workflowApproval.findFirst({
    where: {
      workflowId: approval.workflowId,
      entityType: approval.entityType,
      entityId: approval.entityId,
      step: approval.step + 1,
    },
  });

  if (nextApproval) {
    // Notify next approver
    const notification = await global.prisma.notification.create({
      data: {
        userId: nextApproval.approverId,
        type: 'APPROVAL',
        title: 'Approval Required',
        message: `You have a new ${approval.entityType} approval request`,
        data: { 
          workflowId: approval.workflowId, 
          entityType: approval.entityType, 
          entityId: approval.entityId,
        },
      },
    });
    sendNotification(nextApproval.approverId, notification);
  }

  res.json(updated);
}));

/**
 * POST /api/workflows/approvals/:id/reject
 * Reject an approval step
 */
router.post('/approvals/:id/reject', authenticate, authorize('workflows:approve'), asyncHandler(async (req, res) => {
  const { comments } = req.body;

  const approval = await global.prisma.workflowApproval.findUnique({
    where: { id: req.params.id },
  });

  if (!approval) {
    return res.status(404).json({ error: 'Approval not found' });
  }

  if (approval.approverId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized to reject' });
  }

  if (approval.status !== 'PENDING') {
    return res.status(400).json({ error: 'Approval is not pending' });
  }

  // Update this and all subsequent approvals
  await global.prisma.workflowApproval.updateMany({
    where: {
      workflowId: approval.workflowId,
      entityType: approval.entityType,
      entityId: approval.entityId,
      step: { gte: approval.step },
    },
    data: {
      status: 'REJECTED',
      decidedAt: new Date(),
    },
  });

  const updated = await global.prisma.workflowApproval.update({
    where: { id: req.params.id },
    data: { comments },
  });

  res.json(updated);
}));

module.exports = router;
