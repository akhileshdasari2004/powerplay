import { invoiceRepository, customerRepository } from '../repositories/index.js';

class AnalyticsService {
  async getSummary() {
    const [totalInvoices, totalRevenue, statusBreakdown, recentInvoices] = await Promise.all([
      invoiceRepository.count(),
      invoiceRepository.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      invoiceRepository.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total' } } },
      ]),
      invoiceRepository.findAll({ page: 1, limit: 5, sortOptions: { createdAt: -1 } }),
    ]);

    return {
      totalInvoices,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = { count: item.count, amount: item.amount };
        return acc;
      }, {}),
      recentInvoices: recentInvoices.invoices,
    };
  }

  async getRevenueByPeriod({ startDate, endDate, groupBy = 'day' }) {
    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.issueDate = {};
      if (startDate) matchStage.issueDate.$gte = new Date(startDate);
      if (endDate) matchStage.issueDate.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: '$issueDate' } },
          },
          totalRevenue: { $sum: '$total' },
          totalTax: { $sum: '$tax' },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.period': 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id.period',
          totalRevenue: 1,
          totalTax: 1,
          invoiceCount: 1,
        },
      },
    ];

    return invoiceRepository.aggregate(pipeline);
  }

  async getOverdueInvoices() {
    const now = new Date();

    const results = await invoiceRepository.aggregate([
      {
        $match: {
          status: 'pending',
          dueDate: { $lt: now },
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          invoiceId: 1,
          customer: { _id: '$customer._id', name: '$customer.name', company: '$customer.company' },
          total: 1,
          dueDate: 1,
          daysOverdue: {
            $divide: [{ $subtract: [now, '$dueDate'] }, { $multiply: [24, 60, 60, 1000] }],
          },
        },
      },
      { $sort: { daysOverdue: -1 } },
    ]);

    return results;
  }

  async getCustomerStats(customerId) {
    const [stats, invoices] = await Promise.all([
      invoiceRepository.aggregate([
        { $match: { customerId: customerId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$total' },
          },
        },
      ]),
      invoiceRepository.findAll({ page: 1, limit: 10, filter: { customerId } }),
    ]);

    const statusBreakdown = stats.reduce((acc, item) => {
      acc[item._id] = { count: item.count, totalAmount: item.totalAmount };
      return acc;
    }, {});

    const totalStats = stats.reduce(
      (acc, item) => {
        acc.totalInvoices += item.count;
        acc.totalAmount += item.totalAmount;
        return acc;
      },
      { totalInvoices: 0, totalAmount: 0 }
    );

    return {
      ...totalStats,
      statusBreakdown,
      recentInvoices: invoices.invoices,
    };
  }
}

export default new AnalyticsService();