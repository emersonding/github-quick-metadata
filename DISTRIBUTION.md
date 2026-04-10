# Distribution Checklist

This document tracks the distribution readiness for GitHub Quick Metadata extension.

## Distribution Targets

- ✅ Chrome Web Store (Manifest V3)
- ✅ Firefox Add-ons (Manifest V2)
- ✅ Greasyfork Userscript

## Build Process

### Quick Build
```bash
npm run build
```
This builds all three distribution targets and generates icons.

### Individual Targets
```bash
npm run build:chrome      # Chrome extension only
npm run build:firefox     # Firefox extension only
npm run build:userscript  # Userscript only
npm run build:icons       # Regenerate icons
```

### Clean Rebuild
```bash
npm run rebuild  # Removes dist/ and rebuilds everything
```

## Pre-Submission Checklist

### 1. Chrome Web Store (`dist/chrome/`)

#### Required Files
- [x] content.js - Main extension logic (55KB)
- [x] popup.html - Popup UI template (7.7KB)
- [x] popup.js - Popup logic (43KB)
- [x] settings.html - Settings page template (14KB)
- [x] settings.js - Settings logic (12KB)
- [x] manifest.json - Manifest V3 (763 bytes)
- [x] icons/icon16.png - 16x16 icon
- [x] icons/icon48.png - 48x48 icon
- [x] icons/icon128.png - 128x128 icon

#### Manifest V3 Validation
- [x] manifest_version: 3
- [x] name: "GitHub Quick Metadata"
- [x] version: "1.0.0"
- [x] description present
- [x] permissions: ["activeTab", "tabs", "storage"]
- [x] host_permissions: GitHub domains
- [x] icons defined (16, 48, 128)
- [x] content_scripts configured
- [x] action.default_popup configured
- [x] options_ui configured

#### Quality Checks
- [x] No source maps (*.map files)
- [x] No TypeScript files (*.ts)
- [x] No development files (.env, node_modules)
- [x] No console.log statements (production builds use terser)
- [x] All files minified (when NODE_ENV=production)

### 2. Firefox Add-ons (`dist/firefox/`)

#### Required Files
- [x] content.js - Main extension logic (55KB)
- [x] popup.html - Popup UI template (7.7KB)
- [x] popup.js - Popup logic (43KB)
- [x] settings.html - Settings page template (14KB)
- [x] settings.js - Settings logic (12KB)
- [x] manifest.json - Manifest V2 (743 bytes)
- [x] icons/icon16.png - 16x16 icon
- [x] icons/icon48.png - 48x48 icon
- [x] icons/icon128.png - 128x128 icon

#### Manifest V2 Validation
- [x] manifest_version: 2
- [x] name: "GitHub Quick Metadata"
- [x] version: "1.0.0"
- [x] description present
- [x] permissions: ["activeTab", "tabs", "storage", GitHub domains]
- [x] icons defined (16, 48, 128)
- [x] content_scripts configured
- [x] browser_action.default_popup configured
- [x] options_ui configured

#### Quality Checks
- [x] No source maps (*.map files)
- [x] No TypeScript files (*.ts)
- [x] No development files (.env, node_modules)
- [x] No Chrome-specific APIs used
- [x] All files minified (when NODE_ENV=production)

### 3. Greasyfork Userscript (`dist/userscript/`)

#### Required Files
- [x] github-quick-metadata.user.js - Complete userscript (55KB)

#### Userscript Metadata Validation
- [x] @name: "GitHub Quick Metadata"
- [x] @namespace: https://github.com/
- [x] @version: 1.0.0
- [x] @description present
- [x] @author present
- [x] @match: https://github.com/*/*
- [x] @grant: GM_xmlhttpRequest, GM_getValue, GM_setValue, GM_addStyle
- [x] @connect: api.github.com
- [x] @run-at: document-idle

#### Quality Checks
- [x] Single file (no dependencies)
- [x] Proper Greasemonkey metadata block
- [x] All code in IIFE format
- [x] No external dependencies
- [x] All styles inlined via GM_addStyle

## Version Consistency

All version numbers must match across:
- [x] package.json: "1.0.0"
- [x] dist/chrome/manifest.json: "1.0.0"
- [x] dist/firefox/manifest.json: "1.0.0"
- [x] dist/userscript/github-quick-metadata.user.js: @version 1.0.0

## Icon Verification

Icons are generated via `npm run build:icons` using `scripts/create-simple-icons.js`.

### Current Implementation (MVP)
- [x] All icons created from base 16x16 PNG (scaled for larger sizes)
- [x] GitHub blue color (#0969da) with "GH" text
- [x] Suitable for MVP release

### Production Recommendation
For production release, consider:
- [ ] Create proper 48x48 and 128x128 PNG files (not scaled)
- [ ] Use a professional icon design tool or hire a designer
- [ ] Ensure icons are crisp at all sizes
- [ ] Test icon appearance on light and dark backgrounds

## Distribution Package Creation

### Create All Packages
```bash
cd dist
zip -r github-quick-metadata-chrome-v1.0.0.zip chrome/
zip -r github-quick-metadata-firefox-v1.0.0.zip firefox/
cd ..
```

### Chrome Web Store
- Upload: `dist/github-quick-metadata-chrome-v1.0.0.zip`
- Or manually zip: `cd dist/chrome && zip -r ../chrome.zip .`

### Firefox Add-ons
- Upload: `dist/github-quick-metadata-firefox-v1.0.0.zip`
- Or manually zip: `cd dist/firefox && zip -r ../firefox.zip .`

### Greasyfork
- Upload file: `dist/userscript/github-quick-metadata.user.js`
- Upload method: Direct file upload (no zip needed)

## Known Issues & Limitations

### Icons (MVP Notice)
- Current icons use scaled 16x16 PNG for all sizes
- Acceptable for initial release, but should be improved for production
- Run `npm run build:icons` after any build to ensure icons are present

### Build Process
- Icons are not automatically copied during rollup builds
- Must run `npm run build:icons` after building distributions
- The `npm run build` command handles this automatically

### SVG Icons
- SVG icons (icon*.svg) are also generated but not referenced in manifests
- Only PNG icons are used for browser compatibility
- SVG files can be removed or kept for future reference

## Pre-Release Verification

Before submitting to any store:

1. **Clean rebuild**:
   ```bash
   npm run rebuild
   ```

2. **Verify all files present**:
   ```bash
   find dist/ -type f | sort
   ```

3. **Check version consistency**:
   ```bash
   grep '"version"' package.json dist/*/manifest.json
   head -5 dist/userscript/*.user.js | grep "@version"
   ```

4. **Verify no development files**:
   ```bash
   find dist/ \( -name "*.map" -o -name "*.ts" -o -name ".env" -o -name "node_modules" \)
   # Should return no results
   ```

5. **Test in browser**:
   - Chrome: Load unpacked extension from `dist/chrome/`
   - Firefox: Load temporary add-on from `dist/firefox/manifest.json`
   - Userscript: Install in Tampermonkey/Greasemonkey from `dist/userscript/*.user.js`

6. **Verify functionality**:
   - Navigate to a GitHub repository
   - Check that metadata panel/popup appears
   - Verify all data loads correctly
   - Test settings page
   - Verify PAT authentication works

## Post-Release

After successful release:
- [ ] Tag release in git: `git tag v1.0.0`
- [ ] Update CHANGELOG.md with release notes
- [ ] Create GitHub release with distribution ZIPs attached
- [ ] Update README.md with installation links
- [ ] Monitor initial user feedback for critical issues

## Maintenance

For future releases:
1. Update version in `package.json`
2. Update version in `rollup.config.js` (manifests and userscript banner)
3. Run `npm run rebuild` to ensure clean build
4. Verify version consistency across all distributions
5. Follow pre-release verification steps
6. Submit updates to all three distribution channels

---

**Last Updated**: 2026-04-09
**Distribution Status**: ✅ Ready for submission
**Version**: 1.0.0
