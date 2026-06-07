#!/bin/bash

# Personal Cloud Storage - Setup and Start Script

set -e

echo "🚀 Personal Cloud Storage Setup"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found${NC}"

# Setup Python venv
echo -e "${BLUE}Setting up Python virtual environment...${NC}"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate venv
source .venv/bin/activate

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
pip install -q -r backend/requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Initialize database
echo -e "${BLUE}Initializing database...${NC}"
python init_db.py
echo -e "${GREEN}✓ Database initialized${NC}"

# Setup frontend
echo -e "${BLUE}Setting up frontend...${NC}"
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/npm is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

cd frontend
if [ ! -d "node_modules" ]; then
    npm install -q
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

npm run build -q
echo -e "${GREEN}✓ Frontend built${NC}"

cd ..

# Create uploads directory
mkdir -p backend/uploads
echo -e "${GREEN}✓ Uploads directory ready${NC}"

# Print instructions
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}To start the application:${NC}"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   source ../.venv/bin/activate"
echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "2. In another terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open your browser to http://localhost:5173"
echo ""
echo -e "${YELLOW}Demo credentials:${NC}"
echo "   Email: demo@example.com"
echo "   Password: demo123"
echo ""
echo -e "${YELLOW}API Documentation:${NC}"
echo "   http://localhost:8000/docs"
echo ""
