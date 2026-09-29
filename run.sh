#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=== SES AI Matcher starting ==="
export PYTHONPATH=backend

# Check frontend dist
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend..."
    cd frontend && npm run build && cd ..
fi

echo "Starting FastAPI server on http://localhost:8000 ..."
./backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
