/**
 * Express Middleware
 * Shared middleware functions for authentication and validation
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token middleware
 */
function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
}

/**
 * Rate limiting middleware
 */
function rateLimitMiddleware(req, res, next) {
  // Can be combined with express-rate-limit if needed
  next();
}

module.exports = {
  verifyToken,
  rateLimitMiddleware,
};
