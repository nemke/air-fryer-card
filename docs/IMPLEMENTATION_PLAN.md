# Implementation plan: Air Fryer Card

## Product contract

Build one manufacturer-agnostic HA card with automatic capability discovery. First
target Xiaomi Miot, including the user's `careli.fryer.maf10a`, without hardcoding its
entity IDs. Other devices/integrations use the same UI according to their capabilities.

The normal setup is: install in HACS, add card, choose an air fryer, save. The card
then discovers and updates the applicable controls automatically. Optional overrides
are an escape hatch in the visual editor, not the default configuration workflow.

Proposed configuration:

```yaml
type: custom:air-fryer-card
device_id: <chosen in the visual editor>
```

No `device_id` is necessary when exactly one supported fryer can be confidently
identified. If multiple devices match, the editor offers a picker; runtime rendering
must not choose whichever device happens to be first in a registry.

## Scope of the first usable version

- Automatic Xiaomi Miot device/capability discovery plus a conservative generic path.
- Status, availability, remaining time and optional current temperature.
- Inline target-temperature and total-cooking-time editing.
- Actual mode/program options, preheat and automatic keep-warm.
- Start, Pause, Resume and confirmed Stop when the adapter exposes them.
- Additional number/select/switch settings under More settings, with deduplication.
- English UI following HA locale; Serbian UI can ship alongside English. Native entity
  enum labels use HA formatting and refresh when resources/language change.
- Visual device editor, optional role overrides and a separate discovery diagnostics view.
- Stable idle/off/unavailable layouts; responsive dark/light themes and keyboard support.
- HACS-ready deterministic release artifact, documentation and local demo fixtures.

Not in the first version: cloud/device protocols, credentials, recipe downloading,
writing HA scripts/automations, automatically enabling entities, scheduled cooking,
remote wake-up without a real exposed capability, or promises of untested brands.

## Architecture

```mermaid
flowchart LR
    HA[HA device/entity registries and states] --> Inventory[Selected-device inventory]
    Inventory --> Discovery[Semantic role discovery]
    Discovery --> Adapters[Integration adapters]
    Adapters --> Model[Normalized capabilities and state]
    Model --> UI[Shared air fryer UI and editor]
    UI --> Commands[Validated command routing]
    Commands --> Services[HA entity services]
```

Use TypeScript for pure discovery/state/command modules, Lit for the custom card/editor,
and Vite for a local fixture demo and a bundled library build. Bundle required runtime
dependencies in the release JS; do not load a framework or manufacturer library from a
CDN. Use HA's existing controls/icons where suitable. Node 24's test runner can exercise
pure TypeScript modules; Playwright covers browser interaction and visual behavior.

Proposed structure:

```text
src/
  card.ts                 custom element / reactive UI
  editor.ts               device selector, optional overrides
  ha/                     registry normalization and connection cache
  discovery/              inventory, role evidence, ambiguity resolution
  adapters/               xiaomi-miot, generic; later other integrations
  model/                  capabilities, normalized state, units and time
  commands/               service plans, validation, pending/error state
  components/             temperature, duration, options, cycle controls
  localization/           own labels and HA formatting integration
demo/fixtures/            explicitly synthetic and sanitized captured fixtures
tests/                    discovery/state/command regressions and browser tests
docs/                     setup, compatibility evidence and diagnostics
dist/air-fryer-card.js
```

### Inventory and discovery

1. Read device metadata and group registry entries by **exact device ID**. Inspect only
   the selected device after selection. Never match control names across all HA devices.
2. Identify the integration from registry platforms/config entries, not a logo or the
   manufacturer string. A single physical appliance imported twice is not merged silently.
3. Build an inventory that retains temporarily unavailable entities and metadata-only
   entries. Resolve disabled/hidden entities explicitly rather than treating them as absent.
4. Prefer exact semantic translation keys and adapter-normalized unique IDs/property
   markers. Next use domain plus device class/unit/options. Use generated-ID suffixes or
   localized names only as lower-confidence evidence.
5. Choose a unique high-confidence match per primary role. Ties remain ambiguous; they
   must not silently select a Start/Stop target. The editor can resolve them by friendly
   entity name without asking users to write IDs.
6. Track why each role matched, candidate alternatives and why candidates were rejected.
   Put that detail in diagnostics, not the main cooking flow.
7. Re-discover when registry/device membership or relevant metadata changes, including
   state attributes arriving after first load. Do not cache solely by entity count.

The normalized role model must represent source entity/attribute, integration, read vs
write access, live availability, unit/range/options, confidence/evidence and any
ambiguity separately. A read-only target sensor and a writable target number may both
exist and serve different roles; never conflate them.

### Adapters

| Adapter | First implementation status / gate |
| --- | --- |
| `xiaomi_miot` | Full MVP target, source-derived fixtures first, live MAF10A validation required before claiming hardware tested. |
| Generic HA entities | Discover strong metadata matches and render additional typed settings. Unknown states remain readable; unsupported actions stay absent. |
| `philips_homeid` | Second control adapter, gated on integration fixtures and preferably a user/device test. Explicit semantic keys; model-specific resume behavior. |
| `xiaomi_home` | Next adapter; account for generated semantic IDs, optional full-registry unique IDs and localized enum states. |
| `xiaomi_airfryer` | Service adapter; validate installed services and exact target. Exclude MAF10A custom-start path. |
| `vesync` | Monitoring adapter for the inspected built-in integration; add commands only if an installed integration actually exposes them. |

Each adapter supplies identification evidence, role aliases, state normalization,
known command bindings and supported unit fallbacks. It must not make network calls to
the manufacturer. Extend integration support by fixtures and small adapters, not forks
of the entire card.

### UI behavior

Main card: device name and status, an optional simple fryer illustration, remaining
time, direct temperature/duration controls, mode picker, preheat/auto keep-warm, and
the relevant cycle actions. Current temperature appears separately when present.

More settings: typed editors for weight, texture, cooking measure, reservation and
reminder configuration, plus newly discovered number/select/switch entities. Respect
their own labels, ranges and options. No fixed limit that drops the user's twentieth
entity. Do not mix diagnostic Info/reset/update actions into cooking controls.

Inline number editing uses the number entity's min/max/step/unit. Select values remain
raw HA values while their labels are formatted. A target-temperature readout alone is
not presented as an editable control.

While the device is off/unavailable, keep the detected structure stable and disable
controls requiring live data. Use a quiet inactive presentation, not a red error page.
Only label the state definitely Off when there is evidence; otherwise explain that
live data is unavailable and the device may be switched off. Do not infer connectivity
from an always-available Miot action or diagnostic entity.

Unsupported controls are omitted. Supported but currently unavailable controls remain
visible in their normal place. An initial missing registry shows a small loading state
and retries after registry updates, not a permanent no-device error.

### State and time

Normalize known states into idle, preheating, ready, cooking, paused, reminder,
basket-out, keeping-warm, finished, delayed, fault and unavailable. Keep raw state and
its HA display label for unrecognized values. Do not assume numeric codes are identical
across models or languages.

Cooking duration, remaining duration and delayed-start duration are distinct roles.
Convert seconds/minutes/hours from the source unit. Send commands back in the target
entity's own unit. Missing units use a documented adapter fallback only; ambiguous
units are not guessed.

Prefer the integration's progress sensor. Otherwise show a progress estimate only
when total and remaining time are compatible and valid. Do not invent a cycle start
timestamp or precise seconds from a minute-resolution reading. Any smoothed countdown
must be labeled/treated as an estimate, reconcile with updates, pause appropriately,
and stop when the data becomes unavailable. No timer remains active after disconnect.

### Commands and errors

Discovery, rendering, editor preview and language updates make **zero mutation calls**.

Route normal controls through standard HA services: `number.set_value`,
`select.select_option`, explicit `switch.turn_on` / `switch.turn_off`, and `button.press`.
Use a known integration service only in its adapter with verified service availability
and an exact selected-device entity target. Avoid retrying `toggle` or Start blindly.

Edits have local draft state until committed. For Start with pending settings, generate
an ordered plan: validate fresh bindings and bounds, write changed values, verify the
required acknowledged/reported settings, then invoke Start once. If a setting fails,
do not start. Represent service acknowledgement and observed appliance state separately.
An HA service success alone is not proof the fryer started.

Debounce repeated input commits, prevent duplicate pending actions and show concise
errors next to the action. Stop requires confirmation. Existing native remote-control
restrictions or basket interlocks remain authoritative; the card does not bypass them.
Unknown buttons are not assigned cycle semantics just because their names contain Start.

## Phased work and exit criteria

### Model-specific refinements from the deeper investigation

- Preserve `phase` plus paused/completed status, so preheat completion cannot become
  whole-cycle completion and paused keep-warm does not become paused cooking.
- Scope numeric state mappings to verified model/spec evidence. Keep raw states for
  unknown models and refresh normalized display when locale metadata changes.
- For MAF10A, classify `turn-pot` as read-only even if HA presents a select; prohibit
  command generation for it. `turn-pot-config` remains its separate writable switch.
- Prefer a property's enum over its nominal unit: cooking measure is categorical
  despite the public spec's `percentage` field.
- Preserve exact installed select option strings on writes while trimming whitespace
  only for presentation and semantic comparison.
- Add regressions for 230 °C metadata, 5 °C steps, minute-based service payloads,
  all 15 model states, all four paused phases, and preheat completion distinct from
  cooking completion. Test that read-only Turn Pot cannot dispatch a select service.
- Clearly separate source-derived spec fixtures from the four-entry live Assist
  observation. Neither is a complete live HA discovery fixture or command test.

See [MAF10A details](MAF10A_DETAILS.md) for evidence and remaining validation limits.

### 1. Discovery model and fixtures

Implement registry normalization, exact-device inventory, semantic aliases, capability
types and ambiguity handling. Add synthetic Miot fixtures reflecting the screenshot's
20 roles, off/unavailable snapshots, renamed IDs and a `resume_cooking` variant.

Exit: discovery explains every expected role without literal entity IDs, never crosses
devices, retains controls while unavailable, and reports ambiguous command targets.
Create an allowlisted snapshot-export tool for a selected device so live validation
does not require manually collecting IDs. No private identifiers/tokens in public fixtures.

### 2. Usable Xiaomi Miot card

Implement the device editor, status/time presentation, inline controls, More settings,
command routing, availability handling and lifecycle cleanup. Build a demo driven by
fixtures so the entire UI is reviewable without touching the real appliance.

Exit: all available screenshot settings have an appropriate home, number bounds/options
come from metadata, and browser tests prove zero commands on render plus correct
services/targets for explicit interactions. Include keyboard/mobile/dark/light checks.

### 3. Live MAF10A validation

Import sanitized snapshots through the diagnostics flow, verify mappings and actual
state transitions, then test commands deliberately on the real device. Confirm time
and temperature units, ranges, update lag, button availability, pause/resume and errors.

Exit: publish an evidence-backed compatibility entry for the actual integration/model
version. Until then call it source/fixture validated, not hardware tested.

### 4. Prove cross-brand architecture

Add Philips HomeID fixture coverage and its adapter. Add VeSync monitoring fixtures
to prove read-only integrations do not accidentally receive commands. Add Xiaomi Home
and the dedicated XiaomiAirFryer backend as independent adapters after their fixtures.

Exit: the shared UI needs no manufacturer-specific branches; adapters produce a clear
capability model, and unsupported controls are absent rather than broken.

### 5. Release and HACS

Add README/configuration examples, compatibility matrix, changelog, licenses/attribution,
visual examples and HACS metadata. Publish a single reproducibly built JS release asset
with bundled dependencies and a checksum. Use read-only default CI permissions, pinned
actions, a lockfile and dependency review. Require lint/typecheck, meaningful tests and
build parity before release.

Start with HACS custom-repository installation for the new project. Submit it to the
default HACS catalog when the release/documentation requirements are met; catalog
inclusion is a separate review, not automatic at the first release.

## Required regression matrix

| Area | Cases |
| --- | --- |
| Discovery | Two fryers; identical names; renamed IDs; missing translation key; duplicate candidates; second integration on same appliance; late registry; disabled/hidden entities; same entity count with changed metadata. |
| Off/availability | All live sensors unavailable; buttons still available; initial offline load; recovery; missing number bounds; stale last values not shown as live. |
| State/time | Actual observed Miot enums; localized labels; unknown raw enum; seconds/minutes/hours; 0 remaining; invalid numbers; duration vs delay; pause/resume; coarse readings; stale updates. |
| Commands | Correct exact-device targets; limits/steps; no writes during discovery/preview; double clicks; rejected services; failed pre-start write; no blind toggle/Start retries; button state `unknown`; source read-only sensor. |
| UX/lifecycle | English/Serbian and delayed HA translations; light/dark; narrow card; keyboard editing; focus/selection survives state updates; disconnect cleans timers/subscriptions. |
| Security | Malicious entity labels/options/errors remain text; no credential reads, telemetry or external runtime fetches; diagnostic export allowlist; pinned sources and deterministic release artifact. |

## First concrete implementation task

Build the pure discovery engine and a fixture preview for the MAF10A roles. That proves
automatic configuration before investing in illustrations, recipe features or broad
marketing claims. The following task is the inline temperature/time/command UI.

This document records the original plan. See README, CHANGELOG and COMPATIBILITY for
the current implementation status. Version 0.1 applies/observes settings individually
before Start; a queued settings-plus-start transaction remains future work.

Version 0.1.1 keeps program selection local until explicit Start. The changed-program
path treats a mode write as potentially starting and never sends a second Start.
Power is promoted to the main UI when genuinely exposed, with Miot `on`/`switch`
aliases and separate availability from cooking sensors. Unsupported power is explained
without writing the read-only status or relabeling Stop as physical Off.
