import express from 'express';
import { analyticsController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', analyticsController.getSummary);
router.get('/top-customers', analyticsController.getTopCustomers);
router.get('/revenue', analyticsController.getRevenueByPeriod);
router.get('/overdue', analyticsController.getOverdueInvoices);
router.get('/customer/:id/stats', analyticsController.getCustomerStats);

export default router;