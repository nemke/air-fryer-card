import type { Entity, HA, Inventory } from './types';

interface DisplayResponse {
  entities: { ei: string; di?: string; en?: string; pl?: string; tk?: string; hb?: boolean; ec?: number }[];
  entity_categories: Record<string, string>;
}
export function decodeDisplay(response: DisplayResponse): Entity[] {
  return response.entities.map(e => ({ entity_id: e.ei, device_id: e.di, name: e.en,
    platform: e.pl, translation_key: e.tk, hidden: e.hb,
    entity_category: e.ec === undefined ? undefined : response.entity_categories[e.ec] }));
}
type Notify = (inventory: Inventory, warning?: string) => void;
class Registry {
  listeners = new Set<Notify>();
  data?: Inventory;
  pending?: Promise<void>;
  warning?: string;
  private unsubscribe: (() => void)[] = [];
  private generation = 0;
  private reload = false;
  constructor(private ha: HA) {}
  updateHA(ha: HA) { this.ha = ha; }
  async load(force = false) {
    if (this.pending) { if (force) this.reload = true; return this.pending; }
    if (this.data && !force) return;
    this.pending = this.fetch().finally(() => {
      this.pending = undefined;
      if (this.reload && this.listeners.size) { this.reload = false; void this.load(true); }
    });
    return this.pending;
  }
  private async fetch() {
    const ha = this.ha;
    let entities = Object.values(ha.entities || {}), devices = Object.values(ha.devices || {});
    const warnings: string[] = [];
    if (ha.callWS) {
      const results = await Promise.allSettled([
        ha.callWS<Entity[]>({ type: 'config/entity_registry/list' }),
        ha.callWS<Inventory['devices']>({ type: 'config/device_registry/list' }),
      ]);
      if (results[0].status === 'fulfilled') entities = results[0].value;
      else if (!entities.length) {
        try { entities = decodeDisplay(await ha.callWS<DisplayResponse>({ type: 'config/entity_registry/list_for_display' })); }
        catch { warnings.push('Entity registry unavailable.'); }
      }
      if (results[1].status === 'fulfilled') devices = results[1].value;
      else if (!devices.length) warnings.push('Device registry unavailable.');
    }
    this.warning = warnings.join(' ') || undefined;
    if (!this.listeners.size) return;
    this.data = { entities, devices };
    for (const listener of this.listeners) listener(this.data, this.warning);
  }
  add(listener: Notify) {
    this.listeners.add(listener);
    if (this.data) listener(this.data, this.warning);
    if (this.listeners.size === 1) void this.subscribe();
    void this.load();
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) {
        this.generation++;
        this.unsubscribe.splice(0).forEach(fn => fn());
        this.data = undefined;
      }
    };
  }
  private async subscribe() {
    const subscribe = this.ha.connection?.subscribeEvents;
    if (!subscribe) return;
    const generation = ++this.generation;
    for (const event of ['entity_registry_updated', 'device_registry_updated']) {
      try {
        const stop = await subscribe.call(this.ha.connection, () => { void this.load(true); }, event);
        if (generation !== this.generation || !this.listeners.size) stop();
        else this.unsubscribe.push(stop);
      } catch { /* Existing frontend metadata remains usable without subscriptions. */ }
    }
  }
}
const cache = new WeakMap<object, Registry>();
export function watchRegistry(ha: HA, notify: Notify): () => void {
  const key = ha.connection || ha;
  let registry = cache.get(key);
  if (!registry) { registry = new Registry(ha); cache.set(key, registry); }
  registry.updateHA(ha);
  return registry.add(notify);
}
