/**
 * GitHub page detection utilities
 */

/**
 * Check if the current page is on github.com
 * @returns {boolean}
 */
export function isGitHubPage() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'github.com';
}

/**
 * Check if the current page is a GitHub repository page
 * (not a profile, gist, settings, etc.)
 * @returns {boolean}
 */
export function isRepoPage() {
  if (!isGitHubPage()) return false;

  const { pathname } = window.location;

  // Pattern: /owner/repo or /owner/repo/...
  const pathParts = pathname.split('/').filter(Boolean);

  // Need at least 2 parts (owner, repo)
  if (pathParts.length < 2) return false;

  // Filter out known non-repo top-level paths
  const nonRepoOwners = new Set([
    'orgs', 'settings', 'marketplace', 'explore', 'topics',
    'trending', 'collections', 'sponsors', 'login', 'logout',
    'join', 'about', 'pricing', 'security', 'enterprise',
    'features', 'contact', 'notifications', 'issues', 'pulls',
    'search', 'new', 'codespaces', 'dashboard', 'apps',
    'organizations'
  ]);

  if (nonRepoOwners.has(pathParts[0].toLowerCase())) {
    return false;
  }

  // Additional check: look for repo metadata in DOM
  const repoMeta = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');
  if (repoMeta) {
    return true;
  }

  // Fallback: check for repo navigation elements
  const repoHeader = document.querySelector('[data-pjax="#repo-content-pjax-container"]');
  if (repoHeader) {
    return true;
  }

  return true;
}

/**
 * Extract owner and repo name from the current URL
 * @returns {{ owner: string, repo: string } | null}
 */
export function getCurrentRepo() {
  if (!isRepoPage()) return null;

  const { pathname } = window.location;
  const pathParts = pathname.split('/').filter(Boolean);

  if (pathParts.length < 2) return null;

  const owner = pathParts[0];
  let repo = pathParts[1];

  // Remove .git suffix if present
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  return { owner, repo };
}
