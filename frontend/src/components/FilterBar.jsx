import { useCallback } from 'react';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../constants';

/**
 * FilterBar - Filter controls for invoice list
 * @param {Object} props - Component props
 */
export function FilterBar({
  searchValue = '',
  onSearchChange,
  statusFilter = '',
  onStatusChange,
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
  onReset,
  isLoading = false,
}) {
  const handleSearchChange = useCallback(
    (e) => {
      onSearchChange?.(e.target.value);
    },
    [onSearchChange]
  );

  const handleStatusChange = useCallback(
    (e) => {
      onStatusChange?.(e.target.value);
    },
    [onStatusChange]
  );

  const handleDateFromChange = useCallback(
    (e) => {
      onDateFromChange?.(e.target.value);
    },
    [onDateFromChange]
  );

  const handleDateToChange = useCallback(
    (e) => {
      onDateToChange?.(e.target.value);
    },
    [onDateToChange]
  );

  const handleReset = useCallback(() => {
    onReset?.();
  }, [onReset]);

  const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    alignItems: 'flex-end',
  };

  const searchStyle = {
    flex: '1 1 200px',
    minWidth: '200px',
  };

  const filterGroupStyle = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const dateGroupStyle = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  };

  const dateLabelStyle = {
    fontSize: '14px',
    color: '#757575',
    whiteSpace: 'nowrap',
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(INVOICE_STATUS).map(([value, label]) => ({
      value,
      label: INVOICE_STATUS_LABELS[value],
    })),
  ];

  const hasActiveFilters =
    searchValue || statusFilter || dateFrom || dateTo;

  return (
    <div style={containerStyle}>
      {/* Search */}
      <div style={searchStyle}>
        <Input
          type="search"
          placeholder="Search invoices..."
          value={searchValue}
          onChange={handleSearchChange}
          leftIcon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          }
        />
      </div>

      {/* Status Filter */}
      <div style={{ flex: '0 0 160px' }}>
        <Select
          name="status"
          value={statusFilter}
          onChange={handleStatusChange}
          options={statusOptions}
          fullWidth={false}
        />
      </div>

      {/* Date Range */}
      <div style={dateGroupStyle}>
        <span style={dateLabelStyle}>From:</span>
        <Input
          type="date"
          name="dateFrom"
          value={dateFrom}
          onChange={handleDateFromChange}
          style={{ width: '150px' }}
        />
      </div>

      <div style={dateGroupStyle}>
        <span style={dateLabelStyle}>To:</span>
        <Input
          type="date"
          name="dateTo"
          value={dateTo}
          onChange={handleDateToChange}
          style={{ width: '150px' }}
        />
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button variant="ghost" onClick={handleReset} disabled={isLoading}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default FilterBar;