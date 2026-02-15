const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define the port to tunnel
const PORT = 3003;

console.log('🚀 Starting Cloudflare Tunnel for development...');
console.log(`Target Port: ${PORT}`);

const startCloudflareTunnel = () => {
    console.log('Attempting to start cloudflared...');
    // Command: cloudflared tunnel --url http://localhost:3003
    const cf = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${PORT}`]);

    // cloudflared outputs the URL to stderr usually
    cf.stderr.on('data', (data) => {
        const output = data.toString();
        // Look for the trycloudflare.com URL
        const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match) {
            const url = match[0];
            // Only handle if it's a new URL
            handleTunnelUrl(url);
        }
    });

    cf.stdout.on('data', (data) => {
        // Just in case it comes to stdout
        const output = data.toString();
        const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match) {
            const url = match[0];
            handleTunnelUrl(url);
        }
    });

    cf.on('error', (err) => {
        console.error('❌ Failed to start cloudflared:', err.message);
        console.log('Make sure cloudflared is installed. You can install it via brew: brew install cloudflared');
    });
};

let currentUrl = '';

function handleTunnelUrl(url) {
    if (currentUrl === url) return;
    currentUrl = url;

    console.log('\n✅ Cloudflare Tunnel Created Successfully!');
    console.log(`🌐 Public URL: ${url}`);

    // Construct the Webhook URL
    const webhookUrl = `${url}/api/payments/webhook`;
    console.log(`\n📢 ACTION REQUIRED: Update Dodo Dashboard`);
    console.log(`   Go to https://app.dodopayments.com/developers/webhooks`);
    console.log(`   Set Endpoint URL to: ${webhookUrl}`);

    // Update .env.local
    updateEnvFile(url);
}

function updateEnvFile(baseUrl) {
    const envPath = path.join(process.cwd(), '.env.local');
    let content = '';

    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    // Update DODO_PAYMENTS_RETURN_URL
    const returnUrl = `${baseUrl}/app/dashboard?payment=success`;
    const cancelUrl = `${baseUrl}/?payment=cancelled#pricing-section`;

    let newContent = content;

    // Update Return URL
    if (newContent.includes('DODO_PAYMENTS_RETURN_URL=')) {
        newContent = newContent.replace(/DODO_PAYMENTS_RETURN_URL=.*/g, `DODO_PAYMENTS_RETURN_URL=${returnUrl}`);
    } else {
        newContent += `\nDODO_PAYMENTS_RETURN_URL=${returnUrl}`;
    }

    // Update Cancel URL
    if (newContent.includes('DODO_PAYMENTS_CANCEL_URL=')) {
        newContent = newContent.replace(/DODO_PAYMENTS_CANCEL_URL=.*/g, `DODO_PAYMENTS_CANCEL_URL=${cancelUrl}`);
    } else {
        newContent += `\nDODO_PAYMENTS_CANCEL_URL=${cancelUrl}`;
    }

    // Also update NEXT_PUBLIC_APP_URL as it is often used for absolute links
    if (newContent.includes('NEXT_PUBLIC_APP_URL=')) {
        newContent = newContent.replace(/NEXT_PUBLIC_APP_URL=.*/g, `NEXT_PUBLIC_APP_URL=${baseUrl}`);
    } else {
        newContent += `\nNEXT_PUBLIC_APP_URL=${baseUrl}`;
    }

    fs.writeFileSync(envPath, newContent);
    console.log('\n✅ Updated .env.local with new DODO_PAYMENTS_RETURN_URL and NEXT_PUBLIC_APP_URL');
}

startCloudflareTunnel();
