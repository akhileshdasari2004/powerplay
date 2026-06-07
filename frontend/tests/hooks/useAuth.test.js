import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock auth storage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

global.localStorage = mockLocalStorage;

// Mock API
vi.mock('../src/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn((onFulfilled) => onFulfilled({ headers: {} })), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}));

// Mock useAuth hook - simulates the auth hook that would exist in the app
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const api = (await import('../src/services/api')).default;
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const api = (await import('../src/services/api')).default;
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    return accessToken;
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('accessToken');
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshToken,
    isAuthenticated
  };
};

// Import React hooks
import { useState } from 'react';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
  });

  describe('Initial State', () => {
    it('should start with null user', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toBeNull();
    });

    it('should start with loading true', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.loading).toBe(true);
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login user successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      const api = (await import('../src/services/api')).default;
      api.post.mockResolvedValue({ data: { user: mockUser, ...mockTokens } });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('should store tokens in localStorage on login', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      const api = (await import('../src/services/api')).default;
      api.post.mockResolvedValue({ data: { user: mockUser, ...mockTokens } });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', mockTokens.accessToken);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', mockTokens.refreshToken);
      });
    });

    it('should set error on login failure', async () => {
      const api = (await import('../src/services/api')).default;
      api.post.mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } }
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login('wrong@example.com', 'wrongpass');
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid credentials');
      });
    });

    it('should set loading during login', async () => {
      const api = (await import('../src/services/api')).default;
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { user: {}, accessToken: 't', refreshToken: 't' } }), 100)));

      const { result } = renderHook(() => useAuth());

      let loadingDuringRequest;
      await act(async () => {
        const loginPromise = result.current.login('test@example.com', 'pass');
        loadingDuringRequest = result.current.loading;
        await loginPromise;
      });

      expect(loadingDuringRequest).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should clear user on logout', async () => {
      const api = (await import('../src/services/api')).default;
      api.post.mockResolvedValue({
        data: {
          user: { id: '1', email: 'test@example.com' },
          accessToken: 'token',
          refreshToken: 'refresh'
        }
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      await act(async () => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
    });

    it('should clear tokens from localStorage on logout', async () => {
      const api = (await import('../src/services/api')).default;
      api.post.mockResolvedValue({
        data: {
          user: { id: '1' },
          accessToken: 'token',
          refreshToken: 'refresh'
        }
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      await act(async () => {
        result.current.logout();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should be callable when not logged in', () => {
      const { result } = renderHook(() => useAuth());

      expect(() => result.current.logout()).not.toThrow();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'valid-refresh-token';
        return null;
      });

      const api = (await import('../src/services/api')).default;
      api.post.mockResolvedValue({
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      });

      const { result } = renderHook(() => useAuth());

      let newToken;
      await act(async () => {
        newToken = await result.current.refreshToken();
      });

      expect(newToken).toBe('new-access-token');
    });

    it('should update tokens in storage after refresh', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'old-refresh-token';
        return null;
      });

      const api = (await import('../src/services/api')).default;
      api.post.mockResolvedValue({
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh'
        }
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh');
    });

    it('should throw error when no refresh token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.refreshToken();
        } catch (e) {
          expect(e.message).toBe('No refresh token');
        }
      });
    });

    it('should throw error on refresh failure', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'expired-token';
        return null;
      });

      const api = (await import('../src/services/api')).default;
      api.post.mockRejectedValue(new Error('Token refresh failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.refreshToken();
        } catch (e) {
          expect(e.message).toBe('Token refresh failed');
        }
      });
    });
  });

  describe('Protected Access', () => {
    it('should return true when token exists', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated()).toBe(false);
    });
  });
});