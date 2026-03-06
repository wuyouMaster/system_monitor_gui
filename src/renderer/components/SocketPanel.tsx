import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { Dns as NetworkIcon, Router as SocketIcon } from '@mui/icons-material';

interface SocketPanelProps {
  socketSummary: {
    total: number;
    established: number;
    listen: number;
    timeWait: number;
    closeWait: number;
  };
  connections: {
    protocol: string;
    localAddr: string;
    remoteAddr: string;
    state: string;
    pid: number;
  }[];
}

export const SocketPanel: React.FC<SocketPanelProps> = ({ socketSummary, connections }) => {
  const StatBox = ({ label, value, color, icon }: any) => (
    <Box 
      sx={{ 
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        p: 2, 
        borderRadius: 2, 
        border: `1px solid ${color}40`,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" sx={{ color, fontWeight: 700, textShadow: `0 0 10px ${color}80` }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <SocketIcon sx={{ fontSize: 32, color: '#00f0ff', mr: 1 }} />
          <Typography variant="h5" sx={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>
            NETWORK
          </Typography>
        </Box>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={4}>
            <StatBox label="Total" value={socketSummary.total} color="#00f0ff" />
          </Grid>
          <Grid item xs={4}>
            <StatBox label="Established" value={socketSummary.established} color="#00ff88" />
          </Grid>
          <Grid item xs={4}>
            <StatBox label="Listening" value={socketSummary.listen} color="#ff00ff" />
          </Grid>
          <Grid item xs={6}>
            <StatBox label="Time Wait" value={socketSummary.timeWait} color="#ffaa00" />
          </Grid>
          <Grid item xs={6}>
            <StatBox label="Close Wait" value={socketSummary.closeWait} color="#ff3366" />
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ color: '#00f0ff', mb: 1 }}>
          Recent Connections
        </Typography>
        
        <Box sx={{ 
          maxHeight: 150, 
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { background: 'rgba(0,240,255,0.1)' },
          '&::-webkit-scrollbar-thumb': { background: '#00f0ff', borderRadius: 2 },
        }}>
          {connections.slice(0, 8).map((conn, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                py: 1,
                px: 1.5,
                borderRadius: 1,
                mb: 0.5,
                background: 'rgba(0,240,255,0.03)',
                border: '1px solid rgba(0,240,255,0.1)',
                '&:hover': {
                  background: 'rgba(0,240,255,0.08)',
                },
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: conn.protocol.includes('tcp') ? '#00ff88' : '#ff00ff', fontWeight: 600 }}>
                  {conn.protocol.toUpperCase()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8888aa', fontSize: 10 }}>
                  {conn.localAddr}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" sx={{ color: '#ffaa00', fontSize: 10 }}>
                  {conn.state}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontSize: 9 }}>
                  PID: {conn.pid}
                </Typography>
              </Box>
            </Box>
          ))}
          {connections.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              No connections
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
