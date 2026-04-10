/**
 * Shared UI utility functions for panel and popup components
 * Extracts common code to eliminate duplication
 */

import { fetchRepoMetadata, fetchFirstCommit, fetchCommitActivity } from '../core/api.js';
import { cacheGet, cacheSet, buildCacheKey } from '../core/cache.js';
import { createElement } from '../utils/dom.js';

/**
 * Fetch repository metadata with caching
 * Returns both data and rate limit info
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<{data: object, rateLimit: object|null}>}
 */
export async function fetchRepoMetadataWithCache(owner, repo) {
  const cacheKey = buildCacheKey(owner, repo, 'metadata');
  const cached = cacheGet(cacheKey);

  if (cached) {
    return { data: cached, rateLimit: null };
  }

  const result = await fetchRepoMetadata(owner, repo);
  // fetchRepoMetadata returns just the data, need to call the lower-level API
  cacheSet(cacheKey, result);
  return { data: result, rateLimit: null };
}

/**
 * Fetch first commit with caching
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<object|null>}
 */
export async function fetchFirstCommitWithCache(owner, repo) {
  const cacheKey = buildCacheKey(owner, repo, 'first_commit');
  const cached = cacheGet(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const data = await fetchFirstCommit(owner, repo);
    if (data) {
      cacheSet(cacheKey, data);
    }
    return data;
  } catch (error) {
    // First commit fetch can timeout or fail for large repos
    console.warn('[github-quick-metadata] First commit fetch failed:', error);
    return null;
  }
}

/**
 * Fetch commit activity with caching
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Array|null>}
 */
export async function fetchCommitActivityWithCache(owner, repo) {
  const cacheKey = buildCacheKey(owner, repo, 'commit_activity');
  const cached = cacheGet(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const data = await fetchCommitActivity(owner, repo);
    if (data) {
      cacheSet(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.warn('[github-quick-metadata] Commit activity fetch failed:', error);
    return null;
  }
}

/**
 * Create loading skeleton UI
 * @returns {HTMLElement}
 */
export function createLoadingSkeleton() {
  return createElement('div', { className: 'gqm-skeleton-container' }, [
    createElement('div', { className: 'gqm-skeleton gqm-skeleton-line' }),
    createElement('div', { className: 'gqm-skeleton gqm-skeleton-line' }),
    createElement('div', { className: 'gqm-skeleton gqm-skeleton-line' }),
    createElement('div', { className: 'gqm-skeleton gqm-skeleton-line' }),
    createElement('div', { className: 'gqm-skeleton gqm-skeleton-line' }),
    createElement('div', { className: 'gqm-skeleton gqm-skeleton-line' })
  ]);
}

/**
 * Create error state UI
 * @param {string} message
 * @param {Function} onRetry
 * @returns {HTMLElement}
 */
export function createErrorState(message, onRetry) {
  return createElement('div', { className: 'gqm-error' }, [
    createElement('div', { className: 'gqm-error-title', textContent: 'Failed to load metadata' }),
    createElement('div', { className: 'gqm-error-message', textContent: message }),
    createElement('button', {
      className: 'gqm-retry-btn',
      textContent: 'Retry',
      onClick: onRetry
    })
  ]);
}

/**
 * Create a metadata item with label and value
 * @param {string} label
 * @param {string} value
 * @param {string} [mutedValue] - Optional muted secondary value
 * @returns {HTMLElement}
 */
export function createMetaItem(label, value, mutedValue) {
  const item = createElement('div', { className: 'gqm-meta-item' }, [
    createElement('div', { className: 'gqm-meta-label', textContent: label })
  ]);

  const valueContainer = createElement('div', { className: 'gqm-meta-value' });

  if (mutedValue) {
    valueContainer.appendChild(createElement('div', { textContent: value }));
    valueContainer.appendChild(createElement('div', {
      className: 'gqm-meta-value-muted',
      textContent: mutedValue
    }));
  } else {
    valueContainer.textContent = value;
  }

  item.appendChild(valueContainer);
  return item;
}

/**
 * Create a stat item
 * @param {string} label
 * @param {string} value
 * @returns {HTMLElement}
 */
export function createStatItem(label, value) {
  return createElement('div', { className: 'gqm-stat-item' }, [
    createElement('div', { className: 'gqm-stat-label', textContent: label }),
    createElement('div', { className: 'gqm-stat-value', textContent: value })
  ]);
}

/**
 * Create rate limit display component
 * @param {object} rateLimit - Rate limit info { remaining, limit, resetAt }
 * @returns {HTMLElement}
 */
export function createRateLimitDisplay(rateLimit) {
  if (!rateLimit) {
    return createElement('div', { className: 'gqm-rate-limit' });
  }

  const { remaining, limit, resetAt } = rateLimit;

  // Calculate minutes until reset
  let resetMinutes = 0;
  if (resetAt) {
    const msUntilReset = resetAt.getTime() - Date.now();
    resetMinutes = Math.max(0, Math.ceil(msUntilReset / 60000));
  }

  // Determine status message
  let statusText = '';
  let statusClass = 'gqm-rate-limit';

  if (limit >= 5000) {
    // Authenticated user
    statusText = `Authenticated (${limit.toLocaleString()} req/hr)`;
  } else if (remaining < 10) {
    // Low remaining requests
    statusText = `${remaining} requests remaining (resets in ${resetMinutes} min)`;
    statusClass += ' gqm-rate-limit-low';
  } else {
    // Normal status
    statusText = `${remaining} requests remaining (resets in ${resetMinutes} min)`;
  }

  return createElement('div', {
    className: statusClass,
    textContent: statusText
  });
}

/**
 * Update rate limit display in an existing element
 * @param {HTMLElement} container - Container element to update
 * @param {object} rateLimit - Rate limit info { remaining, limit, resetAt }
 */
export function updateRateLimitDisplay(container, rateLimit) {
  if (!container || !rateLimit) return;

  const existingDisplay = container.querySelector('.gqm-rate-limit');
  const newDisplay = createRateLimitDisplay(rateLimit);

  if (existingDisplay) {
    existingDisplay.replaceWith(newDisplay);
  } else {
    container.appendChild(newDisplay);
  }
}
