/**
 * User Routes
 * 
 * CRUD operations for user management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, authorizeOwnerOrPermission } = require('../middleware/authorize');
const { validate, validationRules, body, param } = require('../middleware/validate');
const { uploadAvatar } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta, sanitizeUser } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * GET /api/users
 * Get all users (with pagination and filters)
 */
router.get('/', authenticate, authorize('users:read'), asyncHandler(async (req, res) => {
  const { page, limit, search, role, departmentId, status } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  // Build where clause
  const where = {};
  
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (role) where.role = role;
  if (departmentId) where.departmentId = departmentId;
  if (status) where.status = status;

  // If user is a LEAD, limit to their department
  if (req.user.role === 'LEAD') {
    where.departmentId = req.user.departmentId;
  }

  const [users, total] = await Promise.all([
    global.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        role: true,
        status: true,
        position: true,
        department: {
          select: { id: true, name: true, code: true },
        },
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
        hireDate: true,
        createdAt: true,
      },
    }),
    global.prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/users/directory
 * Get employee directory (all active employees)
 */
router.get('/directory', authenticate, asyncHandler(async (req, res) => {
  const { departmentId, search } = req.query;

  const where = { status: 'ACTIVE' };
  
  if (departmentId) where.departmentId = departmentId;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { position: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await global.prisma.user.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      position: true,
      role: true,
      status: true,
      department: {
        select: { id: true, name: true },
      },
      manager: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.json(users);
}));

/**
 * PUT /api/users/me
 * Update current user's profile
 */
router.put('/me', authenticate, asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, bio, position, preferences } = req.body;

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (bio !== undefined) updateData.bio = bio;
  if (position !== undefined) updateData.position = position;
  if (preferences !== undefined) updateData.preferences = preferences;

  const user = await global.prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      bio: true,
      role: true,
      status: true,
      position: true,
      preferences: true,
      onboardingCompleted: true,
      department: {
        select: { id: true, name: true },
      },
      updatedAt: true,
    },
  });

  res.json(user);
}));

/**
 * POST /api/users/me/complete-onboarding
 * Mark current user's onboarding as complete
 */
router.post('/me/complete-onboarding', authenticate, asyncHandler(async (req, res) => {
  const user = await global.prisma.user.update({
    where: { id: req.user.id },
    data: { 
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      bio: true,
      role: true,
      status: true,
      position: true,
      preferences: true,
      onboardingCompleted: true,
      onboardingCompletedAt: true,
      department: {
        select: { id: true, name: true },
      },
    },
  });

  logger.info(`User ${req.user.email} completed onboarding`);
  res.json(user);
}));

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticate, validate(validationRules.uuidParam), asyncHandler(async (req, res) => {
  const user = await global.prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      role: true,
      status: true,
      position: true,
      hireDate: true,
      department: {
        select: { id: true, name: true, code: true },
      },
      manager: {
        select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
      },
      subordinates: {
        select: { id: true, firstName: true, lastName: true, avatar: true, position: true },
      },
      createdAt: true,
      lastLogin: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
}));

/**
 * POST /api/users
 * Create a new user (Admin/HR only)
 */
router.post('/', authenticate, authorize('users:create'), validate(validationRules.register), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, departmentId, phone, position, managerId, hireDate, salary } = req.body;
  const bcrypt = require('bcryptjs');

  // Check if email exists
  const existing = await global.prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await global.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'MEMBER',
      departmentId,
      phone,
      position,
      managerId,
      hireDate: hireDate ? new Date(hireDate) : null,
      salary,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      department: {
        select: { id: true, name: true },
      },
      createdAt: true,
    },
  });

  res.status(201).json(user);
}));

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', authenticate, authorizeOwnerOrPermission('users:update', 'id'), validate([
  param('id').isUUID(),
  ...validationRules.updateUser,
]), asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, position, departmentId, managerId, role, status, hireDate, salary, avatar } = req.body;
  const { createAuditLog, AUDIT_ACTIONS } = require('../utils/auditLogger');

  // Fetch current user data for comparison
  const existingUser = await global.prisma.user.findUnique({
    where: { id: req.params.id },
    select: { role: true, status: true }
  });

  if (!existingUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Build update data
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (position !== undefined) updateData.position = position;
  if (avatar !== undefined) updateData.avatar = avatar;

  // Role change restrictions
  if (role && role !== existingUser.role) {
    // Only OWNER can promote someone to ADMIN
    if (role === 'ADMIN' && req.user.role !== 'OWNER') {
      return res.status(403).json({ 
        error: 'Access denied. Only the Owner can promote users to Admin.' 
      });
    }
    // Only OWNER can set another OWNER (shouldn't happen, but safe)
    if (role === 'OWNER' && req.user.role !== 'OWNER') {
      return res.status(403).json({ 
        error: 'Access denied. Only the Owner can transfer ownership.' 
      });
    }
    // Prevent self-demotion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ 
        error: 'You cannot change your own role. Contact another admin.' 
      });
    }
  }

  // Only OWNER and ADMIN can update these fields
  if (['OWNER', 'ADMIN'].includes(req.user.role)) {
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (hireDate) updateData.hireDate = new Date(hireDate);
    if (salary !== undefined) updateData.salary = salary;
  }

  const user = await global.prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      role: true,
      status: true,
      position: true,
      department: {
        select: { id: true, name: true },
      },
      updatedAt: true,
    },
  });

  // Audit log role changes (high-risk action)
  if (role && role !== existingUser.role) {
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AUDIT_ACTIONS.ROLE_CHANGE,
      entityType: 'User',
      entityId: req.params.id,
      oldValues: { role: existingUser.role },
      newValues: { role: role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  res.json(user);
}));

/**
 * POST /api/users/:id/avatar
 * Upload user avatar
 */
router.post('/:id/avatar', authenticate, authorizeOwnerOrPermission('users:update', 'id'), uploadAvatar, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  const user = await global.prisma.user.update({
    where: { id: req.params.id },
    data: { avatar: avatarUrl },
    select: {
      id: true,
      avatar: true,
    },
  });

  res.json(user);
}));

/**
 * DELETE /api/users/:id
 * Delete user (soft delete - set status to INACTIVE)
 */
router.delete('/:id', authenticate, authorize('users:delete'), validate(validationRules.uuidParam), asyncHandler(async (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  await global.prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'INACTIVE' },
  });

  res.json({ message: 'User deactivated successfully' });
}));

/**
 * GET /api/users/:id/subordinates
 * Get user's subordinates
 */
router.get('/:id/subordinates', authenticate, asyncHandler(async (req, res) => {
  const subordinates = await global.prisma.user.findMany({
    where: { managerId: req.params.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      position: true,
      role: true,
      status: true,
    },
  });

  res.json(subordinates);
}));

/**
 * POST /api/users/invite
 * Invite a new employee (OWNER/ADMIN only)
 * Creates user with auto-generated bio
 */
router.post('/invite', authenticate, authorize('users:create'), asyncHandler(async (req, res) => {
  const { email, firstName, lastName, role, departmentId, position, managerId, hireDate } = req.body;
  const bcrypt = require('bcryptjs');
  const crypto = require('crypto');

  // Validate required fields
  if (!email || !firstName || !lastName) {
    return res.status(400).json({ error: 'Email, first name, and last name are required' });
  }

  // Check if email exists
  const existing = await global.prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  // Generate temporary password (user will reset on first login)
  const tempPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  // Get department and manager for auto-bio
  let department = null;
  let manager = null;
  
  if (departmentId) {
    department = await global.prisma.department.findUnique({ where: { id: departmentId } });
  }
  if (managerId) {
    manager = await global.prisma.user.findUnique({ 
      where: { id: managerId },
      select: { firstName: true, lastName: true }
    });
  }

  // Auto-generate bio
  let bio = `${firstName} ${lastName}`;
  if (position) bio += ` is a ${position}`;
  if (department) bio += ` in the ${department.name} department`;
  if (manager) bio += `, reporting to ${manager.firstName} ${manager.lastName}`;
  bio += '.';

  const user = await global.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'MEMBER',
      departmentId,
      position,
      managerId,
      hireDate: hireDate ? new Date(hireDate) : new Date(),
      bio,
      status: 'PENDING', // User needs to accept invite
      onboardingCompleted: false,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      bio: true,
      department: {
        select: { id: true, name: true },
      },
      manager: {
        select: { id: true, firstName: true, lastName: true },
      },
      createdAt: true,
    },
  });

  // TODO: Send invite email with temporary password or magic link

  logger.info(`User ${req.user.email} invited ${email} as ${role || 'MEMBER'}`);
  res.status(201).json({ 
    message: 'Invite sent successfully',
    user 
  });
}));

module.exports = router;
