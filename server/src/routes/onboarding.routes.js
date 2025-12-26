/**
 * Onboarding Routes
 * 
 * API endpoints for employee onboarding management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, body } = require('../middleware/validate');
const onboardingService = require('../services/onboardingService');
const logger = require('../utils/logger');

/**
 * POST /api/onboarding/invite
 * Invite a new employee (HR/Admin only)
 */
router.post('/invite', 
  authenticate, 
  authorize('users:create'),
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName, role, departmentId, managerId, position, hireDate } = req.body;

    // Check if email already exists
    const existing = await global.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An employee with this email already exists' });
    }

    const result = await onboardingService.inviteEmployee(
      { email, firstName, lastName, role, departmentId, managerId, position, hireDate },
      req.user.id
    );

    logger.info(`Employee ${email} invited by ${req.user.email}`);

    res.status(201).json({
      message: 'Employee invited successfully. Welcome email has been sent.',
      employee: {
        id: result.employee.id,
        email: result.employee.email,
        firstName: result.employee.firstName,
        lastName: result.employee.lastName,
        role: result.employee.role,
        department: result.employee.department,
      },
      // Only include temporary password if explicitly requested (for manual delivery)
      ...(req.query.showPassword === 'true' && { temporaryPassword: result.temporaryPassword }),
    });
  })
);

/**
 * POST /api/onboarding/invite/bulk
 * Bulk invite multiple employees
 */
router.post('/invite/bulk',
  authenticate,
  authorize('users:create'),
  validate([
    body('employees').isArray({ min: 1 }).withMessage('At least one employee is required'),
    body('employees.*.email').isEmail().withMessage('Valid email is required for each employee'),
    body('employees.*.firstName').notEmpty().withMessage('First name is required for each employee'),
    body('employees.*.lastName').notEmpty().withMessage('Last name is required for each employee'),
  ]),
  asyncHandler(async (req, res) => {
    const { employees, departmentId, managerId, role } = req.body;
    const results = { success: [], failed: [] };

    for (const emp of employees) {
      try {
        // Check if exists
        const existing = await global.prisma.user.findUnique({ where: { email: emp.email } });
        if (existing) {
          results.failed.push({ email: emp.email, reason: 'Email already exists' });
          continue;
        }

        const result = await onboardingService.inviteEmployee(
          { 
            ...emp, 
            role: emp.role || role || 'EMPLOYEE',
            departmentId: emp.departmentId || departmentId,
            managerId: emp.managerId || managerId,
          },
          req.user.id
        );

        results.success.push({
          id: result.employee.id,
          email: result.employee.email,
          name: `${result.employee.firstName} ${result.employee.lastName}`,
        });
      } catch (error) {
        results.failed.push({ email: emp.email, reason: error.message });
      }
    }

    res.status(201).json({
      message: `Invited ${results.success.length} employees, ${results.failed.length} failed`,
      results,
    });
  })
);

/**
 * GET /api/onboarding/stats
 * Get onboarding statistics (HR/Admin only)
 */
router.get('/stats',
  authenticate,
  authorize('users:read'),
  asyncHandler(async (req, res) => {
    const stats = await onboardingService.getOnboardingStats();
    res.json(stats);
  })
);

/**
 * GET /api/onboarding/pending
 * Get list of employees with pending onboarding
 */
router.get('/pending',
  authenticate,
  authorize('users:read'),
  asyncHandler(async (req, res) => {
    const pendingEmployees = await global.prisma.user.findMany({
      where: {
        onboardingCompleted: false,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        position: true,
        createdAt: true,
        department: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add days since invitation
    const employeesWithDays = pendingEmployees.map(emp => ({
      ...emp,
      daysSinceInvite: Math.floor(
        (Date.now() - new Date(emp.createdAt).getTime()) / (24 * 60 * 60 * 1000)
      ),
    }));

    res.json(employeesWithDays);
  })
);

/**
 * POST /api/onboarding/:id/resend-welcome
 * Resend welcome email to an employee
 */
router.post('/:id/resend-welcome',
  authenticate,
  authorize('users:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { resetPassword } = req.body;

    const result = await onboardingService.resendWelcomeEmail(id, resetPassword ? null : undefined);

    res.json({
      message: `Welcome email resent to ${result.email}`,
      ...result,
    });
  })
);

/**
 * POST /api/onboarding/send-reminders
 * Manually trigger onboarding reminders (admin only)
 */
router.post('/send-reminders',
  authenticate,
  authorize('admin:settings'),
  asyncHandler(async (req, res) => {
    const count = await onboardingService.sendOnboardingReminders();

    res.json({
      message: `Sent reminders to ${count} employees`,
      count,
    });
  })
);

/**
 * GET /api/onboarding/my-progress
 * Get current user's onboarding progress
 */
router.get('/my-progress',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await global.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        position: true,
        preferences: true,
        avatar: true,
        department: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate completion percentage
    const steps = {
      profile: !!(user.firstName && user.lastName),
      phone: !!user.phone,
      bio: !!user.bio,
      position: !!user.position,
      avatar: !!user.avatar,
      preferences: !!user.preferences,
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    res.json({
      onboardingCompleted: user.onboardingCompleted,
      onboardingCompletedAt: user.onboardingCompletedAt,
      progress,
      steps,
      completedSteps,
      totalSteps,
      department: user.department,
    });
  })
);

module.exports = router;
