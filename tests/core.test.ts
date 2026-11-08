import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../demo/fixture.ts';
import { discover, fryerDevices } from '../src/discovery.ts';
import { actionAllowed, actionCommand, bounds, Commander, settingCommand } from '../src/commands.ts';
import { cycle, durationLabel, seconds } from '../src/cycle.ts';
import { snapshot } from '../src/snapshot.ts';
import { decodeDisplay, watchRegistry } from '../src/registry.ts';
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
  assert.equal(settingCommand(d.bindings.mode!, 'Steak ', d).data.option, 'Steak ');
  assert.throws(() => settingCommand(d.bindings.mode!, 'Steak', d));
  assert.equal(settingCommand(d.bindings.preheat!, true, d).service, 'turn_on');
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
