#!/bin/bash

# System Monitor - Development Launcher
# This script builds everything and starts the Electron app

set -e

echo "======================================"
echo "  System Monitor - Development Build"
echo "======================================"
echo ""

# Get script directory and cd to the project root (system-monitor/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Step 1: Install npm dependencies
echo "[1/4] Installing npm dependencies..."
if [ ! -d "node_modules" ]; then
    yarn install
else
    echo "  (node_modules already exists, skipping)"
fi

# Step 2: Build Rust NAPI module
echo ""
echo "[2/4] Building Rust NAPI module..."
cd ../query_system_info/js-abi
if [ ! -d "node_modules" ]; then
    yarn install
fi
yarn build
cd ../../system-monitor

# Step 3: Copy .node file
echo ""
echo "[3/4] Copying native module..."
npm run copy:native

# Step 4: Start Electron
echo ""
echo "[4/4] Starting Electron dev server..."
echo ""
echo "======================================"
echo "  App is starting..."
echo "======================================"

yarn dev
