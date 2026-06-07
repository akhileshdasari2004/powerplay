/**
 * Axios API Client
 * 
 * Configured with interceptors for auth, error handling, and retry
 */

import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor - add auth token
 */
api.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('[API REQUEST]', config.method?.toUpperCase(), config.url, 'Token:', token ? token.substring(0, 20) + '...' : 'NONE');
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handle errors and token refresh
 */
api.interceptors.response.use(
  (response) => {
    console.log('[API RESPONSE]', response.config?.url, 'Status:', response.status, 'Data:', JSON.stringify(response.data)?.substring(0, 200));
    return response;
  },
  async (error) => {
    console.log('[API ERROR]', error.config?.url, error.response?.status, error.message);
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - try token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        const { accessToken } = response.data.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        if (response.data.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
        }
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    if (error.response) {
      // Server responded with error
      console.log('[API ERROR RESPONSE]', error.response.status, error.response.data);
      const message = error.response.data?.error?.message || error.response.data?.message || 'An error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      console.log('[API NETWORK ERROR] No response received');
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Error in request setup
      console.log('[API SETUP ERROR]', error.message);
      return Promise.reject(error);
    }
  }
);

/**
 * Helper methods for common patterns
 */
export const setAuthTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

export default api;