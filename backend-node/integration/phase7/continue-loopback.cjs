// Owner-approved network amendment after internal-only Docker bridge suppressed host publishing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const e = require('./environment.cjs');
const c = e.constants;
async function main() {
    let stage = 'exact previously created DB identity', state;
    const started = [];
    try {
        if (process.argv.length !== 2) throw new Error('No arguments');
        state = e.loadState();
        let db = JSON.parse(e.docker(['inspect',c.dbName]))[0];
        assert.equal(db.Name,`/${c.dbName}`); assert.equal(db.Image,state.dbImageId);
        assert.equal(db.Config.Labels['thirasara.phase7.nonce'],state.nonce);
        assert.equal(db.Config.Labels['com.supabase.cli.project'],c.project);
        assert.equal(db.Config.Image,c.dbImage); assert.equal(db.HostConfig.Privileged,false);
        assert.equal(db.Mounts.length,1); assert.equal(db.Mounts[0].Type,'volume');
        assert.equal(db.Mounts[0].Name,state.volume); assert.equal(db.Mounts[0].Destination,'/var/lib/postgresql/data');
        assert.deepEqual(db.HostConfig.PortBindings,{'5432/tcp':[{HostIp:'127.0.0.1',HostPort:'59322'}]});
        const oldName = 'thirasara-phase7-acceptance-local';
        const current = Object.keys(db.NetworkSettings.Networks);
        assert.ok(current.length===1 && [oldName,c.network].includes(current[0]));
        stage = 'approved separate loopback bridge';
        const networks = e.docker(['network','ls','--format','{{.Name}}']).trim().split(/\r?\n/);
        const labels = ['--label',`com.supabase.cli.project=${c.project}`,'--label',`thirasara.phase7.nonce=${state.nonce}`];
        if (!networks.includes(c.network)) e.docker(['network','create','--driver','bridge','--opt',
            'com.docker.network.bridge.host_binding_ipv4=127.0.0.1',...labels,c.network]);
        const network = JSON.parse(e.docker(['network','inspect',c.network]))[0]; e.validateNetwork(network,state);
        assert.ok(Object.values(network.Containers||{}).every(item=>[c.dbName,c.restName].includes(item.Name)));
        if (current[0]===oldName) {
            const old = JSON.parse(e.docker(['network','inspect',oldName]))[0];
            assert.equal(old.Internal,true); assert.equal(old.Labels['thirasara.phase7.nonce'],state.nonce);
            assert.equal(db.State.Running,false);
            e.docker(['network','connect',c.network,c.dbName]); e.docker(['network','disconnect',oldName,c.dbName]);
        }
        stage = 'actual loopback publication and bootstrap';
        db=JSON.parse(e.docker(['inspect',c.dbName]))[0];
        if(db.State.Running) e.validateItem(db,state,'db'); else e.validateStoppedItem(db,state,'db');
        e.docker(['start',c.dbName]); started.push(c.dbName);
        e.validateItem(JSON.parse(e.docker(['inspect',c.dbName]))[0],state,'db');
        let ready=false;
        for(let attempt=0;attempt<20;attempt++) {
            const client = new Client(e.database(state,'supabase_admin'));
            try { await client.connect();
                const row=(await client.query("SELECT current_user AS role,to_regprocedure('auth.uid()') IS NOT NULL AS ready")).rows[0];
                if(row.role==='supabase_admin'&&row.ready) { await client.query(`ALTER ROLE authenticator PASSWORD '${state.password}'`); ready=true; }
            } catch { /* Retain private configuration, suppress driver errors. */ }
            finally { await client.end().catch(()=>{}); }
            if(ready) break; await new Promise(resolve=>setTimeout(resolve,1000));
        }
        assert.ok(ready);
        stage='new REST pair';
        const names=e.docker(['container','ls','-a','--format','{{.Names}}']).trim().split(/\r?\n/);
        if(!names.includes(c.restName)) e.docker(['create','--pull=never','--name',c.restName,'--network',c.network,...labels,
            '--publish','127.0.0.1:59321:3000','--env','PGRST_DB_SCHEMAS=public','--env','PGRST_DB_EXTRA_SEARCH_PATH=public,extensions',
            '--env','PGRST_DB_ANON_ROLE=anon','--env',`PGRST_JWT_SECRET=${state.jwtSecret}`,
            '--env',`PGRST_DB_URI=postgresql://authenticator:${state.password}@${c.dbName}:5432/postgres`,c.restImage]);
        else {
            const rest=JSON.parse(e.docker(['inspect',c.restName]))[0];
            if(rest.State.Running) e.validateItem(rest,state,'rest'); else e.validateStoppedItem(rest,state,'rest');
        }
        e.docker(['start',c.restName]); started.push(c.restName); e.inspect(state);
        fs.writeFileSync(path.join(e.evidence,'network-amendment.json'),JSON.stringify({nonce:state.nonce,
            approvedNetwork:c.network,preservedUnusedNetwork:oldName,containerEgressBlocked:false},null,2));
        console.log('PASS: approved separate bridge; actual DB/REST loopback publications/identities verified; unused internal network preserved.');
    } catch (error) {
        fs.writeFileSync(path.join(e.evidence,'loopback-continuation.private.log'),String(error.stack||error));
        console.error(`FAIL: Phase7 loopback continuation at ${stage}; credentials suppressed.`); process.exitCode=1;
        for(const name of started.reverse()) { try { e.docker(['stop',name]); } catch { console.error('New Phase7 container stop needs exact-identity inspection.'); } }
    }
}
void main();
