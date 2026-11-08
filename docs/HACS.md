# HACS distribution and default-catalog plan

## First release: custom repository

Repository: https://github.com/nemke/air-fryer-card

Add that URL in HACS → Custom repositories → Dashboard. Install Air Fryer Card, reload
the browser, and select Air Fryer from the dashboard's Add card dialog. HACS normally
registers the resource. If needed, add `/hacsfiles/air-fryer-card/air-fryer-card.js` as a
JavaScript module under dashboard resources. No separate integration or credentials
are required by the card.

The repository commits `dist/air-fryer-card.js` so default-branch installs work too.
Each release also includes that file and SHA256SUMS. `hacs.json` explicitly selects
the filename. All runtime code, translations and illustration are in the bundle.

## Release process

1. Update package version, lockfile and changelog. Run `npm run check`.
2. Check source/bundle parity, review screenshots and commit all release files.
3. Push; require green CI and HACS validation with no ignored checks.
4. Create the full GitHub release targeting the tested commit. Attach
   `dist/air-fryer-card.js` and `dist/SHA256SUMS`. A tag alone is not a release.
5. Verify the release asset and test a clean HACS custom-repository installation.

## Default catalog submission

The project is not yet included in the default catalog. These are the remaining gates:

- Verify automatic mappings with sanitized live metadata on Xiaomi Miot / MAF10A.
- Deliberately validate setting changes and cooking/pause/resume/stop on hardware;
  record installed HA/integration versions, availability behavior and update latency.
- Complete a clean HACS install/upgrade test; ensure README screenshots, description,
  topics, issues, MIT license and a full release are present.
- Confirm HACS Action passes without ignores for the released version.
- As repository owner, branch from `hacs/default`'s current default branch in a personal
  fork; add `nemke/air-fryer-card` alphabetically to `plugin` and complete its PR template.
  Allow maintainer edits. Submit only statements actually verified.

Catalog inclusion depends on the HACS maintainers' review. Custom-repository installation
does not require that review. Do not advertise default HACS availability before approval.

Official requirements checked 2026-11-08:

- https://hacs.xyz/docs/publish/plugin/
- https://hacs.xyz/docs/publish/start/
- https://hacs.xyz/docs/publish/include/
- https://hacs.xyz/docs/publish/action/
