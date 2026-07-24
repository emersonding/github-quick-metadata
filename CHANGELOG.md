# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.2] - 2026-07-23

### Fixed

- **About section detection** — The extension stopped injecting metadata on
  repository pages (`About section not found after retries`) after GitHub
  migrated the repo sidebar to its Primer / CSS-modules layout, removing the
  `BorderGrid` / `h2.h4.mb-3` markup the detector relied on. `findAboutSection()`
  now locates the section by its "About" heading text and the stable
  `SidebarSection-module__sidebarSection` container, with the legacy markup kept
  as a fallback. Verified live against the new GitHub layout.

### Changed

- Manifest and userscript versions are now sourced from `package.json` in the
  Rollup build, so they can no longer drift out of sync.

## [1.0.0] - 2026-04-09

### Added

- **Core Features**
  - Repository metadata display (creation date, first commit, last update)
  - Commit statistics calculation for past 52 weeks
  - Visual 52-week commit activity chart
  - Activity trend detection (increasing/decreasing/stable)
  - Repository metrics (stars, forks, size, issues, language)

- **API Integration**
  - GitHub REST API v3 client with full error handling
  - Personal Access Token support for increased rate limits
  - Automatic rate limit detection with exponential backoff
  - 202 retry logic for GitHub's statistics endpoints
  - Link header pagination parsing

- **Caching System**
  - localStorage-based caching with 1-hour TTL
  - LRU eviction when storage exceeds 80% of quota
  - Per-entry size tracking for quota management
  - Graceful handling of localStorage quota exceeded errors
  - Cache statistics and management UI

- **User Interface**
  - Side panel component with toggle button
  - Extension popup (400px × 600px)
  - Settings page with PAT configuration
  - Loading skeleton states
  - Error states with retry functionality
  - Responsive design for different screen sizes

- **Navigation Support**
  - GitHub Turbo SPA navigation detection
  - turbo:load and turbo:render event listeners
  - MutationObserver fallback for title changes
  - Debounced navigation handling (300ms)
  - Automatic panel refresh on repository change

- **Multiple Installation Methods**
  - Chrome extension (Manifest V3)
  - Firefox extension (Manifest V2)
  - Userscript (Greasemonkey/Tampermonkey compatible)

- **Developer Experience**
  - Rollup build system with tree-shaking
  - Separate builds for Chrome, Firefox, and Userscript
  - Development mode with watch
  - ESLint configuration
  - Comprehensive JSDoc comments

### Security

- Security warning for PAT plaintext storage in README
- No write permissions required for PAT (read-only access)
- Client-side only - no data sent to external servers
- No telemetry or analytics

### Performance

- Smart caching reduces API calls by ~90%
- LRU eviction prevents storage bloat
- Debounced navigation prevents duplicate API calls
- Parallel API requests for faster initial load
- Cached data displayed instantly while fresh data loads in background

[2.1.2]: https://github.com/your-username/github-quick-metadata/releases/tag/v2.1.2
[1.0.0]: https://github.com/your-username/github-quick-metadata/releases/tag/v1.0.0
