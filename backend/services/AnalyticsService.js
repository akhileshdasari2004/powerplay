import Invoice from '../models/Invoice.js';

class AnalyticsService {
  async getSummary() {
    const [totalInvoices, totalRevenue, statusBreakdown] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Invoice.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total' } } }
      ])
    ]);

    return {
      totalInvoices,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = { count: item.count, amount: item.amount };
        return acc;
      }, {})
    };
  }
}

export default new AnalyticsService();