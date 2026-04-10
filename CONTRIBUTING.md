# Contributing to GitHub Quick Metadata

Thank you for your interest in contributing to GitHub Quick Metadata! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title**: Describe the bug in one sentence
2. **Description**: What happened vs. what you expected
3. **Steps to reproduce**:
   ```
   1. Go to '...'
   2. Click on '...'
   3. See error
   ```
4. **Environment**:
   - Browser and version (e.g., Chrome 120)
   - Extension/Userscript version
   - Operating System (e.g., macOS 14, Windows 11)
5. **Screenshots**: If applicable
6. **Console errors**: Open DevTools → Console, copy any errors

**Before submitting**: Search existing issues to avoid duplicates.

### Suggesting Features

Feature requests are welcome! Please create an issue with:

1. **Clear title**: Describe the feature in one sentence
2. **Problem**: What problem does this solve?
3. **Proposed solution**: How would you like it to work?
4. **Alternatives**: Have you considered alternatives?
5. **Additional context**: Screenshots, mockups, or examples

### Pull Request Process

#### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/github-quick-metadata.git
cd github-quick-metadata
```

#### 2. Create a Branch

```bash
# Create a feature branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

Branch naming:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

#### 3. Set Up Development Environment

```bash
# Install dependencies
npm install

# Start development mode (watches for changes)
npm run dev
```

#### 4. Make Your Changes

**Code Style Guidelines:**

- **JavaScript**: ES6+ syntax, no semicolons (consistent with existing code)
- **Functions**: Pure functions where possible, avoid mutation
- **Naming**:
  - Variables: `camelCase`
  - Functions: `camelCase` with descriptive verbs
  - Constants: `UPPER_SNAKE_CASE`
- **Comments**: JSDoc for all exported functions
- **File organization**: Many small files > few large files (max 400 lines)
- **Error handling**: Always handle errors explicitly

**Example:**

```javascript
/**
 * Fetch repository metadata from GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object>} Repository metadata
 */
export async function fetchRepoMetadata(owner, repo) {
  // Implementation
}
```

#### 5. Test Your Changes

```bash
# Build all targets
npm run build

# Build specific target
npm run build:chrome
npm run build:firefox
npm run build:userscript

# Lint your code
npm run lint
```

**Manual Testing:**

1. Load the extension in your browser (see README.md installation)
2. Navigate to a GitHub repository
3. Test the feature/fix works as expected
4. Test edge cases (slow network, API errors, etc.)
5. Test on multiple repositories (small/large, active/inactive)

#### 6. Commit Your Changes

```bash
git add .
git commit -m "type: description"
```

**Commit message format:**

```
type: brief description (max 50 chars)

Detailed explanation if needed (wrap at 72 chars).

- Bullet points for multiple changes
- Reference issues: Fixes #123
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code refactoring (no behavior change)
- `test` - Adding tests
- `chore` - Maintenance (deps, build, etc.)
- `perf` - Performance improvement

**Examples:**
```
feat: add weekly commit chart visualization

Implements a 52-week bar chart showing commit activity.
Uses CSS-only rendering for performance.

Fixes #42
```

```
fix: handle 404 errors for empty repositories

Previously crashed when fetching commits from repos with
no commits. Now shows "N/A" for first commit date.

Fixes #56
```

#### 7. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

1. **Clear title**: Same as commit message format
2. **Description**:
   - What does this PR do?
   - Why is this change needed?
   - How did you test it?
3. **Screenshots**: If UI changes
4. **Related issues**: Fixes #123, Relates to #456

**PR Checklist:**

- [ ] Code follows existing style
- [ ] All exported functions have JSDoc comments
- [ ] Tested manually in Chrome/Firefox
- [ ] No console errors or warnings
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Commit messages follow format
- [ ] Branch is up to date with main

#### 8. Code Review

- Respond to feedback promptly
- Make requested changes in new commits (don't force-push)
- Mark conversations as resolved when addressed
- Be patient - maintainers review PRs in their free time

#### 9. After Merge

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Delete your feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Development Workflow

### Project Structure

```
src/
├── core/       # Business logic (API, caching, parsing, stats)
├── ui/         # UI components (panel, popup, settings)
└── utils/      # Utility functions (date, DOM, GitHub detection)
```

**When adding new files:**

1. Place in appropriate directory based on purpose
2. Export functions explicitly
3. Add JSDoc comments to all exports
4. Keep files focused (single responsibility)
5. Import only what you need

### Architecture Decisions

**API Client** (`src/core/api.js`):
- All GitHub API calls go through `githubFetch()`
- Handles rate limiting, retries, and errors
- Never make direct `fetch()` calls to GitHub API

**Caching** (`src/core/cache.js`):
- Cache all API responses with 1-hour TTL
- Use `buildCacheKey()` for consistent keys
- LRU eviction is automatic

**Navigation** (`src/core/navigation.js`):
- All repo page detection uses `isRepoPage()` and `parseRepoFromUrl()`
- SPA navigation handled by `initNavigationHandlers()`

**UI Components**:
- Use `createElement()` helper from `utils/dom.js`
- Follow existing CSS class naming: `gqm-*`
- Keep components small and focused

### Common Tasks

#### Adding a New GitHub API Endpoint

1. Add function to `src/core/api.js`:
   ```javascript
   export async function fetchNewEndpoint(owner, repo, options = {}) {
     const result = await githubFetch(`/repos/${owner}/${repo}/endpoint`, options);
     return result.data;
   }
   ```

2. Add caching wrapper where used:
   ```javascript
   const cacheKey = buildCacheKey(owner, repo, 'endpoint_name');
   const cached = cacheGet(cacheKey);
   if (cached) return cached;

   const data = await fetchNewEndpoint(owner, repo);
   cacheSet(cacheKey, data);
   return data;
   ```

#### Adding a New UI Component

1. Create file in `src/ui/your-component.js`
2. Export initialization function
3. Import and call from `src/extension.js` or `src/userscript.js`

#### Updating Styles

Extension styles are bundled in the build process. Modify:
- Chrome/Firefox: Extension-specific CSS in dist folders (regenerated on build)
- Userscript: Inline styles in the component files

## Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/your-username/github-quick-metadata/discussions)
- **Bugs**: Open an [Issue](https://github.com/your-username/github-quick-metadata/issues)
- **Real-time**: Join the community chat (link TBD)

## Recognition

Contributors will be recognized in:
- README.md acknowledgments section
- Release notes for their contributions

Thank you for contributing to GitHub Quick Metadata!
