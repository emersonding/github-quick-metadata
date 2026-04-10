import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import css from './rollup-plugin-css.js';
import fs from 'fs';
import path from 'path';

const TARGET = process.env.TARGET || 'chrome';
const isProd = process.env.NODE_ENV === 'production';

const basePlugins = [
  css(),
  resolve({ browser: true }),
  commonjs(),
  ...(isProd ? [terser()] : [])
];

// Plugin to copy HTML files and generate manifest.json
const copyStaticFiles = (target) => ({
  name: 'copy-static-files',
  writeBundle() {
    const distDir = `dist/${target}`;

    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Copy popup.html
    fs.copyFileSync(
      path.resolve('src/ui/popup.html'),
      path.resolve(distDir, 'popup.html')
    );

    // Copy settings.html
    fs.copyFileSync(
      path.resolve('src/ui/settings.html'),
      path.resolve(distDir, 'settings.html')
    );

    // Generate manifest.json
    const manifest = target === 'firefox' ? {
      manifest_version: 2,
      name: 'GitHub Quick Metadata',
      version: '1.0.0',
      description: 'Quick access to GitHub repository metadata',
      permissions: [
        'activeTab',
        'tabs',
        'storage',
        'https://github.com/*',
        'https://api.github.com/*'
      ],
      icons: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      },
      content_scripts: [
        {
          matches: ['https://github.com/*/*'],
          js: ['content.js'],
          run_at: 'document_idle'
        }
      ],
      browser_action: {
        default_popup: 'popup.html',
        default_title: 'GitHub Quick Metadata'
      },
      options_ui: {
        page: 'settings.html',
        open_in_tab: true
      }
    } : {
      manifest_version: 3,
      name: 'GitHub Quick Metadata',
      version: '1.0.0',
      description: 'Quick access to GitHub repository metadata',
      permissions: ['activeTab', 'tabs', 'storage'],
      host_permissions: [
        'https://github.com/*',
        'https://api.github.com/*'
      ],
      icons: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      },
      content_scripts: [
        {
          matches: ['https://github.com/*/*'],
          js: ['content.js'],
          run_at: 'document_idle'
        }
      ],
      action: {
        default_popup: 'popup.html',
        default_title: 'GitHub Quick Metadata'
      },
      options_ui: {
        page: 'settings.html',
        open_in_tab: true
      }
    };

    fs.writeFileSync(
      path.resolve(distDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }
});

const chromeConfig = [
  {
    input: 'src/extension.js',
    output: {
      file: 'dist/chrome/content.js',
      format: 'iife',
      name: 'GitHubQuickMetadata'
    },
    plugins: basePlugins
  },
  {
    input: 'src/ui/popup.js',
    output: {
      file: 'dist/chrome/popup.js',
      format: 'iife',
      name: 'GitHubQuickMetadataPopup'
    },
    plugins: basePlugins
  },
  {
    input: 'src/ui/settings.js',
    output: {
      file: 'dist/chrome/settings.js',
      format: 'iife',
      name: 'GitHubQuickMetadataSettings'
    },
    plugins: [...basePlugins, copyStaticFiles('chrome')]
  }
];

const firefoxConfig = [
  {
    input: 'src/extension.js',
    output: {
      file: 'dist/firefox/content.js',
      format: 'iife',
      name: 'GitHubQuickMetadata'
    },
    plugins: basePlugins
  },
  {
    input: 'src/ui/popup.js',
    output: {
      file: 'dist/firefox/popup.js',
      format: 'iife',
      name: 'GitHubQuickMetadataPopup'
    },
    plugins: basePlugins
  },
  {
    input: 'src/ui/settings.js',
    output: {
      file: 'dist/firefox/settings.js',
      format: 'iife',
      name: 'GitHubQuickMetadataSettings'
    },
    plugins: [...basePlugins, copyStaticFiles('firefox')]
  }
];

const userscriptBanner = `// ==UserScript==
// @name         GitHub Quick Metadata
// @namespace    https://github.com/
// @version      1.0.0
// @description  Quick access to GitHub repository metadata
// @author       github-quick-metadata
// @match        https://github.com/*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @connect      api.github.com
// @run-at       document-idle
// ==/UserScript==
`;

const userscriptConfig = {
  input: 'src/userscript.js',
  output: {
    file: 'dist/userscript/github-quick-metadata.user.js',
    format: 'iife',
    name: 'GitHubQuickMetadata',
    banner: userscriptBanner
  },
  plugins: basePlugins
};

const configs = {
  chrome: chromeConfig,
  firefox: firefoxConfig,
  userscript: userscriptConfig
};

export default TARGET === 'all'
  ? [...chromeConfig, ...firefoxConfig, userscriptConfig]
  : configs[TARGET] || chromeConfig;
