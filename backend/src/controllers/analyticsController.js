import { analyticsService, customerService } from '../services/index.js';
import catchAsync from '../utils/catchAsync.js';

const getSummary = catchAsync(async (req, res) => {
  const summary = await analyticsService.getSummary();
  res.status(200).json({
    status: 'success',
    data: { summary },
  });
});

const getTopCustomers = catchAsync(async (req, res) => {
  const { limit = 5 } = req.query;
  const customers = await customerService.getTopCustomers(parseInt(limit, 10));
  res.status(200).json({
    status: 'success',
    data: { customers },
  });
});

const getRevenueByPeriod = catchAsync(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  const revenue = await analyticsService.getRevenueByPeriod({ startDate, endDate, groupBy });
  res.status(200).json({
    status: 'success',
    data: { revenue },
  });
});

const getOverdueInvoices = catchAsync(async (req, res) => {
  const invoices = await analyticsService.getOverdueInvoices();
  res.status(200).json({
    status: 'success',
    data: { invoices },
  });
});

const getCustomerStats = catchAsync(async (req, res) => {
  const stats = await analyticsService.getCustomerStats(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

export { getSummary, getTopCustomers, getRevenueByPeriod, getOverdueInvoices, getCustomerStats };
export default {
  getSummary,
  getTopCustomers,
  getRevenueByPeriod,
  getOverdueInvoices,
  getCustomerStats,
};