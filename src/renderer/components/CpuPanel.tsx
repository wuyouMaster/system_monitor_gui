import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { Memory as CpuIcon } from '@mui/icons-material';
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

export const CpuPanel: React.FC<CpuPanelProps> = ({ cpu, cpuUsage }) => {
  const chartData = cpuUsage.map((usage, index) => ({
    core: `C${index}`,
    usage,
  }));

  const avgUsage = cpuUsage.length > 0 
    ? cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length 
    : 0;

  const getUsageColor = (percent: number) => {
    if (percent < 50) return '#00ff88';
    if (percent < 75) return '#ffaa00';
    return '#ff3366';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <CpuIcon sx={{ fontSize: 32, color: '#00f0ff', mr: 1 }} />
          <Typography variant="h5" sx={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>
            CPU
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {cpu.modelName}
        </Typography>
        
        <Grid container spacing={2} mb={2}>
          <Grid item xs={4}>
            <Box sx={{ background: 'rgba(0,240,255,0.05)', p: 1.5, borderRadius: 2, border: '1px solid rgba(0,240,255,0.2)' }}>
              <Typography variant="caption" color="text.secondary">Physical</Typography>
              <Typography variant="h6" sx={{ color: '#00f0ff' }}>{cpu.physicalCores}</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ background: 'rgba(255,0,255,0.05)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,0,255,0.2)' }}>
              <Typography variant="caption" color="text.secondary">Logical</Typography>
              <Typography variant="h6" sx={{ color: '#ff00ff' }}>{cpu.logicalCores}</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ background: 'rgba(0,255,136,0.05)', p: 1.5, borderRadius: 2, border: '1px solid rgba(0,255,136,0.2)' }}>
              <Typography variant="caption" color="text.secondary">Frequency</Typography>
              <Typography variant="h6" sx={{ color: '#00ff88' }}>{(cpu.frequencyMhz / 1000).toFixed(2)} GHz</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box mb={1}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">Avg Usage</Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: getUsageColor(avgUsage),
                textShadow: `0 0 10px ${getUsageColor(avgUsage)}80`,
              }}
            >
              {avgUsage.toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        <Box sx={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="core" 
                stroke="#666"
                tick={{ fill: '#8888aa', fontSize: 10 }}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#666"
                tick={{ fill: '#8888aa', fontSize: 10 }}
              />
              <Line 
                type="monotone" 
                dataKey="usage" 
                stroke="#00f0ff"
                strokeWidth={2}
                dot={{ fill: '#00f0ff', r: 3 }}
                activeDot={{ r: 6, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};
