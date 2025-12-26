/**
 * Audit Log Middleware
 * 
 * Logs all important actions for compliance and debugging
 */

const logger = require('../utils/logger');

/**
 * Create audit log entry
 */
const createAuditLog = async (data) => {
  try {
    await global.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};

/**
 * Audit middleware for routes
 */
const audit = (action, entityType, getEntityId) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to capture response
    res.json = (data) => {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = typeof getEntityId === 'function' 
          ? getEntityId(req, data) 
          : req.params.id || data?.id;

        createAuditLog({
          userId: req.user?.id,
          action,
          entityType,
          entityId,
          newValues: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Log data changes (for updates)
 */
const auditChange = (action, entityType, getOldData) => {
  return async (req, res, next) => {
    // Get old data before change
    let oldData;
    if (typeof getOldData === 'function') {
      oldData = await getOldData(req);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        createAuditLog({
          userId: req.user?.id,
          action,
          entityType,
          entityId: req.params.id || data?.id,
          oldValues: oldData,
          newValues: req.body,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  createAuditLog,
  audit,
  auditChange,
};
