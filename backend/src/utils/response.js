/**
 * Response utility functions for consistent API responses
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} code - Error code (optional)
 * @param {*} details - Additional error details (optional)
 */
function error(res, message, statusCode = 500, code = null, details = null) {
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };

  return res.status(statusCode).json(errorResponse);
}

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} details - Validation error details
 */
function validationError(res, message, details = null) {
  return error(res, message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Send an unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Unauthorized')
 */
function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401, 'UNAUTHORIZED');
}

/**
 * Send a forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Forbidden')
 */
function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403, 'FORBIDDEN');
}

/**
 * Send a not found error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Resource not found')
 */
function notFound(res, message = 'Resource not found') {
  return error(res, message, 404, 'NOT_FOUND');
}

/**
 * Send a conflict error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function conflict(res, message) {
  return error(res, message, 409, 'CONFLICT');
}

/**
 * Send an internal server error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Internal server error')
 * @param {*} details - Error details (optional, only in development)
 */
function serverError(res, message = 'Internal server error', details = null) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  return error(
    res,
    message,
    500,
    'INTERNAL_SERVER_ERROR',
    isDevelopment ? details : null
  );
}

module.exports = {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
};
