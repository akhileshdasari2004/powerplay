/**
 * Auth API Service
 */

import api, { setAuthTokens, clearAuthTokens, isAuthenticated } from './api.js';

export const authApi = {
  /**
   * Register new user
   */
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.data.accessToken) {
      setAuthTokens(response.data.data);
    }
    return response;
  },

  /**
   * Login user
   */
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    if (response.data.data.accessToken) {
      setAuthTokens(response.data.data);
    }
    return response;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuthTokens();
    }
  },

  /**
   * Get current user
   */
  me: async () => {
    return api.get('/auth/me');
  },

  /**
   * Refresh access token
   */
  refresh: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    const response = await api.post('/auth/refresh', { refreshToken });
    if (response.data.data.accessToken) {
      setAuthTokens(response.data.data);
    }
    return response;
  },

  /**
   * Update password
   */
  updatePassword: async (data) => {
    return api.put('/auth/password', data);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated,

  /**
   * Get stored token
   */
  getToken: () => localStorage.getItem('accessToken')
};

export default authApi;