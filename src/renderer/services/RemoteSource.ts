import type {
  DataSource,
  DataSourceType,
  FastData,
  SlowData,
  ProcessData,
  TraceData,
  RemoteConfig,
  DirEntry,
  SocketStatItem,
  SocketQueueItem,
  ProcessInfo,
  MemoryInfo,
  CpuInfo,
  DiskInfo,
  SocketSummary,
  SocketConnection,
  TraceEvent,
} from '../types/data-source';

// ---------------------------------------------------------------------------
// Field mapping helpers (server snake_case → client camelCase)
// ---------------------------------------------------------------------------

function toMemoryInfo(raw: any): MemoryInfo {
  return {
    total: raw.total,
    available: raw.available,
    used: raw.used,
    free: raw.free,
    usagePercent: raw.usage_percent,
  };
}

function toCpuInfo(raw: any): CpuInfo {
  return {
    physicalCores: raw.physical_cores,
    logicalCores: raw.logical_cores,
    modelName: raw.model_name,
    vendor: raw.vendor,
    frequencyMhz: raw.frequency_mhz,
  };
}

function toDiskInfo(raw: any): DiskInfo {
  return {
    device: raw.device,
    mountPoint: raw.mount_point,
    fsType: raw.fs_type,
    totalBytes: raw.total_bytes,
    usedBytes: raw.used_bytes,
    availableBytes: raw.available_bytes,
    usagePercent: raw.usage_percent,
  };
}

function toSocketSummary(raw: any): SocketSummary {
  return {
    total: raw.total,
    established: raw.established,
    listen: raw.listen,
    timeWait: raw.time_wait,
    closeWait: raw.close_wait,
  };
}

function toProcessInfo(raw: any): ProcessInfo {
  const cmdline: string[] = Array.isArray(raw.cmdline) ? raw.cmdline : [];
  return {
    pid: raw.pid,
    name: raw.name,
    command: cmdline.length > 0 ? cmdline.join(' ') : raw.exe_path || '',
    status: raw.state || 'Unknown',
    memoryUsage: raw.memory_bytes || 0,
  };
}

function toSocketConnection(raw: any): SocketConnection {
  return {
    protocol: raw.protocol || 'tcp',
    localAddr: raw.local_addr || '',
    remoteAddr: raw.remote_addr || '',
    state: raw.state || '',
    pid: raw.pid ?? 0,
    inode: raw.inode ?? 0,
  };
}

function toDirEntry(raw: any): DirEntry {
  return {
    name: raw.name,
    path: raw.path,
    isDir: raw.is_dir,
    size: raw.size ?? 0,
  };
}

function toSocketStatItem(raw: any): SocketStatItem {
  return {
    pid: raw.pid,
    fd: raw.fd,
    protocol: raw.protocol,
    localAddr: raw.local_addr,
    remoteAddr: raw.remote_addr,
    bytesSent: raw.bytes_sent,
    bytesReceived: raw.bytes_received,
  };
}

function toSocketQueueItem(raw: any): SocketQueueItem {
  return {
    pid: raw.pid,
    fd: raw.fd,
    protocol: raw.protocol,
    localAddr: raw.local_addr,
    remoteAddr: raw.remote_addr,
    state: raw.state,
    recvQueueBytes: raw.recv_queue_bytes,
    recvQueueHiwat: raw.recv_queue_hiwat,
    sendQueueBytes: raw.send_queue_bytes,
    sendQueueHiwat: raw.send_queue_hiwat,
  };
}

// ---------------------------------------------------------------------------
// RemoteSource — fetches data from a query_system_info server via HTTP/SSE
// ---------------------------------------------------------------------------

export class RemoteSource implements DataSource {
  readonly type: DataSourceType = 'remote';

  private config: RemoteConfig;
  private token: string | null = null;

  // Push callback registries
  private fastCallbacks = new Set<(d: FastData) => void>();
  private slowCallbacks = new Set<(d: SlowData) => void>();
  private processCallbacks = new Set<(d: ProcessData) => void>();
  private traceCallbacks = new Set<(d: TraceData) => void>();

  // Polling timers
  private fastTimer: ReturnType<typeof setInterval> | null = null;
  private slowTimer: ReturnType<typeof setInterval> | null = null;
  private procTimer: ReturnType<typeof setInterval> | null = null;

  // SSE connections
  private traceSseAbort: AbortController | null = null;
  private traceTargetPid: number | null = null;
  private tracePollTimer: ReturnType<typeof setInterval> | null = null;
  private tracePreviousMemory: number | null = null;

  // Cached CPU info (fetched once, reused)
  private cachedCpuInfo: CpuInfo | null = null;

  private connected = false;
  private eventCounter = 0;

  constructor(config: RemoteConfig) {
    this.config = config;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // ---- Auth ----

  private async authenticate(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
        }),
      });
      if (!res.ok) {
        console.error('[RemoteSource] Auth failed:', res.status);
        this.connected = false;
        return false;
      }
      const data = await res.json();
      this.token = data.token;
      this.connected = true;
      console.log('[RemoteSource] Auth OK, token obtained');
      return true;
    } catch (e) {
      console.error('[RemoteSource] Auth error:', e);
      this.connected = false;
      return false;
    }
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  private async apiGet<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.config.serverUrl}${path}`, {
        headers: this.headers,
      });
      if (res.status === 401) {
        console.warn('[RemoteSource] apiGet 401:', path, '- token may be expired');
        this.connected = false;
        return null;
      }
      if (!res.ok) {
        console.warn('[RemoteSource] apiGet', res.status, ':', path);
        return null;
      }
      return res.json();
    } catch (e) {
      console.warn('[RemoteSource] apiGet error:', path, e);
      return null;
    }
  }

  // ---- Push subscriptions ----

  onFastData(cb: (d: FastData) => void): () => void {
    this.fastCallbacks.add(cb);
    if (this.fastCallbacks.size === 1 && this.connected) this.startFastPolling();
    return () => {
      this.fastCallbacks.delete(cb);
      if (this.fastCallbacks.size === 0) this.stopFastPolling();
    };
  }

  onSlowData(cb: (d: SlowData) => void): () => void {
    this.slowCallbacks.add(cb);
    if (this.slowCallbacks.size === 1 && this.connected) this.startSlowPolling();
    return () => {
      this.slowCallbacks.delete(cb);
      if (this.slowCallbacks.size === 0) this.stopSlowPolling();
    };
  }

  onProcessData(cb: (d: ProcessData) => void): () => void {
    this.processCallbacks.add(cb);
    if (this.processCallbacks.size === 1 && this.connected) this.startProcessPolling();
    return () => {
      this.processCallbacks.delete(cb);
      if (this.processCallbacks.size === 0) this.stopProcessPolling();
    };
  }

  onTraceData(cb: (d: TraceData) => void): () => void {
    this.traceCallbacks.add(cb);
    return () => {
      this.traceCallbacks.delete(cb);
    };
  }

  // ---- Fast polling (memory + cpu info + cpu usage via SSE) ----

  private startFastPolling(): void {
    this.fetchFast();
    this.fastTimer = setInterval(() => this.fetchFast(), 1500);
    this.connectCpuSse();
  }

  private stopFastPolling(): void {
    if (this.fastTimer) { clearInterval(this.fastTimer); this.fastTimer = null; }
    this.disconnectCpuSse();
  }

  private latestCpuUsage: number[] = [];
  private cachedMemory: MemoryInfo | null = null;

  private async fetchFast(): Promise<void> {
    const [memRaw, cpuRaw] = await Promise.all([
      this.apiGet<any>('/api/memory'),
      this.apiGet<any>('/api/cpu/info'),
    ]);
    if (!memRaw || !cpuRaw) {
      console.warn('[RemoteSource] fetchFast: missing data', { hasMem: !!memRaw, hasCpu: !!cpuRaw });
      return;
    }

    this.cachedCpuInfo = toCpuInfo(cpuRaw);
    this.cachedMemory = toMemoryInfo(memRaw);
    const data: FastData = {
      memory: this.cachedMemory,
      cpu: this.cachedCpuInfo,
      cpuUsage: this.latestCpuUsage,
    };
    console.log('[RemoteSource] fetchFast emit:', { memUsage: data.memory.usagePercent, cpuCores: data.cpuUsage.length });
    for (const cb of this.fastCallbacks) cb(data);
  }

  // SSE via fetch + ReadableStream (supports Authorization header unlike EventSource)
  private cpuSseAbort: AbortController | null = null;

  private connectCpuSse(): void {
    this.disconnectCpuSse();
    const url = `${this.config.serverUrl}/api/stream/cpu?interval=1000`;
    const abort = new AbortController();
    this.cpuSseAbort = abort;

    console.log('[RemoteSource] Connecting CPU SSE:', url);

    fetch(url, {
      headers: this.headers,
      signal: abort.signal,
    })
      .then((res) => {
        if (!res.ok) {
          console.warn('[RemoteSource] CPU SSE HTTP error:', res.status);
          return;
        }
        if (!res.body) {
          console.warn('[RemoteSource] CPU SSE: no response body');
          return;
        }
        console.log('[RemoteSource] CPU SSE connected');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const read = () => {
          if (abort.signal.aborted) return;
          reader.read().then(({ done, value }) => {
            if (done) {
              console.log('[RemoteSource] CPU SSE stream ended');
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let currentEvent = '';
            for (const line of lines) {
              if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim();
              } else if (line.startsWith('data:') && currentEvent === 'cpu_usage') {
                const dataStr = line.slice(5).trim();
                try {
                  const usage: number[] = JSON.parse(dataStr);
                  if (Array.isArray(usage)) {
                    this.latestCpuUsage = usage;
                    // Immediately push to callbacks
                    if (this.cachedCpuInfo && this.fastCallbacks.size > 0) {
                      const fastData: FastData = {
                        memory: this.cachedMemory || ({} as any),
                        cpu: this.cachedCpuInfo,
                        cpuUsage: usage,
                      };
                      for (const cb of this.fastCallbacks) cb(fastData);
                    }
                  }
                } catch (e) {
                  console.warn('[RemoteSource] CPU SSE parse error:', dataStr);
                }
                currentEvent = '';
              } else if (line.startsWith('data:') && currentEvent === 'error') {
                console.warn('[RemoteSource] CPU SSE error event:', line.slice(5).trim());
                currentEvent = '';
              }
            }
            read();
          }).catch((e) => {
            if (!abort.signal.aborted) {
              console.error('[RemoteSource] CPU SSE read error:', e);
            }
          });
        };
        read();
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          console.error('[RemoteSource] CPU SSE fetch error:', e);
        }
      });
  }

  private disconnectCpuSse(): void {
    if (this.cpuSseAbort) {
      this.cpuSseAbort.abort();
      this.cpuSseAbort = null;
    }
  }

  // ---- Slow polling (disks + sockets + connections) ----

  private startSlowPolling(): void {
    this.fetchSlow();
    this.slowTimer = setInterval(() => this.fetchSlow(), 4000);
  }

  private stopSlowPolling(): void {
    if (this.slowTimer) { clearInterval(this.slowTimer); this.slowTimer = null; }
  }

  private async fetchSlow(): Promise<void> {
    const [disksRaw, socketsRaw, connectionsRaw] = await Promise.all([
      this.apiGet<any[]>('/api/disks'),
      this.apiGet<any>('/api/sockets'),
      this.apiGet<any[]>('/api/connections'),
    ]);
    const data: SlowData = {
      disks: Array.isArray(disksRaw) ? disksRaw.map(toDiskInfo) : [],
      socketSummary: socketsRaw ? toSocketSummary(socketsRaw) : { total: 0, established: 0, listen: 0, timeWait: 0, closeWait: 0 },
      connections: Array.isArray(connectionsRaw) ? connectionsRaw.map(toSocketConnection) : [],
    };
    console.log('[RemoteSource] fetchSlow:', { disks: data.disks.length, sockets: data.socketSummary.total, connections: data.connections.length });
    for (const cb of this.slowCallbacks) cb(data);
  }

  // ---- Process polling ----

  private startProcessPolling(): void {
    this.fetchProcesses();
    this.procTimer = setInterval(() => this.fetchProcesses(), 3000);
  }

  private stopProcessPolling(): void {
    if (this.procTimer) { clearInterval(this.procTimer); this.procTimer = null; }
  }

  private cachedProcesses: ProcessInfo[] = [];

  private async fetchProcesses(): Promise<void> {
    const raw = await this.apiGet<any[]>('/api/processes');
    if (!raw) {
      console.warn('[RemoteSource] fetchProcesses: no data');
      return;
    }
    const allProcesses = raw.map(toProcessInfo);
    this.cachedProcesses = allProcesses;
    const data: ProcessData = {
      processes: allProcesses.slice(0, 200),
      processCount: allProcesses.length,
    };
    console.log('[RemoteSource] fetchProcesses:', { total: data.processCount, shown: data.processes.length });
    for (const cb of this.processCallbacks) cb(data);
  }

  // ---- Actions ----

  async killProcess(pid: number): Promise<{ ok?: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.config.serverUrl}/api/processes/${pid}`, {
        method: 'DELETE',
        headers: this.headers,
      });
      const data = await res.json();
      if (data.success) return { ok: true };
      return { error: data.message || 'Kill failed' };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }

  async searchProcess(
    query: string,
    requestId?: number,
  ): Promise<{ requestId?: number; results?: ProcessInfo[]; error?: string }> {
    const needle = query.trim();
    if (!needle) return { requestId, results: [] };

    const processes = this.cachedProcesses;
    if (/^\d+$/.test(needle)) {
      const results = processes.filter((p) => p.pid.toString().includes(needle));
      return { requestId, results };
    }
    try {
      const regex = new RegExp(needle, 'i');
      const results = processes.filter((p) => regex.test(p.name));
      return { requestId, results };
    } catch (e: any) {
      return { requestId, results: [], error: e?.message ?? String(e) };
    }
  }

  async listDir(path: string): Promise<{ entries?: DirEntry[]; error?: string }> {
    try {
      const res = await fetch(
        `${this.config.serverUrl}/api/fs/list?path=${encodeURIComponent(path)}`,
        { headers: this.headers },
      );
      if (!res.ok) {
        const text = await res.text();
        return { error: text };
      }
      const raw = await res.json();
      return { entries: raw.map(toDirEntry) };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }

  startTrace(pid: number): void {
    this.stopTrace();
    this.traceTargetPid = pid;
    this.eventCounter = 0;

    // Emit reset
    for (const cb of this.traceCallbacks) {
      cb({ events: [], reset: true, targetPid: pid });
    }

    // Emit "tracking started"
    this.eventCounter++;
    for (const cb of this.traceCallbacks) {
      cb({
        events: [{
          id: `evt_${String(this.eventCounter).padStart(3, '0')}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          process: 'System',
          pid,
          type: 'spawn',
          summary: 'Tracking started',
          severity: 'low',
          delta: '0',
          durationMs: 0,
        }],
        targetPid: pid,
      });
    }

    // Connect SSE for child process / socket events (via fetch for auth header support)
    const url = `${this.config.serverUrl}/api/stream/process/${pid}?stream_type=all`;
    const abort = new AbortController();
    this.traceSseAbort = abort;

    console.log('[RemoteSource] Connecting trace SSE:', url);

    fetch(url, { headers: this.headers, signal: abort.signal })
      .then((res) => {
        if (!res.ok) {
          console.warn('[RemoteSource] Trace SSE HTTP error:', res.status);
          return;
        }
        if (!res.body) return;
        console.log('[RemoteSource] Trace SSE connected for PID', pid);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const read = () => {
          if (abort.signal.aborted) return;
          reader.read().then(({ done, value }) => {
            if (done) { console.log('[RemoteSource] Trace SSE stream ended'); return; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let currentEvent = '';
            for (const line of lines) {
              if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                const dataStr = line.slice(5).trim();
                if (currentEvent === 'child_process') {
                  try {
                    const raw = JSON.parse(dataStr);
                    this.eventCounter++;
                    const cmdline: string[] = Array.isArray(raw.cmdline) ? raw.cmdline : [];
                    const command = cmdline.length > 0 ? cmdline.join(' ') : raw.exe_path || '';
                    const traceEvent: TraceEvent = {
                      id: `evt_${String(this.eventCounter).padStart(3, '0')}`,
                      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                      process: raw.name || command || 'Unknown',
                      pid: raw.pid || 0,
                      command: command || undefined,
                      type: 'spawn',
                      summary: 'Child process spawned',
                      severity: 'medium',
                      delta: '+1 child',
                      durationMs: Math.floor(Math.random() * 200) + 80,
                    };
                    for (const cb of this.traceCallbacks) {
                      cb({ events: [traceEvent], targetPid: this.traceTargetPid });
                    }
                  } catch { /* ignore parse errors */ }
                } else if (currentEvent === 'socket_connection') {
                  try {
                    const raw = JSON.parse(dataStr);
                    this.eventCounter++;
                    const protocol = raw.protocol ? String(raw.protocol).toUpperCase() : 'SOCKET';
                    const local = raw.local_addr || '';
                    const remote = raw.remote_addr || '';
                    const state = raw.state || '';
                    const detailParts = [local, remote ? `-> ${remote}` : '', state].filter(Boolean);
                    const traceEvent: TraceEvent = {
                      id: `evt_${String(this.eventCounter).padStart(3, '0')}`,
                      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                      process: 'Socket',
                      pid: raw.pid || this.traceTargetPid || 0,
                      type: 'network',
                      summary: `${protocol} socket activity`,
                      severity: 'low',
                      delta: 'socket',
                      durationMs: Math.floor(Math.random() * 240) + 60,
                      details: detailParts.join(' · '),
                    };
                    for (const cb of this.traceCallbacks) {
                      cb({ events: [traceEvent], targetPid: this.traceTargetPid });
                    }
                  } catch { /* ignore parse errors */ }
                } else if (currentEvent === 'warning') {
                  console.warn('[RemoteSource] Trace SSE warning:', dataStr);
                } else if (currentEvent === 'end') {
                  console.log('[RemoteSource] Trace SSE ended:', dataStr);
                } else if (currentEvent === 'trace_sample') {
                  try {
                    const sample = JSON.parse(dataStr);
                    if (sample.process_terminated !== null && sample.process_terminated !== undefined) {
                      const deadPid = sample.process_terminated;
                      console.log('[RemoteSource] Process', deadPid, 'terminated, stopping trace');
                      this.stopTracePoll();
                      this.traceTargetPid = null;
                      this.traceSseAbort?.abort();
                      this.traceSseAbort = null;
                      for (const cb of this.traceCallbacks) {
                        cb({
                          events: [{
                            id: `evt_${String(++this.eventCounter).padStart(3, '0')}`,
                            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                            process: 'System',
                            pid: deadPid,
                            type: 'spawn',
                            summary: `Process ${deadPid} terminated`,
                            severity: 'high',
                            delta: 'killed',
                            durationMs: 0,
                          }],
                          targetPid: null,
                        });
                      }
                    }
                  } catch { /* ignore parse errors */ }
                }
                currentEvent = '';
              }
            }
            read();
          }).catch((e) => {
            if (!abort.signal.aborted) console.error('[RemoteSource] Trace SSE read error:', e);
          });
        };
        read();
      })
      .catch((e) => {
        if (!abort.signal.aborted) console.error('[RemoteSource] Trace SSE fetch error:', e);
      });

    // Poll process details (memory/cpu/io) every 3s — mirrors local worker pushProcesses
    this.tracePreviousMemory = null;
    this.stopTracePoll();
    let pollNotFoundCount = 0;
    const poll = () => {
      if (this.traceTargetPid === null) return;
      const p = this.traceTargetPid;
      Promise.all([
        this.apiGet<any>(`/api/processes/${p}`),
        this.apiGet<any>(`/api/processes/${p}/io`),
        this.apiGet<any>(`/api/processes/${p}/cpu-usage`),
      ]).then(([proc, io, cpuResult]) => {
        if (this.traceTargetPid !== p) return;
        if (!proc) {
          pollNotFoundCount++;
          if (pollNotFoundCount >= 2) {
            console.log('[RemoteSource] Poll: process', p, 'not found twice, stopping trace');
            this.stopTracePoll();
            this.traceTargetPid = null;
            this.traceSseAbort?.abort();
            this.traceSseAbort = null;
            for (const cb of this.traceCallbacks) {
              cb({
                events: [{
                  id: `evt_${String(++this.eventCounter).padStart(3, '0')}`,
                  timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                  process: 'System',
                  pid: p,
                  type: 'spawn',
                  summary: `Process ${p} terminated`,
                  severity: 'high',
                  delta: 'killed',
                  durationMs: 0,
                }],
                targetPid: null,
              });
            }
          }
          return;
        }
        pollNotFoundCount = 0;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const memoryBytes: number = proc.memory_bytes ?? proc.memoryUsage ?? 0;

        // Emit memory change events
        if (this.tracePreviousMemory !== null && this.tracePreviousMemory > 0) {
          const delta = memoryBytes - this.tracePreviousMemory;
          const pct = (delta / this.tracePreviousMemory) * 100;
          if (Math.abs(pct) >= 20) {
            this.eventCounter++;
            const severity: 'low' | 'medium' | 'high' = Math.abs(pct) > 50 ? 'high' : 'medium';
            const deltaMB = (delta / (1024 * 1024)).toFixed(1);
            for (const cb of this.traceCallbacks) {
              cb({
                events: [{
                  id: `evt_${String(this.eventCounter).padStart(3, '0')}`,
                  timestamp,
                  process: proc.name || 'Unknown',
                  pid: p,
                  type: 'memory',
                  summary: 'Target memory change',
                  severity,
                  delta: `${parseFloat(deltaMB) >= 0 ? '+' : ''}${deltaMB} MB`,
                  durationMs: Math.floor(Math.random() * 500) + 200,
                }],
                targetPid: p,
              });
            }
          }
        }
        this.tracePreviousMemory = memoryBytes;

        const traceData: any = { events: [], targetPid: p, memorySample: { pid: p, timestamp, memoryBytes } };

        // CPU sample from dedicated endpoint (real per-process CPU usage)
        const cpuPercent = cpuResult?.cpu_percent ?? 0;
        traceData.cpuSample = { pid: p, timestamp, cpuPercent };

        // IO sample
        if (io && typeof io.read_bytes === 'number') {
          traceData.ioSample = { pid: p, timestamp, readBytes: io.read_bytes, writeBytes: io.write_bytes };
        }

        for (const cb of this.traceCallbacks) cb(traceData);
      }).catch(() => { /* ignore */ });
    };
    poll();
    this.tracePollTimer = setInterval(poll, 3000);
  }

  stopTrace(): void {
    if (this.traceSseAbort) {
      this.traceSseAbort.abort();
      this.traceSseAbort = null;
    }
    this.stopTracePoll();
    this.traceTargetPid = null;
    for (const cb of this.traceCallbacks) {
      cb({ events: [], targetPid: null });
    }
  }

  private stopTracePoll(): void {
    if (this.tracePollTimer) {
      clearInterval(this.tracePollTimer);
      this.tracePollTimer = null;
    }
    this.tracePreviousMemory = null;
  }

  async getProcessSocketStats(pid: number): Promise<SocketStatItem[]> {
    const raw = await this.apiGet<any[]>(`/api/processes/${pid}/socket-stats`);
    if (!raw) return [];
    return raw.map(toSocketStatItem);
  }

  async getProcessSocketQueues(pid: number): Promise<SocketQueueItem[]> {
    const raw = await this.apiGet<any[]>(`/api/processes/${pid}/socket-queues`);
    if (!raw) return [];
    return raw.map(toSocketQueueItem);
  }

  async getProcessCpuUsage(pid: number, _sampleSecs?: number): Promise<number> {
    const result = await this.apiGet<any>(`/api/processes/${pid}/cpu-usage`);
    if (!result) return 0;
    return result.cpu_percent ?? 0;
  }

  // ---- Lifecycle ----

  async init(): Promise<boolean> {
    const ok = await this.authenticate();
    if (ok) {
      // Start polling for any callbacks registered before auth completed
      this.startPollingIfNeeded();
    }
    return ok;
  }

  /** Start any polling that has registered callbacks but isn't running yet */
  private startPollingIfNeeded(): void {
    if (this.fastCallbacks.size > 0 && !this.fastTimer) this.startFastPolling();
    if (this.slowCallbacks.size > 0 && !this.slowTimer) this.startSlowPolling();
    if (this.processCallbacks.size > 0 && !this.procTimer) this.startProcessPolling();
  }

  destroy(): void {
    this.stopFastPolling();
    this.stopSlowPolling();
    this.stopProcessPolling();
    this.stopTrace();
    this.fastCallbacks.clear();
    this.slowCallbacks.clear();
    this.processCallbacks.clear();
    this.traceCallbacks.clear();
    this.connected = false;
    this.token = null;
  }
}
