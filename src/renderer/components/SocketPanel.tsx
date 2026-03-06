import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { Router as SocketIcon } from '@mui/icons-material';

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

const STAT_BOX = {
  background: 'rgba(255,255,255,0.05)',
  p: 1.5,
  borderRadius: 2,
  border: '1px solid rgba(255,255,255,0.07)',
  textAlign: 'center' as const,
};

const StatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <Box sx={STAT_BOX}>
    <Typography variant="h5" sx={{ color, fontWeight: 700, letterSpacing: -0.3 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

export const SocketPanel: React.FC<SocketPanelProps> = React.memo(({ socketSummary, connections }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2.5} gap={1}>
          <SocketIcon sx={{ fontSize: 20, color: '#007AFF' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
            Network
          </Typography>
        </Box>

        <Grid container spacing={1.5} mb={2.5}>
          <Grid item xs={4}>
            <StatBox label="Total" value={socketSummary.total} color="#5AC8FA" />
          </Grid>
          <Grid item xs={4}>
            <StatBox label="Established" value={socketSummary.established} color="#34C759" />
          </Grid>
          <Grid item xs={4}>
            <StatBox label="Listening" value={socketSummary.listen} color="#5856D6" />
          </Grid>
          <Grid item xs={6}>
            <StatBox label="Time Wait" value={socketSummary.timeWait} color="#FF9500" />
          </Grid>
          <Grid item xs={6}>
            <StatBox label="Close Wait" value={socketSummary.closeWait} color="#FF3B30" />
          </Grid>
        </Grid>

        <Typography
          variant="caption"
          sx={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500, display: 'block', mb: 1 }}
        >
          Recent Connections
        </Typography>

        <Box
          sx={{
            maxHeight: 160,
            overflow: 'auto',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
            },
          }}
        >
          {connections.slice(0, 8).map((conn, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.75,
                px: 1.5,
                borderRadius: 1.5,
                mb: 0.5,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                '&:hover': { background: 'rgba(255,255,255,0.06)' },
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: conn.protocol.toLowerCase().includes('tcp') ? '#34C759' : '#5856D6',
                    fontWeight: 600,
                    display: 'block',
                    lineHeight: 1.3,
                  }}
                >
                  {conn.protocol.toUpperCase()}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(235,235,245,0.45)', fontSize: 10 }}
                >
                  {conn.localAddr}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography
                  variant="caption"
                  sx={{ color: '#FF9500', fontSize: 10, display: 'block', lineHeight: 1.3 }}
                >
                  {conn.state}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(235,235,245,0.3)', fontSize: 9 }}
                >
                  PID {conn.pid}
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
});
