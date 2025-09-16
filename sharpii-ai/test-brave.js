const { chromium } = require('playwright');

async function testBrave() {
    console.log('Testing Brave browser with Playwright...\n');

    try {
        // Launch Brave browser
        const browser = await chromium.launch({
            headless: false, // Set to true for headless mode
            executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });

        const page = await browser.newPage();

        // Navigate to a test page
        await page.goto('https://httpbin.org/get');
        console.log('✅ Successfully navigated to httpbin.org');

        // Get page title and URL
        const title = await page.title();
        const url = page.url();

        console.log(`   Title: ${title}`);
        console.log(`   URL: ${url}`);

        // Test some basic functionality
        const userAgent = await page.evaluate(() => navigator.userAgent);
        console.log(`   User Agent: ${userAgent}`);

        // Take a screenshot
        await page.screenshot({ path: 'brave-test.png' });
        console.log('   Screenshot saved as brave-test.png');

        await browser.close();
        console.log('\n✅ Brave browser test completed successfully!');

    } catch (error) {
        console.log(`❌ Error testing Brave: ${error.message}`);
    }
}

testBrave();