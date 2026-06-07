/**
 * Validation Utilities
 * 
 * Reusable validation functions using Joi-like patterns
 */

export const ValidationError = class extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
};

/**
 * String validation
 */
export const isString = (value) => typeof value === 'string';

export const isEmail = (value) => {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isStrongPassword = (value) => {
  if (!isString(value)) return false;
  // At least 8 chars, one uppercase, one lowercase, one number, one special
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(value);
};

/**
 * MongoDB ObjectId validation
 */
export const isObjectId = (value) => {
  if (!isString(value)) return false;
  return /^[0-9a-fA-F]{24}$/.test(value);
};

/**
 * Date validation
 */
export const isValidDate = (value) => {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date);
};

export const isFutureDate = (value) => {
  if (!isValidDate(value)) return false;
  return new Date(value) > new Date();
};

export const isPastDate = (value) => {
  if (!isValidDate(value)) return false;
  return new Date(value) < new Date();
};

/**
 * Number validation
 */
export const isPositiveNumber = (value) => {
  return typeof value === 'number' && value > 0;
};

export const isNonNegativeNumber = (value) => {
  return typeof value === 'number' && value >= 0;
};

export const isInRange = (value, min, max) => {
  return typeof value === 'number' && value >= min && value <= max;
};

/**
 * Array validation
 */
export const isArray = (value) => Array.isArray(value);

export const isNonEmptyArray = (value) => {
  return Array.isArray(value) && value.length > 0;
};

export const arrayMinLength = (value, min) => {
  return Array.isArray(value) && value.length >= min;
};

export const arrayMaxLength = (value, max) => {
  return Array.isArray(value) && value.length <= max;
};

/**
 * Object validation
 */
export const isObject = (value) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const hasRequiredKeys = (value, keys) => {
  if (!isObject(value)) return false;
  return keys.every(key => key in value);
};

/**
 * Enum validation
 */
export const isEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

// Email validator (basic)
export const isValidEmail = (value) => {
  if (!isString(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// Password validator (returns {valid, message})
export const isValidPassword = (value) => {
  if (!isString(value)) return { valid: false, message: 'Password is required' };
  if (value.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(value)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(value)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(value)) return { valid: false, message: 'Password must contain at least one number' };
  return { valid: true };
};

// ObjectId validator
export const isValidObjectId = (value) => {
  if (!isString(value)) return false;
  return /^[0-9a-fA-F]{24}$/.test(value);
};

// Invoice status validator
export const isValidInvoiceStatus = (value) => {
  return ['draft', 'pending', 'paid', 'overdue', 'cancelled'].includes(value);
};

// Date range validator
export const isValidDateRange = (from, to) => {
  if (!from && !to) return true;
  if (!from || !to) return true; // Allow single date
  return new Date(from) <= new Date(to);
};

/**
 * URL validation
 */
export const isUrl = (value) => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Phone validation (international format)
 */
export const isPhone = (value) => {
  if (!isString(value)) return false;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(value);
};

/**
 * Schema validator factory
 */
export const createValidator = (schema) => {
  return (data) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        const { test, message } = rule;
        
        if (test === 'required' && (value === undefined || value === null || value === '')) {
          errors.push({ field, message: message || `${field} is required` });
          continue; // Skip other tests if required fails
        }
        
        if (value === undefined || value === null || value === '') continue;
        
        switch (test) {
          case 'type':
            if (typeof value !== rule.expected) {
              errors.push({ field, message: message || `${field} must be of type ${rule.expected}` });
            }
            break;
          case 'minLength':
            if (value.length < rule.value) {
              errors.push({ field, message: message || `${field} must be at least ${rule.value} characters` });
            }
            break;
          case 'maxLength':
            if (value.length > rule.value) {
              errors.push({ field, message: message || `${field} must be at most ${rule.value} characters` });
            }
            break;
          case 'min':
            if (value < rule.value) {
              errors.push({ field, message: message || `${field} must be at least ${rule.value}` });
            }
            break;
          case 'max':
            if (value > rule.value) {
              errors.push({ field, message: message || `${field} must be at most ${rule.value}` });
            }
            break;
          case 'pattern':
            if (!rule.value.test(value)) {
              errors.push({ field, message: message || `${field} has invalid format` });
            }
            break;
          case 'enum':
            if (!rule.value.includes(value)) {
              errors.push({ field, message: message || `${field} must be one of: ${rule.value.join(', ')}` });
            }
            break;
          case 'custom':
            if (!rule.validator(value)) {
              errors.push({ field, message: message || `${field} is invalid` });
            }
            break;
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
};

export default {
  ValidationError,
  isString,
  isEmail,
  isStrongPassword,
  isObjectId,
  isValidDate,
  isFutureDate,
  isPastDate,
  isPositiveNumber,
  isNonNegativeNumber,
  isInRange,
  isArray,
  isNonEmptyArray,
  arrayMinLength,
  arrayMaxLength,
  isObject,
  hasRequiredKeys,
  isEnum,
  isUrl,
  isPhone,
  createValidator
};