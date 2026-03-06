"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
let sysInfoModule = null;
function getNativeModuleName() {
  const platform = process.platform;
  const arch = process.arch;
  const platformMap = {
    darwin: "darwin",
    linux: "linux",
    win32: "win32"
  };
  const archMap = {
    x64: "x64",
    arm64: "arm64",
    ia32: "ia32"
  };
  const plat = platformMap[platform] || platform;
  const arc = archMap[arch] || arch;
  return `index.${plat}-${arc}.node`;
}
function loadNativeModule() {
  const moduleName = getNativeModuleName();
  const isDev = process.env.VITE_DEV_SERVER_URL;
  const devPaths = [
    path.join(__dirname, "../../", moduleName),
    // project root
    path.join(__dirname, "../", moduleName)
    // dist/
  ];
  const prodPaths = [
    path.join(process.resourcesPath, "native", moduleName)
  ];
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
  console.error("Native module not found. Searched paths:");
  searchPaths.forEach((p) => console.error(`  - ${p}`));
  console.error(`Expected module name: ${moduleName} (platform: ${process.platform}, arch: ${process.arch})`);
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    frame: true,
    titleBarStyle: "default",
    backgroundColor: "#0a0a0f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  loadNativeModule();
}
electron.ipcMain.handle("get-system-summary", async () => {
  if (!sysInfoModule) {
    throw new Error("Native module not loaded");
  }
  try {
    const summary = new sysInfoModule.JsSystemSummary(1);
    return {
      memory: summary.getMemoryInfo(),
      cpu: summary.getCpuInfo(),
      cpuUsage: summary.getCpuUsage(),
      disks: summary.getDisks(),
      socketSummary: summary.getSocketSummary(),
      processes: summary.getProcesses().slice(0, 20),
      // Top 20 processes
      processCount: summary.getProcessCount(),
      connections: summary.getConnections().slice(0, 50)
      // Top 50 connections
    };
  } catch (error) {
    console.error("Error getting system summary:", error);
    throw error;
  }
});
electron.ipcMain.handle("get-memory-info", async () => {
  if (!sysInfoModule) throw new Error("Native module not loaded");
  return sysInfoModule.jsGetMemoryInfo();
});
electron.ipcMain.handle("get-cpu-info", async () => {
  if (!sysInfoModule) throw new Error("Native module not loaded");
  return sysInfoModule.jsGetCpuInfo();
});
electron.ipcMain.handle("get-cpu-usage", async (_, duration = 1) => {
  if (!sysInfoModule) throw new Error("Native module not loaded");
  return sysInfoModule.jsGetCpuUsage(duration);
});
electron.ipcMain.handle("get-disks", async () => {
  if (!sysInfoModule) throw new Error("Native module not loaded");
  return sysInfoModule.jsGetDisks();
});
electron.ipcMain.handle("get-socket-summary", async () => {
  if (!sysInfoModule) throw new Error("Native module not loaded");
  return sysInfoModule.jsGetSocketSummary();
});
electron.ipcMain.handle("get-processes", async () => {
  if (!sysInfoModule) throw new Error("Native module not loaded");
  return sysInfoModule.getProcesses();
});
electron.ipcMain.handle("get-connections", async () => {
  if (!sysInfoModule) throw new Error("Native module not loaded");
  return sysInfoModule.getConnections();
});
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
