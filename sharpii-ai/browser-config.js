const { chromium } = require('playwright');

// Configuration for Brave browser with extensions
const braveConfig = {
  executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  headless: false,
  args: [
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-blink-features=AutomationControlled',
    '--no-first-run',
    '--no-default-browser-check',
    // Enable extensions
    '--load-extension=/path/to/extension', // Add your extension path here
    '--disable-extensions-except=/path/to/extension', // Only load specific extensions
    // User data directory to persist login sessions
    '--user-data-dir=/tmp/brave-automation'
  ],
  // Keep existing user session/cookies
  userDataDir: '/tmp/brave-automation'
};

async function launchBraveWithExtensions() {
  console.log('Launching Brave browser with extensions...');

  try {
    const browser = await chromium.launchPersistentContext('/tmp/brave-automation', {
      executablePath: braveConfig.executablePath,
      headless: false,
      args: braveConfig.args,
      // Preserve authentication
      acceptDownloads: true,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    // Navigate to Enhancor editor
    console.log('Navigating to Enhancor editor...');
    await page.goto('https://app.enhancor.ai/editor', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Successfully loaded Enhancor editor');
    console.log('URL:', page.url());

    // Take screenshot
    await page.screenshot({ path: 'enhancor-authenticated.png', fullPage: true });

    return { browser, page };

  } catch (error) {
    console.error('❌ Error launching Brave:', error.message);
    throw error;
  }
}

module.exports = { launchBraveWithExtensions, braveConfig };

// Test the configuration
if (require.main === module) {
  launchBraveWithExtensions().then(({ browser, page }) => {
    console.log('✅ Brave browser ready for automation');
    console.log('Press Ctrl+C to close...');

    // Keep browser open for manual inspection
    process.on('SIGINT', async () => {
      console.log('\nClosing browser...');
      await browser.close();
      process.exit(0);
    });
  }).catch(console.error);
}