"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const worker_threads = require("worker_threads");
let sysInfoModule = null;
let win = null;
let nativeWorker = null;
function getNativeModuleName() {
  const platformMap = { darwin: "darwin", linux: "linux", win32: "win32" };
  const archMap = { x64: "x64", arm64: "arm64", ia32: "ia32" };
  const plat = platformMap[process.platform] || process.platform;
  const arc = archMap[process.arch] || process.arch;
  const toolchainSuffix = process.platform === "win32" ? "-msvc" : "";
  return `index.${plat}-${arc}${toolchainSuffix}.node`;
}
function loadNativeModule() {
  const moduleName = getNativeModuleName();
  const isDev = process.env.VITE_DEV_SERVER_URL;
  const devPaths = [
    path.join(__dirname, "../../", moduleName),
    path.join(__dirname, "../", moduleName)
  ];
  const prodPaths = [path.join(process.resourcesPath, "native", moduleName)];
  const searchPaths = isDev ? devPaths : prodPaths;
  searchPaths.push(
    path.join(__dirname, "../../query_system_info/dist", moduleName),
    path.join(__dirname, "../../../query_system_info/dist", moduleName)
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
  console.error("Native module not found. Searched:", searchPaths);
}
function send(channel, payload) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}
function startDataWorker() {
  if (nativeWorker) return;
  const workerPath = path.join(__dirname, "native-worker.js");
  nativeWorker = new worker_threads.Worker(workerPath);
  nativeWorker.on("message", (msg) => {
    if (msg.channel) send(msg.channel, msg.payload);
  });
  nativeWorker.on("error", (err) => {
    console.error("native worker error:", err);
  });
  nativeWorker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`native worker exited with code ${code}, restarting in 1s...`);
    }
    nativeWorker = null;
    if (win && !win.isDestroyed()) {
      setTimeout(() => startDataWorker(), 1e3);
    }
  });
  nativeWorker.postMessage({ type: "start" });
}
function stopDataWorker() {
  if (!nativeWorker) return;
  nativeWorker.postMessage({ type: "stop" });
  nativeWorker.terminate();
  nativeWorker = null;
}
function createWindow() {
  win = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    frame: true,
    titleBarStyle: "default",
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  });
  win.on("closed", () => {
    stopDataWorker();
    win = null;
  });
  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    win.webContents.openDevTools();
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  win.webContents.once("did-finish-load", () => {
    loadNativeModule();
    startDataWorker();
  });
}
electron.ipcMain.handle("get-memory-info", async () => sysInfoModule == null ? void 0 : sysInfoModule.jsGetMemoryInfo());
electron.ipcMain.handle("get-cpu-info", async () => sysInfoModule == null ? void 0 : sysInfoModule.jsGetCpuInfo());
electron.ipcMain.handle("get-cpu-usage", async (_, dur = 1) => sysInfoModule == null ? void 0 : sysInfoModule.jsGetCpuUsage(dur));
electron.ipcMain.handle("get-disks", async () => sysInfoModule == null ? void 0 : sysInfoModule.jsGetDisks());
electron.ipcMain.handle("get-socket-summary", async () => sysInfoModule == null ? void 0 : sysInfoModule.jsGetSocketSummary());
electron.ipcMain.handle("get-processes", async () => sysInfoModule == null ? void 0 : sysInfoModule.getProcesses());
electron.ipcMain.handle("get-connections", async () => sysInfoModule == null ? void 0 : sysInfoModule.getConnections());
electron.ipcMain.handle("list-dir", async (_, path2) => {
  if (!sysInfoModule) return { error: "Native module not loaded" };
  try {
    const listDir = sysInfoModule.listDir || sysInfoModule.list_dir;
    if (typeof listDir !== "function") return { error: "listDir API not available" };
    return { entries: listDir(path2) };
  } catch (e) {
    return { error: (e == null ? void 0 : e.message) ?? String(e) };
  }
});
electron.ipcMain.handle("kill-process", async (_, pid) => {
  if (!sysInfoModule) return { error: "Native module not loaded" };
  try {
    const killFn = sysInfoModule.killProcess || sysInfoModule.kill_process;
    if (typeof killFn !== "function") return { error: "killProcess API not available" };
    killFn(pid);
    return { ok: true };
  } catch (e) {
    return { error: (e == null ? void 0 : e.message) ?? String(e) };
  }
});
electron.ipcMain.on("trace:start", (_, payload) => {
  if (!nativeWorker) return;
  nativeWorker.postMessage({ type: "trace:start", pid: payload.pid });
});
electron.ipcMain.on("trace:stop", () => {
  if (!nativeWorker) return;
  nativeWorker.postMessage({ type: "trace:stop" });
});
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
