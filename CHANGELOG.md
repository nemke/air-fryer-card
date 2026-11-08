# Changelog

## 0.1.1

- Program dropdown changes stay local until **Start selected program** is pressed.
  Miot mode writes can start cooking, so a changed program is sent once without a
  second Start action. Delayed status, errors and timeouts never trigger a fallback
  Start. Unchanged programs keep using the ordinary Start button.
- Put power on/off on the main card and recognize Miot `on`, `switch` and main-service
  power keys. A reachable power switch remains usable while cooking sensors are
  unavailable. When no genuine power entity is exposed, show the limitation and
  never repurpose the read-only status or the Stop action as physical power.
- Numeric drafts no longer disable Pause/Stop. Add program side-effect and power
  regressions, including cancellation, stale selections and duplicate submissions.

## 0.1.0

Initial preview release. Automatic device and semantic capability discovery; Xiaomi
Miot adapter with MAF10A state normalization; inline number controls, native option
selects, cycle actions and confirmed Stop. Offline layout, visual editor with optional
role overrides, English/Serbian labels and privacy-filtered schema export.

Validated with synthetic public-spec fixtures and browser tests. Real-device metadata
and cooking-command validation are pending. Generic semantic discovery is conservative;
other brands are not advertised as tested control integrations.
