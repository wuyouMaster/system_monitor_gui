import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ViewList as ProcessIcon,
  Close as ClearIcon,
  StopCircle as KillIcon,
} from '@mui/icons-material';
import { i18n, type Locale } from '../i18n';

interface Process {
  pid: number;
  name: string;
  command: string;
  status: string;
  memoryUsage: number;
}

interface ProcessPanelProps {
  locale: Locale;
  processes: Process[];
  processCount: number;
}

// Outside component — never re-created, never trigger re-renders
const formatBytes = (bytes: number): string => {
  const mb = bytes / 1024 / 1024;
  if (mb >= 1000) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(0)} MB`;
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'running':  return '#34C759';
    case 'sleeping': return '#5AC8FA';
    case 'stopped':  return '#FF9500';
    case 'zombie':   return '#FF3B30';
    default:         return 'rgba(235,235,245,0.4)';
  }
};

// Column layout shared between header and rows
const COL_TEMPLATE = '56px 1fr 84px 72px 36px';

const ROW_HEIGHT = 44; // px — fixed height enables O(1) scroll position math

// Stable sx objects — defined outside render to avoid object identity churn
const SCROLL_SX = {
  flex: 1,
  overflow: 'auto',
  // Contain scroll to this element; prevents event bubbling to the dashboard scroll container
  overscrollBehavior: 'contain',
  '&::-webkit-scrollbar': { width: 4 },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: 2 },
} as const;

const HEADER_CELL_SX = {
  color: 'rgba(235,235,245,0.6)',
  fontWeight: 500,
  fontSize: 12,
  lineHeight: 1,
} as const;

const renderHighlightedText = (text: string, rawQuery: string): React.ReactNode => {
  const query = rawQuery.trim();
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchedParts: React.ReactNode[] = [];
  let fromIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery, fromIndex);

  while (matchIndex !== -1) {
    if (matchIndex > fromIndex) {
      matchedParts.push(text.slice(fromIndex, matchIndex));
    }

    matchedParts.push(
      <Box
        key={`${matchIndex}-${fromIndex}`}
        component="span"
        sx={{
          background: 'rgba(255,149,0,0.28)',
          color: '#FFD60A',
          borderRadius: '3px',
          px: '1px',
        }}
      >
        {text.slice(matchIndex, matchIndex + query.length)}
      </Box>,
    );

    fromIndex = matchIndex + query.length;
    matchIndex = lowerText.indexOf(lowerQuery, fromIndex);
  }

  if (fromIndex < text.length) {
    matchedParts.push(text.slice(fromIndex));
  }

  return matchedParts;
};

// Individual row — memoized so it only re-renders when its own process data changes
const ProcessRow: React.FC<{
  process: Process;
  style: React.CSSProperties;
  searchTerm: string;
  onKill: (pid: number) => void;
  locale: Locale;
}> = React.memo(({ process, style, searchTerm, onKill, locale }) => {
    const text = i18n[locale].process;
    const color = getStatusColor(process.status);
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: ROW_HEIGHT,
          display: 'grid',
          gridTemplateColumns: COL_TEMPLATE,
          alignItems: 'center',
          px: 1,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
        style={style}
      >
        {/* PID */}
        <Typography
          variant="body2"
          sx={{ color: '#5856D6', fontFamily: 'monospace', fontWeight: 500 }}
        >
          {renderHighlightedText(process.pid.toString(), searchTerm)}
        </Typography>

        {/* Name + command */}
        <Box sx={{ overflow: 'hidden', pr: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {renderHighlightedText(process.name, searchTerm)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 9, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {process.command.substring(0, 60)}
          </Typography>
        </Box>

        {/* Memory */}
        <Typography
          variant="body2"
          sx={{ color: '#34C759', fontWeight: 500, textAlign: 'right' }}
        >
          {formatBytes(process.memoryUsage)}
        </Typography>

        {/* Status chip */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={process.status}
            size="small"
            sx={{
              background: `${color}18`,
              color,
              border: `1px solid ${color}35`,
              fontSize: 10,
              height: 20,
              fontWeight: 500,
            }}
          />
        </Box>

        {/* Kill button */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={text.killTooltip(process.pid)} placement="left">
            <IconButton
              size="small"
              onClick={() => onKill(process.pid)}
              sx={{
                color: 'rgba(255,59,48,0.7)',
                p: '3px',
                '&:hover': { color: '#FF3B30', background: 'rgba(255,59,48,0.12)' },
              }}
            >
              <KillIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  },
);

export const ProcessPanel: React.FC<ProcessPanelProps> = React.memo(
  ({ processes, processCount, locale }) => {
    const text = i18n[locale].process;
    const parentRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleKill = useCallback(async (pid: number) => {
      const result = await window.systemInfo.killProcess(pid);
      if (result?.error) console.error(`Kill PID ${pid} failed:`, result.error);
    }, []);

    const sortedProcesses = useMemo(
      () => [...processes].sort((a, b) => b.memoryUsage - a.memoryUsage),
      [processes],
    );

    const filteredProcesses = useMemo(() => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return sortedProcesses;

      return sortedProcesses.filter((process) => {
        const pidMatched = process.pid.toString().includes(query);
        const nameMatched = process.name.toLowerCase().includes(query);
        return pidMatched || nameMatched;
      });
    }, [searchTerm, sortedProcesses]);

    const rowVirtualizer = useVirtualizer({
      count: filteredProcesses.length,
      getScrollElement: () => parentRef.current,
      // Fixed row height → O(1) scroll math, no measurement needed
      estimateSize: () => ROW_HEIGHT,
      // Pre-render 5 rows above/below visible area to hide any rendering latency
      overscan: 5,
    });

    return (
      <Card sx={{ height: '100%', border: 'none' }}>
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: '20px !important',
          }}
        >
          {/* Panel header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1.5}
            sx={{ flexShrink: 0, pointerEvents: 'none' }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <ProcessIcon sx={{ fontSize: 20, color: '#007AFF' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
                {text.title}
              </Typography>
            </Box>
            <Chip
              label={`${processCount} ${text.total}`}
              size="small"
              sx={{
                background: 'rgba(0,122,255,0.12)',
                color: '#007AFF',
                border: '1px solid rgba(0,122,255,0.2)',
                fontWeight: 500,
                fontSize: 11,
              }}
            />
          </Box>

          <TextField
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={text.searchPlaceholder}
            size="small"
            fullWidth
            sx={{ mb: 1.5, flexShrink: 0 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'rgba(235,235,245,0.55)' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm.trim() ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={text.clearSearchAria}
                    edge="end"
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{ color: 'rgba(235,235,245,0.55)' }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />

          {/* Column headers — sticky, no scroll */}
          <Box
            display="grid"
            sx={{
              gridTemplateColumns: COL_TEMPLATE,
              px: 1,
              pb: 0.75,
              mb: 0.5,
              flexShrink: 0,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          >
            <Typography sx={HEADER_CELL_SX}>PID</Typography>
            <Typography sx={HEADER_CELL_SX}>{text.name}</Typography>
            <Typography sx={{ ...HEADER_CELL_SX, textAlign: 'right' }}>{text.memory}</Typography>
            <Typography sx={{ ...HEADER_CELL_SX, textAlign: 'center' }}>{text.status}</Typography>
            <Box />
          </Box>

          {/* Virtual scroll viewport */}
          <Box ref={parentRef} sx={SCROLL_SX}>
            {/*
              Total height spacer: tells the browser the full scroll extent.
              Items are absolutely positioned inside via transform:translateY —
              exactly the pattern used by VSCode's editor for zero-layout-cost scrolling.
            */}
            <Box sx={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <ProcessRow
                  key={virtualRow.key}
                  process={filteredProcesses[virtualRow.index]}
                  searchTerm={searchTerm}
                  onKill={handleKill}
                  locale={locale}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                />
              ))}
            </Box>
          </Box>

          {processes.length === 0 && (
            <Box textAlign="center" py={4} sx={{ pointerEvents: 'none' }}>
              <Typography variant="body2" color="text.secondary">
                {text.noProcessInfo}
              </Typography>
            </Box>
          )}

          {processes.length > 0 && filteredProcesses.length === 0 && (
            <Box textAlign="center" py={4} sx={{ pointerEvents: 'none' }}>
              <Typography variant="body2" color="text.secondary">
                {text.noMatchingProcesses}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  },
);
