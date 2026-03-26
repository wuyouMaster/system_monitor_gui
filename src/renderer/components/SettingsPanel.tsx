import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CheckCircle as ConnectedIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { DataSourceSettings, DataSourceType } from '../types/data-source';
import { DEFAULT_SETTINGS } from '../types/data-source';
import type { Locale } from '../i18n';
import { i18n } from '../i18n';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  currentSettings: DataSourceSettings;
  connected: boolean;
  onSave: (settings: DataSourceSettings) => Promise<string | null>;
  onTest: (settings: DataSourceSettings) => Promise<string | null>;
  locale: Locale;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  open,
  onClose,
  currentSettings,
  onSave,
  onTest,
  locale,
}) => {
  const text = i18n[locale].settings;

  const [sourceType, setSourceType] = useState<DataSourceType>(currentSettings.type);
  const [serverUrl, setServerUrl] = useState(currentSettings.remote.serverUrl || DEFAULT_SETTINGS.remote.serverUrl);
  const [username, setUsername] = useState(currentSettings.remote.username);
  const [password, setPassword] = useState(currentSettings.remote.password);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSourceType(currentSettings.type);
      setServerUrl(currentSettings.remote.serverUrl || DEFAULT_SETTINGS.remote.serverUrl);
      setUsername(currentSettings.remote.username);
      setPassword(currentSettings.remote.password);
      setTestResult(null);
    }
  }, [open, currentSettings]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    const settings: DataSourceSettings = {
      type: 'remote',
      remote: { serverUrl, username, password },
    };
    const error = await onTest(settings);
    setTestResult(error ? 'error' : 'success');
    setTesting(false);
  }, [serverUrl, username, password, onTest]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const settings: DataSourceSettings = {
      type: sourceType,
      remote: { serverUrl, username, password },
    };
    const error = await onSave(settings);
    setSaving(false);
    if (!error) {
      onClose();
    }
  }, [sourceType, serverUrl, username, password, onSave, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(180deg, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3,
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700, pb: 1 }}>
        {text.title}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Data source type */}
        <Typography
          variant="caption"
          sx={{ color: 'rgba(235,235,245,0.5)', letterSpacing: 0.3, mb: 1, display: 'block' }}
        >
          {text.dataSource}
        </Typography>
        <RadioGroup
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as DataSourceType)}
          sx={{ gap: 1 }}
        >
          <Box
            sx={{
              border: sourceType === 'local' ? '1px solid rgba(0,122,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              p: 1.5,
              background: sourceType === 'local' ? 'rgba(0,122,255,0.08)' : 'rgba(255,255,255,0.02)',
              transition: 'all 150ms ease-out',
            }}
          >
            <FormControlLabel
              value="local"
              control={<Radio sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: '#007AFF' } }} />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    {text.local}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(235,235,245,0.5)' }}>
                    {text.localDesc}
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
          </Box>

          <Box
            sx={{
              border: sourceType === 'remote' ? '1px solid rgba(0,122,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              p: 1.5,
              background: sourceType === 'remote' ? 'rgba(0,122,255,0.08)' : 'rgba(255,255,255,0.02)',
              transition: 'all 150ms ease-out',
            }}
          >
            <FormControlLabel
              value="remote"
              control={<Radio sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: '#007AFF' } }} />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    {text.remote}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(235,235,245,0.5)' }}>
                    {text.remoteDesc}
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
          </Box>
        </RadioGroup>

        {/* Remote configuration */}
        {sourceType === 'remote' && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <TextField
              label={text.serverUrl}
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              size="small"
              fullWidth
              placeholder="http://192.168.1.100:3030"
              InputLabelProps={{ sx: { color: 'rgba(235,235,245,0.5)' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  fontSize: 13,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                  '&.Mui-focused fieldset': { borderColor: '#007AFF' },
                },
              }}
            />
            <TextField
              label={text.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ sx: { color: 'rgba(235,235,245,0.5)' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  fontSize: 13,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                  '&.Mui-focused fieldset': { borderColor: '#007AFF' },
                },
              }}
            />
            <TextField
              label={text.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ sx: { color: 'rgba(235,235,245,0.5)' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  fontSize: 13,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                  '&.Mui-focused fieldset': { borderColor: '#007AFF' },
                },
              }}
            />

            {/* Test connection */}
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleTest}
                disabled={testing || !serverUrl || !username}
                sx={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(235,235,245,0.8)',
                  fontSize: 12,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                {testing ? text.testing : text.testConnection}
                {testing && <CircularProgress size={14} sx={{ ml: 1, color: 'rgba(235,235,245,0.5)' }} />}
              </Button>
              {testResult === 'success' && (
                <Chip
                  icon={<ConnectedIcon sx={{ fontSize: 14 }} />}
                  label={text.connected}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(52,199,89,0.15)',
                    color: '#34C759',
                    border: '1px solid rgba(52,199,89,0.3)',
                    '& .MuiChip-icon': { color: '#34C759' },
                  }}
                />
              )}
              {testResult === 'error' && (
                <Chip
                  icon={<ErrorIcon sx={{ fontSize: 14 }} />}
                  label={text.connectionFailed}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(255,59,48,0.15)',
                    color: '#FF3B30',
                    border: '1px solid rgba(255,59,48,0.3)',
                    '& .MuiChip-icon': { color: '#FF3B30' },
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'rgba(235,235,245,0.6)',
            textTransform: 'none',
            fontSize: 13,
            '&:hover': { background: 'rgba(255,255,255,0.05)' },
          }}
        >
          {text.cancel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || (sourceType === 'remote' && (!serverUrl || !username))}
          variant="contained"
          sx={{
            background: '#007AFF',
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            '&:hover': { background: '#0066D6' },
            '&.Mui-disabled': { background: 'rgba(0,122,255,0.3)', color: 'rgba(255,255,255,0.3)' },
          }}
        >
          {saving ? text.testing : text.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
