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
