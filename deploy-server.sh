#!/bin/bash

# SocialHub Server Deployment Script
# This script helps deploy the Express backend to VPS

set -e

echo "🚀 SocialHub Server Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Navigate to server directory
cd server

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found in server directory!"
    print_info "Please create server/.env with the following variables:"
    echo ""
    echo "PORT=3001"
    echo "MONGO_URI=your-mongodb-connection-string"
    echo "JWT_SECRET=your-super-secret-jwt-key"
    echo "NODE_ENV=production"
    echo "CORS_ORIGIN=*"
    echo ""
    exit 1
fi

# Show current configuration (without sensitive data)
print_info "Current server configuration:"
echo "PORT: $(grep PORT .env | cut -d '=' -f2)"
echo "NODE_ENV: $(grep NODE_ENV .env | cut -d '=' -f2)"
echo "CORS_ORIGIN: $(grep CORS_ORIGIN .env | cut -d '=' -f2)"
echo ""

# Ask for confirmation
read -p "Do you want to continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled."
    exit 0
fi

# Go back to root directory
cd ..

# Install dependencies
print_info "Installing server dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_info "✅ Dependencies installed successfully!"
else
    print_error "❌ Failed to install dependencies."
    exit 1
fi

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    print_info "PM2 detected. Managing process with PM2..."
    
    # Check if app is already running
    if pm2 list | grep -q "socialhub-server"; then
        print_info "Restarting existing PM2 process..."
        pm2 restart socialhub-server
    else
        print_info "Starting new PM2 process..."
        pm2 start server/index.js --name "socialhub-server"
        pm2 save
    fi
    
    print_info "Showing PM2 status..."
    pm2 status socialhub-server
    
    echo ""
    print_info "To view logs, run: pm2 logs socialhub-server"
else
    print_warning "PM2 not found. Starting with node..."
    print_info "For production, it's recommended to use PM2:"
    echo "  npm install -g pm2"
    echo "  pm2 start server/index.js --name socialhub-server"
    echo ""
    print_info "Starting server..."
    node server/index.js
fi

echo ""
print_info "🎉 Deployment completed successfully!"
print_info "Backend API running at: http://localhost:3001"
