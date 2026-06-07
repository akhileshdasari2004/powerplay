import { useContext } from 'react';
import ToastContext from '../contexts/ToastContext.jsx';

/**
 * useToast - Hook to access toast context
 * Provides toast notification methods
 * @returns {Object} Toast context with success, error, warning, info, etc.
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export default useToast;