import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceForm from '../../src/components/InvoiceForm';

// Mock customer API
vi.mock('../../src/services/customerApi', () => ({
  customerApi: {
    list: vi.fn()
  }
}));

const mockCustomers = [
  { _id: 'c1', name: 'Acme Corp', company: 'Tech Solutions' },
  { _id: 'c2', name: 'Globex Inc', company: 'Finance Group' },
  { _id: 'c3', name: 'Umbrella Corp', company: 'Security' }
];

const mockOnSubmit = vi.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
  loading: false,
  initialData: null
};

describe('InvoiceForm', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { customerApi } = await import('../../src/services/customerApi');
    customerApi.list.mockResolvedValue({ data: { customers: mockCustomers } });
  });

  describe('Rendering', () => {
    it('should render all form fields', async () => {
      render(<InvoiceForm {...defaultProps} />);

      expect(screen.getByLabelText(/Customer/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Amount/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tax Rate/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tax/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Issue Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Due Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<InvoiceForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should load customers on mount', async () => {
      const { customerApi } = await import('../../src/services/customerApi');

      render(<InvoiceForm {...defaultProps} />);

      await waitFor(() => {
        expect(customerApi.list).toHaveBeenCalledWith({ limit: 100 });
      });
    });

    it('should populate customer dropdown with options', async () => {
      render(<InvoiceForm {...defaultProps} />);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThanOrEqual(mockCustomers.length + 1); // +1 for "Select customer"
      });
    });
  });

  describe('Validation', () => {
    it('should show error when customer is not selected', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(await screen.findByText(/customer is required/i)).toBeInTheDocument();
    });

    it('should show error when amount is empty', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.selectOptions(screen.getByLabelText(/Customer/), 'c1');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(await screen.findByText(/amount is required/i)).toBeInTheDocument();
    });

    it('should show error when amount is negative', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.selectOptions(screen.getByLabelText(/Customer/), 'c1');
      await user.type(screen.getByLabelText(/Amount/), '-100');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(await screen.findByText(/amount must be greater than or equal to 0/i)).toBeInTheDocument();
    });

    it('should show error when tax rate is empty', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.selectOptions(screen.getByLabelText(/Customer/), 'c1');
      await user.type(screen.getByLabelText(/Amount/), '1000');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(await screen.findByText(/tax rate is required/i)).toBeInTheDocument();
    });

    it('should show error when tax rate exceeds 100', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.selectOptions(screen.getByLabelText(/Customer/), 'c1');
      await user.type(screen.getByLabelText(/Amount/), '1000');
      await user.type(screen.getByLabelText(/Tax Rate/), '150');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(await screen.findByText(/tax rate must be less than or equal to 100/i)).toBeInTheDocument();
    });

    it('should show error when issue date is empty', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.selectOptions(screen.getByLabelText(/Customer/), 'c1');
      await user.type(screen.getByLabelText(/Amount/), '1000');
      await user.type(screen.getByLabelText(/Tax Rate/), '18');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(await screen.findByText(/issue date is required/i)).toBeInTheDocument();
    });

    it('should show error when due date is before issue date', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.selectOptions(screen.getByLabelText(/Customer/), 'c1');
      await user.type(screen.getByLabelText(/Amount/), '1000');
      await user.type(screen.getByLabelText(/Tax Rate/), '18');
      await user.type(screen.getByLabelText(/Issue Date/), '2024-02-15');
      await user.type(screen.getByLabelText(/Due Date/), '2024-02-10');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(await screen.findByText(/due date must be after issue date/i)).toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('should call onSubmit with form data when valid', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.selectOptions(screen.getByLabelText(/Customer/), 'c1');
      await user.type(screen.getByLabelText(/Amount/), '1000');
      await user.type(screen.getByLabelText(/Tax Rate/), '18');
      await user.type(screen.getByLabelText(/Issue Date/), '2024-01-15');
      await user.type(screen.getByLabelText(/Due Date/), '2024-02-15');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            customerId: 'c1',
            amount: '1000',
            taxRate: '18',
            issueDate: '2024-01-15',
            dueDate: '2024-02-15'
          })
        );
      });
    });

    it('should disable submit button when loading', () => {
      render(<InvoiceForm {...defaultProps} loading={true} />);

      const button = screen.getByRole('button', { name: /saving/i });
      expect(button).toBeDisabled();
    });

    it('should show "Saving..." text when loading', () => {
      render(<InvoiceForm {...defaultProps} loading={true} />);

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    it('should not call onSubmit when form is invalid', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate tax correctly', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/Amount/), '1000');
      await user.type(screen.getByLabelText(/Tax Rate/), '18');

      await waitFor(() => {
        const taxInput = screen.getByDisplayValue('180.00');
        expect(taxInput).toBeInTheDocument();
      });
    });

    it('should calculate total correctly', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/Amount/), '1000');
      await user.type(screen.getByLabelText(/Tax Rate/), '18');

      await waitFor(() => {
        const totalInput = screen.getByDisplayValue('1180.00');
        expect(totalInput).toBeInTheDocument();
      });
    });

    it('should update calculations when amount changes', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/Amount/), '2000');
      await user.type(screen.getByLabelText(/Tax Rate/), '10');

      await waitFor(() => {
        expect(screen.getByDisplayValue('200.00')).toBeInTheDocument(); // tax
        expect(screen.getByDisplayValue('2200.00')).toBeInTheDocument(); // total
      });
    });

    it('should handle zero tax rate', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/Amount/), '500');
      await user.type(screen.getByLabelText(/Tax Rate/), '0');

      await waitFor(() => {
        expect(screen.getByDisplayValue('0.00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('500.00')).toBeInTheDocument();
      });
    });

    it('should handle decimal amounts', async () => {
      const user = userEvent.setup();
      render(<InvoiceForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/Amount/), '1234.56');
      await user.type(screen.getByLabelText(/Tax Rate/), '7.5');

      await waitFor(() => {
        const taxInput = screen.getByDisplayValue('92.59');
        expect(taxInput).toBeInTheDocument();
      });
    });
  });

  describe('Initial Data', () => {
    it('should populate form with initial data', async () => {
      const initialData = {
        customerId: 'c2',
        amount: '2500',
        taxRate: '18',
        status: 'pending',
        issueDate: '2024-01-10',
        dueDate: '2024-02-10'
      };

      render(<InvoiceForm {...defaultProps} initialData={initialData} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Amount/)).toHaveValue('2500');
      });
    });

    it('should calculate initial tax and total', async () => {
      const initialData = {
        customerId: 'c1',
        amount: '1000',
        taxRate: '18',
        issueDate: '2024-01-15',
        dueDate: '2024-02-15'
      };

      render(<InvoiceForm {...defaultProps} initialData={initialData} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('180.00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1180.00')).toBeInTheDocument();
      });
    });
  });

  describe('Status Field', () => {
    it('should have status options', async () => {
      render(<InvoiceForm {...defaultProps} />);

      const statusSelect = screen.getByLabelText(/Status/);
      const options = Array.from(statusSelect.querySelectorAll('option'));

      expect(options.some(o => o.textContent === 'Draft')).toBe(true);
      expect(options.some(o => o.textContent === 'Pending')).toBe(true);
      expect(options.some(o => o.textContent === 'Paid')).toBe(true);
      expect(options.some(o => o.textContent === 'Overdue')).toBe(true);
      expect(options.some(o => o.textContent === 'Cancelled')).toBe(true);
    });

    it('should default to draft status', async () => {
      render(<InvoiceForm {...defaultProps} />);

      const statusSelect = screen.getByLabelText(/Status/);
      expect(statusSelect).toHaveValue('draft');
    });
  });
});