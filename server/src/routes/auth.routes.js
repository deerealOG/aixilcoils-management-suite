/**
 * Authentication Routes
 * 
 * Handles user authentication, registration, and token management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { validate, validationRules } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { createAuditLog } = require('../middleware/audit');
const { sendTemplatedEmail } = require('../utils/email');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validate(validationRules.register), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, departmentId, phone, position } = req.body;

  // Check if user exists
  const existingUser = await global.prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await global.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'EMPLOYEE',
      departmentId,
      phone,
      position,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      departmentId: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokens = generateTokenPair(user);

  // Save refresh token
  await global.prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  // Send welcome email
  try {
    await sendTemplatedEmail('welcome', user, user.email);
  } catch (error) {
    logger.warn('Failed to send welcome email:', error);
  }

  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: 'USER_REGISTER',
    entityType: 'User',
    entityId: user.id,
  });

  res.status(201).json({
    message: 'Registration successful',
    user,
    ...tokens,
  });
}));

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', validate(validationRules.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await global.prisma.user.findUnique({
    where: { email },
    include: {
      department: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check password
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check account status
  if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
    return res.status(403).json({ error: 'Account is not active' });
  }

  // Generate tokens
  const tokens = generateTokenPair(user);

  // Update user with refresh token and last login
  await global.prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date(),
      status: 'ACTIVE', // Activate PENDING users on first login
    },
  });

  // Auto clock-in for attendance tracking
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    // Check if already clocked in today
    const existingAttendance = await global.prisma.attendance.findFirst({
      where: {
        employeeId: user.id,
        date: today,
      },
    });

    // Create attendance record if not exists
    if (!existingAttendance) {
      await global.prisma.attendance.create({
        data: {
          employeeId: user.id,
          date: today,
          clockIn: new Date(),
          status: 'PRESENT',
        },
      });
      logger.info(`Auto clock-in for ${user.email}`);
    }
  } catch (error) {
    logger.warn('Failed to create attendance record:', error);
  }

  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Remove sensitive data
  const { password: _, mfaSecret, refreshToken, ...userData } = user;

  res.json({
    message: 'Login successful',
    user: userData,
    ...tokens,
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Find user and verify stored token
  const user = await global.prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Account is not active' });
  }

  // Generate new tokens
  const tokens = generateTokenPair(user);

  // Update refresh token
  await global.prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  res.json(tokens);
}));

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // Clear refresh token
  await global.prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  // Create audit log
  await createAuditLog({
    userId: req.user.id,
    action: 'USER_LOGOUT',
    entityType: 'User',
    entityId: req.user.id,
  });

  res.json({ message: 'Logout successful' });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await global.prisma.user.findUnique({
    where: { id: req.user.id },
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
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      lastLogin: true,
      createdAt: true,
    },
  });

  res.json(user);
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await global.prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If the email exists, a reset link has been sent' });
  }

  // Generate reset token (in production, store this securely)
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  // In a real app, you'd store this token with expiry in database
  // For now, we'll just send it via email

  try {
    await sendTemplatedEmail('passwordReset', { ...user, resetToken }, user.email);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
  }

  res.json({ message: 'If the email exists, a reset link has been sent' });
}));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password required' });
  }

  // In a real app, verify the token from database
  // For now, this is a placeholder

  res.json({ message: 'Password reset functionality - implement token verification' });
}));

/**
 * PUT /api/auth/change-password
 * Change password (authenticated)
 */
router.put('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const user = await global.prisma.user.findUnique({
    where: { id: req.user.id },
  });

  const isValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await global.prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  await createAuditLog({
    userId: req.user.id,
    action: 'PASSWORD_CHANGE',
    entityType: 'User',
    entityId: req.user.id,
  });

  res.json({ message: 'Password changed successfully' });
}));

module.exports = router;
