#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Node dependencies
npm install

# Create Python virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Upgrade pip and install Python requirements
echo "Installing Python dependencies (using optimized requirements)..."
.venv/bin/pip install --upgrade pip
.venv/bin/pip install --no-cache-dir -r ml_models/utils/requirements-render.txt
