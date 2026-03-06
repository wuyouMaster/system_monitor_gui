import { contextBridge, ipcRenderer } from 'electron';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// Push-event payloads from main process
export interface FastData {
  memory: MemoryInfo;
  cpu: CpuInfo;
  cpuUsage: number[];
}

export interface SlowData {
  disks: DiskInfo[];
  socketSummary: SocketSummary;
  connections: SocketConnection[];
}

export interface ProcessData {
  processes: ProcessInfo[];
  processCount: number;
}

// ---------------------------------------------------------------------------
// Exposed API
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('systemInfo', {
  // Push subscriptions — main process sends these on a timer.
  // Each returns an unsubscribe function for cleanup.
  onFastData:      (cb: (d: FastData)    => void) => {
    const handler = (_: unknown, d: FastData)    => cb(d);
    ipcRenderer.on('data:fast',      handler);
    return () => ipcRenderer.removeListener('data:fast',      handler);
  },
  onSlowData:      (cb: (d: SlowData)    => void) => {
    const handler = (_: unknown, d: SlowData)    => cb(d);
    ipcRenderer.on('data:slow',      handler);
    return () => ipcRenderer.removeListener('data:slow',      handler);
  },
  onProcessData:   (cb: (d: ProcessData) => void) => {
    const handler = (_: unknown, d: ProcessData) => cb(d);
    ipcRenderer.on('data:processes', handler);
    return () => ipcRenderer.removeListener('data:processes', handler);
  },
});
