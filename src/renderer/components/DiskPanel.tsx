import React from 'react';
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
} from '@mui/material';
import { Storage as DiskIcon } from '@mui/icons-material';

interface DiskPanelProps {
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

export const DiskPanel: React.FC<DiskPanelProps> = React.memo(({ disks }) => {
  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
    if (gb >= 1000) return `${(gb / 1024).toFixed(2)} TB`;
    return `${gb.toFixed(2)} GB`;
  };

  const getUsageColor = (percent: number) => {
    if (percent < 60) return '#34C759';
    if (percent < 80) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2.5} gap={1}>
          <DiskIcon sx={{ fontSize: 20, color: '#007AFF' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
            Disk
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}>
                  Mount
                </TableCell>
                <TableCell
                  sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}
                  align="right"
                >
                  Used
                </TableCell>
                <TableCell
                  sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}
                  align="right"
                >
                  Total
                </TableCell>
                <TableCell
                  sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, fontSize: 12 }}
                  align="right"
                >
                  Usage
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {disks.map((disk, index) => (
                <TableRow key={index}>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {disks.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No disk information available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});
