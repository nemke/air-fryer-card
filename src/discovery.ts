import type { Binding, Config, Device, Discovery, Entity, HA, Inventory, Role } from './types';

export const domainOf = (id: string) => id.split('.')[0];
export const available = (value?: string) => value !== undefined && !['unavailable', 'unknown', ''].includes(value);
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const aliases: Record<Role, string[]> = {
  status: ['air_fryer', 'air_fryer_status', 'status', 'cooking_status'],
  remaining: ['left_time', 'time_remaining', 'remaining_time'], fault: ['fault', 'error'],
  target_temperature: ['target_temperature', 'operating_temperature', 'set_temperature'],
  current_temperature: ['current_temperature', 'temperature'],
  duration: ['target_time', 'operating_time', 'cooking_duration', 'set_time'],
  mode: ['mode', 'cooking_mode', 'program'],
  start: ['start_cook', 'start_program'], pause: ['pause'],
  resume: ['resume_cook', 'resume_cooking'], stop: ['cancel_cooking', 'stop_program'],
  preheat: ['preheat'], auto_keep_warm: ['auto_keep_warm'], current_keep_warm: ['current_keep_warm'],
  weight: ['cooking_weight'], reservation: ['reservation_left_time', 'appoint_time', 'appoint_time_left'],
  measure: ['target_cooking_measure', 'food_quanty'], texture: ['texture'],
  reminder: ['turn_pot'], reminder_config: ['turn_pot_config', 'turn_pot_cfg'], power: ['power', 'on', 'switch'],
};
const domains: Record<Role, string[]> = {
  status: ['sensor'], remaining: ['sensor'], fault: ['sensor', 'binary_sensor'],
  target_temperature: ['number', 'sensor'], current_temperature: ['sensor'],
  duration: ['number', 'sensor'], mode: ['select'], start: ['button'], pause: ['button'],
  resume: ['button'], stop: ['button'], preheat: ['switch'], auto_keep_warm: ['switch'],
  current_keep_warm: ['switch'], weight: ['number'], reservation: ['number', 'sensor'],
  measure: ['select'], texture: ['select'], reminder: ['sensor', 'select', 'binary_sensor'],
  reminder_config: ['switch'], power: ['switch'],
};
function semanticMatch(value: string, alias: string): boolean {
  const n = normalize(value);
  return n === alias || n === `air_fryer_${alias}` || n === `airfryer_${alias}`;
}
function score(entity: Entity, role: Role, domain: string): [number, string] {
  if (!domains[role].includes(domain)) return [0, 'incompatible domain'];
  if (role === 'power' && entity.platform === 'xiaomi_miot' && semanticMatch(entity.translation_key || '', 'air_fryer')) return [100, 'Miot main power switch'];
  if (aliases[role].some(a => semanticMatch(entity.translation_key || '', a))) return [100, 'translation key'];
  // Miot unique IDs contain a device prefix followed by the semantic converter key.
  const uid = normalize(entity.unique_id || '');
  if (entity.platform === 'xiaomi_miot' && aliases[role].some(a => uid.endsWith(`_air_fryer_${a}`) || uid.endsWith(`_airfryer_${a}`))) {
    return [95, 'Miot unique ID'];
  }
  // ID/name matches are visible in diagnostics, but never automatically command bindings.
  const id = normalize(entity.entity_id.split('.').slice(1).join('.'));
  if (aliases[role].some(a => id === a || id.endsWith(`_${a}`))) return [40, 'entity ID suffix (needs override)'];
  return [0, 'no semantic match'];
}
function base(entity: Entity, ha: HA, device: Device): Binding {
  const domain = domainOf(entity.entity_id), state = ha.states[entity.entity_id];
  // This model exposes a select for a read-only MIoT property. The deny rule applies
  // even when a user assigns a different role through an override.
  const turnPot = entity.platform === 'xiaomi_miot' && device.model === 'careli.fryer.maf10a' &&
    (semanticMatch(entity.translation_key || '', 'turn_pot') || /(?:^|_)air_fryer_turn_pot$/.test(normalize(entity.unique_id || '')) ||
      /(?:^|_)turn_pot$/.test(normalize(entity.entity_id.split('.')[1] || '')));
  return { entity, state, domain, available: domain === 'button' ? !!state && state.state !== 'unavailable' : available(state?.state),
    writable: ['number', 'select', 'switch', 'button'].includes(domain) && !turnPot,
    score: 0, evidence: turnPot ? 'MAF10A spec: read-only reminder' : 'selected-device entity' };
}
export function isFryer(device: Device, entities: Entity[]): boolean {
  if (/(?:^|\.)fryer\.|air.?fryer/i.test(device.model || '')) return true;
  const keys = entities.filter(e => e.device_id === device.id).map(e => normalize(e.translation_key || ''));
  return keys.some(k => k.startsWith('air_fryer') || k.startsWith('airfryer'));
}
export function fryerDevices(inventory: Inventory): Device[] {
  return inventory.devices.filter(d => isFryer(d, inventory.entities));
}
export function discover(ha: HA, inventory: Inventory, config: Config): Discovery {
  const candidates = fryerDevices(inventory);
  const device = config.device_id ? inventory.devices.find(d => d.id === config.device_id) : candidates.length === 1 ? candidates[0] : undefined;
  const out: Discovery = { device, adapter: 'generic', bindings: {}, ambiguous: {}, extras: [], diagnostics: [], excluded: [], online: false };
  if (!device) return out;
  const owned = inventory.entities.filter(e => e.device_id === device.id);
  out.adapter = owned.some(e => e.platform === 'xiaomi_miot') ? 'xiaomi_miot' : 'generic';
  const entries = owned.filter(e => {
    const excluded = !!e.disabled_by || ((!config.include_hidden) && !!(e.hidden || e.hidden_by));
    if (excluded) out.excluded.push(e);
    return !excluded;
  }).map(e => base(e, ha, device));
  for (const role of Object.keys(aliases) as Role[]) {
    const override = config.overrides?.[role];
    const matches = entries.filter(b => b.entity.entity_category !== 'diagnostic').map(b => {
      const [value, evidence] = score(b.entity, role, b.domain);
      const explicit = override === b.entity.entity_id && domains[role].includes(b.domain);
      const preferWritable = ['target_temperature', 'duration', 'reservation'].includes(role) && b.domain === 'number' && value >= 90;
      return { ...b, role, score: explicit ? 110 : value + (preferWritable ? 1 : 0), evidence: explicit ? 'explicit editor override' : evidence };
    }).filter(b => override ? b.entity.entity_id === override && b.score === 110 : b.score >= 90);
    if (!matches.length) continue;
    const best = Math.max(...matches.map(b => b.score));
    const winners = matches.filter(b => b.score === best);
    if (winners.length === 1) out.bindings[role] = winners[0];
    else out.ambiguous[role] = winners.map(b => b.entity.entity_id);
  }
  // A single entity must not receive conflicting cycle command meanings.
  const actions: Role[] = ['start', 'pause', 'resume', 'stop'];
  for (const role of actions) {
    const bound = out.bindings[role];
    if (!bound) continue;
    const conflicts = actions.filter(r => out.bindings[r]?.entity.entity_id === bound.entity.entity_id);
    if (conflicts.length > 1) for (const r of conflicts) {
      out.ambiguous[r] = [bound.entity.entity_id]; delete out.bindings[r];
    }
  }
  const used = new Set(Object.values(out.bindings).map(b => b.entity.entity_id));
  const ambiguous = new Set(Object.values(out.ambiguous).flat());
  for (const b of entries) {
    if (b.entity.entity_category === 'diagnostic' || b.domain === 'button') {
      if (!used.has(b.entity.entity_id)) out.diagnostics.push(b);
    } else if (!used.has(b.entity.entity_id) && !ambiguous.has(b.entity.entity_id)) out.extras.push(b);
  }
  // Always-available actions/Info do not establish device connectivity.
  const live = [out.bindings.status, out.bindings.remaining, out.bindings.target_temperature, out.bindings.duration]
    .filter((b): b is Binding => !!b);
  out.online = live.length ? live.some(b => b.available) : entries.some(b => b.domain !== 'button' && b.entity.entity_category !== 'diagnostic' && b.available);
  return out;
}
