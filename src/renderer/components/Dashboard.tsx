import React, { startTransition, useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { MemoryPanel } from './MemoryPanel';
import { CpuPanel } from './CpuPanel';
import { DiskPanel } from './DiskPanel';
import { SocketPanel } from './SocketPanel';
import { ProcessPanel } from './ProcessPanel';

// ---------------------------------------------------------------------------
// Independent state slices — each panel owns its own state so a push event
// for "fast" data (memory + CPU) never triggers a re-render of Disk/Network/
// Process panels, and vice versa. This is the key change: instead of one big
// setData() that rerenders all 5 panels at once (→ 321ms GPU Commit), each
// panel gets its own setState and repaints independently.
// ---------------------------------------------------------------------------

const EMPTY_MEMORY  = {} as any;
const EMPTY_CPU     = {} as any;
const EMPTY_SUMMARY = {} as any;
const EMPTY_ARR: never[] = [];

export const Dashboard: React.FC = () => {
  const [memory,        setMemory]        = useState<any>(EMPTY_MEMORY);
  const [cpu,           setCpu]           = useState<any>(EMPTY_CPU);
  const [cpuUsage,      setCpuUsage]      = useState<number[]>(EMPTY_ARR);
  const [disks,         setDisks]         = useState<any[]>(EMPTY_ARR);
  const [socketSummary, setSocketSummary] = useState<any>(EMPTY_SUMMARY);
  const [connections,   setConnections]   = useState<any[]>(EMPTY_ARR);
  const [processes,     setProcesses]     = useState<any[]>(EMPTY_ARR);
  const [processCount,  setProcessCount]  = useState(0);
  const [ready,         setReady]         = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    // Buffer IPC payloads and commit state on the next animation frame.
    // This keeps input/scroll handling smooth under bursty native updates.
    const pendingRef: {
      fast?: { memory: any; cpu: any; cpuUsage: number[] };
      slow?: { disks: any[]; socketSummary: any; connections: any[] };
      proc?: { processes: any[]; processCount: number };
    } = {};
    const rafIdRef = { current: 0 };
    const scheduleFlush = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = 0;
        const fast = pendingRef.fast;
        const slow = pendingRef.slow;
        const proc = pendingRef.proc;
        pendingRef.fast = undefined;
        pendingRef.slow = undefined;
        pendingRef.proc = undefined;

        startTransition(() => {
          if (fast) {
            setMemory(fast.memory);
            setCpu(fast.cpu);
            setCpuUsage(fast.cpuUsage);
            if (!readyRef.current) {
              readyRef.current = true;
              setReady(true);
            }
          }
          if (slow) {
            setDisks(slow.disks);
            setSocketSummary(slow.socketSummary);
            setConnections(slow.connections);
          }
          if (proc) {
            setProcesses(proc.processes);
            setProcessCount(proc.processCount);
          }
        });
      });
    };

    // Subscribe to main-process push events.
    // Each unsub function is returned by the preload helper.
    const unsubFast = window.systemInfo.onFastData((d) => {
      pendingRef.fast = d;
      scheduleFlush();
    });

    const unsubSlow = window.systemInfo.onSlowData((d) => {
      pendingRef.slow = d;
      scheduleFlush();
    });

    const unsubProc = window.systemInfo.onProcessData((d) => {
      pendingRef.proc = d;
      scheduleFlush();
    });

    return () => {
      unsubFast();
      unsubSlow();
      unsubProc();
      if (rafIdRef.current) window.cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  if (!ready) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Box textAlign="center">
          <CircularProgress sx={{ color: '#007AFF' }} size={40} thickness={3} />
          <Typography
            variant="body2"
            sx={{ mt: 2, color: 'rgba(235,235,245,0.6)', fontWeight: 400 }}
          >
            Loading system info…
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    // Single scroll container: 100vh, overflow-y auto.
    // Body/html are overflow:hidden so this is the ONE scroll surface.
    // Being a separate overflow context lets Chromium run scroll on the
    // compositor thread, decoupled from React's main-thread state updates.
    <Box
      sx={{
        height: '100vh',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 3,
          '&:hover': { background: 'rgba(255,255,255,0.25)' },
        },
      }}
    >
      <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
        {/* Header */}
        <Box mb={4} pt={1} sx={{ pointerEvents: 'none' }}>
          <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 700, letterSpacing: -0.5 }}>
            System Monitor
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time resource monitoring
          </Typography>
        </Box>

        {/* Top Row: Memory, CPU, Network */}
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2.5} mb={2.5}>
          <MemoryPanel memory={memory} />
          <CpuPanel cpu={cpu} cpuUsage={cpuUsage} />
          <SocketPanel socketSummary={socketSummary} connections={connections} />
        </Box>

        {/* Bottom Row: Disk, Processes — fixed row height gives the virtual list a stable container */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(2, 1fr)"
          gap={2.5}
          sx={{ gridAutoRows: '460px' }}
        >
          <DiskPanel disks={disks} />
          <ProcessPanel processes={processes} processCount={processCount} />
        </Box>

        {/* Footer */}
        <Box mt={3} textAlign="center" sx={{ pointerEvents: 'none' }}>
          <Typography variant="caption" sx={{ color: 'rgba(235,235,245,0.3)' }}>
            Powered by Rust · Electron · React · CPU sampled every 1.5s
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
