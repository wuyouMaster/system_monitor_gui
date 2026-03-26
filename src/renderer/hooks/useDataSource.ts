import { useState, useCallback, useRef, useEffect } from 'react';
import type { DataSource, DataSourceSettings } from '../types/data-source';
import { loadSettings, saveSettings, createDataSource } from '../services';
import { RemoteSource } from '../services/RemoteSource';

export function useDataSource() {
  const [settings, setSettings] = useState<DataSourceSettings>(loadSettings);
  const sourceRef = useRef<DataSource>(createDataSource(settings));
  const [source, setSource] = useState<DataSource>(sourceRef.current);
  const [connected, setConnected] = useState(sourceRef.current.isConnected());
  const [authError, setAuthError] = useState<string | null>(null);
  // ready = false blocks Dashboard subscriptions until auth completes for remote
  const [ready, setReady] = useState(sourceRef.current.type === 'local');

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Attempt auth for remote sources on mount
  useEffect(() => {
    if (sourceRef.current.type === 'remote') {
      const remote = sourceRef.current as RemoteSource;
      remote.init().then((ok) => {
        setConnected(ok);
        setAuthError(ok ? null : 'Authentication failed');
        setReady(true); // allow Dashboard to subscribe regardless — it will get errors if !ok
      });
    }
  }, []);

  const switchSource = useCallback(
    async (newSettings: DataSourceSettings): Promise<string | null> => {
      // Destroy old source
      sourceRef.current.destroy();

      // Create new source
      const newSource = createDataSource(newSettings);

      setReady(false);

      // If remote, attempt auth
      if (newSource.type === 'remote') {
        const remote = newSource as RemoteSource;
        const ok = await remote.init();
        if (!ok) {
          newSource.destroy();
          setAuthError('Authentication failed — check credentials');
          setConnected(false);
          setReady(true);
          return 'Authentication failed — check credentials';
        }
      }

      // Persist and apply
      saveSettings(newSettings);
      sourceRef.current = newSource;
      setSettings(newSettings);
      setSource(newSource);
      setConnected(newSource.isConnected());
      setAuthError(null);
      setReady(true);
      return null;
    },
    [],
  );

  const testConnection = useCallback(
    async (testSettings: DataSourceSettings): Promise<string | null> => {
      if (testSettings.type === 'local') return null;
      const testSource = new RemoteSource(testSettings.remote);
      const ok = await testSource.init();
      testSource.destroy();
      return ok ? null : 'Connection failed — check URL and credentials';
    },
    [],
  );

  return { source, settings, connected, authError, ready, switchSource, testConnection };
}
