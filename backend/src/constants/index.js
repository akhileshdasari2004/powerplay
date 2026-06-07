export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const JWT_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
};

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000,
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 10,
};

export const BCRYPT_ROUNDS = 12;

export const VALID_SORT_FIELDS = ['amount', 'dueDate', 'issueDate', 'createdAt'];
export const VALID_STATUS_VALUES = ['draft', 'pending', 'paid', 'overdue', 'cancelled'];

export default {
  HTTP_STATUS,
  INVOICE_STATUS,
  USER_ROLES,
  PAGINATION,
  JWT_EXPIRY,
  RATE_LIMIT,
  BCRYPT_ROUNDS,
  VALID_SORT_FIELDS,
  VALID_STATUS_VALUES,
};