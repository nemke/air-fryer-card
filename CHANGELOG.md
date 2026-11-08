# Changelog

## 0.1.3

- Replace the entire cycle-control row with one disabled progress indicator during
  a request. While pausing, neither Pause nor Stop remains visible; confirmed pause
  restores Resume/Stop. The same rule applies to Start, Resume and Stop.
- Flush the pending UI before calling HA and explicitly redraw when it finishes.
  Browser regressions stop all periodic HA fixture updates and assert that the
  Pausing-only row is already rendered when the service call begins.

## 0.1.2

- Start, Pause, Resume and Stop now remain pending until the reported device state
  confirms the action. Buttons immediately show Starting/Pausing/Resuming/Stopping
  with a spinner, block duplicate submissions and explain the HA update delay.
- Prefer a recognized current status over a copied numeric attribute, fixing the
  case where `Paused` plus a stale raw `4` kept Pause visible instead of Resume.
  Accept numeric-string raw status and the exact `resume` action key. Missing Resume
  bindings are visible and explained rather than silently omitted.
- Show distinct On and Off buttons in an always-visible Power section, with clear
  unavailable/unsupported explanations. Physical power still requires a real HA entity.
- Display the loaded bundle version beside Discovery details and include it in the
  sanitized schema export so installed and browser-loaded versions can be distinguished.

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
