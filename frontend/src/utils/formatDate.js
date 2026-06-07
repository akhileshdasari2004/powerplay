/**
 * Format a date string to a readable format
 * @param {string|Date} date - The date to format
 * @param {string} format - Format type: 'short', 'long', 'iso', 'relative'
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short', locale = 'en-US') {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);

    case 'long':
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);

    case 'iso':
      return dateObj.toISOString().split('T')[0];

    case 'relative':
      return formatRelativeDate(dateObj);

    default:
      return dateObj.toLocaleDateString(locale);
  }
}

/**
 * Format date as relative time (e.g., "2 days ago")
 * @param {Date} date - The date to format
 * @returns {string} Relative time string
 */
function formatRelativeDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} date - The date to format
 * @returns {string} Date string for input fields
 */
export function formatDateForInput(date) {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string from input fields
 * @param {string} dateString - The date string from input
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseDateFromInput(dateString) {
  if (!dateString) return null;

  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculate days until a date
 * @param {string|Date} date - The target date
 * @returns {number} Number of days (negative if past)
 */
export function daysUntil(date) {
  if (!date) return 0;

  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  const diffMs = dateObj - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}