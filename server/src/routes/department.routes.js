/**
 * Department Routes
 * 
 * CRUD operations for department management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate, validationRules } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');

/**
 * GET /api/departments
 * Get all departments
 */
router.get('/', authenticate, authorize('departments:read'), asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [departments, total] = await Promise.all([
    global.prisma.department.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, projects: true },
        },
      },
    }),
    global.prisma.department.count({ where }),
  ]);

  res.json({
    data: departments,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/departments/list
 * Get simple list of departments (for dropdowns)
 */
router.get('/list', authenticate, asyncHandler(async (req, res) => {
  const departments = await global.prisma.department.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  res.json(departments);
}));

/**
 * GET /api/departments/:id
 * Get department by ID
 */
router.get('/:id', authenticate, authorize('departments:read'), asyncHandler(async (req, res) => {
  const department = await global.prisma.department.findUnique({
    where: { id: req.params.id },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          position: true,
          role: true,
        },
        orderBy: { lastName: 'asc' },
      },
      projects: {
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
        },
      },
      _count: {
        select: { users: true, projects: true },
      },
    },
  });

  if (!department) {
    return res.status(404).json({ error: 'Department not found' });
  }

  res.json(department);
}));

/**
 * POST /api/departments
 * Create a new department
 */
router.post('/', authenticate, authorize('departments:create'), validate(validationRules.department), asyncHandler(async (req, res) => {
  const { name, code, description, managerId, budget } = req.body;

  const department = await global.prisma.department.create({
    data: {
      name,
      code: code.toUpperCase(),
      description,
      managerId,
      budget,
    },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  res.status(201).json(department);
}));

/**
 * PUT /api/departments/:id
 * Update department
 */
router.put('/:id', authenticate, authorize('departments:update'), asyncHandler(async (req, res) => {
  const { name, code, description, managerId, budget } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (code) updateData.code = code.toUpperCase();
  if (description !== undefined) updateData.description = description;
  if (managerId !== undefined) updateData.managerId = managerId;
  if (budget !== undefined) updateData.budget = budget;

  const department = await global.prisma.department.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      _count: {
        select: { users: true, projects: true },
      },
    },
  });

  res.json(department);
}));

/**
 * DELETE /api/departments/:id
 * Delete department
 */
router.delete('/:id', authenticate, authorize('departments:delete'), asyncHandler(async (req, res) => {
  // Check if department has users
  const userCount = await global.prisma.user.count({
    where: { departmentId: req.params.id },
  });

  if (userCount > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete department with assigned users. Reassign users first.' 
    });
  }

  await global.prisma.department.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Department deleted successfully' });
}));

/**
 * GET /api/departments/:id/stats
 * Get department statistics
 */
router.get('/:id/stats', authenticate, authorize('departments:read'), asyncHandler(async (req, res) => {
  const departmentId = req.params.id;

  const [
    userCount,
    projectCount,
    activeProjectCount,
    taskCount,
    completedTaskCount,
  ] = await Promise.all([
    global.prisma.user.count({ where: { departmentId, status: 'ACTIVE' } }),
    global.prisma.project.count({ where: { departmentId } }),
    global.prisma.project.count({ where: { departmentId, status: 'IN_PROGRESS' } }),
    global.prisma.task.count({ 
      where: { project: { departmentId } } 
    }),
    global.prisma.task.count({ 
      where: { project: { departmentId }, status: 'COMPLETED' } 
    }),
  ]);

  res.json({
    userCount,
    projectCount,
    activeProjectCount,
    taskCount,
    completedTaskCount,
    taskCompletionRate: taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0,
  });
}));

module.exports = router;
