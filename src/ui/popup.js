/**
 * GitHub Quick Metadata - Popup Component
 * Displays repository metadata in browser extension popup (400px × 600px)
 */

import { fetchRepoMetadataWithRateLimit } from '../core/api.js';
import { cacheGet, buildCacheKey } from '../core/cache.js';
import { createElement } from '../utils/dom.js';
import { FIELD_REGISTRY, formatFieldValue } from '../core/field-registry.js';
import {
  fetchRepoMetadataWithCache,
  createLoadingSkeleton,
  createErrorState,
  createMetaItem,
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

    // If we have cached data, display it immediately
    if (cachedMetadata) {
      content.innerHTML = '';
      const cachedSection = await createRepoInfoSection(cachedMetadata);
      content.appendChild(cachedSection);
    }

    // Fetch fresh data
    const metadataResult = await fetchRepoMetadataWithRateLimit(owner, repoName).catch(err => {
      // Try cache on failure
      return fetchRepoMetadataWithCache(owner, repoName);
    });

    const metadata = metadataResult.data;
    const rateLimit = metadataResult.rateLimit;

    // Render content (update with fresh data)
    content.innerHTML = '';
    const section = await createRepoInfoSection(metadata);
    content.appendChild(section);

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

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
