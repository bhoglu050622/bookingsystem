#!/bin/bash

# Client Demo Setup Script
# This script sets up everything needed for the demo

set -e

echo "🚀 Setting up Booking System for Client Demo..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if .env files exist
if [ ! -f "apps/backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating apps/backend/.env from example...${NC}"
    cp apps/backend/.env.example apps/backend/.env 2>/dev/null || cat > apps/backend/.env << EOF
DATABASE_URL=postgresql://booking:booking@localhost:5432/booking?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=demo-secret-key-change-in-production-2024
JWT_EXPIRES_IN=1h
PORT=3000
EOF
    echo -e "${GREEN}✅ Created apps/backend/.env${NC}"
else
    echo -e "${GREEN}✅ apps/backend/.env exists${NC}"
fi

if [ ! -f "apps/frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating apps/frontend/.env.local...${NC}"
    cat > apps/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_MOCK_API=false
EOF
    echo -e "${GREEN}✅ Created apps/frontend/.env.local${NC}"
else
    echo -e "${GREEN}✅ apps/frontend/.env.local exists${NC}"
fi

echo ""
echo -e "${YELLOW}📦 Starting Docker services...${NC}"
docker compose up -d postgres redis

echo ""
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

echo ""
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd apps/backend
npm install

echo ""
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
npm run prisma:generate
npm run prisma:migrate || echo "Migrations may already be applied"
npm run prisma:seed || echo "Seed may have been run already"

cd ../..

echo ""
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd apps/frontend
npm install

cd ../..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start backend: cd apps/backend && npm run start:dev"
echo "2. Start frontend: cd apps/frontend && npm run dev"
echo "3. Or use Docker: docker compose up"
echo ""
echo "Access the app at: http://localhost:3000"
echo ""

