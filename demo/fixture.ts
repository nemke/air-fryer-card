import type { Entity, HA, Inventory, State } from '../src/types';

// Synthetic fixture derived from public MAF10A spec + screenshot roles. Never a
// hardware test result. Entity IDs intentionally do not follow semantic names.
export function fixture(offline = false): { ha: HA; inventory: Inventory; calls: unknown[]; ids: Record<string, string> } {
  const devices = [{ id: 'demo-fryer', name: 'Kitchen Air Fryer', manufacturer: 'Xiaomi', model: 'careli.fryer.maf10a' }];
  const entities: Entity[] = [], states: Record<string, State> = {}, ids: Record<string, string> = {};
  const calls: unknown[] = [];
  function add(domain: string, key: string, name: string, value: string, attrs: Record<string, unknown> = {}, diagnostic = false) {
    const entity_id = `${domain}.renamed_${entities.length + 1}`;
    const translation_key = key === 'air_fryer' || key === 'info' ? key : `air_fryer-${key}`;
    const e: Entity = { entity_id, device_id: 'demo-fryer', platform: 'xiaomi_miot', translation_key, unique_id: `synthetic-air_fryer.${key}`, entity_category: diagnostic ? 'diagnostic' : undefined };
    entities.push(e); ids[key] = entity_id;
    states[entity_id] = { entity_id, state: offline && domain !== 'button' ? 'unavailable' : value,
      attributes: { friendly_name: name, ...attrs }, last_updated: '2026-01-01T12:00:00Z' };
  }
  add('sensor', 'air_fryer', 'Air Fryer', 'Idle');
  add('sensor', 'left_time', 'Time Remaining', '18', { unit_of_measurement: 'min' });
  add('sensor', 'fault', 'Error', 'No Faults');
  add('number', 'target_temperature', 'Operating Temperature', '180', { min: 40, max: 230, step: 5, unit_of_measurement: '°C' });
  add('number', 'target_time', 'Operating Time', '20', { min: 1, max: 1440, step: 1, unit_of_measurement: 'min' });
  add('select', 'mode', 'Mode', 'Manual', { options: ['Manual', 'French Fries', 'Chicken Wing', 'Steak ', 'Lamb Chops', 'Fish', 'Shrimp', 'Vegetables ', 'Cake', 'Pizza', 'Defrost', 'Dried Fruit', 'Yogurt'] });
  add('switch', 'preheat', 'Preheat', 'off');
  add('switch', 'auto_keep_warm', 'Auto Keep Warm', 'on');
  add('switch', 'current_keep_warm', 'Current Keep Warm', 'off');
  add('number', 'cooking_weight', 'Cooking Weight', '500', { min: 100, max: 1800, step: 1 });
  add('number', 'reservation_left_time', 'Reservation Left Time', '0', { min: 0, max: 2880, step: 1, unit_of_measurement: 'min' });
  add('select', 'target_cooking_measure', 'Target Cooking Measure', 'NULL', { unit_of_measurement: '%', options: ['NULL', 'One Layer', 'Double Layer', 'Half Pot', 'Full Pot'] });
  add('select', 'texture', 'Texture', 'NONE', { options: ['NONE', 'Crispy Roast', 'Tender Roast', 'Degrease'] });
  add('select', 'turn_pot', 'Turn Pot', 'No Need Turn Over Pot', { options: ['No Need Turn Over Pot', 'Need Turn Over Pot'] });
  add('switch', 'turn_pot_config', 'Turn Pot Config', 'off');
  add('button', 'start_cook', 'Start Program', 'unknown');
  add('button', 'pause', 'Pause', 'unknown');
  add('button', 'resume_cook', 'Resume Cook', 'unknown');
  add('button', 'cancel_cooking', 'Stop Program', 'unknown');
  add('button', 'info', 'Info', 'unknown', {}, true);
  const ha: HA = { states, entities: Object.fromEntries(entities.map(e => [e.entity_id, e])), devices: { 'demo-fryer': devices[0] },
    language: 'en', locale: { language: 'en' }, connection: {},
    async callService(domain, service, data) {
      calls.push({ domain, service, data });
      const id = String(data.entity_id);
      if (domain === 'number') states[id] = { ...states[id], state: String(data.value) };
      if (domain === 'select') states[id] = { ...states[id], state: String(data.option) };
      if (domain === 'switch') states[id] = { ...states[id], state: service === 'turn_on' ? 'on' : 'off' };
      if (domain === 'button') {
        const status = id === ids.start_cook || id === ids.resume_cook ? 'Cooking' : id === ids.pause ? 'Paused' : 'Idle';
        states[ids.air_fryer] = { ...states[ids.air_fryer], state: status };
      }
    },
  };
  return { ha, inventory: { devices, entities }, calls, ids };
}
