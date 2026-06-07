/**
 * Global Error Handler Middleware
 * 
 * Unified error handling for all routes
 */

import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

/**
 * Development error response
 */
const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode
    }
  });
};

/**
 * Production error response
 */
const sendProdError = (err, res) => {
  // Log error for debugging (never expose to client)
  console.error('Error:', err);
  
  // Don't leak error details in production
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.isOperational ? err.message : 'Something went wrong',
      statusCode: err.statusCode
    }
  });
};

/**
 * Mongoose validation error handler
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message
  }));
  
  return new ApiError('Validation Error', 400, 'VALIDATION_ERROR', errors);
};

/**
 * Mongoose duplicate key error handler
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyPattern)[0];
  return new ApiError(
    `Duplicate value for field: ${field}`,
    400,
    'DUPLICATE_ERROR'
  );
};

/**
 * Mongoose cast error handler (invalid ObjectId, etc.)
 */
const handleCastError = (err) => {
  return new ApiError(`Invalid ${err.path}: ${err.value}`, 400, 'CAST_ERROR');
};

/**
 * JWT errors
 */
const handleJWTError = () => {
  return new ApiError('Invalid token', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = () => {
  return new ApiError('Token has expired', 401, 'TOKEN_EXPIRED');
};

/**
 * Main error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  
  // Handle Mongoose errors
  if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err instanceof mongoose.Error.CastError) {
    error = handleCastError(err);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  
  // Handle custom API errors
  if (err instanceof ApiError) {
    error = err;
  }
  
  // Log error for monitoring
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    statusCode: error.statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
  
  // Send response
  if (process.env.NODE_ENV === 'production') {
    sendProdError(error, res);
  } else {
    sendDevError(error, res);
  }
};

/**
 * Async handler wrapper - catches errors in async route handlers
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    `Route not found: ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

export default { errorHandler, catchAsync, notFoundHandler };