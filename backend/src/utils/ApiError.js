/**
 * Custom API Error Class
 * 
 * Standardized error handling across the application
 */

export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new ApiError(message, 400, code, details);
  }
  
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(message, 401, code);
  }
  
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(message, 403, code);
  }
  
  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(message, 404, code);
  }
  
  static conflict(message, code = 'CONFLICT', details = null) {
    return new ApiError(message, 409, code, details);
  }
  
  static validationError(message, details) {
    return new ApiError(message, 400, 'VALIDATION_ERROR', details);
  }
  
  static internal(message = 'Internal server error') {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(message, 429, 'TOO_MANY_REQUESTS');
  }
  
  static toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details
      }
    };
  }
}

export default ApiError;