import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/authRoutes.js';
import authController from '../../src/controllers/authController.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

jest.mock('../../src/controllers/authController.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

describe('AuthRoutes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('POST /auth/register', () => {
    it('should call register controller', async () => {
      authController.register.mockImplementation((req, res) => {
        res.status(201).json({ status: 'success', data: { user: {}, accessToken: 'token' } });
      });

      const response = await request(app)
        .post('/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'Password123' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(authController.register).toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should call login controller', async () => {
      authController.login.mockImplementation((req, res) => {
        res.status(200).json({ status: 'success', data: { user: {}, accessToken: 'token' } });
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'Password123' });

      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call refresh controller', async () => {
      authController.refreshToken.mockImplementation((req, res) => {
        res.status(200).json({ status: 'success', data: { accessToken: 'newToken' } });
      });

      const response = await request(app).post('/auth/refresh').send();

      expect(response.status).toBe(200);
      expect(authController.refreshToken).toHaveBeenCalled();
    });
  });
});