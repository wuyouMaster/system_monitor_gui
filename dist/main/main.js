"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
let sysInfoModule = null;
let win = null;
function getNativeModuleName() {
  const platformMap = { darwin: "darwin", linux: "linux", win32: "win32" };
  const archMap = { x64: "x64", arm64: "arm64", ia32: "ia32" };
  const plat = platformMap[process.platform] || process.platform;
  const arc = archMap[process.arch] || process.arch;
  return `index.${plat}-${arc}.node`;
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
const CPU_SAMPLE_SECS = 0.5;
function pushFast() {
  if (!sysInfoModule) return;
  try {
    const summary = new sysInfoModule.JsSystemSummary(CPU_SAMPLE_SECS);
    send("data:fast", {
      memory: summary.getMemoryInfo(),
      cpu: summary.getCpuInfo(),
      cpuUsage: summary.getCpuUsage()
    });
  } catch (e) {
    console.error("pushFast error:", e);
  }
}
function pushSlow() {
  if (!sysInfoModule) return;
  try {
    send("data:slow", {
      disks: sysInfoModule.jsGetDisks(),
      socketSummary: sysInfoModule.jsGetSocketSummary(),
      connections: sysInfoModule.getConnections().slice(0, 50)
    });
  } catch (e) {
    console.error("pushSlow error:", e);
  }
}
function pushProcesses() {
  if (!sysInfoModule) return;
  try {
    const processes = sysInfoModule.getProcesses().slice(0, 200);
    send("data:processes", {
      processes,
      processCount: processes.length
    });
  } catch (e) {
    console.error("pushProcesses error:", e);
  }
}
let fastTimer = null;
let slowTimer = null;
let procTimer = null;
function startDataTimers() {
  pushFast();
  setTimeout(() => {
    pushSlow();
    slowTimer = setInterval(pushSlow, 4e3);
  }, 500);
  setTimeout(() => {
    pushProcesses();
    procTimer = setInterval(pushProcesses, 3e3);
  }, 1e3);
  fastTimer = setInterval(pushFast, 1500);
}
function stopDataTimers() {
  if (fastTimer) clearInterval(fastTimer);
  if (slowTimer) clearInterval(slowTimer);
  if (procTimer) clearInterval(procTimer);
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
    stopDataTimers();
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
    startDataTimers();
  });
}
electron.ipcMain.handle("get-memory-info", async () => sysInfoModule == null ? void 0 : sysInfoModule.jsGetMemoryInfo());
electron.ipcMain.handle("get-cpu-info", async () => sysInfoModule == null ? void 0 : sysInfoModule.jsGetCpuInfo());
electron.ipcMain.handle("get-cpu-usage", async (_, dur = 1) => sysInfoModule == null ? void 0 : sysInfoModule.jsGetCpuUsage(dur));
electron.ipcMain.handle("get-disks", async () => sysInfoModule == null ? void 0 : sysInfoModule.jsGetDisks());
electron.ipcMain.handle("get-socket-summary", async () => sysInfoModule == null ? void 0 : sysInfoModule.jsGetSocketSummary());
electron.ipcMain.handle("get-processes", async () => sysInfoModule == null ? void 0 : sysInfoModule.getProcesses());
electron.ipcMain.handle("get-connections", async () => sysInfoModule == null ? void 0 : sysInfoModule.getConnections());
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
