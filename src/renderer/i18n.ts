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
    killTooltip: (pid: number) => string;
  };
  trace: {
    title: string;
    live: string;
    events: string;
    health: string;
    alerts: string;
    alertsHint: string;
    memoryTrend: string;
    cpuTrend: string;
    status: string;
    emptyTitle: string;
    emptyHint: string;
    controlsHint: string;
    session: string;
    activePid: string;
    noActive: string;
    sessionHint: string;
    idleDetail: string;
    liveDetail: (pid: number) => string;
    pausedDetail: (pid: number) => string;
    commandLabel: string;
    showCommand: string;
    hideCommand: string;
    searchPlaceholder: string;
    typeLabels: {
      all: string;
      cpu: string;
      memory: string;
      io: string;
      network: string;
      spawn: string;
      queue: string;
    };
    severityLabels: {
      low: string;
      medium: string;
      high: string;
    };
    delta: string;
    duration: string;
    noEvents: string;
    prevPage: string;
    nextPage: string;
    pageLabel: (current: number, total: number) => string;
    controls: string;
    start: string;
    paused: string;
    pause: string;
    killTooltip: (pid: number) => string;
    ioTrend: string;
    read: string;
    write: string;
    netTrend: string;
    sent: string;
    recv: string;
    sockets: string;
    queueTrend: string;
    sendQueue: string;
    recvQueue: string;
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
      killTooltip: (pid: number) => `Kill PID ${pid}`,
    },
    trace: {
      title: 'Process Trace',
      live: 'Live',
      paused: 'Paused',
      events: 'events',
      health: 'Trace health',
      alerts: 'Alerts',
      alertsHint: 'High severity in last 5 min',
      memoryTrend: 'Memory trend',
      cpuTrend: 'CPU usage trend',
      ioTrend: 'Disk I/O trend',
      read: 'Read',
      write: 'Write',
      netTrend: 'Network I/O trend',
      sent: 'Sent',
      recv: 'Recv',
      sockets: 'sockets',
      queueTrend: 'Socket queue trend',
      sendQueue: 'Send Q',
      recvQueue: 'Recv Q',
      status: 'Status',
      emptyTitle: 'Start a trace to see activity',
      emptyHint: 'Enter a PID and click start to capture process activity in real time.',
      controlsHint: 'Tracing runs continuously until you pause or stop it.',
      session: 'Active session',
      activePid: 'Active PID',
      noActive: 'None',
      sessionHint: 'Captured events are kept locally on this screen.',
      idleDetail: 'No trace has started',
      liveDetail: (pid: number) => (pid ? `Streaming from PID ${pid}` : 'Streaming'),
      pausedDetail: (pid: number) => `Paused at PID ${pid}`,
      commandLabel: 'Command',
      showCommand: 'Show command',
      hideCommand: 'Hide command',
      searchPlaceholder: 'Search process or event details',
      typeLabels: {
        all: 'All types',
        cpu: 'CPU',
        memory: 'Memory',
        io: 'Disk I/O',
        network: 'Network',
        spawn: 'Spawn',
        queue: 'Waiting queue',
      },
      severityLabels: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },
      delta: 'Delta',
      duration: 'Duration',
      noEvents: 'No trace events match your filters',
      prevPage: 'Previous',
      nextPage: 'Next',
      pageLabel: (current, total) => `Page ${current} / ${total}`,
      controls: 'Capture controls',
      start: 'Start',
      pause: 'Pause',
      killTooltip: (pid) => `Kill PID ${pid}`,
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
      killTooltip: (pid: number) => `终止进程 PID ${pid}`,
    },
    trace: {
      title: '进程追踪',
      live: '实时',
      paused: '已暂停',
      events: '事件',
      health: '追踪健康度',
      alerts: '告警',
      alertsHint: '近 5 分钟高严重度',
      memoryTrend: '内存曲线',
      cpuTrend: 'CPU 使用率曲线',
      ioTrend: '磁盘 I/O 曲线',
      read: '读取',
      write: '写入',
      netTrend: '网络 I/O 曲线',
      sent: '发送',
      recv: '接收',
      sockets: '个连接',
      queueTrend: 'Socket 队列曲线',
      sendQueue: '发送队列',
      recvQueue: '接收队列',
      status: '状态',
      emptyTitle: '开始追踪以查看活动',
      emptyHint: '输入 PID 并点击开始，即可实时捕获进程活动。',
      controlsHint: '追踪会持续进行，直到你暂停或停止。',
      session: '当前会话',
      activePid: '追踪 PID',
      noActive: '无',
      sessionHint: '当前页面将保留已捕获的事件。',
      idleDetail: '尚未开始追踪',
      liveDetail: (pid: number) => (pid ? `正在追踪 PID ${pid}` : '正在追踪'),
      pausedDetail: (pid: number) => `已暂停于 PID ${pid}`,
      commandLabel: '命令',
      showCommand: '显示命令',
      hideCommand: '隐藏命令',
      searchPlaceholder: '搜索进程或事件详情',
      typeLabels: {
        all: '全部类型',
        cpu: 'CPU',
        memory: '内存',
        io: '磁盘 I/O',
        network: '网络',
        spawn: '创建进程',
        queue: '等待队列',
      },
      severityLabels: {
        low: '低',
        medium: '中',
        high: '高',
      },
      delta: '变化',
      duration: '持续',
      noEvents: '没有匹配的追踪事件',
      prevPage: '上一页',
      nextPage: '下一页',
      pageLabel: (current, total) => `第 ${current} / ${total} 页`,
      controls: '采集控制',
      start: '开始',
      pause: '暂停',
      killTooltip: (pid) => `终止进程 PID ${pid}`,
    },
  },
};
