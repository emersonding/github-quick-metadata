# GitHub Quick Metadata

Quick access to GitHub repository metadata via browser extension and userscript. Get instant insights about any repository including creation date, first commit, commit statistics, and activity trends - all without leaving the page.

## Features

- **Repository Timeline**: View creation date, first commit date, and last update timestamp
- **Commit Statistics**: Analyze commit activity over the past year with visual charts
- **Activity Trends**: Detect whether a repository is increasing, decreasing, or stable in activity
- **Weekly Commit Visualization**: Interactive 52-week commit activity chart
- **Repository Metrics**: Stars, forks, size, open issues, and primary language at a glance
- **Smart Caching**: localStorage-based caching with TTL and LRU eviction to minimize API calls
- **GitHub API Integration**: Optional Personal Access Token support to increase rate limits
- **SPA Navigation Support**: Works seamlessly with GitHub's Turbo framework for client-side navigation
- **Multiple Installation Methods**: Available as Chrome/Firefox extension or userscript

## Screenshots

_Screenshots will be added here - please add them after installation_

## Installation

### Chrome Web Store (Recommended)

[Install from Chrome Web Store](#) _(Coming soon)_

### Firefox Add-ons

[Install from Firefox Add-ons](#) _(Coming soon)_

### Userscript (Greasyfork)

[Install from Greasyfork](#) _(Coming soon)_

Requires a userscript manager like:
- [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
- [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
- [Greasemonkey](https://www.greasespot.net/) (Firefox)

### Manual Installation from Source

#### Chrome/Edge

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/github-quick-metadata.git
   cd github-quick-metadata
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build:chrome
   ```

3. Open Chrome/Edge and navigate to `chrome://extensions/`

4. Enable "Developer mode" (toggle in top right)

5. Click "Load unpacked" and select the `dist/chrome` directory

#### Firefox

1. Clone and build:
   ```bash
   git clone https://github.com/your-username/github-quick-metadata.git
   cd github-quick-metadata
   npm install
   npm run build:firefox
   ```

2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`

3. Click "Load Temporary Add-on"

4. Navigate to `dist/firefox` and select `manifest.json`

#### Userscript

1. Clone and build:
   ```bash
   git clone https://github.com/your-username/github-quick-metadata.git
   cd github-quick-metadata
   npm install
   npm run build:userscript
   ```

2. Install a userscript manager (Tampermonkey/Violentmonkey/Greasemonkey)

3. Open `dist/userscript/github-quick-metadata.user.js` in your text editor

4. Copy the entire contents

5. Create a new userscript in your userscript manager and paste the code

## Usage

1. **Navigate to any GitHub repository** (e.g., https://github.com/facebook/react)

2. **Extension users**: Click the extension icon in your browser toolbar to view metadata in a popup, or click "Open in Panel" for a side panel view

3. **Userscript users**: A "Repo Metadata" toggle button will appear on the page. Click it to open the side panel

4. **View metadata**:
   - **Repository Info**: Creation date, first commit, last update
   - **Commit Statistics**: Total commits (past year), average per week, peak week, trend
   - **Visual Chart**: 52-week commit activity visualization
   - **Additional Metrics**: Repository size, stars, forks, open issues, language

5. **Navigate between repositories**: The extension automatically updates when you navigate to different repositories using GitHub's built-in navigation

## GitHub API Rate Limits

GitHub's REST API has the following rate limits:

- **Unauthenticated requests**: 60 requests per hour per IP address
- **Authenticated requests**: 5,000 requests per hour per user

This extension caches API responses for 1 hour to minimize API calls. For heavy usage, we recommend setting up a Personal Access Token.

### Personal Access Token Setup

A Personal Access Token (PAT) increases your API rate limit from 60 to 5,000 requests per hour.

1. **Generate a token**:
   - Go to GitHub Settings → [Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "GitHub Quick Metadata Extension")
   - **No scopes/permissions needed** - leave all checkboxes unchecked for a read-only token
   - Click "Generate token"
   - **Copy the token immediately** - you won't be able to see it again

2. **Configure the extension**:
   - **Extension users**: Click the extension icon → Settings → paste token into "GitHub Personal Access Token" field
   - **Userscript users**: The settings panel can be accessed via the extension's options (implementation pending)

3. **Save**: The token is saved locally and used for all subsequent API requests

**SECURITY WARNING**: Your Personal Access Token is stored in **plaintext** in your browser's localStorage. While the token has no write permissions, anyone with access to your browser's storage can read it. Use this feature only on trusted devices. Never share your token or commit it to version control.

## Development

### Prerequisites

- Node.js 16+ and npm
- Modern web browser (Chrome/Firefox)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/github-quick-metadata.git
cd github-quick-metadata

# Install dependencies
npm install
```

### Build Commands

```bash
# Build all targets (Chrome, Firefox, Userscript)
npm run build

# Build specific target
npm run build:chrome      # Chrome extension → dist/chrome/
npm run build:firefox     # Firefox extension → dist/firefox/
npm run build:userscript  # Userscript → dist/userscript/

# Development mode (watch for changes)
npm run dev

# Lint code
npm run lint
```

### Project Structure

```
github-quick-metadata/
├── src/
│   ├── core/              # Core business logic
│   │   ├── api.js         # GitHub API client
│   │   ├── cache.js       # localStorage caching layer
│   │   ├── parser.js      # URL parsing and repo detection
│   │   ├── stats.js       # Commit statistics calculation
│   │   └── navigation.js  # SPA navigation handling
│   ├── ui/                # User interface components
│   │   ├── panel.js       # Side panel component
│   │   ├── popup.js       # Extension popup
│   │   └── settings.js    # Settings page
│   ├── utils/             # Utility functions
│   │   ├── date.js        # Date formatting
│   │   ├── dom.js         # DOM manipulation helpers
│   │   └── github.js      # GitHub page detection
│   ├── extension.js       # Extension entry point
│   ├── userscript.js      # Userscript entry point
│   ├── main-extension.js  # Extension bundler entry
│   └── main-userscript.js # Userscript bundler entry
├── dist/                  # Build output (generated)
│   ├── chrome/           # Chrome extension
│   ├── firefox/          # Firefox extension
│   └── userscript/       # Userscript
├── rollup.config.js      # Build configuration
├── package.json
├── LICENSE
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to:

- Report bugs
- Suggest features
- Submit pull requests
- Follow code style guidelines

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Rollup](https://rollupjs.org/) for bundling
- Uses GitHub's [REST API v3](https://docs.github.com/en/rest)
- Inspired by the need for quick repository insights without leaving GitHub

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/github-quick-metadata/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/github-quick-metadata/discussions)

---

**Open Source** | **Privacy-First** | **No Data Collection**
