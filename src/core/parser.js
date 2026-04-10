/**
 * GitHub repository URL parser
 *
 * Parses GitHub repo URLs to extract owner/repo and detects repo pages.
 */

/**
 * Valid GitHub repo URL patterns:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/issues/123
 * - https://github.com/owner/repo/pull/456
 * etc.
 *
 * Not matched:
 * - https://github.com (home)
 * - https://github.com/owner (profile)
 * - https://gist.github.com/... (gists)
 * - https://github.com/orgs/... (org pages)
 * - https://github.com/settings/... (settings)
 * - https://github.com/marketplace/... (marketplace)
 */
const REPO_URL_PATTERN = /^https?:\/\/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\/([a-zA-Z0-9._-]{1,100})(?:\/|$)/;

/**
 * Top-level GitHub paths that are NOT repos (to avoid false positives).
 */
const NON_REPO_OWNERS = new Set([
  'orgs',
  'settings',
  'marketplace',
  'explore',
  'topics',
  'trending',
  'collections',
  'sponsors',
  'login',
  'logout',
  'join',
  'about',
  'pricing',
  'security',
  'enterprise',
  'features',
  'contact',
  'notifications',
  'issues',
  'pulls',
  'search',
  'new',
  'codespaces',
  'dashboard',
  'apps',
  'organizations',
]);

/**
 * Parse a GitHub URL and extract owner and repo name.
 *
 * @param {string} url - Full URL to parse
 * @returns {{ owner: string, repo: string } | null} Parsed owner/repo or null if not a repo URL
 */
export function parseRepoFromUrl(url) {
  if (!url || typeof url !== 'string') return null;

  // Strip trailing slashes and query/hash before matching
  const cleanUrl = url.split('?')[0].split('#')[0];

  const match = cleanUrl.match(REPO_URL_PATTERN);
  if (!match) return null;

  const owner = match[1];
  const repo = match[2];

  // Filter out known non-repo top-level paths
  if (NON_REPO_OWNERS.has(owner.toLowerCase())) return null;

  // Filter out .git suffix which sometimes appears in clone URLs
  const cleanRepo = repo.endsWith('.git') ? repo.slice(0, -4) : repo;

  // Repo names cannot be just dots
  if (cleanRepo === '.' || cleanRepo === '..') return null;

  return { owner, repo: cleanRepo };
}

/**
 * Detect whether the current page is a GitHub repository page.
 * Uses both the URL and optional DOM signals for accuracy.
 *
 * @param {string} [url] - URL to check (defaults to window.location.href)
 * @returns {boolean}
 */
export function isRepoPage(url) {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const parsed = parseRepoFromUrl(targetUrl);

  if (!parsed) return false;

  // Additional DOM-based validation when running in a browser context.
  // GitHub injects data-* attributes on <body> and a <meta> tag for repo pages.
  if (typeof document !== 'undefined') {
    // GitHub's Turbo/React pages set data-turbo-body or similar on <html>
    // The most reliable signal is the repository name meta tag.
    const repoMeta = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');
    if (repoMeta) {
      // meta content is "owner/repo"
      const nwo = repoMeta.getAttribute('content') || '';
      const [metaOwner, metaRepo] = nwo.split('/');
      if (metaOwner && metaRepo) {
        return (
          metaOwner.toLowerCase() === parsed.owner.toLowerCase() &&
          metaRepo.toLowerCase() === parsed.repo.toLowerCase()
        );
      }
    }

    // Fallback: check for the repo-root link in the breadcrumb header
    // Present on all repo pages: <a href="/owner/repo">
    const repoLink = document.querySelector(`a[href="/${parsed.owner}/${parsed.repo}"]`);
    if (repoLink) return true;

    // If DOM signals are absent (e.g. during navigation before DOM updates),
    // fall back to URL-only detection.
  }

  return true;
}
