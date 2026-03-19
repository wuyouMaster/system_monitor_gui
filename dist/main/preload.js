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
  },
  onTraceData: (cb) => {
    const handler = (_, d) => cb(d);
    electron.ipcRenderer.on("data:trace", handler);
    return () => electron.ipcRenderer.removeListener("data:trace", handler);
  },
  startTrace: (pid) => electron.ipcRenderer.send("trace:start", { pid }),
  stopTrace: () => electron.ipcRenderer.send("trace:stop"),
  killProcess: (pid) => electron.ipcRenderer.invoke("kill-process", pid),
  searchProcess: (query, requestId) => electron.ipcRenderer.invoke("process-search", { query, requestId }),
  listDir: (path) => electron.ipcRenderer.invoke("list-dir", path)
});
