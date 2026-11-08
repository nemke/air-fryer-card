export interface State {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_updated?: string;
}
export interface Entity {
  entity_id: string;
  device_id?: string | null;
  platform?: string;
  translation_key?: string;
  unique_id?: string;
  name?: string | null;
  entity_category?: string | null;
  hidden?: boolean;
  hidden_by?: string | null;
  disabled_by?: string | null;
}
export interface Device {
  id: string;
  name?: string;
  name_by_user?: string | null;
  manufacturer?: string;
  model?: string;
}
export interface HA {
  states: Record<string, State>;
  entities?: Record<string, Entity>;
  devices?: Record<string, Device>;
  language?: string;
  locale?: { language: string };
  connection?: {
    subscribeEvents?: (callback: () => void, type: string) => Promise<() => void>;
  };
  callWS?: <T>(message: Record<string, unknown>) => Promise<T>;
  callService: (domain: string, service: string, data: Record<string, unknown>) => Promise<unknown>;
  formatEntityState?: (state: State) => string;
}
export const roles = ['status', 'remaining', 'fault', 'target_temperature', 'current_temperature',
  'duration', 'mode', 'start', 'pause', 'resume', 'stop', 'preheat', 'auto_keep_warm',
  'current_keep_warm', 'weight', 'reservation', 'measure', 'texture', 'reminder',
  'reminder_config', 'power'] as const;
export type Role = typeof roles[number];
export interface Config {
  type: 'custom:air-fryer-card';
  device_id?: string;
  title?: string;
  include_hidden?: boolean;
  overrides?: Partial<Record<Role, string>>;
}
export interface Binding {
  entity: Entity;
  state?: State;
  domain: string;
  available: boolean;
  writable: boolean;
  role?: Role;
  score: number;
  evidence: string;
}
export interface Discovery {
  device?: Device;
  adapter: 'xiaomi_miot' | 'generic';
  bindings: Partial<Record<Role, Binding>>;
  ambiguous: Partial<Record<Role, string[]>>;
  extras: Binding[];
  diagnostics: Binding[];
  excluded: Entity[];
  online: boolean;
}
export interface Inventory { entities: Entity[]; devices: Device[]; }
export interface Cycle {
  phase: 'idle' | 'off' | 'cooking' | 'preheat' | 'warm' | 'delay' | 'unknown' | 'unavailable';
  paused: boolean;
  completed: boolean;
  reminder: boolean;
  label?: string;
  raw?: string;
}
