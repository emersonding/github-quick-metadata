# Store Submission Guide

This guide walks you through submitting GitHub Quick Metadata to Chrome Web Store and Firefox Add-ons (AMO).

## Preparation Checklist

- ✅ Build completed (`npm run build`)
- ✅ Chrome package: `github-quick-metadata-chrome-v2.0.0.zip`
- ✅ Firefox package: `github-quick-metadata-firefox-v2.0.0.zip`
- ✅ Screenshots ready in `screenshots/` directory
- ✅ Privacy policy: `PRIVACY.md`
- ✅ Version: 2.0.0

---

## Chrome Web Store Submission

### 1. Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the one-time $5 registration fee
4. Agree to the Developer Agreement

### 2. Create New Item

1. Click **"New Item"**
2. Upload: `github-quick-metadata-chrome-v2.0.0.zip`
3. Wait for upload to complete

### 3. Fill Out Store Listing

#### Product Details

**Name:** `GitHub Quick Metadata`

**Summary (132 char max):**
```
View GitHub repository metadata directly in the About section. 25+ customizable fields including dates, metrics, and more.
```

**Description:**
```
Display GitHub repository metadata directly in the About section. View creation date, update time, and 25+ customizable fields - all without leaving the page.

FEATURES
• Configurable Fields: Choose from 25+ metadata fields across 4 categories
• Default Display: Shows repository creation date and last update time
• About Section Integration: Metadata appears natively in GitHub's sidebar
• Popup & Panel Views: Quick popup or full side panel for detailed information
• Smart Caching: Local caching with automatic expiration
• Multiple Views: Extension popup, side panel, or About section integration

FIELD CATEGORIES
• Date Fields: Created, Updated, Last Push
• Metrics: Stars, Forks, Size, Open Issues, Watchers, Network, Subscribers
• Information: Language, License, Description, Homepage
• Flags: Archived, Fork, Has Issues, Has Wiki, Has Pages, Discussions, Template

OPTIONAL: GitHub Personal Access Token
Only needed for heavy usage. Without a token, you get 60 API requests/hour which is sufficient for normal browsing. Providing a token increases this to 5,000 requests/hour.

PRIVACY
All data is stored locally on your device. No data is sent to external servers. The extension only communicates with GitHub's official API. See full privacy policy at: https://github.com/emersonding/github-quick-metadata/blob/main/PRIVACY.md

OPEN SOURCE
View the source code: https://github.com/emersonding/github-quick-metadata
```

**Category:** Developer Tools

**Language:** English

#### Graphics

**Icon (128x128):** Upload `dist/chrome/icons/icon128.png`

**Screenshots (1280x800 or 640x400):**
1. Upload `screenshots/about-section.png` - "Metadata displayed in About section"
2. Upload `screenshots/settings-page.png` - "Customize displayed fields"

**Promotional Tile (440x280, optional):** Skip for now

**Marquee (1400x560, optional):** Skip for now

#### Privacy

**Single Purpose Description:**
```
Display GitHub repository metadata in the About section and extension popup.
```

**Permission Justifications:**

- **activeTab**: Required to detect when user is viewing a GitHub repository page
- **tabs**: Required to get the current tab URL to extract repository information
- **storage**: Required to save user preferences (displayed fields, theme, cache settings, optional GitHub token)
- **Host: github.com/***: Required to inject metadata into GitHub's About section
- **Host: api.github.com/***: Required to fetch repository metadata from GitHub's public API

**Are you using remote code?** No

**Data Usage:**
- Check: "Does not collect user data"
- Privacy Policy URL: `https://github.com/emersonding/github-quick-metadata/blob/main/PRIVACY.md`

#### Distribution

**Visibility:** Public

**Countries:** All countries

**Pricing:** Free

### 4. Submit for Review

1. Click **"Submit for review"**
2. Wait for Google's review (typically 1-3 business days)
3. You'll receive email notification when approved

---

## Firefox Add-ons (AMO) Submission

### 1. Create Developer Account

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Sign in or create a Firefox Account
3. No registration fee required

### 2. Submit New Add-on

1. Click **"Submit a New Add-on"**
2. Choose **"On this site"** (not self-distribution)
3. Upload: `github-quick-metadata-firefox-v2.0.0.zip`
4. Wait for automatic validation

### 3. Fill Out Listing Information

#### Basic Information

**Name:** `GitHub Quick Metadata`

**Add-on URL (slug):** `github-quick-metadata`

**Summary (250 char max):**
```
View GitHub repository metadata directly in the About section. Choose from 25+ customizable fields including creation date, update time, stars, forks, language, license, and more.
```

**Description:**
```
Display GitHub repository metadata directly in the About section. View creation date, update time, and 25+ customizable fields - all without leaving the page.

FEATURES
• Configurable Fields: Choose from 25+ metadata fields across 4 categories
• Default Display: Shows repository creation date and last update time
• About Section Integration: Metadata appears natively in GitHub's sidebar
• Popup & Panel Views: Quick popup or full side panel for detailed information
• Smart Caching: Local caching with automatic expiration
• Multiple Views: Extension popup, side panel, or About section integration

FIELD CATEGORIES
• Date Fields: Created, Updated, Last Push
• Metrics: Stars, Forks, Size, Open Issues, Watchers, Network, Subscribers
• Information: Language, License, Description, Homepage
• Flags: Archived, Fork, Has Issues, Has Wiki, Has Pages, Discussions, Template

OPTIONAL: GitHub Personal Access Token
Only needed for heavy usage. Without a token, you get 60 API requests/hour which is sufficient for normal browsing. Providing a token increases this to 5,000 requests/hour.

PRIVACY
All data is stored locally on your device. No data is sent to external servers. The extension only communicates with GitHub's official API.

OPEN SOURCE
View the source code: https://github.com/emersonding/github-quick-metadata
```

**Categories:**
- Primary: Developer Tools
- Secondary: Productivity

**Tags:** `github`, `metadata`, `developer-tools`, `repository`

**Homepage:** `https://github.com/emersonding/github-quick-metadata`

**Support Email:** Your email address

**Support Website:** `https://github.com/emersonding/github-quick-metadata/issues`

**License:** MIT (or your chosen license)

**Privacy Policy:** Paste content from `PRIVACY.md` or link to GitHub

#### Media

**Icon:** Upload `dist/firefox/icons/icon128.png`

**Screenshots:**
1. Upload `screenshots/about-section.png`
2. Upload `screenshots/settings-page.png`

#### Version Details

**Release Notes:**
```
Initial release v2.0.0

Features:
- Display repository creation date and last update time
- 25+ customizable metadata fields
- Configurable field categories: dates, metrics, info, flags
- Smart caching to minimize API calls
- Optional GitHub Personal Access Token support
- Native integration in GitHub's About section
```

**Source Code:** `https://github.com/emersonding/github-quick-metadata`

**Compatibility:**
- Firefox: 109.0 and later

### 4. Technical Review Questions

**Does this add-on contain any binary or obfuscated code?** No

**Does this add-on require external software to run?** No

**Does this add-on make remote calls?** Yes
- To: `api.github.com`
- Purpose: Fetch repository metadata via GitHub's public REST API

**Is this a fork or based on another add-on?** No

### 5. Submit for Review

1. Click **"Submit Version"**
2. Wait for Mozilla's review (typically 1-5 business days)
3. You'll receive email notification when approved

---

## Post-Submission Checklist

After approval:

### Update README
- [ ] Add Chrome Web Store badge and link
- [ ] Add Firefox Add-ons badge and link
- [ ] Update installation instructions

### Update Manifests
- [ ] Update `homepage_url` in rollup.config.js to point to store pages
- [ ] Consider adding update URLs for automatic updates

### Monitor
- [ ] Check store reviews and ratings
- [ ] Respond to user feedback
- [ ] Monitor GitHub issues

---

## Common Rejection Reasons & Fixes

### Chrome Web Store

1. **Overly broad permissions** - Already minimized
2. **Missing privacy policy** - ✅ Provided
3. **Misleading screenshots** - ✅ Actual functionality shown
4. **Single purpose violation** - ✅ Clear single purpose

### Firefox AMO

1. **Missing source code** - ✅ GitHub repo provided
2. **Minified code without map** - ✅ Using Rollup with readable output
3. **Remote code execution** - ✅ No remote code
4. **Insufficient permission justification** - ✅ Detailed explanations provided

---

## Support & Updates

**Need help?**
- Chrome: https://support.google.com/chrome/a/answer/2714278
- Firefox: https://extensionworkshop.com/documentation/publish/

**Version Updates:**
1. Increment version in rollup.config.js
2. Rebuild: `npm run build`
3. Create new ZIP packages
4. Upload through respective dashboards
