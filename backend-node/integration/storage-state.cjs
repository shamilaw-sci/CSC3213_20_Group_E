const { execFileSync } = require('node:child_process');

function normalizeDump(sql) {
    return sql.replace(/^\\(?:un)?restrict .*\r?\n/gm, '').replace(/\r\n/g, '\n');
}
async function storageDatabaseState(client) {
    const schema = normalizeDump(execFileSync('docker', ['exec', 'supabase_db_thirasara-phase4-c',
        'pg_dump', '-U', 'postgres', '-d', 'postgres', '--schema=storage', '--schema-only'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024, timeout: 15000 }));
    const names = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='storage' ORDER BY tablename")).rows.map(row => row.tablename);
    const tables = {};
    for (const name of names) {
        if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error('Unexpected native Storage table name.');
        tables[name] = (await client.query(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text), '[]'::jsonb) AS snapshot FROM storage."${name}" t`)).rows[0].snapshot;
    }
    return { schema, tables };
}

function fileManifest(containerId) {
    if (!/^[a-f0-9]{64}$/.test(containerId)) throw new Error('Verified Storage container required for manifest.');
    // Read-only inventory through the already-verified existing Storage process/container.
    const script = "const fs=require('fs'),p=require('path'),c=require('crypto');const out=[];function walk(dir){for(const n of fs.readdirSync(dir).sort()){const full=p.join(dir,n),s=fs.lstatSync(full);if(s.isSymbolicLink())throw Error('symlink refused');if(s.isDirectory())walk(full);else if(s.isFile())out.push({path:p.relative('/mnt',full).split(p.sep).join('/'),size:s.size,sha256:c.createHash('sha256').update(fs.readFileSync(full)).digest('hex')});else throw Error('unexpected file type')}}walk('/mnt');process.stdout.write(JSON.stringify(out));";
    return JSON.parse(execFileSync('docker', ['exec', containerId, 'node', '-e', script],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024, timeout: 15000 }));
}

function assertStorageState(before, after) {
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Storage schema/metadata/files were not preserved.');
}
module.exports = { normalizeDump, storageDatabaseState, fileManifest, assertStorageState };
