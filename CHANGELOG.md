# Changelog

## 0.1.6

- Replace the always-visible temperature/time editors with a compact, collapsed
  Temperature & time row. Preheat and automatic keep-warm join the expanded settings.
- Keep cooking, preheat, scheduled and paused views focused on remaining time and
  cycle controls. Setup settings remain available under More settings, labelled as
  the last values reported by the fryer.
- A locally selected program shows its name and Set by program on Start, without
  presenting the previous program's temperature/time as a preset preview. No preset
  values are invented and choosing a program still sends no commands.
- Allow numeric drafts to be discarded. Apply/discard drafts before selecting another
  program, preserving the existing requirement to confirm them before Start.
- Hide unsupported Power controls from the main card; retain the explanation in
  Discovery details. Real discovered power controls keep working, including while
  cooking sensors are offline.

## 0.1.5

- Begin status observation and the bounded read burst when a cycle command is dispatched,
  without waiting for its HA service response. This removes the remaining acknowledgement
  gate in 0.1.4 for Start, changed-program Start, Pause, Resume and Stop.
- Accept a genuinely reported target state while the service response is pending. Keep
  handling early rejection, late responses, timeout and cancellation without retrying
  control commands or replacing confirmed state with a service result.
- Show separate HA service-response and reported-state-confirmation timings, first-read
  timing, read count and failure flags in Discovery details and the sanitized export.
  Pending text distinguishes command dispatch from HA acceptance.
- Add regressions with both control and read responses held open, including the production
  bundle. Hardware latency remains unmeasured; a fixed confirmation time is not promised.

## 0.1.4

- Request fresh status after cycle commands instead of only waiting for a scheduled
  integration poll. Registered Xiaomi Miot `get_properties` reads MAF10A's read-only
  status property and publishes the result into HA, bypassing coordinator debounce.
- If still unconfirmed, request at most three reads, targeting 0.25, 1.25 and 3 seconds
  after command acknowledgement, with at least one second between attempts. Watch
  state concurrently with refresh acknowledgements; two direct reads may be outstanding
  because the handler can wait for a coordinator after publishing its read result.
- Use registered `homeassistant.update_entity` as a conservative fallback, with one
  pending call. Other models never inherit MAF10A property IDs. Refresh errors fall
  back to ordinary reported state and never retry a control command.
- Show the selected refresh provider in discovery details. No continuous/background
  polling and no promise of a fixed hardware or cloud response time.

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
