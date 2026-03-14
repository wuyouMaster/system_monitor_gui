import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  Storage as DiskIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ExpandRightIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { i18n, type Locale } from '../i18n';

interface DiskPanelProps {
  locale: Locale;
  disks: {
    device: string;
    mountPoint: string;
    fsType: string;
    totalBytes: number;
    usedBytes: number;
    availableBytes: number;
    usagePercent: number;
  }[];
}

interface DirEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
}

export const DiskPanel: React.FC<DiskPanelProps> = React.memo(({ disks, locale }) => {
  const text = i18n[locale].disk;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [children, setChildren] = useState<Record<string, { loading: boolean; error?: string; entries: DirEntry[] }>>({});

  const normalizedDisks = useMemo(
    () => disks.map((disk) => ({ ...disk, mountPoint: disk.mountPoint || disk.device })),
    [disks],
  );

  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
    if (gb >= 1000) return `${(gb / 1024).toFixed(2)} TB`;
    return `${gb.toFixed(2)} GB`;
  };

  const formatEntrySize = (bytes: number) => {
    if (bytes <= 0) return '—';
    const mb = bytes / 1024 / 1024;
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    if (kb >= 1) return `${kb.toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const getUsageColor = (percent: number) => {
    if (percent < 60) return '#34C759';
    if (percent < 80) return '#FF9500';
    return '#FF3B30';
  };

  const togglePath = async (path: string) => {
    const isOpen = !!expanded[path];
    
    setExpanded(prev => ({ ...prev, [path]: !isOpen }));
    
    if (!isOpen && !children[path]) {
      setChildren(prev => ({
        ...prev,
        [path]: { loading: true, entries: [] },
      }));
      try {
        const result = await window.systemInfo.listDir(path);
        const entries = result?.entries ?? [];
        const error = result?.error;
        setChildren(prev => ({
          ...prev,
          [path]: {
            loading: false,
            entries,
            error,
          },
        }));
      } catch (err) {
        setChildren(prev => ({
          ...prev,
          [path]: { loading: false, entries: [], error: String(err) },
        }));
      }
    }
  };

  const renderChildren = (path: string, depth: number) => {
    const state = children[path];
    if (!state) return null;
    if (state.loading) {
      return (
        <Box display="flex" alignItems="center" gap={1} py={0.5} pl={depth * 14}>
          <CircularProgress size={14} />
          <Typography variant="caption" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      );
    }
    if (state.error) {
      return (
        <Typography variant="caption" color="error" sx={{ pl: depth * 14 }}>
          Error: {state.error}
        </Typography>
      );
    }
    if (state.entries.length === 0) {
      return (
        <Typography variant="caption" color="text.secondary" sx={{ pl: depth * 14 }}>
          Empty
        </Typography>
      );
    }
    return (
      <Box>
        {state.entries.map((entry) => {
          const entryKey = `${path}/${entry.name}`;
          return (
            <Box key={entryKey}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ py: 0.35 }}
              >
                <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                  {entry.isDir ? (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePath(entryKey);
                      }}
                      sx={{ 
                        color: 'rgba(235,235,245,0.7)', 
                        p: '2px',
                        pointerEvents: 'auto',
                        zIndex: 10,
                      }}
                      disableRipple
                    >
                      {expanded[entryKey] ? (
                        <ExpandMoreIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <ExpandRightIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  ) : (
                    <Box sx={{ width: 24 }} />
                  )}
                  {entry.isDir ? (
                    <FolderIcon sx={{ fontSize: 16, color: '#5AC8FA' }} />
                  ) : (
                    <FileIcon sx={{ fontSize: 14, color: 'rgba(235,235,245,0.6)' }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(235,235,245,0.8)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.name}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {entry.isDir ? 'DIR' : formatEntrySize(entry.size)}
                </Typography>
              </Box>
              {entry.isDir && (
                <Collapse in={!!expanded[entryKey]} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 2, py: 0.4 }}>
                    {renderChildren(entryKey, depth + 1)}
                  </Box>
                </Collapse>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%', border: 'none' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2.5} gap={1}>
          <DiskIcon sx={{ fontSize: 20, color: '#007AFF' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
            {text.title}
          </Typography>
        </Box>

        <TableContainer sx={{ pointerEvents: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12, width: 36 }} />
                <TableCell sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}>
                  {text.mount}
                </TableCell>
                <TableCell
                  sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}
                  align="right"
                >
                  {text.used}
                </TableCell>
                <TableCell
                  sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}
                  align="right"
                >
                  {text.total}
                </TableCell>
                <TableCell
                  sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}
                  align="right"
                >
                  {text.usage}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {normalizedDisks.map((disk, index) => (
                <React.Fragment key={index}>
                  <TableRow sx={{ pointerEvents: 'auto' }}>
                    <TableCell sx={{ width: 36 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[DiskPanel] expand button clicked for:', disk.mountPoint);
                          togglePath(disk.mountPoint);
                        }}
                        sx={{ 
                          color: 'rgba(235,235,245,0.7)',
                          pointerEvents: 'auto',
                          zIndex: 10,
                        }}
                        disableRipple
                      >
                        {expanded[disk.mountPoint] ? (
                          <ExpandMoreIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <ExpandRightIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {disk.mountPoint}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {disk.fsType}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: '#FF9500', fontWeight: 500 }}>
                        {formatBytes(disk.usedBytes)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {formatBytes(disk.totalBytes)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                        <Box width={64}>
                          <LinearProgress
                            variant="determinate"
                            value={disk.usagePercent}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              '& .MuiLinearProgress-bar': {
                                background: getUsageColor(disk.usagePercent),
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: getUsageColor(disk.usagePercent),
                            fontWeight: 600,
                            minWidth: 40,
                            textAlign: 'right',
                          }}
                        >
                          {disk.usagePercent.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0, borderBottom: 'none' }}>
                      <Collapse in={!!expanded[disk.mountPoint]} timeout="auto" unmountOnExit>
                        <Box sx={{ pl: 4, pr: 2, py: 1 }}>
                          {renderChildren(disk.mountPoint, 0)}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {disks.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              {text.noDiskInfo}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});
