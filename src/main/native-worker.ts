import fs from 'fs';
import path from 'path';
import { parentPort } from 'worker_threads';

type PushMessage = {
  channel: 'data:fast' | 'data:slow' | 'data:processes' | 'data:trace' | 'data:process-search';
  payload: unknown;
};

let sysInfoModule: any = null;
let fastTimer: ReturnType<typeof setInterval> | null = null;
let slowTimer: ReturnType<typeof setInterval> | null = null;
let procTimer: ReturnType<typeof setInterval> | null = null;
let searchRequestCounter = 0;

const CPU_SAMPLE_SECS = 500;

interface TraceEvent {
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
  details?: string;
}

interface TraceMemorySample {
  pid: number;
  timestamp: string;
  memoryBytes: number;
}

interface ProcessSnapshot {
  pid: number;
  name: string;
  memoryUsage: number;
}

let eventCounter = 0;
let childTracker: any = null;
let socketTracker: any = null;
let trackedPid: number | null = null;
let previousTrackedProcess: ProcessSnapshot | null = null;
let missingTargetReported = false;


function startChildTracking(pid: number) {
  if (!sysInfoModule) return;
  if (childTracker) {
    try {
      childTracker.stop();
    } catch (e) {
      console.warn('worker stop tracker error:', e);
    }
  }
  if (socketTracker) {
    try {
      socketTracker.stop();
    } catch (e) {
      console.warn('worker stop socket tracker error:', e);
    }
  }

  trackedPid = pid;
  eventCounter = 0;
  previousTrackedProcess = null;
  missingTargetReported = false;
  

  const startFn = sysInfoModule.startTrackingChildren || sysInfoModule.start_tracking_children;
  const startSocketFn = sysInfoModule.startTrackingSockets || sysInfoModule.start_tracking_sockets;
  if (typeof startFn !== 'function') {
    eventCounter++;
    emit('data:trace', {
      events: [
        {
          id: `evt_${String(eventCounter).padStart(3, '0')}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          process: 'System',
          pid,
          type: 'spawn',
          summary: 'Tracking API unavailable',
          severity: 'high',
          delta: '0',
          durationMs: 0,
        },
      ],
      targetPid: trackedPid,
    });
    return;
  }

  try {
    emit('data:trace', {
      events: [],
      reset: true,
      targetPid: trackedPid,
    });

    eventCounter++;
    emit('data:trace', {
      events: [
        {
          id: `evt_${String(eventCounter).padStart(3, '0')}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          process: 'System',
          pid,
          type: 'spawn',
          summary: 'Tracking started',
          severity: 'low',
          delta: '0',
          durationMs: 0,
        },
      ],
      targetPid: trackedPid,
    });

    childTracker = startFn(pid, (...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      const payload = args.length > 1 ? (args[1] ?? args[0]) : args[0];
      const event = payload?.value ?? payload;
      if (!event) return;

      eventCounter++;
      const rawPid = typeof event?.pid === 'number' ? event.pid : Number(event?.pid);
      const safePid = Number.isFinite(rawPid) ? rawPid : 0;
      const cmdline = Array.isArray(event?.cmdline)
        ? event.cmdline
        : Array.isArray(event?.cmdLine)
          ? event.cmdLine
          : typeof event?.cmdline === 'string'
            ? event.cmdline.split(' ')
            : [];
      const exePath = event?.exe_path || event?.exePath || '';
      let command = cmdline.length > 0 ? cmdline.join(' ') : exePath;
      let safeName = event?.name ? String(event.name) : '';

      if (safePid > 0 && (!safeName || !command)) {
        const getProc = sysInfoModule.getProcessByPid || sysInfoModule.get_process_by_pid;
        if (typeof getProc === 'function') {
          try {
            const proc = getProc(safePid);
            if (proc) {
              safeName = safeName || proc.name || '';
              command = command || proc.command || '';
            }
          } catch (e) {
            console.warn('worker getProcessByPid error:', e);
          }
        }
      }

      if (!safeName) safeName = command || 'Unknown';

      const traceEvent: TraceEvent = {
        id: `evt_${String(eventCounter).padStart(3, '0')}`,
        timestamp,
        process: safeName,
        pid: safePid,
        command: command || undefined,
        type: 'spawn',
        summary: 'Child process spawned',
        severity: 'medium',
        delta: '+1 child',
        durationMs: Math.floor(Math.random() * 200) + 80,
      };

      emit('data:trace', {
        events: [traceEvent],
        targetPid: trackedPid,
      });
    });

    if (typeof startSocketFn === 'function') {
      socketTracker = startSocketFn(pid, (...args: any[]) => {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const payload = args.length > 1 ? (args[1] ?? args[0]) : args[0];
        const event = payload?.value ?? payload;
        if (!event) return;

        eventCounter++;
        const safePid = typeof event?.pid === 'number' ? event.pid : Number(event?.pid) || pid;
        const protocol = event?.protocol ? String(event.protocol).toUpperCase() : 'SOCKET';
        const local = event?.local_addr || event?.localAddr || '';
        const remote = event?.remote_addr || event?.remoteAddr || '';
        const state = event?.state ? String(event.state) : '';
        const detailParts = [local, remote ? `-> ${remote}` : '', state].filter(Boolean);

        const traceEvent: TraceEvent = {
          id: `evt_${String(eventCounter).padStart(3, '0')}`,
          timestamp,
          process: 'Socket',
          pid: safePid,
          type: 'network',
          summary: `${protocol} socket activity`,
          severity: 'low',
          delta: 'socket',
          durationMs: Math.floor(Math.random() * 240) + 60,
          details: detailParts.join(' · '),
        };

        emit('data:trace', {
          events: [traceEvent],
          targetPid: trackedPid,
        });
      });
    }

  } catch (e) {
    console.error('worker start tracking error:', e);
    eventCounter++;
    emit('data:trace', {
      events: [
        {
          id: `evt_${String(eventCounter).padStart(3, '0')}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          process: 'System',
          pid,
          type: 'spawn',
          summary: 'Tracking failed to start',
          severity: 'high',
          delta: '0',
          durationMs: 0,
        },
      ],
      targetPid: trackedPid,
    });
  }
}

function stopChildTracking() {
  if (childTracker) {
    try {
      childTracker.stop();
    } catch (e) {
      console.warn('worker stop tracker error:', e);
    }
  }
  if (socketTracker) {
    try {
      socketTracker.stop();
    } catch (e) {
      console.warn('worker stop socket tracker error:', e);
    }
  }
  childTracker = null;
  socketTracker = null;
  trackedPid = null;
  previousTrackedProcess = null;
  missingTargetReported = false;
  emit('data:trace', {
    events: [],
    targetPid: null,
  });
}
function getNativeModuleName(): string {
  const platformMap: Record<string, string> = { darwin: 'darwin', linux: 'linux', win32: 'win32' };
  const archMap: Record<string, string> = { x64: 'x64', arm64: 'arm64', ia32: 'ia32' };
  const plat = platformMap[process.platform] || process.platform;
  const arc = archMap[process.arch] || process.arch;
  // Windows uses MSVC toolchain by default, so NAPI-RS appends -msvc to the filename
  const toolchainSuffix = process.platform === 'win32' ? '-msvc' : '';
  return `index.${plat}-${arc}${toolchainSuffix}.node`;
}

function loadNativeModule(): boolean {
  if (sysInfoModule) return true;

  const moduleName = getNativeModuleName();
  const isDev = process.env.VITE_DEV_SERVER_URL;
  const devPaths = [
    path.join(__dirname, '../../', moduleName),
    path.join(__dirname, '../', moduleName),
  ];
  const prodPaths = [path.join(process.resourcesPath, 'native', moduleName)];
  const searchPaths = isDev ? devPaths : prodPaths;
  searchPaths.push(
    path.join(__dirname, '../../query_system_info/dist', moduleName),
    path.join(__dirname, '../../../query_system_info/dist', moduleName),
  );

  for (const modulePath of searchPaths) {
    try {
      if (fs.existsSync(modulePath)) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        sysInfoModule = require(modulePath);
        return true;
      }
    } catch (e) {
      console.warn(`Worker failed to load native module from ${modulePath}:`, e);
    }
  }

  console.error('Worker native module not found. Searched:', searchPaths);
  return false;
}

function emit(channel: PushMessage['channel'], payload: unknown) {
  parentPort?.postMessage({ channel, payload } satisfies PushMessage);
}

function pushFast() {
  if (!sysInfoModule) return;
  try {
    const summary = new sysInfoModule.JsSystemSummary(CPU_SAMPLE_SECS);
    emit('data:fast', {
      memory: summary.getMemoryInfo(),
      cpu: summary.getCpuInfo(),
      cpuUsage: summary.getCpuUsage(),
    });
  } catch (e) {
    console.error('worker pushFast error:', e);
  }
}

function pushSlow() {
  if (!sysInfoModule) return;
  try {
    emit('data:slow', {
      disks: sysInfoModule.jsGetDisks(),
      socketSummary: sysInfoModule.jsGetSocketSummary(),
      connections: sysInfoModule.getConnections().slice(0, 50),
    });
  } catch (e) {
    console.error('worker pushSlow error:', e);
  }
}

function pushProcesses() {
  if (!sysInfoModule) return;
  try {
    const allProcesses = sysInfoModule.getProcesses().map(normalizeProcess);
    const processes = allProcesses.slice(0, 200);
    emit('data:processes', {
      processes,
      processCount: allProcesses.length,
    });

    if (trackedPid !== null) {
      const target = allProcesses.find((p: any) => p.pid === trackedPid);
      if (!target) {
        if (!missingTargetReported) {
          missingTargetReported = true;
          eventCounter++;
          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          emit('data:trace', {
            events: [
              {
                id: `evt_${String(eventCounter).padStart(3, '0')}`,
                timestamp,
                process: 'Unknown',
                pid: trackedPid,
                type: 'spawn',
                summary: 'Target process not found',
                severity: 'high',
                delta: '0',
                durationMs: 0,
              },
            ],
            targetPid: trackedPid,
          });
        }
      } else {
        missingTargetReported = false;
        const snapshot: ProcessSnapshot = {
          pid: target.pid,
          name: target.name,
          memoryUsage: target.memoryUsage,
        };

        if (previousTrackedProcess) {
          const memoryDelta = snapshot.memoryUsage - previousTrackedProcess.memoryUsage;
          const memoryDeltaPercent = previousTrackedProcess.memoryUsage > 0
            ? (memoryDelta / previousTrackedProcess.memoryUsage) * 100
            : 0;
          if (Math.abs(memoryDeltaPercent) >= 20) {
            eventCounter++;
            const severity: TraceEvent['severity'] = Math.abs(memoryDeltaPercent) > 50
              ? 'high'
              : 'medium';
            const deltaMB = (memoryDelta / (1024 * 1024)).toFixed(1);
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
            emit('data:trace', {
              events: [
                {
                  id: `evt_${String(eventCounter).padStart(3, '0')}`,
                  timestamp,
                  process: snapshot.name,
                  pid: snapshot.pid,
                  type: 'memory',
                  summary: 'Target memory change',
                  severity,
                  delta: `${parseFloat(deltaMB) >= 0 ? '+' : ''}${deltaMB} MB`,
                  durationMs: Math.floor(Math.random() * 500) + 200,
                },
              ],
              targetPid: trackedPid,
            });
          }
        }

        previousTrackedProcess = snapshot;

        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const memorySample: TraceMemorySample = {
          pid: snapshot.pid,
          timestamp,
          memoryBytes: snapshot.memoryUsage,
        };
        emit('data:trace', {
          events: [],
          targetPid: trackedPid,
          memorySample,
        });
      }
    }
  } catch (e) {
    console.error('worker pushProcesses error:', e);
  }
}

function normalizeProcess(process: any) {
  return {
    ...process,
    memoryUsage:
      typeof process.memoryUsage === 'number'
        ? process.memoryUsage
        : typeof process.memory_usage === 'number'
          ? process.memory_usage
          : 0,
  };
}

function searchProcesses(query: string) {
  if (!sysInfoModule) return { results: [], error: 'Native module not loaded' };
  const needle = query.trim();
  if (!needle) return { results: [] };

  const processes = sysInfoModule.getProcesses().map(normalizeProcess);
  if (/^\d+$/.test(needle)) {
    const pid = Number(needle);
    const results = processes.filter((process: any) => process.pid === pid);
    return { results };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(needle, 'i');
  } catch (e: any) {
    return { results: [], error: e?.message ?? String(e) };
  }

  const results = processes.filter((process: any) => regex.test(String(process.name || '')));
  return { results };
}

function startDataTimers() {
  stopDataTimers();
  pushFast();
  setTimeout(() => {
    pushSlow();
    slowTimer = setInterval(pushSlow, 4000);
  }, 500);
  setTimeout(() => {
    pushProcesses();
    procTimer = setInterval(pushProcesses, 3000);
  }, 1000);
  fastTimer = setInterval(pushFast, 1500);
}

function stopDataTimers() {
  if (fastTimer) clearInterval(fastTimer);
  if (slowTimer) clearInterval(slowTimer);
  if (procTimer) clearInterval(procTimer);
  fastTimer = null;
  slowTimer = null;
  procTimer = null;
}

parentPort?.on('message', (msg: { type: 'start' | 'stop' | 'trace:start' | 'trace:stop' | 'process:search'; pid?: number; query?: string; requestId?: number }) => {
  if (msg.type === 'start') {
    if (loadNativeModule()) startDataTimers();
    return;
  }
  if (msg.type === 'stop') {
    stopDataTimers();
    stopChildTracking();
  }
  if (msg.type === 'trace:start') {
    if (typeof msg.pid === 'number' && Number.isFinite(msg.pid)) {
      startChildTracking(msg.pid);
    }
    return;
  }
  if (msg.type === 'trace:stop') {
    stopChildTracking();
  }
  if (msg.type === 'process:search') {
    const requestId = typeof msg.requestId === 'number' ? msg.requestId : searchRequestCounter++;
    const { results, error } = searchProcesses(msg.query ?? '');
    emit('data:process-search', { requestId, results, error });
  }
});
