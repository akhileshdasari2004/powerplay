import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;

const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: ApiError.tooManyRequests('Too many requests from this IP. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: ApiError.tooManyRequests('Too many authentication attempts. Please try again in 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: ApiError.tooManyRequests('Too many API requests. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

export { globalLimiter, authLimiter, apiLimiter };
export default { globalLimiter, authLimiter, apiLimiter };