export type Locale = 'en' | 'zh';

type I18nSchema = {
  dashboard: {
    appTitle: string;
    subtitle: string;
    loading: string;
    panels: string;
    footer: string;
    language: string;
    tabMemory: string;
    tabCpu: string;
    tabSocket: string;
    tabDisk: string;
    tabProcess: string;
    tabEstablishedShort: string;
    tabMounts: string;
    tabTotal: string;
  };
  memory: {
    title: string;
    usage: string;
    total: string;
    available: string;
    used: string;
    free: string;
  };
  cpu: {
    title: string;
    averageUsage: string;
    core: string;
    physical: string;
    logical: string;
  };
  socket: {
    title: string;
    total: string;
    established: string;
    listening: string;
    timeWait: string;
    closeWait: string;
    recentConnections: string;
    searchPlaceholder: string;
    allStatus: string;
    noConnections: string;
    noMatchingConnections: string;
    pid: string;
  };
  disk: {
    title: string;
    mount: string;
    used: string;
    total: string;
    usage: string;
    noDiskInfo: string;
  };
  process: {
    title: string;
    searchPlaceholder: string;
    clearSearchAria: string;
    name: string;
    memory: string;
    status: string;
    total: string;
    noProcessInfo: string;
    noMatchingProcesses: string;
  };
};

export const i18n: Record<Locale, I18nSchema> = {
  en: {
    dashboard: {
      appTitle: 'System Monitor',
      subtitle: 'Real-time resource monitoring',
      loading: 'Loading system info...',
      panels: 'PANELS',
      footer: 'Powered by Rust · Electron · React · CPU sampled every 1.5s',
      language: 'Language',
      tabMemory: 'Memory',
      tabCpu: 'CPU',
      tabSocket: 'Socket',
      tabDisk: 'Disk',
      tabProcess: 'Processes',
      tabEstablishedShort: 'est.',
      tabMounts: 'mounts',
      tabTotal: 'total',
    },
    memory: {
      title: 'Memory',
      usage: 'Usage',
      total: 'Total',
      available: 'Available',
      used: 'Used',
      free: 'Free',
    },
    cpu: {
      title: 'CPU',
      averageUsage: 'Average Usage',
      core: 'Core',
      physical: 'Physical',
      logical: 'Logical',
    },
    socket: {
      title: 'Network',
      total: 'Total',
      established: 'Established',
      listening: 'Listening',
      timeWait: 'Time Wait',
      closeWait: 'Close Wait',
      recentConnections: 'Recent Connections',
      searchPlaceholder: 'Search by IP or port',
      allStatus: 'All status',
      noConnections: 'No connections',
      noMatchingConnections: 'No matching connections',
      pid: 'PID',
    },
    disk: {
      title: 'Disk',
      mount: 'Mount',
      used: 'Used',
      total: 'Total',
      usage: 'Usage',
      noDiskInfo: 'No disk information available',
    },
    process: {
      title: 'Processes',
      searchPlaceholder: 'Search by PID or process name',
      clearSearchAria: 'Clear process search',
      name: 'Name',
      memory: 'Memory',
      status: 'Status',
      total: 'total',
      noProcessInfo: 'No process information available',
      noMatchingProcesses: 'No matching processes',
    },
  },
  zh: {
    dashboard: {
      appTitle: '系统监控',
      subtitle: '实时资源监控',
      loading: '正在加载系统信息...',
      panels: '面板',
      footer: '基于 Rust · Electron · React · CPU 每 1.5 秒采样',
      language: '语言',
      tabMemory: '内存',
      tabCpu: 'CPU',
      tabSocket: '网络',
      tabDisk: '磁盘',
      tabProcess: '进程',
      tabEstablishedShort: '已建立',
      tabMounts: '挂载点',
      tabTotal: '总计',
    },
    memory: {
      title: '内存',
      usage: '使用率',
      total: '总量',
      available: '可用',
      used: '已用',
      free: '空闲',
    },
    cpu: {
      title: 'CPU',
      averageUsage: '平均使用率',
      core: '核心',
      physical: '物理核',
      logical: '逻辑核',
    },
    socket: {
      title: '网络',
      total: '总计',
      established: '已建立连接',
      listening: '监听中',
      timeWait: '等待关闭',
      closeWait: '关闭等待',
      recentConnections: '最近连接',
      searchPlaceholder: '按 IP 或端口搜索',
      allStatus: '全部状态',
      noConnections: '暂无连接',
      noMatchingConnections: '没有匹配的连接',
      pid: 'PID',
    },
    disk: {
      title: '磁盘',
      mount: '挂载点',
      used: '已用',
      total: '总量',
      usage: '使用率',
      noDiskInfo: '暂无磁盘信息',
    },
    process: {
      title: '进程',
      searchPlaceholder: '按 PID 或进程名搜索',
      clearSearchAria: '清空进程搜索',
      name: '名称',
      memory: '内存',
      status: '状态',
      total: '总计',
      noProcessInfo: '暂无进程信息',
      noMatchingProcesses: '没有匹配的进程',
    },
  },
};
