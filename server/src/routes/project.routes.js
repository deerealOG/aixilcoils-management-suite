/**
 * Project Routes
 * 
 * Project management operations
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate, validationRules } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/', authenticate, authorize('projects:read'), asyncHandler(async (req, res) => {
  const { page, limit, status, departmentId, search } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // If user is employee/manager, show only their projects
  if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    where.members = { some: { userId: req.user.id } };
  }

  const [projects, total] = await Promise.all([
    global.prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      include: {
        department: {
          select: { id: true, name: true },
        },
        members: {
          take: 5,
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    }),
    global.prisma.project.count({ where }),
  ]);

  res.json({
    data: projects,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/projects/:id
 * Get project details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const project = await global.prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      department: {
        select: { id: true, name: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
              position: true,
            },
          },
        },
      },
      tasks: {
        orderBy: { order: 'asc' },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          _count: {
            select: { subTasks: true, comments: true },
          },
        },
      },
      _count: {
        select: { tasks: true, members: true },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Security: Check if user has access to this project
  const isMember = project.members.some(m => m.userId === req.user.id);
  const isAdmin = ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

  if (!isAdmin && !isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
  }

  // Calculate task stats
  const taskStats = {
    total: project.tasks.length,
    todo: project.tasks.filter(t => t.status === 'TODO').length,
    inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
    inReview: project.tasks.filter(t => t.status === 'IN_REVIEW').length,
    completed: project.tasks.filter(t => t.status === 'COMPLETED').length,
  };

  res.json({ ...project, taskStats });
}));

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', authenticate, authorize('projects:create'), validate(validationRules.project), asyncHandler(async (req, res) => {
  const { name, description, status, priority, departmentId, startDate, endDate, budget, memberIds } = req.body;

  const project = await global.prisma.project.create({
    data: {
      name,
      description,
      status: status || 'PLANNING',
      priority: priority || 'MEDIUM',
      departmentId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      budget,
      members: {
        create: [
          { userId: req.user.id, role: 'OWNER' },
          ...(memberIds || []).map(id => ({ userId: id, role: 'MEMBER' })),
        ],
      },
    },
    include: {
      department: {
        select: { id: true, name: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
    },
  });

  res.status(201).json(project);
}));

/**
 * PATCH /api/projects/:id
 * Update project
 */
router.patch('/:id', authenticate, authorize('projects:update'), asyncHandler(async (req, res) => {
  const { name, description, status, priority, departmentId, startDate, endDate, budget, progress } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;
  if (departmentId) updateData.departmentId = departmentId;
  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate) updateData.endDate = new Date(endDate);
  if (budget !== undefined) updateData.budget = budget;
  if (progress !== undefined) updateData.progress = progress;

  const project = await global.prisma.project.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      department: {
        select: { id: true, name: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  res.json(project);
}));

/**
 * POST /api/projects/:id/members
 * Add members to project
 */
router.post('/:id/members', authenticate, authorize('projects:update'), asyncHandler(async (req, res) => {
  const { userIds, role = 'MEMBER' } = req.body;

  await global.prisma.projectMember.createMany({
    data: userIds.map(userId => ({
      projectId: req.params.id,
      userId,
      role,
    })),
    skipDuplicates: true,
  });

  const project = await global.prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
    },
  });

  res.json(project);
}));

/**
 * DELETE /api/projects/:id/members/:userId
 * Remove member from project
 */
router.delete('/:id/members/:userId', authenticate, authorize('projects:update'), asyncHandler(async (req, res) => {
  await global.prisma.projectMember.deleteMany({
    where: {
      projectId: req.params.id,
      userId: req.params.userId,
    },
  });

  res.json({ message: 'Member removed from project' });
}));

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', authenticate, authorize('projects:delete'), asyncHandler(async (req, res) => {
  await global.prisma.project.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Project deleted successfully' });
}));

/**
 * GET /api/projects/:id/stats
 * Get project statistics
 */
router.get('/:id/stats', authenticate, asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const [taskStats, memberCount, recentActivity] = await Promise.all([
    global.prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { status: true },
    }),
    global.prisma.projectMember.count({ where: { projectId } }),
    global.prisma.task.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        assignee: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
  ]);

  const stats = {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  taskStats.forEach(s => {
    stats[s.status] = s._count.status;
  });

  const totalTasks = Object.values(stats).reduce((a, b) => a + b, 0);
  const completionRate = totalTasks > 0 ? Math.round((stats.COMPLETED / totalTasks) * 100) : 0;

  res.json({
    taskStats: stats,
    totalTasks,
    completionRate,
    memberCount,
    recentActivity,
  });
}));

module.exports = router;
