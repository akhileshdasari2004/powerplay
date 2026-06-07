import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import '../setup.js';
import invoiceController from '../../controllers/invoiceController.js';
import invoiceService from '../../services/InvoiceService.js';
import Customer from '../../models/Customer.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get('/api/invoices', invoiceController.getInvoices);
  app.get('/api/invoices/:id', invoiceController.getInvoiceById);
  app.post('/api/invoices', invoiceController.createInvoice);
  app.put('/api/invoices/:id', invoiceController.updateInvoice);
  app.delete('/api/invoices/:id', invoiceController.deleteInvoice);
  
  return app;
};

describe('InvoiceController', () => {
  let app;
  let testCustomer;

  beforeEach(async () => {
    app = createTestApp();
    testCustomer = await Customer.create({
      name: 'Test Customer',
      company: 'Test Company'
    });
  });

  describe('GET /api/invoices', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await invoiceService.createInvoice({
          customerId: testCustomer._id,
          amount: 1000 + i * 100,
          taxRate: 18,
          status: i % 2 === 0 ? 'pending' : 'paid',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }
    });

    it('should return 200 with paginated invoices', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .expect(200);

      expect(response.body.invoices).toBeDefined();
      expect(Array.isArray(response.body.invoices)).toBe(true);
      expect(response.body.invoices.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(5);
    });

    it('should accept query parameters', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .query({
          page: 1,
          limit: 10,
          status: 'pending',
          sortBy: 'amount',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.invoices).toBeDefined();
      response.body.invoices.forEach(inv => {
        expect(inv.status).toBe('pending');
      });
    });

    it('should return filtered results by status', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .query({ status: 'paid' })
        .expect(200);

      expect(response.body.invoices.length).toBeGreaterThan(0);
      response.body.invoices.forEach(inv => {
        expect(inv.status).toBe('paid');
      });
    });

    it('should return 200 even with no matching results', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .query({ status: 'nonexistent' })
        .expect(200);

      expect(response.body.invoices).toEqual([]);
    });

    it('should return 500 on service error', async () => {
      const originalGetInvoices = invoiceService.getInvoices;
      invoiceService.getInvoices = jest.fn().mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/invoices')
        .expect(500);

      invoiceService.getInvoices = originalGetInvoices;
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should return 200 with invoice when found', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .get(`/api/invoices/${invoice._id}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.invoiceId).toBe(invoice.invoiceId);
      expect(response.body.customerId.name).toBe('Test Customer');
    });

    it('should return 404 when invoice not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/invoices/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Invoice not found');
    });

    it('should return 500 on invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/invoices/invalid-id')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    it('should return 500 on service error', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const originalGetInvoiceById = invoiceService.getInvoiceById;
      invoiceService.getInvoiceById = jest.fn().mockRejectedValue(new Error('Service error'));

      await request(app)
        .get(`/api/invoices/${fakeId}`)
        .expect(500);

      invoiceService.getInvoiceById = originalGetInvoiceById;
    });
  });

  describe('POST /api/invoices', () => {
    it('should return 201 with created invoice', async () => {
      const invoiceData = {
        customerId: testCustomer._id.toString(),
        amount: 1500,
        taxRate: 18,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/invoices')
        .send(invoiceData)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.invoiceId).toMatch(/^INV-[A-Z0-9]+$/);
      expect(response.body.amount).toBe(1500);
      expect(response.body.tax).toBe(270);
      expect(response.body.total).toBe(1770);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        customerId: testCustomer._id.toString()
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/invoices')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when customer not found', async () => {
      const invoiceData = {
        customerId: new mongoose.Types.ObjectId().toString(),
        amount: 1500,
        taxRate: 18,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await request(app)
        .post('/api/invoices')
        .send(invoiceData)
        .expect(400);
    });

    it('should return 400 when amount is negative', async () => {
      const invoiceData = {
        customerId: testCustomer._id.toString(),
        amount: -100,
        taxRate: 18,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/invoices')
        .send(invoiceData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 500 on service error', async () => {
      const originalCreateInvoice = invoiceService.createInvoice;
      invoiceService.createInvoice = jest.fn().mockRejectedValue(new Error('Creation failed'));

      await request(app)
        .post('/api/invoices')
        .send({
          customerId: testCustomer._id.toString(),
          amount: 1000,
          taxRate: 18,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(400);

      invoiceService.createInvoice = originalCreateInvoice;
    });
  });

  describe('PUT /api/invoices/:id', () => {
    it('should return 200 with updated invoice', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .put(`/api/invoices/${invoice._id}`)
        .send({ status: 'paid' })
        .expect(200);

      expect(response.body.status).toBe('paid');
      expect(response.body.invoiceId).toBe(invoice.invoiceId);
    });

    it('should recalculate totals when amount changes', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 10,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .put(`/api/invoices/${invoice._id}`)
        .send({ amount: 2000 })
        .expect(200);

      expect(response.body.amount).toBe(2000);
      expect(response.body.tax).toBe(200);
      expect(response.body.total).toBe(2200);
    });

    it('should return 404 when invoice not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/invoices/${fakeId}`)
        .send({ status: 'paid' })
        .expect(404);

      expect(response.body.error).toBe('Invoice not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .put(`/api/invoices/${invoice._id}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 500 on service error', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const originalUpdateInvoice = invoiceService.updateInvoice;
      invoiceService.updateInvoice = jest.fn().mockRejectedValue(new Error('Update failed'));

      await request(app)
        .put(`/api/invoices/${invoice._id}`)
        .send({ status: 'paid' })
        .expect(400);

      invoiceService.updateInvoice = originalUpdateInvoice;
    });
  });

  describe('DELETE /api/invoices/:id', () => {
    it('should return 200 on successful deletion', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .delete(`/api/invoices/${invoice._id}`)
        .expect(200);

      expect(response.body.message).toBe('Invoice deleted');
    });

    it('should return 404 when invoice not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/invoices/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Invoice not found');
    });

    it('should return 500 on service error', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const originalDeleteInvoice = invoiceService.deleteInvoice;
      invoiceService.deleteInvoice = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await request(app)
        .delete(`/api/invoices/${invoice._id}`)
        .expect(500);

      invoiceService.deleteInvoice = originalDeleteInvoice;
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .send({ amount: 1000 })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle string instead of ObjectId for customerId', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .send({
          customerId: 'not-a-valid-objectid',
          amount: 1000,
          taxRate: 18,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});