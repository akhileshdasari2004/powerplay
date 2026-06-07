import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

class CustomerService {
  async getCustomers({ page = 1, limit = 10, search }) {
    const filter = {};
    if (search) {
      // Escape special regex characters to prevent injection and anchor for performance
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: `^${escapedSearch}`, $options: 'i' } },
        { company: { $regex: `^${escapedSearch}`, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      Customer.countDocuments(filter)
    ]);

    return {
      customers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getCustomerById(id) {
    return Customer.findById(id);
  }

  async createCustomer(data) {
    return Customer.create(data);
  }

  async updateCustomer(id, data) {
    return Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteCustomer(id) {
    return Customer.findByIdAndDelete(id);
  }

  async getCustomerWithInvoices(id) {
    const customer = await Customer.findById(id);
    if (!customer) return null;

    const invoices = await Invoice.find({ customerId: id })
      .sort({ issueDate: -1 })
      .select('invoiceId amount tax total status issueDate dueDate');

    return { customer, invoices };
  }

  async getTopCustomers(limit = 5) {
    return Invoice.aggregate([
      {
        $group: {
          _id: '$customerId',
          totalAmount: { $sum: '$total' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          invoiceCount: 1,
          name: '$customer.name',
          company: '$customer.company'
        }
      }
    ]);
  }
}

export default new CustomerService();