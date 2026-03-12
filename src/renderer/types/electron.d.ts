declare global {
  interface Window {
    systemInfo: {
      onFastData:    (cb: (d: { memory: any; cpu: any; cpuUsage: number[] }) => void) => () => void;
      onSlowData:    (cb: (d: { disks: any[]; socketSummary: any; connections: any[] }) => void) => () => void;
      onProcessData: (cb: (d: { processes: any[]; processCount: number }) => void) => () => void;
      onTraceData:   (cb: (d: { events: TraceEvent[]; reset?: boolean; targetPid?: number | null }) => void) => () => void;
      startTrace:    (pid: number) => void;
      stopTrace:     () => void;
    };
  }
}

export interface TraceEvent {
  id: string;
  timestamp: string;
  process: string;
  pid: number;
  command?: string;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'spawn';
  summary: string;
  severity: 'low' | 'medium' | 'high';
  delta: string;
  durationMs: number;
}

export {};
