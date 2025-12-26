/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Simplified role system for AIXILCOILS Management Suite
 * 
 * ROLES:
 *   OWNER  - Company owner, full system access
 *   ADMIN  - Administrators, manage users & settings
 *   LEAD   - Team leads, manage their team
 *   MEMBER - Standard team members
 *   GUEST  - View-only access
 */

const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  LEAD: 'LEAD',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
};

// Define permissions for each module
const PERMISSIONS = {
  // User Management
  'users:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'users:create': [ROLES.OWNER, ROLES.ADMIN],
  'users:update': [ROLES.OWNER, ROLES.ADMIN],
  'users:delete': [ROLES.OWNER, ROLES.ADMIN],
  'users:read:all': [ROLES.OWNER, ROLES.ADMIN],
  'users:read:department': [ROLES.LEAD],

  // Department Management
  'departments:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER, ROLES.GUEST],
  'departments:create': [ROLES.OWNER, ROLES.ADMIN],
  'departments:update': [ROLES.OWNER, ROLES.ADMIN],
  'departments:delete': [ROLES.OWNER],

  // Chat & Messaging
  'channels:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER, ROLES.GUEST],
  'channels:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'channels:update': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'channels:delete': [ROLES.OWNER, ROLES.ADMIN],
  'messages:send': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'messages:delete': [ROLES.OWNER, ROLES.ADMIN],

  // Projects
  'projects:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER, ROLES.GUEST],
  'projects:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'projects:update': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'projects:delete': [ROLES.OWNER, ROLES.ADMIN],

  // Tasks
  'tasks:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER, ROLES.GUEST],
  'tasks:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'tasks:update': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'tasks:delete': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'tasks:assign': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],

  // Performance/Reviews
  'performance:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'performance:read:own': [ROLES.MEMBER],
  'performance:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'performance:update': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'performance:delete': [ROLES.OWNER, ROLES.ADMIN],

  // KPIs
  'kpis:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'kpis:read:own': [ROLES.MEMBER],
  'kpis:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'kpis:update': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'kpis:delete': [ROLES.OWNER, ROLES.ADMIN],

  // OKRs
  'okrs:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'okrs:read:own': [ROLES.MEMBER],
  'okrs:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'okrs:update': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'okrs:delete': [ROLES.OWNER, ROLES.ADMIN],

  // Leave Management
  'leave:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'leave:read:own': [ROLES.MEMBER],
  'leave:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'leave:approve': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'leave:delete': [ROLES.OWNER, ROLES.ADMIN],

  // Attendance
  'attendance:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],
  'attendance:read:own': [ROLES.MEMBER],
  'attendance:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'attendance:update': [ROLES.OWNER, ROLES.ADMIN],

  // Documents
  'documents:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'documents:upload': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD, ROLES.MEMBER],
  'documents:delete': [ROLES.OWNER, ROLES.ADMIN],

  // Workflows
  'workflows:read': [ROLES.OWNER, ROLES.ADMIN],
  'workflows:create': [ROLES.OWNER, ROLES.ADMIN],
  'workflows:update': [ROLES.OWNER, ROLES.ADMIN],
  'workflows:delete': [ROLES.OWNER],
  'workflows:approve': [ROLES.OWNER, ROLES.ADMIN, ROLES.LEAD],

  // Analytics
  'analytics:read': [ROLES.OWNER, ROLES.ADMIN],
  'analytics:read:department': [ROLES.LEAD],
  'analytics:export': [ROLES.OWNER, ROLES.ADMIN],

  // System Settings
  'settings:read': [ROLES.OWNER, ROLES.ADMIN],
  'settings:update': [ROLES.OWNER],
  'admin:settings': [ROLES.OWNER, ROLES.ADMIN],

  // Audit Logs
  'audit:read': [ROLES.OWNER, ROLES.ADMIN],
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role, permission) => {
  // OWNER has all permissions
  if (role === ROLES.OWNER) return true;
  
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};

/**
 * Get all permissions for a role
 */
const getRolePermissions = (role) => {
  if (role === ROLES.OWNER) {
    return Object.keys(PERMISSIONS);
  }
  const permissions = [];
  for (const [permission, roles] of Object.entries(PERMISSIONS)) {
    if (roles.includes(role)) {
      permissions.push(permission);
    }
  }
  return permissions;
};

/**
 * Role hierarchy for cascading permissions
 */
const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.LEAD]: 60,
  [ROLES.MEMBER]: 40,
  [ROLES.GUEST]: 10,
};

/**
 * Check if role A is higher than role B
 */
const isRoleHigher = (roleA, roleB) => {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
};

/**
 * Get human-readable role name
 */
const getRoleName = (role) => {
  const names = {
    [ROLES.OWNER]: 'Owner',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.LEAD]: 'Team Lead',
    [ROLES.MEMBER]: 'Member',
    [ROLES.GUEST]: 'Guest',
  };
  return names[role] || role;
};

module.exports = {
  ROLES,
  PERMISSIONS,
  hasPermission,
  getRolePermissions,
  ROLE_HIERARCHY,
  isRoleHigher,
  getRoleName,
};

