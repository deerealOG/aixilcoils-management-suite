/**
 * Leave Request Routes
 * 
 * Employee leave/absence management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate, validationRules } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta, dateDiffInDays } = require('../utils/helpers');
const { sendNotification } = require('../websocket/socketServer');
const { sendTemplatedEmail } = require('../utils/email');

/**
 * GET /api/leave
 * Get leave requests
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, employeeId, status, type, startDate, endDate } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  if (type) where.type = type;
  if (startDate) where.startDate = { gte: new Date(startDate) };
  if (endDate) where.endDate = { lte: new Date(endDate) };

  // Employees see only their own requests
  if (req.user.role === 'EMPLOYEE') {
    where.employeeId = req.user.id;
  }
  // Managers see their subordinates' requests
  else if (req.user.role === 'MANAGER') {
    const subordinates = await global.prisma.user.findMany({
      where: { managerId: req.user.id },
      select: { id: true },
    });
    where.employeeId = { in: [req.user.id, ...subordinates.map(s => s.id)] };
  }

  const [requests, total] = await Promise.all([
    global.prisma.leaveRequest.findMany({
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
        approver: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    global.prisma.leaveRequest.count({ where }),
  ]);

  res.json({
    data: requests,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/leave/pending
 * Get pending leave requests for approval
 */
router.get('/pending', authenticate, authorize('leave:approve'), asyncHandler(async (req, res) => {
  let where = { status: 'PENDING' };

  // Managers can only approve their subordinates' requests
  if (req.user.role === 'MANAGER') {
    const subordinates = await global.prisma.user.findMany({
      where: { managerId: req.user.id },
      select: { id: true },
    });
    where.employeeId = { in: subordinates.map(s => s.id) };
  }

  const requests = await global.prisma.leaveRequest.findMany({
    where,
    orderBy: { createdAt: 'asc' },
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
    },
  });

  res.json(requests);
}));

/**
 * GET /api/leave/balance/:userId
 * Get leave balance for user
 */
router.get('/balance/:userId', authenticate, asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const year = new Date().getFullYear();

  // Check permissions
  if (req.user.role === 'EMPLOYEE' && userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get approved leave days by type for current year
  const approvedLeaves = await global.prisma.leaveRequest.groupBy({
    by: ['type'],
    where: {
      employeeId: userId,
      status: 'APPROVED',
      startDate: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    _sum: {
      days: true,
    },
  });

  // Default leave allocations (can be configured per company)
  const allocations = {
    ANNUAL: 21,
    SICK: 10,
    PERSONAL: 5,
    MATERNITY: 90,
    PATERNITY: 14,
  };

  const balance = {};
  for (const type of Object.keys(allocations)) {
    const used = approvedLeaves.find(l => l.type === type)?._sum.days || 0;
    balance[type] = {
      allocated: allocations[type],
      used: Number(used),
      remaining: allocations[type] - Number(used),
    };
  }

  res.json({ year, balance });
}));

/**
 * GET /api/leave/:id
 * Get leave request details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const request = await global.prisma.leaveRequest.findUnique({
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
      approver: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!request) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  // Check access
  if (req.user.role === 'EMPLOYEE' && request.employeeId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(request);
}));

/**
 * POST /api/leave
 * Create a new leave request
 */
router.post('/', authenticate, authorize('leave:create'), validate(validationRules.leaveRequest), asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;

  // Calculate days
  const days = dateDiffInDays(startDate, endDate) + 1;

  // Check for overlapping requests
  const overlapping = await global.prisma.leaveRequest.findFirst({
    where: {
      employeeId: req.user.id,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        {
          startDate: { lte: new Date(endDate) },
          endDate: { gte: new Date(startDate) },
        },
      ],
    },
  });

  if (overlapping) {
    return res.status(400).json({ error: 'Leave request overlaps with existing request' });
  }

  const request = await global.prisma.leaveRequest.create({
    data: {
      employeeId: req.user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days,
      reason,
      status: 'PENDING',
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  // Notify manager
  if (request.employee.manager) {
    const notification = await global.prisma.notification.create({
      data: {
        userId: request.employee.manager.id,
        type: 'LEAVE',
        title: 'New Leave Request',
        message: `${request.employee.firstName} ${request.employee.lastName} requested ${type.toLowerCase()} leave`,
        data: { leaveId: request.id },
      },
    });
    sendNotification(request.employee.manager.id, notification);
    sendTemplatedEmail('leaveRequest', {
      employee: request.employee,
      leave: request,
      approver: request.employee.manager,
    }, request.employee.manager.email);
  }

  res.status(201).json(request);
}));

/**
 * PUT /api/leave/:id
 * Update leave request (only if pending)
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;

  const request = await global.prisma.leaveRequest.findUnique({
    where: { id: req.params.id },
  });

  if (!request) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  // Only owner can update and only if pending
  if (request.employeeId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: 'Cannot update non-pending request' });
  }

  const updateData = {};
  if (type) updateData.type = type;
  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate) updateData.endDate = new Date(endDate);
  if (reason !== undefined) updateData.reason = reason;

  if (startDate && endDate) {
    updateData.days = dateDiffInDays(startDate, endDate) + 1;
  }

  const updated = await global.prisma.leaveRequest.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json(updated);
}));

/**
 * POST /api/leave/:id/approve
 * Approve leave request
 */
router.post('/:id/approve', authenticate, authorize('leave:approve'), asyncHandler(async (req, res) => {
  const { comments } = req.body;

  const request = await global.prisma.leaveRequest.findUnique({
    where: { id: req.params.id },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!request) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: 'Request is not pending' });
  }

  const updated = await global.prisma.leaveRequest.update({
    where: { id: req.params.id },
    data: {
      status: 'APPROVED',
      approverId: req.user.id,
      approvedAt: new Date(),
      comments,
    },
  });

  // Notify employee
  const notification = await global.prisma.notification.create({
    data: {
      userId: request.employeeId,
      type: 'LEAVE',
      title: 'Leave Request Approved',
      message: `Your ${request.type.toLowerCase()} leave request has been approved`,
      data: { leaveId: request.id },
    },
  });
  sendNotification(request.employeeId, notification);

  res.json(updated);
}));

/**
 * POST /api/leave/:id/reject
 * Reject leave request
 */
router.post('/:id/reject', authenticate, authorize('leave:approve'), asyncHandler(async (req, res) => {
  const { comments } = req.body;

  const request = await global.prisma.leaveRequest.findUnique({
    where: { id: req.params.id },
  });

  if (!request) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: 'Request is not pending' });
  }

  const updated = await global.prisma.leaveRequest.update({
    where: { id: req.params.id },
    data: {
      status: 'REJECTED',
      approverId: req.user.id,
      approvedAt: new Date(),
      comments,
    },
  });

  // Notify employee
  const notification = await global.prisma.notification.create({
    data: {
      userId: request.employeeId,
      type: 'LEAVE',
      title: 'Leave Request Rejected',
      message: `Your ${request.type.toLowerCase()} leave request has been rejected${comments ? ': ' + comments : ''}`,
      data: { leaveId: request.id },
    },
  });
  sendNotification(request.employeeId, notification);

  res.json(updated);
}));

/**
 * POST /api/leave/:id/cancel
 * Cancel leave request
 */
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const request = await global.prisma.leaveRequest.findUnique({
    where: { id: req.params.id },
  });

  if (!request) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  if (request.employeeId !== req.user.id && !['SUPER_ADMIN', 'ADMIN', 'HR_OFFICER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!['PENDING', 'APPROVED'].includes(request.status)) {
    return res.status(400).json({ error: 'Cannot cancel this request' });
  }

  const updated = await global.prisma.leaveRequest.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  res.json(updated);
}));

/**
 * DELETE /api/leave/:id
 * Delete leave request
 */
router.delete('/:id', authenticate, authorize('leave:delete'), asyncHandler(async (req, res) => {
  await global.prisma.leaveRequest.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Leave request deleted successfully' });
}));

/**
 * POST /api/leave/bulk-approve
 * Bulk approve multiple leave requests
 */
router.post('/bulk-approve', authenticate, authorize('leave:approve'), asyncHandler(async (req, res) => {
  const { ids, comments } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  // Get pending requests
  const requests = await global.prisma.leaveRequest.findMany({
    where: {
      id: { in: ids },
      status: 'PENDING',
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (requests.length === 0) {
    return res.status(400).json({ error: 'No pending requests found' });
  }

  // Update all to approved
  const result = await global.prisma.leaveRequest.updateMany({
    where: { id: { in: requests.map(r => r.id) } },
    data: {
      status: 'APPROVED',
      approverId: req.user.id,
      approvedAt: new Date(),
      comments,
    },
  });

  // Create notifications for each employee
  for (const request of requests) {
    const notification = await global.prisma.notification.create({
      data: {
        userId: request.employeeId,
        type: 'LEAVE',
        title: 'Leave Request Approved',
        message: `Your ${request.type.toLowerCase()} leave request has been approved`,
        data: { leaveId: request.id },
      },
    });
    sendNotification(request.employeeId, notification);
  }

  res.json({
    message: `Approved ${result.count} leave requests`,
    count: result.count,
  });
}));

/**
 * POST /api/leave/bulk-reject
 * Bulk reject multiple leave requests
 */
router.post('/bulk-reject', authenticate, authorize('leave:approve'), asyncHandler(async (req, res) => {
  const { ids, comments } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  // Get pending requests
  const requests = await global.prisma.leaveRequest.findMany({
    where: {
      id: { in: ids },
      status: 'PENDING',
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (requests.length === 0) {
    return res.status(400).json({ error: 'No pending requests found' });
  }

  // Update all to rejected
  const result = await global.prisma.leaveRequest.updateMany({
    where: { id: { in: requests.map(r => r.id) } },
    data: {
      status: 'REJECTED',
      approverId: req.user.id,
      approvedAt: new Date(),
      comments,
    },
  });

  // Create notifications for each employee
  for (const request of requests) {
    const notification = await global.prisma.notification.create({
      data: {
        userId: request.employeeId,
        type: 'LEAVE',
        title: 'Leave Request Rejected',
        message: `Your ${request.type.toLowerCase()} leave request has been rejected${comments ? ': ' + comments : ''}`,
        data: { leaveId: request.id },
      },
    });
    sendNotification(request.employeeId, notification);
  }

  res.json({
    message: `Rejected ${result.count} leave requests`,
    count: result.count,
  });
}));

module.exports = router;
