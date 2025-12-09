const cognitoService = require('../services/cognitoService');
const { unauthorized } = require('../utils/response');

/**
 * Authentication middleware
 * Validates JWT token and attaches user information to request
 */
async function authMiddleware(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return unauthorized(res, 'Authorization token required');
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Invalid authorization format. Use: Bearer <token>');
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return unauthorized(res, 'Authorization token required');
    }

    // Verify the token using Cognito
    const decoded = await cognitoService.verifyToken(token);

    // Attach user information to request
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error.statusCode === 401) {
      return unauthorized(res, error.message);
    }
    return unauthorized(res, 'Invalid or expired token');
  }
}

module.exports = authMiddleware;
