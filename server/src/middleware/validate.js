/**
 * Validation Middleware
 * 
 * Request validation using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // Auth validations
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],

  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters'),
    body('role')
      .optional()
      .isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'HR_OFFICER', 'FINANCE', 'VIEWER'])
      .withMessage('Invalid role'),
    body('departmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
  ],

  // User validations
  updateUser: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters'),
    body('phone')
      .optional()
      .matches(/^[\d\s\-+()]+$/)
      .withMessage('Invalid phone number'),
    body('position')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Position must be less than 100 characters'),
  ],

  // Department validations
  department: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Department name must be 2-100 characters'),
    body('code')
      .trim()
      .isLength({ min: 2, max: 10 })
      .toUpperCase()
      .withMessage('Department code must be 2-10 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],

  // Channel validations
  channel: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Channel name must be 2-100 characters'),
    body('type')
      .optional()
      .isIn(['DIRECT', 'GROUP', 'DEPARTMENT', 'ANNOUNCEMENT'])
      .withMessage('Invalid channel type'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be boolean'),
  ],

  // Message validations
  message: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be 1-5000 characters'),
    body('channelId')
      .isUUID()
      .withMessage('Valid channel ID is required'),
  ],

  // Project validations
  project: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Project name must be 2-200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    body('status')
      .optional()
      .isIn(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid status'),
  ],

  // Task validations
  task: [
    body('title')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Task title must be 2-200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    body('status')
      .optional()
      .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid status'),
    body('projectId')
      .isUUID()
      .withMessage('Valid project ID is required'),
    body('assigneeId')
      .optional()
      .isUUID()
      .withMessage('Invalid assignee ID'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid due date'),
  ],

  // KPI validations
  kpi: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('KPI name must be 2-200 characters'),
    body('targetValue')
      .isNumeric()
      .withMessage('Target value must be a number'),
    body('period')
      .trim()
      .notEmpty()
      .withMessage('Period is required'),
  ],

  // OKR validations
  okr: [
    body('objective')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Objective must be 5-500 characters'),
    body('period')
      .trim()
      .notEmpty()
      .withMessage('Period is required'),
    body('keyResults')
      .optional()
      .isArray()
      .withMessage('Key results must be an array'),
    body('keyResults.*.description')
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Key result description must be 5-500 characters'),
    body('keyResults.*.targetValue')
      .optional()
      .isNumeric()
      .withMessage('Target value must be a number'),
  ],

  // Leave request validations
  leaveRequest: [
    body('type')
      .isIn(['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'BEREAVEMENT', 'OTHER'])
      .withMessage('Invalid leave type'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date required'),
    body('endDate')
      .isISO8601()
      .withMessage('Valid end date required')
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Reason must be less than 1000 characters'),
  ],

  // Performance review validations
  performanceReview: [
    body('employeeId')
      .isUUID()
      .withMessage('Valid employee ID required'),
    body('period')
      .trim()
      .notEmpty()
      .withMessage('Review period required'),
    body('type')
      .isIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'PROBATION'])
      .withMessage('Invalid review type'),
    body('scores')
      .optional()
      .isArray()
      .withMessage('Scores must be an array'),
  ],

  // Common param validations
  uuidParam: [
    param('id')
      .isUUID()
      .withMessage('Invalid ID format'),
  ],

  // Pagination query validations
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
  ],
};

/**
 * Create validation middleware with error handling
 */
const validate = (rules) => {
  return [...rules, handleValidation];
};

module.exports = {
  handleValidation,
  validationRules,
  validate,
  body,
  param,
  query,
};
