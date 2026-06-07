import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import InvoiceTable from '../../src/components/InvoiceTable';

const mockInvoices = [
  {
    _id: '1',
    invoiceId: 'INV-001',
    customerId: { _id: 'c1', name: 'Acme Corp', company: 'Tech' },
    amount: 1000,
    tax: 180,
    total: 1180,
    status: 'pending',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15'
  },
  {
    _id: '2',
    invoiceId: 'INV-002',
    customerId: { _id: 'c2', name: 'Globex Inc', company: 'Finance' },
    amount: 2500,
    tax: 450,
    total: 2950,
    status: 'paid',
    issueDate: '2024-01-10',
    dueDate: '2024-02-10'
  }
];

const renderWithRouter = (component) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('InvoiceTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with headers', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      expect(screen.getByText('Invoice ID')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Tax')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Issue Date')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render invoice data correctly', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('INV-002')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Globex Inc')).toBeInTheDocument();
    });

    it('should format currency correctly', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      expect(screen.getByText('₹1,000.00')).toBeInTheDocument();
      expect(screen.getByText('₹2,500.00')).toBeInTheDocument();
      expect(screen.getByText('₹180.00')).toBeInTheDocument();
      expect(screen.getByText('₹1,180.00')).toBeInTheDocument();
    });

    it('should render status badges with correct styles', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      const pendingBadge = screen.getByText('pending');
      const paidBadge = screen.getByText('paid');

      expect(pendingBadge).toBeInTheDocument();
      expect(paidBadge).toBeInTheDocument();
      expect(pendingBadge.className).toContain('yellow');
      expect(paidBadge.className).toContain('green');
    });

    it('should render customer links', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      const customerLinks = screen.getAllByRole('link', { name: /Corp|Inc/i });
      expect(customerLinks.length).toBe(2);
    });

    it('should render edit links for each invoice', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      const editLinks = screen.getAllByRole('link', { name: 'Edit' });
      expect(editLinks.length).toBe(2);
    });

    it('should handle invoices with null customer gracefully', () => {
      const invoicesWithNullCustomer = [
        {
          _id: '1',
          invoiceId: 'INV-001',
          customerId: null,
          amount: 1000,
          tax: 180,
          total: 1180,
          status: 'pending',
          issueDate: '2024-01-15',
          dueDate: '2024-02-15'
        }
      ];

      renderWithRouter(<InvoiceTable invoices={invoicesWithNullCustomer} />);

      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when invoices array is empty', () => {
      renderWithRouter(<InvoiceTable invoices={[]} />);

      expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });

    it('should render empty state when invoices is undefined', () => {
      renderWithRouter(<InvoiceTable invoices={undefined} />);

      expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });

    it('should render empty state when invoices is null', () => {
      renderWithRouter(<InvoiceTable invoices={null} />);

      expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });

    it('should not render table headers in empty state', () => {
      renderWithRouter(<InvoiceTable invoices={[]} />);

      expect(screen.queryByText('Invoice ID')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should indicate loading state when loading prop is true', () => {
      renderWithRouter(<InvoiceTable invoices={[]} loading={true} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show table headers once loaded', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} loading={false} />);

      expect(screen.getByText('Invoice ID')).toBeInTheDocument();
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format issue date correctly', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      // The component formats dates as '15 Jan 2024' format
      const formattedDate = screen.getByText(/15 Jan 2024/i);
      expect(formattedDate).toBeInTheDocument();
    });

    it('should format due date correctly', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      const formattedDate = screen.getByText(/15 Feb 2024/i);
      expect(formattedDate).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('should apply correct color class for draft status', () => {
      const draftInvoices = [
        {
          _id: '1',
          invoiceId: 'INV-DRAFT',
          customerId: { _id: 'c1', name: 'Test', company: 'Test' },
          amount: 500,
          tax: 50,
          total: 550,
          status: 'draft',
          issueDate: '2024-01-01',
          dueDate: '2024-02-01'
        }
      ];

      renderWithRouter(<InvoiceTable invoices={draftInvoices} />);

      const badge = screen.getByText('draft');
      expect(badge.className).toContain('gray');
    });

    it('should apply correct color class for overdue status', () => {
      const overdueInvoices = [
        {
          _id: '1',
          invoiceId: 'INV-OVERDUE',
          customerId: { _id: 'c1', name: 'Test', company: 'Test' },
          amount: 500,
          tax: 50,
          total: 550,
          status: 'overdue',
          issueDate: '2024-01-01',
          dueDate: '2024-02-01'
        }
      ];

      renderWithRouter(<InvoiceTable invoices={overdueInvoices} />);

      const badge = screen.getByText('overdue');
      expect(badge.className).toContain('red');
    });

    it('should apply correct color class for cancelled status', () => {
      const cancelledInvoices = [
        {
          _id: '1',
          invoiceId: 'INV-CANCELLED',
          customerId: { _id: 'c1', name: 'Test', company: 'Test' },
          amount: 500,
          tax: 50,
          total: 550,
          status: 'cancelled',
          issueDate: '2024-01-01',
          dueDate: '2024-02-01'
        }
      ];

      renderWithRouter(<InvoiceTable invoices={cancelledInvoices} />);

      const badge = screen.getByText('cancelled');
      expect(badge.className).toContain('gray');
    });
  });

  describe('Hover Effects', () => {
    it('should have hover effect on table rows', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      const firstRow = document.querySelector('tbody tr');
      expect(firstRow.className).toContain('hover');
    });
  });

  describe('Responsive Design', () => {
    it('should have overflow-x-auto for scrolling', () => {
      renderWithRouter(<InvoiceTable invoices={mockInvoices} />);

      const container = document.querySelector('.overflow-x-auto');
      expect(container).toBeInTheDocument();
    });
  });
});