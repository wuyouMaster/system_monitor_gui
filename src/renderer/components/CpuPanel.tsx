import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { DeveloperBoard as CpuIcon } from '@mui/icons-material';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface CpuPanelProps {
  cpu: {
    physicalCores: number;
    logicalCores: number;
    modelName: string;
    vendor: string;
    frequencyMhz: number;
  };
  cpuUsage: number[];
}

const STAT_BOX = {
  background: 'rgba(255,255,255,0.05)',
  p: 1.5,
  borderRadius: 2,
  border: '1px solid rgba(255,255,255,0.07)',
  pointerEvents: 'none' as const,
};

// pointer-events none on chart: Tooltip removed; no mousemove handlers needed
const CHART_BOX_SX = { height: 110, pointerEvents: 'none' } as const;

const getUsageColor = (percent: number) => {
  if (percent < 60) return '#34C759';
  if (percent < 80) return '#FF9500';
  return '#FF3B30';
};

export const CpuPanel: React.FC<CpuPanelProps> = React.memo(({ cpu, cpuUsage }) => {
  // Filter out NaN/Infinity values that can appear when the CPU sampling
  // period is too short (macOS mach APIs need ≥ ~0.3s for valid readings).
  const validUsage = useMemo(
    () => cpuUsage.filter((v) => Number.isFinite(v)),
    [cpuUsage],
  );

  const chartData = useMemo(
    () => validUsage.map((usage, index) => ({ core: `C${index}`, usage })),
    [validUsage],
  );

  const avgUsage = useMemo(
    () => (validUsage.length > 0 ? validUsage.reduce((a, b) => a + b, 0) / validUsage.length : 0),
    [validUsage],
  );

  const color = getUsageColor(avgUsage);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2.5} gap={1} sx={{ pointerEvents: 'none' }}>
          <CpuIcon sx={{ fontSize: 20, color: '#007AFF' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
            CPU
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pointerEvents: 'none' }}>
          {cpu.modelName}
        </Typography>

        <Grid container spacing={1.5} mb={2}>
          <Grid item xs={4}>
            <Box sx={STAT_BOX}>
              <Typography variant="caption" color="text.secondary">
                Physical
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                {cpu.physicalCores}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={STAT_BOX}>
              <Typography variant="caption" color="text.secondary">
                Logical
              </Typography>
              <Typography variant="body1" sx={{ color: '#5856D6', fontWeight: 600, mt: 0.25 }}>
                {cpu.logicalCores}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={STAT_BOX}>
              <Typography variant="caption" color="text.secondary">
                Freq
              </Typography>
              <Typography variant="body1" sx={{ color: '#5AC8FA', fontWeight: 600, mt: 0.25 }}>
                {(cpu.frequencyMhz / 1000).toFixed(2)} GHz
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box
          mb={1.5}
          display="flex"
          justifyContent="space-between"
          alignItems="baseline"
          sx={{ pointerEvents: 'none' }}
        >
          <Typography variant="body2" color="text.secondary">
            Avg Usage
          </Typography>
          <Typography variant="h5" sx={{ color, fontWeight: 700, letterSpacing: -0.3 }}>
            {avgUsage.toFixed(1)}%
          </Typography>
        </Box>

        {/*
          Tooltip removed: it attaches a mousemove listener that caused ~36ms pointermove longtasks.
          pointer-events: none on the chart wrapper prevents any hit-testing inside the SVG.
          isAnimationActive={false} on Line prevents JS animation frames during data updates.
        */}
        <Box sx={CHART_BOX_SX}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="core"
                stroke="transparent"
                tick={{ fill: 'rgba(235,235,245,0.4)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="transparent"
                tick={{ fill: 'rgba(235,235,245,0.4)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#007AFF"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
});
