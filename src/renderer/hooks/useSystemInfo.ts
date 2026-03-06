import { useState, useEffect, useCallback } from 'react';

export function useSystemInfo(refreshInterval: number = 2000) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const summary = await window.systemInfo.getSystemSummary();
      setData(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refresh: fetchData };
}

export function useMemoryInfo(refreshInterval: number = 1000) {
  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const info = await window.systemInfo.getMemoryInfo();
        setMemory(info);
      } catch (err) {
        console.error('Failed to fetch memory info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemory();
    const interval = setInterval(fetchMemory, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { memory, loading };
}

export function useCpuUsage(refreshInterval: number = 1000) {
  const [cpuUsage, setCpuUsage] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const usage = await window.systemInfo.getCpuUsage(0.5);
        setCpuUsage(usage);
      } catch (err) {
        console.error('Failed to fetch CPU usage:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { cpuUsage, loading };
}
