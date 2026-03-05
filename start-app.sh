#!/bin/bash
# start-app.sh - Complete app startup script
# Starts MongoDB, backend (FastAPI), and frontend (Next.js)

set -e

echo "=========================================="
echo "Career Counselor App - Complete Startup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/app/career-counselling/backend"
FRONTEND_DIR="$SCRIPT_DIR/app/career-counselling/frontend"

# Step 1: Check and start MongoDB
echo -e "\n${YELLOW}[1/4] Checking MongoDB...${NC}"
if systemctl is-active --quiet mongod 2>/dev/null; then
    echo -e "${GREEN}✓ MongoDB is already running${NC}"
else
    echo "Starting MongoDB..."
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
        sleep 2
        if systemctl is-active --quiet mongod; then
            echo -e "${GREEN}✓ MongoDB started successfully${NC}"
        else
            echo -e "${RED}✗ Failed to start MongoDB via systemd${NC}"
            echo "Trying manual start..."
            mongod --dbpath /var/lib/mongodb --fork --logpath /tmp/mongod.log || {
                echo -e "${RED}✗ Could not start MongoDB. Please start it manually.${NC}"
                exit 1
            }
        fi
    else
        echo "systemctl not found, trying manual start..."
        mongod --dbpath /var/lib/mongodb --fork --logpath /tmp/mongod.log || {
            echo -e "${RED}✗ Could not start MongoDB. Please start it manually.${NC}"
            exit 1
        }
    fi
fi

# Step 2: Check backend .env
echo -e "\n${YELLOW}[2/4] Checking backend configuration...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠ .env not found, copying from .env.example${NC}"
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        echo -e "${RED}Please edit $BACKEND_DIR/.env with your settings (SECRET_KEY, MONGODB_URL, etc.)${NC}"
        echo "Then run this script again."
        exit 1
    else
        echo -e "${RED}✗ .env.example not found${NC}"
        exit 1
    fi
fi

# Check critical env vars
if ! grep -q "^MONGODB_URL=" "$BACKEND_DIR/.env" || ! grep -q "^SECRET_KEY=" "$BACKEND_DIR/.env"; then
    echo -e "${RED}✗ .env is missing MONGODB_URL or SECRET_KEY${NC}"
    echo "Please ensure $BACKEND_DIR/.env has:"
    echo "  MONGODB_URL=mongodb://localhost:27017"
    echo "  SECRET_KEY=your_secret_key_here"
    exit 1
fi
echo -e "${GREEN}✓ Backend .env configured${NC}"

# Step 3: Check frontend .env.local
echo -e "\n${YELLOW}[3/4] Checking frontend configuration...${NC}"
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo "Creating frontend .env.local..."
    echo "NEXT_PUBLIC_API_URL=https://dass-deployed.onrender.com/api" > "$FRONTEND_DIR/.env.local"
    echo -e "${GREEN}✓ Created .env.local${NC}"
else
    echo -e "${GREEN}✓ Frontend .env.local exists${NC}"
fi

# Step 4: Start backend and frontend
echo -e "\n${YELLOW}[4/4] Starting servers...${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    jobs -p | xargs -r kill 2>/dev/null || true
    echo -e "${GREEN}Cleanup complete${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo -e "${GREEN}Starting backend (FastAPI)...${NC}"
cd "$BACKEND_DIR"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo -e "${GREEN}Starting frontend (Next.js)...${NC}"
cd "$FRONTEND_DIR"
npm run dev -- --port 3000 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo -e "\n${GREEN}=========================================="
echo "✓ All services started!"
echo "==========================================${NC}"

echo -e "\nAccess the application:"
echo "  Frontend: https://team-13.vercel.app"
echo "  Backend:  https://dass-deployed.onrender.com"
echo "  API Docs: https://dass-deployed.onrender.com/docs"

echo -e "\nDatabase:"
echo "  MongoDB:  mongodb://localhost:27017"

echo -e "\nPress Ctrl+C to stop all services\n"

# Wait for processes
wait
