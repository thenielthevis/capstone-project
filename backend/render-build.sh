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
echo "Installing Python dependencies..."
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r ml_models/utils/requirements.txt
