import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); await expect(page.locator('air-fryer-card h2')).toHaveText('Kitchen Air Fryer'); });
test('autodetects and renders without sending commands', async ({ page }) => {
  await expect(page.getByRole('spinbutton', { name: 'Temperature', exact: true })).toHaveValue('180');
  await expect(page.getByRole('combobox', { name: 'Program', exact: true })).toHaveValue('Manual');
  expect(await page.evaluate(() => (window as any).preview.sample.calls)).toEqual([]);
});
test('number edit uses the correct entity, bounds and value; blocks Start until applied', async ({ page }) => {
  await page.getByRole('spinbutton', { name: 'Temperature', exact: true }).fill('230');
  await expect(page.getByRole('button', { name: 'Start cooking', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start cooking', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => (window as any).preview.sample.calls)).toEqual([{ domain: 'number', service: 'set_value', data: { entity_id: 'number.renamed_4', value: 230 } }]);
});
test('select preserves raw whitespace and locale changes do not send commands', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Program', exact: true }).selectOption('Steak ');
  await expect.poll(() => page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(1);
  expect(await page.evaluate(() => (window as any).preview.sample.calls[0].data.option)).toBe('Steak ');
  await page.locator('#locale').click(); await expect(page.getByRole('spinbutton', { name: 'Temperatura', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(1);
});
test('offline state keeps controls and recovers without reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Offline', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Temperature', exact: true })).toBeDisabled();
  await expect(page.locator('air-fryer-card')).toContainText('may be switched off');
  await page.getByRole('button', { name: 'Ready', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Temperature', exact: true })).toBeEnabled();
});
test('Start, Pause, Resume and Stop require explicit actions and Stop confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'Start cooking', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(3);
  await page.getByRole('button', { name: 'Stop program', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(4);
});
test('read-only Turn Pot has no select and categorical measure is a select', async ({ page }) => {
  await page.getByText('More settings', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Shake reminder', exact: true })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Food quantity', exact: true })).toBeVisible();
  await expect(page.locator('air-fryer-card')).toContainText('No Need Turn Over Pot');
});
test('unrecognized states keep raw label and withhold cycle commands', async ({ page }) => {
  await page.getByRole('button', { name: 'Unknown state', exact: true }).click();
  await expect(page.locator('air-fryer-card')).toContainText('Unrecognized model state');
  await expect(page.getByRole('button', { name: 'Start cooking', exact: true })).toHaveCount(0);
});
test('entity labels remain text and number edits survive HA state updates', async ({ page }) => {
  const input = page.getByRole('spinbutton', { name: 'Temperature', exact: true });
  await input.fill('195'); await page.waitForTimeout(450); await expect(input).toHaveValue('195');
  await page.evaluate(() => { (window as any).preview.card.setConfig({ type: 'custom:air-fryer-card', title: '<img src=x onerror=alert(1)>' }); });
  await expect(page.locator('air-fryer-card h2')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('air-fryer-card img')).toHaveCount(0);
});
test('editor emits minimal configuration and works without a manual entity list', async ({ page }) => {
  await page.getByText('Visual card editor', { exact: true }).click();
  await page.locator('air-fryer-card-editor #title').fill('Dinner');
  await page.locator('air-fryer-card-editor #title').press('Tab');
  await expect(page.locator('air-fryer-card h2')).toHaveText('Dinner');
});
test('automatically selected card never switches to a different fryer', async ({ page }) => {
  await page.evaluate(() => {
    const p = (window as any).preview, f = p.sample;
    f.ha.devices = { second: { id: 'second', name: 'Another fryer', model: 'careli.fryer.maf10a' } };
    f.ha.entities = Object.fromEntries(Object.values(f.ha.entities).map((e: any) => [e.entity_id, { ...e, device_id: 'second' }]));
    p.update();
  });
  await expect(page.locator('air-fryer-card h2')).not.toHaveText('Another fryer');
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(0);
});
test('mobile dark and light layouts fit, and save review screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect(page.getByRole('spinbutton', { name: 'Temperature', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('air-fryer-card').screenshot({ path: 'docs/images/card-dark.png' });
  await page.locator('#theme').click();
  await page.locator('air-fryer-card').screenshot({ path: 'docs/images/card-light.png' });
});
