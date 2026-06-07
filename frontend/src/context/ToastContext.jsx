import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TOAST_DURATION } from '../constants';

const ToastContext = createContext(null);

// Toast ID generator
let toastId = 0;

/**
 * ToastProvider - Manages toast notifications
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a toast notification
   * @param {Object} toast - Toast config
   * @returns {string} Toast ID
   */
  const addToast = useCallback((toast) => {
    const id = `toast-${++toastId}`;
    const duration = toast.duration || TOAST_DURATION.MEDIUM;

    const newToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || '',
      message: toast.message || '',
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  /**
   * Remove a toast by ID
   * @param {string} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Show success toast
   * @param {string} message - Success message
   * @param {string} title - Optional title
   * @param {number} duration - Optional duration
   */
  const success = useCallback((message, title = 'Success', duration) => {
    return addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  /**
   * Show error toast
   * @param {string} message - Error message
   * @param {string} title - Optional title
   * @param {number} duration - Optional duration
   */
  const error = useCallback((message, title = 'Error', duration) => {
    return addToast({ type: 'error', title, message, duration: duration || TOAST_DURATION.LONG });
  }, [addToast]);

  /**
   * Show warning toast
   * @param {string} message - Warning message
   * @param {string} title - Optional title
   * @param {number} duration - Optional duration
   */
  const warning = useCallback((message, title = 'Warning', duration) => {
    return addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  /**
   * Show info toast
   * @param {string} message - Info message
   * @param {string} title - Optional title
   * @param {number} duration - Optional duration
   */
  const info = useCallback((message, title = 'Info', duration) => {
    return addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  /**
   * Clear all toasts
   */
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
      clearAll,
    }),
    [toasts, addToast, removeToast, success, error, warning, info, clearAll]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * useToast - Hook to access toast context
 * @returns {Object} Toast context value
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export default ToastContext;