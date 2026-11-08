# Compatibility and validation evidence

| Integration/model | Discovery | UI and routing | Hardware |
| --- | --- | --- | --- |
| Xiaomi Miot / careli.fryer.maf10a | Synthetic renamed-ID fixture, public spec evidence | 20 screenshot roles, 15 status values, settings/actions covered by automated tests | Pending |
| Xiaomi Miot / other models | Shared semantic aliases, including resume_cooking | Unknown models retain raw state; cycle actions withheld until state adapter is known | Pending |
| Generic HA semantic entities | Exact-device and translation-key matching; explicit overrides | Typed settings/readings, no guessed cycle-state commands | Experimental |
| Philips HomeID, Xiaomi Home, XiaomiAirFryer, VeSync | Investigated only | Separate adapters planned; not claimed as supported | Pending |

No integration is installed by this card. The device must already exist in Home
Assistant. A number entity supplies its own min/max/step/unit and a select supplies its
actual options. Missing schema disables edits. MAF10A Turn Pot is read-only even when
the integration presents it as a select. The separate Turn Pot Config is writable.

The full entity registry is read through a shared connection cache. If access is
denied, the card falls back to loaded frontend metadata or the display registry;
automatic matches may then be incomplete. Use the visual overrides for missing
semantics. Hidden entities are excluded by default and disabled entities are always
excluded. No entities are automatically enabled.

The schema download is privacy-filtered: it replaces entity/device identifiers and
omits names, options, values, unique IDs and arbitrary attributes. It documents schema
shape but is not sufficient to replay translated enum states. Never publish an
unfiltered HA dump to obtain that missing evidence.

Numeric settings are applied and confirmed individually before enabling Start.
As of 0.1.1, selecting a program changes local draft state only. An explicit Start
sends the changed mode once; it does not send an additional Start action because
the MAF10A user reports that a mode write itself starts cooking. If cooking is not
reported within 35 seconds, show an observation timeout without retrying or sending
a fallback Start. The unchanged-current-program path uses the ordinary Start button.
This is regression-tested using a side-effect simulation, not a new hardware test.

Power is a separate capability: recognize `power`, `on`, `switch` and Miot's main
air-fryer switch semantics, always within the selected device. Reachable power can
be controlled while cooking sensors are unavailable. Unavailable or ambiguous power
cannot be dispatched. MAF10A's public spec has neither a writable power property nor
a power action; its status is read-only and Cancel Cooking is not physical power-off.
Without a genuine HA power switch the visible Power button is disabled with an
explanation. The card does not add a manufacturer API, a smart plug or a status write.

There is no queued recipe/start transaction. A successful action call is a request,
not proof of a device state change. No automatic retries, scheduled cooking, recipe
upload, cloud credentials or manufacturer API calls.

As of 0.1.2, ordinary cycle commands as well as changed-program Start keep the card
locked until their expected state is observed, with explicit progress on the clicked
button. Pause requires a reported paused state; Resume/Start require an active,
unpaused phase; Stop requires idle/off/completion. The 35-second observation window
is cancellable on disconnect and does not retry. A recognized status string/number
takes precedence over its copied raw numeric attribute; a localized unrecognized
state can still use the raw attribute as fallback. These conflict/delay cases are
covered by synthetic regression tests, not new live appliance tests.

On/Off controls are always visible. They remain disabled without a genuine available
power switch and do not stand in for Start/Stop. Discovery details includes the loaded
bundle version, current status and copied raw attribute for targeted troubleshooting.

As of 0.1.3, the whole cycle-action row is replaced by a single disabled pending
indicator during a request. The redraw completes before the HA service call starts,
independently of HA updates. Normal controls return only after confirmation or an
explicit error/timeout; paused state restores Resume/Stop.

## Post-command refresh (0.1.5)

For exact model `careli.fryer.maf10a`, selected-device Miot status sensor and advertised
`xiaomi_miot.get_properties`, read `{siid: 2, piid: 1}` with `update_entity: true`.
This is a read, not a status property write or a manufacturer API call from the browser.
Other models do not reuse this mapping. If registered, `homeassistant.update_entity`
can instead request a selected-status-entity refresh; otherwise use reported updates.

The command-scoped burst has at most three attempts targeting 250/1250/3000 ms after
control dispatch, never less than 1000 ms apart. At most two direct-read service
acknowledgements can be pending; the coordinator fallback permits one. Observation
continues independently because the Miot handler dispatches read data before its forced
coordinator update finishes. Confirmation/cancellation ends further attempts; a failed
refresh stops the burst and preserves ordinary state observation. No commands are retried.

In 0.1.4 the burst began only after the control service acknowledged. In 0.1.5 both
observation and read requests begin alongside that control call. A reported target state
confirms the action without waiting for its service response. Rejection before state
confirmation fails the action; a late rejection is recorded without undoing an observed
state or overwriting a newer action. Timeout/cancellation still end observation even
if a service response remains pending.

Discovery details and the sanitized export separate control-response time, target-state
confirmation time, first read time and read count. They do not measure physical appliance
execution. Pending UI distinguishes a dispatched command from an acknowledged one, while
normal controls still require an actually reported target state.

Source evidence, pinned to the investigated Miot revision:

- [Direct read and dispatch](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/core/device.py#L1124)
- [Service handler and forced update](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/__init__.py#L392)
- [Service schema](https://github.com/al-one/hass-xiaomi-miot/blob/d6e6dfc8d2de409972a7683c93bbf3fa0119370c/custom_components/xiaomi_miot/services.yaml#L24)
- [HA update-entity behavior](https://www.home-assistant.io/actions/homeassistant.update_entity/)
- [HA coordinator throttling caveat](https://www.home-assistant.io/common-tasks/general/#to-define-a-custom-polling-interval)

Unit/browser tests simulate read-driven confirmation, including unresolved control and
refresh acknowledgements, changed-program Start, late errors, cancellation, an initially
stale read, and the built release bundle. They are not a live latency benchmark.
Actual 1–2 second confirmation depends on device/transport/cloud behavior and permissions.
