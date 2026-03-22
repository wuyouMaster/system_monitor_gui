# System Monitor - Quick Start Guide

## 第一次运行

```bash
# 进入项目目录
cd system_monitor_gui

# 安装依赖并启动
yarn install
yarn dev
```

## 手动启动步骤

### 步骤 1: 安装依赖
```bash
yarn install
```

### 步骤 2: 启动开发服务器
```bash
yarn dev
```

## 项目文件说明

```
system-monitor/
├── dist/                      # 构建输出目录
│   ├── main/                  # Electron 主进程代码
│   └── renderer/              # React 渲染进程代码
├── scripts/
│   └── start-dev.sh           # 一键启动脚本
├── src/
│   ├── main/                  # 主进程源代码
│   └── renderer/              # 渲染进程源代码
└── package.json
```

## 技术说明

### 依赖说明

项目使用 `js-query-system-info` npm 包来获取系统信息，该包提供了跨平台的系统监控功能，包括：

- 内存信息
- CPU 信息和使用率
- 进程列表
- 磁盘信息
- 网络连接

npm 包会根据平台自动下载对应的原生模块。

## 故障排查

### 重新安装依赖
```bash
rm -rf node_modules
yarn install
```

### 查看 Electron 日志
启动后在终端查看输出，或按 Cmd+Option+I (macOS) / Ctrl+Shift+I (Windows/Linux) 打开开发者工具。
