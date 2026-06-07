import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

class CustomerRepository {
  async findAll({ page = 1, limit = 10, filter = {} }) {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(filter).skip(skip).limit(limit).sort({ name: 1 }).lean(),
      Customer.countDocuments(filter),
    ]);

    return { customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id) {
    return Customer.findById(id).lean();
  }

  async create(customerData) {
    return Customer.create(customerData);
  }

  async updateById(id, updateData) {
    return Customer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
  }

  async deleteById(id) {
    return Customer.findByIdAndDelete(id);
  }

  async existsById(id) {
    const count = await Customer.countDocuments({ _id: id });
    return count > 0;
  }

  async count(filter = {}) {
    return Customer.countDocuments(filter);
  }

  async getCustomerInvoices(customerId, options = {}) {
    const { page = 1, limit = 10, sortBy = 'issueDate', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [invoices, total] = await Promise.all([
      Invoice.find({ customerId })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select('invoiceId amount tax total status issueDate dueDate createdAt')
        .lean(),
      Invoice.countDocuments({ customerId }),
    ]);

    return { invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

export default new CustomerRepository();