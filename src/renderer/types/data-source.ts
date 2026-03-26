// ---------------------------------------------------------------------------
// Unified data types — used by both LocalSource and RemoteSource
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

export interface DirEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
}

export interface TraceEvent {
  id: string;
  timestamp: string;
  process: string;
  pid: number;
  command?: string;
  details?: string;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'spawn';
  summary: string;
  severity: 'low' | 'medium' | 'high';
  delta: string;
  durationMs: number;
}

export interface TraceMemorySample {
  pid: number;
  timestamp: string;
  memoryBytes: number;
}

export interface TraceIoSample {
  pid: number;
  timestamp: string;
  readBytes: number;
  writeBytes: number;
}

export interface TraceCpuSample {
  pid: number;
  timestamp: string;
  cpuPercent: number;
}

export interface SocketStatItem {
  pid: number;
  fd: number;
  protocol: string;
  localAddr: string;
  remoteAddr: string | null;
  bytesSent: number;
  bytesReceived: number;
}

export interface SocketQueueItem {
  pid: number;
  fd: number;
  protocol: string;
  localAddr: string;
  remoteAddr: string | null;
  state: string;
  recvQueueBytes: number;
  recvQueueHiwat: number;
  sendQueueBytes: number;
  sendQueueHiwat: number;
}

// Push-event payloads (shared between local and remote)
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

export interface TraceData {
  events: TraceEvent[];
  reset?: boolean;
  targetPid?: number | null;
  memorySample?: TraceMemorySample;
  ioSample?: TraceIoSample;
  cpuSample?: TraceCpuSample;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type DataSourceType = 'local' | 'remote';

export interface RemoteConfig {
  serverUrl: string;
  username: string;
  password: string;
}

export interface DataSourceSettings {
  type: DataSourceType;
  remote: RemoteConfig;
}

export const DEFAULT_SETTINGS: DataSourceSettings = {
  type: 'local',
  remote: {
    serverUrl: 'http://localhost:3030',
    username: '',
    password: '',
  },
};

// ---------------------------------------------------------------------------
// DataSource interface
// ---------------------------------------------------------------------------

export interface DataSource {
  readonly type: DataSourceType;
  isConnected(): boolean;

  // Push subscriptions — each returns an unsubscribe function
  onFastData(cb: (d: FastData) => void): () => void;
  onSlowData(cb: (d: SlowData) => void): () => void;
  onProcessData(cb: (d: ProcessData) => void): () => void;
  onTraceData(cb: (d: TraceData) => void): () => void;

  // Actions
  killProcess(pid: number): Promise<{ ok?: boolean; error?: string }>;
  searchProcess(
    query: string,
    requestId?: number,
  ): Promise<{ requestId?: number; results?: ProcessInfo[]; error?: string }>;
  listDir(path: string): Promise<{ entries?: DirEntry[]; error?: string }>;
  startTrace(pid: number): void;
  stopTrace(): void;
  getProcessSocketStats(pid: number): Promise<SocketStatItem[]>;
  getProcessSocketQueues(pid: number): Promise<SocketQueueItem[]>;
  getProcessCpuUsage(pid: number, sampleSecs?: number): Promise<number>;

  // Lifecycle
  destroy(): void;
}
