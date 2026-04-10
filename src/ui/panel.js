/**
 * GitHub Quick Metadata - Side Panel Component
 * Displays repository metadata in a sliding panel
 */

import { fetchRepoMetadataWithRateLimit } from '../core/api.js';
import { calculateCommitStats } from '../core/stats.js';
import { formatDate, formatRelativeDate, formatDateTime } from '../utils/date.js';
import { createElement, addClass, removeClass, toggleClass } from '../utils/dom.js';
import { getCurrentRepo } from '../utils/github.js';
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
 * Debounce function to prevent rapid repeated calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timeoutId = null;
  return function debounced(...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Create the side panel component
 * @returns {HTMLElement} Panel container element
 */
export function createPanel() {
  let dataLoaded = false;

  // Create panel structure
  const panel = createElement('div', { className: 'gqm-panel' });

  // Panel content (created early so it can be passed to toggle handler)
  const content = createElement('div', { className: 'gqm-panel-content' });

  // Debounced toggle function with lazy loading
  const debouncedToggle = debounce(() => {
    toggleClass(panel, 'gqm-panel-open');

    // Load data on first open
    if (!dataLoaded && panel.classList.contains('gqm-panel-open')) {
      dataLoaded = true;
      loadPanelData(content);
    }
  }, 300);

  const toggleBtn = createElement('button', {
    className: 'gqm-toggle-btn',
    textContent: 'Repo Metadata',
    onClick: debouncedToggle
  });

  // Panel header
  const header = createElement('div', { className: 'gqm-panel-header' }, [
    createElement('h2', { className: 'gqm-panel-title', textContent: 'Repository Metadata' }),
    createElement('button', {
      className: 'gqm-close-btn',
      innerHTML: '✕',
      onClick: () => closePanel(panel)
    })
  ]);

  panel.appendChild(header);
  panel.appendChild(content);

  // Append to body
  document.body.appendChild(panel);
  document.body.appendChild(toggleBtn);

  // Don't load data immediately - wait for first panel open

  return panel;
}

/**
 * Toggle panel open/close state
 * @param {HTMLElement} panel
 * @deprecated Use debounced version in createPanel instead
 */
function togglePanel(panel) {
  toggleClass(panel, 'gqm-panel-open');
}

/**
 * Close the panel
 * @param {HTMLElement} panel
 */
function closePanel(panel) {
  removeClass(panel, 'gqm-panel-open');
}

/**
 * Load and display panel data
 * @param {HTMLElement} content - Panel content container
 */
async function loadPanelData(content) {
  // Show loading skeleton
  content.innerHTML = '';
  content.appendChild(createLoadingSkeleton());

  try {
    const repo = getCurrentRepo();
    if (!repo) {
      throw new Error('Not a repository page');
    }

    const { owner, repo: repoName } = repo;

    // Fetch all data in parallel - capture full response for rate limit info
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

    // Render content
    content.innerHTML = '';
    content.appendChild(createRepoInfoSection(metadata, firstCommit));
    content.appendChild(createStatsSection(stats));
    content.appendChild(createMetricsSection(metadata));

    // Add rate limit footer
    const footer = createElement('div', { className: 'gqm-panel-footer' });
    if (rateLimit) {
      footer.appendChild(createRateLimitDisplay(rateLimit));
    }
    content.appendChild(footer);

  } catch (error) {
    console.error('[github-quick-metadata] Error loading panel data:', error);
    content.innerHTML = '';
    content.appendChild(createErrorState(error.message, () => loadPanelData(content)));
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

  // Add commit chart visualization
  if (stats.weeklyCommits && stats.weeklyCommits.length > 0) {
    section.appendChild(renderCommitChart(stats.weeklyCommits));
  }

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
 * Render CSS-only commit activity chart (52 weeks)
 * @param {Array<{week: Date, count: number}>} weeklyCommits - 52 weeks of commit data
 * @returns {HTMLElement}
 */
function renderCommitChart(weeklyCommits) {
  // Calculate max count for scaling bars
  const maxCount = Math.max(...weeklyCommits.map(w => w.count), 1);

  // Create chart container
  const chartContainer = createElement('div', { className: 'gqm-commit-chart' });

  // Create table for semantic HTML structure
  const table = createElement('table', { className: 'gqm-chart-table' });
  const tbody = createElement('tbody');
  const row = createElement('tr');

  // Create bars for each week
  weeklyCommits.forEach(({ week, count }) => {
    const cell = createElement('td');
    const bar = createElement('div', { className: 'gqm-chart-bar' });

    // Calculate bar height (0-100% based on max)
    const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;

    // Determine color intensity based on commit count
    let colorClass = 'gqm-bar-empty';
    if (count > 0) {
      if (count >= maxCount * 0.75) {
        colorClass = 'gqm-bar-high';
      } else if (count >= maxCount * 0.50) {
        colorClass = 'gqm-bar-med-high';
      } else if (count >= maxCount * 0.25) {
        colorClass = 'gqm-bar-med';
      } else {
        colorClass = 'gqm-bar-low';
      }
    }

    addClass(bar, colorClass);
    bar.style.height = `${heightPercent}%`;

    // Add tooltip with date and count
    const dateStr = formatDate(week);
    const tooltip = count === 1 ? '1 commit' : `${count} commits`;
    bar.setAttribute('title', `${dateStr}: ${tooltip}`);

    cell.appendChild(bar);
    row.appendChild(cell);
  });

  tbody.appendChild(row);
  table.appendChild(tbody);
  chartContainer.appendChild(table);

  return chartContainer;
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

