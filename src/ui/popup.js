/**
 * GitHub Quick Metadata - Popup Component
 * Displays repository metadata in browser extension popup (400px × 600px)
 */

import { fetchRepoMetadataWithRateLimit } from '../core/api.js';
import { cacheGet, buildCacheKey } from '../core/cache.js';
import { calculateCommitStats } from '../core/stats.js';
import { formatDate, formatRelativeDate } from '../utils/date.js';
import { createElement } from '../utils/dom.js';
import {
  fetchRepoMetadataWithCache,
  fetchFirstCommitWithCache,
  fetchCommitActivityWithCache,
  createLoadingSkeleton,
  createErrorState,
  createMetaItem,
  createStatItem,
  createRateLimitDisplay
} from './shared.js';

/**
 * Initialize the popup
 */
export async function initPopup() {
  console.log('[github-quick-metadata] Initializing popup');

  // Set up "Open in Panel" button
  const openPanelBtn = document.getElementById('openPanelBtn');
  if (openPanelBtn) {
    openPanelBtn.addEventListener('click', handleOpenPanel);
  }

  // Set up settings link
  const settingsLink = document.getElementById('settingsLink');
  if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }

  // Load and display metadata
  const content = document.getElementById('popupContent');
  if (content) {
    await loadPopupData(content);
  }
}

/**
 * Handle "Open in Panel" button click
 * Sends message to content script to open side panel
 */
async function handleOpenPanel() {
  try {
    // Query for the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      console.error('[github-quick-metadata] No active tab found');
      return;
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'openPanel' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[github-quick-metadata] Error sending message:', chrome.runtime.lastError);
        return;
      }

      // Close popup after successfully opening panel
      if (response && response.success) {
        window.close();
      }
    });
  } catch (error) {
    console.error('[github-quick-metadata] Error opening panel:', error);
  }
}

/**
 * Load and display popup data
 * @param {HTMLElement} content - Popup content container
 */
async function loadPopupData(content) {
  // Show loading skeleton
  content.innerHTML = '';
  content.appendChild(createLoadingSkeleton());

  try {
    // Get current repo from active tab
    const repo = await getCurrentRepoFromTab();
    if (!repo) {
      throw new Error('Not a repository page');
    }

    const { owner, repo: repoName } = repo;

    // Try to load cached data first for instant display
    const cachedMetadata = cacheGet(buildCacheKey(owner, repoName, 'metadata'));
    const cachedFirstCommit = cacheGet(buildCacheKey(owner, repoName, 'first_commit'));
    const cachedCommitActivity = cacheGet(buildCacheKey(owner, repoName, 'commit_activity'));

    // If we have cached data, display it immediately
    if (cachedMetadata) {
      const stats = calculateCommitStats(cachedCommitActivity || []);
      content.innerHTML = '';
      content.appendChild(createRepoInfoSection(cachedMetadata, cachedFirstCommit));
      content.appendChild(createStatsSection(stats));
      content.appendChild(createMetricsSection(cachedMetadata));
    }

    // Fetch fresh data in background - capture rate limit info
    const [metadataResult, firstCommit, commitActivity] = await Promise.all([
      fetchRepoMetadataWithRateLimit(owner, repoName).catch(err => {
        // Try cache on failure
        return fetchRepoMetadataWithCache(owner, repoName);
      }),
      fetchFirstCommitWithCache(owner, repoName),
      fetchCommitActivityWithCache(owner, repoName)
    ]);

    const metadata = metadataResult.data;
    const rateLimit = metadataResult.rateLimit;

    // Calculate stats
    const stats = calculateCommitStats(commitActivity || []);

    // Render content (update with fresh data)
    content.innerHTML = '';
    content.appendChild(createRepoInfoSection(metadata, firstCommit));
    content.appendChild(createStatsSection(stats));
    content.appendChild(createMetricsSection(metadata));

    // Add rate limit footer
    const footer = createElement('div', { className: 'gqm-popup-footer' });
    if (rateLimit) {
      footer.appendChild(createRateLimitDisplay(rateLimit));
    }
    content.appendChild(footer);

  } catch (error) {
    console.error('[github-quick-metadata] Error loading popup data:', error);
    content.innerHTML = '';
    content.appendChild(createErrorState(error.message, () => loadPopupData(content)));
  }
}

/**
 * Get current repository info from active tab
 * @returns {Promise<{owner: string, repo: string}|null>}
 */
async function getCurrentRepoFromTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      return null;
    }

    // Parse GitHub URL
    const url = new URL(tab.url);
    if (url.hostname !== 'github.com') {
      return null;
    }

    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }

    const owner = pathParts[0];
    let repo = pathParts[1];

    // Remove .git suffix if present
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    return { owner, repo };
  } catch (error) {
    console.error('[github-quick-metadata] Error getting repo from tab:', error);
    return null;
  }
}


/**
 * Create repository info section
 * @param {object} metadata
 * @param {object|null} firstCommit
 * @returns {HTMLElement}
 */
function createRepoInfoSection(metadata, firstCommit) {
  const section = createElement('div', { className: 'gqm-section' }, [
    createElement('h3', { className: 'gqm-section-title', textContent: 'Repository Info' })
  ]);

  // Creation date
  section.appendChild(createMetaItem('Created', formatDate(metadata.created_at), formatRelativeDate(metadata.created_at)));

  // First commit
  if (firstCommit && firstCommit.date) {
    section.appendChild(createMetaItem('First Commit', formatDate(firstCommit.date), formatRelativeDate(firstCommit.date)));
  } else {
    section.appendChild(createMetaItem('First Commit', 'N/A', 'Data not available'));
  }

  // Last updated
  section.appendChild(createMetaItem('Last Updated', formatDate(metadata.updated_at), formatRelativeDate(metadata.updated_at)));

  return section;
}

/**
 * Create commit statistics section
 * @param {object} stats
 * @returns {HTMLElement}
 */
function createStatsSection(stats) {
  const section = createElement('div', { className: 'gqm-section' }, [
    createElement('h3', { className: 'gqm-section-title', textContent: 'Commit Statistics' })
  ]);

  // Total commits (past year)
  section.appendChild(createStatItem('Total (past year)', stats.totalCommits.toLocaleString()));

  // Average per week
  section.appendChild(createStatItem('Avg per week', stats.avgCommitsPerWeek.toFixed(1)));

  // Peak week
  if (stats.peakWeek && stats.peakWeek.count > 0) {
    const peakValue = `${stats.peakWeek.count} commits`;
    section.appendChild(createStatItem('Peak week', peakValue));
  }

  // Trend
  const trendLabel = stats.trend.charAt(0).toUpperCase() + stats.trend.slice(1);
  const trendBadge = createElement('span', {
    className: `gqm-trend gqm-trend-${stats.trend}`,
    textContent: trendLabel
  });
  const trendItem = createStatItem('Trend', '');
  trendItem.querySelector('.gqm-stat-value').appendChild(trendBadge);
  section.appendChild(trendItem);

  return section;
}

/**
 * Create additional metrics section
 * @param {object} metadata
 * @returns {HTMLElement}
 */
function createMetricsSection(metadata) {
  const section = createElement('div', { className: 'gqm-section' }, [
    createElement('h3', { className: 'gqm-section-title', textContent: 'Additional Metrics' })
  ]);

  // Size
  const sizeKB = metadata.size || 0;
  const sizeMB = (sizeKB / 1024).toFixed(2);
  section.appendChild(createStatItem('Size', `${sizeMB} MB`));

  // Stars
  section.appendChild(createStatItem('Stars', (metadata.stargazers_count || 0).toLocaleString()));

  // Forks
  section.appendChild(createStatItem('Forks', (metadata.forks_count || 0).toLocaleString()));

  // Open issues
  section.appendChild(createStatItem('Open Issues', (metadata.open_issues_count || 0).toLocaleString()));

  // Language
  if (metadata.language) {
    section.appendChild(createStatItem('Language', metadata.language));
  }

  return section;
}


// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
