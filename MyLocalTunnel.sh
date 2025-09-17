#!/bin/bash

# MyLocalTunnel - Automated Cloudflare Tunnel Setup Script
# Usage: ./MyLocalTunnel.sh [port] [project_directory]

set -e  # Exit on any error

# Default values
DEFAULT_PORT=3007
DEFAULT_PROJECT_DIR="/Users/dheer/Documents/sharpcode/sharpii-ai"

# Parse arguments
PORT=${1:-$DEFAULT_PORT}
PROJECT_DIR=${2:-$DEFAULT_PROJECT_DIR}

echo "🚀 MyLocalTunnel - Starting automated tunnel setup..."
echo "📁 Project Directory: $PROJECT_DIR"
echo "🔌 Target Port: $PORT"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a specific port
kill_port_processes() {
    local port=$1
    echo "🔄 Checking for processes on port $port..."
    
    if check_port $port; then
        echo "⚠️  Found processes on port $port, attempting to stop them..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
        
        if check_port $port; then
            echo "❌ Failed to free port $port. Please manually stop the processes."
            exit 1
        else
            echo "✅ Port $port is now free"
        fi
    else
        echo "✅ Port $port is already free"
    fi
}

# Function to start development server
start_dev_server() {
    echo "🔄 Starting development server..."
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Clear Next.js cache if it exists
    if [ -d ".next" ]; then
        echo "🧹 Clearing Next.js cache..."
        rm -rf .next
    fi
    
    # Start the development server in background
    echo "🚀 Starting npm run dev..."
    npm run dev > /dev/null 2>&1 &
    DEV_SERVER_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for development server to start..."
    for i in {1..30}; do
        if check_port $PORT; then
            echo "✅ Development server is running on port $PORT"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Development server failed to start on port $PORT"
    exit 1
}

# Function to start Cloudflare tunnel
start_tunnel() {
    echo "🌐 Starting Cloudflare tunnel..."
    
    # Kill any existing cloudflared processes
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    sleep 2
    
    # Start new tunnel in background
    cloudflared tunnel --url http://localhost:$PORT > tunnel_output.log 2>&1 &
    TUNNEL_PID=$!
    
    # Wait for tunnel URL to be generated
    echo "⏳ Waiting for tunnel URL..."
    for i in {1..30}; do
        if [ -f "tunnel_output.log" ]; then
            TUNNEL_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' tunnel_output.log | head -1)
            if [ ! -z "$TUNNEL_URL" ]; then
                echo "✅ Tunnel created successfully!"
                echo "🌍 Public URL: $TUNNEL_URL"
                echo "🏠 Local URL: http://localhost:$PORT"
                
                # Save tunnel info to file
                echo "TUNNEL_URL=$TUNNEL_URL" > .tunnel_info
                echo "LOCAL_PORT=$PORT" >> .tunnel_info
                echo "TUNNEL_PID=$TUNNEL_PID" >> .tunnel_info
                echo "DEV_SERVER_PID=$DEV_SERVER_PID" >> .tunnel_info
                
                return 0
            fi
        fi
        sleep 1
    done
    
    echo "❌ Failed to get tunnel URL"
    cat tunnel_output.log 2>/dev/null || echo "No tunnel output available"
    exit 1
}

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    rm -f tunnel_output.log
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
echo "🔍 Checking if development server is already running..."
if ! check_port $PORT; then
    echo "🚀 Development server not running, starting it..."
    start_dev_server
else
    echo "✅ Development server already running on port $PORT"
fi

# Start the tunnel
start_tunnel

echo ""
echo "🎉 MyLocalTunnel setup complete!"
echo "📋 Summary:"
echo "   • Local Server: http://localhost:$PORT"
echo "   • Public Tunnel: $TUNNEL_URL"
echo "   • Project: $PROJECT_DIR"
echo ""
echo "💡 Tunnel info saved to .tunnel_info file"
echo "🛑 To stop: pkill -f 'cloudflared tunnel' && pkill -f 'npm run dev'"
echo ""
echo "🌐 Opening tunnel URL in browser..."

# Try to open the URL in browser (macOS)
if command -v open >/dev/null 2>&1; then
    open "$TUNNEL_URL" 2>/dev/null || echo "⚠️  Could not open browser automatically"
fi

echo "✨ MyLocalTunnel is ready! Press Ctrl+C to stop."

# Keep script running to maintain tunnel
wait