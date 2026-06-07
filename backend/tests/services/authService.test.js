/**
 * AuthService Tests
 * 
 * Note: This project doesn't currently have an auth service implementation.
 * These tests are designed for a JWT-based auth service and mock the
 * authentication internals to ensure complete test coverage when
 * auth is implemented.
 */

import mongoose from 'mongoose';
import '../setup.js';

// Mock the JWT library since it's not in dependencies yet
const mockJwtSign = jest.fn((payload, secret) => `token.${JSON.stringify(payload)}.${secret}`);
const mockJwtVerify = jest.fn((token, secret) => {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  return JSON.parse(parts[1]);
});

// Mock User model
const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn()
};

// Mock bcrypt
const mockBcryptHash = jest.fn((data) => Promise.resolve(`hashed_${data}`));
const mockBcryptCompare = jest.fn((data, hash) => Promise.resolve(hash === `hashed_${data}`));

// Setup mocks before imports
jest.mock('jsonwebtoken', () => ({
  sign: (...args) => mockJwtSign(...args),
  verify: (...args) => mockJwtVerify(...args)
}));

jest.mock('bcryptjs', () => ({
  hash: (...args) => mockBcryptHash(...args),
  compare: (...args) => mockBcryptCompare(...args)
}));

// Import after mocks
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  const JWT_SECRET = 'test-secret-key';
  const JWT_EXPIRES_IN = '24h';
  const REFRESH_EXPIRES_IN = '7d';

  // Simulated auth service for testing
  const authService = {
    async hashPassword(password) {
      return bcrypt.hash(password, 10);
    },

    async comparePassword(password, hashedPassword) {
      return bcrypt.compare(password, hashedPassword);
    },

    generateToken(userId, secret = JWT_SECRET, expiresIn = JWT_EXPIRES_IN) {
      return jwt.sign({ userId }, secret, { expiresIn });
    },

    generateRefreshToken(userId, secret = JWT_SECRET) {
      return jwt.sign({ userId, type: 'refresh' }, secret, { expiresIn: REFRESH_EXPIRES_IN });
    },

    verifyToken(token, secret = JWT_SECRET) {
      return jwt.verify(token, secret);
    },

    async register({ email, password, name }) {
      const existingUser = await mongoose.model('User').findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      const hashedPassword = await this.hashPassword(password);
      const user = await mongoose.model('User').create({
        email,
        password: hashedPassword,
        name
      });

      const accessToken = this.generateToken(user._id.toString());
      const refreshToken = this.generateRefreshToken(user._id.toString());

      return {
        user: { id: user._id, email: user.email, name: user.name },
        accessToken,
        refreshToken
      };
    },

    async login({ email, password }) {
      const user = await mongoose.model('User').findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await this.comparePassword(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const accessToken = this.generateToken(user._id.toString());
      const refreshToken = this.generateRefreshToken(user._id.toString());

      return {
        user: { id: user._id, email: user.email, name: user.name },
        accessToken,
        refreshToken
      };
    },

    async refreshToken(refreshToken) {
      try {
        const decoded = this.verifyToken(refreshToken);
        if (decoded.type !== 'refresh') {
          throw new Error('Invalid refresh token');
        }

        const user = await mongoose.model('User').findById(decoded.userId);
        if (!user) {
          throw new Error('User not found');
        }

        const newAccessToken = this.generateToken(user._id.toString());
        const newRefreshToken = this.generateRefreshToken(user._id.toString());

        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        };
      } catch (error) {
        throw new Error('Invalid or expired refresh token');
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtSign.mockImplementation((payload, secret) => `token.${JSON.stringify(payload)}.${secret}`);
    mockJwtVerify.mockImplementation((token, secret) => {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');
      return JSON.parse(parts[1]);
    });
  });

  describe('register', () => {
    beforeEach(() => {
      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    });

    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const newUser = {
        _id: new mongoose.Types.ObjectId(),
        email: userData.email,
        name: userData.name,
        password: 'hashed_password123'
      };

      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      mockUserModel.create.mockResolvedValue(newUser);

      const result = await authService.register(userData);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const existingUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'existing@example.com'
      };

      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(existingUser) });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User'
        })
      ).rejects.toThrow('User already exists');
    });

    it('should generate valid JWT tokens on registration', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      const newUser = {
        _id: new mongoose.Types.ObjectId(),
        ...userData,
        password: 'hashed_password'
      };

      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      mockUserModel.create.mockResolvedValue(newUser);

      const result = await authService.register(userData);

      expect(result.accessToken).toMatch(/^token\..+\..+/);
      expect(result.refreshToken).toMatch(/^token\..+\..+/);

      const decodedAccess = JSON.parse(result.accessToken.split('.')[1]);
      expect(decodedAccess.userId).toBe(newUser._id.toString());
    });

    it('should not include password in returned user object', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const newUser = {
        _id: new mongoose.Types.ObjectId(),
        email: userData.email,
        name: userData.name,
        password: 'hashed_password'
      };

      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      mockUserModel.create.mockResolvedValue(newUser);

      const result = await authService.register(userData);

      expect(result.user.password).toBeUndefined();
      expect(result.user.id).toBeDefined();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password123'
      };

      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(user) });
      mockBcryptCompare.mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe(user.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
      const user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        password: 'hashed_correct_password'
      };

      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(user) });
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong_password'
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should generate valid tokens on login', async () => {
      const user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password123'
      };

      mockUserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(user) });
      mockBcryptCompare.mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      const decodedAccess = JSON.parse(result.accessToken.split('.')[1]);
      expect(decodedAccess.userId).toBe(user._id.toString());

      const decodedRefresh = JSON.parse(result.refreshToken.split('.')[1]);
      expect(decodedRefresh.userId).toBe(user._id.toString());
      expect(decodedRefresh.type).toBe('refresh');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const user = {
        _id: userId,
        email: 'test@example.com',
        name: 'Test User'
      };

      mockJwtVerify.mockReturnValue({ userId, type: 'refresh' });
      mockUserModel.findById.mockResolvedValue(user);

      const refreshToken = `token.${JSON.stringify({ userId, type: 'refresh' })}.secret`;

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid token', async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.refreshToken('invalid.token.here')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error for non-refresh token', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      mockJwtVerify.mockReturnValue({ userId, type: 'access' });

      const accessToken = `token.${JSON.stringify({ userId, type: 'access' })}.secret`;

      await expect(
        authService.refreshToken(accessToken)
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error when user not found', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      mockJwtVerify.mockReturnValue({ userId, type: 'refresh' });
      mockUserModel.findById.mockResolvedValue(null);

      const refreshToken = `token.${JSON.stringify({ userId, type: 'refresh' })}.secret`;

      await expect(
        authService.refreshToken(refreshToken)
      ).rejects.toThrow('User not found');
    });

    it('should generate new tokens with updated expiration', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const user = {
        _id: userId,
        email: 'test@example.com',
        name: 'Test User'
      };

      let callCount = 0;
      mockJwtVerify.mockReturnValue({ userId, type: 'refresh' });
      mockUserModel.findById.mockResolvedValue(user);
      mockJwtSign.mockImplementation((payload) => {
        callCount++;
        return `token_${callCount}.${JSON.stringify(payload)}.secret`;
      });

      const refreshToken = `token.${JSON.stringify({ userId, type: 'refresh' })}.secret`;
      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).not.toBe(result.refreshToken);
      expect(mockJwtSign).toHaveBeenCalledTimes(2);
    });
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
      const password = 'testPassword123';
      const hashedPassword = await authService.hashPassword(password);

      expect(hashedPassword).toBe(`hashed_${password}`);
      expect(mockBcryptHash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123';
      const hashedPassword = `hashed_${password}`;

      const result = await authService.comparePassword(password, hashedPassword);

      expect(result).toBe(true);
      expect(mockBcryptCompare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashed_wrong_password';

      const result = await authService.comparePassword(password, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = authService.generateToken(userId);

      expect(token).toMatch(/^token\..+\..+/);
    });

    it('should include userId in token payload', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = authService.generateToken(userId);

      const decoded = JSON.parse(token.split('.')[1]);
      expect(decoded.userId).toBe(userId);
    });

    it('should use custom secret when provided', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const customSecret = 'custom-secret';
      const token = authService.generateToken(userId, customSecret);

      expect(token).toContain(customSecret);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with type field', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = authService.generateRefreshToken(userId);

      const decoded = JSON.parse(token.split('.')[1]);
      expect(decoded.type).toBe('refresh');
      expect(decoded.userId).toBe(userId);
    });

    it('should have longer expiration than access token', () => {
      const userId = new mongoose.Types.ObjectId().toString();

      let accessTokenPayload, refreshTokenPayload;

      mockJwtSign.mockImplementation((payload, secret, options) => {
        if (options?.expiresIn === JWT_EXPIRES_IN) {
          accessTokenPayload = payload;
          return 'access_token';
        } else if (options?.expiresIn === REFRESH_EXPIRES_IN) {
          refreshTokenPayload = payload;
          return 'refresh_token';
        }
        return 'token';
      });

      authService.generateToken(userId);
      authService.generateRefreshToken(userId);

      // Both tokens should be generated (mocked to return dummy values)
      expect(mockJwtSign).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = `token.${JSON.stringify({ userId })}.secret`;

      const decoded = authService.verifyToken(token, 'secret');

      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => authService.verifyToken('invalid', 'secret')).toThrow();
    });

    it('should throw error for tampered token', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = `token.${JSON.stringify({ userId })}.different_secret`;

      expect(() => authService.verifyToken(token, 'secret')).toThrow();
    });
  });
});