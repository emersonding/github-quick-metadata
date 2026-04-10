/**
 * GitHub Quick Metadata - About Section Integration
 * Injects repository metadata directly into GitHub's native About section
 */

import { fetchRepoMetadataWithCache, fetchFirstCommitWithCache, fetchCommitActivityWithCache } from './shared.js';
import { calculateCommitStats } from '../core/stats.js';
import { formatDate, formatRelativeDate } from '../utils/date.js';
import { createElement, addClass } from '../utils/dom.js';
import { getCurrentRepo } from '../utils/github.js';
import { fetchRepoMetadataWithRateLimit } from '../core/api.js';

/**
 * Find GitHub's About section in the DOM
 * @returns {HTMLElement|null}
 */
function findAboutSection() {
  // GitHub's About section is typically in the right sidebar
  // Try multiple selectors for robustness across GitHub UI updates

  // Modern GitHub layout - look for the About section heading
  let aboutSection = document.querySelector('h2.h4.mb-3');
  if (aboutSection && aboutSection.textContent.trim() === 'About') {
    return aboutSection.closest('.BorderGrid-cell');
  }

  // Alternative: look for the sidebar with specific attributes
  const sidebar = document.querySelector('div[class*="Layout-sidebar"]');
  if (sidebar) {
    const aboutHeading = Array.from(sidebar.querySelectorAll('h2')).find(
      h => h.textContent.trim() === 'About'
    );
    if (aboutHeading) {
      return aboutHeading.closest('.BorderGrid-cell') || aboutHeading.parentElement;
    }
  }

  // Fallback: look for the container with repo metadata
  const metaContainer = document.querySelector('.BorderGrid-row .BorderGrid-cell:last-child');
  if (metaContainer) {
    const hasAboutContent = metaContainer.querySelector('p[class*="f4"]');
    if (hasAboutContent) {
      return metaContainer;
    }
  }

  return null;
}

/**
 * Create a metadata row that matches GitHub's About section styling
 * @param {string} icon - SVG icon HTML
 * @param {string} label - Label text
 * @param {string} value - Value text
 * @param {string} [title] - Optional tooltip text
 * @returns {HTMLElement}
 */
function createAboutRow(icon, label, value, title) {
  const row = createElement('div', {
    className: 'gqm-about-row',
    style: 'display: flex; align-items: center; margin-top: 8px; font-size: 14px; color: var(--fgColor-muted, #656d76);'
  });

  if (title) {
    row.setAttribute('title', title);
  }

  // Icon container
  const iconContainer = createElement('div', {
    style: 'display: flex; align-items: center; margin-right: 8px; flex-shrink: 0;',
    innerHTML: icon
  });

  // Label
  const labelEl = createElement('span', {
    textContent: label,
    style: 'margin-right: 4px;'
  });

  // Value
  const valueEl = createElement('span', {
    textContent: value,
    style: 'color: var(--fgColor-default, #1f2328); font-weight: 600;'
  });

  row.appendChild(iconContainer);
  row.appendChild(labelEl);
  row.appendChild(valueEl);

  return row;
}

/**
 * Create a loading placeholder row
 * @returns {HTMLElement}
 */
function createLoadingRow() {
  const row = createElement('div', {
    className: 'gqm-about-loading',
    style: 'margin-top: 8px; height: 20px; background: linear-gradient(90deg, #f6f8fa 25%, #eaeef2 50%, #f6f8fa 75%); background-size: 200% 100%; animation: gqm-shimmer 1.5s ease-in-out infinite; border-radius: 6px;'
  });

  return row;
}

/**
 * SVG icons matching GitHub's style
 */
const ICONS = {
  calendar: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" style="fill: currentColor;">
    <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"></path>
  </svg>`,

  commit: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" style="fill: currentColor;">
    <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
  </svg>`,

  activity: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" style="fill: currentColor;">
    <path d="M1.5 8a6.5 6.5 0 0 1 13 0 .75.75 0 0 0 1.5 0 8 8 0 1 0-8 8 .75.75 0 0 0 0-1.5A6.5 6.5 0 0 1 1.5 8Z"></path>
  </svg>`
};

/**
 * Get trend indicator with appropriate styling
 * @param {string} trend - 'increasing', 'decreasing', or 'stable'
 * @returns {string}
 */
function getTrendIndicator(trend) {
  const indicators = {
    increasing: '↗',
    decreasing: '↘',
    stable: '→'
  };
  return indicators[trend] || '→';
}

/**
 * Inject metadata into GitHub's About section
 * @param {HTMLElement} aboutSection - The About section container
 */
async function injectMetadata(aboutSection) {
  // Check if already injected
  if (aboutSection.querySelector('.gqm-metadata-container')) {
    return;
  }

  // Create container for our metadata
  const container = createElement('div', {
    className: 'gqm-metadata-container',
    style: 'margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--borderColor-muted, #d0d7de);'
  });

  // Add loading placeholders
  container.appendChild(createLoadingRow());
  container.appendChild(createLoadingRow());
  container.appendChild(createLoadingRow());

  // Insert into About section
  aboutSection.appendChild(container);

  // Fetch data in parallel
  try {
    const repo = getCurrentRepo();
    if (!repo) {
      throw new Error('Not a repository page');
    }

    const { owner, repo: repoName } = repo;

    // Fetch all data in parallel for maximum speed
    const [metadataResult, firstCommit, commitActivity] = await Promise.all([
      fetchRepoMetadataWithRateLimit(owner, repoName).catch(err => {
        console.warn('[github-quick-metadata] Metadata fetch failed, using cache:', err);
        return fetchRepoMetadataWithCache(owner, repoName);
      }),
      fetchFirstCommitWithCache(owner, repoName).catch(err => {
        console.warn('[github-quick-metadata] First commit fetch failed:', err);
        return null;
      }),
      fetchCommitActivityWithCache(owner, repoName).catch(err => {
        console.warn('[github-quick-metadata] Commit activity fetch failed:', err);
        return null;
      })
    ]);

    const metadata = metadataResult.data;

    // Clear loading placeholders
    container.innerHTML = '';

    // Add "Extended Metadata" header
    const header = createElement('div', {
      style: 'font-size: 12px; font-weight: 600; color: var(--fgColor-muted, #656d76); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;'
    });
    header.textContent = 'Quick Metadata';
    container.appendChild(header);

    // Add repository created date
    const createdRow = createAboutRow(
      ICONS.calendar,
      'Created',
      formatDate(metadata.created_at),
      formatRelativeDate(metadata.created_at)
    );
    container.appendChild(createdRow);

    // Add first commit date
    if (firstCommit && firstCommit.date) {
      const firstCommitRow = createAboutRow(
        ICONS.commit,
        'First commit',
        formatDate(firstCommit.date),
        formatRelativeDate(firstCommit.date)
      );
      container.appendChild(firstCommitRow);
    }

    // Add commit activity with trend
    if (commitActivity) {
      const stats = calculateCommitStats(commitActivity);
      const trendIndicator = getTrendIndicator(stats.trend);
      const commitValue = `${stats.totalCommits.toLocaleString()} ${trendIndicator}`;

      const commitsRow = createAboutRow(
        ICONS.activity,
        'Commits (past year)',
        commitValue,
        `Trend: ${stats.trend} (avg ${stats.avgCommitsPerWeek.toFixed(1)}/week)`
      );
      container.appendChild(commitsRow);
    }

  } catch (error) {
    console.error('[github-quick-metadata] Error injecting metadata:', error);

    // Show error state
    container.innerHTML = '';
    const errorMsg = createElement('div', {
      style: 'color: var(--fgColor-danger, #cf222e); font-size: 12px; margin-top: 8px;',
      textContent: `Failed to load metadata: ${error.message}`
    });
    container.appendChild(errorMsg);
  }
}

/**
 * Initialize About section integration
 * @returns {boolean} - True if successfully initialized
 */
export function initAboutIntegration() {
  // Add shimmer animation style if not already present
  if (!document.getElementById('gqm-about-styles')) {
    const style = createElement('style', { id: 'gqm-about-styles' });
    style.textContent = `
      @keyframes gqm-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @media (prefers-color-scheme: dark) {
        .gqm-about-loading {
          background: linear-gradient(90deg, #161b22 25%, #21262d 50%, #161b22 75%) !important;
          background-size: 200% 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const aboutSection = findAboutSection();
  if (!aboutSection) {
    console.log('[github-quick-metadata] About section not found, will retry on next navigation');
    return false;
  }

  injectMetadata(aboutSection);
  return true;
}

/**
 * Clean up injected metadata (for re-initialization on navigation)
 */
export function cleanupAboutIntegration() {
  const containers = document.querySelectorAll('.gqm-metadata-container');
  containers.forEach(container => container.remove());
}
