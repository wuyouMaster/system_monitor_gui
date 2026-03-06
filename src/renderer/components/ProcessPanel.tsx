import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { ViewList as ProcessIcon } from '@mui/icons-material';

interface ProcessPanelProps {
  processes: {
    pid: number;
    name: string;
    command: string;
    status: string;
    memoryUsage: number;
  }[];
  processCount: number;
}

export const ProcessPanel: React.FC<ProcessPanelProps> = ({ processes, processCount }) => {
  const formatBytes = (bytes: number) => {
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

  const sortedProcesses = [...processes].sort((a, b) => b.memoryUsage - a.memoryUsage);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <ProcessIcon sx={{ fontSize: 20, color: '#007AFF' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
              Processes
            </Typography>
          </Box>
          <Chip
            label={`${processCount} total`}
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

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}>
                  PID
                </TableCell>
                <TableCell sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}>
                  Name
                </TableCell>
                <TableCell
                  sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}
                  align="right"
                >
                  Memory
                </TableCell>
                <TableCell
                  sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}
                  align="center"
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProcesses.slice(0, 15).map((process) => (
                <TableRow key={process.pid}>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ color: '#5856D6', fontFamily: 'monospace', fontWeight: 500 }}
                    >
                      {process.pid}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {process.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: 9,
                        maxWidth: 200,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {process.command.substring(0, 60)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: '#34C759', fontWeight: 500 }}>
                      {formatBytes(process.memoryUsage)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={process.status}
                      size="small"
                      sx={{
                        background: `${getStatusColor(process.status)}18`,
                        color: getStatusColor(process.status),
                        border: `1px solid ${getStatusColor(process.status)}35`,
                        fontSize: 10,
                        height: 20,
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {processes.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No process information available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
