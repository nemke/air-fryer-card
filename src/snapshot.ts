import type { Discovery } from './types';
import { VERSION } from './version';
// Explicit allowlist: never serialize hass, device identifiers, arbitrary attributes,
// unique IDs, options, names or errors into a public diagnostic fixture.
export function snapshot(d: Discovery) {
  const all = [...Object.values(d.bindings), ...d.extras, ...d.diagnostics];
  const seen = new Set<string>();
  return {
    schema: 1, card_version: VERSION, source: 'selected-device card snapshot', adapter: d.adapter,
    model: d.device?.model === 'careli.fryer.maf10a' ? 'careli.fryer.maf10a' : 'other',
    entities: all.filter(b => { if (seen.has(b.entity.entity_id)) return false; seen.add(b.entity.entity_id); return true; }).map((b, index) => {
      const a = b.state?.attributes || {};
      const numeric: Record<string, number> = {};
      for (const k of ['min', 'max', 'step']) if (typeof a[k] === 'number' && Number.isFinite(a[k])) numeric[k] = a[k];
      const unit = typeof a.unit_of_measurement === 'string' && ['°C', '°F', 'min', 's', 'h', 'g', 'kg', '%'].includes(a.unit_of_measurement) ? a.unit_of_measurement : undefined;
      return { entity_id: `${b.domain}.sample_${index + 1}`, device_id: 'sample_fryer', role: b.role,
        available: b.available, writable: b.writable, category: b.entity.entity_category,
        unit, ...numeric, option_count: Array.isArray(a.options) ? a.options.length : undefined };
    }),
    ambiguous_roles: Object.keys(d.ambiguous), excluded_count: d.excluded.length,
  };
}
