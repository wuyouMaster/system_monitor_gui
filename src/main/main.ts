import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

let sysInfoModule: any = null;
let win: BrowserWindow | null = null;

function getNativeModuleName(): string {
  const platformMap: Record<string, string> = { darwin: 'darwin', linux: 'linux', win32: 'win32' };
  const archMap: Record<string, string> = { x64: 'x64', arm64: 'arm64', ia32: 'ia32' };
  const plat = platformMap[process.platform] || process.platform;
  const arc = archMap[process.arch] || process.arch;
  return `index.${plat}-${arc}.node`;
}

function loadNativeModule(): void {
  const moduleName = getNativeModuleName();
  const isDev = process.env.VITE_DEV_SERVER_URL;

  const devPaths = [
    path.join(__dirname, '../../', moduleName),
    path.join(__dirname, '../', moduleName),
  ];
  const prodPaths = [path.join(process.resourcesPath, 'native', moduleName)];
  const searchPaths = isDev ? devPaths : prodPaths;
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
  console.error('Native module not found. Searched:', searchPaths);
}

// ---------------------------------------------------------------------------
// Push-based data delivery
//
// Instead of the renderer polling via ipcMain.handle (which makes the renderer
// wait 1100ms for each response), the main process pushes data to the renderer
// via webContents.send. This decouples the native call latency from the
// renderer's responsiveness.
//
// Data is also split into separate events with different cadences:
//   • fast  (1.5s) – memory + cpu usage   → only Memory + CPU panels repaint
//   • slow  (4s)   – disk + net           → only Disk + Socket panels repaint
//   • procs (3s)   – processes            → only Process panel repaints
//
// This reduces the per-tick GPU Commit cost from "all 5 panels at once" to
// "1-2 panels at a time", which is why the previous 321ms Commit happened.
// ---------------------------------------------------------------------------

function send(channel: string, payload: unknown) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

// Fast tick: memory + CPU.
//
// JsSystemSummary(n) sleeps n seconds to sample CPU counters.
// - 1.0s → the original 1100ms blocking call
// - 0.1s → too short for macOS mach APIs; returns NaN per-core values
// - 0.5s → reliable on macOS and Linux, cuts main-thread block to ~550ms
//
// Only ONE JsSystemSummary is alive at a time.  The slow and process ticks
// use direct module functions that need zero CPU sampling.
const CPU_SAMPLE_SECS = 0.5;

function pushFast() {
  if (!sysInfoModule) return;
  try {
    const summary = new sysInfoModule.JsSystemSummary(CPU_SAMPLE_SECS);
    send('data:fast', {
      memory:   summary.getMemoryInfo(),
      cpu:      summary.getCpuInfo(),
      cpuUsage: summary.getCpuUsage(),
    });
  } catch (e) {
    console.error('pushFast error:', e);
  }
}

// Slow tick: disk + network.
// Uses standalone functions — no CPU sampling needed, runs in ~10ms.
function pushSlow() {
  if (!sysInfoModule) return;
  try {
    send('data:slow', {
      disks:         sysInfoModule.jsGetDisks(),
      socketSummary: sysInfoModule.jsGetSocketSummary(),
      connections:   sysInfoModule.getConnections().slice(0, 50),
    });
  } catch (e) {
    console.error('pushSlow error:', e);
  }
}

// Process tick: uses standalone getProcesses() — no CPU sampling, ~50ms.
function pushProcesses() {
  if (!sysInfoModule) return;
  try {
    const processes = sysInfoModule.getProcesses().slice(0, 200);
    send('data:processes', {
      processes,
      processCount: processes.length,
    });
  } catch (e) {
    console.error('pushProcesses error:', e);
  }
}

// Timers — stored so we can clear them on window close
let fastTimer: ReturnType<typeof setInterval> | null = null;
let slowTimer: ReturnType<typeof setInterval> | null = null;
let procTimer: ReturnType<typeof setInterval> | null = null;

function startDataTimers() {
  // Stagger initial fires so the first repaint isn't all-at-once
  pushFast();
  setTimeout(() => { pushSlow();      slowTimer = setInterval(pushSlow,      4000); }, 500);
  setTimeout(() => { pushProcesses(); procTimer = setInterval(pushProcesses, 3000); }, 1000);
  fastTimer = setInterval(pushFast, 1500);
}

function stopDataTimers() {
  if (fastTimer) clearInterval(fastTimer);
  if (slowTimer) clearInterval(slowTimer);
  if (procTimer) clearInterval(procTimer);
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
    stopDataTimers();
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
    startDataTimers();
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

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
