import CustomerService from '../../src/services/customerService.js';
import CustomerRepository from '../../src/repositories/customerRepository.js';

jest.mock('../../src/repositories/customerRepository.js');

describe('CustomerService', () => {
  let customerService;
  let mockCustomerRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    customerService = new CustomerService();
    mockCustomerRepository = require('../../src/repositories/customerRepository.js');
  });

  describe('getCustomers', () => {
    it('should return paginated customers', async () => {
      const mockData = {
        customers: [{ _id: '1', name: 'Test Customer', company: 'Test Co' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };
      mockCustomerRepository.findAll.mockResolvedValue(mockData);

      const result = await customerService.getCustomers({ page: 1, limit: 10 });

      expect(result).toEqual(mockData);
      expect(mockCustomerRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        filter: {},
      });
    });

    it('should apply search filter', async () => {
      const mockData = {
        customers: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };
      mockCustomerRepository.findAll.mockResolvedValue(mockData);

      await customerService.getCustomers({ search: 'test' });

      expect(mockCustomerRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        filter: {
          $or: [
            { name: { $regex: '^test', $options: 'i' } },
            { company: { $regex: '^test', $options: 'i' } },
          ],
        },
      });
    });
  });

  describe('getCustomerById', () => {
    it('should return customer when found', async () => {
      const mockCustomer = { _id: '1', name: 'Test', company: 'Co' };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerById('1');

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFound error when customer does not exist', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(customerService.getCustomerById('nonexistent')).rejects.toThrow(
        'Customer not found'
      );
    });
  });

  describe('createCustomer', () => {
    it('should create and return customer', async () => {
      const customerData = { name: 'New Customer', company: 'New Co' };
      const mockCustomer = { _id: '2', ...customerData };
      mockCustomerRepository.create.mockResolvedValue(mockCustomer);

      const result = await customerService.createCustomer(customerData);

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerRepository.create).toHaveBeenCalledWith(customerData);
    });
  });

  describe('updateCustomer', () => {
    it('should update and return customer', async () => {
      const updateData = { name: 'Updated Name' };
      const mockCustomer = { _id: '1', ...updateData };
      mockCustomerRepository.updateById.mockResolvedValue(mockCustomer);

      const result = await customerService.updateCustomer('1', updateData);

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFound when customer does not exist', async () => {
      mockCustomerRepository.updateById.mockResolvedValue(null);

      await expect(customerService.updateCustomer('nonexistent', {})).rejects.toThrow(
        'Customer not found'
      );
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer and return success message', async () => {
      mockCustomerRepository.deleteById.mockResolvedValue({ _id: '1' });

      const result = await customerService.deleteCustomer('1');

      expect(result).toEqual({ message: 'Customer deleted successfully' });
    });

    it('should throw NotFound when customer does not exist', async () => {
      mockCustomerRepository.deleteById.mockResolvedValue(null);

      await expect(customerService.deleteCustomer('nonexistent')).rejects.toThrow(
        'Customer not found'
      );
    });
  });
});