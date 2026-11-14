const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const inputPath = process.argv[2];
assert.ok(inputPath, 'Provide the private local schema snapshot log path');
const lines = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
const jsonLines = lines.filter(line => line.startsWith('{'));
assert.equal(jsonLines.length, 1, 'Expected one catalog JSON result');
const actual = JSON.parse(jsonLines[0]);
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const observed = manifest.observed;
const canonical = value => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
    : value;
const sorted = (rows, keys) => [...rows].sort((a, b) => {
  for (const key of keys) {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
  }
  return 0;
});
const compare = (name, expected, actualRows, keys) => {
  assert.deepEqual(canonical(sorted(actualRows, keys)), canonical(sorted(expected, keys)), `${name} differs`);
  console.log(`PASS: ${name} (${expected.length})`);
};
compare('tables/RLS', observed.tables, actual.tables, ['name']);
// Dropped columns leave physical attnum gaps in existing PostgreSQL tables.
// A fresh table has contiguous positions; compare visible order, not dropped slots.
const visibleOrdinals = rows => {
  const positions = new Map();
  return sorted(rows, ['table_name', 'attnum']).map(column => {
    const ordinal = (positions.get(column.table_name) || 0) + 1;
    positions.set(column.table_name, ordinal);
    return { ...column, attnum: ordinal };
  });
};
compare('columns/defaults/types', visibleOrdinals(observed.columns), visibleOrdinals(actual.columns), ['table_name', 'attnum']);
compare('constraints', observed.constraints, actual.constraints, ['table_name', 'conname']);
compare('indexes', observed.indexes, actual.indexes, ['table_name', 'index_name']);
compare('enum labels/order', observed.enums, actual.enums, ['type', 'order']);
compare('desired public/storage policies', [
  ...manifest.desiredPublicPolicies,
  ...observed.policies.filter(policy => policy.schemaname === 'storage'),
], actual.policies, ['schemaname', 'tablename', 'policyname']);
const aclEntries = acl => (acl || '').replace(/^\{|\}$/g, '').split(',').filter(Boolean).sort();
compare('explicit table ACL/owners', observed.tableAcl.map(table => ({ ...table, acl: aclEntries(table.acl) })),
  actual.tableAcl.map(table => ({ ...table, acl: aclEntries(table.acl) })), ['relname']);
compare('storage bucket configuration', observed.storage, actual.storage, ['id']);
const expectedFunctions = observed.functions.filter(fn => fn.name !== 'rls_auto_enable').map(fn => ({
  name: fn.name,
  arguments: fn.arguments,
  fingerprint: fn.lfNormalizedFingerprint,
  definer: fn.definer,
  acl: aclEntries(fn.acl),
}));
compare('functions/source/EXECUTE ACL', expectedFunctions, actual.functions.map(fn => ({
  ...fn, acl: aclEntries(fn.acl),
})), ['name', 'arguments']);
console.log('PASS: captured application metadata matches the explicit desired target.');
