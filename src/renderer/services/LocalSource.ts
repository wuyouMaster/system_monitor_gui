import type {
  DataSource,
  DataSourceType,
  FastData,
  SlowData,
  ProcessData,
  TraceData,
  DirEntry,
  SocketStatItem,
  SocketQueueItem,
  ProcessInfo,
} from '../types/data-source';

/**
 * LocalSource — wraps the Electron IPC bridge (window.systemInfo).
 * This is a thin passthrough that delegates all calls to the native worker
 * via the preload script.
 */
export class LocalSource implements DataSource {
  readonly type: DataSourceType = 'local';

  isConnected(): boolean {
    return typeof window !== 'undefined' && !!window.systemInfo;
  }

  // ---- Push subscriptions ----

  onFastData(cb: (d: FastData) => void): () => void {
    return window.systemInfo.onFastData(cb);
  }

  onSlowData(cb: (d: SlowData) => void): () => void {
    return window.systemInfo.onSlowData(cb);
  }

  onProcessData(cb: (d: ProcessData) => void): () => void {
    return window.systemInfo.onProcessData(cb);
  }

  onTraceData(cb: (d: TraceData) => void): () => void {
    return window.systemInfo.onTraceData(cb);
  }

  // ---- Actions ----

  async killProcess(pid: number): Promise<{ ok?: boolean; error?: string }> {
    return window.systemInfo.killProcess(pid);
  }

  async searchProcess(
    query: string,
    requestId?: number,
  ): Promise<{ requestId?: number; results?: ProcessInfo[]; error?: string }> {
    return window.systemInfo.searchProcess(query, requestId);
  }

  async listDir(path: string): Promise<{ entries?: DirEntry[]; error?: string }> {
    return window.systemInfo.listDir(path);
  }

  startTrace(pid: number): void {
    window.systemInfo.startTrace(pid);
  }

  stopTrace(): void {
    window.systemInfo.stopTrace();
  }

  async getProcessSocketStats(pid: number): Promise<SocketStatItem[]> {
    return window.systemInfo.getProcessSocketStats(pid);
  }

  async getProcessSocketQueues(pid: number): Promise<SocketQueueItem[]> {
    return window.systemInfo.getProcessSocketQueues(pid);
  }

  async getProcessCpuUsage(pid: number, sampleSecs?: number): Promise<number> {
    return window.systemInfo.getProcessCpuUsage(pid, sampleSecs);
  }

  destroy(): void {
    // Nothing to clean up — Electron IPC handles unsubscription via the
    // return values of onXxx in the Dashboard useEffect cleanup.
  }
}
