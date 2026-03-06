import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import fs from 'fs';

// Copy .node file to dist for development
function copyNodeModule() {
  const srcDir = path.join(__dirname, '../query_system_info/dist');
  const destDir = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(srcDir)) {
    console.warn('Warning: query_system_info/dist not found. Skipping .node copy.');
    return;
  }
  
  // Find .node file
  const files = fs.readdirSync(srcDir);
  const nodeFile = files.find(f => f.endsWith('.node') && f.startsWith('index'));
  
  if (!nodeFile) {
    console.warn('Warning: No .node file found. Skipping copy.');
    return;
  }
  
  // Create dest directory if not exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy to dist directory
  fs.copyFileSync(
    path.join(srcDir, nodeFile),
    path.join(destDir, nodeFile)
  );
  console.log(`✓ Copied ${nodeFile} to dist/`);
}

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist/main',
          },
        },
      },
      {
        entry: 'src/main/preload.ts',
        onstart(options) {
          // Copy .node file when dev server starts
          copyNodeModule();
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/main',
          },
        },
      },
    ]),
    renderer({
      onstart(options) {
        // Copy .node file when renderer starts
        copyNodeModule();
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  base: './',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});

