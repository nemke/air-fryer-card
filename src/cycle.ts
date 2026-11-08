import type { Cycle, Discovery } from './types';

const states: Record<number, [Cycle['phase'], boolean, boolean, boolean]> = {
  0: ['off', false, false, false], 1: ['idle', false, false, false],
  2: ['cooking', true, false, false], 3: ['delay', false, false, false],
  4: ['cooking', false, false, false], 5: ['preheat', false, false, false],
  6: ['cooking', false, true, false], 7: ['preheat', false, true, false],
  8: ['preheat', true, false, false], 9: ['cooking', true, false, true],
  10: ['warm', false, false, false], 11: ['warm', true, false, false],
  12: ['warm', false, true, false], 13: ['cooking', false, false, false], 14: ['cooking', false, false, false],
};
const descriptions = ['off', 'idle', 'paused', 'delay', 'cooking', 'preheat', 'cooking completed',
  'preheat completed', 'preheat paused', 'turn pot paused', 'keep warm', 'keep warm paused',
  'keep warm completed', 'crispy roast', 'degrease'];
function stateCode(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isInteger(value) && states[value] ? value : undefined;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (/^\d+(?:\.0+)?$/.test(normalized)) return stateCode(Number(normalized));
  if (normalized === 'pause' || normalized === 'cooking paused') return 2;
  const code = descriptions.indexOf(normalized);
  return code < 0 ? undefined : code;
}
export function cycle(discovery: Discovery): Cycle {
  const b = discovery.bindings.status;
  if (!discovery.online || (b && !b.available)) return { phase: 'unavailable', paused: false, completed: false, reminder: false };
  const raw = b?.state?.state;
  let code: number | undefined;
  if (discovery.adapter === 'xiaomi_miot' && discovery.device?.model === 'careli.fryer.maf10a') {
    // The primary state can update before its copied raw attribute. Prefer a
    // recognized current state; use the numeric attribute for localized states.
    code = stateCode(raw) ?? stateCode(b?.state?.attributes['air_fryer.status']);
  }
  if (code !== undefined && states[code]) {
    const [phase, paused, completed, reminder] = states[code];
    return { phase, paused, completed, reminder, raw, label: descriptions[code] };
  }
  return { phase: 'unknown', paused: false, completed: false, reminder: false, raw };
}
export function seconds(value: string | undefined, unit: unknown): number | undefined {
  if (value === undefined || !value.trim() || !Number.isFinite(Number(value))) return undefined;
  const factor = ({ s: 1, sec: 1, seconds: 1, min: 60, minutes: 60, h: 3600, hours: 3600 } as Record<string, number>)[String(unit)];
  return factor && Number(value) >= 0 ? Number(value) * factor : undefined;
}
export function remaining(discovery: Discovery): number | undefined {
  const b = discovery.bindings.remaining;
  if (!b?.available) return undefined;
  return seconds(b.state?.state, b.state?.attributes.unit_of_measurement);
}
export function durationLabel(value: number | undefined): string {
  if (value === undefined) return '—';
  if (value < 60) return `${Math.round(value)} s`;
  const minutes = Math.ceil(value / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}
