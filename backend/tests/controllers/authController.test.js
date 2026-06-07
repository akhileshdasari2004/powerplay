import authController from '../../src/controllers/authController.js';
import { authService } from '../../src/services/index.js';

jest.mock('../../src/services/index.js');

describe('AuthController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      user: { _id: 'user123' },
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register user and return 201', async () => {
      const mockUser = { name: 'Test', email: 'test@test.com' };
      const mockResult = { user: mockUser, accessToken: 'token123' };
      authService.register.mockResolvedValue(mockResult);

      mockReq.body = { name: 'Test', email: 'test@test.com', password: 'Password123' };

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult,
      });
    });
  });

  describe('login', () => {
    it('should login user and return 200', async () => {
      const mockUser = { name: 'Test', email: 'test@test.com' };
      const mockResult = { user: mockUser, accessToken: 'token123' };
      authService.login.mockResolvedValue(mockResult);

      mockReq.body = { email: 'test@test.com', password: 'Password123' };

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and return 200', async () => {
      authService.refreshToken.mockResolvedValue({ accessToken: 'newToken' });

      await authController.refreshToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { accessToken: 'newToken' },
      });
    });
  });

  describe('logout', () => {
    it('should logout user and return 200', async () => {
      authService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      await authController.logout(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Logged out successfully',
      });
    });
  });

  describe('changePassword', () => {
    it('should change password and return 200', async () => {
      authService.changePassword.mockResolvedValue({ message: 'Password changed successfully' });
      mockReq.body = { currentPassword: 'old', newPassword: 'new' };

      await authController.changePassword(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const mockUser = { name: 'Test', email: 'test@test.com' };
      authService.getMe.mockResolvedValue(mockUser);

      await authController.getMe(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { user: mockUser },
      });
    });
  });
});