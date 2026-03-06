import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Grid } from '@mui/material';
import { Memory as MemoryIcon } from '@mui/icons-material';

interface MemoryInfoProps {
  memory: {
    total: number;
    available: number;
    used: number;
    free: number;
    usagePercent: number;
  };
}

export const MemoryPanel: React.FC<MemoryInfoProps> = ({ memory }) => {
  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
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
          <MemoryIcon sx={{ fontSize: 32, color: '#00f0ff', mr: 1 }} />
          <Typography variant="h5" sx={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>
            MEMORY
          </Typography>
        </Box>

        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">Usage</Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                color: getUsageColor(memory.usagePercent),
                textShadow: `0 0 10px ${getUsageColor(memory.usagePercent)}80`,
                fontWeight: 700,
              }}
            >
              {memory.usagePercent.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={memory.usagePercent}
            sx={{ 
              height: 12, 
              borderRadius: 6,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${getUsageColor(memory.usagePercent)}, #00f0ff)`,
                boxShadow: `0 0 10px ${getUsageColor(memory.usagePercent)}`,
              },
            }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ background: 'rgba(0,240,255,0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(0,240,255,0.2)' }}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="h6" sx={{ color: '#fff' }}>{formatBytes(memory.total)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ background: 'rgba(0,255,136,0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(0,255,136,0.2)' }}>
              <Typography variant="caption" color="text.secondary">Available</Typography>
              <Typography variant="h6" sx={{ color: '#00ff88' }}>{formatBytes(memory.available)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ background: 'rgba(255,170,0,0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(255,170,0,0.2)' }}>
              <Typography variant="caption" color="text.secondary">Used</Typography>
              <Typography variant="h6" sx={{ color: '#ffaa00' }}>{formatBytes(memory.used)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ background: 'rgba(0,136,255,0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(0,136,255,0.2)' }}>
              <Typography variant="caption" color="text.secondary">Free</Typography>
              <Typography variant="h6" sx={{ color: '#0088ff' }}>{formatBytes(memory.free)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
