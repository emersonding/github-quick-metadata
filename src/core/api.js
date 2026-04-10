/**
 * GitHub REST API v3 client
 *
 * Features:
 * - Optional PAT authentication (read from settings)
 * - Rate limit detection with exponential backoff
 * - Error handling for 401/403/404/429
 * - Request/response logging in dev mode
 */

const GITHUB_API_BASE = 'https://api.github.com';
const DEV_MODE = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';

// Exponential backoff config for rate limiting
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 32000;

/**
 * Log messages only in dev mode.
 * @param {...any} args
 */
function devLog(...args) {
  if (DEV_MODE) {
    console.log('[github-quick-metadata]', ...args);
  }
}

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build request headers for GitHub API calls.
 * @param {string|null} token - Optional PAT
 * @returns {Record<string, string>}
 */
function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  return headers;
}

/**
 * Read PAT from extension settings if available.
 * Returns null if no token configured or storage unavailable.
 * @returns {Promise<string|null>}
 */
async function getStoredToken() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['githubToken'], (result) => {
          resolve(result.githubToken || null);
        });
      });
    }

    if (typeof GM_getValue !== 'undefined') {
      const token = GM_getValue('githubToken', null);
      return token || null;
    }

    const stored = localStorage.getItem('github-quick-metadata:token');
    return stored || null;
  } catch {
    return null;
  }
}

/**
 * Core fetch wrapper with error handling and logging.
 *
 * @param {string} url
 * @param {Record<string, string>} headers
 * @returns {Promise<{ status: number, headers: Headers, body: any }>}
 */
async function fetchOnce(url, headers) {
  devLog('GET', url);

  const response = await fetch(url, { headers });

  devLog('Response', response.status, url);

  return {
    status: response.status,
    headers: response.headers,
    body: response.status !== 204
      ? await response.json().catch(() => null)
      : null,
    rawResponse: response,
  };
}

/**
 * Handle HTTP error statuses with descriptive errors.
 * @param {number} status
 * @param {any} body
 * @param {string} url
 */
function throwForStatus(status, body, url) {
  const message = body && body.message ? body.message : '';

  if (status === 401) {
    throw Object.assign(new Error(`GitHub API: Unauthorized (401). Check your Personal Access Token. ${message}`), {
      code: 'UNAUTHORIZED',
      status,
    });
  }

  if (status === 403) {
    throw Object.assign(new Error(`GitHub API: Forbidden (403). ${message}`), {
      code: 'FORBIDDEN',
      status,
    });
  }

  if (status === 404) {
    throw Object.assign(new Error(`GitHub API: Not found (404) — ${url}. ${message}`), {
      code: 'NOT_FOUND',
      status,
    });
  }

  if (status === 429) {
    throw Object.assign(new Error(`GitHub API: Rate limit exceeded (429). ${message}`), {
      code: 'RATE_LIMITED',
      status,
    });
  }

  if (status >= 400) {
    throw Object.assign(new Error(`GitHub API: HTTP ${status} — ${url}. ${message}`), {
      code: 'HTTP_ERROR',
      status,
    });
  }
}

/**
 * Parse rate limit info from response headers.
 * @param {Headers} headers
 * @returns {{ remaining: number, limit: number, resetAt: Date|null }}
 */
export function parseRateLimitHeaders(headers) {
  const remaining = parseInt(headers.get('x-ratelimit-remaining') || '60', 10);
  const limit = parseInt(headers.get('x-ratelimit-limit') || '60', 10);
  const resetTimestamp = parseInt(headers.get('x-ratelimit-reset') || '0', 10);
  const resetAt = resetTimestamp ? new Date(resetTimestamp * 1000) : null;

  return { remaining, limit, resetAt };
}

/**
 * Perform a single GitHub API request with:
 * - Automatic PAT injection
 * - Rate limit detection and exponential backoff on 429
 * - Error handling for 401/403/404
 *
 * @param {string} path - API path, e.g. "/repos/owner/repo"
 * @param {object} [options]
 * @param {string} [options.token] - Override token (skip auto-read)
 * @param {AbortSignal} [options.signal] - Optional abort signal
 * @returns {Promise<{ data: any, headers: Headers, rateLimit: object }>}
 */
export async function githubFetch(path, options = {}) {
  const token = options.token !== undefined ? options.token : await getStoredToken();
  const headers = buildHeaders(token);
  const url = path.startsWith('http') ? path : `${GITHUB_API_BASE}${path}`;

  let attempt = 0;
  let backoffMs = INITIAL_BACKOFF_MS;

  while (true) {
    let result;
    try {
      result = await fetchOnce(url, headers);
    } catch (err) {
      // Network-level error (no response)
      throw Object.assign(new Error(`GitHub API: Network error fetching ${url}: ${err.message}`), {
        code: 'NETWORK_ERROR',
        cause: err,
      });
    }

    const { status, body, rawResponse } = result;
    const rateLimit = parseRateLimitHeaders(result.headers);

    // Handle 429 rate limit with exponential backoff
    if (status === 429) {
      attempt++;
      const retryAfter = result.headers.get('retry-after');
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.min(backoffMs, MAX_BACKOFF_MS);
      devLog(`429 rate limited, waiting ${waitMs}ms (attempt ${attempt})`);
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      await sleep(waitMs);
      continue;
    }

    // Handle 403 with rate limit exhaustion (GitHub returns 403 for rate limits too)
    if (status === 403 && rateLimit.remaining === 0) {
      attempt++;
      const waitMs = rateLimit.resetAt
        ? Math.max(0, rateLimit.resetAt.getTime() - Date.now()) + 1000
        : Math.min(backoffMs, MAX_BACKOFF_MS);
      devLog(`403 rate limited (remaining=0), waiting ${Math.round(waitMs / 1000)}s`);
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      await sleep(waitMs);
      continue;
    }

    // Throw for other error statuses
    throwForStatus(status, body, url);

    devLog('Response data', url, body);

    return {
      data: body,
      headers: result.headers,
      rateLimit,
    };
  }
}

/**
 * Fetch repository metadata.
 * GET /repos/{owner}/{repo}
 *
 * @param {string} owner
 * @param {string} repo
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function fetchRepoMetadata(owner, repo, options = {}) {
  const result = await githubFetch(`/repos/${owner}/${repo}`, options);
  return result.data;
}

/**
 * Fetch repository metadata with rate limit info.
 * GET /repos/{owner}/{repo}
 *
 * @param {string} owner
 * @param {string} repo
 * @param {object} [options]
 * @returns {Promise<{data: object, rateLimit: object}>}
 */
export async function fetchRepoMetadataWithRateLimit(owner, repo, options = {}) {
  const result = await githubFetch(`/repos/${owner}/${repo}`, options);
  return { data: result.data, rateLimit: result.rateLimit };
}
