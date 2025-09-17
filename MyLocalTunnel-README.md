# MyLocalTunnel - Automated Cloudflare Tunnel Setup

A simple automation script that sets up a Cloudflare tunnel for your local development server.

## Features

- ✅ Automatically starts your development server
- ✅ Clears Next.js cache if needed
- ✅ Creates a Cloudflare tunnel with public URL
- ✅ Handles port conflicts and cleanup
- ✅ Opens the tunnel URL in your browser
- ✅ Saves tunnel info for reference

## Usage

### Basic Usage (Default Settings)
```bash
./MyLocalTunnel.sh
```
This will:
- Use port 3007 (default)
- Use `/Users/dheer/Documents/sharpcode/sharpii-ai` as project directory

### Custom Port
```bash
./MyLocalTunnel.sh 3000
```

### Custom Port and Project Directory
```bash
./MyLocalTunnel.sh 3000 /path/to/your/project
```

## What It Does

1. **Checks Port Availability**: Ensures the target port is free
2. **Starts Dev Server**: Runs `npm run dev` in your project directory
3. **Clears Cache**: Removes `.next` directory if it exists
4. **Creates Tunnel**: Sets up Cloudflare tunnel pointing to your local server
5. **Provides URLs**: Shows both local and public URLs
6. **Opens Browser**: Automatically opens the public URL

## Output Files

- `.tunnel_info`: Contains tunnel URL, port, and process IDs
- `tunnel_output.log`: Cloudflare tunnel logs (temporary)

## Stopping the Tunnel

The script provides a stop command:
```bash
pkill -f 'cloudflared tunnel' && pkill -f 'npm run dev'
```

Or simply press `Ctrl+C` in the terminal where the script is running.

## Requirements

- Node.js and npm installed
- Cloudflare tunnel (`cloudflared`) installed via `brew install cloudflared`
- macOS (for browser opening functionality)

## Example Output

```
🚀 MyLocalTunnel - Starting automated tunnel setup...
📁 Project Directory: /Users/dheer/Documents/sharpcode/sharpii-ai
🔌 Target Port: 3007
✅ Port 3007 is already free
✅ Development server already running on port 3007
🌐 Starting Cloudflare tunnel...
⏳ Waiting for tunnel URL...
✅ Tunnel created successfully!
🌍 Public URL: https://example-tunnel-url.trycloudflare.com
🏠 Local URL: http://localhost:3007

🎉 MyLocalTunnel setup complete!
```

## Troubleshooting

- **Port conflicts**: The script automatically handles port conflicts
- **Dev server issues**: Cache is cleared automatically
- **Tunnel failures**: Check `tunnel_output.log` for details
- **Permission errors**: Ensure script is executable with `chmod +x MyLocalTunnel.sh`