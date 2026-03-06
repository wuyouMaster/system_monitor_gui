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
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        sx={{
          background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.1) 0%, transparent 70%)',
        }}
      >
        <Box textAlign="center">
          <CircularProgress 
            sx={{ 
              color: '#00f0ff',
              boxShadow: '0 0 20px rgba(0,240,255,0.5)',
            }} 
            size={60} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              mt: 2, 
              color: '#00f0ff',
              textShadow: '0 0 10px rgba(0,240,255,0.5)',
              animation: 'glow 2s ease-in-out infinite',
            }}
          >
            INITIALIZING SYSTEM MONITOR...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Box 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            border: '1px solid #ff3366',
            background: 'rgba(255,51,102,0.1)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ color: '#ff3366', mb: 2 }}>
            SYSTEM ERROR
          </Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={4} textAlign="center">
        <Typography 
          variant="h3" 
          sx={{ 
            color: '#00f0ff',
            textShadow: '0 0 20px rgba(0,240,255,0.5), 0 0 40px rgba(0,240,255,0.3)',
            mb: 1,
            letterSpacing: 4,
          }}
        >
          SYSTEM MONITOR
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 2 }}>
          REAL-TIME SYSTEM RESOURCE MONITORING
        </Typography>
      </Box>

      {/* Top Row: Memory, CPU, Network */}
      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={3} mb={3}>
        <MemoryPanel memory={data?.memory || {}} />
        <CpuPanel cpu={data?.cpu || {}} cpuUsage={data?.cpuUsage || []} />
        <SocketPanel 
          socketSummary={data?.socketSummary || {}} 
          connections={data?.connections || []} 
        />
      </Box>

      {/* Bottom Row: Disk, Processes */}
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={3}>
        <DiskPanel disks={data?.disks || []} />
        <ProcessPanel 
          processes={data?.processes || []} 
          processCount={data?.processCount || 0} 
        />
      </Box>

      {/* Footer */}
      <Box mt={4} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          Powered by Rust + Electron + React | Update Interval: 2s
        </Typography>
      </Box>
    </Box>
  );
};
