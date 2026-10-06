#!/bin/bash
# Repository Analysis Tool - Quick Start Script
# COMS3011A Test Submission

set -e

echo "============================================"
echo "  Repository Analysis Tool (RAT)"
echo "  Starting all services..."
echo "============================================"
echo ""

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required but not installed."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required but not installed."
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "ERROR: Git is required but not installed."
    exit 1
fi

echo "Prerequisites check passed."
echo ""

# Install dependencies
echo "[1/3] Installing backend dependencies..."
cd "$(dirname "$0")/backend"
npm install --silent 2>/dev/null
echo "  Done."

echo "[2/3] Installing git-service dependencies..."
cd "$(dirname "$0")/git-service"
pip install -r requirements.txt --quiet 2>/dev/null
echo "  Done."

echo "[3/3] Installing frontend dependencies..."
cd "$(dirname "$0")/frontend"
npm install --silent 2>/dev/null
echo "  Done."

echo ""
echo "All dependencies installed."
echo ""

# Kill any existing processes on our ports
echo "Cleaning up any existing processes..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# Start services
echo ""
echo "============================================"
echo "  Starting Services"
echo "============================================"
echo ""

PROJECT_ROOT="$(dirname "$0")"

# Start Git Service
echo "[Git Service] Starting on port 8000..."
cd "$PROJECT_ROOT/git-service"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
GIT_PID=$!
sleep 2

# Start Backend API
echo "[Backend API] Starting on port 3000..."
cd "$PROJECT_ROOT/backend"
npx ts-node src/server.ts &
BACKEND_PID=$!
sleep 2

# Start Frontend
echo "[Frontend] Starting on port 5173..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
sleep 3

echo ""
echo "============================================"
echo "  All Services Running!"
echo "============================================"
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3000"
echo "  Git Svc:   http://localhost:8000"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "============================================"
echo ""

# Handle shutdown
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $GIT_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait
