import { cycle } from './cycle';
import { discover } from './discovery';
import type { Binding, Config, Discovery, HA, Inventory, Role } from './types';

export interface Command { domain: string; service: string; data: Record<string, unknown>; }
export function bounds(binding: Binding): { min: number; max: number; step: number } | undefined {
  const a = binding.state?.attributes;
  if (!a || ![a.min, a.max, a.step].every(v => typeof v === 'number' && Number.isFinite(v))) return undefined;
  const min = a.min as number, max = a.max as number, step = a.step as number;
  return min <= max && step > 0 ? { min, max, step } : undefined;
}
export function settingCommand(binding: Binding, value: unknown, discovery: Discovery): Command {
  if (!discovery.online || !binding.available || !binding.writable) throw new Error('This control is currently unavailable or read-only.');
  const data: Record<string, unknown> = { entity_id: binding.entity.entity_id };
  if (binding.domain === 'number') {
    const range = bounds(binding);
    if (typeof value !== 'number' || !Number.isFinite(value) || !range || value < range.min || value > range.max ||
      Math.abs((value - range.min) / range.step - Math.round((value - range.min) / range.step)) > 1e-7) throw new Error('Choose a value within the displayed range and step.');
    return { domain: 'number', service: 'set_value', data: { ...data, value } };
  }
  if (binding.domain === 'select') {
    const options = binding.state?.attributes.options;
    if (typeof value !== 'string' || !Array.isArray(options) || !options.includes(value)) throw new Error('Choose a current option.');
    return { domain: 'select', service: 'select_option', data: { ...data, option: value } };
  }
  if (binding.domain === 'switch' && typeof value === 'boolean') return { domain: 'switch', service: value ? 'turn_on' : 'turn_off', data };
  throw new Error('Unsupported setting.');
}
export function actionAllowed(role: Role, d: Discovery): boolean {
  const b = d.bindings[role];
  if (!d.online || !b?.available || !b.writable || b.domain !== 'button') return false;
  const s = cycle(d);
  const fault = d.bindings.fault?.state;
  const knownFault = d.adapter === 'xiaomi_miot' && d.device?.model === 'careli.fryer.maf10a' &&
    (['1', '2', '3', 'E1', 'E2', 'E3'].includes(fault?.state || '') || [1, 2, 3].includes(Number(fault?.attributes['air_fryer.fault'])));
  if ((role === 'start' || role === 'resume') && knownFault) return false;
  if (s.phase === 'off' || s.phase === 'unavailable') return false;
  if (role === 'start') return s.phase === 'idle' || (s.completed && s.phase !== 'preheat');
  if (role === 'resume') return s.paused;
  if (role === 'pause') return ['cooking', 'preheat', 'warm'].includes(s.phase) && !s.paused && !s.completed;
  if (role === 'stop') return ['cooking', 'preheat', 'warm', 'delay'].includes(s.phase) && !s.completed;
  return false;
}
export function actionCommand(role: Role, d: Discovery): Command {
  if (!actionAllowed(role, d)) throw new Error('This action is not available in the current state.');
  return { domain: 'button', service: 'press', data: { entity_id: d.bindings[role]!.entity.entity_id } };
}
export interface Environment { ha: HA; inventory: Inventory; config: Config; }
// Re-read current metadata at dispatch time; never execute a plan from a stale render.
export class Commander {
  pending = false;
  private abort?: AbortController;
  cancel() { this.abort?.abort(); }
  async run(getEnvironment: () => Environment, entityId: string, value: unknown): Promise<void> {
    await this.lock(async () => {
      const e = getEnvironment(), d = discover(e.ha, e.inventory, e.config);
      const all = [...Object.values(d.bindings), ...d.extras];
      const b = all.find(b => b.entity.entity_id === entityId);
      if (!b) throw new Error('The selected control has changed. Refresh the card.');
      const c = settingCommand(b, value, d); await e.ha.callService(c.domain, c.service, c.data);
      const expected = typeof value === 'boolean' ? (value ? 'on' : 'off') : String(value);
      const deadline = Date.now() + 35000;
      const confirmed = () => {
        const observed = getEnvironment().ha.states[entityId]?.state;
        return typeof value === 'number' ? observed !== undefined && observed.trim() !== '' && Number.isFinite(Number(observed)) && Math.abs(Number(observed) - value) < 1e-7 : observed === expected;
      };
      while (!confirmed()) {
        if (this.abort?.signal.aborted) throw new Error('Command observation cancelled.');
        if (Date.now() > deadline) throw new Error('The device has not confirmed this setting. Check its state before starting.');
        await new Promise<void>(resolve => {
          const signal = this.abort?.signal;
          const done = () => { clearTimeout(timer); signal?.removeEventListener('abort', done); resolve(); };
          const timer = setTimeout(done, 100);
          signal?.addEventListener('abort', done, { once: true });
        });
      }
    });
  }
  async action(getEnvironment: () => Environment, role: Role): Promise<void> {
    await this.lock(async () => {
      const e = getEnvironment(), c = actionCommand(role, discover(e.ha, e.inventory, e.config));
      await e.ha.callService(c.domain, c.service, c.data);
    });
  }
  private async lock(task: () => Promise<void>): Promise<void> {
    if (this.pending) throw new Error('A command is already pending.');
    this.pending = true;
    this.abort = new AbortController();
    try { await task(); } finally { this.pending = false; }
  }
}
