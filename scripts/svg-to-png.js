#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [16, 48, 128];
const iconDirs = [
  path.join(__dirname, '../dist/chrome/icons'),
  path.join(__dirname, '../dist/firefox/icons')
];

async function convertSvgToPng() {
  for (const dir of iconDirs) {
    for (const size of sizes) {
      const svgPath = path.join(dir, `icon${size}.svg`);
      const pngPath = path.join(dir, `icon${size}.png`);

      try {
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(pngPath);

        console.log(`Converted ${path.basename(svgPath)} -> ${path.basename(pngPath)} in ${path.basename(dir)}`);
      } catch (error) {
        console.error(`Error converting ${svgPath}:`, error.message);
      }
    }
  }

  console.log('\nPNG conversion complete!');
}

convertSvgToPng().catch(console.error);
