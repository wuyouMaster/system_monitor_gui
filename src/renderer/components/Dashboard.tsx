import React, { startTransition, useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Tabs, Tab, Chip } from '@mui/material';
import {
  Memory as MemoryIcon,
  DeveloperBoard as CpuIcon,
  Router as SocketIcon,
  Storage as DiskIcon,
  ViewList as ProcessIcon,
} from '@mui/icons-material';
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
  const [activeTab, setActiveTab] = useState(0);
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
  const avgCpuUsage =
    cpuUsage.length > 0
      ? cpuUsage.filter(Number.isFinite).reduce((a, b) => a + b, 0) / cpuUsage.length
      : 0;

  const tabItems = [
    {
      key: 'memory',
      label: 'Memory',
      icon: <MemoryIcon sx={{ fontSize: 18, color: '#5AC8FA' }} />,
      value: `${(memory?.usagePercent ?? 0).toFixed(1)}%`,
    },
    {
      key: 'cpu',
      label: 'CPU',
      icon: <CpuIcon sx={{ fontSize: 18, color: '#FF9500' }} />,
      value: `${avgCpuUsage.toFixed(1)}%`,
    },
    {
      key: 'socket',
      label: 'Socket',
      icon: <SocketIcon sx={{ fontSize: 18, color: '#34C759' }} />,
      value: `${socketSummary?.established ?? 0} est.`,
    },
    {
      key: 'disk',
      label: 'Disk',
      icon: <DiskIcon sx={{ fontSize: 18, color: '#5856D6' }} />,
      value: `${disks.length} mounts`,
    },
    {
      key: 'process',
      label: 'Processes',
      icon: <ProcessIcon sx={{ fontSize: 18, color: '#FF2D55' }} />,
      value: `${processCount} total`,
    },
  ];

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

        {/* Left tabs + right single-panel content */}
        <Box
          display="grid"
          gridTemplateColumns="220px 1fr"
          gap={2.5}
          alignItems="start"
        >
          <Box
            sx={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 3,
              p: 1.2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography
              variant="caption"
              sx={{ display: 'block', px: 1.2, pb: 1, color: 'rgba(235,235,245,0.5)', letterSpacing: 0.3 }}
            >
              PANELS
            </Typography>
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={(_, value: number) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 320,
                '& .MuiTabs-indicator': { display: 'none' },
              }}
            >
              {tabItems.map((tab) => (
                <Tab
                  key={tab.key}
                  disableRipple
                  label={
                    <Box
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {tab.icon}
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>
                          {tab.label}
                        </Typography>
                      </Box>
                      <Chip
                        label={tab.value}
                        size="small"
                        sx={{
                          height: 20,
                          maxWidth: 90,
                          '& .MuiChip-label': {
                            px: 0.8,
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'rgba(235,235,245,0.82)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'rgba(255,255,255,0.08)',
                        }}
                      />
                    </Box>
                  }
                  sx={{
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    minHeight: 52,
                    borderRadius: 2,
                    mb: 0.5,
                    px: 1,
                    transition: 'all 120ms ease-out',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.06)',
                    },
                    '&.Mui-selected': {
                      background: 'linear-gradient(90deg, rgba(0,122,255,0.22) 0%, rgba(0,122,255,0.06) 100%)',
                      border: '1px solid rgba(0,122,255,0.35)',
                      boxShadow: 'inset 0 0 0 1px rgba(0,122,255,0.15)',
                    },
                  }}
                />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ minHeight: 'calc(100vh - 240px)', display: 'flex' }}>
            <Box sx={{ flex: 1 }}>
              {activeTab === 0 && <MemoryPanel memory={memory} />}
              {activeTab === 1 && <CpuPanel cpu={cpu} cpuUsage={cpuUsage} />}
              {activeTab === 2 && <SocketPanel socketSummary={socketSummary} connections={connections} />}
              {activeTab === 3 && <DiskPanel disks={disks} />}
              {activeTab === 4 && <ProcessPanel processes={processes} processCount={processCount} />}
            </Box>
          </Box>
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
