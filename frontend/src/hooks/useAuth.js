import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext.jsx';

/**
 * useAuth - Hook to access auth context
 * Provides authentication state and methods
 * @returns {Object} Auth context with user, isAuthenticated, login, logout, etc.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default useAuth;