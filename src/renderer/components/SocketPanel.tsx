import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Router as SocketIcon, Search as SearchIcon } from '@mui/icons-material';
import { i18n, type Locale } from '../i18n';

interface SocketPanelProps {
  locale: Locale;
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
  pointerEvents: 'none' as const,
};

const CONN_ITEM_SX = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: 0.75,
  px: 1.5,
  borderRadius: 1.5,
  mb: 0.5,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
  // No hover effect, no pointer-events: eliminates hit-test cost
  pointerEvents: 'none',
} as const;

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

export const SocketPanel: React.FC<SocketPanelProps> = React.memo(
  ({ socketSummary, connections, locale }) => {
    const text = i18n[locale].socket;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('all');

    const stateOptions = useMemo(() => {
      const states = new Set<string>();
      connections.forEach((conn) => {
        if (conn.state) states.add(conn.state);
      });
      return Array.from(states).sort((a, b) => a.localeCompare(b));
    }, [connections]);

    const filteredConnections = useMemo(() => {
      const query = searchTerm.trim().toLowerCase();

      return connections.filter((conn) => {
        const stateMatched =
          selectedState === 'all' || conn.state.toLowerCase() === selectedState.toLowerCase();

        if (!stateMatched) return false;
        if (!query) return true;

        const localMatched = conn.localAddr.toLowerCase().includes(query);
        const remoteMatched = conn.remoteAddr.toLowerCase().includes(query);
        return localMatched || remoteMatched;
      });
    }, [connections, searchTerm, selectedState]);

    const displayedConnections = useMemo(
      () => filteredConnections.slice(0, 10),
      [filteredConnections],
    );

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            mb={2.5}
            gap={1}
            sx={{ pointerEvents: 'none' }}
          >
            <SocketIcon sx={{ fontSize: 20, color: '#007AFF' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
              {text.title}
            </Typography>
          </Box>

          <Grid container spacing={1.5} mb={2.5}>
            <Grid item xs={4}>
              <StatBox label={text.total} value={socketSummary.total} color="#5AC8FA" />
            </Grid>
            <Grid item xs={4}>
              <StatBox label={text.established} value={socketSummary.established} color="#34C759" />
            </Grid>
            <Grid item xs={4}>
              <StatBox label={text.listening} value={socketSummary.listen} color="#5856D6" />
            </Grid>
            <Grid item xs={6}>
              <StatBox label={text.timeWait} value={socketSummary.timeWait} color="#FF9500" />
            </Grid>
            <Grid item xs={6}>
              <StatBox label={text.closeWait} value={socketSummary.closeWait} color="#FF3B30" />
            </Grid>
          </Grid>

          <Typography
            variant="caption"
            sx={{
              color: 'rgba(235,235,245,0.6)',
              fontWeight: 500,
              display: 'block',
              mb: 1,
              pointerEvents: 'none',
            }}
          >
            {text.recentConnections}
          </Typography>

          <Box display="flex" gap={1.5} mb={1.5}>
            <TextField
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={text.searchPlaceholder}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'rgba(235,235,245,0.55)' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              value={selectedState}
              onChange={(event) => setSelectedState(event.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">{text.allStatus}</MenuItem>
              {stateOptions.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/*
            No nested scroll container here.
            A nested overflow:auto inside a scrolling parent creates "scroll chaining":
            the inner scroll swallows wheel events until its own boundary is hit, then
            suddenly the outer page lurches — the "weird" scroll feeling.
            Showing items inline avoids any scroll competition entirely.
          */}
          <Box sx={{ pointerEvents: 'none' }}>
            {displayedConnections.map((conn, index) => (
              <Box key={index} sx={CONN_ITEM_SX}>
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
                    {text.pid} {conn.pid}
                  </Typography>
                </Box>
              </Box>
            ))}
            {connections.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                {text.noConnections}
              </Typography>
            )}
            {connections.length > 0 && filteredConnections.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                {text.noMatchingConnections}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  },
);
