import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
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
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return '#00ff88';
      case 'sleeping': return '#00f0ff';
      case 'stopped': return '#ffaa00';
      case 'zombie': return '#ff3366';
      default: return '#8888aa';
    }
  };

  const sortedProcesses = [...processes].sort((a, b) => b.memoryUsage - a.memoryUsage);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <ProcessIcon sx={{ fontSize: 32, color: '#00f0ff', mr: 1 }} />
            <Typography variant="h5" sx={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>
              PROCESSES
            </Typography>
          </Box>
          <Chip 
            label={`${processCount} total`}
            sx={{ 
              background: 'rgba(0,240,255,0.1)', 
              color: '#00f0ff',
              border: '1px solid rgba(0,240,255,0.3)',
            }}
            size="small"
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#00f0ff', fontWeight: 600 }}>PID</TableCell>
                <TableCell sx={{ color: '#00f0ff', fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ color: '#00f0ff', fontWeight: 600 }} align="right">Memory</TableCell>
                <TableCell sx={{ color: '#00f0ff', fontWeight: 600 }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProcesses.slice(0, 15).map((process) => (
                <TableRow key={process.pid} sx={{ '&:hover': { backgroundColor: 'rgba(0,240,255,0.08)' } }}>
                  <TableCell>
                    <Typography sx={{ color: '#ff00ff', fontFamily: 'monospace', fontWeight: 600 }}>
                      {process.pid}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                        {process.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {process.command.substring(0, 50)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ color: '#00ff88', fontWeight: 600 }}>
                      {formatBytes(process.memoryUsage)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={process.status}
                      size="small"
                      sx={{ 
                        background: `${getStatusColor(process.status)}15`,
                        color: getStatusColor(process.status),
                        border: `1px solid ${getStatusColor(process.status)}40`,
                        fontSize: 10,
                        height: 20,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {processes.length === 0 && (
          <Box textAlign="center" py={3}>
            <Typography color="text.secondary">No process information available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
