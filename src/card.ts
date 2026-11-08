import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import type { Binding, Config, Discovery, HA, Inventory, ProgramDraft, Role } from './types';
import { discover, fryerDevices } from './discovery';
import { cycle, durationLabel, remaining, seconds } from './cycle';
import { actionAllowed, bounds, Commander } from './commands';
import { watchRegistry } from './registry';
import { t } from './localize';
import { snapshot } from './snapshot';
import { styles } from './styles';
import { VERSION } from './version';
import { statusRefresh } from './refresh';

export class AirFryerCard extends LitElement {
  static styles = styles;
  static properties = { _ha: { state: true }, _config: { state: true }, _inventory: { state: true },
    _error: { state: true }, _pending: { state: true }, _pendingAction: { state: true }, _stop: { state: true }, _warning: { state: true }, _program: { state: true } };
  private _ha?: HA;
  private _config: Config = { type: 'custom:air-fryer-card' };
  private _inventory?: Inventory;
  private _error = '';
  private _warning = '';
  private _pending = false;
  private _pendingAction?: Role;
  private _stop = false;
  private _watch?: () => void;
  private _connection?: object;
  private _automaticDevice?: string;
  private _program?: ProgramDraft;
  private commander = new Commander();
  private drafts = new Map<string, string>();
  set hass(ha: HA) {
    this._ha = ha;
    this.observe();
  }
  get hass(): HA | undefined { return this._ha; }
  setConfig(config: Config) {
    if (config.device_id !== undefined && typeof config.device_id !== 'string') throw new Error('device_id must be a string.');
    if (config.overrides && typeof config.overrides !== 'object') throw new Error('overrides must be an object.');
    if (this._pending) this.commander.cancel();
    if (this._config.device_id !== config.device_id) this._automaticDevice = undefined;
    this._config = { ...config, type: 'custom:air-fryer-card' };
    this.drafts.clear(); this._program = undefined; this._stop = false; this._error = '';
  }
  static getConfigElement() { return document.createElement('air-fryer-card-editor'); }
  static getStubConfig() { return { type: 'custom:air-fryer-card' }; }
  getCardSize() { return 7; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 'auto' }; }
  connectedCallback() { super.connectedCallback(); this.setAttribute('data-card-version', VERSION); this.observe(); }
  disconnectedCallback() { super.disconnectedCallback(); this._watch?.(); this._watch = undefined; this._connection = undefined; this.commander.cancel(); }
  private observe() {
    if (!this.isConnected || !this._ha) return;
    const key = this._ha.connection || this._ha;
    if (key !== this._connection) {
      this._watch?.(); this._connection = key;
      this._watch = watchRegistry(this._ha, (inventory, warning) => {
        this._inventory = inventory; this._warning = warning || '';
      });
    }
  }
  private effectiveConfig(): Config { return this._config.device_id || !this._automaticDevice ? this._config : { ...this._config, device_id: this._automaticDevice }; }
  private environment = () => ({ ha: this._ha!, inventory: this.inventory(), config: this.effectiveConfig() });
  private inventory(): Inventory {
    const entities = new Map(this._inventory?.entities.map(e => [e.entity_id, e]) || []);
    for (const e of Object.values(this._ha?.entities || {})) entities.set(e.entity_id, { ...entities.get(e.entity_id), ...e });
    const devices = new Map(this._inventory?.devices.map(d => [d.id, d]) || []);
    for (const d of Object.values(this._ha?.devices || {})) devices.set(d.id, d);
    return { entities: [...entities.values()], devices: [...devices.values()] };
  }
  private async change(b: Binding, value: unknown) {
    if (this._pending) return;
    this._pending = true; this._error = '';
    try { await this.commander.run(this.environment, b.entity.entity_id, value); this.drafts.delete(b.entity.entity_id); }
    catch (error) { this._error = error instanceof Error ? error.message : 'Command failed.'; }
    finally { this._pending = false; this.requestUpdate(); }
  }
  private async action(role: Role) {
    if (this._pending || (role === 'start' && this.drafts.size)) return;
    const configAtClick = this._config;
    this._pending = true; this._pendingAction = role; this._error = ''; this._stop = false;
    this.requestUpdate();
    try {
      // Commit feedback before invoking HA, even when no new hass value arrives.
      await this.updateComplete;
      if (!this.isConnected || this._config !== configAtClick) return;
      if (role === 'start') { await this.commander.start(this.environment, this._program); this._program = undefined; }
      else await this.commander.action(this.environment, role);
    }
    catch (error) { this._error = error instanceof Error ? error.message : 'Command failed.'; }
    finally { this._pending = false; this._pendingAction = undefined; this.requestUpdate(); }
  }
  private progressLabel(): string {
    const key = this._pendingAction === 'start' ? 'starting' : this._pendingAction === 'pause' ? 'pausing' :
      this._pendingAction === 'resume' ? 'resuming' : this._pendingAction === 'stop' ? 'stopping' : 'waiting';
    return t(this._ha, key);
  }
  private display(b?: Binding): string {
    if (!b?.available || !b.state) return '—';
    try { return this._ha?.formatEntityState?.(b.state) || b.state.state.trim(); } catch { return b.state.state; }
  }
  private label(b: Binding): string {
    const role = b.role;
    if (role === 'target_temperature') return t(this._ha, 'temperature');
    if (role && !['status', 'remaining'].includes(role)) return t(this._ha, role as Parameters<typeof t>[1]);
    return String(b.state?.attributes.friendly_name || b.entity.name || b.entity.entity_id.split('.')[1]);
  }
  private control(b: Binding, d: Discovery) {
    const id = b.entity.entity_id, label = this.label(b);
    const disabled = this._pending || !d.online || !b.available || !b.writable;
    if (!b.writable || !['number', 'select', 'switch'].includes(b.domain)) return html`
      <div class="reading"><span>${label}</span><span>${this.display(b)}</span></div>`;
    if (b.domain === 'switch') return html`<label class="toggle"><span>${label}</span>
      <input aria-label=${label} type="checkbox" .checked=${b.state?.state === 'on'} ?disabled=${disabled}
        @change=${(e: Event) => { const input = e.target as HTMLInputElement; void this.change(b, input.checked); input.checked = b.state?.state === 'on'; }}></label>`;
    if (b.domain === 'select') {
      const options = Array.isArray(b.state?.attributes.options) ? b.state!.attributes.options.filter((v): v is string => typeof v === 'string') : [];
      const isProgram = b.role === 'mode';
      const current = isProgram && this._program?.entity_id === id ? this._program.option : b.state?.state || '';
      return html`<div class="program"><label for=${id}>${label}</label><select id=${id} aria-label=${label}
        ?disabled=${disabled || !options.length || (isProgram && !actionAllowed('start', d))} @change=${(e: Event) => {
          const input = e.target as HTMLSelectElement;
          if (isProgram) {
            this._program = input.value === b.state?.state ? undefined : { entity_id: id, device_id: d.device!.id, option: input.value };
            this._error = '';
          } else { void this.change(b, input.value); input.value = current; }
        }}>
        ${!options.includes(current) ? html`<option value="" selected>${b.available ? current : '—'}</option>` : nothing}
        ${options.map(option => html`<option value=${option} ?selected=${current === option}>${option.trim()}</option>`)}</select>
        ${isProgram && this._program ? html`<p class="notice muted">${t(this._ha, 'program_staged')}</p>
          <button ?disabled=${this._pending} @click=${() => this._program = undefined}>${t(this._ha, 'discard_program')}</button>` : nothing}</div>`;
    }
    const range = bounds(b), draft = this.drafts.get(id);
    const val = draft ?? (b.available ? b.state?.state || '' : '');
    return html`<div class="control"><label for=${id}>${label}</label><div class="number-line">
      <input id=${id} aria-label=${label} type="number" inputmode="decimal" min=${range?.min ?? ''} max=${range?.max ?? ''} step=${range?.step ?? 'any'}
        .value=${val} placeholder="—" ?disabled=${disabled || !range} @input=${(e: Event) => {
          const value = (e.target as HTMLInputElement).value;
          if (value === b.state?.state) this.drafts.delete(id); else this.drafts.set(id, value);
          this.requestUpdate();
        }}><span class="unit">${b.state?.attributes.unit_of_measurement || ''}</span></div>
      <small class="range">${range ? `${range.min}–${range.max} · ${range.step}` : t(this._ha, 'missing_schema')}</small>
      ${draft !== undefined ? html`<button class="apply" ?disabled=${disabled || !draft.trim() || !range}
        @click=${() => void this.change(b, Number(draft))}>${t(this._ha, 'apply')}</button>` : nothing}</div>`;
  }
  private export(d: Discovery) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(d), null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'air-fryer-snapshot.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  render() {
    if (!this._ha) return html`<ha-card><div class="body">${t(this._ha, 'loading')}</div></ha-card>`;
    const inv = this.inventory(), d = discover(this._ha, inv, this.effectiveConfig()), s = cycle(d);
    if (d.device && !this._config.device_id && !this._automaticDevice) this._automaticDevice = d.device.id;
    if (!d.device) return html`<ha-card><div class="body"><h2>Air Fryer</h2><p class="hint">${!this._inventory ? t(this._ha, 'loading') : fryerDevices(inv).length ? t(this._ha, 'choose') : t(this._ha, 'none')}</p>
      ${this._warning ? html`<p class="error">${this._warning}</p>` : nothing}</div></ha-card>`;
    const b = d.bindings;
    if (this._program && (this._program.device_id !== d.device.id || this._program.entity_id !== b.mode?.entity.entity_id)) this._program = undefined;
    const configuring = s.phase === 'idle';
    const heroTime = configuring && b.duration?.available ? seconds(b.duration.state?.state, b.duration.state?.attributes.unit_of_measurement) : remaining(d);
    const status = s.phase === 'unknown' ? this.display(b.status) : s.phase === 'preheat' ? t(this._ha, 'preheat_phase') : t(this._ha, s.phase);
    const phasesuffix = s.paused ? t(this._ha, 'paused') : s.completed ? t(this._ha, 'completed') : '';
    const secondary: Role[] = ['current_keep_warm', 'weight', 'reservation', 'measure', 'texture', 'reminder', 'reminder_config'];
    const more = [...secondary.flatMap(role => b[role] ? [b[role]!] : []), ...d.extras];
    const noFault = d.adapter === 'xiaomi_miot' && d.device.model === 'careli.fryer.maf10a' ? ['0', 'no faults', 'no_faults'] : [];
    const fault = b.fault?.available && !noFault.includes(b.fault.state?.state.trim().toLowerCase() || '');
    const powerReady = !!b.power?.available && b.power.writable && ['on', 'off'].includes(b.power.state?.state || '');
    const refresh = statusRefresh(this._ha, d);
    return html`<ha-card class=${d.online ? '' : 'inactive'} aria-busy=${this._pending ? 'true' : 'false'}><div class="body">
      <header><div><h2>${this._config.title || d.device.name_by_user || d.device.name || 'Air Fryer'}</h2>
        <div class="subtitle muted">${d.device.manufacturer || 'Air fryer'}</div></div>
        <span class="badge"><span class="dot"></span>${status}${phasesuffix ? ` · ${phasesuffix}` : ''}</span></header>
      <div class="hero"><div><div class="hero-label muted">${t(this._ha, configuring ? 'duration' : 'remaining')}</div><div class="time">${durationLabel(heroTime)}</div>
        <div class="status">${this._program ? this._program.option.trim() : b.mode ? this.display(b.mode) : status}</div>
        ${b.current_temperature ? html`<small>${t(this._ha, 'current_temperature')}: ${this.display(b.current_temperature)}</small>` : nothing}</div>
        <svg class="illustration" viewBox="0 0 118 134" aria-hidden="true"><rect x="15" y="10" width="88" height="116" rx="27" fill="currentColor" opacity=".12"/>
          <path d="M29 70h60v30a13 13 0 0 1-13 13H42a13 13 0 0 1-13-13Z" fill="currentColor" opacity=".18"/>
          <rect x="46" y="83" width="26" height="14" rx="5" fill="currentColor" opacity=".65"/>
          <circle cx="59" cy="40" r="14" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M59 32v8l5 4M40 63h38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M43 3c-5-5 4-7 0-11M59 3c-5-5 4-7 0-11M75 3c-5-5 4-7 0-11" transform="translate(0 12)" fill="none" stroke="currentColor" stroke-width="2" opacity=".4"/>
        </svg></div>
      ${!d.online ? html`<p class="hint muted">${t(this._ha, 'offline_hint')}</p>` : nothing}
      ${s.reminder ? html`<p class="hint">${t(this._ha, 'shake')}</p>` : nothing}
      ${fault ? html`<p class="error">${t(this._ha, 'fault')}: ${this.display(b.fault)}</p>` : nothing}
      <section class="power-section" aria-label=${t(this._ha, 'power')}><div class="power-row"><span>⏻ ${t(this._ha, 'power')}</span>
        <div class="power-buttons" role="group" aria-label=${t(this._ha, 'power')}>
          ${([true, false] as const).map(on => html`<button aria-label=${t(this._ha, on ? 'turn_on' : 'turn_off')}
            aria-pressed=${powerReady && b.power?.state?.state === (on ? 'on' : 'off') ? 'true' : 'false'}
            ?disabled=${this._pending || !powerReady || b.power?.state?.state === (on ? 'on' : 'off')}
            @click=${() => { if (b.power) void this.change(b.power, on); }}>${t(this._ha, on ? 'power_on' : 'power_off')}</button>`)}
        </div></div>${!b.power || !powerReady ? html`<p class="notice muted">${t(this._ha, b.power ? 'power_unavailable' : 'power_missing')}</p>` : nothing}</section>
      <div class="numbers">${(['target_temperature', 'duration'] as Role[]).map(role => b[role] ? this.control(b[role]!, d) : nothing)}</div>
      ${b.mode ? this.control(b.mode, d) : nothing}
      ${(['preheat', 'auto_keep_warm'] as Role[]).map(role => b[role] ? this.control(b[role]!, d) : nothing)}
      <div class="actions" data-action-state=${this._pendingAction || 'ready'}>${this._pendingAction ? html`
        <button class="primary" disabled aria-busy="true"><span class="spinner" aria-hidden="true"></span>${this.progressLabel()}</button>` :
        (['start', 'pause', 'resume', 'stop'] as Role[]).filter(role =>
        (b[role] && (actionAllowed(role, d) || !d.online)) || (role === 'resume' && s.paused)).map(role => html`
        <button class=${role === 'start' || role === 'resume' ? 'primary' : ''}
          ?disabled=${this._pending || (role === 'start' && this.drafts.size > 0) || !actionAllowed(role, d)}
          @click=${() => { if (role === 'stop') this._stop = true; else void this.action(role); }}>
          ${role === 'start' && this._program ? t(this._ha, 'start_selected') : t(this._ha, role as 'start' | 'pause' | 'resume' | 'stop')}</button>`)}</div>
      ${s.paused && !b.resume ? html`<p class="notice muted">${t(this._ha, 'resume_missing')}</p>` : nothing}
      ${this._stop ? html`<div class="confirm" role="alertdialog" aria-label=${t(this._ha, 'confirm_stop')}><div>${t(this._ha, 'confirm_stop')}</div><div class="actions">
        <button @click=${() => this._stop = false}>${t(this._ha, 'cancel')}</button><button ?disabled=${this._pending} @click=${() => void this.action('stop')}>${t(this._ha, 'confirm')}</button></div></div>` : nothing}
      <div role="status" aria-live="polite">${this._pending ? html`<p class="pending-notice">${this._pendingAction ? t(this._ha, 'action_wait') : t(this._ha, 'waiting')}</p>` : nothing}</div>
      ${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}
      ${this.drafts.size ? html`<p class="notice muted">${t(this._ha, 'apply')} ${t(this._ha, 'temperature').toLowerCase()} / ${t(this._ha, 'duration').toLowerCase()}</p>` : nothing}
      ${Object.keys(d.ambiguous).length || this._warning ? html`<p class="notice muted">${t(this._ha, 'discovery_warning')}</p>` : nothing}
      ${more.length ? html`<details><summary>${t(this._ha, 'more')}</summary>${repeat(more, b => b.entity.entity_id, b => this.control(b, d))}</details>` : nothing}
      <details><summary>${t(this._ha, 'diagnostics')} · v${VERSION}</summary><dl class="discovery">
        <dt>${t(this._ha, 'version')}</dt><dd>${VERSION}</dd>
        <dt>Adapter</dt><dd>${d.adapter}</dd>
        <dt>Post-command status refresh</dt><dd>${refresh ? `${refresh.domain}.${refresh.service}` : 'Reported state updates'}</dd>
        <dt>Status state / raw attribute</dt><dd>${b.status?.state?.state || '—'} / ${String(b.status?.state?.attributes['air_fryer.status'] ?? '—')}</dd>
        ${Object.entries(d.bindings).map(([role, binding]) => html`<dt>${role}</dt><dd>${binding.entity.entity_id} · ${binding.evidence}${!binding.writable ? ` · ${t(this._ha, 'readonly')}` : ''}</dd>`)}
        ${Object.entries(d.ambiguous).map(([role, ids]) => html`<dt>${role}: ambiguous</dt><dd>${ids.join(', ')}</dd>`)}
        ${d.diagnostics.map(b => html`<dt>${this.label(b)}</dt><dd>${b.entity.entity_id} · ${t(this._ha, 'readonly')}</dd>`)}
        ${d.excluded.length ? html`<dt>Hidden / disabled</dt><dd>${d.excluded.length}</dd>` : nothing}</dl>
        <p class="notice muted">${t(this._ha, 'diagnostics_note')}</p><button @click=${() => this.export(d)}>${t(this._ha, 'export')}</button></details>
    </div></ha-card>`;
  }
}
