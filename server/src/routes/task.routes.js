/**
 * Task Routes
 * 
 * Task management operations with Kanban support
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate, validationRules } = require('../middleware/validate');
const { uploadMultiple } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');
const { sendNotification } = require('../websocket/socketServer');
const { sendTemplatedEmail } = require('../utils/email');

/**
 * GET /api/tasks
 * Get all tasks (with filters)
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, status, priority, projectId, assigneeId, search } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (projectId) where.projectId = projectId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    global.prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { subTasks: true, comments: true, attachments: true },
        },
      },
    }),
    global.prisma.task.count({ where }),
  ]);

  res.json({
    data: tasks,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/tasks/my-tasks
 * Get current user's tasks
 */
router.get('/my-tasks', authenticate, asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  
  const where = {
    assigneeId: req.user.id,
    status: { not: 'CANCELLED' },
  };
  
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tasks = await global.prisma.task.findMany({
    where,
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' },
    ],
    include: {
      project: {
        select: { id: true, name: true },
      },
      _count: {
        select: { subTasks: true, comments: true },
      },
    },
  });

  res.json(tasks);
}));

/**
 * GET /api/tasks/kanban/:projectId
 * Get tasks grouped by status for Kanban board
 */
router.get('/kanban/:projectId', authenticate, asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const tasks = await global.prisma.task.findMany({
    where: { projectId, parentId: null },
    orderBy: { order: 'asc' },
    include: {
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      _count: {
        select: { subTasks: true, comments: true, attachments: true },
      },
    },
  });

  // Group by status
  const columns = {
    TODO: tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW'),
    COMPLETED: tasks.filter(t => t.status === 'COMPLETED'),
  };

  res.json(columns);
}));

/**
 * GET /api/tasks/:id
 * Get task details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const task = await global.prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      project: {
        select: { id: true, name: true },
      },
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
      },
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
      parent: {
        select: { id: true, title: true },
      },
      subTasks: {
        orderBy: { order: 'asc' },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
      attachments: true,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
}));

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', authenticate, authorize('tasks:create'), validate(validationRules.task), asyncHandler(async (req, res) => {
  const { title, description, status, priority, projectId, assigneeId, parentId, dueDate, estimatedHours } = req.body;

  // Get max order for the status
  const maxOrder = await global.prisma.task.aggregate({
    where: { projectId, status: status || 'TODO' },
    _max: { order: true },
  });

  const task = await global.prisma.task.create({
    data: {
      title,
      description,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      projectId,
      assigneeId,
      creatorId: req.user.id,
      parentId,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours,
      order: (maxOrder._max.order || 0) + 1,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
      },
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Send notification to assignee
  if (assigneeId && assigneeId !== req.user.id) {
    const notification = await global.prisma.notification.create({
      data: {
        userId: assigneeId,
        type: 'TASK',
        title: 'New Task Assigned',
        message: `You have been assigned to: ${title}`,
        data: { taskId: task.id, projectId },
      },
    });

    sendNotification(assigneeId, notification);

    // Send email
    const assignee = await global.prisma.user.findUnique({
      where: { id: assigneeId },
    });
    if (assignee) {
      sendTemplatedEmail('taskAssigned', { assignee, task, assigner: req.user }, assignee.email);
    }
  }

  res.status(201).json(task);
}));

/**
 * PUT /api/tasks/:id
 * Update task
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { title, description, status, priority, assigneeId, dueDate, estimatedHours, actualHours } = req.body;

  const existingTask = await global.prisma.task.findUnique({
    where: { id: req.params.id },
  });

  if (!existingTask) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // MEMBER restriction: can only update own assigned tasks
  if (req.user.role === 'MEMBER' || req.user.role === 'GUEST') {
    if (existingTask.assigneeId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied. You can only update tasks assigned to you.' 
      });
    }
    // Members cannot reassign tasks
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
      return res.status(403).json({ 
        error: 'Access denied. You cannot reassign tasks.' 
      });
    }
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
  if (actualHours !== undefined) updateData.actualHours = actualHours;

  const task = await global.prisma.task.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      project: {
        select: { id: true, name: true },
      },
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });

  // Notify new assignee if changed
  if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== req.user.id) {
    const notification = await global.prisma.notification.create({
      data: {
        userId: assigneeId,
        type: 'TASK',
        title: 'Task Assigned to You',
        message: `You have been assigned to: ${task.title}`,
        data: { taskId: task.id },
      },
    });
    sendNotification(assigneeId, notification);
  }

  res.json(task);
}));

/**
 * PUT /api/tasks/:id/status
 * Update task status (for Kanban drag & drop)
 */
router.put('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const { status, order } = req.body;

  const task = await global.prisma.task.update({
    where: { id: req.params.id },
    data: { status, order },
    include: {
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });

  res.json(task);
}));

/**
 * PUT /api/tasks/reorder
 * Reorder tasks (bulk update for Kanban)
 */
router.put('/reorder', authenticate, asyncHandler(async (req, res) => {
  const { tasks } = req.body; // Array of { id, status, order }

  await global.prisma.$transaction(
    tasks.map(t => 
      global.prisma.task.update({
        where: { id: t.id },
        data: { status: t.status, order: t.order },
      })
    )
  );

  res.json({ message: 'Tasks reordered successfully' });
}));

/**
 * POST /api/tasks/:id/comments
 * Add comment to task
 */
router.post('/:id/comments', authenticate, asyncHandler(async (req, res) => {
  const { content } = req.body;

  const comment = await global.prisma.comment.create({
    data: {
      content,
      taskId: req.params.id,
      authorId: req.user.id,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });

  res.status(201).json(comment);
}));

/**
 * POST /api/tasks/:id/attachments
 * Upload attachments to task
 */
router.post('/:id/attachments', authenticate, uploadMultiple, asyncHandler(async (req, res) => {
  const attachments = await Promise.all(
    req.files.map(file =>
      global.prisma.attachment.create({
        data: {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: `/uploads/${file.filename}`,
          taskId: req.params.id,
        },
      })
    )
  );

  res.status(201).json(attachments);
}));

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id', authenticate, authorize('tasks:delete'), asyncHandler(async (req, res) => {
  await global.prisma.task.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Task deleted successfully' });
}));

module.exports = router;
