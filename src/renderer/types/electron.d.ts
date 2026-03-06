declare global {
  interface Window {
    systemInfo: {
      getSystemSummary: () => Promise<any>;
      getMemoryInfo: () => Promise<any>;
      getCpuInfo: () => Promise<any>;
      getCpuUsage: (duration?: number) => Promise<number[]>;
      getDisks: () => Promise<any[]>;
      getSocketSummary: () => Promise<any>;
      getProcesses: () => Promise<any[]>;
      getConnections: () => Promise<any[]>;
    };
  }
}

export {};
