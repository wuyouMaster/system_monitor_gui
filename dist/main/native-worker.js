"use strict";
var _a;
const fs = require("fs");
const path = require("path");
const worker_threads = require("worker_threads");
let sysInfoModule = null;
let fastTimer = null;
let slowTimer = null;
let procTimer = null;
let searchRequestCounter = 0;
const CPU_SAMPLE_SECS = 500;
let eventCounter = 0;
let childTracker = null;
let socketTracker = null;
let trackedPid = null;
let previousTrackedProcess = null;
let missingTargetReported = false;
function startChildTracking(pid) {
  if (!sysInfoModule) return;
  if (childTracker) {
    try {
      childTracker.stop();
    } catch (e) {
      console.warn("worker stop tracker error:", e);
    }
  }
  if (socketTracker) {
    try {
      socketTracker.stop();
    } catch (e) {
      console.warn("worker stop socket tracker error:", e);
    }
  }
  trackedPid = pid;
  eventCounter = 0;
  previousTrackedProcess = null;
  missingTargetReported = false;
  const startFn = sysInfoModule.startTrackingChildren || sysInfoModule.start_tracking_children;
  const startSocketFn = sysInfoModule.startTrackingSockets || sysInfoModule.start_tracking_sockets;
  if (typeof startFn !== "function") {
    eventCounter++;
    emit("data:trace", {
      events: [
        {
          id: `evt_${String(eventCounter).padStart(3, "0")}`,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false }),
          process: "System",
          pid,
          type: "spawn",
          summary: "Tracking API unavailable",
          severity: "high",
          delta: "0",
          durationMs: 0
        }
      ],
      targetPid: trackedPid
    });
    return;
  }
  try {
    emit("data:trace", {
      events: [],
      reset: true,
      targetPid: trackedPid
    });
    eventCounter++;
    emit("data:trace", {
      events: [
        {
          id: `evt_${String(eventCounter).padStart(3, "0")}`,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false }),
          process: "System",
          pid,
          type: "spawn",
          summary: "Tracking started",
          severity: "low",
          delta: "0",
          durationMs: 0
        }
      ],
      targetPid: trackedPid
    });
    childTracker = startFn(pid, (...args) => {
      const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false });
      const payload = args.length > 1 ? args[1] ?? args[0] : args[0];
      const event = (payload == null ? void 0 : payload.value) ?? payload;
      if (!event) return;
      eventCounter++;
      const rawPid = typeof (event == null ? void 0 : event.pid) === "number" ? event.pid : Number(event == null ? void 0 : event.pid);
      const safePid = Number.isFinite(rawPid) ? rawPid : 0;
      const cmdline = Array.isArray(event == null ? void 0 : event.cmdline) ? event.cmdline : Array.isArray(event == null ? void 0 : event.cmdLine) ? event.cmdLine : typeof (event == null ? void 0 : event.cmdline) === "string" ? event.cmdline.split(" ") : [];
      const exePath = (event == null ? void 0 : event.exe_path) || (event == null ? void 0 : event.exePath) || "";
      let command = cmdline.length > 0 ? cmdline.join(" ") : exePath;
      let safeName = (event == null ? void 0 : event.name) ? String(event.name) : "";
      if (safePid > 0 && (!safeName || !command)) {
        const getProc = sysInfoModule.getProcessByPid || sysInfoModule.get_process_by_pid;
        if (typeof getProc === "function") {
          try {
            const proc = getProc(safePid);
            if (proc) {
              safeName = safeName || proc.name || "";
              command = command || proc.command || "";
            }
          } catch (e) {
            console.warn("worker getProcessByPid error:", e);
          }
        }
      }
      if (!safeName) safeName = command || "Unknown";
      const traceEvent = {
        id: `evt_${String(eventCounter).padStart(3, "0")}`,
        timestamp,
        process: safeName,
        pid: safePid,
        command: command || void 0,
        type: "spawn",
        summary: "Child process spawned",
        severity: "medium",
        delta: "+1 child",
        durationMs: Math.floor(Math.random() * 200) + 80
      };
      emit("data:trace", {
        events: [traceEvent],
        targetPid: trackedPid
      });
    });
    if (typeof startSocketFn === "function") {
      socketTracker = startSocketFn(pid, (...args) => {
        const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false });
        const payload = args.length > 1 ? args[1] ?? args[0] : args[0];
        const event = (payload == null ? void 0 : payload.value) ?? payload;
        if (!event) return;
        eventCounter++;
        const safePid = typeof (event == null ? void 0 : event.pid) === "number" ? event.pid : Number(event == null ? void 0 : event.pid) || pid;
        const protocol = (event == null ? void 0 : event.protocol) ? String(event.protocol).toUpperCase() : "SOCKET";
        const local = (event == null ? void 0 : event.local_addr) || (event == null ? void 0 : event.localAddr) || "";
        const remote = (event == null ? void 0 : event.remote_addr) || (event == null ? void 0 : event.remoteAddr) || "";
        const state = (event == null ? void 0 : event.state) ? String(event.state) : "";
        const detailParts = [local, remote ? `-> ${remote}` : "", state].filter(Boolean);
        const traceEvent = {
          id: `evt_${String(eventCounter).padStart(3, "0")}`,
          timestamp,
          process: "Socket",
          pid: safePid,
          type: "network",
          summary: `${protocol} socket activity`,
          severity: "low",
          delta: "socket",
          durationMs: Math.floor(Math.random() * 240) + 60,
          details: detailParts.join(" · ")
        };
        emit("data:trace", {
          events: [traceEvent],
          targetPid: trackedPid
        });
      });
    }
  } catch (e) {
    console.error("worker start tracking error:", e);
    eventCounter++;
    emit("data:trace", {
      events: [
        {
          id: `evt_${String(eventCounter).padStart(3, "0")}`,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false }),
          process: "System",
          pid,
          type: "spawn",
          summary: "Tracking failed to start",
          severity: "high",
          delta: "0",
          durationMs: 0
        }
      ],
      targetPid: trackedPid
    });
  }
}
function stopChildTracking() {
  if (childTracker) {
    try {
      childTracker.stop();
    } catch (e) {
      console.warn("worker stop tracker error:", e);
    }
  }
  if (socketTracker) {
    try {
      socketTracker.stop();
    } catch (e) {
      console.warn("worker stop socket tracker error:", e);
    }
  }
  childTracker = null;
  socketTracker = null;
  trackedPid = null;
  previousTrackedProcess = null;
  missingTargetReported = false;
  emit("data:trace", {
    events: [],
    targetPid: null
  });
}
function getNativeModuleName() {
  const platformMap = { darwin: "darwin", linux: "linux", win32: "win32" };
  const archMap = { x64: "x64", arm64: "arm64", ia32: "ia32" };
  const plat = platformMap[process.platform] || process.platform;
  const arc = archMap[process.arch] || process.arch;
  const toolchainSuffix = process.platform === "win32" ? "-msvc" : "";
  return `index.${plat}-${arc}${toolchainSuffix}.node`;
}
function loadNativeModule() {
  if (sysInfoModule) return true;
  const moduleName = getNativeModuleName();
  const isDev = process.env.VITE_DEV_SERVER_URL;
  const devPaths = [
    path.join(__dirname, "../../", moduleName),
    path.join(__dirname, "../", moduleName)
  ];
  const prodPaths = [path.join(process.resourcesPath, "native", moduleName)];
  const searchPaths = isDev ? devPaths : prodPaths;
  searchPaths.push(
    path.join(__dirname, "../../query_system_info/dist", moduleName),
    path.join(__dirname, "../../../query_system_info/dist", moduleName)
  );
  for (const modulePath of searchPaths) {
    try {
      if (fs.existsSync(modulePath)) {
        sysInfoModule = require(modulePath);
        return true;
      }
    } catch (e) {
      console.warn(`Worker failed to load native module from ${modulePath}:`, e);
    }
  }
  console.error("Worker native module not found. Searched:", searchPaths);
  return false;
}
function emit(channel, payload) {
  var _a2;
  (_a2 = worker_threads.parentPort) == null ? void 0 : _a2.postMessage({ channel, payload });
}
function pushFast() {
  if (!sysInfoModule) return;
  try {
    const summary = new sysInfoModule.JsSystemSummary(CPU_SAMPLE_SECS);
    emit("data:fast", {
      memory: summary.getMemoryInfo(),
      cpu: summary.getCpuInfo(),
      cpuUsage: summary.getCpuUsage()
    });
  } catch (e) {
    console.error("worker pushFast error:", e);
  }
}
function pushSlow() {
  if (!sysInfoModule) return;
  try {
    emit("data:slow", {
      disks: sysInfoModule.jsGetDisks(),
      socketSummary: sysInfoModule.jsGetSocketSummary(),
      connections: sysInfoModule.getConnections().slice(0, 50)
    });
  } catch (e) {
    console.error("worker pushSlow error:", e);
  }
}
function pushProcesses() {
  if (!sysInfoModule) return;
  try {
    const allProcesses = sysInfoModule.getProcesses().map(normalizeProcess);
    const processes = allProcesses.slice(0, 200);
    emit("data:processes", {
      processes,
      processCount: allProcesses.length
    });
    if (trackedPid !== null) {
      const target = allProcesses.find((p) => p.pid === trackedPid);
      if (!target) {
        if (!missingTargetReported) {
          missingTargetReported = true;
          eventCounter++;
          const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false });
          emit("data:trace", {
            events: [
              {
                id: `evt_${String(eventCounter).padStart(3, "0")}`,
                timestamp,
                process: "Unknown",
                pid: trackedPid,
                type: "spawn",
                summary: "Target process not found",
                severity: "high",
                delta: "0",
                durationMs: 0
              }
            ],
            targetPid: trackedPid
          });
        }
      } else {
        missingTargetReported = false;
        const snapshot = {
          pid: target.pid,
          name: target.name,
          memoryUsage: target.memoryUsage
        };
        if (previousTrackedProcess) {
          const memoryDelta = snapshot.memoryUsage - previousTrackedProcess.memoryUsage;
          const memoryDeltaPercent = previousTrackedProcess.memoryUsage > 0 ? memoryDelta / previousTrackedProcess.memoryUsage * 100 : 0;
          if (Math.abs(memoryDeltaPercent) >= 20) {
            eventCounter++;
            const severity = Math.abs(memoryDeltaPercent) > 50 ? "high" : "medium";
            const deltaMB = (memoryDelta / (1024 * 1024)).toFixed(1);
            const timestamp2 = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false });
            emit("data:trace", {
              events: [
                {
                  id: `evt_${String(eventCounter).padStart(3, "0")}`,
                  timestamp: timestamp2,
                  process: snapshot.name,
                  pid: snapshot.pid,
                  type: "memory",
                  summary: "Target memory change",
                  severity,
                  delta: `${parseFloat(deltaMB) >= 0 ? "+" : ""}${deltaMB} MB`,
                  durationMs: Math.floor(Math.random() * 500) + 200
                }
              ],
              targetPid: trackedPid
            });
          }
        }
        previousTrackedProcess = snapshot;
        const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false });
        const memorySample = {
          pid: snapshot.pid,
          timestamp,
          memoryBytes: snapshot.memoryUsage
        };
        let ioSample;
        try {
          const getIoFn = sysInfoModule.jsGetProcessIo || sysInfoModule.js_get_process_io;
          if (typeof getIoFn === "function") {
            const io = getIoFn(snapshot.pid);
            if (io) {
              ioSample = {
                pid: snapshot.pid,
                timestamp,
                readBytes: typeof io.readBytes === "number" ? io.readBytes : typeof io.read_bytes === "number" ? io.read_bytes : 0,
                writeBytes: typeof io.writeBytes === "number" ? io.writeBytes : typeof io.write_bytes === "number" ? io.write_bytes : 0
              };
            }
          }
        } catch {
        }
        let cpuSample;
        try {
          const getCpuFn = sysInfoModule.jsGetProcessCpuUsage || sysInfoModule.js_get_process_cpu_usage;
          if (typeof getCpuFn === "function") {
            const cpuPercent = getCpuFn(snapshot.pid, 0.2);
            if (typeof cpuPercent === "number" && isFinite(cpuPercent)) {
              cpuSample = { pid: snapshot.pid, timestamp, cpuPercent };
            }
          }
        } catch {
        }
        emit("data:trace", {
          events: [],
          targetPid: trackedPid,
          memorySample,
          ioSample,
          cpuSample
        });
      }
    }
  } catch (e) {
    console.error("worker pushProcesses error:", e);
  }
}
function normalizeProcess(process2) {
  return {
    ...process2,
    memoryUsage: typeof process2.memoryUsage === "number" ? process2.memoryUsage : typeof process2.memory_usage === "number" ? process2.memory_usage : 0
  };
}
function searchProcesses(query) {
  if (!sysInfoModule) return { results: [], error: "Native module not loaded" };
  const needle = query.trim();
  if (!needle) return { results: [] };
  const processes = sysInfoModule.getProcesses().map(normalizeProcess);
  if (/^\d+$/.test(needle)) {
    const results2 = processes.filter((process2) => process2.pid.toString().includes(needle));
    return { results: results2 };
  }
  let regex;
  try {
    regex = new RegExp(needle, "i");
  } catch (e) {
    return { results: [], error: (e == null ? void 0 : e.message) ?? String(e) };
  }
  const results = processes.filter((process2) => regex.test(String(process2.name || "")));
  return { results };
}
function startDataTimers() {
  stopDataTimers();
  pushFast();
  setTimeout(() => {
    pushSlow();
    slowTimer = setInterval(pushSlow, 4e3);
  }, 500);
  setTimeout(() => {
    pushProcesses();
    procTimer = setInterval(pushProcesses, 3e3);
  }, 1e3);
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
(_a = worker_threads.parentPort) == null ? void 0 : _a.on("message", (msg) => {
  if (msg.type === "start") {
    if (loadNativeModule()) startDataTimers();
    return;
  }
  if (msg.type === "stop") {
    stopDataTimers();
    stopChildTracking();
  }
  if (msg.type === "trace:start") {
    if (typeof msg.pid === "number" && Number.isFinite(msg.pid)) {
      startChildTracking(msg.pid);
    }
    return;
  }
  if (msg.type === "trace:stop") {
    stopChildTracking();
  }
  if (msg.type === "process:search") {
    const requestId = typeof msg.requestId === "number" ? msg.requestId : searchRequestCounter++;
    const { results, error } = searchProcesses(msg.query ?? "");
    emit("data:process-search", { requestId, results, error });
  }
});
