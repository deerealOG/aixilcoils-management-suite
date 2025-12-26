/**
 * Authorization Middleware
 * 
 * Role-based access control (RBAC) middleware
 */

const { hasPermission, ROLES, isRoleHigher } = require('../config/roles');
const logger = require('../utils/logger');
const { logPermissionDenied } = require('../utils/auditLogger');

/**
 * Check if user has required permission
 */
const authorize = (...permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    const userRole = req.user.role;

    // Owner has all permissions
    if (userRole === ROLES.OWNER) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(userRole, permission)
    );

    if (!hasRequiredPermission) {
      // Log the denied access attempt
      await logPermissionDenied(req, permissions.join(', '));
      
      logger.warn(`Authorization denied for user ${req.user.id} - Required: ${permissions.join(', ')}`);
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

/**
 * Check if user has one of the specified roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Role not authorized.' 
      });
    }

    next();
  };
};

/**
 * Check if user is accessing their own resource or has permission
 */
const authorizeOwnerOrPermission = (permission, userIdGetter) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    // Get the resource owner ID from the request
    const resourceUserId = typeof userIdGetter === 'function' 
      ? userIdGetter(req) 
      : req.params[userIdGetter] || req.params.userId;

    // Check if user is the owner
    if (req.user.id === resourceUserId) {
      return next();
    }

    // Check if user has the permission
    if (hasPermission(req.user.role, permission)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only access your own resources.' 
    });
  };
};

/**
 * Check if user is a manager of the specified user
 */
const authorizeManagerOf = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required.' 
    });
  }

  // Owner and admin can access all
  if ([ROLES.OWNER, ROLES.ADMIN].includes(req.user.role)) {
    return next();
  }

  const targetUserId = req.params.userId || req.body.userId;
  
  if (!targetUserId) {
    return res.status(400).json({ 
      error: 'User ID required.' 
    });
  }

  try {
    const targetUser = await global.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { managerId: true, departmentId: true },
    });

    if (!targetUser) {
      return res.status(404).json({ 
        error: 'User not found.' 
      });
    }

    // Check if current user is the manager
    if (targetUser.managerId === req.user.id) {
      return next();
    }

    // Check if user is department lead
    if (req.user.role === ROLES.LEAD && 
        targetUser.departmentId === req.user.departmentId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You are not the manager of this user.' 
    });
  } catch (error) {
    logger.error('Authorization error:', error);
    return res.status(500).json({ 
      error: 'Authorization check failed.' 
    });
  }
};

/**
 * Department-level access control
 */
const authorizeDepartment = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    // Owner and admin can access all departments
    if ([ROLES.OWNER, ROLES.ADMIN].includes(req.user.role)) {
      return next();
    }

    // Leads can access all departments if they have permission
    if (req.user.role === ROLES.LEAD && hasPermission(req.user.role, permission)) {
      return next();
    }

    const departmentId = req.params.departmentId || req.body.departmentId || req.query.departmentId;

    // If no department specified, limit to user's department
    if (!departmentId) {
      req.query.departmentId = req.user.departmentId;
      return next();
    }

    // Check if user belongs to the department
    if (departmentId === req.user.departmentId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only access your department.' 
    });
  };
};

module.exports = {
  authorize,
  requireRole,
  authorizeOwnerOrPermission,
  authorizeManagerOf,
  authorizeDepartment,
};
