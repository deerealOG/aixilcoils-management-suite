/**
 * Helper Utility Functions
 * 
 * Common utility functions used throughout the application
 */

const crypto = require('crypto');

/**
 * Generate a random string of specified length
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Paginate query results
 */
const paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
};

/**
 * Create pagination metadata
 */
const createPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Format date for display
 */
const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  };
  return d.toLocaleDateString('en-US', options[format] || options.short);
};

/**
 * Calculate date difference in days
 */
const dateDiffInDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Sanitize user object for response (remove sensitive fields)
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, mfaSecret, refreshToken, ...sanitized } = user;
  return sanitized;
};

/**
 * Calculate percentage
 */
const calculatePercentage = (current, target) => {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
};

/**
 * Deep clone an object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Sleep helper for async operations
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Group array by key
 */
const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const value = item[key];
    groups[value] = groups[value] || [];
    groups[value].push(item);
    return groups;
  }, {});
};

/**
 * Get start and end of current period
 */
const getPeriodDates = (period = 'month') => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
};

/**
 * Get current period label (e.g., "Q1 2024")
 */
const getCurrentPeriodLabel = (type = 'quarter') => {
  const now = new Date();
  const year = now.getFullYear();

  switch (type) {
    case 'month':
      return now.toLocaleString('default', { month: 'long', year: 'numeric' });
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      return `Q${quarter} ${year}`;
    case 'year':
      return year.toString();
    default:
      return `Q${Math.floor(now.getMonth() / 3) + 1} ${year}`;
  }
};

module.exports = {
  generateRandomString,
  paginate,
  createPaginationMeta,
  formatDate,
  dateDiffInDays,
  sanitizeUser,
  calculatePercentage,
  deepClone,
  sleep,
  groupBy,
  getPeriodDates,
  getCurrentPeriodLabel,
};
