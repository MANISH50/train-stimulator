import { expect, test } from '@playwright/test';

test('loads, renders and drives', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('#scene')).toBeVisible();
  await expect(page.locator('[data-k="sigName"]')).toHaveText('Distant D1');

  // Release the loco brake (hold ;), then notch up twice.
  await page.keyboard.down('Semicolon');
  await page.waitForTimeout(2200);
  await page.keyboard.up('Semicolon');
  await page.keyboard.press('KeyW');
  await page.keyboard.press('KeyW');
  await expect(page.locator('[data-k="notch"]')).toHaveText('2/8');
  await expect
    .poll(async () => Number(await page.locator('[data-k="speed"]').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);

  await page.keyboard.press('F1');
  await expect(page.locator('[data-k="help"]')).toBeVisible();
  await page.keyboard.press('F1');
  expect(errors).toEqual([]);
});

test('switches between the four camera views', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play' }).click();
  const camera = () => page.evaluate(() => window.__game?.camera);
  const instruments = page.locator('.instruments');

  await page.keyboard.press('Digit1');
  await expect.poll(camera).toBe('cab');
  await expect(instruments).toBeHidden(); // the 3D console replaces the HUD panel
  await page.keyboard.press('Digit2');
  await expect.poll(camera).toBe('chase');
  await expect(instruments).toBeVisible();
  await page.keyboard.press('Digit3');
  await expect.poll(camera).toBe('side');
  await page.keyboard.press('Digit4');
  await expect.poll(camera).toBe('top');
  await page.keyboard.press('KeyC');
  await expect.poll(camera).toBe('cab');
  expect(errors).toEqual([]);
});

test('start menu, on-screen camera buttons and Esc menu', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'Start menu' })).toBeVisible();
  await expect(page.getByText('How to drive')).toBeVisible();
  await page.getByRole('button', { name: 'Side' }).click(); // starting camera
  await page.getByRole('button', { name: 'Play' }).click();
  const camera = () => page.evaluate(() => window.__game?.camera);
  await expect.poll(camera).toBe('side');

  await page.locator('.camBar [data-cam="top"]').click();
  await expect.poll(camera).toBe('top');
  await page.locator('.camBar [data-cam="cab"]').click();
  await expect.poll(camera).toBe('cab');
  await expect(page.locator('.keysBar')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Start menu' })).toBeHidden();
});

test('horn blasts are recognised as whistle codes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play' }).click();
  const toast = page.locator('[data-k="toast"]');

  // One long blast = normal departure.
  await page.keyboard.down('KeyH');
  await page.waitForTimeout(1200);
  await page.keyboard.up('KeyH');
  await expect(toast).toContainText('Horn code: one long', { timeout: 5_000 });

  // Two short blasts = calling for the Guard's signal.
  for (let i = 0; i < 2; i++) {
    await page.keyboard.down('KeyH');
    await page.waitForTimeout(250);
    await page.keyboard.up('KeyH');
    await page.waitForTimeout(300);
  }
  await expect(toast).toContainText('Horn code: two short', { timeout: 5_000 });
  expect(errors).toEqual([]);
});
