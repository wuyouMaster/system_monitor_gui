import { contextBridge, ipcRenderer } from 'electron';

export interface MemoryInfo {
  total: number;
  available: number;
  used: number;
  free: number;
  usagePercent: number;
}

export interface CpuInfo {
  physicalCores: number;
  logicalCores: number;
  modelName: string;
  vendor: string;
  frequencyMhz: number;
}

export interface DiskInfo {
  device: string;
  mountPoint: string;
  fsType: string;
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercent: number;
}

export interface SocketSummary {
  total: number;
  established: number;
  listen: number;
  timeWait: number;
  closeWait: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  status: string;
  memoryUsage: number;
}

export interface SocketConnection {
  protocol: string;
  localAddr: string;
  remoteAddr: string;
  state: string;
  pid: number;
  inode: number;
}

export interface SystemSummary {
  memory: MemoryInfo;
  cpu: CpuInfo;
  cpuUsage: number[];
  disks: DiskInfo[];
  socketSummary: SocketSummary;
  processes: ProcessInfo[];
  processCount: number;
  connections: SocketConnection[];
}

contextBridge.exposeInMainWorld('systemInfo', {
  getSystemSummary: () => ipcRenderer.invoke('get-system-summary'),
  getMemoryInfo: () => ipcRenderer.invoke('get-memory-info'),
  getCpuInfo: () => ipcRenderer.invoke('get-cpu-info'),
  getCpuUsage: (duration?: number) => ipcRenderer.invoke('get-cpu-usage', duration),
  getDisks: () => ipcRenderer.invoke('get-disks'),
  getSocketSummary: () => ipcRenderer.invoke('get-socket-summary'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  getConnections: () => ipcRenderer.invoke('get-connections'),
});
