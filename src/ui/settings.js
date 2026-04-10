/**
 * GitHub Quick Metadata - Settings Page
 * Manages extension configuration via chrome.storage.local
 */

import { cacheStats, cacheClear } from '../core/cache.js';
import { FIELD_REGISTRY, getDefaultEnabledFields, getFieldsByCategory } from '../core/field-registry.js';

// Default settings
const DEFAULT_SETTINGS = {
  githubToken: null,
  displayMode: 'panel',
  theme: 'auto',
  cacheEnabled: true,
  enabledFields: getDefaultEnabledFields()
};

// Debounce timeout for auto-save
let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 500;

/**
 * Initialize the settings page
 */
export async function initSettings() {
  console.log('[github-quick-metadata] Initializing settings page');

  // Load current settings
  await loadSettings();

  // Load cache statistics
  await updateCacheStats();

  // Render field checkboxes
  renderFieldCheckboxes();

  // Set up event listeners
  setupEventListeners();

  console.log('[github-quick-metadata] Settings page initialized');
}

/**
 * Load settings from chrome.storage.local and populate UI
 */
async function loadSettings() {
  try {
    const settings = await getSettings();

    // Populate GitHub token
    const tokenInput = document.getElementById('githubToken');
    if (tokenInput && settings.githubToken) {
      tokenInput.value = settings.githubToken;
    }

    // Set display mode toggle
    const displayModeOptions = document.querySelectorAll('[data-mode]');
    displayModeOptions.forEach(option => {
      const mode = option.getAttribute('data-mode');
      if (mode === settings.displayMode) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    // Set theme toggle
    const themeOptions = document.querySelectorAll('[data-theme]');
    themeOptions.forEach(option => {
      const theme = option.getAttribute('data-theme');
      if (theme === settings.theme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    // Set cache enabled checkbox
    const cacheEnabledCheckbox = document.getElementById('cacheEnabled');
    if (cacheEnabledCheckbox) {
      cacheEnabledCheckbox.checked = settings.cacheEnabled;
    }

    console.log('[github-quick-metadata] Settings loaded:', settings);
  } catch (error) {
    console.error('[github-quick-metadata] Error loading settings:', error);
  }
}

/**
 * Get settings from chrome.storage.local
 * @returns {Promise<object>}
 */
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || DEFAULT_SETTINGS;
      // Merge with defaults to ensure all keys exist
      resolve({ ...DEFAULT_SETTINGS, ...settings });
    });
  });
}

/**
 * Save settings to chrome.storage.local
 * @param {object} settings
 */
async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, () => {
      console.log('[github-quick-metadata] Settings saved:', settings);
      showSaveIndicator();
      resolve();
    });
  });
}

/**
 * Save settings with debounce
 * @param {object} settings
 */
function saveSettingsDebounced(settings) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveSettings(settings);
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Show save indicator animation
 */
function showSaveIndicator() {
  const indicator = document.getElementById('saveIndicator');
  if (!indicator) return;

  indicator.classList.add('show');

  setTimeout(() => {
    indicator.classList.remove('show');
  }, 2000);
}

/**
 * Render field checkboxes dynamically from registry
 */
async function renderFieldCheckboxes() {
  const settings = await getSettings();
  const enabledFields = settings.enabledFields || getDefaultEnabledFields();
  const fieldsByCategory = getFieldsByCategory();

  const categories = [
    { id: 'dates', title: 'Date Fields', fields: fieldsByCategory.dates },
    { id: 'metrics', title: 'Metrics', fields: fieldsByCategory.metrics },
    { id: 'info', title: 'Information', fields: fieldsByCategory.info },
    { id: 'flags', title: 'Flags', fields: fieldsByCategory.flags }
  ];

  categories.forEach(category => {
    const container = document.getElementById(`fieldsCategory-${category.id}`);
    if (!container) return;

    container.innerHTML = '';

    category.fields.forEach(field => {
      const checkboxWrapper = document.createElement('div');
      checkboxWrapper.className = 'checkbox-group';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `field-${field.key}`;
      checkbox.className = 'checkbox-input';
      checkbox.checked = enabledFields.includes(field.key);
      checkbox.dataset.fieldKey = field.key;

      const label = document.createElement('label');
      label.htmlFor = `field-${field.key}`;
      label.className = 'checkbox-label';
      label.textContent = field.label;

      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(label);
      container.appendChild(checkboxWrapper);
    });
  });
}

/**
 * Set up event listeners for all settings controls
 */
function setupEventListeners() {
  // GitHub token input
  const tokenInput = document.getElementById('githubToken');
  if (tokenInput) {
    tokenInput.addEventListener('input', async (e) => {
      const settings = await getSettings();
      settings.githubToken = e.target.value.trim() || null;
      saveSettingsDebounced(settings);
    });
  }

  // Display mode toggles
  const displayModeOptions = document.querySelectorAll('[data-mode]');
  displayModeOptions.forEach(option => {
    option.addEventListener('click', async () => {
      const mode = option.getAttribute('data-mode');

      // Update UI
      displayModeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      // Save setting
      const settings = await getSettings();
      settings.displayMode = mode;
      await saveSettings(settings);
    });
  });

  // Theme toggles
  const themeOptions = document.querySelectorAll('[data-theme]');
  themeOptions.forEach(option => {
    option.addEventListener('click', async () => {
      const theme = option.getAttribute('data-theme');

      // Update UI
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      // Save setting
      const settings = await getSettings();
      settings.theme = theme;
      await saveSettings(settings);
    });
  });

  // Cache enabled checkbox
  const cacheEnabledCheckbox = document.getElementById('cacheEnabled');
  if (cacheEnabledCheckbox) {
    cacheEnabledCheckbox.addEventListener('change', async (e) => {
      const settings = await getSettings();
      settings.cacheEnabled = e.target.checked;
      await saveSettings(settings);
    });
  }

  // Field checkboxes (delegated event listener)
  document.addEventListener('change', async (e) => {
    if (e.target.matches('.checkbox-input[data-field-key]')) {
      const fieldKey = e.target.dataset.fieldKey;
      const settings = await getSettings();

      if (e.target.checked) {
        // Add field to enabled list
        if (!settings.enabledFields.includes(fieldKey)) {
          settings.enabledFields.push(fieldKey);
        }
      } else {
        // Remove field from enabled list
        settings.enabledFields = settings.enabledFields.filter(k => k !== fieldKey);
      }

      await saveSettings(settings);
    }
  });

  // Clear cache button
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to clear all cached data? This cannot be undone.')) {
        return;
      }

      try {
        clearCacheBtn.disabled = true;
        clearCacheBtn.textContent = 'Clearing...';

        // Clear cache
        cacheClear();

        // Update stats display
        await updateCacheStats();

        clearCacheBtn.disabled = false;
        clearCacheBtn.innerHTML = '🗑️ Clear Cache';

        // Show success indicator
        showSaveIndicator();

        console.log('[github-quick-metadata] Cache cleared successfully');
      } catch (error) {
        console.error('[github-quick-metadata] Error clearing cache:', error);
        clearCacheBtn.disabled = false;
        clearCacheBtn.innerHTML = '🗑️ Clear Cache';
        alert('Failed to clear cache. Please try again.');
      }
    });
  }
}

/**
 * Update cache statistics display
 */
async function updateCacheStats() {
  try {
    const stats = cacheStats();

    // Update entry count
    const entryCountEl = document.getElementById('cacheEntryCount');
    if (entryCountEl) {
      entryCountEl.textContent = stats.entryCount.toLocaleString();
    }

    // Update used space
    const usedSpaceEl = document.getElementById('cacheUsedSpace');
    if (usedSpaceEl) {
      const sizeKB = (stats.usedBytes / 1024).toFixed(2);
      const sizeMB = (stats.usedBytes / (1024 * 1024)).toFixed(2);
      usedSpaceEl.textContent = stats.usedBytes < 1024 * 100 ? `${sizeKB} KB` : `${sizeMB} MB`;
    }

    // Update progress bar
    const progressBar = document.getElementById('cacheProgressBar');
    if (progressBar) {
      progressBar.style.width = `${stats.usedPercent}%`;
    }

    // Update percent text
    const percentText = document.getElementById('cachePercentText');
    if (percentText) {
      percentText.textContent = `${stats.usedPercent}% of estimated quota used`;
    }

    console.log('[github-quick-metadata] Cache stats updated:', stats);
  } catch (error) {
    console.error('[github-quick-metadata] Error updating cache stats:', error);
  }
}

// Initialize settings when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettings);
} else {
  initSettings();
}
