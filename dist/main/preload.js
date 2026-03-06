"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("systemInfo", {
  // Push subscriptions — main process sends these on a timer.
  // Each returns an unsubscribe function for cleanup.
  onFastData: (cb) => {
    const handler = (_, d) => cb(d);
    electron.ipcRenderer.on("data:fast", handler);
    return () => electron.ipcRenderer.removeListener("data:fast", handler);
  },
  onSlowData: (cb) => {
    const handler = (_, d) => cb(d);
    electron.ipcRenderer.on("data:slow", handler);
    return () => electron.ipcRenderer.removeListener("data:slow", handler);
  },
  onProcessData: (cb) => {
    const handler = (_, d) => cb(d);
    electron.ipcRenderer.on("data:processes", handler);
    return () => electron.ipcRenderer.removeListener("data:processes", handler);
  }
});
