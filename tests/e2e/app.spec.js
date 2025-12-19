const { test, expect } = require('@playwright/test');

async function fillDefaultForm(page) {
    await page.fill('#date-input', '2025-01-15');
    await page.fill('#goal-input', '07:00');
    await page.fill('#start-morning', '08:00');
    await page.fill('#end-morning', '12:00');
    await page.fill('#start-afternoon', '13:00');
    await page.fill('#end-afternoon', '17:00');
    await page.selectOption('#balance-sign', '+');
    await page.fill('#balance-hhmm', '00:00');
}

test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('calculates totals and updates the balance', async ({ page }) => {
    await fillDefaultForm(page);
    await page.click('button[type="submit"]');

    await expect(page.locator('.result-summary__code')).toContainText(
        '08:00-12:00-13:00-17:00'
    );

    await expect(page.locator('#balance-hhmm')).toHaveValue('01:00');

    const storedBalance = await page.evaluate(() => localStorage.getItem('workHoursBalance'));
    expect(JSON.parse(storedBalance)).toBe('+01:00');
});

test('supports summary format changes', async ({ page }) => {
    await page.click('#settings-button');
    await page.selectOption('#summary-format', 'timesOnly');
    await page.click('#close-settings');

    await fillDefaultForm(page);
    await page.click('button[type="submit"]');

    await expect(page.locator('.result-summary__code')).toHaveText(
        '08:00-12:00-13:00-17:00'
    );
});

test('adds and clears history entries', async ({ page }) => {
    await fillDefaultForm(page);
    await page.click('button[type="submit"]');

    await expect(page.locator('#history-list li')).toHaveCount(1);

    await page.click('#clear-history');
    await expect(page.locator('#history-list li')).toHaveCount(0);

    const storedHistory = await page.evaluate(() => localStorage.getItem('workHoursHistory'));
    expect(storedHistory).toBeNull();
});

test('toggles theme mode', async ({ page }) => {
    const body = page.locator('body');
    const initialHasDark = await body.evaluate((node) => node.classList.contains('theme-dark'));

    await page.click('#theme-toggle');

    if (initialHasDark) {
        await expect(body).toHaveClass(/theme-light/);
    } else {
        await expect(body).toHaveClass(/theme-dark/);
    }
});
