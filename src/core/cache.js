/**
 * localStorage-based caching layer with TTL invalidation and LRU eviction.
 *
 * Features:
 * - TTL-based cache invalidation (default: 1 hour)
 * - LRU eviction when storage exceeds 80% of estimated quota
 * - Per-entry size tracking for quota management
 * - Graceful handling of localStorage quota exceeded errors
 * - Cache persistence across browser restarts
 *
 * Storage format per entry (key: CACHE_PREFIX + cacheKey):
 *   {
 *     data: any,          // cached payload
 *     expiresAt: number,  // Unix ms timestamp
 *     accessedAt: number, // Unix ms timestamp (updated on each get)
 *     size: number,       // serialized byte length of this entry
 *   }
 */

const CACHE_PREFIX = 'github-quick-metadata:cache:';
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

// Evict when used storage exceeds this fraction of estimated quota
const EVICTION_THRESHOLD = 0.8;

// localStorage quota is typically 5–10 MB; use 5 MB as a conservative estimate
const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Serialize a value to a JSON string.
 * Returns null if serialization fails.
 * @param {any} value
 * @returns {string|null}
 */
function serialize(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * Deserialize a JSON string.
 * Returns null if parsing fails.
 * @param {string} raw
 * @returns {any|null}
 */
function deserialize(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Estimate byte length of a string (UTF-16 surrogate pairs = 4 bytes, rest = 2 bytes).
 * This is a conservative upper bound suitable for quota tracking.
 * @param {string} str
 * @returns {number}
 */
function byteLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    len += (code >= 0xd800 && code <= 0xdbff) ? 4 : 2;
  }
  return len;
}

/**
 * Check whether localStorage is available and writable.
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__gqm_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Return all cache keys managed by this module (without the prefix).
 * @returns {string[]}
 */
function getAllCacheKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const fullKey = localStorage.key(i);
    if (fullKey && fullKey.startsWith(CACHE_PREFIX)) {
      keys.push(fullKey.slice(CACHE_PREFIX.length));
    }
  }
  return keys;
}

/**
 * Read a raw entry object from localStorage by cache key.
 * Returns null if missing or unparseable.
 * @param {string} cacheKey
 * @returns {{ data: any, expiresAt: number, accessedAt: number, size: number }|null}
 */
function readEntry(cacheKey) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + cacheKey);
    if (raw === null) return null;
    return deserialize(raw);
  } catch {
    return null;
  }
}

/**
 * Write an entry object to localStorage.
 * Returns true on success, false on quota exceeded or other error.
 * @param {string} cacheKey
 * @param {{ data: any, expiresAt: number, accessedAt: number, size: number }} entry
 * @returns {boolean}
 */
function writeEntry(cacheKey, entry) {
  const raw = serialize(entry);
  if (raw === null) return false;

  try {
    localStorage.setItem(CACHE_PREFIX + cacheKey, raw);
    return true;
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      return false;
    }
    return false;
  }
}

/**
 * Compute total bytes used by all cache entries managed by this module.
 * @returns {number}
 */
function computeUsedBytes() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const fullKey = localStorage.key(i);
    if (fullKey && fullKey.startsWith(CACHE_PREFIX)) {
      const value = localStorage.getItem(fullKey) || '';
      total += byteLength(fullKey) + byteLength(value);
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// LRU eviction
// ---------------------------------------------------------------------------

/**
 * Evict least-recently-used entries until storage is below the eviction threshold.
 * Also removes any already-expired entries opportunistically.
 */
function evictIfNeeded() {
  const usedBytes = computeUsedBytes();
  const limitBytes = ESTIMATED_QUOTA_BYTES * EVICTION_THRESHOLD;

  if (usedBytes <= limitBytes) return;

  const now = Date.now();

  // Collect all entries with their metadata
  const entries = [];
  for (const cacheKey of getAllCacheKeys()) {
    const entry = readEntry(cacheKey);
    if (!entry) {
      // Unparseable — remove it
      try { localStorage.removeItem(CACHE_PREFIX + cacheKey); } catch {}
      continue;
    }

    // Opportunistically remove expired entries first
    if (entry.expiresAt && entry.expiresAt < now) {
      try { localStorage.removeItem(CACHE_PREFIX + cacheKey); } catch {}
      continue;
    }

    entries.push({ cacheKey, accessedAt: entry.accessedAt || 0, size: entry.size || 0 });
  }

  // Sort ascending by accessedAt (least recently used first)
  entries.sort((a, b) => a.accessedAt - b.accessedAt);

  // Evict until under threshold
  let remaining = computeUsedBytes();
  for (const { cacheKey } of entries) {
    if (remaining <= limitBytes) break;
    const fullKey = CACHE_PREFIX + cacheKey;
    const entryRaw = localStorage.getItem(fullKey) || '';
    const entryBytes = byteLength(fullKey) + byteLength(entryRaw);
    try {
      localStorage.removeItem(fullKey);
      remaining -= entryBytes;
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve a cached value by key.
 * Returns null if not found, expired, or localStorage is unavailable.
 * Updates accessedAt timestamp on each successful read (LRU tracking).
 *
 * @param {string} cacheKey
 * @returns {any|null}
 */
export function cacheGet(cacheKey) {
  if (!isLocalStorageAvailable()) return null;

  const entry = readEntry(cacheKey);
  if (!entry) return null;

  // Check TTL expiry
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    try { localStorage.removeItem(CACHE_PREFIX + cacheKey); } catch {}
    return null;
  }

  // Update LRU timestamp (best-effort; ignore write failure)
  writeEntry(cacheKey, { ...entry, accessedAt: Date.now() });

  return entry.data;
}

/**
 * Store a value in the cache.
 * Runs LRU eviction before writing if storage is near capacity.
 * If writing still fails after eviction, the write is silently skipped.
 *
 * @param {string} cacheKey
 * @param {any} data
 * @param {number} [ttlMs=DEFAULT_TTL_MS] - TTL in milliseconds
 * @returns {boolean} true if successfully written
 */
export function cacheSet(cacheKey, data, ttlMs = DEFAULT_TTL_MS) {
  if (!isLocalStorageAvailable()) return false;

  const now = Date.now();
  const raw = serialize(data);
  if (raw === null) return false;

  const entry = {
    data,
    expiresAt: now + ttlMs,
    accessedAt: now,
    size: byteLength(CACHE_PREFIX + cacheKey) + byteLength(raw) + 100, // +100 for metadata overhead
  };

  // Try writing; if quota exceeded, evict and retry once
  const success = writeEntry(cacheKey, entry);
  if (!success) {
    evictIfNeeded();
    return writeEntry(cacheKey, entry);
  }

  // Proactively evict after successful write if we're approaching quota
  evictIfNeeded();

  return true;
}

/**
 * Delete a specific cache entry.
 *
 * @param {string} cacheKey
 */
export function cacheDelete(cacheKey) {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.removeItem(CACHE_PREFIX + cacheKey);
  } catch {}
}

/**
 * Clear all cache entries managed by this module.
 * Does not affect localStorage entries from other origins or scripts.
 */
export function cacheClear() {
  if (!isLocalStorageAvailable()) return;

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    try { localStorage.removeItem(key); } catch {}
  }
}

/**
 * Return cache statistics for display in the settings UI.
 *
 * @returns {{ entryCount: number, usedBytes: number, usedPercent: number, quotaBytes: number }}
 */
export function cacheStats() {
  if (!isLocalStorageAvailable()) {
    return { entryCount: 0, usedBytes: 0, usedPercent: 0, quotaBytes: ESTIMATED_QUOTA_BYTES };
  }

  const keys = getAllCacheKeys();
  const usedBytes = computeUsedBytes();
  const usedPercent = Math.round((usedBytes / ESTIMATED_QUOTA_BYTES) * 100);

  return {
    entryCount: keys.length,
    usedBytes,
    usedPercent,
    quotaBytes: ESTIMATED_QUOTA_BYTES,
  };
}

/**
 * Remove all expired cache entries.
 * Can be called periodically to free space proactively.
 */
export function cachePurgeExpired() {
  if (!isLocalStorageAvailable()) return;

  const now = Date.now();
  for (const cacheKey of getAllCacheKeys()) {
    const entry = readEntry(cacheKey);
    if (!entry || (entry.expiresAt && entry.expiresAt < now)) {
      try { localStorage.removeItem(CACHE_PREFIX + cacheKey); } catch {}
    }
  }
}

/**
 * Build a canonical cache key for a GitHub API endpoint.
 * Ensures consistent key format across callers.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {string} endpoint - e.g. "metadata", "participation", "commit_activity", "first_commit"
 * @returns {string}
 */
export function buildCacheKey(owner, repo, endpoint) {
  return `${owner}/${repo}/${endpoint}`;
}
