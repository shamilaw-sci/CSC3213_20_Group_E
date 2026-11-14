// Verify the approved fresh environment, stop only its pair, preserve all volumes/networks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { Client } = require('pg');
const e = require('./environment.cjs');
const { snapshot } = require('./state.cjs');
const { verifyCatalog } = require('./catalog.cjs');
const lines=value=>value.trim().split(/\r?\n/).filter(Boolean).sort();
const fileHash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function verifyRetained(state) {
    const names=new Set([e.constants.dbName,e.constants.restName]);
    assert.deepEqual(lines(e.docker(['container','ls','-a','--format','{{.Names}}|{{.State}}|{{.ID}}']))
        .filter(line=>!names.has(line.split('|')[0])),[...state.retained.containers].sort());
    assert.deepEqual(lines(e.docker(['volume','ls','--format','{{.Name}}'])).filter(name=>name!==state.volume),[...state.retained.volumes].sort());
    assert.deepEqual(lines(e.docker(['network','ls','--format','{{.Name}}'])).filter(name=>!
        [e.constants.network,'thirasara-phase7-acceptance-local'].includes(name)),[...state.retained.networks].sort());
    const unused=JSON.parse(e.docker(['network','inspect','thirasara-phase7-acceptance-local']))[0];
    assert.equal(unused.Internal,true);assert.equal(unused.Labels['thirasara.phase7.nonce'],state.nonce);
    assert.equal(Object.keys(unused.Containers||{}).length,0);
}
async function main() {
    let stage='exact new target identity',client;
    try {
        if(process.argv.length!==2)throw new Error('No arguments accepted');
        const state=e.inspect();client=new Client(e.database(state));await client.connect();
        await client.query('BEGIN READ ONLY');
        const target=path.join(__dirname,'target.sql');await e.verifyReady(client,state,fileHash(target));await verifyCatalog(client);
        const saved=await snapshot(client);
        assert.ok(Object.values(saved.data).every(rows=>Array.isArray(rows)&&rows.length===0),'Synthetic cleanup incomplete');
        stage='retained resource preservation';verifyRetained(state);
        const files=['supabase/migrations/20261030045356_phase4_isolated_prerequisites.sql',
            'supabase/migrations/20261030045416_phase4_current_schema_baseline.sql',
            'docs/database/phase7-application-grants.candidate.sql','docs/database/phase7-appointment-owner.candidate.sql',
            'backend-node/integration/phase7/target.sql'];
        const receipt={nonce:state.nonce,applicationRows:0,applicationTables:19,
            catalogSha256:createHash('sha256').update(JSON.stringify(saved.catalog)).digest('hex'),
            files:files.map(file=>({file,sha256:fileHash(path.join(e.root,file))})),
            rollbackCandidatesApplied:false,testTargetPatchCommitted:true,retainedResourceIdentityStatePreserved:true};
        await client.query('ROLLBACK');await client.end();client=null;
        stage='stop only verified new pair';e.docker(['stop',e.constants.restName]);e.docker(['stop',e.constants.dbName]);
        const stopped=JSON.parse(e.docker(['inspect',e.constants.dbName,e.constants.restName]));
        e.validateStoppedItem(stopped[0],state,'db');e.validateStoppedItem(stopped[1],state,'rest');
        verifyRetained(state);
        fs.writeFileSync(path.join(e.evidence,'completion-receipt.json'),JSON.stringify({...receipt,newPairStopped:true},null,2));
        console.log('PASS: all19 application tables empty; catalog/ledger verified; retained resource identities/states preserved; new pair stopped; volume/two networks retained.');
    } catch {
        console.error(`FAIL: Phase7 finish at ${stage}; sensitive details suppressed.`);process.exitCode=1;
    } finally {if(client){await client.query('ROLLBACK').catch(()=>{});await client.end().catch(()=>{process.exitCode=1;});}}
}
void main();
