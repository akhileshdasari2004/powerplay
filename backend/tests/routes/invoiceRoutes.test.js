import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import '../setup.js';
import invoiceRoutes from '../../routes/invoiceRoutes.js';
import invoiceService from '../../services/InvoiceService.js';
import Customer from '../../models/Customer.js';

// Mock authentication middleware
const mockAuthMiddleware = jest.fn((req, res, next) => {
  if (req.headers.authorization === 'Bearer valid-token') {
    req.user = { id: new mongoose.Types.ObjectId(), role: 'user' };
    return next();
  }
  if (req.headers.authorization === 'Bearer admin-token') {
    req.user = { id: new mongoose.Types.ObjectId(), role: 'admin' };
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
});

// Create test app with routes
const createTestApp = (authMiddleware = mockAuthMiddleware) => {
  const app = express();
  app.use(express.json());
  app.use('/api/invoices', authMiddleware, invoiceRoutes);
  return app;
};

describe('InvoiceRoutes', () => {
  let app;
  let testCustomer;

  beforeEach(async () => {
    app = createTestApp();
    testCustomer = await Customer.create({
      name: 'Test Customer',
      company: 'Test Company'
    });
  });

  describe('Authentication', () => {
    it('should return 401 when no authorization header provided', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should call next() when valid token provided', async () => {
      await request(app)
        .get('/api/invoices')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should accept admin token', async () => {
      await request(app)
        .get('/api/invoices')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);
    });

    it('should reject expired token format', async () => {
      await request(app)
        .get('/api/invoices')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/invoices', () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await invoiceService.createInvoice({
          customerId: testCustomer._id,
          amount: 1000 + i * 100,
          taxRate: 18,
          status: 'pending',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }
    });

    it('should return invoices with valid auth', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.invoices).toBeDefined();
      expect(response.body.invoices.length).toBe(3);
    });

    it('should support pagination query params', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .query({ page: 1, limit: 2 })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.invoices.length).toBe(2);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should support filter query params', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .query({ status: 'pending' })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      response.body.invoices.forEach(inv => {
        expect(inv.status).toBe('pending');
      });
    });
  });

  describe('GET /api/invoices/:id', () => {
    let testInvoice;

    beforeEach(async () => {
      testInvoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        status: 'pending',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should return single invoice by ID', async () => {
      const response = await request(app)
        .get(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.invoiceId).toBe(testInvoice.invoiceId);
    });

    it('should return 404 for non-existent invoice', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/invoices/${fakeId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error).toBe('Invoice not found');
    });
  });

  describe('POST /api/invoices', () => {
    it('should create invoice with valid data', async () => {
      const invoiceData = {
        customerId: testCustomer._id.toString(),
        amount: 2000,
        taxRate: 18,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', 'Bearer valid-token')
        .send(invoiceData)
        .expect(201);

      expect(response.body.invoiceId).toMatch(/^INV-/);
      expect(response.body.amount).toBe(2000);
    });

    it('should return 400 for invalid invoice data', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: -100 })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', 'Bearer valid-token')
        .send({ customerId: testCustomer._id.toString() })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/invoices/:id', () => {
    let testInvoice;

    beforeEach(async () => {
      testInvoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        status: 'pending',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should update invoice', async () => {
      const response = await request(app)
        .put(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'paid' })
        .expect(200);

      expect(response.body.status).toBe('paid');
    });

    it('should return 404 for non-existent invoice', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/invoices/${fakeId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'paid' })
        .expect(404);

      expect(response.body.error).toBe('Invoice not found');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'invalid' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/invoices/:id', () => {
    let testInvoice;

    beforeEach(async () => {
      testInvoice = await invoiceService.createInvoice({
        customerId: testCustomer._id,
        amount: 1000,
        taxRate: 18,
        status: 'pending',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should delete invoice', async () => {
      const response = await request(app)
        .delete(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Invoice deleted');
    });

    it('should return 404 for non-existent invoice', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/invoices/${fakeId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error).toBe('Invoice not found');
    });
  });
});