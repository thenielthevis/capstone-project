#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Node dependencies
echo "Installing Node dependencies..."
npm install

# Create/Update Python virtual environment
# We use a temporary check to see if pip actually exists in the venv
if [ ! -f ".venv/bin/pip" ]; then
    echo "Creating Python virtual environment..."
    rm -rf .venv
    python3 -m venv .venv
fi

# Upgrade pip and install Python requirements
echo "Installing Python dependencies (using consolidated requirements)..."
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install --no-cache-dir -r ml_models/utils/requirements.txt
