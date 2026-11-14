const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const directory = path.join(root, 'supabase/migrations');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'supabase/migrations.manifest.json'), 'utf8'));
const files = fs.readdirSync(directory).filter(name => name.endsWith('.sql')).sort();
assert.deepEqual(files, manifest.files.map(file => file.name).sort(), 'Migration file set differs from manifest');
const versions = new Set();
for (const entry of manifest.files) {
  const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(entry.name);
  assert.ok(match, 'Invalid migration filename');
  assert.equal(match[1], entry.version, 'Version differs from filename');
  assert.ok(!versions.has(entry.version), 'Duplicate migration version');
  versions.add(entry.version);
  const bytes = fs.readFileSync(path.join(directory, entry.name));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256.toLowerCase(), `Checksum mismatch: ${entry.name}`);
}
console.log(`PASS: ${files.length} ordered migration filenames, unique versions and SHA256 checksums.`);
console.log('Applied versions must still be checked in the target database ledger; timestamps do not validate SQL content.');
