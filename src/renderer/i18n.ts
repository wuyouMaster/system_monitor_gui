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
      tabTrace: string;
      tabEstablishedShort: string;
      tabMounts: string;
      tabTotal: string;
      tabEvents: string;
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
  trace: {
    title: string;
    live: string;
    events: string;
    health: string;
    alerts: string;
    alertsHint: string;
    latency: string;
    searchPlaceholder: string;
    typeLabels: {
      all: string;
      cpu: string;
      memory: string;
      io: string;
      network: string;
      spawn: string;
    };
    severityLabels: {
      low: string;
      medium: string;
      high: string;
    };
    delta: string;
    duration: string;
    noEvents: string;
    focusTitle: string;
    focusProcess: string;
    focusAuto: string;
    controls: string;
    start: string;
    pause: string;
    insights: string;
    insightItems: { title: string; detail: string }[];
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
      tabTrace: 'Process Trace',
      tabEstablishedShort: 'est.',
      tabMounts: 'mounts',
      tabTotal: 'total',
      tabEvents: 'events',
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
    trace: {
      title: 'Process Trace',
      live: 'Live',
      events: 'events',
      health: 'Trace health',
      alerts: 'Alerts',
      alertsHint: 'High severity in last 5 min',
      latency: 'Ingest latency',
      searchPlaceholder: 'Search process or event details',
      typeLabels: {
        all: 'All types',
        cpu: 'CPU',
        memory: 'Memory',
        io: 'Disk I/O',
        network: 'Network',
        spawn: 'Spawn',
      },
      severityLabels: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },
      delta: 'Delta',
      duration: 'Duration',
      noEvents: 'No trace events match your filters',
      focusTitle: 'Focus target',
      focusProcess: 'WindowServer spike',
      focusAuto: 'Auto focus',
      controls: 'Capture controls',
      start: 'Start',
      pause: 'Pause',
      insights: 'Insights',
      insightItems: [
        { title: 'GPU bursts every 45s', detail: 'Likely tied to desktop animation cycles.' },
        { title: 'Memory climb on Chrome', detail: 'Consider checking extension allocations.' },
        { title: 'Network jitter stabilized', detail: 'Zoom uplink recovered after 3 spikes.' },
      ],
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
      tabTrace: '进程追踪',
      tabEstablishedShort: '已建立',
      tabMounts: '挂载点',
      tabTotal: '总计',
      tabEvents: '事件',
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
    trace: {
      title: '进程追踪',
      live: '实时',
      events: '事件',
      health: '追踪健康度',
      alerts: '告警',
      alertsHint: '近 5 分钟高严重度',
      latency: '采集延迟',
      searchPlaceholder: '搜索进程或事件详情',
      typeLabels: {
        all: '全部类型',
        cpu: 'CPU',
        memory: '内存',
        io: '磁盘 I/O',
        network: '网络',
        spawn: '创建进程',
      },
      severityLabels: {
        low: '低',
        medium: '中',
        high: '高',
      },
      delta: '变化',
      duration: '持续',
      noEvents: '没有匹配的追踪事件',
      focusTitle: '关注目标',
      focusProcess: 'WindowServer 峰值',
      focusAuto: '自动聚焦',
      controls: '采集控制',
      start: '开始',
      pause: '暂停',
      insights: '洞察',
      insightItems: [
        { title: 'GPU 峰值每 45 秒出现', detail: '可能与桌面动画周期有关。' },
        { title: 'Chrome 内存持续上升', detail: '建议检查扩展占用情况。' },
        { title: '网络抖动趋于稳定', detail: 'Zoom 上行在 3 次峰值后恢复。' },
      ],
    },
  },
};
