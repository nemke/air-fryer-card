import { css } from 'lit';
export const styles = css`
  :host { display: block; color: var(--primary-text-color, #f3f1eb); font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif); }
  * { box-sizing: border-box; }
  ha-card { display: block; overflow: hidden; border: 1px solid var(--ha-card-border-color, #ffffff14); border-radius: var(--ha-card-border-radius, 24px); background: var(--ha-card-background, var(--card-background-color, #202321)); box-shadow: var(--ha-card-box-shadow, none); }
  .body { padding: 24px; }
  header { display: flex; align-items: flex-start; gap: 12px; justify-content: space-between; }
  h2 { margin: 0; font-size: 20px; font-weight: 650; letter-spacing: -.5px; }
  .muted, small { color: var(--secondary-text-color, #a8afa8); }
  .subtitle { margin-top: 6px; font-size: 13px; }
  .badge { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 20px; background: var(--secondary-background-color, #ffffff09); font-size: 12px; white-space: nowrap; }
  .dot { width: 6px; height: 6px; background: #a6bd92; border-radius: 50%; }
  .inactive .dot { background: var(--disabled-text-color, #8b918b); }
  .hero { display: flex; align-items: center; justify-content: space-between; gap: 18px; min-height: 155px; margin: 14px 0 8px; }
  .hero-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.6px; }
  .time { font-size: clamp(28px, 7vw, 40px); font-weight: 600; letter-spacing: -1.4px; line-height: 1.3; margin: 5px 0; }
  .status { font-size: 14px; color: var(--primary-text-color); }
  .illustration { width: 118px; height: 134px; flex-shrink: 0; color: var(--primary-color, #c4d6ad); }
  .inactive .illustration { opacity: .45; }
  .hint { font-size: 13px; line-height: 1.5; margin: 10px 0 18px; }
  .numbers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .control { padding: 13px; border: 1px solid var(--divider-color, #ffffff12); border-radius: 14px; min-width: 0; }
  .control label { display: block; font-size: 12px; color: var(--secondary-text-color, #acb2ab); margin-bottom: 8px; }
  .number-line { display: flex; gap: 6px; align-items: center; }
  .number-line input { width: 100%; min-width: 0; font-size: 23px; font-weight: 550; padding: 0; background: transparent; border: 0; }
  .number-line .unit { font-size: 13px; white-space: nowrap; }
  .range { display: block; margin-top: 5px; font-size: 10px; }
  .apply { margin-top: 9px; width: 100%; }
  input, select, button { font-family: inherit; color: inherit; font-size: 14px; }
  input, select { accent-color: var(--primary-color, #bacfa4); }
  select, .editor-input { width: 100%; background: var(--secondary-background-color, #ffffff08); padding: 12px; border: 1px solid var(--divider-color, #ffffff1c); border-radius: 10px; }
  option { background: var(--card-background-color, #252925); color: var(--primary-text-color, #f3f1eb); }
  button { border: 1px solid var(--divider-color, #ffffff20); background: transparent; border-radius: 11px; padding: 10px 14px; cursor: pointer; }
  button.primary { background: var(--primary-color, #c4d6ad); border-color: transparent; color: var(--text-primary-color, #142010); font-weight: 650; }
  button:disabled, input:disabled, select:disabled { cursor: default; opacity: .5; }
  button:hover:enabled { filter: brightness(1.1); }
  :focus-visible { outline: 2px solid var(--primary-color, #c4d6ad); outline-offset: 3px; }
  .program { margin: 12px 0; }
  .program label { display: block; font-size: 12px; margin-bottom: 7px; color: var(--secondary-text-color, #acb2ab); }
  .toggle { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 46px; font-size: 14px; }
  input[type=checkbox] { appearance: none; width: 36px; height: 21px; background: var(--disabled-color, #626961); border-radius: 20px; position: relative; flex-shrink: 0; }
  input[type=checkbox]::after { content: ''; position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border-radius: 50%; background: #eef2e8; transition: transform .15s; }
  input[type=checkbox]:checked { background: var(--primary-color, #b5cda0); }
  input[type=checkbox]:checked::after { transform: translateX(15px); background: #26341e; }
  .actions { display: flex; gap: 8px; margin-top: 16px; }
  .actions button { flex: 1; }
  .error { padding: 11px 13px; border-radius: 10px; background: color-mix(in srgb, var(--error-color, #d77364) 13%, transparent); color: var(--error-color, #ffb3a5); font-size: 13px; line-height: 1.5; }
  .notice { font-size: 12px; line-height: 1.5; margin-top: 12px; }
  details { border-top: 1px solid var(--divider-color, #ffffff12); margin-top: 18px; padding-top: 15px; }
  summary { cursor: pointer; font-size: 13px; color: var(--secondary-text-color, #b4bcb2); }
  details .control, details .program { margin-top: 12px; }
  .reading { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 10px 0; }
  .discovery { font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
  .discovery dt { font-weight: 650; margin-top: 8px; }
  .discovery dd { margin-left: 0; color: var(--secondary-text-color, #acb2ab); }
  .confirm { background: var(--secondary-background-color, #30362d); padding: 14px; margin-top: 12px; border-radius: 12px; }
  .editor-field { margin-bottom: 16px; }
  .editor-field > label { display: block; margin-bottom: 6px; font-size: 13px; }
  @media (max-width: 340px) { .body { padding: 16px; } .illustration { width: 88px; } .badge { font-size: 10px; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;
