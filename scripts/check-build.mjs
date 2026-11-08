import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const file = 'dist/air-fryer-card.js';
const source = readFileSync(file, 'utf8');
if (/\bimport\s*(?:\(|[{"'])/.test(source)) throw new Error('Release must be a single bundled file.');
writeFileSync('dist/SHA256SUMS', `${createHash('sha256').update(source).digest('hex')}  air-fryer-card.js\n`);
console.log(`Verified standalone bundle (${Math.round(Buffer.byteLength(source) / 1024)} KiB).`);
