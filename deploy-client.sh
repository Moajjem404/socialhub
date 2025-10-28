#!/bin/bash

# SocialHub Client Deployment Script
# This script helps deploy the Next.js frontend to VPS

set -e

echo "🚀 SocialHub Client Deployment Script"
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

# Navigate to client directory
cd client

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_warning ".env.production not found. Creating from .env.local..."
    if [ -f .env.local ]; then
        cp .env.local .env.production
        print_info "Created .env.production from .env.local"
    else
        print_error ".env.local not found. Please create .env.production manually."
        exit 1
    fi
fi

# Show current API URL
print_info "Current API URL configuration:"
grep NEXT_PUBLIC_API_URL .env.production || print_warning "NEXT_PUBLIC_API_URL not set (auto-detection enabled)"
echo ""

# Ask for confirmation
read -p "Do you want to continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled."
    exit 0
fi

# Install dependencies
print_info "Installing dependencies..."
npm install

# Build the application
print_info "Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    print_info "✅ Build successful!"
else
    print_error "❌ Build failed. Please check the errors above."
    exit 1
fi

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    print_info "PM2 detected. Managing process with PM2..."
    
    # Check if app is already running
    if pm2 list | grep -q "socialhub-client"; then
        print_info "Restarting existing PM2 process..."
        pm2 restart socialhub-client
    else
        print_info "Starting new PM2 process..."
        pm2 start npm --name "socialhub-client" -- start
        pm2 save
    fi
    
    print_info "Showing PM2 status..."
    pm2 status socialhub-client
    
    echo ""
    print_info "To view logs, run: pm2 logs socialhub-client"
else
    print_warning "PM2 not found. Starting with npm start..."
    print_info "For production, it's recommended to use PM2:"
    echo "  npm install -g pm2"
    echo "  pm2 start npm --name socialhub-client -- start"
    echo ""
    print_info "Starting application..."
    npm start
fi

echo ""
print_info "🎉 Deployment completed successfully!"
print_info "Frontend running at: http://localhost:3000"
