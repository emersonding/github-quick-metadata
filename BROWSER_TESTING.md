# Cross-Browser Testing Plan (US-009)

## Overview

This document provides a comprehensive cross-browser testing plan for the GitHub Quick Metadata extension, covering Chrome, Firefox, and Edge browsers across different operating systems.

## Browser Compatibility Matrix

| Browser | Minimum Version | Operating Systems | Extension API | Status |
|---------|----------------|-------------------|---------------|--------|
| **Chrome** | 88+ | Windows, macOS, Linux | Manifest V3 | ✅ Supported |
| **Edge** | 88+ | Windows, macOS | Manifest V3 | ✅ Supported |
| **Firefox** | 78+ | Windows, macOS, Linux | Manifest V2/V3 | ✅ Supported |
| Safari | 14+ | macOS, iOS | Safari Extensions | ❌ Not tested |
| Opera | Latest | Windows, macOS, Linux | Chromium-based | ⚠️ Should work (untested) |
| Brave | Latest | Windows, macOS, Linux | Chromium-based | ⚠️ Should work (untested) |

### Version Requirements Rationale

- **Chrome 88+**: Required for Manifest V3 support, `chrome.storage` API
- **Firefox 78+**: Required for Manifest V2 extensions with modern APIs
- **Edge 88+**: Chromium-based Edge, same requirements as Chrome

## Test Checklist by Browser

### Chrome (88+)

#### Installation & Loading
- [ ] Extension loads from `chrome://extensions/` without errors
- [ ] Manifest V3 parsed correctly (no warnings in console)
- [ ] Icons display correctly in toolbar (16x16, 48x48, 128x128)
- [ ] Extension badge shows correct state (active/inactive)

#### Core Features
- [ ] **Side panel opens** when clicking extension icon → "Open in Panel"
- [ ] **Popup displays** when clicking extension icon
- [ ] **Settings page** accessible from extension icon → Settings
- [ ] **Repository metadata loads** on GitHub repo pages
- [ ] **SPA navigation works** (turbo:load events fire correctly)

#### API Compatibility
- [ ] `chrome.storage.local` saves and retrieves GitHub token
- [ ] `chrome.action.setIcon()` updates extension icon state
- [ ] `chrome.tabs.query()` detects active GitHub tabs
- [ ] `fetch()` API calls to GitHub API succeed (no CORS errors)
- [ ] `localStorage` caching works correctly

#### Performance
- [ ] Extension loads in <500ms
- [ ] Panel opens in <300ms
- [ ] Metadata fetches complete in <2s (cached: <100ms)
- [ ] Memory usage <50MB after 10 repository visits
- [ ] No memory leaks after 30+ navigation events

#### Console & Errors
- [ ] No errors in DevTools console on load
- [ ] No errors when navigating between repos
- [ ] No errors when opening/closing panel
- [ ] Proper error messages for API failures (rate limit, 404, etc.)

#### Operating System Testing
- [ ] **Windows 10/11**: All features work
- [ ] **macOS 11+**: All features work
- [ ] **Linux (Ubuntu/Fedora)**: All features work

---

### Firefox (78+)

#### Installation & Loading
- [ ] Extension loads from `about:debugging` without errors
- [ ] Manifest parsed correctly (check Browser Console for warnings)
- [ ] Icons display correctly in toolbar
- [ ] Extension works in permanent installation (not just temporary)

#### Core Features
- [ ] **Popup displays** when clicking extension icon
- [ ] **Settings page** accessible (right-click icon → Manage Extension → Options)
- [ ] **Repository metadata loads** on GitHub repo pages
- [ ] **SPA navigation works** (turbo:load events fire correctly)
- [ ] **Side panel** (if supported in Firefox version)

#### API Compatibility
- [ ] `browser.storage.local` saves and retrieves GitHub token
- [ ] `browser.browserAction.setIcon()` updates extension icon state
- [ ] `browser.tabs.query()` detects active GitHub tabs
- [ ] `fetch()` API calls to GitHub API succeed (no CORS errors)
- [ ] `localStorage` caching works correctly

#### Firefox-Specific Concerns
- [ ] Manifest V2 compatibility (Firefox uses V2, not V3)
- [ ] `browser.*` namespace works (polyfill for `chrome.*` if needed)
- [ ] CSP (Content Security Policy) doesn't block extension scripts
- [ ] Extension doesn't break in Private Browsing mode

#### Performance
- [ ] Extension loads in <500ms
- [ ] Popup opens in <300ms
- [ ] Metadata fetches complete in <2s (cached: <100ms)
- [ ] Memory usage <50MB after 10 repository visits
- [ ] No memory leaks after 30+ navigation events

#### Console & Errors
- [ ] No errors in Browser Console on load
- [ ] No errors when navigating between repos
- [ ] No errors when opening/closing popup
- [ ] Proper error messages for API failures

#### Operating System Testing
- [ ] **Windows 10/11**: All features work
- [ ] **macOS 11+**: All features work
- [ ] **Linux (Ubuntu/Fedora)**: All features work

---

### Edge (88+)

#### Installation & Loading
- [ ] Extension loads from `edge://extensions/` without errors
- [ ] Manifest V3 parsed correctly (no warnings in console)
- [ ] Icons display correctly in toolbar
- [ ] Extension syncs across devices (if Edge sync enabled)

#### Core Features
- [ ] **Side panel opens** when clicking extension icon → "Open in Panel"
- [ ] **Popup displays** when clicking extension icon
- [ ] **Settings page** accessible from extension icon → Settings
- [ ] **Repository metadata loads** on GitHub repo pages
- [ ] **SPA navigation works** (turbo:load events fire correctly)

#### API Compatibility
- [ ] `chrome.storage.local` saves and retrieves GitHub token
- [ ] `chrome.action.setIcon()` updates extension icon state
- [ ] `chrome.tabs.query()` detects active GitHub tabs
- [ ] `fetch()` API calls to GitHub API succeed (no CORS errors)
- [ ] `localStorage` caching works correctly

#### Edge-Specific Concerns
- [ ] Works with Edge's tracking prevention (Balanced/Strict modes)
- [ ] Extension data syncs correctly (if Edge sync is enabled)
- [ ] Compatible with Edge's Collections and vertical tabs features
- [ ] No conflicts with Edge's built-in developer tools

#### Performance
- [ ] Extension loads in <500ms
- [ ] Panel opens in <300ms
- [ ] Metadata fetches complete in <2s (cached: <100ms)
- [ ] Memory usage <50MB after 10 repository visits
- [ ] No memory leaks after 30+ navigation events

#### Console & Errors
- [ ] No errors in DevTools console on load
- [ ] No errors when navigating between repos
- [ ] No errors when opening/closing panel
- [ ] Proper error messages for API failures

#### Operating System Testing
- [ ] **Windows 10/11**: All features work
- [ ] **macOS 11+**: All features work

---

## Testing Procedure

### Phase 1: Installation Testing

**For each browser (Chrome, Firefox, Edge):**

1. **Build the extension:**
   ```bash
   npm install
   npm run build:chrome    # For Chrome/Edge
   npm run build:firefox   # For Firefox
   ```

2. **Load the extension:**
   - **Chrome/Edge**: Navigate to `chrome://extensions/` or `edge://extensions/` → Enable Developer mode → Load unpacked → Select `dist/chrome` or `dist/firefox`
   - **Firefox**: Navigate to `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → Select `dist/firefox/manifest.json`

3. **Verify installation:**
   - Extension icon appears in toolbar
   - No errors in browser console
   - Extension shows as "Enabled" in extensions page

### Phase 2: Feature Testing

**For each browser:**

1. **Navigate to a public repository** (e.g., https://github.com/facebook/react)

2. **Test popup (Chrome/Edge/Firefox):**
   - Click extension icon
   - Verify popup opens and displays repository metadata
   - Check all sections: Repository Info, Commit Statistics, Additional Metrics
   - Verify commit chart renders correctly (52 bars)

3. **Test side panel (Chrome/Edge only):**
   - Click extension icon → "Open in Panel"
   - Verify panel opens on the right side
   - Check panel displays same data as popup
   - Close panel and verify it disappears

4. **Test settings page:**
   - Right-click extension icon → Options (or click Settings in popup)
   - Verify settings page opens
   - Test GitHub token input (add/remove/save)
   - Test cache management (view stats, clear cache)

5. **Test SPA navigation:**
   - Navigate to https://github.com/facebook/react
   - Wait for metadata to load
   - Click on another repository link (e.g., Issues → then navigate to another repo)
   - Verify metadata updates automatically without page refresh

6. **Test caching:**
   - Open DevTools → Network tab
   - Navigate to a repository (first visit)
   - Verify API calls to `api.github.com`
   - Navigate away and back to the same repository
   - Verify no new API calls (data loaded from cache)

### Phase 3: Performance Testing

**For each browser:**

1. **Measure load time:**
   - Open DevTools → Performance tab
   - Start recording
   - Reload the page
   - Stop recording
   - Verify extension scripts execute in <500ms

2. **Measure panel open time:**
   - Open DevTools → Performance tab
   - Start recording
   - Click to open panel/popup
   - Stop recording
   - Verify panel opens in <300ms

3. **Measure API fetch time:**
   - Open DevTools → Network tab
   - Navigate to an uncached repository
   - Measure time from navigation to data display
   - Verify completes in <2s (for repos with available stats)

4. **Memory leak testing:**
   - Open DevTools → Memory tab
   - Take heap snapshot (baseline)
   - Navigate between 30 different repositories
   - Take another heap snapshot
   - Compare: memory growth should be <10MB

### Phase 4: Error Handling Testing

**For each browser:**

1. **Test empty repository:**
   - Navigate to a repository with no commits
   - Verify error message: "Repository has no commits" or "First Commit: N/A"

2. **Test private repository (unauthenticated):**
   - Navigate to a private repository without token
   - Verify error message: "Unauthorized (401)" or "Not found (404)"

3. **Test rate limit:**
   - Make 60+ API requests (open 60 different repos quickly)
   - Verify rate limit error message shows remaining requests + reset time

4. **Test network error:**
   - Open DevTools → Network tab → Throttling → Offline
   - Navigate to a repository
   - Verify error message: "Network error" or "Failed to load metadata"
   - Re-enable network and retry
   - Verify data loads successfully

### Phase 5: Browser-Specific Testing

**Chrome-specific:**
- [ ] Test with Chrome DevTools → Application → Storage → Clear site data
- [ ] Test with Chrome's Site Settings → JavaScript disabled for github.com (extension should still work)
- [ ] Test with multiple Chrome profiles (data should be isolated)

**Firefox-specific:**
- [ ] Test in Private Browsing mode
- [ ] Test with Enhanced Tracking Protection (Strict mode)
- [ ] Verify `browser.*` API compatibility (no errors about missing `chrome.*`)

**Edge-specific:**
- [ ] Test with Edge's tracking prevention (Balanced and Strict modes)
- [ ] Test with Edge sync enabled (verify settings sync across devices)
- [ ] Test with Edge Collections feature active (no conflicts)

## Known Browser-Specific Issues

### Chrome
- **Side panel API**: Available in Chrome 114+, gracefully degrades to popup in older versions
- **Manifest V3**: Required, may have stricter CSP than Manifest V2
- **Performance**: Fastest JavaScript engine, best performance overall

### Firefox
- **Manifest V2 only**: Firefox doesn't support Manifest V3 yet (as of Firefox 109)
- **`browser.*` namespace**: Must use `browser.storage` instead of `chrome.storage` (or use polyfill)
- **Side panel**: Not supported, popup only
- **Private Browsing**: localStorage may not persist in private mode

### Edge
- **Chromium-based**: Same as Chrome for most features
- **Side panel**: Available in Edge 114+ (same as Chrome)
- **Tracking prevention**: May block third-party localStorage (check settings)
- **Sync**: Extension settings can sync across devices (if enabled)

## Automated Testing (Optional)

For regression testing, consider using:

```bash
# Install Playwright for browser automation
npm install -D @playwright/test

# Run automated tests across browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit  # Safari
```

**Test scenarios to automate:**
- Extension installation and basic functionality
- Navigation between repositories
- Cache invalidation and re-fetching
- Error handling (404, rate limits)

## Success Criteria

- ✅ Extension loads without errors on Chrome 88+, Firefox 78+, and Edge 88+
- ✅ All core features work identically across browsers
- ✅ Performance is acceptable (<500ms load, <2s data fetch)
- ✅ No console errors during normal operation
- ✅ Error messages are clear and actionable
- ✅ SPA navigation works smoothly (no manual refresh needed)
- ✅ Caching reduces API calls by 80%+ on repeated visits
- ✅ Memory usage remains stable (<50MB) after extended use

## Regression Testing

After making code changes, re-run these critical tests:

1. **Smoke test**: Install on Chrome, navigate to 3 repos, verify metadata loads
2. **SPA navigation**: Navigate between 5 repos without page refresh, verify updates
3. **Cache test**: Visit a repo, navigate away, return → verify cached data loads
4. **Error handling**: Test empty repo, rate limit, network error scenarios
5. **Performance**: Measure load time, panel open time, API fetch time

## Reporting Issues

When filing browser-specific bugs:

1. **Specify browser and version**: e.g., "Chrome 119.0.6045.105"
2. **Include operating system**: e.g., "Windows 11 22H2"
3. **Provide console logs**: Copy errors from DevTools console
4. **Include reproduction steps**: Numbered list of exact steps to reproduce
5. **Attach screenshots/recordings**: Visual evidence of the issue

## Next Steps

After completing this testing plan:

1. **Document any browser-specific workarounds** in the codebase
2. **Update README.md** with confirmed browser compatibility
3. **Create browser-specific builds** if needed (different manifests for Chrome/Firefox)
4. **Set up CI/CD pipeline** with automated browser testing
5. **Monitor user reports** for browser-specific issues in production
