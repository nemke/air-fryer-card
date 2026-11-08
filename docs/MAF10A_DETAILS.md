# MAF10A: deeper specification investigation

Retrieved 2026-11-08 from Xiaomi's public MIoT spec API. This is model-level evidence,
not a capture of the user's installed HA entities or a test of cooking commands.

Model: `careli.fryer.maf10a`.
Spec: `urn:miot-spec-v2:device:air-fryer:0000A0A4:careli-maf10a:1`.
Air-fryer service: IID 2, 18 properties, five actions, three events.

[Original JSON](https://miot-spec.org/miot-spec-v2/instance?type=urn%3Amiot-spec-v2%3Adevice%3Aair-fryer%3A0000A0A4%3Acareli-maf10a%3A1)
is preserved as [a research snapshot](../research/miot/careli.fryer.maf10a.spec.json).
The card should not contact this API at runtime. Its installed HA entity metadata
remains authoritative for actual number bounds/options; model rules refine semantics.

## Main correction: Turn Pot is not a writable setting

Property 14, `turn-pot`, has only `read` and `notify` access. Values 1/2 indicate
whether a turn-over reminder is needed. The screenshot nevertheless shows a select.
The inspected Miot fryer profile explicitly includes `turn_pot` in `select_properties`,
and its select implementation routes selections to `device.async_write`. That explains
how a selectable presentation can exist without proof that the device accepts writes.
No attempted write was made, so the actual error behavior is untested.

Render it as a reminder/status. Keep property 15, `turn-pot-config`, as the separate
writable reminder switch. Never treat either as a physical basket-open contact.
For this known model, the adapter must prevent a command plan for property 14 even
when the incoming HA domain is `select`. Unknown extras cannot automatically override
a known read-only rule merely because their HA domain normally supports writes.

Sources: [fryer profile](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/core/device_customizes.py#L237),
[select implementation](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/select.py#L65), and original JSON above.

## Numeric schema

| Property | Range / step in public spec | Access | Consequence |
| --- | --- | --- | --- |
| Target temperature | 40–230 °C / 5 | read/write/notify | Do not impose a 200 °C cap. |
| Target time | 1–1440 minutes / 1 | read/write/notify | Input in minutes; no seconds conversion on service call. |
| Time remaining | 0–1440 minutes / 1 | read/notify | Countdown, not editable duration. |
| Reservation left time | 0–2880 minutes / 1 | read/write/notify | Separate scheduling value; exact finish/start semantics still need validation. |
| Cooking weight | 100–1800 / 1; no unit field | read/write/notify | Do not infer a unit solely from this raw field. |

These are schema bounds, not proof every combination works in every mode. In particular,
a 24-hour duration range does not imply high-temperature cooking accepts that duration.
Do not invent mode-specific constraints; validate observed behavior before offering
recipe shortcuts. Missing live metadata should disable editing pending schema arrival,
rather than silently substitute model defaults into an unverified entity.

## State semantics

All mappings below are scoped to the exact spec above. HA may expose translated
descriptions and raw numeric properties separately. Preserve raw evidence, use adapter
normalization, and do not equate numeric codes across models.

| Code | Spec description | Proposed presentation |
| --- | --- | --- |
| 0 | Off | Off when this value is actually observed |
| 1 | Idle | Ready to configure |
| 2 | Paused | Paused cooking |
| 3 | Delay | Scheduled/reservation phase |
| 4 | Cooking | Cooking |
| 5 | Preheat | Preheating |
| 6 | Cooking Completed | Cooking finished |
| 7 | Preheat Completed | Preheat finished; do not claim whole cycle finished |
| 8 | Preheat Paused | Paused preheating |
| 9 | Turn Pot Paused | Shake/turn reminder pause; no inferred basket position |
| 10 | Keep Warm | Keeping warm |
| 11 | Keep Warm Paused | Paused keep-warm phase |
| 12 | Keep Warm Completed | Keep-warm finished |
| 13 | Crispy Roast | Active crisp-roasting phase |
| 14 | Degrease | Active degreasing phase |

Represent phase and paused/completed status separately. A single generic `paused` or
`finished` field loses the difference between preheat and cooking completion. The spec
does not define legal transitions or which actions each phase accepts. Resume visibility
can follow a known paused phase, but actual command acceptance still needs hardware
validation. Never automatically advance from preheat completion to Start/Resume.

Fault values: 0 means no fault for this spec; 1–3 are E1/E2/E3. Show the observed code
without inventing a diagnosis. `unknown`/`unavailable` is not an observed fault or Off.

## Modes and extra enums

- Mode has 13 entries: Manual, French Fries, Chicken Wing, Steak, Lamb Chops, Fish,
  Shrimp, Vegetables, Cake, Pizza, Defrost, Dried Fruit and Yogurt.
- Target cooking measure has five categorical entries: NULL, One Layer, Double Layer,
  Half Pot and Full Pot. Although the spec includes `percentage` as its unit, the
  value list is categorical. Render a select, never a 0–4% slider.
- Texture has four entries: NONE, Crispy Roast, Tender Roast and Degrease.
- Auto Keep Warm and Current Keep Warm are distinct writable booleans; avoid merging
  their discovery roles. Current Keep Warm is a setting, not the main cycle-state sensor.
- Trim known description whitespace for display/normalization, preserving the exact
  installed HA option string in outgoing `select.select_option` calls.

## Actions and events

Normal Start, Cancel, Pause and Resume have no MIoT action inputs. Start Recipe Cook
is a different action with nine property inputs. The screenshot's normal Start button
does not require reconstructing a recipe request. Use standard HA entity services and
let the installed integration handle the transport. Never choose an action merely
because its name contains `start`.

The spec declares cooking-start, cooking-finished and keep-warm-finished events. This
does not prove HA creates event entities or exposes them to a dashboard. Status polling
must work without event support. The inspected Miot profile polls key status/time fields
at 20 seconds; an optional animated countdown must be labeled an estimate, freeze on
pause/unavailability and reconcile to device updates. Zero estimated time never proves
completion. Avoid reporting success from a service acknowledgement alone.

## Evidence and validation boundary

The source spec answers ranges, enum definitions and declared access. The user's MCP
connection confirms only four currently unavailable switches; it provides no entity
IDs, number attributes, mode options, integration version or cooking history. Those
remaining fields need a selected-device capture once a richer reader is available.
The card architecture can proceed with clearly marked source-derived fixtures.
