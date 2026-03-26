# System Monitor

**中文** | [English](./README_en.md)

一个基于 Electron + React + TypeScript 的系统监控应用，基于 `js-query-system-info`和`query-system-info`。 支持本地数据源(基于`js-query-system-info`)和订阅远程数据源(基于`query-system-info`的server模式)。

![Cpu Usage](./cpu.png)
![Process Track](./process_track.png)

## 更新日志

### 2026-03-26 — 远程数据源 + 进程终止通知

**远程数据源（Local / Remote 切换）**
- DataSource 抽象层，解耦数据采集与渲染
- LocalSource：包装 Electron IPC（原有逻辑不变）
- RemoteSource：通过 HTTP 轮询 + SSE 从 query_system_info server 获取数据
- 设置面板（Header 齿轮图标），支持切换 Local / Remote
- Remote 配置：服务器地址 + 用户名 + 密码，带"测试连接"按钮
- JWT 认证，token 过期自动处理

**进程终止自动通知**
- 客户端通过 onProcessData 轮询检查追踪进程是否存在
- 连续 2 次未找到 → 自动停止追踪 + 弹窗提示进程已终止
- 远程模式：服务端 SSE 推送 process_terminated 事件，RemoteSource 接收后自动停止并通知 UI

## 功能特性

- **内存监控**: 实时显示内存使用量、可用量、使用率
- **CPU 监控**: 显示 CPU 型号、核心数、频率和每核心使用率
- **磁盘监控**: 显示各磁盘分区的使用情况
- **网络监控**: 显示 TCP/UDP 连接状态统计和连接列表
- **进程监控**: 显示系统进程列表和内存占用
- **进程追踪** (核心亮点):
  - 实时追踪目标进程的CPU占用，精确到毫秒级采样
  - 实时追踪目标进程的磁盘I/O读写速率和操作次数
  - 实时追踪目标进程的网络I/O收发流量和数据包统计
  - 实时追踪目标进程的网络收发队列深度和延迟
  - 实时追踪目标进程的完整进程树，包括所有子进程信息
  - 支持同时追踪多个进程，便于对比分析
  - 提供历史数据图表，直观展示资源使用趋势
  - 适用于性能调优、瓶颈诊断、异常检测等场景

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
