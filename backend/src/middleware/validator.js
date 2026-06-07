import { isValidEmail, isValidPassword, isValidObjectId, isValidInvoiceStatus, isValidDateRange } from '../utils/validators.js';
import { ApiError } from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const validateRegister = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.message);
    }
  }

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('. '));
  }

  next();
});

export const validateLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('. '));
  }

  next();
});

export const validateCustomer = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('. '));
  }

  next();
});

export const validateInvoice = catchAsync(async (req, res, next) => {
  const { customerId, amount, taxRate, issueDate, dueDate, status } = req.body;
  const errors = [];

  if (!customerId) {
    errors.push('Customer ID is required');
  } else if (!isValidObjectId(customerId)) {
    errors.push('Invalid customer ID format');
  }

  if (amount === undefined || amount === null) {
    errors.push('Amount is required');
  } else if (typeof amount !== 'number' || amount < 0) {
    errors.push('Amount must be a positive number');
  }

  if (taxRate === undefined || taxRate === null) {
    errors.push('Tax rate is required');
  } else if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
    errors.push('Tax rate must be between 0 and 100');
  }

  if (!issueDate) {
    errors.push('Issue date is required');
  }

  if (!dueDate) {
    errors.push('Due date is required');
  } else if (issueDate && new Date(dueDate) <= new Date(issueDate)) {
    errors.push('Due date must be after issue date');
  }

  if (status && !isValidInvoiceStatus(status)) {
    errors.push('Invalid status. Must be one of: draft, pending, paid, overdue, cancelled');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('. '));
  }

  next();
});

export const validateIdParam = (paramName = 'id') => {
  return catchAsync(async (req, res, next) => {
    const id = req.params[paramName];

    if (!isValidObjectId(id)) {
      throw ApiError.badRequest(`Invalid ${paramName} format`);
    }

    next();
  });
};

export const validateInvoiceQuery = catchAsync(async (req, res, next) => {
  const { issueDateFrom, issueDateTo, dueDateFrom, dueDateTo } = req.query;
  const errors = [];

  if (!isValidDateRange(issueDateFrom, issueDateTo)) {
    errors.push('Issue date range is invalid: start date must be before end date');
  }

  if (!isValidDateRange(dueDateFrom, dueDateTo)) {
    errors.push('Due date range is invalid: start date must be before end date');
  }

  if (req.query.status && !isValidInvoiceStatus(req.query.status)) {
    errors.push('Invalid status filter');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('. '));
  }

  next();
});

export default {
  validateRegister,
  validateLogin,
  validateCustomer,
  validateInvoice,
  validateIdParam,
  validateInvoiceQuery,
};