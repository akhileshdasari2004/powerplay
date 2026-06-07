import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { customerApi } from '../services/customerApi';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import StatsCard from '../components/StatsCard';
import InvoiceTable from '../components/InvoiceTable';
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';
import { SkeletonStatsCard } from '../components/ui/Skeleton';

/**
 * CustomerProfilePage - Customer details with invoice history
 */
export function CustomerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Customer state
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const pageSize = 10;

  /**
   * Fetch customer data
   */
  const fetchCustomer = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await customerApi.getCustomer(id);
      setCustomer(data);
    } catch (err) {
      console.error('Failed to fetch customer:', err);
      setError(err.message || 'Failed to load customer');
      toast.error('Failed to load customer details');
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  /**
   * Fetch customer invoices
   */
  const fetchCustomerInvoices = useCallback(async () => {
    try {
      setInvoicesLoading(true);
      const response = await customerApi.getCustomerInvoices(id, {
        page: currentPage,
        pageSize,
      });
      setInvoices(response.data || response.invoices || []);
      setTotalInvoices(response.total || 0);
    } catch (err) {
      console.error('Failed to fetch customer invoices:', err);
      toast.error('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, [id, currentPage, toast]);

  // Fetch data on mount and page change
  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  useEffect(() => {
    if (customer) {
      fetchCustomerInvoices();
    }
  }, [customer, fetchCustomerInvoices]);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Handle invoice click
   */
  const handleInvoiceClick = useCallback(
    (invoice) => {
      navigate(`/invoices/${invoice.id}/edit`);
    },
    [navigate]
  );

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const backButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    color: '#333333',
  };

  const pageTitleStyle = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#333333',
    margin: 0,
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  };

  const cardHeaderStyle = {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const cardTitleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333333',
    margin: 0,
  };

  const cardBodyStyle = {
    padding: '20px',
  };

  const profileGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  };

  const infoItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const infoLabelStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: '#757575',
    textTransform: 'uppercase',
  };

  const infoValueStyle = {
    fontSize: '14px',
    color: '#333333',
  };

  const avatarStyle = {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#1976d2',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 600,
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  };

  const loadingContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
  };

  const errorContainerStyle = {
    textAlign: 'center',
    padding: '48px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button onClick={handleBack} style={backButtonStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 style={pageTitleStyle}>Customer Profile</h1>
        </div>
        <div style={loadingContainerStyle}>
          <div style={{ color: '#757575' }}>Loading customer...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !customer) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button onClick={handleBack} style={backButtonStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 style={pageTitleStyle}>Customer Profile</h1>
        </div>
        <div style={errorContainerStyle}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="#f44336"
            style={{ marginBottom: '16px' }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <h3 style={{ margin: '0 0 8px 0', color: '#333333' }}>
            Customer Not Found
          </h3>
          <p style={{ color: '#757575', margin: '0 0 24px 0' }}>
            {error || 'The customer you\'re looking for doesn\'t exist.'}
          </p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Get customer initials
  const initials = customer.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={handleBack} style={backButtonStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h1 style={pageTitleStyle}>Customer Profile</h1>
      </div>

      {/* Profile Card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={avatarStyle}>{initials}</div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#333333', margin: 0 }}>
                {customer.name}
              </h2>
              <p style={{ fontSize: '14px', color: '#757575', margin: '4px 0 0 0' }}>
                Customer since {formatDate(customer.createdAt, 'short')}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/customers/${id}/edit`)}>
            Edit
          </Button>
        </div>

        <div style={cardBodyStyle}>
          <div style={profileGridStyle}>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Email</span>
              <span style={infoValueStyle}>{customer.email || 'Not provided'}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Phone</span>
              <span style={infoValueStyle}>{customer.phone || 'Not provided'}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Company</span>
              <span style={infoValueStyle}>{customer.company || 'Not provided'}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Address</span>
              <span style={infoValueStyle}>{customer.address || 'Not provided'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={statsGridStyle}>
        <StatsCard
          title="Total Invoices"
          value={customer.stats?.totalInvoices || 0}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z" />
            </svg>
          }
          variant="primary"
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrency(customer.stats?.totalSpent || 0)}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
          }
          variant="success"
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(customer.stats?.outstanding || 0)}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
          }
          variant="warning"
        />
      </div>

      {/* Invoice History */}
      <div>
        <h2 style={cardTitleStyle}>Invoice History</h2>
        <div style={{ marginTop: '16px' }}>
          <InvoiceTable
            invoices={invoices}
            isLoading={invoicesLoading}
            onRowClick={handleInvoiceClick}
            emptyMessage="No invoices found for this customer"
          />
        </div>

        {totalInvoices > pageSize && (
          <div style={{ marginTop: '16px' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalInvoices / pageSize)}
              totalItems={totalInvoices}
              pageSize={pageSize}
              showPageSizeSelector={false}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerProfilePage;