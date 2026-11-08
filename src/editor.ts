import { LitElement, html, nothing } from 'lit';
import type { Config, HA, Inventory, Role } from './types';
import { roles } from './types';
import { fryerDevices } from './discovery';
import { watchRegistry } from './registry';
import { t } from './localize';
import { styles } from './styles';

export class AirFryerEditor extends LitElement {
  static styles = styles;
  static properties = { _ha: { state: true }, _config: { state: true }, _inventory: { state: true } };
  private _ha?: HA;
  private _config: Config = { type: 'custom:air-fryer-card' };
  private _inventory?: Inventory;
  private stop?: () => void;
  private connection?: object;
  set hass(ha: HA) { this._ha = ha; this.observe(); }
  setConfig(config: Config) { this._config = { ...config }; }
  connectedCallback() { super.connectedCallback(); this.observe(); }
  disconnectedCallback() { super.disconnectedCallback(); this.stop?.(); this.stop = undefined; this.connection = undefined; }
  private observe() {
    if (!this.isConnected || !this._ha) return;
    const key = this._ha.connection || this._ha;
    if (this.connection !== key) {
      this.stop?.(); this.connection = key;
      this.stop = watchRegistry(this._ha, inventory => this._inventory = inventory);
    }
  }
  private change(update: Partial<Config>) {
    const config = { ...this._config, ...update };
    if (!config.device_id) delete config.device_id;
    if (!config.title) delete config.title;
    if (!config.include_hidden) delete config.include_hidden;
    if (!config.overrides || !Object.keys(config.overrides).length) delete config.overrides;
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  }
  render() {
    const inventory = this._inventory || { entities: Object.values(this._ha?.entities || {}), devices: Object.values(this._ha?.devices || {}) };
    const devices = fryerDevices(inventory);
    const selected = this._config.device_id || (devices.length === 1 ? devices[0].id : '');
    // Keep a saved device selectable even if its metadata temporarily no longer identifies it.
    const saved = inventory.devices.find(d => d.id === this._config.device_id);
    if (saved && !devices.includes(saved)) devices.push(saved);
    const entities = inventory.entities.filter(e => e.device_id === selected && !e.disabled_by &&
      (this._config.include_hidden || !(e.hidden || e.hidden_by)) && e.entity_category !== 'diagnostic');
    return html`<div class="body"><div class="editor-field"><label for="device">${t(this._ha, 'device')}</label>
      <select id="device" aria-label=${t(this._ha, 'device')} @change=${(e: Event) => this.change({ device_id: (e.target as HTMLSelectElement).value, overrides: undefined })}>
        <option value="" ?selected=${!this._config.device_id}>${t(this._ha, 'automatic')}</option>
        ${devices.map(d => html`<option value=${d.id} ?selected=${d.id === this._config.device_id}>${d.name_by_user || d.name || d.model || d.id}</option>`)}</select></div>
      <div class="editor-field"><label for="title">${t(this._ha, 'title')}</label><input class="editor-input" id="title" .value=${this._config.title || ''}
        @change=${(e: Event) => this.change({ title: (e.target as HTMLInputElement).value })}></div>
      <label class="toggle"><span>${t(this._ha, 'hidden')}</span><input type="checkbox" .checked=${!!this._config.include_hidden}
        @change=${(e: Event) => this.change({ include_hidden: (e.target as HTMLInputElement).checked })}></label>
      ${selected ? html`<details><summary>${t(this._ha, 'overrides')}</summary>${roles.map(role => html`<div class="editor-field"><label for=${role}>${role}</label>
        <select id=${role} aria-label=${`${role} override`} @change=${(e: Event) => {
          const overrides = { ...this._config.overrides }; const value = (e.target as HTMLSelectElement).value;
          if (value) overrides[role as Role] = value; else delete overrides[role as Role];
          this.change({ overrides });
        }}><option value="" ?selected=${!this._config.overrides?.[role]}>${t(this._ha, 'no_override')}</option>
          ${entities.map(e => html`<option value=${e.entity_id} ?selected=${this._config.overrides?.[role] === e.entity_id}>
            ${String(this._ha?.states[e.entity_id]?.attributes.friendly_name || e.name || e.entity_id)} (${e.entity_id.split('.')[0]})</option>`)}</select></div>`)}</details>` : nothing}
    </div>`;
  }
}
