#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create simple base64-encoded PNG files
// These are minimal 1x1 PNGs that we'll scale up (browsers can handle this)

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

// Base64 encoded 16x16 blue PNG with white "GH" text
// This is a simple PNG created with GitHub blue color (#0969da)
const icon16Base64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAE3SURBVDiNpZMxSwNBEIW/2b3EJpAgpBFBULSzsLGxsLKwUbCw8QdYWVj4A6y0sbW1tbOxs7PQQkQQBBEkCIIgCBKSy+3O2OQkRo0RfM3uzZv3hpkVVeXfJP/Vs7W1xe7uLqurq8iyjBACMzMzbG9vMz8/z8nJCdvb20wmE1zXxfM8fN9na2uL4+NjhsMhAJ7ncXBwwOLiIr7vMxqNKMsSVSUIAoriqKr6vi9lWapSqFarpuM4WlVVs9ls6sHBgY5GI1VVLYpCXdfVqqpUVbWqKt3f31fP80RV9fj4WJeWljSbzTSdTrWu61ZApVLJtixLLcvSsizTsqzW/v6+Wpalqqqnp6daFIWqql5dXenFxYUmSaJJkmhZlqqqenZ2pnVdq6rq5eWl3t7eqqrq9fW13t/ft/4LAPr6+sr19TXPz8/84D9fPgFOq3TiXd3b+gAAAABJRU5ErkJggg==';

// Base64 encoded 48x48 PNG - larger version with better quality
const icon48Base64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADdgAAA3YBfdWCzAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANHSURBVGiB7ZpNaBNBGIaf2WyTNE1Mm1JpKVhQPHgQxIMgKHjxB0RBEH9AvXjx4sGDBy8ePHjx4MGLBy8ePHjRg4IXQfAHRPAgCILgQRDBg1JoobZp0zTJbna/8ZA0bZPdZHezm9B+T5uZ+eZ9n3ln5ptZiIiIiIiIiIh/jFQqRSqVwu/309bWRiwWa3ZI66LRaDDX2XY7EokQiUQQEcIwDLq6usjn80xPT8/OY+8AEaHRaGC1WlmxYoUl0TdFPp8nFotRLBYplUqLnmdZaOfOnRw4cIDDhw+zZ88eXC4XpmlimiYA7e3tNTkTExMMDw9TX/VGRAQR8Xg88uWLKLdvX5Z4PL4kWz1r1qwRwzBkcnJSstmsZLNZyWaz8vWrKPDJcrnkypUrEo/HZe3atcsSfVNks1lJp9MyNTUlhUJBCoWCFAoF+fmzLNXqH3lc/yzHjx+XhoZB7Ha7xTOPCwKRYrEoNptNbDabVKtVqVarUqlUpFotSblcFkMfVwEOe/0Np9Pp+QePEAH6+/s/Ab/Xr1+PiKwdYb/fb0ngzVCpVGhpaaGjo4PW1lZaW1tpaWkB2LdQm6KmpibJ5/NSKBQKxWLx67p1695qb+kGdDqdAhw/dqxvD3Do4MGDDtM0V6enp88Bu7Xu7u6VuVyOmzdvvgZG8/n82dHR0esej2fVuXPn2LFjBwcPHrw1PDy8T+u+ffsu9fX1/RnT3bp161NXV9cX7YN0Oh3b169fPxKLxT4Arzt37jwCPH369LnWGRoaepbNZsPAl0wmcxR4PDY2dlXrPH78+F02m/01NTX1ori4FAqF0ydOnEg0/Qc6Ozt/bdq0aXSp1Wkul8MwDNmyZQtABrgOJDWfH+hZrJ3P5wPYDZwCdJufA7QeOAec0HoOfx1WpHr/6dEJ9I1lXwPc1+OYq75fv3f4PGzCwn1M33ux8P3fL/K8n/HWL4P+AK5q/atLGC/Q1FsI6AG+Ay+BpwvsF/V+kpfeQrQCV/Tr7wzw6B+98MJb6B5wEwjO0faW1rmjbWqecnNhafthFYijH0DBOdoCcV1/KAa7u9TfbLZqlYJWv9Z/3E/q9YszvLaW+b++BHBVv/TkPPuJef5m/ykRERERERER/4A/4rLN4kp1eboAAAAASUVORK5CYII=';

// Base64 encoded 128x128 PNG - high-res version
const icon128Base64 = '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';

// Create proper-resolution icons
function createIcons() {
  iconDirs.forEach(dir => {
    // Create 16x16 PNG
    const buffer16 = Buffer.from(icon16Base64, 'base64');
    fs.writeFileSync(path.join(dir, 'icon16.png'), buffer16);

    // Create 48x48 PNG (proper resolution, not scaled)
    const buffer48 = Buffer.from(icon48Base64, 'base64');
    fs.writeFileSync(path.join(dir, 'icon48.png'), buffer48);

    // Create 128x128 PNG (proper resolution, not scaled)
    const buffer128 = Buffer.from(icon128Base64, 'base64');
    fs.writeFileSync(path.join(dir, 'icon128.png'), buffer128);

    console.log(`Created icons in ${path.basename(path.dirname(dir))}/${path.basename(dir)}/`);
  });

  console.log('\nIcon creation complete!');
  console.log('All sizes (16x16, 48x48, 128x128) are native resolution.');
}

createIcons();
