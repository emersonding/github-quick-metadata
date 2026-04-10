# Privacy Policy for GitHub Quick Metadata

**Last Updated:** April 10, 2026

## Overview

GitHub Quick Metadata is a browser extension that displays repository metadata from GitHub. This privacy policy explains what data we collect and how we use it.

## Data Collection

### What We Collect

GitHub Quick Metadata collects and stores the following data:

1. **GitHub API Responses**: When you visit a GitHub repository page, the extension fetches metadata from GitHub's public API (`https://api.github.com/repos/{owner}/{repo}`). This metadata includes:
   - Repository creation date
   - Last update date
   - Last push date
   - Star count, fork count, and other public statistics
   - Repository language, license, and description
   - Repository flags (archived, fork, has issues, etc.)

2. **Extension Settings**: Your personal preferences for:
   - Which metadata fields to display
   - Display mode (popup, panel, or About section integration)
   - Theme preference (light, dark, or auto)
   - Cache enable/disable setting
   - GitHub Personal Access Token (optional, if you provide one)

### Where Data is Stored

All data is stored **locally on your device** using:
- `chrome.storage.local` (Chrome/Edge)
- `browser.storage.local` (Firefox)

**We do not:**
- Send any data to external servers
- Track your browsing activity
- Collect analytics or usage statistics
- Share your data with third parties

## Data Usage

### How We Use Your Data

1. **API Responses**: Cached locally to reduce API calls and improve performance. You can clear this cache at any time from the extension settings.

2. **Settings**: Stored locally to remember your preferences across browser sessions.

3. **GitHub Token** (optional): If provided, used only to authenticate API requests to GitHub. This increases your rate limit from 60 to 5,000 requests per hour. The token is stored locally and never transmitted anywhere except to GitHub's official API.

## Data Retention

- **Cache**: Cached API responses expire after 1 hour or can be manually cleared from settings.
- **Settings**: Retained until you uninstall the extension or manually reset them.
- **GitHub Token**: Retained until you remove it from settings or uninstall the extension.

## Third-Party Services

This extension communicates with:

### GitHub API (`api.github.com`)
- **Purpose**: Fetch public repository metadata
- **Data Sent**: Repository owner and name from the URL you're viewing
- **Privacy Policy**: [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

No other third-party services are used.

## Permissions

The extension requires the following permissions:

### `storage`
- **Purpose**: Save your settings and cache API responses locally
- **Scope**: Local storage only (not synced across devices)

### `activeTab`
- **Purpose**: Detect when you're viewing a GitHub repository page
- **Scope**: Only when you explicitly open the extension popup

### Host Permission: `https://github.com/*`
- **Purpose**: Inject metadata into GitHub's About section
- **Scope**: Only active on GitHub.com repository pages

### Host Permission: `https://api.github.com/*`
- **Purpose**: Fetch repository metadata from GitHub's public API
- **Scope**: Only for API requests you initiate by viewing repository pages

## Your Rights

You have the right to:

1. **View Your Data**: Open the extension settings to see what's stored
2. **Delete Your Data**:
   - Clear cache from extension settings
   - Reset settings to defaults
   - Uninstall the extension to remove all local data
3. **Control Data Collection**: Disable caching or limit which fields are displayed

## Security

- All data is stored locally using browser's secure storage APIs
- GitHub tokens are stored encrypted by the browser
- No data is transmitted over the network except to GitHub's official API
- Extension code is open-source and auditable

## Changes to This Policy

We may update this privacy policy from time to time. The "Last Updated" date at the top will reflect the most recent changes. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Open Source

This extension is open-source software. You can review the complete source code at:
[GitHub Repository URL - to be added]

## Contact

For privacy concerns or questions:
- Open an issue on our GitHub repository
- Email: [Your contact email - to be added]

## Children's Privacy

This extension does not knowingly collect information from children under 13. It is designed for developers and GitHub users who are typically 13 years or older.

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Firefox Add-on Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

---

**Summary**: GitHub Quick Metadata stores data only on your device, communicates only with GitHub's API, and collects no personal information beyond what you configure.
