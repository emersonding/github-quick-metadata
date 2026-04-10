/**
 * GitHub Quick Metadata - Side Panel Component
 * Displays repository metadata in a sliding panel
 */

import { fetchRepoMetadataWithRateLimit } from '../core/api.js';
import { createElement, addClass, removeClass, toggleClass } from '../utils/dom.js';
import { getCurrentRepo } from '../utils/github.js';
import { FIELD_REGISTRY, formatFieldValue } from '../core/field-registry.js';
import {
  fetchRepoMetadataWithCache,
  createLoadingSkeleton,
  createErrorState,
  createMetaItem,
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

  return panel;
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

    // Fetch metadata only
    const metadataResult = await fetchRepoMetadataWithRateLimit(owner, repoName).catch(err => {
      // Try cache on failure
      return fetchRepoMetadataWithCache(owner, repoName);
    });

    const metadata = metadataResult.data;
    const rateLimit = metadataResult.rateLimit;

    // Render content
    content.innerHTML = '';
    const section = await createRepoInfoSection(metadata);
    content.appendChild(section);

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
 * Get settings from chrome.storage.local
 * @returns {Promise<object>}
 */
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      resolve(settings);
    });
  });
}

/**
 * Create repository info section
 * @param {object} metadata
 * @returns {Promise<HTMLElement>}
 */
async function createRepoInfoSection(metadata) {
  const section = createElement('div', { className: 'gqm-section' }, [
    createElement('h3', { className: 'gqm-section-title', textContent: 'Repository Info' })
  ]);

  // Get enabled fields from settings
  const settings = await getSettings();
  const enabledFields = settings.enabledFields || ['created_at', 'updated_at'];

  // Render each enabled field
  enabledFields.forEach(fieldKey => {
    const field = FIELD_REGISTRY[fieldKey];
    if (!field) return;

    const formattedValue = formatFieldValue(fieldKey, metadata);
    if (!formattedValue) return;

    section.appendChild(
      createMetaItem(
        field.label,
        formattedValue.primary,
        formattedValue.secondary
      )
    );
  });

  return section;
}
