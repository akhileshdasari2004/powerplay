/**
 * Authentication Service
 * 
 * Handles user authentication, token generation, and refresh
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const { 
  JWT_ACCESS_SECRET, 
  JWT_REFRESH_SECRET, 
  ACCESS_TOKEN_EXPIRY = '15m',
  REFRESH_TOKEN_EXPIRY = '7d'
} = process.env;

/**
 * Hash password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role 
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Register new user
 */
export const register = async ({ email, password, name, role = 'user' }) => {
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  // Create user (password will be hashed by model's pre-save hook)
  const user = await User.create({
    email,
    password,
    name,
    role
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    accessToken,
    refreshToken
  };
};

/**
 * Login user
 */
export const login = async ({ email, password }) => {
  // Find user (include password since it's select: false)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    accessToken,
    refreshToken
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return { accessToken };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Refresh token expired');
    }
    throw error;
  }
};

/**
 * Get current user
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  };
};

/**
 * Update password
 */
export const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Verify current password
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  // Hash and update new password
  user.password = await hashPassword(newPassword);
  await user.save();

  return { message: 'Password updated successfully' };
};

export default {
  register,
  login,
  refreshAccessToken,
  getMe,
  updatePassword,
  hashPassword,
  comparePassword
};