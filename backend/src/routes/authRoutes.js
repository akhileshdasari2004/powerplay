/**
 * Auth Routes
 * 
 * Public routes: register, login, refresh
 * Protected routes: logout, me, updatePassword
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  refresh,
  me,
  updatePassword
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.put('/password', authenticate, updatePassword);

export default router;