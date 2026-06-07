import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../services/authApi';
import { TOKEN_KEY, USER_KEY } from '../constants';

const AuthContext = createContext(null);

/**
 * AuthProvider - Manages authentication state and methods
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = sessionStorage.getItem(USER_KEY);
      const storedToken = sessionStorage.getItem(TOKEN_KEY);

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);

          // Verify token is still valid
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        } catch (err) {
          // Token invalid or expired
          sessionStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.login({ email, password });
      const { user: userData } = result;

      sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} User data
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.register(userData);
      const { user: newUser } = result;

      sessionStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);

      return newUser;
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await authApi.logout();
    } catch (err) {
      // Ignore logout errors, clear state anyway
    } finally {
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user data
   * @param {Object} userData - Updated user data
   */
  const updateUser = useCallback((userData) => {
    setUser(userData);
    sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      updateUser,
      clearError,
    }),
    [user, isAuthenticated, isLoading, error, login, register, logout, updateUser, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth - Hook to access auth context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;