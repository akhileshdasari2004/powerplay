import express from 'express';
import { getSummary, getTopCustomers } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/summary', getSummary);
router.get('/top-customers', getTopCustomers);

export default router;