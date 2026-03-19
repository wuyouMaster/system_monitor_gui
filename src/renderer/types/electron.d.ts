declare global {
  interface Window {
    systemInfo: {
      onFastData:    (cb: (d: { memory: any; cpu: any; cpuUsage: number[] }) => void) => () => void;
      onSlowData:    (cb: (d: { disks: any[]; socketSummary: any; connections: any[] }) => void) => () => void;
      onProcessData: (cb: (d: { processes: any[]; processCount: number }) => void) => () => void;
      onTraceData:   (cb: (d: { events: TraceEvent[]; reset?: boolean; targetPid?: number | null; memorySample?: TraceMemorySample; ioSample?: TraceIoSample }) => void) => () => void;
      startTrace:    (pid: number) => void;
      stopTrace:     () => void;
      killProcess:   (pid: number) => Promise<{ ok?: boolean; error?: string }>;
      searchProcess: (query: string, requestId?: number) => Promise<{ requestId?: number; results?: any[]; error?: string }>;
      listDir:       (path: string) => Promise<{ entries?: DirEntry[]; error?: string }>;
    };
  }
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

export {};
