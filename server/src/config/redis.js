/**
 * Redis Configuration
 * 
 * Redis client for caching messages and notifications
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;

const initializeRedis = () => {
  try {
    if (process.env.REDIS_URL) {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
      });

      redis.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      redis.on('error', (error) => {
        logger.error('❌ Redis connection error:', error.message);
      });

      redis.on('close', () => {
        logger.warn('⚠️ Redis connection closed');
      });

      return redis;
    } else {
      logger.warn('⚠️ Redis URL not configured, caching disabled');
      return null;
    }
  } catch (error) {
    logger.error('❌ Failed to initialize Redis:', error);
    return null;
  }
};

// Cache helpers
const cacheGet = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

const cacheSet = async (key, value, expireSeconds = 3600) => {
  if (!redis) return false;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', expireSeconds);
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
};

const cacheDelete = async (key) => {
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
};

const cacheDeletePattern = async (pattern) => {
  if (!redis) return false;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    logger.error('Cache delete pattern error:', error);
    return false;
  }
};

module.exports = {
  initializeRedis,
  getRedis: () => redis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
};
