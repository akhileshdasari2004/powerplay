/**
 * Auth Context
 * 
 * Provides authentication state throughout the app
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../services/authApi.js';

const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize auth state from stored token
   */
  useEffect(() => {
    const initAuth = async () => {
      if (!authApi.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authApi.me();
        setUser(data.data);
      } catch (err) {
        // Token invalid or expired
        authApi.logout();
        setError('Session expired. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await authApi.login({ email, password });
      setUser(data.data.user);
      return data.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Register handler
   */
  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { data } = await authApi.register({ name, email, password });
      setUser(data.data.user);
      return data.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user
  }), [user, loading, error, login, register, logout, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;