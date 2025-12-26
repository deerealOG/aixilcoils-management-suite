/**
 * Onboarding Service
 * 
 * Handles employee onboarding workflows including:
 * - Creating new employee invitations
 * - Sending welcome emails
 * - Tracking onboarding progress
 * - Sending reminders
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { generateWelcomeEmail, generateOnboardingReminderEmail, generateOnboardingCompleteEmail } = require('../templates/onboardingEmails');
const logger = require('../utils/logger');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Generate a secure temporary password
 */
const generateTemporaryPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(crypto.randomInt(charset.length));
  }
  return password;
};

/**
 * Create a new employee and send welcome email
 */
const inviteEmployee = async (employeeData, createdBy) => {
  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

  // Create the employee in the database
  const employee = await global.prisma.user.create({
    data: {
      email: employeeData.email,
      password: hashedPassword,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      role: employeeData.role || 'EMPLOYEE',
      departmentId: employeeData.departmentId,
      managerId: employeeData.managerId,
      position: employeeData.position,
      hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : new Date(),
      status: 'PENDING',
      onboardingCompleted: false,
    },
    include: {
      department: true,
      manager: true,
    },
  });

  // Send welcome email
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;
  const emailHtml = generateWelcomeEmail(employee, temporaryPassword, loginUrl);

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"AIXILCOILS HR" <${process.env.SMTP_USER || 'hr@aixilcoils.com'}>`,
      to: employee.email,
      subject: '🎉 Welcome to AIXILCOILS - Your Account is Ready!',
      html: emailHtml,
    });

    logger.info(`Welcome email sent to ${employee.email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${employee.email}:`, error);
    // Don't throw - employee is created, email can be resent
  }

  // Create audit log
  await global.prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'EMPLOYEE_INVITED',
      entityType: 'User',
      entityId: employee.id,
      newValues: {
        email: employee.email,
        role: employee.role,
        departmentId: employee.departmentId,
      },
    },
  });

  // Create notification for the new employee
  await global.prisma.notification.create({
    data: {
      userId: employee.id,
      type: 'SYSTEM',
      title: 'Welcome to AIXILCOILS!',
      message: 'Please complete your onboarding to get started.',
    },
  });

  return {
    employee,
    temporaryPassword, // Only return for admin view, never log this
  };
};

/**
 * Send onboarding reminder to employees who haven't completed onboarding
 */
const sendOnboardingReminders = async () => {
  // Find employees who haven't completed onboarding
  const incompleteOnboarding = await global.prisma.user.findMany({
    where: {
      onboardingCompleted: false,
      status: { in: ['ACTIVE', 'PENDING'] },
      createdAt: {
        // Created more than 1 day ago
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    include: {
      department: true,
    },
  });

  const transporter = createTransporter();
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;

  for (const employee of incompleteOnboarding) {
    // Calculate days since account creation
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(employee.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    );
    const daysRemaining = Math.max(0, 7 - daysSinceCreation); // 7-day onboarding window

    try {
      const emailHtml = generateOnboardingReminderEmail(employee, daysRemaining, loginUrl);
      
      await transporter.sendMail({
        from: `"AIXILCOILS HR" <${process.env.SMTP_USER || 'hr@aixilcoils.com'}>`,
        to: employee.email,
        subject: '⏰ Complete Your AIXILCOILS Onboarding',
        html: emailHtml,
      });

      logger.info(`Onboarding reminder sent to ${employee.email}`);
    } catch (error) {
      logger.error(`Failed to send reminder to ${employee.email}:`, error);
    }
  }

  return incompleteOnboarding.length;
};

/**
 * Complete employee onboarding and send confirmation
 */
const completeOnboarding = async (userId) => {
  const employee = await global.prisma.user.update({
    where: { id: userId },
    data: {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      status: 'ACTIVE',
    },
    include: {
      department: true,
    },
  });

  // Send completion email
  try {
    const transporter = createTransporter();
    const emailHtml = generateOnboardingCompleteEmail(employee);

    await transporter.sendMail({
      from: `"AIXILCOILS HR" <${process.env.SMTP_USER || 'hr@aixilcoils.com'}>`,
      to: employee.email,
      subject: '🎉 Onboarding Complete - Welcome to the Team!',
      html: emailHtml,
    });

    logger.info(`Onboarding completion email sent to ${employee.email}`);
  } catch (error) {
    logger.error(`Failed to send completion email to ${employee.email}:`, error);
  }

  // Create audit log
  await global.prisma.auditLog.create({
    data: {
      userId: employee.id,
      action: 'ONBOARDING_COMPLETED',
      entityType: 'User',
      entityId: employee.id,
    },
  });

  // Notify manager
  if (employee.managerId) {
    await global.prisma.notification.create({
      data: {
        userId: employee.managerId,
        type: 'SYSTEM',
        title: 'New Team Member Ready',
        message: `${employee.firstName} ${employee.lastName} has completed their onboarding.`,
      },
    });
  }

  return employee;
};

/**
 * Get onboarding statistics for admin dashboard
 */
const getOnboardingStats = async () => {
  const [total, completed, pending, thisWeek] = await Promise.all([
    global.prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    global.prisma.user.count({
      where: {
        onboardingCompleted: true,
        onboardingCompletedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    global.prisma.user.count({
      where: { onboardingCompleted: false, status: { in: ['ACTIVE', 'PENDING'] } },
    }),
    global.prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    totalNewEmployees: total,
    completedOnboarding: completed,
    pendingOnboarding: pending,
    newThisWeek: thisWeek,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

/**
 * Resend welcome email to an employee
 */
const resendWelcomeEmail = async (userId, newPassword = null) => {
  const employee = await global.prisma.user.findUnique({
    where: { id: userId },
    include: { department: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Generate new password if requested
  let temporaryPassword = newPassword;
  if (!temporaryPassword) {
    temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    await global.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;
  const emailHtml = generateWelcomeEmail(employee, temporaryPassword, loginUrl);

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"AIXILCOILS HR" <${process.env.SMTP_USER || 'hr@aixilcoils.com'}>`,
    to: employee.email,
    subject: '🎉 Welcome to AIXILCOILS - Your Account is Ready!',
    html: emailHtml,
  });

  logger.info(`Welcome email resent to ${employee.email}`);

  return { success: true, email: employee.email };
};

module.exports = {
  inviteEmployee,
  sendOnboardingReminders,
  completeOnboarding,
  getOnboardingStats,
  resendWelcomeEmail,
  generateTemporaryPassword,
};
