import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../demo/fixture.ts';
import { discover, fryerDevices } from '../src/discovery.ts';
import { actionAllowed, actionCommand, bounds, Commander, settingCommand } from '../src/commands.ts';
import { cycle, durationLabel, seconds } from '../src/cycle.ts';
import { snapshot } from '../src/snapshot.ts';
import { decodeDisplay, watchRegistry } from '../src/registry.ts';
import { statusRefresh } from '../src/refresh.ts';
import type { Config, HA } from '../src/types.ts';

const config: Config = { type: 'custom:air-fryer-card' };
test('all 20 screenshot entities have a home without semantic entity IDs', () => {
  const f = fixture(), d = discover(f.ha, f.inventory, config);
  assert.equal(d.adapter, 'xiaomi_miot'); assert.equal(d.device?.id, 'demo-fryer');
  assert.equal(Object.keys(d.bindings).length, 19); assert.equal(d.diagnostics.length, 1);
  assert.equal(d.extras.length, 0); assert.equal(d.bindings.start?.entity.entity_id, f.ids.start_cook);
  assert.equal(d.bindings.reminder?.writable, false);
});
test('offline discovery preserves bindings despite available actions', () => {
  const f = fixture(true), d = discover(f.ha, f.inventory, config);
  assert.equal(Object.keys(d.bindings).length, 19); assert.equal(d.online, false);
  assert.equal(d.bindings.start?.available, true); assert.equal(actionAllowed('start', d), false);
  assert.equal(cycle(d).phase, 'unavailable');
});
test('two fryers require selection and never cross device membership', () => {
  const f = fixture();
  f.inventory.devices.push({ id: 'second', model: 'careli.fryer.maf10a', name: 'Same name' });
  const e = { ...f.inventory.entities[15], entity_id: 'button.another_start', device_id: 'second' };
  f.inventory.entities.push(e);
  assert.equal(fryerDevices(f.inventory).length, 2); assert.equal(discover(f.ha, f.inventory, config).device, undefined);
  assert.equal(discover(f.ha, f.inventory, { ...config, device_id: 'demo-fryer' }).bindings.start?.entity.entity_id, f.ids.start_cook);
});
test('same-score duplicate start remains ambiguous; override must belong to selected device', () => {
  const f = fixture();
  f.inventory.entities.push({ ...f.inventory.entities[15], entity_id: 'button.copy' });
  let d = discover(f.ha, f.inventory, config); assert.equal(d.bindings.start, undefined); assert.equal(d.ambiguous.start?.length, 2);
  d = discover(f.ha, f.inventory, { ...config, overrides: { start: f.ids.start_cook } }); assert.equal(d.bindings.start?.entity.entity_id, f.ids.start_cook);
  d = discover(f.ha, f.inventory, { ...config, overrides: { start: 'button.not_owned' } }); assert.equal(d.bindings.start, undefined);
});
test('hidden and disabled entries are respected even for overrides', () => {
  const f = fixture(); f.inventory.entities[15].hidden_by = 'user';
  assert.equal(discover(f.ha, f.inventory, config).bindings.start, undefined);
  assert.ok(discover(f.ha, f.inventory, { ...config, include_hidden: true }).bindings.start);
  f.inventory.entities[15].disabled_by = 'integration';
  assert.equal(discover(f.ha, f.inventory, { ...config, include_hidden: true, overrides: { start: f.ids.start_cook } }).bindings.start, undefined);
});
test('unique ID semantics survive custom names and missing translation key', () => {
  const f = fixture(); f.inventory.entities[15].translation_key = undefined;
  const d = discover(f.ha, f.inventory, config); assert.equal(d.bindings.start?.evidence, 'Miot unique ID');
  f.inventory.entities[15].unique_id = 'unrecognized'; f.inventory.entities[15].entity_id = 'button.kitchen_start_cook';
  assert.equal(discover(f.ha, f.inventory, config).bindings.start, undefined);
});
test('resume_cooking variant maps and recipe start is never normal Start', () => {
  const f = fixture(); f.inventory.entities[17].translation_key = 'air_fryer-resume_cooking';
  assert.ok(discover(f.ha, f.inventory, config).bindings.resume);
  f.inventory.entities[15].translation_key = 'air_fryer-start_recipe_cook'; f.inventory.entities[15].unique_id = 'synthetic-recipe';
  assert.equal(discover(f.ha, f.inventory, config).bindings.start, undefined);
});
test('MAF10A Turn Pot denies writes even under mode override', () => {
  const f = fixture(), d = discover(f.ha, f.inventory, { ...config, overrides: { mode: f.ids.turn_pot } });
  assert.equal(d.bindings.mode?.writable, false);
  assert.throws(() => settingCommand(d.bindings.mode!, 'Need Turn Over Pot', d), /read-only/);
});
test('metadata and options change discovery without a change in entity count', () => {
  const f = fixture(), e = f.inventory.entities[15];
  assert.ok(discover(f.ha, f.inventory, config).bindings.start);
  e.translation_key = 'air_fryer-unrelated'; e.unique_id = 'unrelated';
  assert.equal(discover(f.ha, f.inventory, config).bindings.start, undefined);
});
test('number commands use live bounds and original units', () => {
  const f = fixture(), d = discover(f.ha, f.inventory, config);
  assert.deepEqual(bounds(d.bindings.target_temperature!), { min: 40, max: 230, step: 5 });
  assert.equal(settingCommand(d.bindings.target_temperature!, 230, d).data.value, 230);
  assert.throws(() => settingCommand(d.bindings.target_temperature!, 232, d));
  assert.throws(() => settingCommand(d.bindings.target_temperature!, 181, d));
  assert.equal(settingCommand(d.bindings.duration!, 25, d).data.value, 25);
  delete f.ha.states[f.ids.target_time].attributes.min;
  assert.throws(() => settingCommand(discover(f.ha, f.inventory, config).bindings.duration!, 25, d));
});
test('select command preserves exact whitespace and rejects a stale option', () => {
  const f = fixture(), d = discover(f.ha, f.inventory, config);
  assert.equal(settingCommand(d.bindings.mode!, 'Steak ', d, 'start').data.option, 'Steak ');
  assert.throws(() => settingCommand(d.bindings.mode!, 'Steak', d, 'start'));
  assert.throws(() => settingCommand(d.bindings.mode!, 'Steak ', d), /only when you press Start/);
  assert.equal(settingCommand(d.bindings.preheat!, true, d).service, 'turn_on');
});
test('power detection recognizes Miot on/switch and main-service keys without stealing keep-warm', () => {
  for (const key of ['air_fryer-on', 'air_fryer-switch', 'on', 'air_fryer']) {
    const f = fixture();
    f.inventory.entities.push({ entity_id: 'switch.actual_power', device_id: 'demo-fryer', platform: 'xiaomi_miot', translation_key: key });
    const d = discover(f.ha, f.inventory, config);
    assert.equal(d.bindings.power?.entity.entity_id, 'switch.actual_power');
    assert.equal(d.bindings.auto_keep_warm?.entity.entity_id, f.ids.auto_keep_warm);
  }
});
test('real power control is usable when cooking sensors are unavailable, without a cooking command', async () => {
  const f = fixture(true), c = new Commander();
  const entity = { entity_id: 'switch.actual_power', device_id: 'demo-fryer', platform: 'xiaomi_miot', translation_key: 'air_fryer-on' };
  f.inventory.entities.push(entity);
  f.ha.states[entity.entity_id] = { entity_id: entity.entity_id, state: 'off', attributes: {} };
  const d = discover(f.ha, f.inventory, config);
  assert.equal(d.online, false);
  await c.run(() => ({ ...f, config }), entity.entity_id, true);
  assert.deepEqual(f.calls, [{ domain: 'switch', service: 'turn_on', data: { entity_id: entity.entity_id } }]);
  f.ha.states[entity.entity_id].state = 'unavailable';
  await assert.rejects(c.run(() => ({ ...f, config }), entity.entity_id, false));
  assert.equal(f.calls.length, 1);
});
test('default MAF10A schema never invents a power entity or status write', () => {
  const f = fixture(), d = discover(f.ha, f.inventory, config);
  assert.equal(d.bindings.power, undefined);
  assert.throws(() => settingCommand(d.bindings.status!, false, d));
  assert.equal(f.calls.length, 0);
});
test('staged program starts with one select call and no additional Start action', async () => {
  const f = fixture(), c = new Commander();
  await c.start(() => ({ ...f, config }), { entity_id: f.ids.mode, device_id: 'demo-fryer', option: 'Steak ' });
  assert.deepEqual(f.calls, [{ domain: 'select', service: 'select_option', data: { entity_id: f.ids.mode, option: 'Steak ' } }]);
  assert.equal(f.ha.states[f.ids.air_fryer].state, 'Cooking');
});
test('unchanged program uses the ordinary Start button exactly once', async () => {
  const f = fixture(), c = new Commander();
  await c.start(() => ({ ...f, config }), { entity_id: f.ids.mode, device_id: 'demo-fryer', option: 'Manual' });
  assert.deepEqual(f.calls, [{ domain: 'button', service: 'press', data: { entity_id: f.ids.start_cook } }]);
});
test('stale device/binding/options are rejected before program dispatch', async () => {
  for (const program of [
    { entity_id: 'select.other', device_id: 'demo-fryer', option: 'Steak ' },
    { entity_id: 'select.renamed_6', device_id: 'other', option: 'Steak ' },
    { entity_id: 'select.renamed_6', device_id: 'demo-fryer', option: 'Removed option' },
  ]) {
    const f = fixture(), c = new Commander();
    await assert.rejects(c.start(() => ({ ...f, config }), program)); assert.equal(f.calls.length, 0);
  }
});
test('ordinary setting API cannot dispatch a program selection', async () => {
  const f = fixture(), c = new Commander();
  await assert.rejects(c.run(() => ({ ...f, config }), f.ids.mode, 'Steak '), /only when you press Start/);
  assert.equal(f.calls.length, 0);
});
test('delayed cooking status and duplicate clicks never cause a second Start', async () => {
  const f = fixture(), c = new Commander();
  f.ha.callService = async (domain, service, data) => { f.calls.push({ domain, service, data }); f.ha.states[f.ids.mode].state = String(data.option); };
  const pending = c.start(() => ({ ...f, config }), { entity_id: f.ids.mode, device_id: 'demo-fryer', option: 'Steak ' });
  await new Promise(r => setTimeout(r, 10)); assert.equal(c.pending, true);
  await assert.rejects(c.start(() => ({ ...f, config })), /pending/); assert.equal(f.calls.length, 1);
  f.ha.states[f.ids.air_fryer].state = 'Cooking'; await pending; assert.equal(f.calls.length, 1);
});
test('program service failure or status timeout never falls back to Start', async () => {
  for (const reject of [true, false]) {
    const f = fixture(), c = new Commander(1);
    f.ha.callService = async () => { f.calls.push('select'); if (reject) throw new Error('rejected'); };
    await assert.rejects(c.start(() => ({ ...f, config }), { entity_id: f.ids.mode, device_id: 'demo-fryer', option: 'Steak ' }));
    assert.equal(f.calls.length, 1); assert.equal(c.pending, false);
  }
});
test('all 15 MAF10A states preserve phase, paused and completed meaning', () => {
  const f = fixture();
  for (let i = 0; i < 15; i++) {
    f.ha.states[f.ids.air_fryer].state = String(i);
    const s = cycle(discover(f.ha, f.inventory, config));
    assert.notEqual(s.phase, 'unknown'); assert.equal(s.paused, [2, 8, 9, 11].includes(i));
    assert.equal(s.completed, [6, 7, 12].includes(i));
    if (i === 7) { assert.equal(s.phase, 'preheat'); assert.equal(actionAllowed('start', discover(f.ha, f.inventory, config)), false); }
  }
  f.inventory.devices[0].model = 'careli.fryer.another';
  assert.equal(cycle(discover(f.ha, f.inventory, config)).phase, 'unknown');
});
test('raw property state enables normalization when visible state is localized', () => {
  const f = fixture(); f.ha.states[f.ids.air_fryer].state = 'Pauzirano';
  f.ha.states[f.ids.air_fryer].attributes['air_fryer.status'] = 8;
  assert.equal(cycle(discover(f.ha, f.inventory, config)).phase, 'preheat');
  assert.equal(cycle(discover(f.ha, f.inventory, config)).paused, true);
});
test('recognized paused state wins over a stale copied cooking attribute', () => {
  for (const state of ['Paused', 'pause', '2', '2.0', 'Cooking_Paused']) {
    const f = fixture(); f.ha.states[f.ids.air_fryer].state = state;
    f.ha.states[f.ids.air_fryer].attributes['air_fryer.status'] = 4;
    const d = discover(f.ha, f.inventory, config);
    assert.equal(cycle(d).paused, true);
    assert.equal(actionAllowed('resume', d), true); assert.equal(actionAllowed('pause', d), false);
  }
});
test('recognized cooking state wins over a stale paused attribute; localized raw strings still work', () => {
  const f = fixture(); f.ha.states[f.ids.air_fryer].state = 'Cooking';
  f.ha.states[f.ids.air_fryer].attributes['air_fryer.status'] = 2;
  assert.equal(cycle(discover(f.ha, f.inventory, config)).paused, false);
  f.ha.states[f.ids.air_fryer].state = 'Pauzirano';
  f.ha.states[f.ids.air_fryer].attributes['air_fryer.status'] = '2';
  assert.equal(cycle(discover(f.ha, f.inventory, config)).paused, true);
});
test('plain resume semantic key is recognized on the selected device', () => {
  const f = fixture(); f.inventory.entities[17].translation_key = 'air_fryer-resume';
  assert.equal(discover(f.ha, f.inventory, config).bindings.resume?.entity.entity_id, f.ids.resume_cook);
});
test('ordinary Start remains locked after service acknowledgement until cooking is reported', async () => {
  const f = fixture(), c = new Commander();
  f.ha.callService = async (domain, service, data) => { f.calls.push({ domain, service, data }); };
  const pending = c.start(() => ({ ...f, config }));
  await new Promise(r => setTimeout(r, 10));
  assert.equal(c.pending, true); assert.equal(f.calls.length, 1);
  await assert.rejects(c.start(() => ({ ...f, config })), /pending/);
  f.ha.states[f.ids.air_fryer].state = 'Cooking'; await pending;
  assert.equal(c.pending, false); assert.equal(f.calls.length, 1);
});
test('Pause and Resume wait for state confirmation and tolerate stale attributes', async () => {
  const f = fixture(), c = new Commander(); f.ha.states[f.ids.air_fryer].state = 'Cooking';
  f.ha.states[f.ids.air_fryer].attributes['air_fryer.status'] = 4;
  f.ha.callService = async (domain, service, data) => { f.calls.push({ domain, service, data }); };
  const pause = c.action(() => ({ ...f, config }), 'pause');
  await new Promise(r => setTimeout(r, 10)); assert.equal(c.pending, true);
  f.ha.states[f.ids.air_fryer].state = 'Paused'; await pause;
  assert.equal(actionAllowed('resume', discover(f.ha, f.inventory, config)), true);
  f.ha.states[f.ids.air_fryer].attributes['air_fryer.status'] = 2;
  const resume = c.action(() => ({ ...f, config }), 'resume');
  await new Promise(r => setTimeout(r, 10)); assert.equal(c.pending, true);
  f.ha.states[f.ids.air_fryer].state = 'Cooking'; await resume;
  assert.equal(f.calls.length, 2); assert.equal(c.pending, false);
});
test('ordinary cycle action timeouts and cancellation unlock without retrying', async () => {
  for (const cancel of [false, true]) {
    const f = fixture(), c = new Commander(cancel ? 35000 : 1);
    f.ha.callService = async () => { f.calls.push('start'); };
    const promise = c.start(() => ({ ...f, config }));
    if (cancel) { await new Promise(r => setTimeout(r, 10)); c.cancel(); }
    await assert.rejects(promise, cancel ? /cancelled/ : /not confirmed/);
    assert.equal(c.pending, false); assert.equal(f.calls.length, 1);
  }
});
test('MAF10A direct status refresh is a registered read of the exact selected-device property', () => {
  const f = fixture(); f.ha.services = { xiaomi_miot: { get_properties: {} }, homeassistant: { update_entity: {} } };
  const d = discover(f.ha, f.inventory, config);
  assert.deepEqual(statusRefresh(f.ha, d), { domain: 'xiaomi_miot', service: 'get_properties', data: {
    entity_id: [f.ids.air_fryer], mapping: [{ siid: 2, piid: 1 }], update_entity: true,
  } });
  assert.equal(f.calls.length, 0);
  d.bindings.status!.entity.device_id = 'other'; assert.equal(statusRefresh(f.ha, d), undefined);
});
test('refresh requires advertised services and never reuses MAF10A property IDs on another model', () => {
  const f = fixture();
  assert.equal(statusRefresh(f.ha, discover(f.ha, f.inventory, config)), undefined);
  f.ha.services = { xiaomi_miot: { get_properties: {} } };
  f.inventory.devices[0].model = 'careli.fryer.another';
  assert.equal(statusRefresh(f.ha, discover(f.ha, f.inventory, config)), undefined);
  f.ha.services.homeassistant = { update_entity: {} };
  assert.deepEqual(statusRefresh(f.ha, discover(f.ha, f.inventory, config)), {
    domain: 'homeassistant', service: 'update_entity', data: { entity_id: [f.ids.air_fryer] },
  });
});
test('confirmed commands do not request unnecessary status reads', async () => {
  const f = fixture(), c = new Commander(); f.ha.services = { xiaomi_miot: { get_properties: {} } };
  await c.start(() => ({ ...f, config })); assert.equal(f.calls.length, 1);
});
test('fresh status unlocks Pause before the refresh service acknowledgement finishes', async () => {
  const f = fixture(), c = new Commander(3000); f.ha.states[f.ids.air_fryer].state = 'Cooking';
  f.ha.services = { xiaomi_miot: { get_properties: {} } };
  let reads = 0;
  f.ha.callService = async (domain, service, data) => {
    f.calls.push({ domain, service, data });
    if (service === 'get_properties') {
      reads++; f.ha.states[f.ids.air_fryer].state = 'Paused';
      await new Promise<void>(() => {}); // Coordinator follow-up is still pending.
    }
  };
  await c.action(() => ({ ...f, config }), 'pause');
  assert.equal(c.pending, false); assert.equal(reads, 1); assert.equal(f.calls.length, 2);
});
test('direct status reads begin before the control service responds, including changed-program Start', async () => {
  for (const changedProgram of [false, true]) {
    const f = fixture(), c = new Commander(1500);
    f.ha.services = { xiaomi_miot: { get_properties: {} } };
    f.ha.callService = async (domain, service, data) => {
      f.calls.push({ domain, service, data });
      if (service === 'get_properties') f.ha.states[f.ids.air_fryer].state = 'Cooking';
      await new Promise<void>(() => {}); // Both control and read responses remain open.
    };
    await c.start(() => ({ ...f, config }), changedProgram ? {
      entity_id: f.ids.mode, device_id: 'demo-fryer', option: 'Steak ',
    } : undefined);
    assert.equal(c.pending, false); assert.equal(f.calls.length, 2);
    assert.equal((f.calls[0] as { service: string }).service, changedProgram ? 'select_option' : 'press');
    assert.equal(c.lastAction?.phase, 'confirmed'); assert.equal(c.lastAction.serviceMs, undefined);
    assert.equal(c.lastAction.refreshes, 1); assert.ok(c.lastAction.firstRefreshMs! >= 250);
    assert.ok(c.lastAction.confirmedMs! >= c.lastAction.firstRefreshMs!);
  }
});
test('pushed state confirms Pause before control acknowledgement even without a refresh service', async () => {
  const f = fixture(), c = new Commander(1000); f.ha.states[f.ids.air_fryer].state = 'Cooking';
  let acknowledge!: () => void;
  f.ha.callService = async () => {
    setTimeout(() => { f.ha.states[f.ids.air_fryer].state = 'Paused'; }, 20);
    await new Promise<void>(resolve => { acknowledge = resolve; });
  };
  await c.action(() => ({ ...f, config }), 'pause');
  assert.equal(c.pending, false); assert.equal(c.lastAction?.phase, 'confirmed');
  assert.equal(c.lastAction.serviceMs, undefined); assert.equal(c.lastAction.refreshes, 0);
  acknowledge(); await Promise.resolve(); await Promise.resolve();
  assert.equal(c.lastAction.phase, 'confirmed'); assert.equal(typeof c.lastAction.serviceMs, 'number');
});
test('late service rejection is handled without undoing confirmation or overwriting a newer action', async () => {
  const f = fixture(); let updates = 0;
  const c = new Commander(1000, () => { updates++; }); let reject!: (error: Error) => void;
  f.ha.callService = async () => {
    f.ha.states[f.ids.air_fryer].state = 'Cooking';
    await new Promise<void>((_, r) => { reject = r; });
  };
  await c.start(() => ({ ...f, config })); const oldTiming = c.lastAction!;
  f.ha.callService = async () => { f.ha.states[f.ids.air_fryer].state = 'Paused'; };
  await c.action(() => ({ ...f, config }), 'pause'); const currentTiming = c.lastAction!, before = updates;
  reject(new Error('late response error')); await new Promise(r => setTimeout(r, 0));
  assert.equal(oldTiming.phase, 'confirmed'); assert.equal(oldTiming.serviceFailed, true);
  assert.equal(c.lastAction, currentTiming); assert.equal(currentTiming.role, 'pause');
  assert.equal(currentTiming.serviceFailed, false); assert.equal(updates, before);
});
test('a pending control response cannot prevent timeout or cancellation', async () => {
  for (const cancel of [false, true]) {
    const f = fixture(), c = new Commander(cancel ? 2000 : 1);
    f.ha.services = { xiaomi_miot: { get_properties: {} } };
    f.ha.callService = async () => { f.calls.push('control'); await new Promise<void>(() => {}); };
    const promise = c.start(() => ({ ...f, config }));
    if (cancel) c.cancel();
    await assert.rejects(promise, cancel ? /cancelled/ : /not confirmed/);
    assert.equal(c.pending, false); assert.equal(f.calls.length, 1);
    assert.equal(c.lastAction?.phase, cancel ? 'cancelled' : 'failed');
    assert.equal(c.lastAction.serviceMs, undefined);
  }
});
test('service rejection before confirmation fails once and reports timing, including synchronous throws', async () => {
  for (const synchronous of [false, true]) {
    const f = fixture(), c = new Commander(1000);
    f.ha.services = { xiaomi_miot: { get_properties: {} } };
    f.ha.callService = () => {
      f.calls.push('control');
      if (synchronous) throw new Error('Denied');
      return Promise.reject(new Error('Denied'));
    };
    await assert.rejects(c.start(() => ({ ...f, config })), /Denied/);
    assert.equal(c.pending, false); assert.deepEqual(f.calls, ['control']);
    assert.equal(c.lastAction?.serviceFailed, true); assert.equal(c.lastAction.phase, 'failed');
    assert.equal(typeof c.lastAction.serviceMs, 'number'); assert.equal(c.lastAction.confirmedMs, undefined);
  }
});
test('bounded second direct read is not blocked by a pending coordinator acknowledgement', async () => {
  const f = fixture(), c = new Commander(3000); f.ha.states[f.ids.air_fryer].state = 'Cooking';
  f.ha.services = { xiaomi_miot: { get_properties: {} } }; let reads = 0;
  f.ha.callService = async (domain, service) => {
    f.calls.push(service);
    if (domain === 'xiaomi_miot') {
      if (++reads === 2) f.ha.states[f.ids.air_fryer].state = 'Paused';
      await new Promise<void>(() => {});
    }
  };
  await c.action(() => ({ ...f, config }), 'pause');
  assert.deepEqual(f.calls, ['press', 'get_properties', 'get_properties']); assert.equal(c.pending, false);
});
test('unconfirmed action performs at most three reads and never repeats the control command', async () => {
  const f = fixture(), c = new Commander(3400); f.ha.services = { xiaomi_miot: { get_properties: {} } };
  f.ha.callService = async (domain, service) => { f.calls.push(service); };
  await assert.rejects(c.start(() => ({ ...f, config })), /not confirmed/);
  assert.deepEqual(f.calls, ['press', 'get_properties', 'get_properties', 'get_properties']);
});
test('refresh permission failure falls back to reported state without failing or retrying the action', async () => {
  const f = fixture(), c = new Commander(2000); f.ha.services = { xiaomi_miot: { get_properties: {} } };
  f.ha.callService = async (domain, service) => {
    f.calls.push(service);
    if (domain === 'xiaomi_miot') {
      setTimeout(() => { f.ha.states[f.ids.air_fryer].state = 'Cooking'; }, 50);
      throw new Error('Unauthorized refresh');
    }
  };
  await c.start(() => ({ ...f, config }));
  assert.deepEqual(f.calls, ['press', 'get_properties']);
  assert.equal(c.lastAction?.refreshFailed, true); assert.equal(c.lastAction.phase, 'confirmed');
});
test('cancellation stops the read burst even if an outstanding refresh cannot be cancelled', async () => {
  const f = fixture(), c = new Commander(2000); f.ha.services = { xiaomi_miot: { get_properties: {} } };
  f.ha.callService = async (domain, service) => {
    f.calls.push(service);
    if (domain === 'xiaomi_miot') { c.cancel(); await new Promise<void>(() => {}); }
  };
  await assert.rejects(c.start(() => ({ ...f, config })), /cancelled/);
  assert.deepEqual(f.calls, ['press', 'get_properties']); assert.equal(c.pending, false);
});
test('coordinator refresh fallback allows only one outstanding call', async () => {
  const f = fixture(), c = new Commander(1500); f.ha.services = { homeassistant: { update_entity: {} } };
  f.ha.callService = async (domain, service) => {
    f.calls.push(service); if (domain === 'homeassistant') await new Promise<void>(() => {});
  };
  await assert.rejects(c.start(() => ({ ...f, config })), /not confirmed/);
  assert.deepEqual(f.calls, ['press', 'update_entity']);
});
test('known MAF10A faults withhold Start and Resume', () => {
  const f = fixture(); f.ha.states[f.ids.fault].state = 'E1';
  assert.equal(actionAllowed('start', discover(f.ha, f.inventory, config)), false);
  f.ha.states[f.ids.air_fryer].state = 'Paused';
  assert.equal(actionAllowed('resume', discover(f.ha, f.inventory, config)), false);
  assert.equal(actionAllowed('stop', discover(f.ha, f.inventory, config)), true);
});
test('actions follow current cycle; unknown button state is usable', () => {
  const f = fixture(); let d = discover(f.ha, f.inventory, config);
  assert.equal(actionAllowed('start', d), true); assert.equal(actionAllowed('resume', d), false);
  assert.equal(actionCommand('start', d).data.entity_id, f.ids.start_cook);
  f.ha.states[f.ids.air_fryer].state = 'Paused'; d = discover(f.ha, f.inventory, config);
  assert.equal(actionAllowed('resume', d), true); assert.equal(actionAllowed('pause', d), false);
  f.ha.states[f.ids.air_fryer].state = 'Future State';
  assert.throws(() => actionCommand('start', discover(f.ha, f.inventory, config)));
});
test('time conversion separates unknown units and invalid values', () => {
  assert.equal(seconds('2', 'min'), 120); assert.equal(seconds('2', 's'), 2); assert.equal(seconds('2', 'h'), 7200);
  assert.equal(seconds('', 'min'), undefined); assert.equal(seconds('2', undefined), undefined);
  assert.equal(seconds('-1', 's'), undefined); assert.equal(durationLabel(120), '2 min'); assert.equal(durationLabel(0), '0 s');
});
test('generic sensor-only device remains read-only and accepts no numeric state mapping', () => {
  const f = fixture(); f.inventory.entities = f.inventory.entities.filter(e => e.entity_id.startsWith('sensor.')).map(e => ({ ...e, platform: 'generic' }));
  const d = discover(f.ha, f.inventory, config);
  assert.equal(d.adapter, 'generic'); assert.equal(cycle(d).phase, 'unknown');
  assert.equal(d.bindings.status?.writable, false); assert.equal(actionAllowed('start', d), false);
});
test('writable target wins over a separate read-only sensor', () => {
  const f = fixture(); f.inventory.entities.push({ ...f.inventory.entities[3], entity_id: 'sensor.setpoint' });
  assert.equal(discover(f.ha, f.inventory, config).bindings.target_temperature?.domain, 'number');
});
test('command revalidates ownership at dispatch and does not mutate on discovery', async () => {
  const f = fixture(), c = new Commander();
  discover(f.ha, f.inventory, config); snapshot(discover(f.ha, f.inventory, config)); assert.equal(f.calls.length, 0);
  f.inventory.entities[3].device_id = 'unrelated';
  await assert.rejects(c.run(() => ({ ...f, config }), f.ids.target_temperature, 190)); assert.equal(f.calls.length, 0);
});
test('command serialization rejects double submission and waits for setting confirmation', async () => {
  const f = fixture(), c = new Commander(); let resolve!: () => void;
  f.ha.callService = async () => { f.calls.push('call'); await new Promise<void>(r => resolve = r); };
  const promise = c.run(() => ({ ...f, config }), f.ids.target_temperature, 190);
  await assert.rejects(c.action(() => ({ ...f, config }), 'start'), /pending/);
  resolve(); await new Promise(r => setTimeout(r, 10)); assert.equal(c.pending, true);
  f.ha.states[f.ids.target_temperature].state = '190.0'; await promise;
  assert.equal(c.pending, false); assert.equal(f.calls.length, 1);
});
test('command failures unlock without retries; cancellation clears observation', async () => {
  const f = fixture(), c = new Commander(); f.ha.callService = async () => { throw new Error('rejected'); };
  await assert.rejects(c.action(() => ({ ...f, config }), 'start'), /rejected/); assert.equal(c.pending, false);
  f.ha.callService = async () => {}; const waiting = c.run(() => ({ ...f, config }), f.ids.target_temperature, 190);
  await new Promise(r => setTimeout(r, 10)); c.cancel(); await assert.rejects(waiting, /cancelled/); assert.equal(c.pending, false);
});
test('sanitized export excludes IDs, names, raw values and arbitrary attributes', () => {
  const f = fixture(); f.ha.states[f.ids.target_temperature].attributes.secret = 'private-secret';
  const value = JSON.stringify(snapshot(discover(f.ha, f.inventory, config)));
  for (const secret of ['private-secret', f.ids.target_temperature, 'Kitchen Air Fryer', 'synthetic-air_fryer', 'friendly_name']) assert.equal(value.includes(secret), false);
  assert.equal(JSON.parse(value).entities.length, 20);
});
test('timing export includes only command metadata and never service errors or payloads', () => {
  const f = fixture(), timing = {
    role: 'pause' as const, phase: 'confirmed' as const, serviceMs: 20000, confirmedMs: 401,
    firstRefreshMs: 301, refreshes: 1, refreshFailed: false, serviceFailed: false,
    error: 'private-error', data: { entity_id: 'private-entity' },
  };
  const value = JSON.stringify(snapshot(discover(f.ha, f.inventory, config), timing));
  assert.equal(value.includes('private-'), false);
  assert.deepEqual(JSON.parse(value).last_action, {
    role: 'pause', phase: 'confirmed', service_ms: 20000, confirmed_ms: 401,
    first_refresh_ms: 301, refreshes: 1, refresh_failed: false, service_failed: false,
  });
});
test('display registry decoder retains integration, semantic key and hidden/category flags', () => {
  const [e] = decodeDisplay({ entity_categories: { 0: 'diagnostic' }, entities: [{ ei: 'button.x', di: 'd', pl: 'xiaomi_miot', tk: 'air_fryer-pause', hb: true, ec: 0 }] });
  assert.equal(e.hidden, true); assert.equal(e.entity_category, 'diagnostic'); assert.equal(e.translation_key, 'air_fryer-pause');
});
test('registry reads are shared per connection and subscriptions cleaned on disconnect', async () => {
  const f = fixture(); const calls: string[] = [], unsubscribed: string[] = [], events: Record<string, () => void> = {};
  const ha: HA = { ...f.ha, connection: { async subscribeEvents(callback, type) { events[type] = callback; return () => { unsubscribed.push(type); }; } },
    async callWS(message) { calls.push(String(message.type)); return (message.type === 'config/entity_registry/list' ? f.inventory.entities : f.inventory.devices) as never; } };
  let count = 0;
  const stop1 = watchRegistry(ha, () => count++), stop2 = watchRegistry(ha, () => count++);
  await new Promise(r => setTimeout(r, 10)); assert.equal(calls.length, 2); assert.equal(count, 2);
  events.entity_registry_updated(); await new Promise(r => setTimeout(r, 10)); assert.equal(calls.length, 4);
  stop1(); assert.equal(unsubscribed.length, 0); stop2(); assert.equal(unsubscribed.length, 2);
});
