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

The first version applies and confirms settings individually before enabling Start.
There is no queued recipe/start transaction. A successful action call is shown as a
request, not proof the appliance changed state. No automatic retries, scheduled
cooking, wake-up, recipe upload, cloud credentials or manufacturer API calls.
