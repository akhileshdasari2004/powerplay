import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce - Hook to debounce a value
 * @param {*} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 300)
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Hook to debounce a callback function
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 300)
 * @returns {Function} Debounced callback
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  return debouncedCallback;
}

/**
 * useThrottle - Hook to throttle a value
 * @param {*} value - Value to throttle
 * @param {number} limit - Throttle limit in milliseconds (default: 300)
 * @returns {*} Throttled value
 */
export function useThrottle(value, limit = 300) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * useDebouncedEffect - Hook to debounce an effect
 * @param {Function} effect - Effect function
 * @param {Array} deps - Dependencies
 * @param {number} delay - Debounce delay in milliseconds (default: 300)
 */
export function useDebouncedEffect(effect, deps, delay = 300) {
  useEffect(() => {
    const timer = setTimeout(() => {
      effect();
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, deps);
}

export default useDebounce;