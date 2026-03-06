"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("systemInfo", {
  getSystemSummary: () => electron.ipcRenderer.invoke("get-system-summary"),
  getMemoryInfo: () => electron.ipcRenderer.invoke("get-memory-info"),
  getCpuInfo: () => electron.ipcRenderer.invoke("get-cpu-info"),
  getCpuUsage: (duration) => electron.ipcRenderer.invoke("get-cpu-usage", duration),
  getDisks: () => electron.ipcRenderer.invoke("get-disks"),
  getSocketSummary: () => electron.ipcRenderer.invoke("get-socket-summary"),
  getProcesses: () => electron.ipcRenderer.invoke("get-processes"),
  getConnections: () => electron.ipcRenderer.invoke("get-connections")
});
