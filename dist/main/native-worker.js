"use strict";
var _a;
const fs = require("fs");
const path = require("path");
const worker_threads = require("worker_threads");
let sysInfoModule = null;
let fastTimer = null;
let slowTimer = null;
let procTimer = null;
const CPU_SAMPLE_SECS = 500;
function getNativeModuleName() {
  const platformMap = { darwin: "darwin", linux: "linux", win32: "win32" };
  const archMap = { x64: "x64", arm64: "arm64", ia32: "ia32" };
  const plat = platformMap[process.platform] || process.platform;
  const arc = archMap[process.arch] || process.arch;
  return `index.${plat}-${arc}.node`;
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
    const processes = sysInfoModule.getProcesses().slice(0, 200);
    emit("data:processes", {
      processes,
      processCount: processes.length
    });
  } catch (e) {
    console.error("worker pushProcesses error:", e);
  }
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
  }
});
