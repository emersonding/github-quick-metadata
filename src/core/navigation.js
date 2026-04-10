/**
 * SPA navigation handling for GitHub's Turbo framework
 *
 * GitHub uses Turbo (formerly pjax) for client-side navigation between pages.
 * Without this module, the extension would only activate on hard page loads
 * and appear broken when users click between repositories.
 *
 * Strategy:
 * 1. Primary: Listen to 'turbo:load' events (fired by GitHub's Turbo on every navigation)
 * 2. Fallback: MutationObserver watching <title> changes (covers edge cases)
 * 3. Debounce: 300ms window to prevent duplicate calls during rapid navigation
 */

import { parseRepoFromUrl, isRepoPage } from './parser.js';

const DEBOUNCE_MS = 300;

/**
 * Build a canonical key from an owner/repo pair for change detection.
 * @param {string} owner
 * @param {string} repo
 * @returns {string}
 */
function repoKey(owner, repo) {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

/**
 * Simple debounce: returns a function that delays invoking fn by wait ms.
 * Cancels any pending invocation if called again within the window.
 *
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
function debounce(fn, wait) {
  let timer = null;
  return function debounced(...args) {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
}

/**
 * Initialize navigation handlers that detect when the user navigates to a
 * different GitHub repository and invoke onRepoChange with the new repo info.
 *
 * Handles:
 * - turbo:load events (GitHub's Turbo SPA framework)
 * - MutationObserver on <title> as a fallback
 * - Debouncing rapid navigation (300ms)
 * - Deduplication: onRepoChange is only called when the repo actually changes
 *
 * @param {function({ owner: string, repo: string }): void} onRepoChange
 *   Callback invoked when navigating to a new repository page.
 *   Not called for navigation within the same repo (e.g. Issues → Code).
 * @returns {function(): void} cleanup function — call to remove all listeners
 */
export function initNavigationHandlers(onRepoChange) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Non-browser environment (tests without jsdom, etc.)
    return () => {};
  }

  let currentRepoKey = null;

  // Initialize with the current page so we don't fire on the first load
  // if the caller already handles the initial page themselves.
  const initialParsed = parseRepoFromUrl(window.location.href);
  if (initialParsed) {
    currentRepoKey = repoKey(initialParsed.owner, initialParsed.repo);
  }

  /**
   * Core handler: check current URL, compare to last known repo, invoke callback
   * if we've navigated to a different repo.
   */
  function handleNavigation() {
    const url = window.location.href;

    if (!isRepoPage(url)) {
      // Navigated away from a repo page — update state but don't callback
      currentRepoKey = null;
      return;
    }

    const parsed = parseRepoFromUrl(url);
    if (!parsed) {
      currentRepoKey = null;
      return;
    }

    const newKey = repoKey(parsed.owner, parsed.repo);
    if (newKey === currentRepoKey) {
      // Same repo, different sub-page (e.g. /issues → /pulls) — no-op
      return;
    }

    currentRepoKey = newKey;
    onRepoChange({ owner: parsed.owner, repo: parsed.repo });
  }

  const debouncedHandleNavigation = debounce(handleNavigation, DEBOUNCE_MS);

  // --- Primary: turbo:load ---
  // GitHub fires this on every Turbo navigation (replaces DOMContentLoaded for SPAs)
  document.addEventListener('turbo:load', debouncedHandleNavigation);

  // Also listen to turbo:render which fires when Turbo replaces the body
  // (covers partial renders that may not trigger turbo:load)
  document.addEventListener('turbo:render', debouncedHandleNavigation);

  // --- Fallback: MutationObserver on <title> ---
  // <title> changes reliably on every GitHub navigation, even if Turbo events
  // don't fire (e.g. older GitHub versions, enterprise, or future framework changes)
  let lastTitle = document.title;
  const titleObserver = new MutationObserver(() => {
    const newTitle = document.title;
    if (newTitle !== lastTitle) {
      lastTitle = newTitle;
      debouncedHandleNavigation();
    }
  });

  const titleEl = document.querySelector('title');
  if (titleEl) {
    titleObserver.observe(titleEl, { childList: true, subtree: true, characterData: true });
  }

  // Also observe <head> in case <title> is replaced entirely (some Turbo versions
  // replace the entire <head> subtree rather than mutating the existing <title>)
  const headEl = document.querySelector('head');
  if (headEl) {
    titleObserver.observe(headEl, { childList: true });
  }

  // --- Cleanup ---
  function cleanup() {
    document.removeEventListener('turbo:load', debouncedHandleNavigation);
    document.removeEventListener('turbo:render', debouncedHandleNavigation);
    titleObserver.disconnect();
  }

  return cleanup;
}
