import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const distDir = path.join(rootDir, 'dist');
const chromeDir = path.join(distDir, 'chrome');
const zipFileName = `${packageJson.name}-chrome-v${packageJson.version}.zip`;
const zipPath = path.join(distDir, zipFileName);
const packageZipPattern = new RegExp(`^${packageJson.name}-(?:chrome|firefox)(?:-v[\\w.-]+)?\\.zip$`);

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    ...options
  });
}

function removeOldPackageZips(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory)) {
    if (!packageZipPattern.test(entry)) {
      continue;
    }

    const filePath = path.join(directory, entry);
    if (fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
      console.log(`Removed old package: ${path.relative(rootDir, filePath)}`);
    }
  }
}

run('npm', ['run', 'build:chrome']);
run('npm', ['run', 'build:icons']);

removeOldPackageZips(distDir);

run('zip', ['-qr', zipPath, '.', '-x', '*.DS_Store'], { cwd: chromeDir });

console.log(`Created Chrome Web Store package: ${path.relative(rootDir, zipPath)}`);
