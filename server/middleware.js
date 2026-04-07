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
 * Optionally verify JWT token (non-blocking)
 * Attaches req.user when valid, but does not error if missing/invalid.
 */
function optionalVerifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    req.user = decoded;
    return next();
  } catch (error) {
    // Ignore auth errors for optional auth flows
    return next();
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
  optionalVerifyToken,
  rateLimitMiddleware,
};
