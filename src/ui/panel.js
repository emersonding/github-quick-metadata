/**
 * GitHub Quick Metadata - Side Panel Component
 * Displays repository metadata in a sliding panel
 */

import { createElement, addClass, removeClass, toggleClass } from '../utils/dom.js';
import { getCurrentRepo } from '../utils/github.js';
import {
  FIELD_REGISTRY,
  formatFieldValue,
  getDefaultEnabledFields,
  getOrderedEnabledFields
} from '../core/field-registry.js';
import {
  fetchBaseRepoMetadata,
  fetchReleaseDownloadStatsWithCache,
  hasReleaseFields,
  isReleaseField,
  createLoadingSkeleton,
  createErrorState,
  createMetaItem,
  createRateLimitDisplay,
  updateMetaItem,
  updateRateLimitDisplay
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
    const settings = await getSettings();
    const enabledFields = getOrderedEnabledFields(settings.enabledFields || getDefaultEnabledFields());

    content.innerHTML = '';
    const { section, rowByField } = createRepoInfoSection(enabledFields);
    content.appendChild(section);

    const footer = createElement('div', { className: 'gqm-panel-footer' });
    footer.appendChild(createRateLimitDisplay(null));
    content.appendChild(footer);

    const metadataResult = await fetchBaseRepoMetadata(owner, repoName);
    updateRepoInfoRows(rowByField, metadataResult.data, enabledFields, fieldKey => !isReleaseField(fieldKey));
    updateRateLimitDisplay(footer, metadataResult.rateLimit);

    if (hasReleaseFields(enabledFields)) {
      try {
        const releaseStatsResult = await fetchReleaseDownloadStatsWithCache(owner, repoName);
        updateRepoInfoRows(rowByField, releaseStatsResult.data, enabledFields, isReleaseField);
        updateRateLimitDisplay(footer, releaseStatsResult.rateLimit || metadataResult.rateLimit);
      } catch (error) {
        console.warn('[github-quick-metadata] Error loading release metadata:', error);
        updateReleaseRowsError(rowByField, enabledFields);
      }
    }

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
 * @param {string[]} enabledFields
 * @returns {{ section: HTMLElement, rowByField: Map<string, HTMLElement> }}
 */
function createRepoInfoSection(enabledFields) {
  const section = createElement('div', { className: 'gqm-section' }, [
    createElement('h3', { className: 'gqm-section-title', textContent: 'Repository Info' })
  ]);
  const rowByField = new Map();

  // Render each enabled field
  enabledFields.forEach(fieldKey => {
    const field = FIELD_REGISTRY[fieldKey];
    if (!field) return;

    const row = createMetaItem(field.label, 'Loading...');
    rowByField.set(fieldKey, row);
    section.appendChild(row);
  });

  return { section, rowByField };
}

/**
 * Update rendered metadata rows from a data payload.
 * @param {Map<string, HTMLElement>} rowByField
 * @param {object} metadata
 * @param {string[]} enabledFields
 * @param {(fieldKey: string) => boolean} shouldUpdate
 */
function updateRepoInfoRows(rowByField, metadata, enabledFields, shouldUpdate) {
  enabledFields.forEach(fieldKey => {
    if (!shouldUpdate(fieldKey)) return;

    const row = rowByField.get(fieldKey);
    if (!row) return;

    const formattedValue = formatFieldValue(fieldKey, metadata);
    if (!formattedValue) return;

    updateMetaItem(row, formattedValue);
  });
}

/**
 * Mark release-backed rows as unavailable after a release request failure.
 * @param {Map<string, HTMLElement>} rowByField
 * @param {string[]} enabledFields
 */
function updateReleaseRowsError(rowByField, enabledFields) {
  enabledFields.forEach(fieldKey => {
    if (!isReleaseField(fieldKey)) return;
    updateMetaItem(rowByField.get(fieldKey), { primary: 'Unable to load' });
  });
}
