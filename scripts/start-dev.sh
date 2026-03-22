#!/bin/bash

# System Monitor - Development Launcher
# This script starts the Electron app with js-query-system-info from npm

set -e

echo "======================================"
echo "  System Monitor - Development Build"
echo "======================================"
echo ""

# Get script directory and cd to the project root (system-monitor/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Step 1: Install npm dependencies
echo "[1/2] Installing npm dependencies..."
if [ ! -d "node_modules" ]; then
    yarn install
else
    echo "  (node_modules already exists, skipping)"
fi

# Step 2: Start Electron
echo ""
echo "[2/2] Starting Electron dev server..."
echo ""
echo "======================================"
echo "  App is starting..."
echo "======================================"

yarn dev
