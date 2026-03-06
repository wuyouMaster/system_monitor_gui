# System Monitor - Quick Start Guide

## 第一次运行

```bash
# 进入项目目录
cd /Users/uwa/personal/rust/query-gui/system-monitor

# 一次性完成所有设置和启动
./scripts/start-dev.sh
```

## 手动启动步骤

### 步骤 1: 安装依赖
```bash
npm install
```

### 步骤 2: 构建 Rust NAPI 绑定
```bash
cd ../query_system_info/js-abi
yarn install
yarn build
# 输出：../dist/index.darwin-arm64.node (macOS ARM)
```

### 步骤 3: 复制 .node 文件
```bash
cd ../../system-monitor
npm run copy:native
```

### 步骤 4: 启动开发服务器
```bash
npm run dev
```

## 项目文件说明

```
system-monitor/
├── dist/                      # 构建输出目录
│   ├── main/                  # Electron 主进程代码
│   ├── renderer/              # React 渲染进程代码
│   └── index.darwin-arm64.node # Rust NAPI 模块
├── scripts/
│   ├── copy-native.js         # 复制 .node 文件的脚本
│   └── start-dev.sh           # 一键启动脚本
├── src/
│   ├── main/                  # 主进程源代码
│   └── renderer/              # 渲染进程源代码
├── index.darwin-arm64.node    # 开发时 .node 文件位置
└── package.json
```

## 技术说明

### .node 文件命名规则

NAPI-RS 根据平台生成不同后缀的文件：

| 平台 | 架构 | 文件名 |
|------|------|--------|
| macOS | ARM64 | `index.darwin-arm64.node` |
| macOS | x64 | `index.darwin-x64.node` |
| Linux | x64 | `index.linux-x64.node` |
| Linux | ARM64 | `index.linux-arm64.node` |
| Windows | x64 | `index.win32-x64.node` |

### 加载逻辑

主进程会按以下顺序查找 .node 文件：

1. **开发模式**: 项目根目录 → dist/ → 兄弟目录 query_system_info/dist/
2. **生产模式**: Electron 的 resources/native/ 目录

## 故障排查

### 检查 .node 文件
```bash
# 查看 query_system_info/dist 中的文件
ls -la ../query_system_info/dist/*.node

# 查看当前目录的 .node 文件
ls -la *.node
```

### 重新构建 Rust 模块
```bash
cd ../query_system_info/js-abi
yarn install --force
yarn build --release
```

### 查看 Electron 日志
启动后在终端查看输出，或按 Cmd+Option+I (macOS) / Ctrl+Shift+I (Windows/Linux) 打开开发者工具。
