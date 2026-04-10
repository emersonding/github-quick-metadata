/**
 * GitHub REST API v3 client
 *
 * Features:
 * - Optional PAT authentication (read from settings)
 * - Rate limit detection with exponential backoff
 * - 202 retry logic for stats endpoints (max 3 retries, 2s intervals)
 * - Link header parsing for pagination
 * - Error handling for 401/403/404/429
 * - Request/response logging in dev mode
 */

const GITHUB_API_BASE = 'https://api.github.com';
const DEV_MODE = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';

// 202 retry config
const MAX_202_RETRIES = 3;
const RETRY_202_INTERVAL_MS = 2000;

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
 * Parse GitHub Link header into an object of rel -> url mappings.
 * Example header: <https://api.github.com/repos/foo/bar/commits?page=2>; rel="next", <https://api.github.com/repos/foo/bar/commits?page=10>; rel="last"
 *
 * @param {string|null} linkHeader
 * @returns {{ next?: string, last?: string, prev?: string, first?: string }}
 */
export function parseLinkHeader(linkHeader) {
  if (!linkHeader) return {};

  const links = {};
  const parts = linkHeader.split(',');

  for (const part of parts) {
    const match = part.trim().match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      const url = match[1];
      const rel = match[2];
      links[rel] = url;
    }
  }

  return links;
}

/**
 * Extract page number from a GitHub API URL.
 * @param {string} url
 * @returns {number|null}
 */
export function extractPageNumber(url) {
  if (!url) return null;
  const match = url.match(/[?&]page=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
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
 * Does NOT handle 202 or rate limit retries — see fetchWithRetry.
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
    body: response.status !== 204 && response.status !== 202
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
 * - 202 retry logic (for stats endpoints)
 * - Error handling for 401/403/404
 *
 * @param {string} path - API path, e.g. "/repos/owner/repo"
 * @param {object} [options]
 * @param {string} [options.token] - Override token (skip auto-read)
 * @param {boolean} [options.handle202] - Enable 202 retry logic (default: false)
 * @param {AbortSignal} [options.signal] - Optional abort signal
 * @returns {Promise<{ data: any, headers: Headers, rateLimit: object, pagination: object }>}
 */
export async function githubFetch(path, options = {}) {
  const token = options.token !== undefined ? options.token : await getStoredToken();
  const headers = buildHeaders(token);
  const url = path.startsWith('http') ? path : `${GITHUB_API_BASE}${path}`;

  let attempt = 0;
  let backoffMs = INITIAL_BACKOFF_MS;
  let retries202 = 0;

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
    const linkHeader = result.headers.get('link');
    const pagination = parseLinkHeader(linkHeader);

    // Handle 202 Accepted (stats not yet computed)
    if (status === 202) {
      if (!options.handle202 || retries202 >= MAX_202_RETRIES) {
        devLog(`202 received for ${url}, retries exhausted (${retries202}/${MAX_202_RETRIES})`);
        throw Object.assign(new Error('GitHub API: Statistics not yet available. Please try again shortly.'), {
          code: 'STATS_NOT_READY',
          status: 202,
          retriesExhausted: true,
        });
      }
      retries202++;
      devLog(`202 received for ${url}, retry ${retries202}/${MAX_202_RETRIES} in ${RETRY_202_INTERVAL_MS}ms`);
      await sleep(RETRY_202_INTERVAL_MS);
      continue;
    }

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
      pagination,
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

/**
 * Fetch commits with Link header for pagination.
 * Used in the 2-request first-commit strategy:
 *   1. Fetch page 1 to get Link header -> extract last page number
 *   2. Fetch last page to get oldest commit
 *
 * @param {string} owner
 * @param {string} repo
 * @param {object} [params] - Query params (page, per_page, sha, etc.)
 * @param {object} [options]
 * @returns {Promise<{ data: any[], pagination: object, rateLimit: object }>}
 */
export async function fetchCommits(owner, repo, params = {}, options = {}) {
  const query = new URLSearchParams({ per_page: 1, ...params }).toString();
  const result = await githubFetch(`/repos/${owner}/${repo}/commits?${query}`, options);
  return result;
}

/**
 * Fetch the first (oldest) commit of a repository using a 2-request strategy.
 *
 * Strategy:
 *   1. GET /repos/{owner}/{repo}/commits?per_page=1 — read Link header to find last page
 *   2. GET /repos/{owner}/{repo}/commits?per_page=1&page={lastPage} — get oldest commit
 *
 * Uses author date (commit.commit.author.date), not committer date.
 * Applies a 10-second timeout to guard against huge/slow repos.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {object} [options]
 * @returns {Promise<{ date: string, sha: string, message: string } | null>}
 * @throws {{ code: 'TIMEOUT' }} if the requests exceed 10 seconds
 * @throws {{ code: 'EMPTY_REPO' }} if the repository has no commits
 */
export async function fetchFirstCommit(owner, repo, options = {}) {
  const TIMEOUT_MS = 10000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const fetchOptions = { ...options, signal: controller.signal };

    // Request 1: fetch page 1 with per_page=1 to read pagination Link header
    let firstPageResult;
    try {
      firstPageResult = await githubFetch(
        `/repos/${owner}/${repo}/commits?per_page=1`,
        fetchOptions
      );
    } catch (err) {
      if (err.name === 'AbortError' || (err.cause && err.cause.name === 'AbortError')) {
        throw Object.assign(new Error('fetchFirstCommit: request timed out'), { code: 'TIMEOUT' });
      }
      throw err;
    }

    const commits = firstPageResult.data;

    // No commits at all
    if (!Array.isArray(commits) || commits.length === 0) {
      throw Object.assign(new Error(`Repository ${owner}/${repo} has no commits`), {
        code: 'EMPTY_REPO',
      });
    }

    // If there's no "last" link, all commits fit on one page — the only commit IS the first
    const lastUrl = firstPageResult.pagination.last;
    if (!lastUrl) {
      const commit = commits[0];
      return {
        date: commit.commit.author.date,
        sha: commit.sha,
        message: commit.commit.message,
      };
    }

    // Extract last page number from Link header
    const lastPage = extractPageNumber(lastUrl);
    if (!lastPage) {
      // Fallback: return whatever the single result is
      const commit = commits[0];
      return {
        date: commit.commit.author.date,
        sha: commit.sha,
        message: commit.commit.message,
      };
    }

    // Request 2: fetch the last page to get the oldest commit
    let lastPageResult;
    try {
      lastPageResult = await githubFetch(
        `/repos/${owner}/${repo}/commits?per_page=1&page=${lastPage}`,
        fetchOptions
      );
    } catch (err) {
      if (err.name === 'AbortError' || (err.cause && err.cause.name === 'AbortError')) {
        throw Object.assign(new Error('fetchFirstCommit: request timed out'), { code: 'TIMEOUT' });
      }
      throw err;
    }

    const oldestCommits = lastPageResult.data;
    if (!Array.isArray(oldestCommits) || oldestCommits.length === 0) {
      return null;
    }

    const oldest = oldestCommits[0];
    return {
      date: oldest.commit.author.date,
      sha: oldest.sha,
      message: oldest.commit.message,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch participation stats (weekly commit counts for past year).
 * Returns 202 when stats are being computed — retried automatically.
 *
 * GET /repos/{owner}/{repo}/stats/participation
 *
 * @param {string} owner
 * @param {string} repo
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function fetchParticipationStats(owner, repo, options = {}) {
  const result = await githubFetch(`/repos/${owner}/${repo}/stats/participation`, {
    ...options,
    handle202: true,
  });
  return result.data;
}

/**
 * Fetch commit activity (detailed weekly commit data).
 * Returns 202 when stats are being computed — retried automatically.
 *
 * GET /repos/{owner}/{repo}/stats/commit_activity
 *
 * @param {string} owner
 * @param {string} repo
 * @param {object} [options]
 * @returns {Promise<object[]>}
 */
export async function fetchCommitActivity(owner, repo, options = {}) {
  const result = await githubFetch(`/repos/${owner}/${repo}/stats/commit_activity`, {
    ...options,
    handle202: true,
  });
  return result.data;
}
