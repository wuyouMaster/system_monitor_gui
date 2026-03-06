declare global {
  interface Window {
    systemInfo: {
      // Push subscriptions — main process sends these on a timer.
      // Each returns an unsubscribe callback.
      onFastData:    (cb: (d: { memory: any; cpu: any; cpuUsage: number[] }) => void) => () => void;
      onSlowData:    (cb: (d: { disks: any[]; socketSummary: any; connections: any[] }) => void) => () => void;
      onProcessData: (cb: (d: { processes: any[]; processCount: number }) => void) => () => void;
    };
  }
}

export {};
