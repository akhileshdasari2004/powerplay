import { customerRepository, invoiceRepository } from '../repositories/index.js';
import ApiError from '../utils/ApiError.js';

class CustomerService {
  async getCustomers({ page = 1, limit = 10, search }) {
    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: `^${escapedSearch}`, $options: 'i' } },
        { company: { $regex: `^${escapedSearch}`, $options: 'i' } },
      ];
    }

    return customerRepository.findAll({ page, limit, filter });
  }

  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }
    return customer;
  }

  async createCustomer(data) {
    return customerRepository.create(data);
  }

  async updateCustomer(id, data) {
    const customer = await customerRepository.updateById(id, data);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }
    return customer;
  }

  async deleteCustomer(id) {
    const customer = await customerRepository.deleteById(id);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }
    return { message: 'Customer deleted successfully' };
  }

  async getCustomerWithInvoices(id, options = {}) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    const { invoices, pagination } = await customerRepository.getCustomerInvoices(id, options);

    return { customer, invoices, pagination };
  }

  async getTopCustomers(limit = 5) {
    const results = await invoiceRepository.aggregate([
      {
        $group: {
          _id: '$customerId',
          totalAmount: { $sum: '$total' },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          invoiceCount: 1,
          name: '$customer.name',
          company: '$customer.company',
        },
      },
    ]);

    return results;
  }

  async customerExists(id) {
    return customerRepository.existsById(id);
  }
}

export default new CustomerService();