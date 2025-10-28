#!/bin/bash

# SocialHub Full-Stack Deployment Script
# This script deploys both frontend and backend together

set -e

echo "🚀 SocialHub Full-Stack Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not installed. Installing PM2 globally..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
        print_info "✅ PM2 installed successfully!"
    else
        print_error "❌ Failed to install PM2. Please install manually: npm install -g pm2"
        exit 1
    fi
fi

# Check environment files
print_step "Checking environment files..."

if [ ! -f server/.env ]; then
    print_error "server/.env not found!"
    print_info "Please create server/.env with required variables."
    exit 1
fi

if [ ! -f client/.env.local ]; then
    print_warning "client/.env.local not found. Creating default..."
    echo "# Leave empty for auto-detection" > client/.env.local
    echo "NEXT_PUBLIC_API_URL=" >> client/.env.local
fi

# Show configurations
print_info "Configuration Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server Port: $(grep PORT server/.env | cut -d '=' -f2)"
echo "CORS Origin: $(grep CORS_ORIGIN server/.env | cut -d '=' -f2)"
echo "API URL: $(grep NEXT_PUBLIC_API_URL client/.env.local | cut -d '=' -f2 || echo 'Auto-detect')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask for confirmation
read -p "Do you want to continue with full deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled."
    exit 0
fi

# Install backend dependencies
print_step "1/4 Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_info "✅ Backend dependencies installed!"
else
    print_error "❌ Failed to install backend dependencies."
    exit 1
fi

# Install frontend dependencies
print_step "2/4 Installing frontend dependencies..."
cd client
npm install
if [ $? -eq 0 ]; then
    print_info "✅ Frontend dependencies installed!"
else
    print_error "❌ Failed to install frontend dependencies."
    exit 1
fi

# Build frontend
print_step "3/4 Building frontend for production..."
npm run build
if [ $? -eq 0 ]; then
    print_info "✅ Frontend build successful!"
else
    print_error "❌ Frontend build failed."
    exit 1
fi

cd ..

# Deploy with PM2
print_step "4/4 Deploying with PM2..."

# Stop existing processes
pm2 delete socialhub-server 2>/dev/null || true
pm2 delete socialhub-client 2>/dev/null || true

# Start backend
print_info "Starting backend server..."
pm2 start server/index.js --name "socialhub-server"

# Start frontend
print_info "Starting frontend client..."
cd client
pm2 start npm --name "socialhub-client" -- start
cd ..

# Save PM2 configuration
pm2 save

# Setup startup script
print_info "Setting up PM2 startup script..."
pm2 startup

echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "🎉 Deployment completed successfully!"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
print_info "PM2 Management Commands:"
echo "  pm2 list              - Show all processes"
echo "  pm2 logs              - View all logs"
echo "  pm2 restart all       - Restart both apps"
echo "  pm2 stop all          - Stop both apps"
echo "  pm2 monit             - Monitor processes"
echo ""
print_info "To view PM2 status:"
pm2 status
