import InvoiceService from '../../src/services/invoiceService.js';
import { invoiceRepository, customerRepository } from '../../src/repositories/index.js';

jest.mock('../../src/repositories/index.js');

describe('InvoiceService', () => {
  let invoiceService;

  beforeEach(() => {
    jest.clearAllMocks();
    invoiceService = new InvoiceService();
  });

  describe('getInvoices', () => {
    it('should return paginated invoices with default options', async () => {
      const mockData = {
        invoices: [{ invoiceId: 'INV-123', amount: 100 }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };
      invoiceRepository.findAll.mockResolvedValue(mockData);

      const result = await invoiceService.getInvoices({});

      expect(result).toEqual(mockData);
      expect(invoiceRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        filter: {},
        sortOptions: { dueDate: 1 },
      });
    });

    it('should apply status filter', async () => {
      const mockData = { invoices: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      invoiceRepository.findAll.mockResolvedValue(mockData);

      await invoiceService.getInvoices({ status: 'paid' });

      expect(invoiceRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        filter: { status: 'paid' },
        sortOptions: { dueDate: 1 },
      });
    });

    it('should apply date range filters', async () => {
      const mockData = { invoices: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      invoiceRepository.findAll.mockResolvedValue(mockData);

      await invoiceService.getInvoices({
        issueDateFrom: '2024-01-01',
        issueDateTo: '2024-12-31',
      });

      expect(invoiceRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        filter: {
          issueDate: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-12-31'),
          },
        },
        sortOptions: { dueDate: 1 },
      });
    });

    it('should throw error for invalid customer ID', async () => {
      await expect(
        invoiceService.getInvoices({ customerId: 'invalid-id' })
      ).rejects.toThrow('Invalid customer ID format');
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice when found', async () => {
      const mockInvoice = { invoiceId: 'INV-123', amount: 100 };
      invoiceRepository.findById.mockResolvedValue(mockInvoice);

      const result = await invoiceService.getInvoiceById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFound when invoice does not exist', async () => {
      invoiceRepository.findById.mockResolvedValue(null);

      await expect(
        invoiceService.getInvoiceById('507f1f77bcf86cd799439011')
      ).rejects.toThrow('Invoice not found');
    });
  });

  describe('createInvoice', () => {
    it('should create invoice with calculated tax and total', async () => {
      customerRepository.existsById.mockResolvedValue(true);
      invoiceRepository.create.mockResolvedValue({
        invoiceId: 'INV-ABC',
        customerId: '507f1f77bcf86cd799439011',
        amount: 100,
        taxRate: 10,
        tax: 10,
        total: 110,
      });

      const result = await invoiceService.createInvoice({
        customerId: '507f1f77bcf86cd799439011',
        amount: 100,
        taxRate: 10,
        issueDate: new Date(),
        dueDate: new Date(),
      });

      expect(result.tax).toBe(10);
      expect(result.total).toBe(110);
      expect(result.invoiceId).toMatch(/^INV-/);
    });

    it('should throw error when customer does not exist', async () => {
      customerRepository.existsById.mockResolvedValue(false);

      await expect(
        invoiceService.createInvoice({
          customerId: '507f1f77bcf86cd799439011',
          amount: 100,
          taxRate: 10,
          issueDate: new Date(),
          dueDate: new Date(),
        })
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('updateInvoice', () => {
    it('should recalculate tax when amount changes', async () => {
      invoiceRepository.findById.mockResolvedValue({
        invoiceId: 'INV-123',
        amount: 100,
        taxRate: 10,
        tax: 10,
        total: 110,
      });
      customerRepository.existsById.mockResolvedValue(true);
      invoiceRepository.updateById.mockResolvedValue({
        invoiceId: 'INV-123',
        amount: 200,
        taxRate: 10,
        tax: 20,
        total: 220,
      });

      const result = await invoiceService.updateInvoice('507f1f77bcf86cd799439011', {
        amount: 200,
      });

      expect(result.tax).toBe(20);
      expect(result.total).toBe(220);
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      invoiceRepository.deleteById.mockResolvedValue({ _id: '1' });

      const result = await invoiceService.deleteInvoice('507f1f77bcf86cd799439011');

      expect(result).toEqual({ message: 'Invoice deleted successfully' });
    });

    it('should throw NotFound when invoice does not exist', async () => {
      invoiceRepository.deleteById.mockResolvedValue(null);

      await expect(
        invoiceService.deleteInvoice('507f1f77bcf86cd799439011')
      ).rejects.toThrow('Invoice not found');
    });
  });
});