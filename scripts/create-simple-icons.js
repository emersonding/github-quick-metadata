#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sizes = [16, 48, 128];
const sourceDir = path.join(projectRoot, 'assets/icons');
const targetDirs = [
  path.join(projectRoot, 'dist/chrome/icons'),
  path.join(projectRoot, 'dist/firefox/icons')
];

for (const targetDir of targetDirs) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const size of sizes) {
    const fileName = `icon${size}.png`;
    const sourcePath = path.join(sourceDir, fileName);
    const targetPath = path.join(targetDir, fileName);

    if (!fs.existsSync(sourcePath)) {
      console.error(`Missing source icon: ${path.relative(projectRoot, sourcePath)}`);
      process.exit(1);
    }

    fs.copyFileSync(sourcePath, targetPath);
  }

  console.log(`Copied static icons to ${path.relative(projectRoot, targetDir)}`);
}
