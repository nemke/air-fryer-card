# Investigation: automatic air fryer card

Research date: 2026-11-08. Code references below are pinned to inspected commits.
This is an architecture investigation, not a security audit of the referenced projects.

## Conclusion

A manufacturer-agnostic frontend is practical. Universal support without integration
knowledge is not: integrations expose different entities, units, state values and
command types. Build one capability-driven card with integration adapters. Start with
Xiaomi Miot, then validate Philips HomeID as a genuinely different control model.

Automatic setup means discovering capabilities and configuring the UI. It never means
starting cooking, changing settings, or enabling entities during discovery.

The initial product should be named **Air Fryer Card**, not restricted to Xiaomi.

## What existing cards teach us

| Project | Verified behavior | Adopt | Improve for our card |
| --- | --- | --- | --- |
| HA Appliance Card | Editor `autoSuggest()` starts from a state entity, searches siblings and fills fields through per-type/domain filters and regexes. Air fryer is a specific capability profile. | Typed controls, same-device grouping, dynamic sections, readable states. | Make runtime device discovery the main contract; prefer semantic registry keys to names; inline time/temperature editing. |
| Smart Appliance Card | Groups registry entries by device, then tries translation keys, entity ID patterns and attribute predicates. Routes commands through integration-specific logic. | Device picker, stable semantic roles, adapters, per-device caching. | Air fryer support, explicit ambiguous matches, cache invalidation when metadata arrives or changes. |
| Noack Airfryer Card | Provides temperature/time +/- controls, presets and button actions. Controls require explicit entity configuration. Recipe saving writes HA script configuration. | Direct manipulation of the primary cooking settings. | Automatic binding; no recipe/script-writing subsystem in the first version. |

Sources: [HA Appliance detection](https://github.com/ADNPolymerase/ha-appliance-card/blob/919367fdfd5d7ab31c7f4c35fa82ac3c12a38de7/src/06-detection.js#L548),
[Smart Appliance registry discovery](https://github.com/juju35/ha-smart-appliance-card/blob/f7f2b226d531f3ef1f115476c19cab4418852f45/src/smart-appliance-card.js#L2530),
[Noack controls](https://github.com/Noack1978/ha-airfryer-card/blob/3d9d8cf452a593fe392d34b5fd486385c1dc727e/ha-airfryer-card.js#L113).

The two frontend references above use MIT licenses. We should write a focused new
implementation, retain attribution for any material actually reused, and create our
own visual assets. Treat integration sources as interface research; do not vendor
manufacturer API implementations or their credentials into the card.

## Home Assistant discovery contract

`hass.entities` exposes display-registry metadata including `device_id`, `platform`,
`translation_key`, category and entity ID. `hass.devices` identifies the selected
device. `hass.states` supplies values, number bounds/steps/units, select options and
availability. No entity-prefix guessing is necessary for the normal path.

The display registry does not include `unique_id`. If semantic keys are absent, the
read-only full entity registry can provide it. The inspected Core implementation
does not decorate either list handler with `require_admin`; still handle permission
or API failures on the installed HA version and continue with available metadata.
Never require an administrator login just to render the card.

Prefer already-loaded frontend registries. Use a shared, per-connection read request
only when needed; decode abbreviated `list_for_display` fields if that is the fallback.
Do not make one registry request per card or scan every HA state on every update.

The display-list endpoint omits disabled entities. Full-registry entries can explain
why a capability is missing, but the card must not silently enable them. Distinguish
disabled, hidden, temporarily unavailable and unsupported capabilities. Honor hidden
entities by default, with an explicit editor option if the user wants to include them.

Sources: [display/full registry types](https://github.com/home-assistant/frontend/blob/ac6928622e2fedc9f1e34d171517ec3547104195/src/data/entity/entity_registry.ts),
[Core registry handlers](https://github.com/home-assistant/core/blob/cfa38d0bda11cbadba0b44c3778353f69b17dbf8/homeassistant/components/config/entity_registry.py#L37),
[hass object documentation](https://contributors.home-assistant.io/frontend/reference/hass-object/).

## Xiaomi Miot: first adapter

This is the user's installed integration, with model `careli.fryer.maf10a` and 20
entities shown in the screenshots. Actual entity IDs, numeric limits and live states
have not been captured. The screenshots establish the visible roles, not a verified
hardware fixture.

Current Miot entity constructors assign translation keys from service/property/action
semantics. Dots and colons are replaced with hyphens, so a property can appear as
`air_fryer-target_temperature` rather than its English display name. Registered unique
IDs also retain property/action identities. State attributes can retain raw MIoT
property values. Explicit custom names can remove translation keys, so keep a fallback
path and test renamed entities.

The `careli.fryer.*` profile exposes status/fault/time-left sensors, target time and
temperature numbers, option selects, switches, and cycle buttons. Both `resume_cook`
and `resume_cooking` must be recognized. They are model-dependent names, not typos.

Number entities publish minimum, maximum, step and unit from the spec. Use those
attributes; do not hardcode 200 °C, a fixed duration range, or a conversion factor.
The card should call the registered button/number/select/switch entities so the
integration remains responsible for MIoT service IDs and action inputs.

Miot button entities can stay available even when the appliance's live sensors are
unavailable. Capability discovery must not filter them out, and device availability
must not be inferred from one available button or diagnostic Info entity.

Sources: [entity semantics and keys](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/core/hass_entity.py#L119),
[fryer profile](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/core/device_customizes.py#L237),
[number limits](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/number.py#L35),
[button action handling](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/button.py#L35).

## Other integrations: realistic support boundaries

| Integration | Verified shape | Proposed support |
| --- | --- | --- |
| Xiaomi Home (`xiaomi_home`) | Property/action entities; generated IDs include semantic spec names and property/action indices. Enum states use translated descriptions. No equivalent translation-key assignment was found in the inspected property constructor. | Separate adapter. Prefer stable registry unique IDs when available, then metadata and generated-ID patterns. Do not claim arbitrary translated numeric enum codes are portable. |
| XiaomiAirFryer (`xiaomi_airfryer`) | Sensors plus a switch and integration-specific services for start, stop, pause, resume, time and temperature. | Separate service adapter; verify service registration and use an exact entity target. This is not the same command backend as Xiaomi Miot. |
| Philips HomeID (`philips_homeid`) | Explicit translation keys for status, temperature/time readings, writable temperature/time numbers and cycle buttons. | Strong second adapter candidate. Do not assume a separate Resume entity: define resume behavior only where documented and tested. |
| Built-in VeSync (`vesync`) | Air-fryer state and cooking-setting sensors. In the inspected number/button/select/switch/service files, no fryer editing/start command binding was found. | Monitoring support initially. A target-temperature sensor is not a writable setpoint. Enhanced third-party variants need their own adapter/fixtures. |

Examples of semantic differences that need adapter rules:

- Philips `airfryer_set_time` is a number in minutes; its integration converts to seconds
  internally. The card must send minutes, not multiply them again.
- Inspected VeSync `cook_set_time` is a duration sensor declared in seconds. Its HA
  documentation describes some time readings in minutes; trust the installed entity's
  attributes and tested integration-version behavior, not an assumed global unit.
- XiaomiAirFryer explicitly rejects `start_custom` on MAF10A. It is not a second
  candidate for the normal Start command.

Sources: [Xiaomi Home ID construction](https://github.com/XiaoMi/ha_xiaomi_home/blob/75b3acb6325a3a8d295688b13904737d6738a6a5/custom_components/xiaomi_home/miot/miot_device.py#L407),
[Xiaomi Home translated enums](https://github.com/XiaoMi/ha_xiaomi_home/blob/75b3acb6325a3a8d295688b13904737d6738a6a5/custom_components/xiaomi_home/sensor.py#L123),
[XiaomiAirFryer services](https://github.com/tsunglung/XiaomiAirFryer/blob/6a2be8b3fd388b7b5fd80c57683a728a87cac15d/custom_components/xiaomi_airfryer/switch.py#L117),
[MAF10A custom-start exclusion](https://github.com/tsunglung/XiaomiAirFryer/blob/6a2be8b3fd388b7b5fd80c57683a728a87cac15d/custom_components/xiaomi_airfryer/switch.py#L327),
[Philips numbers](https://github.com/renaudallard/homeassistant_philips_homeid/blob/5dcc04b4f701c2ef976e062f6b0cf9954def4e07/custom_components/philips_homeid/number.py#L68),
[Philips buttons](https://github.com/renaudallard/homeassistant_philips_homeid/blob/5dcc04b4f701c2ef976e062f6b0cf9954def4e07/custom_components/philips_homeid/button.py#L112),
[VeSync sensors](https://github.com/home-assistant/core/blob/cfa38d0bda11cbadba0b44c3778353f69b17dbf8/homeassistant/components/vesync/sensor.py#L191),
[VeSync documentation](https://www.home-assistant.io/integrations/vesync/#air-fryers).

## Product consequences

1. Select a device once; do not ask for 20 entity IDs. Autoselect only when exactly one
   unambiguous fryer is found. Never silently switch to another device.
2. Discover schema independently of current availability. The user expects their fryer
   to become unavailable when powered off; a quiet inactive card must retain its layout.
   Unavailability alone is not proof of Off versus a connection failure.
3. Temperature and total cooking time need direct inline editing. Mode, preheat and
   keep-warm should be native controls, not only links to more-info dialogs.
4. Keep remaining time, cooking duration, reservation countdown and current temperature
   as separate roles. Turn-over reminder is not a basket-open sensor.
5. A button's `unknown` state can mean it has never been pressed, not that it is unusable.
   Start still needs appliance-level availability and any known interlocks.
6. Missing writable capabilities should produce a smaller usable card, not invented
   commands. Unknown extra settings can be rendered by domain; diagnostic actions belong
   in a separate area and are never automatically triggered.
7. Display translations via HA where appropriate; refresh on locale/translation changes.
   Avoid the fixed German program-name bug encountered in the dishwasher card.

## Remaining evidence needed during implementation

- A sanitized live registry/state snapshot for the user's Miot version, once with the
  fryer available and once powered off; then actual cooking/pause/resume/finished states.
- Actual min/max/step/unit attributes and the state values for mode, texture and turn-pot.
- A fixture for a different Miot model using `resume_cooking`.
- Philips and Xiaomi Home fixtures before advertising tested control support.

These are validation gates, not a requirement to manually configure IDs. The planned
card's diagnostics view should collect a selected-device snapshot automatically, with
an allowlist of necessary fields and synthetic replacements for identifiers. Screenshots
and source-derived fixtures must not be presented as real hardware test results.

## Connected Home Assistant MCP follow-up

The newly connected MCP was inspected read-only. Four exact-name fryer switch queries
succeeded, all currently unavailable. Earlier device-name queries were too broad for
the Assist name filter. The current interface still lacks registry/state-attribute and
history readers. The private access notes and partial observation are excluded from this repository;
a full discovery fixture and hardware control tests remain outstanding.

The deeper follow-up retrieved Xiaomi's original MAF10A spec and found a consequential
exception: `turn-pot` is read/notify only despite being shown as a select in HA. It
also established model-specific ranges and enum/state mappings. See
[the MAF10A specification findings](MAF10A_DETAILS.md). These refine the first adapter
without making any claim about the user's installed entity attributes or firmware.
