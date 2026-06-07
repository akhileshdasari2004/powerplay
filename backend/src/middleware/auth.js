/**
 * Authentication Middleware
 * 
 * JWT verification and role-based access control
 */

import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

const { JWT_ACCESS_SECRET } = process.env;

/**
 * Protect routes - verify JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Access denied. No token provided.');
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    // Get user from token
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token has expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - don't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }

    next();
  } catch {
    // Don't fail on invalid token for optional auth
    next();
  }
};

/**
 * Authorize specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }

    next();
  };
};

/**
 * Admin only shortcut
 */
export const adminOnly = authorize('admin');

/**
 * Check if resource belongs to user or user is admin
 */
export const ownerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (!resourceUserId) {
        throw ApiError.notFound('Resource not found');
      }

      if (req.user.role === 'admin' || resourceUserId.toString() === req.user.id) {
        return next();
      }

      throw ApiError.forbidden('You can only access your own resources');
    } catch (error) {
      next(error);
    }
  };
};

export default {
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  ownerOrAdmin
};