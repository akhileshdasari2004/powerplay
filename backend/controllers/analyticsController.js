import analyticsService from '../services/AnalyticsService.js';
import customerService from '../services/CustomerService.js';

const getSummary = async (req, res) => {
  try {
    const summary = await analyticsService.getSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTopCustomers = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const customers = await customerService.getTopCustomers(parseInt(limit, 10));
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { getSummary, getTopCustomers };