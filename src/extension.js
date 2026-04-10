// Entry point for Chrome/Firefox extension content script

import { initAboutIntegration, cleanupAboutIntegration } from './ui/about-integration.js';
import { isGitHubPage, isRepoPage } from './utils/github.js';
import { initNavigationHandlers } from './core/navigation.js';

// Store event handlers
let messageHandler = null;
let navigationCleanup = null;
let retryAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 500;

/**
 * Wait for About section to appear in DOM (with retry)
 */
function waitForAboutSection(callback, attempt = 0) {
  if (attempt >= MAX_RETRY_ATTEMPTS) {
    console.log('[GitHubQuickMetadata] About section not found after retries');
    return;
  }

  const success = callback();
  if (!success) {
    // Retry after delay
    setTimeout(() => {
      waitForAboutSection(callback, attempt + 1);
    }, RETRY_DELAY_MS * (attempt + 1)); // Exponential backoff
  } else {
    retryAttempts = 0; // Reset for next navigation
  }
}

// Initialize About section integration when DOM is ready and on a GitHub repo page
function initialize() {
  if (!isGitHubPage()) {
    console.log('[GitHubQuickMetadata] Not a GitHub page, skipping');
    return;
  }

  if (!isRepoPage()) {
    console.log('[GitHubQuickMetadata] Not a repository page, skipping');
    return;
  }

  console.log('[GitHubQuickMetadata] Initializing on repository page');

  // Wait for About section to appear (GitHub uses Turbo/PJAX navigation)
  waitForAboutSection(initAboutIntegration);
}

// Re-initialize function for navigation changes
function reinitialize() {
  // Clean up previous integration
  cleanupAboutIntegration();

  // Re-check if we're on a repo page after navigation
  if (isRepoPage()) {
    // Wait for new About section to appear after navigation
    waitForAboutSection(initAboutIntegration);
  }
}

// Cleanup function to remove event listeners (prevents memory leaks)
function cleanup() {
  if (navigationCleanup) {
    navigationCleanup();
    navigationCleanup = null;
  }
  if (messageHandler && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.removeListener(messageHandler);
    messageHandler = null;
  }
  cleanupAboutIntegration();
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}

// Initialize navigation handlers for GitHub's Turbo SPA
navigationCleanup = initNavigationHandlers(reinitialize);

// Listen for messages from popup (for settings or future features)
messageHandler = (message, sender, sendResponse) => {
  if (message.action === 'reinitialize') {
    reinitialize();
    sendResponse({ success: true });
    return true;
  }

  // Legacy support for openPanel action (no-op now, metadata is always visible)
  if (message.action === 'openPanel') {
    sendResponse({ success: true, message: 'Metadata is now integrated into About section' });
    return true;
  }
};

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(messageHandler);
}

// Cleanup on page unload (prevents memory leaks)
window.addEventListener('unload', cleanup, { once: true });
