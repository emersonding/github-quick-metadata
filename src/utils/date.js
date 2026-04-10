/**
 * Date formatting utilities for GitHub Quick Metadata
 */

/**
 * Format a date string as "Jan 15, 2020"
 * @param {string} dateString - ISO 8601 date string
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date string as "3 years ago" (relative)
 * @param {string} dateString - ISO 8601 date string
 * @returns {string}
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) {
      return diffSec <= 1 ? 'just now' : `${diffSec} seconds ago`;
    }
    if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    }
    if (diffHour < 24) {
      return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    }
    if (diffDay < 30) {
      return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    }
    if (diffMonth < 12) {
      return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
    }
    return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date string as "Jan 15, 2020 at 3:45 PM"
 * @param {string} dateString - ISO 8601 date string
 * @returns {string}
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

    const datePart = date.toLocaleDateString('en-US', dateOptions);
    const timePart = date.toLocaleTimeString('en-US', timeOptions);

    return `${datePart} at ${timePart}`;
  } catch {
    return 'Invalid date';
  }
}
