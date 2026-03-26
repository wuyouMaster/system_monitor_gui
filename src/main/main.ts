import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { Worker } from 'worker_threads';

let sysInfoModule: any = null;
let win: BrowserWindow | null = null;
let nativeWorker: Worker | null = null;

function loadNativeModule(): void {
  if (sysInfoModule) return;

  try {
    // Import from npm package js-query-system-info
    sysInfoModule = require('js-query-system-info');
    console.log('Native module loaded from js-query-system-info package');
  } catch (e) {
    console.error('Failed to load js-query-system-info package:', e);
  }
}

function send(channel: string, payload: unknown) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

function startDataWorker() {
  if (nativeWorker) return;

  const workerPath = path.join(__dirname, 'native-worker.js');
  nativeWorker = new Worker(workerPath);

  nativeWorker.on('message', (msg: { channel?: string; payload?: unknown }) => {
    if (msg.channel) send(msg.channel, msg.payload);
  });
  nativeWorker.on('error', (err) => {
    console.error('native worker error:', err);
  });
  nativeWorker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`native worker exited with code ${code}, restarting in 1s...`);
    }
    nativeWorker = null;
    // Auto-restart unless the window is gone
    if (win && !win.isDestroyed()) {
      setTimeout(() => startDataWorker(), 1000);
    }
  });

  nativeWorker.postMessage({ type: 'start' });
}

function stopDataWorker() {
  if (!nativeWorker) return;
  nativeWorker.postMessage({ type: 'stop' });
  nativeWorker.terminate();
  nativeWorker = null;
}

function createWindow() {
  win = new BrowserWindow({
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
      backgroundThrottling: false,
    },
  });

  win.on('closed', () => {
    stopDataWorker();
    win = null;
  });

  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    win.webContents.openDevTools();
    win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Start pushing data once the renderer is ready to receive
  win.webContents.once('did-finish-load', () => {
    loadNativeModule();
    startDataWorker();
  });
}

// ---------------------------------------------------------------------------
// Legacy pull-based handlers (kept for compatibility / debug use)
// ---------------------------------------------------------------------------
ipcMain.handle('get-memory-info',  async () => sysInfoModule?.jsGetMemoryInfo());
ipcMain.handle('get-cpu-info',     async () => sysInfoModule?.jsGetCpuInfo());
ipcMain.handle('get-cpu-usage',    async (_, dur: number = 1) => sysInfoModule?.jsGetCpuUsage(dur));
ipcMain.handle('get-disks',        async () => sysInfoModule?.jsGetDisks());
ipcMain.handle('get-socket-summary', async () => sysInfoModule?.jsGetSocketSummary());
ipcMain.handle('get-processes',    async () => sysInfoModule?.getProcesses());
ipcMain.handle('get-connections',  async () => sysInfoModule?.getConnections());

ipcMain.handle('list-dir', async (_, path: string) => {
  if (!sysInfoModule) return { error: 'Native module not loaded' };
  try {
    const listDir = sysInfoModule.listDir || sysInfoModule.list_dir;
    if (typeof listDir !== 'function') return { error: 'listDir API not available' };
    return { entries: listDir(path) };
  } catch (e: any) {
    return { error: e?.message ?? String(e) };
  }
});

ipcMain.handle('kill-process', async (_, pid: number) => {
  if (!sysInfoModule) return { error: 'Native module not loaded' };
  try {
    const killFn = sysInfoModule.killProcess || sysInfoModule.kill_process;
    if (typeof killFn !== 'function') return { error: 'killProcess API not available' };
    killFn(pid);
    return { ok: true };
  } catch (e: any) {
    return { error: e?.message ?? String(e) };
  }
});

ipcMain.handle('get-process-socket-stats', async (_, pid: number) => {
  if (!sysInfoModule) return [];
  try {
    const fn = sysInfoModule.jsGetProcessSocketStats || sysInfoModule.js_get_process_socket_stats;
    if (typeof fn !== 'function') return [];
    return fn(pid);
  } catch {
    return [];
  }
});

ipcMain.handle('get-process-socket-queues', async (_, pid: number) => {
  if (!sysInfoModule) return [];
  try {
    const fn = sysInfoModule.jsGetProcessSocketQueues || sysInfoModule.js_get_process_socket_queues;
    if (typeof fn !== 'function') return [];
    return fn(pid);
  } catch {
    return [];
  }
});

ipcMain.handle('get-process-cpu-usage', async (_, pid: number, sampleSecs?: number) => {
  if (!sysInfoModule) { console.warn('[CPU] sysInfoModule not loaded'); return 0; }
  try {
    const fn = sysInfoModule.jsGetProcessCpuUsage || sysInfoModule.js_get_process_cpu_usage;
    if (typeof fn !== 'function') {
      console.warn('[CPU] jsGetProcessCpuUsage not found on native module. Available funcs:', Object.keys(sysInfoModule).filter(k => typeof sysInfoModule[k] === 'function').join(', '));
      return 0;
    }
    return fn(pid, sampleSecs ?? 0.5);
  } catch (e: any) {
    console.warn(`[CPU] get-process-cpu-usage(${pid}) error:`, e?.message);
    return 0;
  }
});

ipcMain.on('trace:start', (_, payload: { pid: number }) => {
  if (!nativeWorker) return;
  nativeWorker.postMessage({ type: 'trace:start', pid: payload.pid });
});

ipcMain.on('trace:stop', () => {
  if (!nativeWorker) return;
  nativeWorker.postMessage({ type: 'trace:stop' });
});

ipcMain.handle('process-search', async (_, payload: { query: string; requestId?: number }) => {
  if (!nativeWorker) return { error: 'Native worker not running' };
  const worker = nativeWorker;
  return new Promise((resolve) => {
    const handler = (msg: { channel?: string; payload?: any }) => {
      if (msg.channel !== 'data:process-search') return;
      const response = msg.payload ?? {};
      if (typeof payload.requestId === 'number' && response.requestId !== payload.requestId) {
        return;
      }
      worker.off('message', handler);
      resolve(response);
    };
    worker.on('message', handler);
    worker.postMessage({ type: 'process:search', query: payload.query, requestId: payload.requestId });
  });
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
