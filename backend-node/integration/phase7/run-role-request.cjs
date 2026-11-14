// Owner-approved, fresh-target-only temporary schema acceptance. No live configuration loaded.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { createHash, randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const e = require('./environment.cjs');
const g = require('./role-request-guards.cjs');
const { snapshot } = require('./state.cjs');
const { verifyCatalog } = require('./catalog.cjs');
const network = require('./network.cjs');
const hash = value => createHash('sha256').update(value).digest('hex');
const fileHash = file => hash(fs.readFileSync(file));
const lines = value => value.trim().split(/\r?\n/).filter(Boolean).sort();
const lockPath = path.join(e.evidence,'role-request.lock');
const helperBody = "BEGIN RAISE EXCEPTION USING ERRCODE='P7099', MESSAGE='Synthetic role request status failure'; END;";
function retained(state) {
    const excluded = new Set([e.constants.dbName,e.constants.restName]);
    assert.deepEqual(lines(e.docker(['container','ls','-a','--format','{{.Names}}|{{.State}}|{{.ID}}']))
        .filter(v=>!excluded.has(v.split('|')[0])),[...state.retained.containers].sort());
    assert.deepEqual(lines(e.docker(['volume','ls','--format','{{.Name}}'])).filter(n=>n!==state.volume),[...state.retained.volumes].sort());
    assert.deepEqual(lines(e.docker(['network','ls','--format','{{.Name}}'])).filter(n=>
        ![e.constants.network,'thirasara-phase7-acceptance-local'].includes(n)),[...state.retained.networks].sort());
    const unused=JSON.parse(e.docker(['network','inspect','thirasara-phase7-acceptance-local']))[0];
    assert.equal(unused.Internal,true);assert.equal(unused.Labels['thirasara.phase7.nonce'],state.nonce);
    assert.equal(Object.keys(unused.Containers||{}).length,0);
}
function fixtures(nonce) {
    const m={run:randomUUID(),nonce,users:[],requests:[],cases:{},absent:randomUUID()};
    const add=(name,role='BUYER',requested='SELLER')=>{
        const user={id:randomUUID(),email:`${m.run}-${name}@example.test`,role};
        const request={id:randomUUID(),user_id:user.id,requested_role:requested,status:'pending'};
        m.users.push(user);m.requests.push(request);m.cases[name]={user:user.id,request:request.id};
    };
    for(const name of ['direct','http','auth-denial','failure','history','ban-first','approve-first','compete-reject','compete-approve'])add(name);
    add('reject-invalid','BUYER','ADMIN');add('invalid-role','BUYER','ADMIN');
    for(const role of ['BANNED','ADMIN','AGENT','SELLER','PENDING_AGENT','REJECTED_AGENT'])add(`ineligible-${role}`,role);
    add('admin','ADMIN');add('buyer');add('banned-actor','BANNED');
    m.history=randomUUID();m.requests.push({id:m.history,user_id:m.cases.history.user,requested_role:'SELLER',status:'approved'});
    g.validateFixtures(m);return m;
}
async function insertFixtures(db,m) {
    g.validateFixtures(m);
    for(const user of m.users)await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,NULL,$4)',
        [user.id,'Synthetic Phase7 role-request user',user.email,user.role]);
    for(const r of m.requests)await db.query('INSERT INTO public.role_requests(id,user_id,requested_role,status) VALUES($1,$2,$3,$4)',
        [r.id,r.user_id,r.requested_role,r.status]);
}
async function triggerSnapshot(db) {
    return (await db.query(`SELECT to_jsonb(t) AS metadata FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
        JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY t.oid`)).rows;
}
async function verifyFunction(db,candidate,withTrigger=false,failureId) {
    const objects=await g.readObjects(db);
    assert.equal(objects.functions.length,withTrigger?2:1);assert.equal(objects.triggers.length,withTrigger?1:0);
    const main=objects.functions.find(f=>f.name==='resolve_seller_role_request');
    const body=candidate.match(/AS \$function\$\s*([\s\S]*?)\s*\$function\$;/)[1];
    assert.equal(main.owner,'postgres');assert.equal(main.securityDefiner,false);
    assert.equal(g.normalize(main.source),g.normalize(body));
    assert.deepEqual(main.config.map(v=>v.replaceAll('"','')),['search_path=']);
    assert.equal(main.anon,false);assert.equal(main.authenticated,false);assert.equal(main.public,false);assert.equal(main.service,true);
    if(withTrigger){
        const helper=objects.functions.find(f=>f.name==='phase7_role_request_fail');
        assert.equal(helper.owner,'postgres');assert.equal(helper.securityDefiner,false);assert.equal(helper.source,helperBody);
        assert.deepEqual(helper.config.map(v=>v.replaceAll('"','')),['search_path=']);
        for(const flag of ['anon','authenticated','public','service'])assert.equal(helper[flag],false);
        assert.ok(g.uuid.test(failureId));
        const trigger=objects.triggers[0];
        assert.ok(trigger.definition.includes(failureId) && trigger.definition.includes('phase7_role_request_fail()'));
        g.assertTriggerFunction(trigger,helper);
    }
    return objects;
}
async function verifyFixtures(db,m) {
    g.validateFixtures(m);
    const actualUsers=(await db.query('SELECT id,email FROM public.users WHERE id=ANY($1::uuid[]) ORDER BY id',[m.users.map(u=>u.id)])).rows;
    assert.deepEqual(actualUsers,m.users.map(({id,email})=>({id,email})).sort((a,b)=>a.id.localeCompare(b.id)));
    const actualRequests=(await db.query('SELECT id,user_id,requested_role FROM public.role_requests WHERE id=ANY($1::uuid[]) ORDER BY id',[m.requests.map(r=>r.id)])).rows;
    assert.deepEqual(actualRequests,m.requests.map(({id,user_id,requested_role})=>({id,user_id,requested_role})).sort((a,b)=>a.id.localeCompare(b.id)));
    // No unrelated child rows may be removed through users' ON DELETE CASCADE.
    const all=await snapshot(db);
    for(const [table,rows] of Object.entries(all.data))if(!['users','role_requests'].includes(table))assert.equal(rows.length,0);
    assert.equal(all.data.users.length,m.users.length);assert.equal(all.data.role_requests.length,m.requests.length);
}
async function rollbackCases(db,candidate,m) {
    await db.query('BEGIN');
    try {
        await db.query("SET LOCAL thirasara.phase7_role_request_test='rollback-only'");
        await db.query(candidate);await verifyFunction(db,candidate);await insertFixtures(db,m);
        await db.query('SET LOCAL ROLE service_role');
        const c=m.cases.http;
        assert.deepEqual((await db.query('SELECT * FROM public.resolve_seller_role_request($1,$2)',[c.request,'approved'])).rows,
            [{request_id:c.request,decision:'approved',user_id:c.user}]);
        await db.query('SAVEPOINT expected_rejection');
        let code;try{await db.query('SELECT * FROM public.resolve_seller_role_request($1,$2)',[m.cases['ineligible-BANNED'].request,'approved']);}
        catch(err){code=err.code;}finally{await db.query('ROLLBACK TO SAVEPOINT expected_rejection');}
        assert.equal(code,'P7004');
    } finally {await db.query('ROLLBACK');}
}
async function main() {
    let stage='approval launcher',client,state,initial,triggers,objects,committed=false,locked=false,receiptFile;
    const started=[];const run= randomUUID();
    let receipt;
    const save=()=>fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2));
    try {
        assert.equal(process.argv.length,2);
        fs.writeFileSync(lockPath,run,{flag:'wx'});locked=true;
        state=e.loadState();retained(state);
        const candidatePath=path.join(e.root,'docs/database/phase7-role-request-transaction.candidate.sql');
        const supplementPath=path.join(__dirname,'role-request-supplement.sql');
        const candidate=fs.readFileSync(candidatePath,'utf8').replace(/\r\n/g,'\n');
        const supplement=fs.readFileSync(supplementPath,'utf8').replace(/\r\n/g,'\n');g.validateSources(candidate,supplement);
        stage='full stopped pair/network/volume identity';
        const stopped=JSON.parse(e.docker(['inspect',e.constants.dbName,e.constants.restName]));
        e.validateStoppedItem(stopped[0],state,'db');e.validateStoppedItem(stopped[1],state,'rest');
        e.validateNetwork(JSON.parse(e.docker(['network','inspect',e.constants.network]))[0],state);
        const volume=JSON.parse(e.docker(['volume','inspect',state.volume]))[0];
        assert.equal(volume.Driver,'local');assert.equal(volume.Labels['thirasara.phase7.nonce'],state.nonce);assert.equal(Object.keys(volume.Options||{}).length,0);
        for(const item of stopped){e.docker(['start',item.Id]);started.push(item.Id);}
        e.inspect(state);
        const originalConnect=net.Socket.prototype.connect;
        net.Socket.prototype.connect=function(...args){if(!network.allowSocket(args))throw new Error('Role-request outbound socket refused');return originalConnect.apply(this,args);};
        stage='bounded read-only PostgreSQL readiness';
        for(let attempt=0;attempt<20;attempt++){
            const probe=new Client({...e.database(state),statement_timeout:10000});
            try {await probe.connect();client=probe;break;}
            catch {await probe.end().catch(()=>{});await new Promise(resolve=>setTimeout(resolve,500));}
        }
        assert.ok(client,'Fresh PostgreSQL did not become ready');
        const targetHash=fileHash(path.join(__dirname,'target.sql'));
        stage='unchanged ready/provenance/original completion/catalog';
        await e.verifyReady(client,state,targetHash);await verifyCatalog(client);
        initial=await snapshot(client);triggers=await triggerSnapshot(client);
        assert.ok(Object.values(initial.data).every(rows=>rows.length===0));
        assert.deepEqual(await g.readObjects(client),{functions:[],triggers:[]});
        const completionPath=path.join(e.evidence,'completion-receipt.json'),provenancePath=path.join(e.evidence,'provenance.json');
        const originalHashes={[completionPath]:fileHash(completionPath),[provenancePath]:fileHash(provenancePath)};
        const completion=JSON.parse(fs.readFileSync(completionPath,'utf8'));
        assert.equal(completion.nonce,state.nonce);assert.equal(completion.catalogSha256,hash(JSON.stringify(initial.catalog)));
        for(const item of completion.files)assert.equal(fileHash(path.join(e.root,item.file)),item.sha256);
        const provenance=JSON.parse(fs.readFileSync(provenancePath,'utf8'));
        assert.equal(provenance.nonce,state.nonce);assert.equal(provenance.target,targetHash);
        for(const item of provenance.baseline)assert.equal(fileHash(path.join(e.root,'supabase/migrations',item.name)),item.sha256);
        const m=fixtures(state.nonce);
        receiptFile=path.join(e.evidence,`role-request-${run}.private.json`);
        receipt={run,nonce:state.nonce,status:'preflight',fixtures:m,baseline:initial,baselineTriggers:triggers,
            candidateSha256:fileHash(candidatePath),supplementSha256:fileHash(supplementPath),originalHashes};
        fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2),{flag:'wx'});
        stage='exact rollback candidate SQL and restoration';
        await rollbackCases(client,candidate,m);
        assert.deepEqual(await snapshot(client),initial);assert.deepEqual(await triggerSnapshot(client),triggers);
        receipt.rollbackCandidateRestored=true;save();
        console.log('PASS: exact rollback-only candidate compiled; service approval/banned rejection; all19 snapshots/catalog/ledger restored.');
        stage='separately receipted temporary supplement/fixtures/trigger';
        await client.query('BEGIN');
        try {
            await client.query("SET LOCAL thirasara.phase7_role_request_test='temporary-committed-amendment'");
            await client.query("SELECT set_config('thirasara.phase7_nonce',$1,true)",[state.nonce]);
            await client.query(supplement);
            const failureId=m.cases.failure.request;assert.ok(g.uuid.test(failureId));
            await client.query(`CREATE FUNCTION public.phase7_role_request_fail() RETURNS trigger LANGUAGE plpgsql
                SECURITY INVOKER SET search_path='' AS $failure$${helperBody}$failure$;
                REVOKE ALL ON FUNCTION public.phase7_role_request_fail() FROM PUBLIC,anon,authenticated,service_role;
                CREATE TRIGGER phase7_role_request_failure BEFORE UPDATE ON public.role_requests
                FOR EACH ROW WHEN (NEW.id='${failureId}'::uuid) EXECUTE FUNCTION public.phase7_role_request_fail();`);
            await insertFixtures(client,m);objects=await verifyFunction(client,candidate,true,failureId);
            receipt.objects=objects;receipt.status='prepared-before-commit';save();
            await client.query('COMMIT');committed=true;receipt.status='temporary-committed';save();
        } catch(err){await client.query('ROLLBACK');throw err;}
        await client.query("NOTIFY pgrst,'reload schema'");
        // Service-role OpenAPI discovery confirms the exact POST endpoint without invoking it.
        stage='bounded nonmutating PostgREST schema readiness';
        const serviceKey=jwt.sign({role:'service_role',iss:'supabase'},state.jwtSecret,{expiresIn:'15m'});
        let apiReady=false;
        receipt.apiReadiness=[];
        for(let attempt=0;attempt<20;attempt++){
            try {
                const response=await fetch('http://127.0.0.1:59321/',{
                    method:'GET',headers:{Authorization:`Bearer ${serviceKey}`,Accept:'application/openapi+json'},redirect:'error',signal:AbortSignal.timeout(3000)});
                const body=await response.text();
                const discovered=response.ok && g.apiSchemaReady(JSON.parse(body));
                receipt.apiReadiness.push({status:response.status,discovered,body:discovered?null:body.slice(0,1000)});save();
                if(discovered){apiReady=true;break;}
            }catch(err){receipt.apiReadiness.push({error:String(err.stack||err)});save();}
            await new Promise(resolve=>setTimeout(resolve,100));
        }
        assert.ok(apiReady,'Temporary function schema cache did not become ready');
        e.inspect(state);await e.verifyReady(client,state,targetHash);
        stage='guarded real HTTP/SQL/lock assertions';
        const env=Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP','COMSPEC','PATHEXT'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
        Object.assign(env,{NODE_ENV:'test',NODE_OPTIONS:'--max-old-space-size=512 --max-semi-space-size=4',JWT_SECRET:'phase7-isolated-auth-tests-only',
            SUPABASE_URL:'http://127.0.0.1:59321',SUPABASE_KEY:serviceKey,
            PHASE7_LOCAL_APPROVED:state.nonce,PHASE5_DATABASE:JSON.stringify(e.database(state)),PHASE7_INFRA_SECRET:state.jwtSecret,
            CLIENT_URL:'http://localhost:5173',PHASE7_ROLE_REQUEST_RECEIPT:receiptFile});
        const config={rootDir:path.resolve(__dirname,'../..'),testMatch:['<rootDir>/integration/phase7/role-request.integration.cjs'],
            setupFiles:['<rootDir>/integration/phase7/setup.cjs'],testTimeout:15000,verbose:false};
        const result=spawnSync(process.execPath,[require.resolve('jest/bin/jest'),'--config',JSON.stringify(config),'--runInBand','--no-cache','--silent'],
            {cwd:path.resolve(__dirname,'../..'),env,encoding:'utf8',timeout:180000});
        const log=String(result.stdout||'')+String(result.stderr||'');
        fs.writeFileSync(path.join(e.evidence,`role-request-${run}.private.log`),log);
        receipt.assertionsExitCode=result.status;receipt.assertionsSummary=log.match(/Tests:\s+[^\r\n]+/)?.[0]||null;save();
        if(receipt.assertionsSummary)console.log(receipt.assertionsSummary);
        assert.equal(result.status,0,'See private role-request assertion log');
        receipt.assertionsPassed=true;save();
    } catch(err) {
        fs.writeFileSync(path.join(e.evidence,`role-request-${run}.launcher.private.log`),String(err.stack||err));
        if(receipt){receipt.failureStage=stage;receipt.privateError=String(err.stack||err);save();}
        console.error(`FAIL: role-request acceptance at ${stage}; details retained privately, credentials suppressed.`);process.exitCode=1;
    } finally {
        if(client){
            try {
                await client.query('ROLLBACK');
                if(committed){
                    stage='checked fixture/object removal';
                    e.inspect(state);await e.verifyReady(client,state,fileHash(path.join(__dirname,'target.sql')));
                    await client.query('BEGIN');
                    try {
                        // Block new resolution/fixture writes while ownership is checked and removed.
                        await client.query('LOCK TABLE public.role_requests,public.users IN ACCESS EXCLUSIVE MODE');
                        g.assertOwned(await g.readObjects(client),objects);
                        await verifyFixtures(client,receipt.fixtures);
                        await client.query('DROP TRIGGER phase7_role_request_failure ON public.role_requests');
                        await client.query('DROP FUNCTION public.phase7_role_request_fail()');
                        await client.query('DELETE FROM public.role_requests WHERE id=ANY($1::uuid[])',[receipt.fixtures.requests.map(r=>r.id)]);
                        for(const u of receipt.fixtures.users)await client.query('DELETE FROM public.users WHERE id=$1 AND email=$2',[u.id,u.email]);
                        await client.query('DROP FUNCTION public.resolve_seller_role_request(uuid,text)');
                        await client.query('COMMIT');committed=false;
                    }catch(err){await client.query('ROLLBACK');throw err;}
                }
                if(initial){
                    assert.deepEqual(await snapshot(client),initial);assert.deepEqual(await triggerSnapshot(client),triggers);
                    await verifyCatalog(client);retained(state);
                    if(receipt){
                        for(const [file,expected] of Object.entries(receipt.originalHashes))assert.equal(fileHash(file),expected);
                        receipt.restored=true;receipt.status='restored';save();
                    }
                    console.log('PASS: exact temporary fixtures/function/trigger removed; all19 snapshots/catalog/ledger/triggers and original receipts restored.');
                }
            }catch(err){if(receipt){receipt.cleanupError=String(err.stack||err);save();}console.error(`FAIL: role-request preservation at ${stage}; receipt-owned objects require private inspection.`);process.exitCode=1;}
            await client.end().catch(()=>{process.exitCode=1;});
        }
        try {
            for(const id of started.reverse()){
                const item=JSON.parse(e.docker(['inspect',id]))[0];
                assert.equal(item.Id,id);assert.equal(item.Config.Labels['thirasara.phase7.nonce'],state.nonce);
                e.docker(['stop',id]);
            }
            if(started.length){
                const pair=JSON.parse(e.docker(['inspect',e.constants.dbName,e.constants.restName]));
                e.validateStoppedItem(pair[0],state,'db');e.validateStoppedItem(pair[1],state,'rest');retained(state);
                if(receipt){receipt.newPairStopped=true;save();}
                console.log('PASS: only fresh test pair stopped; retained resources, volume and both networks preserved.');
            }
        }catch{console.error('FAIL: exact fresh pair stop/retained verification; manual identity inspection required.');process.exitCode=1;}
        if(locked){assert.equal(fs.readFileSync(lockPath,'utf8'),run);fs.unlinkSync(lockPath);}
    }
}
if(require.main===module)void main();
