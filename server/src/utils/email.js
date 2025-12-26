/**
 * Email Utility
 * 
 * Nodemailer-based email sending functionality
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // Use Ethereal for development
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: options.from || `AIXILCOILS Management Suite <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email templates
 */
const templates = {
  welcome: (user) => ({
    subject: 'Welcome to AIXILCOILS Management Suite',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to AMS!</h1>
          </div>
          <div class="content">
            <h2>Hello, ${user.firstName}!</h2>
            <p>Welcome to the AIXILCOILS Management Suite. Your account has been created successfully.</p>
            <p>You can now access all features based on your assigned role.</p>
            <a href="${process.env.CLIENT_URL}/login" class="button">Login Now</a>
            <p>If you have any questions, please contact your administrator.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AIXILCOILS Management Suite. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request - AMS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello, ${user.firstName}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AIXILCOILS Management Suite. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  leaveRequest: (employee, leave, approver) => ({
    subject: `Leave Request from ${employee.firstName} ${employee.lastName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4facfe; }
          .button { display: inline-block; background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .button.reject { background: #f5576c; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Leave Request</h1>
          </div>
          <div class="content">
            <h2>Hello, ${approver.firstName}!</h2>
            <p>A new leave request requires your approval:</p>
            <div class="info-box">
              <p><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
              <p><strong>Type:</strong> ${leave.type}</p>
              <p><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</p>
              <p><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</p>
              <p><strong>Days:</strong> ${leave.days}</p>
              <p><strong>Reason:</strong> ${leave.reason || 'Not specified'}</p>
            </div>
            <a href="${process.env.CLIENT_URL}/hr/leave/${leave.id}" class="button">Review Request</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AIXILCOILS Management Suite. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  taskAssigned: (assignee, task, assigner) => ({
    subject: `New Task Assigned: ${task.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #38ef7d; }
          .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .priority.HIGH { background: #fee2e2; color: #dc2626; }
          .priority.URGENT { background: #fef3c7; color: #d97706; }
          .priority.MEDIUM { background: #dbeafe; color: #2563eb; }
          .priority.LOW { background: #d1fae5; color: #059669; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Task Assigned</h1>
          </div>
          <div class="content">
            <h2>Hello, ${assignee.firstName}!</h2>
            <p>${assigner.firstName} ${assigner.lastName} has assigned you a new task:</p>
            <div class="info-box">
              <h3>${task.title}</h3>
              <p>${task.description || 'No description provided'}</p>
              <p><span class="priority ${task.priority}">${task.priority}</span></p>
              ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
            </div>
            <a href="${process.env.CLIENT_URL}/projects/tasks/${task.id}" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AIXILCOILS Management Suite. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  performanceReview: (employee, review) => ({
    subject: 'Your Performance Review is Ready',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #a18cd1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Performance Review</h1>
          </div>
          <div class="content">
            <h2>Hello, ${employee.firstName}!</h2>
            <p>Your ${review.type.toLowerCase()} performance review for ${review.period} has been submitted.</p>
            <p>Please review and acknowledge the feedback provided.</p>
            <a href="${process.env.CLIENT_URL}/performance/reviews/${review.id}" class="button">View Review</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AIXILCOILS Management Suite. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

/**
 * Send templated email
 */
const sendTemplatedEmail = async (templateName, data, recipientEmail) => {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const { subject, html } = template(data);
  return sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
};

module.exports = {
  sendEmail,
  sendTemplatedEmail,
  templates,
};
