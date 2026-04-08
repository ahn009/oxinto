'use strict';

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Smart Product Advisor - Web UI', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh each test
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('page loads with chat interface', async ({ page }) => {
    await expect(page.locator('header h1')).toContainText('Smart Product Advisor');
    await expect(page.locator('#chat-window')).toBeVisible();
    await expect(page.locator('#user-input')).toBeVisible();
    await expect(page.locator('#send-btn')).toBeVisible();
  });

  test('bot sends initial greeting on load', async ({ page }) => {
    // Wait for bot message to appear
    await expect(page.locator('.message.bot').first()).toBeVisible({ timeout: 10000 });
    const botText = await page.locator('.message.bot .bubble').first().textContent();
    expect(botText.length).toBeGreaterThan(10);
  });

  test('user can type and send a message', async ({ page }) => {
    await page.locator('.message.bot').first().waitFor({ timeout: 10000 });

    await page.fill('#user-input', '1');
    await page.click('#send-btn');

    // User message appears
    await expect(page.locator('.message.user').first()).toBeVisible();
    const userMsg = await page.locator('.message.user .bubble').first().textContent();
    expect(userMsg).toBe('1');
  });

  test('quick reply buttons appear for multiple choice questions', async ({ page }) => {
    // Wait for initial bot response with quick replies
    await page.waitForSelector('.qr-btn', { timeout: 10000 });
    const buttons = await page.locator('.qr-btn').count();
    expect(buttons).toBeGreaterThan(0);
  });

  test('clicking quick reply sends the selection', async ({ page }) => {
    await page.waitForSelector('.qr-btn', { timeout: 10000 });
    const firstBtn = page.locator('.qr-btn').first();
    const btnText = await firstBtn.textContent();
    await firstBtn.click();

    // User message should appear
    await expect(page.locator('.message.user').first()).toBeVisible({ timeout: 5000 });
  });

  test('language toggle switches to Portuguese', async ({ page }) => {
    const ptBtn = page.locator('.lang-btn').filter({ hasText: 'PT' });
    await ptBtn.click();
    await expect(ptBtn).toHaveClass(/active/);
  });

  test('completes full questionnaire and shows offer cards', async ({ page }) => {
    // Answer all questions with option "1"
    for (let i = 0; i < 8; i++) {
      const qrBtn = page.locator('.qr-btn').first();
      const isVisible = await qrBtn.isVisible().catch(() => false);

      if (isVisible) {
        await qrBtn.click();
        await page.waitForTimeout(500);
      } else {
        // Text question - type skip
        const input = page.locator('#user-input');
        await input.fill('skip');
        await page.click('#send-btn');
        await page.waitForTimeout(500);
      }

      // Check if offers appeared
      const offersVisible = await page.locator('.offer-tier').first().isVisible().catch(() => false);
      if (offersVisible) break;
    }

    // Offers should now be visible
    await expect(page.locator('.offer-tier').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.tier-premium')).toBeVisible();
  });
});
