import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

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
test('program selection is local, survives HA/locale updates, and sends one command only on Start', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Program', exact: true }).selectOption('Steak ');
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(0);
  await expect(page.getByRole('combobox', { name: 'Program', exact: true })).toHaveValue('Steak ');
  await page.locator('#locale').click(); await expect(page.getByRole('spinbutton', { name: 'Temperatura', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(0);
  await page.getByRole('button', { name: 'Pokreni izabrani program', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(1);
  expect(await page.evaluate(() => (window as any).preview.sample.calls[0])).toEqual({ domain: 'select', service: 'select_option', data: { entity_id: 'select.renamed_6', option: 'Steak ' } });
  await expect(page.getByRole('button', { name: 'Pauziraj', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(1);
});
test('discarding or repeatedly changing a program sends no commands', async ({ page }) => {
  const select = page.getByRole('combobox', { name: 'Program', exact: true });
  await select.selectOption('Steak '); await select.selectOption('French Fries');
  await page.getByRole('button', { name: 'Discard program selection', exact: true }).click();
  await expect(select).toHaveValue('Manual');
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(0);
});
test('power is clearly unavailable when no real power entity exists', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Turn on', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Turn on', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Turn off', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Turn off', exact: true })).toBeDisabled();
  await expect(page.locator('air-fryer-card')).toContainText('Use the appliance’s power button');
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(0);
});
test('Start immediately shows progress and remains locked while HA reports the old state', async ({ page }) => {
  await page.evaluate(() => {
    const p = (window as any).preview, f = p.sample;
    f.ha.callService = async (domain: string, service: string, data: unknown) => { f.calls.push({ domain, service, data }); };
    p.update();
    p.stopUpdates();
  });
  await page.getByRole('button', { name: 'Start cooking', exact: true }).click();
  const starting = page.getByRole('button', { name: 'Starting…', exact: true });
  await expect(starting).toBeVisible(); await expect(starting).toBeDisabled();
  await expect(starting).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('status')).toContainText('You only need to press once');
  await page.locator('air-fryer-card').screenshot({ path: 'docs/images/card-starting.png' });
  // A synthetic repeated click must also be rejected by the event handler, not only CSS.
  await starting.dispatchEvent('click'); await page.waitForTimeout(350);
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(1);
  await page.evaluate(() => { const p = (window as any).preview; p.sample.ha.states[p.sample.ids.air_fryer].state = 'Cooking'; p.update(); });
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled();
  await expect(starting).toHaveCount(0);
});
test('Pause shows progress then Resume despite a stale raw Cooking attribute', async ({ page }) => {
  await page.getByRole('button', { name: 'Cooking', exact: true }).click();
  await page.evaluate(() => {
    const p = (window as any).preview, f = p.sample;
    f.ha.states[f.ids.air_fryer].attributes['air_fryer.status'] = 4;
    f.ha.callService = async (domain: string, service: string, data: unknown) => {
      const root = p.card.shadowRoot;
      (window as any).pauseAtDispatch = {
        row: root.querySelector('.actions').textContent.trim(),
        buttons: root.querySelectorAll('.actions button').length,
        disabled: root.querySelector('.actions button').disabled,
      };
      f.calls.push({ domain, service, data });
    };
    p.update();
    p.stopUpdates();
  });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pausing…', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toHaveCount(0);
  await expect(page.locator('air-fryer-card .actions button')).toHaveCount(1);
  expect(await page.evaluate(() => (window as any).pauseAtDispatch)).toEqual({ row: 'Pausing…', buttons: 1, disabled: true });
  await page.waitForTimeout(400);
  await expect(page.getByRole('button', { name: 'Pausing…', exact: true })).toBeDisabled();
  await page.locator('air-fryer-card').screenshot({ path: 'docs/images/card-pausing.png' });
  await page.evaluate(() => { const p = (window as any).preview; p.sample.ha.states[p.sample.ids.air_fryer].state = 'Paused'; p.update(); });
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resuming…', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toHaveCount(0);
  await page.evaluate(() => { const p = (window as any).preview; p.sample.ha.states[p.sample.ids.air_fryer].state = 'Cooking'; p.update(); });
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(2);
});
test('post-command direct read confirms Pause without the periodic HA update or refresh acknowledgement', async ({ page }) => {
  await page.getByRole('button', { name: 'Cooking', exact: true }).click();
  await page.evaluate(() => {
    const p = (window as any).preview, f = p.sample;
    f.ha.services = { xiaomi_miot: { get_properties: {} } };
    f.ha.callService = async (domain: string, service: string, data: unknown) => {
      f.calls.push({ domain, service, data });
      if (service === 'get_properties') {
        f.ha.states[f.ids.air_fryer].state = 'Paused';
        await new Promise<void>(() => {});
      }
    };
    p.update(); p.stopUpdates();
  });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pausing…', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeEnabled({ timeout: 2500 });
  expect(await page.evaluate(() => (window as any).preview.sample.calls)).toEqual([
    { domain: 'button', service: 'press', data: { entity_id: 'button.renamed_17' } },
    { domain: 'xiaomi_miot', service: 'get_properties', data: { entity_id: ['sensor.renamed_1'], mapping: [{ siid: 2, piid: 1 }], update_entity: true } },
  ]);
});
test('missing Resume binding is visible and explained instead of retaining Pause', async ({ page }) => {
  await page.getByRole('button', { name: 'Paused', exact: true }).click();
  await page.evaluate(() => {
    const p = (window as any).preview, f = p.sample;
    f.ha.entities[f.ids.resume_cook].disabled_by = 'user'; p.update();
  });
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeDisabled();
  await expect(page.locator('air-fryer-card')).toContainText('Resume is not bound');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0);
});
test('loaded bundle version is visible without expanding diagnostics', async ({ page }) => {
  await expect(page.locator('air-fryer-card')).toHaveAttribute('data-card-version', version);
  await expect(page.getByText(`Discovery details · v${version}`, { exact: true })).toBeVisible();
});
test('discovered power button is on the main card and works with offline cooking sensors', async ({ page }) => {
  await page.getByRole('button', { name: 'Offline', exact: true }).click();
  await page.evaluate(() => {
    const p = (window as any).preview, f = p.sample, id = 'switch.actual_power';
    f.ha.entities[id] = { entity_id: id, device_id: 'demo-fryer', platform: 'xiaomi_miot', translation_key: 'air_fryer-on' };
    f.ha.states[id] = { entity_id: id, state: 'off', attributes: {} }; p.update();
  });
  await page.getByRole('button', { name: 'Turn on', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Turn off', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => (window as any).preview.sample.calls)).toEqual([{ domain: 'switch', service: 'turn_on', data: { entity_id: 'switch.actual_power' } }]);
  await page.getByRole('button', { name: 'Turn off', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Turn on', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => (window as any).preview.sample.calls.length)).toBe(2);
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
test('production bundle registers and controls the fixture without external runtime files', async ({ page }) => {
  await page.route('**/production-preview', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }));
  await page.goto('/production-preview');
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173')) external.push(request.url()); });
  await page.addScriptTag({ type: 'module', url: '/dist/air-fryer-card.js' });
  await page.evaluate(async () => {
    const { fixture } = await import('/demo/fixture.ts' as string);
    const f = fixture(), card = document.createElement('air-fryer-card') as any;
    f.ha.services = { xiaomi_miot: { get_properties: {} } };
    f.ha.callService = async (domain: string, service: string, data: unknown) => {
      f.calls.push({ domain, service, data });
      if (service === 'get_properties') {
        f.ha.states[f.ids.air_fryer].state = 'Cooking';
        await new Promise<void>(() => {});
      }
    };
    card.setConfig({ type: 'custom:air-fryer-card' }); card.hass = f.ha;
    document.body.append(card); (window as any).bundleFixture = f;
  });
  await expect(page.getByRole('spinbutton', { name: 'Temperature', exact: true })).toHaveValue('180');
  expect(await page.evaluate(() => (window as any).bundleFixture.calls)).toEqual([]);
  await page.getByRole('button', { name: 'Start cooking', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled({ timeout: 2500 });
  expect(await page.evaluate(() => (window as any).bundleFixture.calls[0])).toEqual({ domain: 'button', service: 'press', data: { entity_id: 'button.renamed_16' } });
  expect(await page.evaluate(() => (window as any).bundleFixture.calls[1])).toEqual({ domain: 'xiaomi_miot', service: 'get_properties', data: {
    entity_id: ['sensor.renamed_1'], mapping: [{ siid: 2, piid: 1 }], update_entity: true,
  } });
  expect(external).toEqual([]);
});
