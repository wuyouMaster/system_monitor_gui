#!/usr/bin/env node

/**
 * Copy the platform-specific .node file from query_system_info/dist to system-monitor/dist
 * This script should be run before starting the Electron app in development mode
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../../query_system_info/dist');
const destDir = path.join(__dirname, '..');

console.log('Copying native module...');
console.log(`  Source: ${srcDir}`);
console.log(`  Destination: ${destDir}`);

if (!fs.existsSync(srcDir)) {
  console.error('Error: query_system_info/dist directory not found!');
  console.error('Please run: cd ../query_system_info/js-abi && yarn install && yarn build');
  process.exit(1);
}

// Find .node file (e.g., index.darwin-arm64.node)
const files = fs.readdirSync(srcDir);
const nodeFile = files.find(f => f.endsWith('.node') && f.startsWith('index'));

if (!nodeFile) {
  console.error('Error: No .node file found in query_system_info/dist!');
  console.error('Available files:', files);
  console.error('Please build the Rust NAPI module first.');
  process.exit(1);
}

const srcPath = path.join(srcDir, nodeFile);
const destPath = path.join(destDir, nodeFile);

// Copy the file
fs.copyFileSync(srcPath, destPath);
console.log(`✓ Copied ${nodeFile} to dist/`);

// Also create a symlink named index.node for compatibility
const symlinkPath = path.join(destDir, 'index.node');
try {
  if (fs.existsSync(symlinkPath) || fs.lstatSync(symlinkPath).isSymbolicLink()) {
    fs.unlinkSync(symlinkPath);
  }
  fs.symlinkSync(nodeFile, symlinkPath);
  console.log(`✓ Created symlink: index.node -> ${nodeFile}`);
} catch (e) {
  console.warn('Warning: Could not create symlink (this is OK on Windows)');
}

console.log('Native module ready!');
