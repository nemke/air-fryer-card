# Contributing

Use Node 22.12 or newer and npm. Run `npm ci --ignore-scripts`, `npx playwright install
chromium`, then `npm run check`. `npm run dev` serves the synthetic preview. The preview
never connects to a real Home Assistant. Build output is a single bundled ES module.

Keep capability discovery, state normalization and command routing separate from Lit.
Add a fixture and regression case for an integration/model before claiming support.
Unknown status values must remain visible; never guess a cycle command or cross device
membership. Discovery and previews must not call mutation services.

Do not commit HA exports, tokens, IP addresses, account identifiers, device unique IDs,
or home-wide state dumps. The schema exporter intentionally excludes raw values,
names and options. A complete replay fixture still needs a deliberately sanitized
contribution; use the synthetic fixture as a template.

Changes to source must include a fresh `npm run build`. CI checks the committed bundle
and checksum for parity. See [HACS roadmap](docs/HACS.md) for release and catalog steps.
