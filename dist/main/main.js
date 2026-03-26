"use strict";
const electron = require("electron");
const path = require("path");
const worker_threads = require("worker_threads");
let sysInfoModule = null;
let win = null;
let nativeWorker = null;
function loadNativeModule() {
  if (sysInfoModule) return;
  try {
    sysInfoModule = require("js-query-system-info");
    console.log("Native module loaded from js-query-system-info package");
  } catch (e) {
    console.error("Failed to load js-query-system-info package:", e);
  }
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
electron.ipcMain.handle("get-process-socket-stats", async (_, pid) => {
  if (!sysInfoModule) return [];
  try {
    const fn = sysInfoModule.jsGetProcessSocketStats || sysInfoModule.js_get_process_socket_stats;
    if (typeof fn !== "function") return [];
    return fn(pid);
  } catch {
    return [];
  }
});
electron.ipcMain.handle("get-process-socket-queues", async (_, pid) => {
  if (!sysInfoModule) return [];
  try {
    const fn = sysInfoModule.jsGetProcessSocketQueues || sysInfoModule.js_get_process_socket_queues;
    if (typeof fn !== "function") return [];
    return fn(pid);
  } catch {
    return [];
  }
});
electron.ipcMain.handle("get-process-cpu-usage", async (_, pid, sampleSecs) => {
  if (!sysInfoModule) {
    console.warn("[CPU] sysInfoModule not loaded");
    return 0;
  }
  try {
    const fn = sysInfoModule.jsGetProcessCpuUsage || sysInfoModule.js_get_process_cpu_usage;
    if (typeof fn !== "function") {
      console.warn("[CPU] jsGetProcessCpuUsage not found on native module. Available funcs:", Object.keys(sysInfoModule).filter((k) => typeof sysInfoModule[k] === "function").join(", "));
      return 0;
    }
    return fn(pid, sampleSecs ?? 0.5);
  } catch (e) {
    console.warn(`[CPU] get-process-cpu-usage(${pid}) error:`, e == null ? void 0 : e.message);
    return 0;
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
electron.ipcMain.handle("process-search", async (_, payload) => {
  if (!nativeWorker) return { error: "Native worker not running" };
  const worker = nativeWorker;
  return new Promise((resolve) => {
    const handler = (msg) => {
      if (msg.channel !== "data:process-search") return;
      const response = msg.payload ?? {};
      if (typeof payload.requestId === "number" && response.requestId !== payload.requestId) {
        return;
      }
      worker.off("message", handler);
      resolve(response);
    };
    worker.on("message", handler);
    worker.postMessage({ type: "process:search", query: payload.query, requestId: payload.requestId });
  });
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
