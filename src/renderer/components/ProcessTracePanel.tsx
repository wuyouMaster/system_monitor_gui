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

export const ProcessTracePanel: React.FC<{ locale: Locale }> = React.memo(({ locale }) => {
  const text = i18n[locale].trace;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [pidInput, setPidInput] = useState('');
  const [activePid, setActivePid] = useState<number | null>(null);
  const [isTracing, setIsTracing] = useState(false);

  const typeOptions = useMemo(() => ['all', 'cpu', 'memory', 'io', 'network', 'spawn'], []);

  useEffect(() => {
    const unsubTrace = window.systemInfo.onTraceData((data) => {
      if (data.reset) {
        setEvents([]);
      }
      if (typeof data.targetPid === 'number') {
        setActivePid(data.targetPid);
        setIsTracing(true);
      }
      if (data.targetPid === null) {
        setActivePid(null);
        setIsTracing(false);
      }
      if (data.events.length > 0) {
        setEvents((prev) => {
          const newEvents = [...data.events, ...prev];
          return newEvents.slice(0, 100);
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
    setIsTracing(true);
  };

  const handleStop = () => {
    window.systemInfo.stopTrace();
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

  const totalAlerts = filteredEvents.filter((event) => event.severity === 'high').length;
  const activeTrace = filteredEvents.slice(0, 8);

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

        <Box display="grid" gridTemplateColumns="minmax(320px, 1.25fr) minmax(240px, 0.75fr)" gap={2}>
          <Box>
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, minmax(0, 1fr))"
              gap={1.2}
            >
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
                  {text.latency}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  180 ms
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                  p95
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
              {activeTrace.map((event) => (
                <Box
                  key={event.id}
                  sx={{
                    borderRadius: 2,
                    p: 1.4,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
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
              {filteredEvents.length === 0 && (
                <Box textAlign="center" py={4} sx={{ pointerEvents: 'none' }}>
                  <Typography variant="body2" color="text.secondary">
                    {text.noEvents}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2.5,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {text.focusTitle}
              </Typography>
              <Box
                sx={{
                  background: 'rgba(0,122,255,0.12)',
                  border: '1px solid rgba(0,122,255,0.25)',
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {activePid ? `PID ${activePid}` : text.focusProcess}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activePid ? `Tracing child processes` : 'PID 228 · WindowServer'}
                </Typography>
                <Box display="flex" gap={1} mt={1.2}>
                  <Chip
                    label={text.focusAuto}
                    size="small"
                    sx={{
                      ...PANEL_CHIP_SX,
                      background: 'rgba(0,122,255,0.12)',
                      color: '#5AC8FA',
                      border: '1px solid rgba(0,122,255,0.35)',
                    }}
                  />
                  <Chip
                    label="GPU"
                    size="small"
                    sx={{
                      ...PANEL_CHIP_SX,
                      background: 'rgba(88,86,214,0.12)',
                      color: '#7B79E0',
                      border: '1px solid rgba(88,86,214,0.35)',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {text.controls}
              </Typography>
              <TextField
                value={pidInput}
                onChange={(event) => setPidInput(event.target.value.replace(/[^0-9]/g, ''))}
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
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {text.insights}
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.2}>
                {text.insightItems.map((item) => (
                  <Box
                    key={item.title}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.08)',
                      p: 1.2,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.4 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.detail}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});
