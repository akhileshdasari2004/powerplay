import express from 'express';
import invoiceRoutes from './invoiceRoutes.js';
import customerRoutes from './customerRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = express.Router();

router.use('/invoices', invoiceRoutes);
router.use('/customers', customerRoutes);
router.use('/analytics', analyticsRoutes);

export default router;