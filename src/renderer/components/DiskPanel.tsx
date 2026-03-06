import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
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

export const DiskPanel: React.FC<DiskPanelProps> = ({ disks }) => {
  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
    if (gb >= 1000) {
      return `${(gb / 1024).toFixed(2)} TB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  const getUsageColor = (percent: number) => {
    if (percent < 50) return '#00ff88';
    if (percent < 75) return '#ffaa00';
    return '#ff3366';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <DiskIcon sx={{ fontSize: 32, color: '#00f0ff', mr: 1 }} />
          <Typography variant="h5" sx={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>
            DISK
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#00f0ff', fontWeight: 600 }}>Mount</TableCell>
                <TableCell sx={{ color: '#00f0ff', fontWeight: 600 }} align="right">Used</TableCell>
                <TableCell sx={{ color: '#00f0ff', fontWeight: 600 }} align="right">Total</TableCell>
                <TableCell sx={{ color: '#00f0ff', fontWeight: 600 }} align="right">Usage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {disks.map((disk, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(0,240,255,0.08)' } }}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#fff' }}>{disk.mountPoint}</Typography>
                      <Typography variant="caption" color="text.secondary">{disk.fsType}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ color: '#ffaa00' }}>{formatBytes(disk.usedBytes)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ color: '#8888aa' }}>{formatBytes(disk.totalBytes)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center" justifyContent="flex-end">
                      <Box width={80} mr={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={disk.usagePercent}
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${getUsageColor(disk.usagePercent)}, #00f0ff)`,
                            },
                          }}
                        />
                      </Box>
                      <Typography 
                        sx={{ 
                          color: getUsageColor(disk.usagePercent),
                          fontWeight: 600,
                          minWidth: 45,
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
          <Box textAlign="center" py={3}>
            <Typography color="text.secondary">No disk information available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
