# Screenshots

This directory contains screenshots for the README.

## Required Screenshots

### 1. about-section.png
**What to capture:**
- A GitHub repository page (e.g., https://github.com/facebook/react)
- Focus on the right sidebar "About" section
- Should show the "Quick Metadata" section with created/updated dates
- Crop to show just the About section clearly

**How to create:**
1. Build and load the extension: `npm run build`
2. Load `dist/chrome/` in Chrome (chrome://extensions → Load unpacked)
3. Visit a GitHub repository
4. Wait for metadata to load in the About section
5. Take screenshot of the About section
6. Crop and save as `about-section.png`

### 2. settings-page.png
**What to capture:**
- Extension settings page
- Focus on the "Displayed Fields" section showing all 4 categories
- Should show checkboxes for different field types

**How to create:**
1. Click the extension icon
2. Click Settings (gear icon) or right-click extension → Options
3. Scroll to "Displayed Fields" section
4. Take screenshot showing all 4 field categories (Date Fields, Metrics, Information, Flags)
5. Save as `settings-page.png`

## Image Specifications

- **Format**: PNG
- **Width**: 800-1200px recommended
- **Height**: Variable, but keep readable
- **Quality**: High resolution for README display
