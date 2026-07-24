/**
 * GitHub Quick Metadata - About Section Integration
 * Injects repository metadata directly into GitHub's native About section
 */

import {
  fetchBaseRepoMetadata,
  fetchReleaseDownloadStatsWithCache,
  formatErrorMessage,
  hasReleaseFields,
  isReleaseField
} from './shared.js';
import { createElement } from '../utils/dom.js';
import { getCurrentRepo } from '../utils/github.js';
import {
  FIELD_REGISTRY,
  formatFieldValue,
  getDefaultEnabledFields,
  getOrderedEnabledFields
} from '../core/field-registry.js';

/**
 * Find GitHub's About section in the DOM
 * @returns {HTMLElement|null}
 */
function findAboutSection() {
  // GitHub's About section lives in the right sidebar. Its markup has changed
  // several times, so locate it by the "About" heading rather than by any
  // specific (and frequently re-hashed) container class name.

  // 1. Primer / CSS-modules layout (current GitHub, 2024+).
  //    <div class="SidebarSection-module__sidebarSection...">
  //      <h2 data-component="Heading"><span>About</span></h2> ...
  const aboutHeading = findAboutHeading();
  if (aboutHeading) {
    const section =
      aboutHeading.closest('[class*="SidebarSection-module__sidebarSection"]') ||
      aboutHeading.closest('.BorderGrid-cell') ||
      aboutHeading.parentElement;
    if (section) {
      return section;
    }
  }

  // 2. Legacy layout fallback - container with repo metadata.
  const metaContainer = document.querySelector('.BorderGrid-row .BorderGrid-cell:last-child');
  if (metaContainer && metaContainer.querySelector('p[class*="f4"]')) {
    return metaContainer;
  }

  return null;
}

/**
 * Locate the "About" section heading regardless of GitHub's current markup.
 * @returns {HTMLElement|null}
 */
function findAboutHeading() {
  const headings = document.querySelectorAll(
    'h2[data-component="Heading"], h2.h4, [class*="SidebarSection-module__sectionHeading"]'
  );
  const heading = Array.from(headings).find(h => h.textContent.trim() === 'About');
  if (heading) {
    return heading;
  }

  // Last-resort scan of every sidebar heading.
  return (
    Array.from(document.querySelectorAll('h2, h3')).find(
      h => h.textContent.trim() === 'About'
    ) || null
  );
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
    textContent: `${label}:`,
    style: 'margin-right: 4px;'
  });

  // Value
  const valueEl = createElement('span', {
    textContent: value,
    className: 'gqm-about-value',
    style: 'color: var(--fgColor-default, #1f2328); font-weight: 600;'
  });

  row.appendChild(iconContainer);
  row.appendChild(labelEl);
  row.appendChild(valueEl);

  return row;
}

/**
 * Update a rendered About metadata row.
 * @param {HTMLElement} row
 * @param {{ primary: string, secondary?: string }} formattedValue
 */
function updateAboutRow(row, formattedValue) {
  if (!row || !formattedValue) return;

  const valueEl = row.querySelector('.gqm-about-value');
  if (!valueEl) return;

  valueEl.textContent = formattedValue.primary;

  if (formattedValue.secondary) {
    row.setAttribute('title', formattedValue.secondary);
  } else {
    row.removeAttribute('title');
  }
}

/**
 * SVG icons matching GitHub's style
 */
const ICONS = {
  calendar: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" style="fill: currentColor;">
    <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"></path>
  </svg>`,
  default: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" style="fill: currentColor;">
    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"></path>
  </svg>`
};

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

  // Insert into About section
  aboutSection.appendChild(container);

  // Fetch data
  try {
    const repo = getCurrentRepo();
    if (!repo) {
      throw new Error('Not a repository page');
    }

    const { owner, repo: repoName } = repo;
    const settings = await getSettings();
    const enabledFields = getOrderedEnabledFields(settings.enabledFields || getDefaultEnabledFields());

    container.innerHTML = '';

    // Add "Quick Metadata" header
    const header = createElement('div', {
      style: 'font-size: 12px; font-weight: 600; color: var(--fgColor-muted, #656d76); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;'
    });
    header.textContent = 'Quick Metadata';
    container.appendChild(header);

    const rowByField = renderAboutRows(container, enabledFields);

    const metadataResult = await fetchBaseRepoMetadata(owner, repoName);
    updateAboutRows(rowByField, metadataResult.data, enabledFields, fieldKey => !isReleaseField(fieldKey));

    if (hasReleaseFields(enabledFields)) {
      try {
        const releaseStatsResult = await fetchReleaseDownloadStatsWithCache(owner, repoName);
        updateAboutRows(rowByField, releaseStatsResult.data, enabledFields, isReleaseField);
      } catch (error) {
        console.warn('[github-quick-metadata] Error loading release metadata:', error);
        updateReleaseRowsError(rowByField, enabledFields);
      }
    }

  } catch (error) {
    console.error('[github-quick-metadata] Error injecting metadata:', error);

    // Show error state with friendly message
    container.innerHTML = '';
    const errorMsg = createElement('div', {
      style: 'color: var(--fgColor-muted, #656d76); font-size: 12px; margin-top: 8px; line-height: 1.5;',
      textContent: formatErrorMessage(error.message)
    });
    container.appendChild(errorMsg);
  }
}

/**
 * Render placeholder About rows for enabled fields.
 * @param {HTMLElement} container
 * @param {string[]} enabledFields
 * @returns {Map<string, HTMLElement>}
 */
function renderAboutRows(container, enabledFields) {
  const rowByField = new Map();

  enabledFields.forEach(fieldKey => {
    const field = FIELD_REGISTRY[fieldKey];
    if (!field) return;

    const icon = field.category === 'dates' ? ICONS.calendar : ICONS.default;
    const row = createAboutRow(icon, field.label, 'Loading...');
    rowByField.set(fieldKey, row);
    container.appendChild(row);
  });

  return rowByField;
}

/**
 * Update rendered About rows from a data payload.
 * @param {Map<string, HTMLElement>} rowByField
 * @param {object} metadata
 * @param {string[]} enabledFields
 * @param {(fieldKey: string) => boolean} shouldUpdate
 */
function updateAboutRows(rowByField, metadata, enabledFields, shouldUpdate) {
  enabledFields.forEach(fieldKey => {
    if (!shouldUpdate(fieldKey)) return;

    const row = rowByField.get(fieldKey);
    if (!row) return;

    const formattedValue = formatFieldValue(fieldKey, metadata);
    if (!formattedValue) return;

    updateAboutRow(row, formattedValue);
  });
}

/**
 * Mark release-backed About rows as unavailable after a release request failure.
 * @param {Map<string, HTMLElement>} rowByField
 * @param {string[]} enabledFields
 */
function updateReleaseRowsError(rowByField, enabledFields) {
  enabledFields.forEach(fieldKey => {
    if (!isReleaseField(fieldKey)) return;
    updateAboutRow(rowByField.get(fieldKey), { primary: 'Unable to load' });
  });
}

/**
 * Initialize About section integration
 * @returns {boolean} - True if successfully initialized
 */
export function initAboutIntegration() {
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
