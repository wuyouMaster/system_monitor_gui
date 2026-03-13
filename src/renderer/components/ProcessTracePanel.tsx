import React, { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Button,
  MenuItem,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Timeline as TraceIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  FilterAlt as FilterIcon,
  Search as SearchIcon,
  Bolt as SpikeIcon,
  Memory as MemoryIcon,
  Visibility as FocusIcon,
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
}

const TYPE_COLOR: Record<TraceEvent['type'], string> = {
  cpu: '#FF9500',
  memory: '#5AC8FA',
  io: '#5856D6',
  network: '#34C759',
  spawn: '#FF2D55',
};

const SEVERITY_COLOR: Record<TraceEvent['severity'], string> = {
  low: 'rgba(235,235,245,0.6)',
  medium: '#FFD60A',
  high: '#FF3B30',
};

const typeIconMap: Record<TraceEvent['type'], React.ReactNode> = {
  cpu: <SpikeIcon sx={{ fontSize: 16 }} />,
  memory: <MemoryIcon sx={{ fontSize: 16 }} />,
  io: <FilterIcon sx={{ fontSize: 16 }} />,
  network: <FocusIcon sx={{ fontSize: 16 }} />,
  spawn: <PlayIcon sx={{ fontSize: 16 }} />,
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

type TraceCache = {
  events: TraceEvent[];
  activePid: number | null;
  isTracing: boolean;
  pidInput: string;
};

const traceCache: TraceCache = {
  events: [],
  activePid: null,
  isTracing: false,
  pidInput: '',
};

export const ProcessTracePanel: React.FC<{ locale: Locale }> = React.memo(({ locale }) => {
  const text = i18n[locale].trace;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [events, setEvents] = useState<TraceEvent[]>(traceCache.events);
  const [pidInput, setPidInput] = useState(traceCache.pidInput);
  const [activePid, setActivePid] = useState<number | null>(traceCache.activePid);
  const [isTracing, setIsTracing] = useState(traceCache.isTracing);
  const [currentPage, setCurrentPage] = useState(1);

  const cacheLimit = 500;
  const pageSize = 8;

  const typeOptions = useMemo(() => ['all', 'cpu', 'memory', 'io', 'network', 'spawn'], []);

  useEffect(() => {
    const unsubTrace = window.systemInfo.onTraceData((data) => {
      if (data.reset) {
        traceCache.events = [];
        setEvents([]);
        setCurrentPage(1);
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
        setActivePid(null);
        setIsTracing(false);
      }
      if (data.events.length > 0) {
        setEvents((prev) => {
          const newEvents = [...data.events, ...prev];
          const trimmed = newEvents.slice(0, cacheLimit);
          traceCache.events = trimmed;
          return trimmed;
        });
      }
    });

    return () => {
      unsubTrace();
    };
  }, []);

  const handleStart = () => {
    const pid = Number(pidInput);
    if (!Number.isFinite(pid) || pid <= 0) return;
    window.systemInfo.startTrace(pid);
    traceCache.activePid = pid;
    traceCache.isTracing = true;
    setIsTracing(true);
  };

  const handleStop = () => {
    window.systemInfo.stopTrace();
    traceCache.activePid = null;
    traceCache.isTracing = false;
    setIsTracing(false);
  };

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return events.filter((event) => {
      const typeMatched = selectedType === 'all' || event.type === selectedType;
      if (!typeMatched) return false;
      if (!query) return true;
      const haystack = `${event.process} ${event.summary} ${event.pid}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchTerm, selectedType, events]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / pageSize));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, pageCount));
  }, [pageCount]);

  const totalAlerts = filteredEvents.filter((event) => event.severity === 'high').length;
  const hasEvents = filteredEvents.length > 0;
  const isIdle = !isTracing && events.length === 0;
  const statusLabel = isTracing ? text.live : text.paused;
  const statusColor = isTracing ? '#32D74B' : 'rgba(235,235,245,0.6)';
  const statusDetail = isTracing
    ? text.liveDetail(activePid)
    : activePid
      ? text.pausedDetail(activePid)
      : text.idleDetail;
  const pagedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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

        <Box display="grid" gridTemplateColumns="minmax(360px, 1.25fr) minmax(280px, 0.75fr)" gap={2}>
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
              <TextField
                select
                size="small"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                sx={{ minWidth: 150 }}
              >
                {typeOptions.map((type) => (
                  <MenuItem key={type} value={type}>
                    {text.typeLabels[type as keyof typeof text.typeLabels]}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={timelineStyles}>
              {pagedEvents.map((event) => (
                <Box
                  key={event.id}
                  sx={{
                    borderRadius: 2,
                    p: 1.4,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${TYPE_COLOR[event.type]}20`,
                          color: TYPE_COLOR[event.type],
                          border: `1px solid ${TYPE_COLOR[event.type]}55`,
                        }}
                      >
                        {typeIconMap[event.type]}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {event.summary}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.process} · {event.pid} · {event.timestamp}
                          {event.command ? ` · ${event.command}` : ''}
                        </Typography>
                      </Box>
                    </Box>
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
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      {text.delta} {event.delta}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {text.duration} {event.durationMs} ms
                    </Typography>
                  </Box>
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
                  {events.length}
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
