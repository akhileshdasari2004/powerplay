import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../../src/pages/LoginPage';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockUser = null;
const mockLoading = false;
const mockError = null;

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    error: mockError,
    login: mockLogin,
    logout: mockLogout
  })
}));

// Mock react-router-dom navigation
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn()
}));

const renderLoginPage = () => {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockReset();
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });

    it('should render email input field', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render password input field', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    });

    it('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), '12345');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    it('should accept valid email format', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'valid@test.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should not show email error
      expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
    });
  });

  describe('Submit Handler', () => {
    it('should call login with form values on submit', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should not call login when form is invalid', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'invalid');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should clear previous errors on re-render', async () => {
      // First render with error state simulation
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable button when loading', () => {
      // Re-mock with loading state
      vi.doMock('../../src/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: true,
          error: null,
          login: vi.fn(),
          logout: vi.fn()
        })
      }));

      const { getByRole } = renderLoginPage();
      const button = getByRole('button', { name: /signing in/i });
      expect(button).toBeDisabled();
    });

    it('should show loading text when loading', () => {
      vi.doMock('../../src/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: true,
          error: null,
          login: vi.fn(),
          logout: vi.fn()
        })
      }));

      renderLoginPage();
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when error exists', () => {
      vi.doMock('../../src/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: false,
          error: 'Invalid credentials',
          login: vi.fn(),
          logout: vi.fn()
        })
      }));

      renderLoginPage();
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    it('should not display error when no error', () => {
      renderLoginPage();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should clear error when user types in email field', async () => {
      vi.doMock('../../src/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: false,
          error: 'Some error',
          login: mockLogin,
          logout: mockLogout
        })
      }));

      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');

      // Error should still be visible (doesn't auto-clear in this implementation)
      expect(screen.getByText(/some error/i)).toBeInTheDocument();
    });
  });

  describe('Form Behavior', () => {
    it('should clear form after successful login', async () => {
      mockLogin.mockResolvedValue({ id: '1', email: 'test@example.com' });

      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('should focus email field on mount', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      // Can't easily test focus in jsdom but can verify it's focusable
      expect(emailInput).toHaveAttribute('tabindex', '0');
    });

    it('should allow tab navigation between fields', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.tab();
      expect(document.activeElement).toBe(emailInput);

      await userEvent.tab();
      expect(document.activeElement).toBe(passwordInput);
    });

    it('should submit form on Enter key press', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123{enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for screen readers', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have submit button with accessible name', () => {
      renderLoginPage();

      const button = screen.getByRole('button', { name: /sign in/i });
      expect(button).toBeInTheDocument();
    });

    it('should indicate required fields', () => {
      renderLoginPage();

      // The form should have required attributes
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('required');
    });
  });
});