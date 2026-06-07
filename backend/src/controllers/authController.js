/**
 * Authentication Controller
 * 
 * Handles auth-related HTTP requests
 * All logic delegated to authService
 */

import authService from '../services/authService.js';
import { catchAsync } from '../middleware/errorHandler.js';

/**
 * POST /auth/register
 * Register a new user
 */
export const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  
  const result = await authService.register({ email, password, name });
  
  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

/**
 * POST /auth/login
 * Login user
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await authService.login({ email, password });
  
  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

/**
 * POST /auth/logout
 * Logout user (client-side token removal)
 */
export const logout = catchAsync(async (req, res) => {
  // Clear the refresh token cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'strict'
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
export const refresh = catchAsync(async (req, res) => {
  // Get refresh token from cookie or body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: { message: 'Refresh token required' }
    });
  }
  
  const result = await authService.refreshAccessToken(refreshToken);
  
  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /auth/me
 * Get current user
 */
export const me = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  
  res.json({
    success: true,
    data: user
  });
});

/**
 * PUT /auth/password
 * Update password
 */
export const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  await authService.updatePassword(req.user.id, currentPassword, newPassword);
  
  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

export default {
  register,
  login,
  logout,
  refresh,
  me,
  updatePassword
};