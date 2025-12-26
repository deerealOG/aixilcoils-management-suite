/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user to request
 */

const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Authenticate user via JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        error: 'Invalid or expired token.' 
      });
    }

    // Get user from database
    const user = await global.prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        avatar: true,
        position: true,
      },
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found.' 
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ 
        error: 'Account is not active.' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed.' 
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      
      if (decoded) {
        const user = await global.prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            departmentId: true,
          },
        });
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
