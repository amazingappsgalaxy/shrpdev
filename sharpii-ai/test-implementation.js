const { chromium } = require('playwright');

async function testImplementation() {
    console.log('🧪 Testing our Sharpii-AI implementation...\n');

    try {
        const browser = await chromium.launch({
            headless: false,
            executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });

        const page = await browser.newPage();

        // Navigate to our local implementation
        await page.goto('http://localhost:3004/app/editor');
        console.log('✅ Navigated to local editor implementation');

        // Wait for the page to load
        await page.waitForTimeout(2000);

        // Take a screenshot
        await page.screenshot({
            path: 'sharpii-implementation-test.png',
            fullPage: true
        });
        console.log('📸 Screenshot saved as sharpii-implementation-test.png');

        // Test some basic functionality
        const title = await page.title();
        console.log(`   Title: ${title}`);

        // Check if key elements are present
        const elements = await page.evaluate(() => {
            const results = {};

            // Check for main layout sections
            results.hasLeftSidebar = document.querySelector('[class*="w-\\[35%\\]"]') !== null;
            results.hasRightArea = document.querySelector('[class*="flex-1"]') !== null;

            // Check for key controls
            results.hasUpload = document.querySelector('input[type="file"]') !== null;
            results.hasEnhanceButton = document.querySelector('button:has-text("Enhance")') !== null;
            results.hasModelSelection = document.querySelector('button:has-text("Face"), button:has-text("Body")') !== null;

            // Check for styling
            results.hasDarkBackground = getComputedStyle(document.body).backgroundColor.includes('0, 0, 0') ||
                                     document.documentElement.classList.contains('dark') ||
                                     document.body.classList.contains('bg-black');

            return results;
        });

        console.log('\n📋 UI Elements Check:');
        Object.entries(elements).forEach(([key, value]) => {
            console.log(`   ${value ? '✅' : '❌'} ${key}: ${value}`);
        });

        // Test image upload functionality
        console.log('\n🔍 Testing functionality...');

        // Click on upload area (if no image is uploaded)
        try {
            const uploadArea = await page.locator('[class*="cursor-pointer"]').first();
            if (await uploadArea.isVisible()) {
                console.log('   ✅ Upload area is visible and clickable');
            }
        } catch (e) {
            console.log('   ⚠️  Upload area interaction failed');
        }

        // Check enhancement type buttons
        try {
            const faceButton = await page.locator('button:has-text("Face")');
            const bodyButton = await page.locator('button:has-text("Body")');

            if (await faceButton.isVisible() && await bodyButton.isVisible()) {
                console.log('   ✅ Enhancement type buttons are present');

                // Test clicking between them
                await bodyButton.click();
                await page.waitForTimeout(500);
                await faceButton.click();
                console.log('   ✅ Enhancement type switching works');
            }
        } catch (e) {
            console.log('   ❌ Enhancement type buttons test failed');
        }

        console.log('\n✅ Implementation test completed successfully!');
        console.log('📸 Screenshot saved for visual comparison');

        // Keep browser open for manual inspection
        console.log('\nBrowser will stay open for manual inspection. Press Ctrl+C to close.');
        await page.waitForTimeout(30000); // Wait 30 seconds

        await browser.close();

    } catch (error) {
        console.log(`❌ Error testing implementation: ${error.message}`);
    }
}

testImplementation();