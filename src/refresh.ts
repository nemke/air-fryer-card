import type { Command } from './commands';
import type { Discovery, HA } from './types';

// Small, command-scoped read burst. No background polling or control retries.
export const STATUS_REFRESH_TIMES_MS = [250, 1250, 3000] as const;

export function statusRefresh(ha: HA, d: Discovery): Command | undefined {
  const status = d.bindings.status;
  if (!d.device || !status || status.entity.device_id !== d.device.id || status.domain !== 'sensor') return undefined;
  const registered = (domain: string, service: string) => Object.hasOwn(ha.services?.[domain] || {}, service);
  if (d.adapter === 'xiaomi_miot' && d.device.model === 'careli.fryer.maf10a' &&
    status.entity.platform === 'xiaomi_miot' && registered('xiaomi_miot', 'get_properties')) {
    // Exact MAF10A public spec: service 2, read-only status property 1.
    // update_entity dispatches the read result to HA; no property/action is written.
    return { domain: 'xiaomi_miot', service: 'get_properties', data: {
      entity_id: [status.entity.entity_id], mapping: [{ siid: 2, piid: 1 }], update_entity: true,
    } };
  }
  if (registered('homeassistant', 'update_entity')) return {
    domain: 'homeassistant', service: 'update_entity', data: { entity_id: [status.entity.entity_id] },
  };
  return undefined;
}
