# Userscript Testing Plan (US-008)

## Overview

This document provides a comprehensive testing plan for the GitHub Quick Metadata userscript, covering installation, verification, and compatibility testing across different userscript managers.

## Installation Instructions

### Tampermonkey (Chrome, Firefox, Safari, Edge)

1. **Install Tampermonkey extension:**
   - **Chrome/Edge**: Visit [Chrome Web Store - Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - **Firefox**: Visit [Firefox Add-ons - Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - **Safari**: Visit [Tampermonkey for Safari](https://www.tampermonkey.net/?browser=safari)

2. **Install the userscript:**
   - Build the userscript: `npm run build:userscript`
   - Navigate to `dist/userscript/github-quick-metadata.user.js`
   - Copy the entire file contents
   - Click the Tampermonkey icon in your browser toolbar
   - Select "Create a new script..."
   - Delete the default template code
   - Paste the GitHub Quick Metadata userscript code
   - Click File → Save (or Ctrl/Cmd+S)

3. **Verify installation:**
   - The Tampermonkey icon should show a badge with "1" indicating 1 active script
   - Click the icon to see "GitHub Quick Metadata" listed as enabled

### Violentmonkey (Chrome, Firefox, Edge)

1. **Install Violentmonkey extension:**
   - **Chrome/Edge**: Visit [Chrome Web Store - Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
   - **Firefox**: Visit [Firefox Add-ons - Violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)

2. **Install the userscript:**
   - Build the userscript: `npm run build:userscript`
   - Click the Violentmonkey icon → "+" (New script)
   - Delete the default template
   - Paste the contents of `dist/userscript/github-quick-metadata.user.js`
   - Click the save icon or Ctrl/Cmd+S

3. **Verify installation:**
   - Violentmonkey icon should show the script is installed
   - Dashboard should list "GitHub Quick Metadata" as enabled

### Greasemonkey (Firefox only)

1. **Install Greasemonkey extension:**
   - Visit [Firefox Add-ons - Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
   - Click "Add to Firefox"

2. **Install the userscript:**
   - Build the userscript: `npm run build:userscript`
   - Click the Greasemonkey icon → "New user script"
   - Delete the default template
   - Paste the contents of `dist/userscript/github-quick-metadata.user.js`
   - Click File → Save Script

3. **Verify installation:**
   - Greasemonkey icon should show "1" indicating 1 installed script
   - Open Greasemonkey dashboard to confirm "GitHub Quick Metadata" is listed and enabled

## Verification Checklist

### ✅ Core Functionality

- [ ] **Userscript installs successfully** without errors in the console
- [ ] **Works on GitHub repository pages** (e.g., https://github.com/facebook/react)
- [ ] **"Repo Metadata" toggle button appears** on repository pages
- [ ] **Clicking toggle button opens/closes the side panel** smoothly
- [ ] **Panel displays repository metadata** correctly:
  - Creation date
  - First commit date
  - Last update date
  - Commit statistics (past year)
  - Weekly commit chart (52 weeks)
  - Repository metrics (stars, forks, issues, language)

### ✅ Userscript Manager APIs

- [ ] **GM_getValue/GM_setValue persist data** across browser sessions:
  - Set a GitHub Personal Access Token in localStorage
  - Close and reopen the browser
  - Verify token is still stored and used for API requests

- [ ] **GM_xmlhttpRequest makes API calls without CORS errors**:
  - Open browser DevTools → Network tab
  - Navigate to a repository page
  - Verify GitHub API calls to `api.github.com` are successful (200/202 status)
  - Confirm no CORS errors in the console

- [ ] **localStorage persistence**:
  - Open a repository (e.g., facebook/react)
  - Wait for data to load
  - Navigate away and return to the same repository
  - Verify data loads from cache (check Network tab - no new API calls)

### ✅ Metadata Block Compliance

- [ ] **@name, @namespace, @version present** in the userscript header
- [ ] **@description is clear and concise**
- [ ] **@match patterns are correct** (https://github.com/*/*)
- [ ] **@grant directives include all required APIs**:
  - `GM_getValue`
  - `GM_setValue`
  - `GM_xmlhttpRequest` (for Greasemonkey compatibility)
  - Or `none` if using standard `fetch` API
- [ ] **@run-at document-end** or `document-idle` for proper DOM timing
- [ ] **@icon or @iconURL included** for visual identification
- [ ] **@homepageURL and @supportURL** point to correct locations
- [ ] **@license MIT** specified

### ✅ No Conflicts with Other Userscripts

- [ ] **Test with other popular userscripts installed:**
  - GitHub Dark Theme
  - Refined GitHub
  - OctoLinker
  - GitHub File Icons

- [ ] **Verify no JavaScript errors** when multiple scripts are active
- [ ] **Confirm toggle button doesn't overlap** with other UI elements
- [ ] **Panel z-index is appropriate** (visible above GitHub UI but below modals)

### ✅ Edge Cases (see EDGE_CASE_TESTING.md for details)

- [ ] Empty repositories (no commits) show appropriate message
- [ ] Private repos without authentication show API error
- [ ] Archived repositories load metadata correctly
- [ ] Large repos (10,000+ commits) use timeout correctly
- [ ] SPA navigation between repos refreshes metadata
- [ ] Rate limit messages show remaining requests + reset time

## Test Scenarios

### Scenario 1: Fresh Installation on Chrome + Tampermonkey

**Steps:**
1. Install Tampermonkey from Chrome Web Store
2. Install GitHub Quick Metadata userscript
3. Navigate to https://github.com/facebook/react
4. Verify "Repo Metadata" button appears
5. Click button and verify panel opens with correct data

**Expected Result:**
- Button visible in bottom-right corner
- Panel slides in from right side
- All metadata fields populated correctly
- Commit chart displays 52 weeks of data
- No console errors

### Scenario 2: Firefox + Greasemonkey with Multiple Userscripts

**Steps:**
1. Install Greasemonkey and 2-3 other popular GitHub userscripts
2. Install GitHub Quick Metadata
3. Navigate to https://github.com/torvalds/linux
4. Verify all userscripts work without conflicts

**Expected Result:**
- All userscripts active and functional
- No JavaScript errors in console
- GitHub Quick Metadata panel doesn't overlap with other scripts
- Performance is acceptable (page loads in <2 seconds)

### Scenario 3: Token Persistence Across Browser Restarts

**Steps:**
1. Open DevTools → Console
2. Run: `localStorage.setItem('github-quick-metadata:token', 'test_token_123')`
3. Navigate to a repository
4. Open Network tab and verify API requests include `Authorization: token test_token_123`
5. Close browser completely
6. Reopen browser and navigate to a repository
7. Verify token is still present and used

**Expected Result:**
- Token persists across browser sessions
- API requests include Authorization header
- Cache data persists and is used on subsequent visits

### Scenario 4: GM_xmlhttpRequest Compatibility (Greasemonkey)

**Steps:**
1. Install userscript in Greasemonkey (Firefox)
2. Navigate to https://github.com/microsoft/vscode
3. Open DevTools → Console
4. Verify no CORS errors
5. Check Network tab for successful API calls

**Expected Result:**
- API calls to `api.github.com` succeed (200/202 status)
- No "Cross-Origin Request Blocked" errors
- Data loads and displays correctly in the panel

### Scenario 5: Greasyfork Submission Readiness

**Steps:**
1. Review the userscript metadata block
2. Verify compliance with [Greasyfork script submission rules](https://greasyfork.org/en/help/code-rules)
3. Check for prohibited content (no minified code, no external scripts, no tracking)
4. Confirm license is specified

**Expected Result:**
- Metadata block follows Greasyfork guidelines
- No external dependencies (all code bundled)
- Code is readable (not minified or obfuscated)
- License clearly specified (MIT)
- No tracking or analytics code

## Known Limitations

### Greasemonkey vs Tampermonkey/Violentmonkey

- **GM API compatibility**: Greasemonkey 4.0+ uses async `GM.*` APIs, while older versions and Tampermonkey use synchronous `GM_*` APIs
- **Current implementation**: Uses standard `fetch()` API and `localStorage` for maximum compatibility
- **Recommendation**: Test on both Greasemonkey 4.0+ and Tampermonkey to ensure compatibility

### Browser-Specific Issues

- **Safari**: Tampermonkey for Safari requires Safari 14+ and may have limited API support
- **Mobile browsers**: Userscript managers are not widely supported on mobile platforms
- **Private browsing**: localStorage may not persist in incognito/private mode

### GitHub API Limitations

- **Rate limits**: 60 requests/hour unauthenticated, 5,000/hour authenticated
- **Stats endpoints**: May return 202 Accepted (retry required) for rarely-accessed repos
- **First commit**: May timeout on repos with 10,000+ commits

## Troubleshooting

### Userscript doesn't appear on GitHub

**Possible causes:**
- Userscript manager not installed or disabled
- Script disabled in the manager dashboard
- `@match` pattern doesn't match current URL
- Script has JavaScript errors (check console)

**Solutions:**
- Verify userscript manager icon shows script is active
- Check DevTools console for errors
- Ensure URL matches `https://github.com/*/*` pattern

### "Repo Metadata" button not visible

**Possible causes:**
- Not on a repository page (on profile, explore, etc.)
- CSS not loaded or conflicting with other styles
- Script executed before DOM ready

**Solutions:**
- Verify you're on a repo page (URL should be github.com/owner/repo)
- Check `@run-at` directive is `document-end` or `document-idle`
- Inspect element to see if button exists but is hidden

### API calls fail with CORS errors

**Possible causes:**
- Using `fetch()` instead of `GM_xmlhttpRequest` in Greasemonkey
- Missing `@grant GM_xmlhttpRequest` directive

**Solutions:**
- Add `@grant GM_xmlhttpRequest` to metadata block
- Use `GM_xmlhttpRequest` instead of `fetch` for API calls
- Or use `@grant none` and rely on GitHub's CORS headers

### Data doesn't persist across sessions

**Possible causes:**
- Browser in private/incognito mode
- localStorage disabled or cleared
- Using session storage instead of local storage

**Solutions:**
- Test in regular (non-private) browsing mode
- Check browser settings for localStorage permissions
- Verify using `localStorage` not `sessionStorage`

## Success Criteria

- ✅ Userscript installs without errors on Tampermonkey, Violentmonkey, and Greasemonkey
- ✅ All core features work identically to the browser extension
- ✅ No CORS errors when making API requests
- ✅ Data persists across browser sessions using localStorage
- ✅ Metadata block complies with Greasyfork submission guidelines
- ✅ No conflicts with other popular GitHub userscripts
- ✅ Performance is acceptable (panel opens in <500ms, data loads in <2s)

## Next Steps

After completing this testing plan:

1. **Fix any issues** identified during testing
2. **Update metadata block** if needed for Greasyfork submission
3. **Create screenshots** for the Greasyfork listing page
4. **Submit to Greasyfork** following their [submission guidelines](https://greasyfork.org/en/help/writing-user-scripts)
5. **Monitor user feedback** and address any reported issues
