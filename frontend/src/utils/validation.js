import { VALIDATION_PATTERNS, ERROR_MESSAGES } from '../constants';

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, error: ERROR_MESSAGES.REQUIRED };
  }

  if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_EMAIL };
  }

  return { valid: true, error: null };
}

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: ERROR_MESSAGES.REQUIRED };
  }

  if (password.length < VALIDATION_PATTERNS.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }

  return { valid: true, error: null };
}

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePasswordConfirm(password, confirmPassword) {
  if (!confirmPassword) {
    return { valid: false, error: ERROR_MESSAGES.REQUIRED };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: ERROR_MESSAGES.PASSWORD_MISMATCH };
  }

  return { valid: true, error: null };
}

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return { valid: true, error: null }; // Phone is optional
  }

  if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_PHONE };
  }

  return { valid: true, error: null };
}

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of field for error message
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateRequired(value, fieldName = 'This field') {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  return { valid: true, error: null };
}

/**
 * Validate invoice number
 * @param {string} invoiceNumber - Invoice number to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateInvoiceNumber(invoiceNumber) {
  if (!invoiceNumber || !invoiceNumber.trim()) {
    return { valid: false, error: ERROR_MESSAGES.REQUIRED };
  }

  if (invoiceNumber.length < 3) {
    return { valid: false, error: 'Invoice number must be at least 3 characters' };
  }

  return { valid: true, error: null };
}

/**
 * Validate amount
 * @param {number|string} amount - Amount to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return { valid: false, error: ERROR_MESSAGES.REQUIRED };
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Please enter a valid amount' };
  }

  if (numAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  return { valid: true, error: null };
}

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {string} fieldName - Name of field for error message
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateDate(date, fieldName = 'Date') {
  if (!date) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `Please enter a valid ${fieldName.toLowerCase()}` };
  }

  return { valid: true, error: null };
}

/**
 * Validate login form
 * @param {Object} data - Form data
 * @returns {Object} Validation errors
 */
export function validateLoginForm(data) {
  const errors = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error;

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) errors.password = passwordResult.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate registration form
 * @param {Object} data - Form data
 * @returns {Object} Validation errors
 */
export function validateRegisterForm(data) {
  const errors = {};

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error;

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) errors.password = passwordResult.error;

  const confirmResult = validatePasswordConfirm(data.password, data.confirmPassword);
  if (!confirmResult.valid) errors.confirmPassword = confirmResult.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate invoice form
 * @param {Object} data - Form data
 * @returns {Object} Validation errors
 */
export function validateInvoiceForm(data) {
  const errors = {};

  if (!data.customerId) {
    errors.customerId = 'Customer is required';
  }

  const invoiceNumberResult = validateInvoiceNumber(data.invoiceNumber);
  if (!invoiceNumberResult.valid) errors.invoiceNumber = invoiceNumberResult.error;

  const dueDateResult = validateDate(data.dueDate, 'Due date');
  if (!dueDateResult.valid) errors.dueDate = dueDateResult.error;

  if (!data.items || data.items.length === 0) {
    errors.items = 'At least one line item is required';
  } else {
    data.items.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors[`items.${index}.description`] = 'Description is required';
      }
      const amountResult = validateAmount(item.amount);
      if (!amountResult.valid) {
        errors[`items.${index}.amount`] = amountResult.error;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}