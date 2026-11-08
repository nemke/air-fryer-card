import { AirFryerCard } from './card';
import { AirFryerEditor } from './editor';

if (!customElements.get('air-fryer-card')) customElements.define('air-fryer-card', AirFryerCard);
if (!customElements.get('air-fryer-card-editor')) customElements.define('air-fryer-card-editor', AirFryerEditor);
const registry = window as unknown as { customCards?: { type: string; name: string; description: string; preview: boolean }[] };
registry.customCards = registry.customCards || [];
if (!registry.customCards.some(c => c.type === 'air-fryer-card')) registry.customCards.push({
  type: 'air-fryer-card', name: 'Air Fryer',
  description: 'Automatically discovers your air fryer controls. Xiaomi Miot first; capability-driven design.', preview: true,
});
