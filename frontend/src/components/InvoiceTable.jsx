import { memo, useMemo } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '../constants';

/**
 * InvoiceTable - Memoized invoice table component
 * @param {Object} props - Component props
 */
export const InvoiceTable = memo(function InvoiceTable({
  invoices,
  isLoading = false,
  onRowClick,
  emptyMessage = 'No invoices found',
}) {
  const containerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#757575',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
  };

  const tdStyle = {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#333333',
    borderBottom: '1px solid #f0f0f0',
  };

  const trStyle = {
    cursor: onRowClick ? 'pointer' : 'default',
    transition: 'background-color 0.2s',
  };

  const getStatusStyle = (status) => {
    const colors = {
      green: { bg: '#e8f5e9', text: '#2e7d32' },
      blue: { bg: '#e3f2fd', text: '#1565c0' },
      red: { bg: '#ffebee', text: '#c62828' },
      gray: { bg: '#f5f5f5', text: '#616161' },
      orange: { bg: '#fff3e0', text: '#ef6c00' },
    };
    const colorSet = colors[INVOICE_STATUS_COLORS[status]] || colors.gray;

    return {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: colorSet.bg,
      color: colorSet.text,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={containerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Invoice #</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} style={trStyle}>
                <td style={tdStyle}>
                  <div style={{ height: '14px', width: '80px', backgroundColor: '#e0e0e0', borderRadius: '4px' }} />
                </td>
                <td style={tdStyle}>
                  <div style={{ height: '14px', width: '120px', backgroundColor: '#e0e0e0', borderRadius: '4px' }} />
                </td>
                <td style={tdStyle}>
                  <div style={{ height: '14px', width: '80px', backgroundColor: '#e0e0e0', borderRadius: '4px' }} />
                </td>
                <td style={tdStyle}>
                  <div style={{ height: '14px', width: '80px', backgroundColor: '#e0e0e0', borderRadius: '4px' }} />
                </td>
                <td style={tdStyle}>
                  <div style={{ height: '14px', width: '70px', backgroundColor: '#e0e0e0', borderRadius: '4px' }} />
                </td>
                <td style={tdStyle}>
                  <div style={{ height: '20px', width: '60px', backgroundColor: '#e0e0e0', borderRadius: '4px' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (!invoices || invoices.length === 0) {
    return (
      <div
        style={{
          ...containerStyle,
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="#e0e0e0"
          style={{ marginBottom: '16px' }}
        >
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
        <p style={{ color: '#757575', fontSize: '16px', margin: 0 }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  // Data table
  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Invoice #</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Due Date</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr
              key={invoice.id}
              style={trStyle}
              onClick={() => onRowClick?.(invoice)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = onRowClick ? '#f5f5f5' : 'transparent';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td style={tdStyle}>{invoice.invoiceNumber}</td>
              <td style={tdStyle}>{invoice.customerName || invoice.customer?.name}</td>
              <td style={tdStyle}>{formatDate(invoice.date)}</td>
              <td style={tdStyle}>{formatDate(invoice.dueDate)}</td>
              <td style={{ ...tdStyle, fontWeight: 500 }}>
                {formatCurrency(invoice.total)}
              </td>
              <td style={tdStyle}>
                <span style={getStatusStyle(invoice.status)}>
                  {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default InvoiceTable;