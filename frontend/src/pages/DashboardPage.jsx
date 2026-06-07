import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { invoiceApi } from '../services/invoiceApi';
import { formatCurrency } from '../utils/formatCurrency';
import StatsCard from '../components/StatsCard';
import InvoiceTable from '../components/InvoiceTable';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import { SkeletonStatsCard } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';

/**
 * DashboardPage - Main dashboard with invoice overview
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Stats state
  const [stats, setStats] = useState({
    totalRevenue: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    totalInvoices: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Debounce search
  const debouncedSearch = useDebounce(searchValue, 300);

  // Pagination - use individual primitives to avoid object reference issues
  const pagination = usePagination({
    itemsPerPage: 10,
    initialPageSize: 10,
  });

  // Stable reference to current page and page size for dependency arrays
  const currentPage = pagination.currentPage;
  const pageSize = pagination.pageSize;

  /**
   * Fetch dashboard statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await invoiceApi.getInvoiceStats();
      setStats({
        totalRevenue: data.totalRevenue || 0,
        outstandingAmount: data.outstandingAmount || 0,
        overdueAmount: data.overdueAmount || 0,
        totalInvoices: data.totalInvoices || 0,
      });
    } catch (err) {
      setStats({
        totalRevenue: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        totalInvoices: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Fetch invoices - using primitives for deps to avoid infinite loop
   */
  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
        search: debouncedSearch,
        status: statusFilter,
        dateFrom,
        dateTo,
      };

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const response = await invoiceApi.getInvoices(params);
      const invoiceData = response.data;
      if (Array.isArray(invoiceData)) {
        setInvoices(invoiceData);
      } else if (invoiceData && typeof invoiceData === 'object') {
        setInvoices(invoiceData.invoices || []);
      } else {
        setInvoices([]);
      }
      pagination.setTotal(response.total || 0);
    } catch (err) {
      toast.error('Failed to load invoices. Please try again.');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, dateFrom, dateTo, pagination.setTotal, toast]);

  // Fetch data on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset pagination when filters change
  useEffect(() => {
    pagination.goToPage(1);
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, pagination.goToPage]);

  /**
   * Handle filter reset
   */
  const handleFilterReset = useCallback(() => {
    setSearchValue('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
  }, []);

  /**
   * Handle invoice row click
   */
  const handleInvoiceClick = useCallback(
    (invoice) => {
      navigate(`/invoices/${invoice.id}/edit`);
    },
    [navigate]
  );

  // Memoized stats cards
  const statsCards = useMemo(
    () => [
      {
        title: 'Total Revenue',
        value: formatCurrency(stats.totalRevenue),
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          </svg>
        ),
        variant: 'success',
        trend: 12,
        trendLabel: 'vs last month',
        onClick: () => navigate('/invoices'),
      },
      {
        title: 'Outstanding',
        value: formatCurrency(stats.outstandingAmount),
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        ),
        variant: 'primary',
        onClick: () => {
          setStatusFilter('sent');
          pagination.goToPage(1);
        },
      },
      {
        title: 'Overdue',
        value: formatCurrency(stats.overdueAmount),
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        ),
        variant: 'danger',
        onClick: () => {
          setStatusFilter('overdue');
          pagination.goToPage(1);
        },
      },
      {
        title: 'Total Invoices',
        value: stats.totalInvoices.toLocaleString(),
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        ),
        variant: 'default',
      },
    ],
    [stats, navigate, pagination]
  );

  const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  };

  const greetingStyle = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#333333',
    margin: 0,
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: '#757575',
    marginTop: '4px',
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  };

  const responsiveStatsGrid = {
    '@media (maxWidth: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (maxWidth: 600px)': {
      gridTemplateColumns: '1fr',
    },
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333333',
    margin: 0,
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={greetingStyle}>Welcome back, {user?.name || 'User'}</h1>
          <p style={subtitleStyle}>
            Here&apos;s what&apos;s happening with your invoices today.
          </p>
        </div>
        <Button
          onClick={() => navigate('/invoices/new')}
          leftIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          }
        >
          New Invoice
        </Button>
      </div>

      {/* Stats Grid */}
      <div style={{ ...statsGridStyle, ...responsiveStatsGrid }}>
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatsCard key={i} />
            ))
          : statsCards.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                variant={stat.variant}
                trend={stat.trend}
                trendLabel={stat.trendLabel}
                onClick={stat.onClick}
              />
            ))}
      </div>

      {/* Recent Invoices Section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2 style={sectionTitleStyle}>Recent Invoices</h2>
        </div>

        {/* Filter Bar */}
        <div style={{ marginBottom: '16px' }}>
          <FilterBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            statusFilter={statusFilter}
            onStatusChange={(e) => setStatusFilter(e.target.value)}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            onReset={handleFilterReset}
            isLoading={isLoading}
          />
        </div>

        {/* Invoice Table */}
        <InvoiceTable
          invoices={invoices}
          isLoading={isLoading}
          onRowClick={handleInvoiceClick}
          emptyMessage={
            debouncedSearch || statusFilter || dateFrom || dateTo
              ? 'No invoices match your filters'
              : 'No invoices yet. Create your first invoice!'
          }
        />

        {/* Pagination */}
        {invoices.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.goToPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;