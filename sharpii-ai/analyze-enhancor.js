const { chromium } = require('playwright');

async function analyzeEnhancor() {
    console.log('Analyzing Enhancor.ai editor UI...\n');

    try {
        // Launch Brave browser
        const browser = await chromium.launch({
            headless: false, // Keep visible to see the page
            executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });

        const page = await browser.newPage();

        // Navigate to Enhancor editor
        console.log('Navigating to https://app.enhancor.ai/editor...');
        await page.goto('https://app.enhancor.ai/editor', { waitUntil: 'networkidle' });

        // Wait a bit for any dynamic content to load
        await page.waitForTimeout(3000);

        console.log('✅ Page loaded successfully');

        // Take screenshot
        await page.screenshot({ path: 'enhancor-editor.png', fullPage: true });
        console.log('📸 Full page screenshot saved as enhancor-editor.png');

        // Get page structure
        const pageStructure = await page.evaluate(() => {
            const getElementInfo = (element) => {
                const computedStyle = window.getComputedStyle(element);
                return {
                    tagName: element.tagName.toLowerCase(),
                    className: element.className,
                    id: element.id,
                    styles: {
                        backgroundColor: computedStyle.backgroundColor,
                        color: computedStyle.color,
                        fontSize: computedStyle.fontSize,
                        padding: computedStyle.padding,
                        margin: computedStyle.margin,
                        borderRadius: computedStyle.borderRadius,
                        border: computedStyle.border,
                        display: computedStyle.display,
                        flexDirection: computedStyle.flexDirection,
                        gap: computedStyle.gap,
                        width: computedStyle.width,
                        height: computedStyle.height
                    },
                    text: element.textContent?.substring(0, 100) || ''
                };
            };

            const structure = {
                title: document.title,
                url: window.location.href,
                bodyStyles: getElementInfo(document.body),
                mainLayout: null,
                leftSidebar: null,
                rightContent: null,
                elements: []
            };

            // Look for main layout containers
            const mainContainer = document.querySelector('main, [class*="main"], [class*="container"], [class*="layout"]');
            if (mainContainer) {
                structure.mainLayout = getElementInfo(mainContainer);
            }

            // Look for sidebar-like elements
            const sidebar = document.querySelector('[class*="sidebar"], [class*="panel"], aside, [class*="controls"]');
            if (sidebar) {
                structure.leftSidebar = getElementInfo(sidebar);
            }

            // Look for result/content area
            const content = document.querySelector('[class*="result"], [class*="content"], [class*="canvas"], [class*="image"]');
            if (content) {
                structure.rightContent = getElementInfo(content);
            }

            // Get all major elements with meaningful classes
            const elements = Array.from(document.querySelectorAll('[class]')).slice(0, 50).map(getElementInfo);
            structure.elements = elements;

            return structure;
        });

        console.log('\n📋 Page Structure Analysis:');
        console.log('Title:', pageStructure.title);
        console.log('URL:', pageStructure.url);

        if (pageStructure.mainLayout) {
            console.log('\n🏗️  Main Layout:');
            console.log('  Class:', pageStructure.mainLayout.className);
            console.log('  Background:', pageStructure.mainLayout.styles.backgroundColor);
            console.log('  Display:', pageStructure.mainLayout.styles.display);
        }

        if (pageStructure.leftSidebar) {
            console.log('\n📱 Left Sidebar:');
            console.log('  Class:', pageStructure.leftSidebar.className);
            console.log('  Background:', pageStructure.leftSidebar.styles.backgroundColor);
            console.log('  Width:', pageStructure.leftSidebar.styles.width);
        }

        if (pageStructure.rightContent) {
            console.log('\n🖼️  Right Content:');
            console.log('  Class:', pageStructure.rightContent.className);
            console.log('  Background:', pageStructure.rightContent.styles.backgroundColor);
        }

        // Save detailed analysis to file
        const fs = require('fs');
        fs.writeFileSync('enhancor-analysis.json', JSON.stringify(pageStructure, null, 2));
        console.log('\n💾 Detailed analysis saved to enhancor-analysis.json');

        // Keep browser open for manual inspection
        console.log('\n🔍 Browser will stay open for manual inspection. Press Ctrl+C to close.');
        await page.waitForTimeout(60000); // Wait 1 minute before auto-closing

        await browser.close();
        console.log('\n✅ Analysis completed!');

    } catch (error) {
        console.log(`❌ Error analyzing Enhancor: ${error.message}`);
    }
}

analyzeEnhancor();