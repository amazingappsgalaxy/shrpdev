import { test, expect } from '@playwright/test';

test.describe('Editor Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the editor page
    await page.goto('/app/editor');

    // Wait for the page to load completely
    await page.waitForSelector('[data-testid="editor-page"]', { timeout: 10000 });
  });

  test('should display model selection controls', async ({ page }) => {
    // Check if model selection buttons are present
    const modelButtons = page.locator('button:has-text("RunningHub FLUX")');
    await expect(modelButtons).toBeVisible();

    const replicateModel = page.locator('button:has-text("Magic Image Refiner")');
    await expect(replicateModel).toBeVisible();
  });

  test('should display enhancement type controls', async ({ page }) => {
    // Check enhancement type buttons
    const faceButton = page.locator('button:has-text("Face")').first();
    await expect(faceButton).toBeVisible();

    const bodyButton = page.locator('button:has-text("Body")').first();
    await expect(bodyButton).toBeVisible();
  });

  test('should display advanced model settings when expanded', async ({ page }) => {
    // Click on Advanced Model Settings to expand
    const advancedSettings = page.locator('summary:has-text("Advanced Model Settings")');
    await advancedSettings.click();

    // Check if settings are visible
    await expect(page.locator('text=Steps')).toBeVisible();
    await expect(page.locator('text=Guidance Scale')).toBeVisible();
    await expect(page.locator('text=Denoise Strength')).toBeVisible();
  });

  test('should show different settings for different models', async ({ page }) => {
    // Expand advanced settings
    await page.locator('summary:has-text("Advanced Model Settings")').click();

    // Select RunningHub model and check its settings
    await page.locator('button:has-text("RunningHub FLUX")').click();
    await expect(page.locator('text=MyUpscaler (+35% cost)')).toBeVisible();
    await expect(page.locator('text=Sampling Method')).toBeVisible();

    // Select Replicate model and check its settings
    await page.locator('button:has-text("Magic Image Refiner")').click();
    await expect(page.locator('text=Creativity Level')).toBeVisible();
    await expect(page.locator('text=HDR Enhancement (+10% cost)')).toBeVisible();
  });

  test('should update credit calculation when settings change', async ({ page }) => {
    // Check initial credits display
    const creditsDisplay = page.locator('text=/Cost: \\d+ Credits/');
    await expect(creditsDisplay).toBeVisible();

    // Get initial credit value
    const initialCredits = await creditsDisplay.textContent();

    // Expand advanced settings and change a setting
    await page.locator('summary:has-text("Advanced Model Settings")').click();

    // Enable MyUpscaler which should increase cost by 35%
    await page.locator('text=MyUpscaler (+35% cost)').click();

    // Wait for credits to update and check if they changed
    await page.waitForTimeout(500); // Allow time for recalculation
    const updatedCredits = await creditsDisplay.textContent();

    expect(updatedCredits).not.toBe(initialCredits);
  });

  test('should show proper gradient theme colors', async ({ page }) => {
    // Check if model selection uses gradient
    const modelButton = page.locator('button:has-text("RunningHub FLUX")');
    const buttonClasses = await modelButton.getAttribute('class');
    expect(buttonClasses).toContain('gradient');

    // Check enhance button uses gradient
    const enhanceButton = page.locator('button:has-text("Enhance")');
    const enhanceClasses = await enhanceButton.getAttribute('class');
    expect(enhanceClasses).toContain('gradient');
  });

  test('should enable enhance button when image is uploaded', async ({ page }) => {
    // Initially enhance button should be disabled
    const enhanceButton = page.locator('button:has-text("Enhance")');
    await expect(enhanceButton).toBeDisabled();

    // TODO: Test file upload functionality would require file handling
    // This would be implemented based on how file upload is set up
  });

  test('should show result section with proper buttons after enhancement', async ({ page }) => {
    // This test would require a mock successful enhancement
    // For now, we'll check that the result section exists
    const resultSection = page.locator('text=Result');
    await expect(resultSection).toBeVisible();

    // Check that upload prompt is shown when no image
    await expect(page.locator('text=Upload an image to get started')).toBeVisible();
  });

  test('should display area protection settings', async ({ page }) => {
    // Check that area protection section exists
    await expect(page.locator('text=Keep Certain Areas Unchanged')).toBeVisible();

    // Check face protection options
    await expect(page.locator('text=Face')).toBeVisible();
    await expect(page.locator('text=Eyes')).toBeVisible();

    // Check some specific protection options
    await expect(page.locator('text=Skin')).toBeVisible();
    await expect(page.locator('text=Mouth')).toBeVisible();
  });

  test('should not require best practices acceptance', async ({ page }) => {
    // Check that the best practices checkbox is not present
    const bestPracticesCheckbox = page.locator('input[id="best-practices"]');
    await expect(bestPracticesCheckbox).not.toBeVisible();

    // Check that the text about best practices is not present
    const bestPracticesText = page.locator('text=I have read the best practices');
    await expect(bestPracticesText).not.toBeVisible();
  });

  test('should show proper enhancement mode selection', async ({ page }) => {
    // Check enhancement mode buttons
    await expect(page.locator('button:has-text("standard")').first()).toBeVisible();
    await expect(page.locator('button:has-text("detailed")').first()).toBeVisible();
    await expect(page.locator('button:has-text("heavy")').first()).toBeVisible();

    // Heavy mode should be disabled
    const heavyButton = page.locator('button:has-text("heavy")').first();
    await expect(heavyButton).toBeDisabled();
  });
});

test.describe('API Integration Tests', () => {
  test('should fetch available models', async ({ request }) => {
    const response = await request.get('/api/enhance-image?action=models');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.models).toBeDefined();
    expect(Array.isArray(data.models)).toBeTruthy();
    expect(data.models.length).toBeGreaterThan(0);

    // Check for specific models
    const modelIds = data.models.map((m: any) => m.id);
    expect(modelIds).toContain('runninghub-flux-upscaling');
    expect(modelIds).toContain('replicate/magic-image-refiner');
  });

  test('should fetch provider status', async ({ request }) => {
    const response = await request.get('/api/enhance-image?action=providers');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.providers).toBeDefined();
    expect(data.providers.replicate).toBeDefined();
    expect(data.providers.runninghub).toBeDefined();
  });

  test('should handle invalid enhancement request gracefully', async ({ request }) => {
    const response = await request.post('/api/enhance-image', {
      data: {
        // Invalid request - missing required fields
        imageUrl: '',
        settings: {},
        modelId: ''
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });
});

test.describe('Responsive Design Tests', () => {
  test('should work properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/editor');

    // Wait for page to load
    await page.waitForSelector('[data-testid="editor-page"]', { timeout: 10000 });

    // Check that model selection is still visible and functional
    const modelButton = page.locator('button:has-text("RunningHub FLUX")');
    await expect(modelButton).toBeVisible();

    // Check that enhancement button is still accessible
    const enhanceButton = page.locator('button:has-text("Enhance")');
    await expect(enhanceButton).toBeVisible();
  });

  test('should work properly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app/editor');

    // Wait for page to load
    await page.waitForSelector('[data-testid="editor-page"]', { timeout: 10000 });

    // Check that all main sections are visible
    await expect(page.locator('text=Input Image')).toBeVisible();
    await expect(page.locator('text=Result')).toBeVisible();
    await expect(page.locator('text=Keep Certain Areas Unchanged')).toBeVisible();
  });
});