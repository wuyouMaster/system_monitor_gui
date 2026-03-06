import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

// Import the native module - will be loaded at runtime
let sysInfoModule: any = null;

/**
 * Get the platform-specific .node file name
 * NAPI-RS produces files like: index.darwin-arm64.node, index.linux-x64.node, etc.
 */
function getNativeModuleName(): string {
  const platform = process.platform;
  const arch = process.arch;
  
  const platformMap: Record<string, string> = {
    darwin: 'darwin',
    linux: 'linux',
    win32: 'win32',
  };
  
  const archMap: Record<string, string> = {
    x64: 'x64',
    arm64: 'arm64',
    ia32: 'ia32',
  };
  
  const plat = platformMap[platform] || platform;
  const arc = archMap[arch] || arch;
  
  return `index.${plat}-${arc}.node`;
}

/**
 * Find and load the native module from multiple possible locations
 */
function loadNativeModule(): void {
  const moduleName = getNativeModuleName();
  const isDev = process.env.VITE_DEV_SERVER_URL;
  
  // In development mode, the .node file is copied to the project root
  const devPaths = [
    path.join(__dirname, '../../', moduleName),  // project root
    path.join(__dirname, '../', moduleName),     // dist/
  ];
  
  // In production, load from resources
  const prodPaths = [
    path.join(process.resourcesPath, 'native', moduleName),
  ];
  
  const searchPaths = isDev ? devPaths : prodPaths;
  
  // Add fallback paths
  searchPaths.push(
    path.join(__dirname, '../../query_system_info/dist', moduleName),
    path.join(__dirname, '../../../query_system_info/dist', moduleName),
  );

  for (const modulePath of searchPaths) {
    try {
      if (fs.existsSync(modulePath)) {
        sysInfoModule = require(modulePath);
        console.log(`Native module loaded from: ${modulePath}`);
        return;
      }
    } catch (e) {
      console.warn(`Failed to load from ${modulePath}:`, e);
    }
  }

  console.error('Native module not found. Searched paths:');
  searchPaths.forEach(p => console.error(`  - ${p}`));
  console.error(`Expected module name: ${moduleName} (platform: ${process.platform}, arch: ${process.arch})`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Load the native module
  loadNativeModule();
}

// IPC Handlers for system info
ipcMain.handle('get-system-summary', async () => {
  if (!sysInfoModule) {
    throw new Error('Native module not loaded');
  }
  try {
    const summary = new sysInfoModule.JsSystemSummary(1);
    return {
      memory: summary.getMemoryInfo(),
      cpu: summary.getCpuInfo(),
      cpuUsage: summary.getCpuUsage(),
      disks: summary.getDisks(),
      socketSummary: summary.getSocketSummary(),
      processes: summary.getProcesses().slice(0, 20), // Top 20 processes
      processCount: summary.getProcessCount(),
      connections: summary.getConnections().slice(0, 50), // Top 50 connections
    };
  } catch (error) {
    console.error('Error getting system summary:', error);
    throw error;
  }
});

ipcMain.handle('get-memory-info', async () => {
  if (!sysInfoModule) throw new Error('Native module not loaded');
  return sysInfoModule.jsGetMemoryInfo();
});

ipcMain.handle('get-cpu-info', async () => {
  if (!sysInfoModule) throw new Error('Native module not loaded');
  return sysInfoModule.jsGetCpuInfo();
});

ipcMain.handle('get-cpu-usage', async (_, duration: number = 1) => {
  if (!sysInfoModule) throw new Error('Native module not loaded');
  return sysInfoModule.jsGetCpuUsage(duration);
});

ipcMain.handle('get-disks', async () => {
  if (!sysInfoModule) throw new Error('Native module not loaded');
  return sysInfoModule.jsGetDisks();
});

ipcMain.handle('get-socket-summary', async () => {
  if (!sysInfoModule) throw new Error('Native module not loaded');
  return sysInfoModule.jsGetSocketSummary();
});

ipcMain.handle('get-processes', async () => {
  if (!sysInfoModule) throw new Error('Native module not loaded');
  return sysInfoModule.getProcesses();
});

ipcMain.handle('get-connections', async () => {
  if (!sysInfoModule) throw new Error('Native module not loaded');
  return sysInfoModule.getConnections();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
