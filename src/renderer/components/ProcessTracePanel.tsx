import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { LineChart, Line, ResponsiveContainer, Legend } from 'recharts';
import {
  Timeline as TraceIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  FilterAlt as FilterIcon,
  Search as SearchIcon,
  StopCircle as KillIcon,
} from '@mui/icons-material';
import { i18n, type Locale } from '../i18n';

interface TraceEvent {
  id: string;
  timestamp: string;
  process: string;
  pid: number;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'spawn';
  summary: string;
  severity: 'low' | 'medium' | 'high';
  delta: string;
  durationMs: number;
  command?: string;
  details?: string;
}

interface TraceMemorySample {
  pid: number;
  timestamp: string;
  memoryBytes: number;
}

interface TraceIoSample {
  pid: number;
  timestamp: string;
  readBytes: number;
  writeBytes: number;
}

interface TraceQueueSample {
  timestamp: string;
  totalRecvQueue: number;
  totalSendQueue: number;
  socketCount: number;
}

const SEVERITY_COLOR: Record<TraceEvent['severity'], string> = {
  low: 'rgba(235,235,245,0.6)',
  medium: '#FFD60A',
  high: '#FF3B30',
};

const PANEL_CHIP_SX = {
  height: 22,
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 6,
} as const;

const METRIC_CARD_SX = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2,
  p: 1.5,
  height: '100%',
} as const;

const timelineStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.2,
  mt: 1.5,
} as const;

const SIDE_CARD_SX = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 2,
  p: 1.6,
} as const;

const SECTION_TITLE_SX = {
  fontWeight: 600,
  letterSpacing: 0.1,
} as const;

const STATUS_ROW_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
} as const;

function formatIoBytes(bytes: number): { value: number; unit: string } {
  const mb = bytes / (1024 * 1024);
  if (mb >= 10000) return { value: mb / 1024, unit: 'GB' };
  if (mb >= 1) return { value: mb, unit: 'MB' };
  return { value: bytes / 1024, unit: 'KB' };
}

type TraceCache = {
  events: TraceEvent[];
  activePid: number | null;
  isTracing: boolean;
  pidInput: string;
  memorySamples: TraceMemorySample[];
  ioSamples: TraceIoSample[];
  socketSamples: Array<{ sent: number; recv: number; count: number }>;
  queueSamples: TraceQueueSample[];
};

const traceCache: TraceCache = {
  events: [],
  activePid: null,
  isTracing: false,
  pidInput: '',
  memorySamples: [],
  ioSamples: [],
  socketSamples: [],
  queueSamples: [],
};

export const ProcessTracePanel: React.FC<{ locale: Locale }> = React.memo(({ locale }) => {
  const text = i18n[locale].trace;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [memorySamples, setMemorySamples] = useState<TraceMemorySample[]>(traceCache.memorySamples);
  const [ioSamples, setIoSamples] = useState<TraceIoSample[]>(traceCache.ioSamples);
  const [socketSamples, setSocketSamples] = useState(traceCache.socketSamples);
  const [queueSamples, setQueueSamples] = useState<TraceQueueSample[]>(traceCache.queueSamples);
  const [pidInput, setPidInput] = useState(traceCache.pidInput);
  const [activePid, setActivePid] = useState<number | null>(traceCache.activePid);
  const [isTracing, setIsTracing] = useState(traceCache.isTracing);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCommands, setExpandedCommands] = useState<Record<string, boolean>>({});

  const cacheLimit = 500;
  const pageSize = 8;

  const typeOptions = useMemo(() => ['all', 'cpu', 'memory', 'io', 'network', 'spawn', 'queue'], []);

  useEffect(() => {
    const unsubTrace = window.systemInfo.onTraceData((data) => {
      if (data.reset) {
        traceCache.events = [];
        setCurrentPage(1);
        traceCache.memorySamples = [];
        setMemorySamples([]);
        traceCache.ioSamples = [];
        setIoSamples([]);
        traceCache.socketSamples = [];
        setSocketSamples([]);
        traceCache.queueSamples = [];
        setQueueSamples([]);
      }
      if (typeof data.targetPid === 'number') {
        traceCache.activePid = data.targetPid;
        traceCache.isTracing = true;
        setActivePid(data.targetPid);
        setIsTracing(true);
      }
      if (data.targetPid === null) {
        traceCache.activePid = null;
        traceCache.isTracing = false;
        traceCache.socketSamples = [];
        traceCache.queueSamples = [];
        setActivePid(null);
        setIsTracing(false);
        setSocketSamples([]);
        setQueueSamples([]);
      }
      if (data.events.length > 0) {
        const newEvents = [...data.events, ...traceCache.events];
        traceCache.events = newEvents.slice(0, cacheLimit);
      }
      if (data.memorySample) {
        setMemorySamples((prev) => {
          const next = [...prev, data.memorySample as TraceMemorySample];
          const trimmed = next.slice(-80);
          traceCache.memorySamples = trimmed;
          return trimmed;
        });
      }
      if (data.ioSample) {
        setIoSamples((prev) => {
          const next = [...prev, data.ioSample as TraceIoSample];
          const trimmed = next.slice(-80);
          traceCache.ioSamples = trimmed;
          return trimmed;
        });
      }
    });

    return () => {
      unsubTrace();
    };
  }, []);

  // Poll socket stats when tracing is active
  useEffect(() => {
    if (!isTracing || !activePid) return;
    const timer = setInterval(() => {
      window.systemInfo
        .getProcessSocketStats(activePid)
        .then((stats) => {
          console.log('[SocketStats]', { pid: activePid, stats, count: Array.isArray(stats) ? stats.length : 'not array' });
          if (!Array.isArray(stats) || stats.length === 0) return;
          const totalSent = stats.reduce((sum, s) => sum + (s.bytesSent || 0), 0);
          const totalRecv = stats.reduce((sum, s) => sum + (s.bytesReceived || 0), 0);
          setSocketSamples((prev) => {
            const next = [...prev, { sent: totalSent, recv: totalRecv, count: stats.length }].slice(-80);
            traceCache.socketSamples = next;
            return next;
          });
        })
        .catch((err) => {
          console.error('[SocketStats] Error:', err);
        });
    }, 3000);
    return () => clearInterval(timer);
  }, [isTracing, activePid]);

  // Poll socket queue data when tracing is active
  useEffect(() => {
    if (!isTracing || !activePid) return;
    const timer = setInterval(() => {
      window.systemInfo
        .getProcessSocketQueues(activePid)
        .then((queues) => {
          if (!Array.isArray(queues) || queues.length === 0) return;
          const totalRecvQueue = queues.reduce((sum, q) => sum + (q.recvQueueBytes || 0), 0);
          const totalSendQueue = queues.reduce((sum, q) => sum + (q.sendQueueBytes || 0), 0);
          setQueueSamples((prev) => {
            const next = [
              ...prev,
              {
                timestamp: new Date().toLocaleTimeString(),
                totalRecvQueue,
                totalSendQueue,
                socketCount: queues.length,
              },
            ].slice(-80);
            traceCache.queueSamples = next;
            return next;
          });
        })
        .catch((err) => {
          console.error('[QueueStats] Error:', err);
        });
    }, 2000);
    return () => clearInterval(timer);
  }, [isTracing, activePid]);

  const handleStart = () => {
    const pid = Number(pidInput);
    if (!Number.isFinite(pid) || pid <= 0) return;
    window.systemInfo.startTrace(pid);
    traceCache.activePid = pid;
    traceCache.isTracing = true;
    setIsTracing(true);
  };

  const handleKill = useCallback(async (pid: number) => {
    const result = await window.systemInfo.killProcess(pid);
    if (result?.error) console.error(`Kill PID ${pid} failed:`, result.error);
  }, []);

  const handleStop = () => {
    window.systemInfo.stopTrace();
    traceCache.activePid = null;
    traceCache.isTracing = false;
    setIsTracing(false);
  };

  const toggleCommand = useCallback((eventId: string) => {
    setExpandedCommands((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return traceCache.events.filter((event) => {
      const typeMatched = selectedType === 'all' || event.type === selectedType;
      if (!typeMatched) return false;
      if (!query) return true;
      const haystack = `${event.process} ${event.summary} ${event.pid}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchTerm, selectedType, memorySamples]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / pageSize));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, pageCount));
  }, [pageCount]);

  const totalAlerts = traceCache.events.filter((event) => event.severity === 'high').length;
  const hasEvents = filteredEvents.length > 0;
  const isIdle = !isTracing && traceCache.events.length === 0;
  const statusLabel = isTracing ? text.live : text.paused;
  const statusColor = isTracing ? '#32D74B' : 'rgba(235,235,245,0.6)';
  const statusDetail = isTracing
    ? text.liveDetail(activePid ?? 0)
    : activePid
      ? text.pausedDetail(activePid)
      : text.idleDetail;
  const pagedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const memoryChartData = useMemo(
    () => memorySamples.map((sample, index) => ({ index, memory: sample.memoryBytes / (1024 * 1024) })),
    [memorySamples],
  );
  const latestMemoryMb = useMemo(() => {
    const last = memorySamples[memorySamples.length - 1];
    if (!last) return null;
    return last.memoryBytes / (1024 * 1024);
  }, [memorySamples]);

  const ioChartData = useMemo(() => {
    if (ioSamples.length === 0) return [];
    const maxBytes = Math.max(
      ...ioSamples.map((s) => Math.max(s.readBytes, s.writeBytes)),
    );
    const { unit } = formatIoBytes(maxBytes);
    const divisor = unit === 'GB' ? 1024 * 1024 * 1024 : unit === 'MB' ? 1024 * 1024 : 1024;
    return ioSamples.map((sample, index) => ({
      index,
      read: sample.readBytes / divisor,
      write: sample.writeBytes / divisor,
    }));
  }, [ioSamples]);
  const ioChartUnit = useMemo(() => {
    if (ioSamples.length === 0) return 'MB';
    const maxBytes = Math.max(
      ...ioSamples.map((s) => Math.max(s.readBytes, s.writeBytes)),
    );
    return formatIoBytes(maxBytes).unit;
  }, [ioSamples]);
  const latestIo = useMemo(() => {
    const last = ioSamples[ioSamples.length - 1];
    if (!last) return null;
    return {
      read: formatIoBytes(last.readBytes),
      write: formatIoBytes(last.writeBytes),
    };
  }, [ioSamples]);

  const socketChartData = useMemo(() => {
    if (socketSamples.length === 0) return [];
    const maxBytes = Math.max(
      ...socketSamples.map((s) => Math.max(s.sent, s.recv)),
    );
    const { unit } = formatIoBytes(maxBytes);
    const divisor = unit === 'GB' ? 1024 * 1024 * 1024 : unit === 'MB' ? 1024 * 1024 : 1024;
    return socketSamples.map((sample, index) => ({
      index,
      sent: sample.sent / divisor,
      recv: sample.recv / divisor,
    }));
  }, [socketSamples]);
  const socketChartUnit = useMemo(() => {
    if (socketSamples.length === 0) return 'MB';
    const maxBytes = Math.max(
      ...socketSamples.map((s) => Math.max(s.sent, s.recv)),
    );
    return formatIoBytes(maxBytes).unit;
  }, [socketSamples]);
  const latestSocket = useMemo(() => {
    const last = socketSamples[socketSamples.length - 1];
    if (!last) return null;
    return {
      sent: formatIoBytes(last.sent),
      recv: formatIoBytes(last.recv),
      count: last.count,
    };
  }, [socketSamples]);

  const queueChartData = useMemo(() => {
    if (queueSamples.length === 0) return [];
    const maxBytes = Math.max(
      ...queueSamples.map((s) => Math.max(s.totalRecvQueue, s.totalSendQueue)),
      1,
    );
    const { unit } = formatIoBytes(maxBytes);
    const divisor = unit === 'GB' ? 1024 * 1024 * 1024 : unit === 'MB' ? 1024 * 1024 : 1024;
    return queueSamples.map((sample, index) => ({
      index,
      recvQ: sample.totalRecvQueue / divisor,
      sendQ: sample.totalSendQueue / divisor,
    }));
  }, [queueSamples]);
  const queueChartUnit = useMemo(() => {
    if (queueSamples.length === 0) return 'KB';
    const maxBytes = Math.max(
      ...queueSamples.map((s) => Math.max(s.totalRecvQueue, s.totalSendQueue)),
      1,
    );
    return formatIoBytes(maxBytes).unit;
  }, [queueSamples]);
  const latestQueue = useMemo(() => {
    const last = queueSamples[queueSamples.length - 1];
    if (!last) return null;
    return {
      recvQ: formatIoBytes(last.totalRecvQueue),
      sendQ: formatIoBytes(last.totalSendQueue),
      socketCount: last.socketCount,
    };
  }, [queueSamples]);

  return (
    <Card sx={{ height: '100%', border: 'none' }}>
      <CardContent sx={{ height: '100%' }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
          sx={{ pointerEvents: 'none' }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <TraceIcon sx={{ fontSize: 20, color: '#32D74B' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
              {text.title}
            </Typography>
            <Chip
              label={text.live}
              size="small"
              sx={{
                ...PANEL_CHIP_SX,
                background: 'rgba(50,215,75,0.16)',
                color: '#32D74B',
                border: '1px solid rgba(50,215,75,0.4)',
              }}
            />
          </Box>
            <Chip
              label={`${filteredEvents.length} ${text.events}`}
              size="small"
              sx={{
                ...PANEL_CHIP_SX,
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(235,235,245,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
        </Box>

        <Box display="grid" gridTemplateColumns="minmax(360px, 1.25fr) minmax(220px, 0.4fr)" gap={2}>
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
              <Typography variant="subtitle2" sx={SECTION_TITLE_SX}>
                {text.events}
              </Typography>
              <Chip
                label={`${filteredEvents.length} ${text.events}`}
                size="small"
                sx={{
                  ...PANEL_CHIP_SX,
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(235,235,245,0.7)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap={1.2} mt={1.5}>
              <Box sx={METRIC_CARD_SX}>
                <Typography variant="caption" color="text.secondary">
                  {text.health}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  94%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={94}
                  sx={{ mt: 1, height: 5, borderRadius: 3, '& .MuiLinearProgress-bar': { background: '#32D74B' } }}
                />
              </Box>
              <Box sx={METRIC_CARD_SX}>
                <Typography variant="caption" color="text.secondary">
                  {text.alerts}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#FF3B30' }}>
                  {totalAlerts}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                  {text.alertsHint}
                </Typography>
              </Box>
              <Box sx={METRIC_CARD_SX}>
                <Typography variant="caption" color="text.secondary">
                  {text.status}
                </Typography>
                <Box sx={STATUS_ROW_SX} mt={0.6}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: statusColor }}>
                    {statusLabel}
                  </Typography>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: statusColor,
                      boxShadow: `0 0 0 4px ${statusColor}22`,
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6 }}>
                  {statusDetail}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between" mt={2} gap={1.5}>
              <TextField
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={text.searchPlaceholder}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'rgba(235,235,245,0.55)' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box display="flex" gap={1.5} mt={1.5}>
              <Tabs
                value={selectedType}
                onChange={(_, value) => setSelectedType(value)}
                orientation="vertical"
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{
                  minWidth: 120,
                  '& .MuiTab-root': {
                    alignItems: 'flex-start',
                    minHeight: 32,
                    px: 1.2,
                    py: 0.6,
                    textTransform: 'none',
                    fontSize: 12,
                    color: 'rgba(235,235,245,0.7)',
                  },
                  '& .Mui-selected': {
                    color: '#32D74B',
                    fontWeight: 600,
                  },
                  '& .MuiTabs-indicator': {
                    left: 0,
                    backgroundColor: '#32D74B',
                  },
                }}
              >
                {typeOptions.map((type) => (
                  <Tab key={type} value={type} label={text.typeLabels[type as keyof typeof text.typeLabels]} />
                ))}
              </Tabs>
              <Box sx={{ ...timelineStyles, mt: 0, flex: 1 }}>
                {selectedType === 'memory' ? (
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background:
                        'linear-gradient(135deg, rgba(90,200,250,0.08) 0%, rgba(255,255,255,0.01) 100%)',
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {text.memoryTrend}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {latestMemoryMb === null ? text.noEvents : `${latestMemoryMb.toFixed(1)} MB`}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={memoryChartData}>
                          <Line
                            type="monotone"
                            dataKey="memory"
                            stroke="#5AC8FA"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                ) : selectedType === 'io' ? (
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background:
                        'linear-gradient(135deg, rgba(88,86,214,0.08) 0%, rgba(255,255,255,0.01) 100%)',
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {text.ioTrend}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({ioChartUnit})
                      </Typography>
                      <Box display="flex" gap={1.5}>
                        {latestIo && (
                          <>
                            <Typography variant="caption" sx={{ color: '#34C759' }}>
                              {text.read} {latestIo.read.value.toFixed(1)} {latestIo.read.unit}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#FF9500' }}>
                              {text.write} {latestIo.write.value.toFixed(1)} {latestIo.write.unit}
                            </Typography>
                          </>
                        )}
                        {!latestIo && (
                          <Typography variant="caption" color="text.secondary">
                            {text.noEvents}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={ioChartData}>
                          <Line
                            type="monotone"
                            dataKey="read"
                            stroke="#34C759"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            name={text.read}
                          />
                          <Line
                            type="monotone"
                            dataKey="write"
                            stroke="#FF9500"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            name={text.write}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                ) : selectedType === 'network' ? (
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background:
                        'linear-gradient(135deg, rgba(52,199,89,0.08) 0%, rgba(255,255,255,0.01) 100%)',
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {text.netTrend}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({socketChartUnit})
                      </Typography>
                      <Box display="flex" gap={1.5}>
                        {latestSocket && (
                          <>
                            <Typography variant="caption" sx={{ color: '#32D74B' }}>
                              {text.sent} {latestSocket.sent.value.toFixed(1)} {latestSocket.sent.unit}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5AC8FA' }}>
                              {text.recv} {latestSocket.recv.value.toFixed(1)} {latestSocket.recv.unit}
                            </Typography>
                          </>
                        )}
                        {!latestSocket && (
                          <Typography variant="caption" color="text.secondary">
                            {text.noEvents}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={socketChartData}>
                          <Line
                            type="monotone"
                            dataKey="sent"
                            stroke="#32D74B"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            name={text.sent}
                          />
                          <Line
                            type="monotone"
                            dataKey="recv"
                            stroke="#5AC8FA"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            name={text.recv}
                          />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {latestSocket?.count ?? 0} {text.sockets}
                    </Typography>
                  </Box>
                ) : selectedType === 'queue' ? (
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background:
                        'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, rgba(255,255,255,0.01) 100%)',
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {text.queueTrend}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({queueChartUnit})
                      </Typography>
                      <Box display="flex" gap={1.5}>
                        {latestQueue && (
                          <>
                            <Typography variant="caption" sx={{ color: '#FF9F0A' }}>
                              {text.sendQueue} {latestQueue.sendQ.value.toFixed(1)} {latestQueue.sendQ.unit}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#BF5AF2' }}>
                              {text.recvQueue} {latestQueue.recvQ.value.toFixed(1)} {latestQueue.recvQ.unit}
                            </Typography>
                          </>
                        )}
                        {!latestQueue && (
                          <Typography variant="caption" color="text.secondary">
                            {text.noEvents}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={queueChartData}>
                          <Line
                            type="monotone"
                            dataKey="sendQ"
                            stroke="#FF9F0A"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            name={text.sendQueue}
                          />
                          <Line
                            type="monotone"
                            dataKey="recvQ"
                            stroke="#BF5AF2"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            name={text.recvQueue}
                          />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {latestQueue?.socketCount ?? 0} {text.sockets}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {pagedEvents.map((event) => (
                      <Box
                        key={event.id}
                        sx={{
                          borderRadius: 2,
                          p: 1.4,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {event.summary}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.process} · {event.pid} · {event.timestamp}
                              {event.details ? ` · ${event.details}` : ''}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Chip
                              label={text.severityLabels[event.severity]}
                              size="small"
                              sx={{
                                ...PANEL_CHIP_SX,
                                background: `${SEVERITY_COLOR[event.severity]}20`,
                                color: SEVERITY_COLOR[event.severity],
                                border: `1px solid ${SEVERITY_COLOR[event.severity]}55`,
                              }}
                            />
                            {event.pid > 0 && (
                              <Tooltip title={text.killTooltip(event.pid)} placement="left">
                                <IconButton
                                  size="small"
                                  onClick={() => handleKill(event.pid)}
                                  sx={{
                                    color: 'rgba(255,59,48,0.7)',
                                    p: '3px',
                                    '&:hover': { color: '#FF3B30', background: 'rgba(255,59,48,0.12)' },
                                  }}
                                >
                                  <KillIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                        {event.command && expandedCommands[event.id] && (
                          <Box
                            mt={1}
                            px={1}
                            py={0.8}
                            sx={{
                              borderRadius: 1.5,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                              {text.commandLabel}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: 12,
                                color: 'rgba(235,235,245,0.92)',
                                wordBreak: 'break-all',
                              }}
                            >
                              {event.command}
                            </Typography>
                          </Box>
                        )}
                        {event.command && (
                          <Box display="flex" justifyContent="flex-start" mt={1}>
                            <Tooltip title={expandedCommands[event.id] ? text.hideCommand : text.showCommand}>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => toggleCommand(event.id)}
                                sx={{
                                  minWidth: 0,
                                  px: 1.2,
                                  color: 'primary.contrastText',
                                  textTransform: 'none',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  letterSpacing: 0.2,
                                  borderRadius: 1,
                                  border: '1px solid transparent',
                                  background: 'primary.main',
                                  '&:hover': { background: 'primary.dark' },
                                }}
                              >
                                {expandedCommands[event.id] ? text.hideCommand : text.showCommand}
                              </Button>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    ))}
                    {!hasEvents && (
                      <Box
                        textAlign="center"
                        py={5}
                        sx={{
                          pointerEvents: 'none',
                          borderRadius: 2,
                          border: '1px dashed rgba(255,255,255,0.12)',
                          background:
                            'radial-gradient(circle at top, rgba(50,215,75,0.08), transparent 55%), rgba(255,255,255,0.02)',
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            background: 'rgba(50,215,75,0.16)',
                            border: '1px solid rgba(50,215,75,0.35)',
                            color: '#32D74B',
                          }}
                        >
                          <TraceIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(235,235,245,0.92)' }}>
                          {isIdle ? text.emptyTitle : text.noEvents}
                        </Typography>
                        {isIdle && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                            {text.emptyHint}
                          </Typography>
                        )}
                      </Box>
                    )}
                    {hasEvents && (
                      <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          {text.pageLabel(currentPage, pageCount)}
                        </Typography>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            sx={{ borderColor: 'rgba(255,255,255,0.16)', color: 'rgba(235,235,245,0.75)' }}
                          >
                            {text.prevPage}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={currentPage === pageCount}
                            onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                            sx={{ borderColor: 'rgba(255,255,255,0.16)', color: 'rgba(235,235,245,0.75)' }}
                          >
                            {text.nextPage}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            <Box sx={SIDE_CARD_SX}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2" sx={SECTION_TITLE_SX}>
                  {text.controls}
                </Typography>
                <Chip
                  label={statusLabel}
                  size="small"
                  sx={{
                    ...PANEL_CHIP_SX,
                    background: `${statusColor}22`,
                    color: statusColor,
                    border: `1px solid ${statusColor}55`,
                  }}
                />
              </Box>
              <TextField
                value={pidInput}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/[^0-9]/g, '');
                  traceCache.pidInput = nextValue;
                  setPidInput(nextValue);
                }}
                placeholder="PID"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon sx={{ fontSize: 16, color: 'rgba(235,235,245,0.55)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1.2 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  size="small"
                  disabled={isTracing}
                  onClick={handleStart}
                  sx={{ flex: 1, background: '#32D74B', '&:hover': { background: '#28B43E' } }}
                >
                  {text.start}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PauseIcon />}
                  size="small"
                  disabled={!isTracing}
                  onClick={handleStop}
                  sx={{
                    flex: 1,
                    color: 'rgba(235,235,245,0.8)',
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  {text.pause}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.1 }}>
                {text.controlsHint}
              </Typography>
            </Box>

            <Box sx={SIDE_CARD_SX}>
              <Typography variant="subtitle2" sx={{ ...SECTION_TITLE_SX, mb: 1 }}>
                {text.session}
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  {text.activePid}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {activePid ?? text.noActive}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  {text.events}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {traceCache.events.length}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  {text.alerts}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#FF3B30' }}>
                  {totalAlerts}
                </Typography>
              </Box>
              <Box
                sx={{
                  mt: 1.2,
                  p: 1,
                  borderRadius: 1.5,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {text.sessionHint}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});
