/**
 * Audit Logger
 * 
 * Structured logging for sensitive actions and compliance tracking.
 * Logs are stored in the AuditLog database table.
 */

const logger = require('./logger');

/**
 * Log action types
 */
const AUDIT_ACTIONS = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  
  // User Management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  
  // Projects
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  PROJECT_DELETE: 'PROJECT_DELETE',
  PROJECT_CANCEL: 'PROJECT_CANCEL',
  PROJECT_COMPLETE: 'PROJECT_COMPLETE',
  
  // Tasks
  TASK_CREATE: 'TASK_CREATE',
  TASK_UPDATE: 'TASK_UPDATE',
  TASK_DELETE: 'TASK_DELETE',
  TASK_ASSIGN: 'TASK_ASSIGN',
  
  // HR
  LEAVE_APPROVE: 'LEAVE_APPROVE',
  LEAVE_REJECT: 'LEAVE_REJECT',
  PERFORMANCE_REVIEW: 'PERFORMANCE_REVIEW',
  
  // Expenses
  EXPENSE_APPROVE: 'EXPENSE_APPROVE',
  EXPENSE_REJECT: 'EXPENSE_REJECT',
  
  // System
  SETTINGS_CHANGE: 'SETTINGS_CHANGE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DATA_EXPORT: 'DATA_EXPORT',
};

/**
 * Create an audit log entry
 * 
 * @param {Object} options
 * @param {string} options.userId - ID of user performing action
 * @param {string} options.userRole - Role of user
 * @param {string} options.action - Action type (from AUDIT_ACTIONS)
 * @param {string} options.entityType - Type of entity (User, Project, Task, etc.)
 * @param {string} options.entityId - ID of the entity being acted upon
 * @param {Object} options.oldValues - Previous values (for updates)
 * @param {Object} options.newValues - New values (for updates/creates)
 * @param {string} options.ipAddress - IP address of request
 * @param {string} options.userAgent - User agent string
 * @param {Object} options.metadata - Additional context
 */
const createAuditLog = async ({
  userId,
  userRole,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) => {
  try {
    // Mask sensitive fields
    const sanitizedOld = oldValues ? maskSensitiveData(oldValues) : null;
    const sanitizedNew = newValues ? maskSensitiveData(newValues) : null;

    const log = await global.prisma.auditLog.create({
      data: {
        userId,
        action: `${action}${userRole ? ` [${userRole}]` : ''}`,
        entityType,
        entityId,
        oldValues: sanitizedOld,
        newValues: sanitizedNew,
        ipAddress,
        userAgent,
      },
    });

    // Also log to console for real-time monitoring
    logger.info(`AUDIT: ${action} | User: ${userId} | Entity: ${entityType}:${entityId}`);
    
    return log;
  } catch (error) {
    // Audit logging should never break the main flow
    logger.error('Failed to create audit log:', error);
    return null;
  }
};

/**
 * Mask sensitive data in logs
 */
const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'refreshToken', 'mfaSecret', 'salary'];
  const masked = { ...data };
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***REDACTED***';
    }
  }
  
  return masked;
};

/**
 * Log permission denied attempt
 */
const logPermissionDenied = async (req, requiredPermission) => {
  return createAuditLog({
    userId: req.user?.id || 'anonymous',
    userRole: req.user?.role || 'none',
    action: AUDIT_ACTIONS.PERMISSION_DENIED,
    entityType: 'PERMISSION',
    entityId: requiredPermission,
    newValues: {
      attemptedPath: req.originalUrl,
      method: req.method,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
};

/**
 * Middleware to attach audit helper to request
 */
const auditMiddleware = (req, res, next) => {
  req.audit = async (action, entityType, entityId, changes = {}) => {
    return createAuditLog({
      userId: req.user?.id,
      userRole: req.user?.role,
      action,
      entityType,
      entityId,
      oldValues: changes.before,
      newValues: changes.after,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  };
  next();
};

/**
 * Check if action is high-risk (for alerts)
 */
const isHighRiskAction = (action) => {
  const highRiskActions = [
    AUDIT_ACTIONS.USER_DELETE,
    AUDIT_ACTIONS.ROLE_CHANGE,
    AUDIT_ACTIONS.PROJECT_CANCEL,
    AUDIT_ACTIONS.PROJECT_DELETE,
    AUDIT_ACTIONS.SETTINGS_CHANGE,
    AUDIT_ACTIONS.DATA_EXPORT,
  ];
  return highRiskActions.includes(action);
};

module.exports = {
  AUDIT_ACTIONS,
  createAuditLog,
  logPermissionDenied,
  auditMiddleware,
  isHighRiskAction,
  maskSensitiveData,
};
