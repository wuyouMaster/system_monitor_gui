import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Grid } from '@mui/material';
import { Memory as MemoryIcon } from '@mui/icons-material';
import { i18n, type Locale } from '../i18n';

interface MemoryInfoProps {
  locale: Locale;
  memory: {
    total: number;
    available: number;
    used: number;
    free: number;
    usagePercent: number;
  };
}

const STAT_BOX = {
  background: 'rgba(255,255,255,0.05)',
  p: 1.5,
  borderRadius: 2,
  border: '1px solid rgba(255,255,255,0.07)',
};

export const MemoryPanel: React.FC<MemoryInfoProps> = React.memo(({ memory, locale }) => {
  const text = i18n[locale].memory;
  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const getUsageColor = (percent: number) => {
    if (percent < 60) return '#34C759';
    if (percent < 80) return '#FF9500';
    return '#FF3B30';
  };

  const color = getUsageColor(memory.usagePercent);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2.5} gap={1}>
          <MemoryIcon sx={{ fontSize: 20, color: '#007AFF' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
            {text.title}
          </Typography>
        </Box>

        <Box mb={2.5}>
          <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {text.usage}
            </Typography>
            <Typography variant="h4" sx={{ color, fontWeight: 700, letterSpacing: -0.5 }}>
              {memory.usagePercent.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={memory.usagePercent}
            sx={{
              height: 6,
              borderRadius: 3,
              '& .MuiLinearProgress-bar': { background: color },
            }}
          />
        </Box>

        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <Box sx={STAT_BOX}>
              <Typography variant="caption" color="text.secondary">
                {text.total}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                {formatBytes(memory.total)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={STAT_BOX}>
              <Typography variant="caption" color="text.secondary">
                {text.available}
              </Typography>
              <Typography variant="body1" sx={{ color: '#34C759', fontWeight: 600, mt: 0.25 }}>
                {formatBytes(memory.available)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={STAT_BOX}>
              <Typography variant="caption" color="text.secondary">
                {text.used}
              </Typography>
              <Typography variant="body1" sx={{ color: '#FF9500', fontWeight: 600, mt: 0.25 }}>
                {formatBytes(memory.used)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={STAT_BOX}>
              <Typography variant="caption" color="text.secondary">
                {text.free}
              </Typography>
              <Typography variant="body1" sx={{ color: '#007AFF', fontWeight: 600, mt: 0.25 }}>
                {formatBytes(memory.free)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});
