import '../src/index';
import { fixture } from './fixture';
import type { AirFryerCard } from '../src/card';
import type { AirFryerEditor } from '../src/editor';
import type { Config } from '../src/types';

let sample = fixture();
const card = document.createElement('air-fryer-card') as AirFryerCard;
const editor = document.createElement('air-fryer-card-editor') as AirFryerEditor;
let config: Config = { type: 'custom:air-fryer-card' };
card.setConfig(config); editor.setConfig(config); card.hass = sample.ha; editor.hass = sample.ha;
document.querySelector('#mount')!.append(card); document.querySelector('#editor')!.append(editor);
editor.addEventListener('config-changed', (e: Event) => { config = (e as CustomEvent).detail.config; card.setConfig(config); });
function update() {
  card.hass = { ...sample.ha, connection: sample.ha.connection };
  editor.hass = sample.ha;
  document.querySelector('#calls')!.textContent = JSON.stringify(sample.calls, null, 2);
}
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-scene]')) button.addEventListener('click', () => {
  sample = fixture(button.dataset.scene === 'offline');
  const state = ({ idle: 'Idle', cooking: 'Cooking', paused: 'Paused', unknown: 'Unrecognized model state' } as Record<string, string>)[button.dataset.scene || ''];
  if (state) sample.ha.states[sample.ids.air_fryer].state = state;
  update();
});
document.querySelector('#locale')!.addEventListener('click', () => {
  sample.ha.locale = { language: sample.ha.locale?.language === 'en' ? 'sr-Latn' : 'en' }; update();
});
document.querySelector('#theme')!.addEventListener('click', () => document.documentElement.classList.toggle('light'));
const updateTimer = setInterval(update, 200);
// Read-only access for browser regression tests of the local fixture.
(window as unknown as { preview: unknown }).preview = { get sample() { return sample; }, card, editor, update, stopUpdates: () => clearInterval(updateTimer) };
