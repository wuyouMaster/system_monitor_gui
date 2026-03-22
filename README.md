# System Monitor

一个基于 Electron + React + TypeScript 的系统监控应用，使用 `js-query-system-info` npm 包获取系统信息。

![Cpu Usage](./cpu.png)
![Process Track](./process_track.png)
## 功能特性

- **内存监控**: 实时显示内存使用量、可用量、使用率
- **CPU 监控**: 显示 CPU 型号、核心数、频率和每核心使用率
- **磁盘监控**: 显示各磁盘分区的使用情况
- **网络监控**: 显示 TCP/UDP 连接状态统计和连接列表
- **进程监控**: 显示系统进程列表和内存占用
- **进程追踪**：
  - 实时追踪目标进程的CPU占用
  - 实时追踪目标进程的硬盘io
  - 实时追踪目标进程的网络io
  - 实时追踪目标进程的网络的收发队列
  - 实时追踪目标进程的子进程信息

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI**: Material UI + Recharts
- **桌面框架**: Electron 28
- **系统信息**: js-query-system-info (Rust NAPI-RS 绑定)

## 项目结构

```
system-monitor/
├── src/
│   ├── main/
│   │   ├── main.ts          # Electron 主进程
│   │   ├── native-worker.ts # 原生模块 Worker
│   │   └── preload.ts       # Electron 预加载脚本
│   └── renderer/
│       ├── components/       # React 组件
│       │   ├── Dashboard.tsx
│       │   ├── MemoryPanel.tsx
│       │   ├── CpuPanel.tsx
│       │   ├── DiskPanel.tsx
│       │   ├── SocketPanel.tsx
│       │   └── ProcessPanel.tsx
│       ├── hooks/           # React Hooks
│       │   └── useSystemInfo.ts
│       ├── styles/          # 主题样式
│       │   └── theme.ts
│       ├── types/           # TypeScript 类型
│       │   └── electron.d.ts
│       ├── App.tsx
│       └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 安装和运行

### 前置要求

1. Node.js 18+
2. Yarn

### 快速启动（推荐）

**macOS/Linux:**
```bash
cd system_monitor_gui
./scripts/start-dev.sh
```

**手动步骤:**

```bash
# 1. 进入项目目录
cd system_monitor_gui

# 2. 安装依赖
yarn install

# 3. 开发模式运行
yarn dev
```

### 常见问题

**Q: 报错 "Cannot find module js-query-system-info"**

A: 确保已安装依赖：
```bash
yarn install
```

**Q: 报错 "Native module not loaded"**

A: 检查 npm 包是否正确安装：
```bash
ls node_modules/js-query-system-info/
```

**Q: 构建后应用打不开**

A: 查看 Electron 控制台输出，确认 native 模块加载路径正确。

## 界面说明

### 顶部区域

- **MEMORY 面板**: 显示内存总量、已用、可用、空闲，带使用率进度条
- **CPU 面板**: 显示 CPU 型号、物理/逻辑核心数、频率，带每核心使用率图表
- **NETWORK 面板**: 显示网络连接统计（总数、已建立、监听等）和连接列表

### 底部区域

- **DISK 面板**: 显示各磁盘分区的使用情况和进度条
- **PROCESSES 面板**: 显示内存占用最高的前 15 个进程

## 主题风格

采用赛博朋克/科技感设计风格：

- **主色调**: 青色 (#00f0ff)、紫色 (#ff00ff)
- **强调色**: 绿色 (#00ff88)、橙色 (#ffaa00)、红色 (#ff3366)
- **字体**: Orbitron (标题) + Roboto (正文)
- **效果**: 发光阴影、渐变背景、扫描线效果

## 数据刷新

- 系统信息每 2 秒自动刷新
- CPU 使用率每 1 秒采样
- 内存、网络、进程数据实时同步

## 开发说明

### IPC 通信

主进程通过 IPC 与渲染进程通信，提供以下 API：

```typescript
window.systemInfo.getSystemSummary()  // 获取完整系统摘要
window.systemInfo.getMemoryInfo()     // 获取内存信息
window.systemInfo.getCpuInfo()        // 获取 CPU 信息
window.systemInfo.getCpuUsage()       // 获取 CPU 使用率
window.systemInfo.getDisks()          // 获取磁盘信息
window.systemInfo.getSocketSummary()  // 获取网络统计
window.systemInfo.getProcesses()      // 获取进程列表
window.systemInfo.getConnections()    // 获取连接列表
```

### 添加新面板

1. 在 `src/renderer/components/` 创建新组件
2. 在 `Dashboard.tsx` 中引入并添加到布局
3. 根据需要添加新的 IPC 处理器到 `main.ts`

## 构建发布

```bash
# 构建所有平台
yarn build

# 输出目录：release/
```

## License

MIT
