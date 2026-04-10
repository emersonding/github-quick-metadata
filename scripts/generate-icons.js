#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple PNG generation using data URL approach
// Creates a colored square with "GH" text for GitHub Quick Metadata

const sizes = [16, 48, 128];
const iconDirs = [
  path.join(__dirname, '../dist/chrome/icons'),
  path.join(__dirname, '../dist/firefox/icons')
];

// Create directories
iconDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Generate SVG and convert to PNG-like data
// For MVP, we'll create simple SVG files that browsers can use
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0969da" rx="${size * 0.15}"/>
  <text
    x="50%"
    y="50%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-weight="bold"
    font-size="${size * 0.4}"
    fill="white">GH</text>
</svg>`;

  iconDirs.forEach(dir => {
    fs.writeFileSync(path.join(dir, `icon${size}.svg`), svg);
  });

  console.log(`Generated icon${size}.svg`);
});

console.log('\nIcon generation complete!');
console.log('Note: SVG icons created. For production, convert to PNG using:');
console.log('  npm install -D sharp');
console.log('  or use ImageMagick/Inkscape for conversion');
