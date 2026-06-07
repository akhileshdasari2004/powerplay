import { useMemo } from 'react';
import Button from './ui/Button';
import Select from './ui/Select';

/**
 * Pagination - Pagination controls component
 * @param {Object} props - Component props
 */
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showTotalItems = true,
}) {
  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // Calculate showing range
  const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalItems);

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  };

  const infoStyle = {
    fontSize: '14px',
    color: '#757575',
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const pageButtonStyle = (isActive) => ({
    minWidth: '36px',
    height: '36px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    borderColor: isActive ? '#1976d2' : '#e0e0e0',
    borderRadius: '6px',
    backgroundColor: isActive ? '#1976d2' : '#ffffff',
    color: isActive ? '#ffffff' : '#333333',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const ellipsisStyle = {
    padding: '0 4px',
    color: '#757575',
  };

  const navButtonStyle = (disabled) => ({
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: disabled ? '#c0c0c0' : '#333333',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
  });

  if (totalPages <= 1 && !showPageSizeSelector) {
    return null;
  }

  return (
    <div style={containerStyle}>
      {/* Page Size Selector & Total Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {showPageSizeSelector && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#757575' }}>Show:</span>
            <Select
              name="pageSize"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
              options={pageSizeOptions.map((size) => ({
                value: size,
                label: `${size} per page`,
              }))}
              fullWidth={false}
              style={{ width: '130px' }}
            />
          </div>
        )}

        {showTotalItems && totalItems > 0 && (
          <span style={infoStyle}>
            Showing {showingFrom}-{showingTo} of {totalItems} items
          </span>
        )}
      </div>

      {/* Page Controls */}
      {totalPages > 1 && (
        <div style={controlsStyle}>
          {/* Previous Button */}
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            style={navButtonStyle(currentPage === 1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            Prev
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} style={ellipsisStyle}>
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                style={pageButtonStyle(page === currentPage)}
                onMouseEnter={(e) => {
                  if (page !== currentPage) {
                    e.currentTarget.style.borderColor = '#1976d2';
                    e.currentTarget.style.color = '#1976d2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== currentPage) {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.color = '#333333';
                  }
                }}
              >
                {page}
              </button>
            )
          )}

          {/* Next Button */}
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={navButtonStyle(currentPage === totalPages)}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default Pagination;