# Capability map: Xiaomi Miot / careli.fryer.maf10a

The 20 screenshot entities map to the proposed card as follows. Names are visible
labels, not assumed entity IDs. Semantic keys below are adapter aliases to normalize
against registry metadata; match domain and selected device as well.

| Visible HA entity | Expected domain | Semantic role / aliases | UI |
| --- | --- | --- | --- |
| Air Fryer | sensor | status; `air_fryer`, `air_fryer.status` | Header status and cycle state |
| Time Remaining | sensor | remaining; `air_fryer.left_time` | Main countdown |
| Error | sensor | fault; `air_fryer.fault` | Contextual fault message; preserve raw value |
| Operating Temperature | number | target temperature; `air_fryer.target_temperature` | Inline temperature control |
| Operating Time | number | total cooking duration; `air_fryer.target_time` | Inline duration control |
| Mode | select | cooking mode; `air_fryer.mode` | Main mode picker |
| Start Program | button | start; `air_fryer.start_cook` | Primary Start action |
| Pause | button | pause; `air_fryer.pause` | Pause while supported/appropriate |
| Resume Cook | button | resume; `air_fryer.resume_cook`, `air_fryer.resume_cooking` | Resume while paused |
| Stop Program | button | stop; `air_fryer.cancel_cooking` | Confirmed Stop |
| Preheat | switch | preheat; `air_fryer.preheat` | Primary option |
| Auto Keep Warm | switch | automatic keep warm; `air_fryer.auto_keep_warm` | Primary option |
| Current Keep Warm | switch | current keep-warm setting; `air_fryer.current_keep_warm` | More settings, distinct from Auto |
| Cooking Weight | number | weight; `air_fryer.cooking_weight` | More settings, entity-provided range/unit |
| Reservation Left Time | number | reservation; `air_fryer.reservation_left_time` | More settings / delayed-start context; do not treat as cycle time |
| Target Cooking Measure | select | cooking measure; `air_fryer.target_cooking_measure` | More settings, actual select options |
| Texture | select | texture; `air_fryer.texture` | More settings |
| Turn Pot | select in screenshot; read-only in MAF10A spec | turn-over reminder state; `air_fryer.turn_pot` | Read-only reminder/status; never send select writes or infer basket position |
| Turn Pot Config | switch | reminder configuration; `air_fryer.turn_pot_cfg`, `air_fryer.turn_pot_config` | More settings |
| Info | button | diagnostic information action | Diagnostics only; never cycle Start |

Sources: screenshot evidence supplied by the user and
[the integration's fryer profile](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/core/device_customizes.py#L237).

`air_fryer.target_temperature` can become `air_fryer-target_temperature` in the registry
translation key. Normalize separator conventions, not localized display text. Unique
IDs or raw property attributes can provide secondary evidence when a key is absent.

The screenshot has no confirmed power switch, actual-temperature reading or basket
contact. Do not invent these capabilities. Detect them if an installed integration
really exposes them.

Installed number/select metadata still needs a live snapshot. Xiaomi's original
MAF10A spec supplies model-specific range, access and enum evidence; see
[details](MAF10A_DETAILS.md). Never apply those codes or limits globally to other models.

Capability presence, live availability, readability and writability are separate
properties. An unavailable sensor is still a discovered sensor; an available button
does not make the appliance available.
