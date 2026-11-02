import { expect, test } from '@playwright/test';

test('loads, renders and drives', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  test.setTimeout(120_000);
  await page.goto('/');
  await page.locator('[data-quality="low"]').click();
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('#scene')).toBeVisible();
  await expect(page.locator('[data-k="sigName"]')).toHaveText('Automatic A1');

  // Release the loco brake (hold ; until the HUD shows 0%), then notch up twice.
  // Software rendering in CI can be slow, so wait on the handle rather than a fixed time.
  await page.keyboard.down('Semicolon');
  await expect(page.locator('[data-k="indep"]')).toHaveText('0%', { timeout: 60_000 });
  await page.keyboard.up('Semicolon');
  await page.keyboard.press('KeyW');
  await page.keyboard.press('KeyW');
  await expect(page.locator('[data-k="notch"]')).toHaveText('2/8');
  await expect
    .poll(async () => Number(await page.locator('[data-k="speed"]').textContent()), {
      timeout: 60_000,
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

test('every level and weather loads from the menu without errors', async ({ page }) => {
  test.setTimeout(240_000); // five world rebuilds under software rendering
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  const levels = ['training', 'intercity', 'suburban', 'mail', 'goods'];
  const weathers = ['clear', 'haze', 'rain', 'fog', 'night'];
  for (let i = 0; i < levels.length; i++) {
    await page.locator(`[data-level="${levels[i]}"]`).click();
    await page.locator(`[data-weather="${weathers[i]}"]`).click();
    await page.locator('.menu [data-action="play"]').click();
    await expect.poll(() => page.evaluate(() => window.__game?.level)).toBe(levels[i]);
    await expect.poll(() => page.evaluate(() => window.__game?.sim.weatherId)).toBe(weathers[i]);
    await expect(page.locator('[data-k="sigName"]')).not.toHaveText('—');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('a crash shows the wreck, the inquiry card, a replay and a restart', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.locator('[data-level="suburban"]').click();
  await page.locator('[data-accidents="on"]').click();
  await page.locator('.menu [data-action="play"]').click();
  await expect.poll(() => page.evaluate(() => window.__game?.level)).toBe('suburban');
  // Run every red signal at full power until the EMU ahead is hit (stepped by script).
  const kind = await page.evaluate(() => {
    const s = window.__game!.sim;
    for (let n = 0; s.status === 'running' && n < 60 * 300; n++) {
      Object.assign(s.controls, { indepBrake: 0, autoBrake: 0, reverser: 1, notch: 8 });
      s.step();
    }
    return s.accident?.kind;
  });
  expect(kind).toBe('rear-end');
  await expect.poll(() => page.evaluate(() => window.__game?.camera)).toBe('crash');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/crash-impact.png' });
  // Software rendering is slow in CI: fast-forward the wreck until it settles.
  await page.evaluate(() => {
    const s = window.__game!.sim;
    for (let n = 0; !s.crash!.settled && n < 60 * 20; n++) s.step();
  });
  const card = page.locator('.card.inquiry');
  await expect(card).toBeVisible({ timeout: 60_000 });
  await expect(card).toContainText('Rear-end collision');
  await page.screenshot({ path: 'test-results/crash-inquiry.png' });

  await page.keyboard.press('KeyR');
  await expect.poll(() => page.evaluate(() => window.__game?.replaying)).toBe(true);
  await expect(card).toBeHidden();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/crash-replay.png' });

  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__game?.sim.status)).toBe('running');
  expect(errors).toEqual([]);
});
