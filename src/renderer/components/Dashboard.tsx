import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { MemoryPanel } from './MemoryPanel';
import { CpuPanel } from './CpuPanel';
import { DiskPanel } from './DiskPanel';
import { SocketPanel } from './SocketPanel';
import { ProcessPanel } from './ProcessPanel';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const summary = await window.systemInfo.getSystemSummary();
      setData(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Box textAlign="center">
          <CircularProgress sx={{ color: '#007AFF' }} size={40} thickness={3} />
          <Typography
            variant="body2"
            sx={{ mt: 2, color: 'rgba(235,235,245,0.6)', fontWeight: 400 }}
          >
            Loading system info…
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid rgba(255,59,48,0.3)',
            background: 'rgba(255,59,48,0.08)',
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Typography variant="h6" sx={{ color: '#FF3B30', mb: 1, fontWeight: 600 }}>
            Unable to load
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box mb={4} pt={1}>
        <Typography
          variant="h4"
          sx={{
            color: '#FFFFFF',
            fontWeight: 700,
            letterSpacing: -0.5,
          }}
        >
          System Monitor
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Real-time resource monitoring
        </Typography>
      </Box>

      {/* Top Row: Memory, CPU, Network */}
      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2.5} mb={2.5}>
        <MemoryPanel memory={data?.memory || {}} />
        <CpuPanel cpu={data?.cpu || {}} cpuUsage={data?.cpuUsage || []} />
        <SocketPanel
          socketSummary={data?.socketSummary || {}}
          connections={data?.connections || []}
        />
      </Box>

      {/* Bottom Row: Disk, Processes */}
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2.5}>
        <DiskPanel disks={data?.disks || []} />
        <ProcessPanel
          processes={data?.processes || []}
          processCount={data?.processCount || 0}
        />
      </Box>

      {/* Footer */}
      <Box mt={3} textAlign="center">
        <Typography variant="caption" sx={{ color: 'rgba(235,235,245,0.3)' }}>
          Powered by Rust · Electron · React · Updates every 2s
        </Typography>
      </Box>
    </Box>
  );
};
