const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');
const e = require('./environment.cjs');
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const cliEnv = Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP','COMSPEC','PATHEXT',
    'USERPROFILE','APPDATA','LOCALAPPDATA'].filter(name => process.env[name]).map(name => [name,process.env[name]]));
async function main() {
    let stage = 'new target identity', client, admin;
    try {
        if (process.argv.length !== 2) throw new Error('No arguments accepted');
        const state = e.inspect();
        const storageFiles = ['storage-0002.sql', 'storage-0008.sql'].map(file => path.join(e.evidence, file));
        const target = path.join(__dirname, 'target.sql');
        const manifest = JSON.parse(fs.readFileSync(path.join(e.root, 'supabase/migrations.manifest.json'), 'utf8'));
        const workdir = path.join(e.evidence, 'workdir');
        const cli = path.join(e.root, 'docs/evidence/phase4-local/tooling/node_modules/@supabase/cli-windows-x64/bin/supabase.exe');
        stage = 'cached bootstrap and CLI provenance';
        if (!/^2\.122\.0$/.test(execFileSync(cli, ['--version'], { env: cliEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim())) throw new Error('CLI mismatch');
        const provenance = { nonce: state.nonce, target: hash(target), storage: storageFiles.map(file => ({ file: path.basename(file), sha256: hash(file) })),
            baseline: manifest.files.map(file => ({ name: file.name, sha256: hash(path.join(e.root, 'supabase/migrations', file.name)) })) };
        const record = path.join(e.evidence, 'provenance.json');
        if (fs.existsSync(record)) {
            if (JSON.stringify(JSON.parse(fs.readFileSync(record, 'utf8'))) !== JSON.stringify(provenance)) throw new Error('Provenance changed');
        } else fs.writeFileSync(record, JSON.stringify(provenance, null, 2), { flag: 'wx' });
        admin = new Client(e.database(state, 'supabase_admin')); await admin.connect();
        stage = 'fresh metadata marker and minimum official Storage prerequisites';
        const publicCount = (await admin.query(`SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')`)).rows[0].n;
        const marked = (await admin.query("SELECT to_regclass('phase7_acceptance_guard.environment') IS NOT NULL AS marked")).rows[0].marked;
        if (!marked) {
            if (publicCount !== 0) throw new Error('Application target not empty');
            await admin.query(`CREATE SCHEMA phase7_acceptance_guard AUTHORIZATION postgres;
                REVOKE ALL ON SCHEMA phase7_acceptance_guard FROM PUBLIC,anon,authenticated,service_role;
                CREATE TABLE phase7_acceptance_guard.environment(id text PRIMARY KEY,nonce uuid NOT NULL,stage text NOT NULL,patch_sha text);
                ALTER TABLE phase7_acceptance_guard.environment OWNER TO postgres;
                REVOKE ALL ON TABLE phase7_acceptance_guard.environment FROM PUBLIC,anon,authenticated,service_role;
                CREATE SCHEMA phase4_isolated_test_guard AUTHORIZATION postgres;
                REVOKE ALL ON SCHEMA phase4_isolated_test_guard FROM PUBLIC,anon,authenticated,service_role`);
            await admin.query('INSERT INTO phase7_acceptance_guard.environment VALUES($1,$2,$3,NULL)', [state.project, state.nonce, 'initializing']);
        }
        const mark = (await admin.query('SELECT * FROM phase7_acceptance_guard.environment')).rows;
        if (mark.length !== 1 || mark[0].id !== state.project || mark[0].nonce !== state.nonce) throw new Error('Marker mismatch');
        if (mark[0].stage === 'ready') {
            if (mark[0].patch_sha !== provenance.target) throw new Error('Patch hash mismatch');
            client = new Client(e.database(state)); await client.connect();
            await client.query('BEGIN READ ONLY');
            await e.verifyReady(client, state, provenance.target);
            await require('./catalog.cjs').verifyCatalog(client);
            console.log('PASS: exact Phase7 target already initialized; no replay.'); return;
        }
        if (!['initializing', 'baseline'].includes(mark[0].stage)) throw new Error('Unknown stage');
        if (!(await admin.query("SELECT to_regclass('storage.buckets') IS NOT NULL AS present")).rows[0].present) {
            // Image bootstrap already owns native roles. Skip the SQL's legacy optional role install
            // (it grants postgres back to authenticator, a cycle on this current image).
            // Minimum tables/ownership only; this does not emulate or validate the Storage API.
            await admin.query("BEGIN; SELECT set_config('storage.install_roles','false',true)");
            for (const file of storageFiles) await admin.query(fs.readFileSync(file, 'utf8'));
            await admin.query(`GRANT CREATE ON SCHEMA storage TO postgres;
                ALTER TABLE storage.buckets OWNER TO postgres;
                ALTER TABLE storage.objects OWNER TO postgres;
                ALTER TABLE storage.migrations OWNER TO postgres`);
            await admin.query('COMMIT');
        }
        stage = 'official bucket-limit bootstrap prerequisites';
        const limits = ['storage-0013.sql','storage-0014.sql'].map(file=>path.join(e.evidence,file));
        const limitProvenance = {nonce:state.nonce,files:limits.map(file=>({file:path.basename(file),sha256:hash(file)}))};
        const limitRecord=path.join(e.evidence,'bucket-limit-provenance.json');
        if(fs.existsSync(limitRecord)) {
            if(JSON.stringify(JSON.parse(fs.readFileSync(limitRecord,'utf8')))!==JSON.stringify(limitProvenance))throw new Error('Bucket bootstrap drift');
        } else fs.writeFileSync(limitRecord,JSON.stringify(limitProvenance,null,2),{flag:'wx'});
        const hasLimits=(await admin.query(`SELECT count(*)::int=2 AS ready FROM information_schema.columns
            WHERE table_schema='storage' AND table_name='buckets' AND column_name IN ('file_size_limit','allowed_mime_types')`)).rows[0].ready;
        if(!hasLimits) {
            if((await admin.query('SELECT count(*)::int n FROM storage.buckets')).rows[0].n!==0)throw new Error('Fresh bucket prerequisites required');
            await admin.query('BEGIN');
            for(const file of limits)await admin.query(fs.readFileSync(file,'utf8'));
            await admin.query('COMMIT');
        }
        await admin.end(); admin = null;
        stage = 'unchanged canonical migrations on new target';
        const migrations = path.join(workdir, 'supabase/migrations'); fs.mkdirSync(migrations, { recursive: true });
        const config = path.join(workdir, 'supabase/config.toml');
        const expectedConfig = `project_id = "${state.project}"\n[db]\nport = 59322\nmajor_version = 17\n`;
        if (fs.existsSync(path.join(workdir, 'supabase/.temp/project-ref'))) throw new Error('Linked target refused');
        if (fs.existsSync(config) && fs.readFileSync(config, 'utf8') !== expectedConfig) throw new Error('Config mismatch');
        fs.writeFileSync(config, expectedConfig);
        for (const entry of manifest.files) {
            const destination = path.join(migrations, entry.name);
            if (fs.existsSync(destination) && hash(destination) !== entry.sha256) throw new Error('Migration drift');
            fs.copyFileSync(path.join(e.root, 'supabase/migrations', entry.name), destination);
        }
        if (fs.readdirSync(migrations).filter(file => file.endsWith('.sql')).length !== 2) throw new Error('Unexpected migrations');
        const url = `postgresql://postgres:${state.password}@127.0.0.1:59322/postgres?sslmode=disable`;
        try {
            const output = execFileSync(cli, ['migration', 'up', '--db-url', url, '--workdir', workdir],
                { env: cliEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 });
            fs.writeFileSync(path.join(e.evidence, 'migration.private.log'), output);
        } catch (error) {
            fs.writeFileSync(path.join(e.evidence, 'migration.private.log'), String(error.stdout || '') + String(error.stderr || ''));
            throw new Error('Migration failed');
        }
        client = new Client(e.database(state)); await client.connect();
        const versions = (await client.query('SELECT version FROM supabase_migrations.schema_migrations ORDER BY version')).rows.map(row => row.version);
        if (JSON.stringify(versions) !== JSON.stringify(manifest.files.map(file => file.version))) throw new Error('Ledger mismatch');
        await client.query("UPDATE phase7_acceptance_guard.environment SET stage='baseline' WHERE id=$1 AND nonce=$2", [state.project, state.nonce]);
        stage = 'reviewed committed-disposable patch';
        await client.query('BEGIN');
        await client.query("SELECT set_config('thirasara.phase7_acceptance','committed-disposable',true),set_config('thirasara.phase7_nonce',$1,true)", [state.nonce]);
        await client.query(fs.readFileSync(target, 'utf8'));
        await require('./catalog.cjs').verifyCatalog(client);
        await client.query("UPDATE phase7_acceptance_guard.environment SET stage='ready',patch_sha=$1 WHERE id=$2 AND nonce=$3", [provenance.target, state.project, state.nonce]);
        await client.query("NOTIFY pgrst,'reload schema'"); await client.query('COMMIT');
        e.validateIdentity((await client.query(e.identitySql)).rows[0], state);
        console.log('PASS: canonical two-entry ledger and committed Phase7 test-target patch on new synthetic-only database.');
    } catch (error) {
        fs.writeFileSync(path.join(e.evidence,'initialization.private.log'),String(error.stack||error));
        console.error(`FAIL: Phase7 initialization at ${stage}; sensitive details in private evidence only.`); process.exitCode = 1;
    } finally {
        if (client) { await client.query('ROLLBACK').catch(() => {}); await client.end().catch(() => { process.exitCode = 1; }); }
        if (admin) { await admin.query('ROLLBACK').catch(() => {}); await admin.end().catch(() => { process.exitCode = 1; }); }
    }
}
void main();
