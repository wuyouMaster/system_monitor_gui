import type { DataSource, DataSourceSettings } from '../types/data-source';
import { DEFAULT_SETTINGS } from '../types/data-source';
import { LocalSource } from './LocalSource';
import { RemoteSource } from './RemoteSource';

const STORAGE_KEY = 'system-monitor-settings';

export function loadSettings(): DataSourceSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage cleanup errors
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: DataSourceSettings): void {
  try {
    void settings;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage cleanup errors
  }
}

export function createDataSource(settings: DataSourceSettings): DataSource {
  if (settings.type === 'remote') {
    return new RemoteSource(settings.remote);
  }
  return new LocalSource();
}
