/**
 * GitHub Quick Metadata - Popup Component
 * Displays repository metadata in browser extension popup (400px × 600px)
 */

import { createElement } from '../utils/dom.js';
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
    const settings = await getSettings();
    const enabledFields = getOrderedEnabledFields(settings.enabledFields || getDefaultEnabledFields());

    content.innerHTML = '';
    const { section, rowByField } = createRepoInfoSection(enabledFields);
    content.appendChild(section);

    const footer = createElement('div', { className: 'gqm-popup-footer' });
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

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
