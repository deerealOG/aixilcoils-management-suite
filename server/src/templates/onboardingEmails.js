/**
 * Employee Onboarding Email Templates
 * 
 * These templates are used for sending emails during the onboarding process
 */

/**
 * Generate welcome email HTML for new employees
 */
const generateWelcomeEmail = (employee, temporaryPassword, loginUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AIXILCOILS</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
          Welcome to AIXILCOILS! 🎉
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          You're now part of our team
        </p>
      </td>
    </tr>
    
    <!-- Body -->
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hello <strong>${employee.firstName}</strong>,
        </p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          We're thrilled to welcome you to the AIXILCOILS family! Your account has been created in our Management Suite (AMS), and you're ready to get started.
        </p>
        
        <!-- Credentials Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">Your Login Credentials</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #64748b; font-size: 14px;">Email:</span>
                    <span style="color: #1e293b; font-size: 14px; font-weight: 600; margin-left: 10px;">${employee.email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #64748b; font-size: 14px;">Temporary Password:</span>
                    <span style="color: #1e293b; font-size: 14px; font-weight: 600; margin-left: 10px; font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #64748b; font-size: 14px;">Department:</span>
                    <span style="color: #1e293b; font-size: 14px; font-weight: 600; margin-left: 10px;">${employee.department?.name || 'Not Assigned'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #64748b; font-size: 14px;">Role:</span>
                    <span style="color: #1e293b; font-size: 14px; font-weight: 600; margin-left: 10px;">${employee.role?.replace('_', ' ')}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                Login & Complete Onboarding
              </a>
            </td>
          </tr>
        </table>
        
        <!-- Next Steps -->
        <h3 style="color: #1e293b; margin: 30px 0 16px 0; font-size: 18px;">What's Next?</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 10px 0; vertical-align: top;">
              <span style="display: inline-block; width: 28px; height: 28px; background: #e0e7ff; border-radius: 50%; text-align: center; line-height: 28px; color: #6366f1; font-weight: 600; font-size: 14px; margin-right: 12px;">1</span>
              <span style="color: #333; font-size: 15px;">Log in with your temporary password</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top;">
              <span style="display: inline-block; width: 28px; height: 28px; background: #e0e7ff; border-radius: 50%; text-align: center; line-height: 28px; color: #6366f1; font-weight: 600; font-size: 14px; margin-right: 12px;">2</span>
              <span style="color: #333; font-size: 15px;">Complete the onboarding wizard</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top;">
              <span style="display: inline-block; width: 28px; height: 28px; background: #e0e7ff; border-radius: 50%; text-align: center; line-height: 28px; color: #6366f1; font-weight: 600; font-size: 14px; margin-right: 12px;">3</span>
              <span style="color: #333; font-size: 15px;">Change your password for security</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top;">
              <span style="display: inline-block; width: 28px; height: 28px; background: #e0e7ff; border-radius: 50%; text-align: center; line-height: 28px; color: #6366f1; font-weight: 600; font-size: 14px; margin-right: 12px;">4</span>
              <span style="color: #333; font-size: 15px;">Start exploring the dashboard</span>
            </td>
          </tr>
        </table>
        
        <!-- Download Apps -->
        <h3 style="color: #1e293b; margin: 30px 0 16px 0; font-size: 18px;">Download Our Apps</h3>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Access AMS from anywhere with our desktop and mobile apps:
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-right: 10px;">
              <a href="#" style="display: inline-block; background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px;">
                📱 iOS App
              </a>
            </td>
            <td style="padding-right: 10px;">
              <a href="#" style="display: inline-block; background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px;">
                🤖 Android App
              </a>
            </td>
            <td>
              <a href="#" style="display: inline-block; background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px;">
                💻 Desktop App
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
          If you have any questions, please don't hesitate to reach out to HR or your manager.
        </p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
          Best regards,<br>
          <strong>The AIXILCOILS Team</strong>
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 10px 0;">
          © ${new Date().getFullYear()} AIXILCOILS. All rights reserved.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          This email was sent to ${employee.email}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Generate onboarding reminder email
 */
const generateOnboardingReminderEmail = (employee, daysRemaining, loginUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Onboarding</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
          ⏰ Don't Forget to Complete Your Onboarding
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hi ${employee.firstName},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          We noticed you haven't completed your onboarding yet. You have <strong>${daysRemaining} days</strong> remaining to complete the process.
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Completing onboarding ensures you have full access to all the tools and resources you need.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                Complete Onboarding Now
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          © ${new Date().getFullYear()} AIXILCOILS. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Generate onboarding completion confirmation email
 */
const generateOnboardingCompleteEmail = (employee) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Complete</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
          🎉 Onboarding Complete!
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px; line-height: 80px;">✓</span>
        </div>
        <p style="color: #333; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
          Congratulations, <strong>${employee.firstName}</strong>!
        </p>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          You've successfully completed your onboarding. You now have full access to the AIXILCOILS Management Suite.
        </p>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; padding: 24px;">
          <tr>
            <td>
              <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 16px;">Quick Tips to Get Started:</h3>
              <p style="color: #64748b; font-size: 14px; text-align: left; margin: 8px 0;">✅ Check your assigned projects and tasks</p>
              <p style="color: #64748b; font-size: 14px; text-align: left; margin: 8px 0;">✅ Review your department's KPIs</p>
              <p style="color: #64748b; font-size: 14px; text-align: left; margin: 8px 0;">✅ Set up your OKRs for the quarter</p>
              <p style="color: #64748b; font-size: 14px; text-align: left; margin: 8px 0;">✅ Explore the employee directory</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          © ${new Date().getFullYear()} AIXILCOILS. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = {
  generateWelcomeEmail,
  generateOnboardingReminderEmail,
  generateOnboardingCompleteEmail,
};
