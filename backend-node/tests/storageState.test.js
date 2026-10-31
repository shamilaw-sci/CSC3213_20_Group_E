const { normalizeDump, assertStorageState, fileManifest } = require('../integration/storage-state.cjs');
test('normalizes only pg_dump random restrict tokens and Windows line endings', () => {
    expect(normalizeDump('\\restrict random\r\nCREATE TABLE example(id uuid);\r\n\\unrestrict random\r\n'))
        .toBe('CREATE TABLE example(id uuid);\n');
});
test('accepts exact Storage state', () => {
    const state = { schema: 'table', tables: { objects: [] }, files: [] };
    expect(() => assertStorageState(state, structuredClone(state))).not.toThrow();
});
test.each(['schema', 'tables', 'files'])('refuses %s drift without printing contents', key => {
    const before = { schema: 'private-definition', tables: {}, files: [] };
    expect(() => assertStorageState(before, { ...before, [key]: 'different-private-value' }))
        .toThrow('Storage schema/metadata/files were not preserved.');
});
test('refuses unverified container identifiers before Docker invocation', () => {
    expect(() => fileManifest('supabase_storage_other')).toThrow(/Verified Storage/);
});
