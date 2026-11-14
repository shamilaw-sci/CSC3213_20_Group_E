const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const e = require('./environment.cjs');
const guards = require('./role-request-guards.cjs');
const { allowedAppPorts } = require('./network.cjs');
const { issueSessionToken } = require('../../utils/sessionToken');
const app = require('../../server');
const receiptPath = process.env.PHASE7_ROLE_REQUEST_RECEIPT;
assert.equal(path.dirname(receiptPath),e.evidence);
assert.match(path.basename(receiptPath),/^role-request-[0-9a-f-]+\.private\.json$/);
const receipt = JSON.parse(fs.readFileSync(receiptPath,'utf8'));
const m = receipt.fixtures; guards.validateFixtures(m); assert.equal(m.nonce,e.loadState().nonce);
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
const byName = name => m.cases[name];
const token = name => issueSessionToken({ ...m.users.find(u=>u.id===byName(name).user), password_hash:null });
let server, connected=false;
const call = (caseName,decision='approve',actor='admin') => {
    const result=request(server).patch(`/api/admin/role-requests/${byName(caseName)?.request || caseName}/${decision}`)
        .set('Origin','http://localhost:5173');
    return actor ? result.set('Authorization',`Bearer ${token(actor)}`) : result;
};
async function current(name) {
    return (await db.query(`SELECT u.role,r.status FROM public.role_requests r JOIN public.users u ON u.id=r.user_id
        WHERE r.id=$1`,[byName(name).request])).rows[0];
}
async function rest(role,id,decision) {
    const key=jwt.sign({role,iss:'supabase',...(role==='authenticated'?{sub:byName('buyer').user}:{})},process.env.PHASE7_INFRA_SECRET,{expiresIn:'5m'});
    const res=await fetch('http://127.0.0.1:59321/rest/v1/rpc/resolve_seller_role_request',{
        method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
        body:JSON.stringify({p_request_id:id,p_decision:decision})});
    return {status:res.status,body:await res.json()};
}
beforeAll(async()=>{
    await db.connect();connected=true;
    e.validateIdentity((await db.query(e.identitySql)).rows[0],e.loadState());
    guards.assertOwned(await guards.readObjects(db),receipt.objects);
    server=await new Promise((resolve,reject)=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));listener.once('error',reject);});
    allowedAppPorts.add(server.address().port);
},20000);
afterAll(async()=>{
    if(server){const port=server.address().port;await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));allowedAppPorts.delete(port);}
    if(connected)await db.end();
});

test.each(['anon','authenticated'])('direct REST %s cannot execute function',async role=>{
    const res=await rest(role,byName('direct').request,'approved');
    expect([401,403]).toContain(res.status);expect(res.body.code).toBe('42501');
    expect(await current('direct')).toEqual({role:'BUYER',status:'pending'});
});
test('direct service-role RPC succeeds with confirmed identifiers',async()=>{
    const c=byName('direct'),res=await rest('service_role',c.request,'approved');
    expect(res.status).toBe(200);expect(res.body).toEqual([{request_id:c.request,decision:'approved',user_id:c.user}]);
    expect(await current('direct')).toEqual({role:'SELLER',status:'approved'});
});
test('actual Admin route approves BUYER and ignores spoofed body',async()=>{
    const res=await call('http').send({role:'ADMIN',user_id:byName('buyer').user,decision:'rejected'});
    expect(res.status).toBe(200);expect(res.body.message).toBe('User upgraded to SELLER successfully');
    expect(await current('http')).toEqual({role:'SELLER',status:'approved'});
});
test('actual Admin route rejects without changing role, including unsupported request',async()=>{
    const res=await call('reject-invalid','reject').send({role:'ADMIN'});
    expect(res.status).toBe(200);expect(await current('reject-invalid')).toEqual({role:'BUYER',status:'rejected'});
});
test.each([['anonymous',null,401],['non-Admin','buyer',403],['banned actor','banned-actor',403]])('%s HTTP caller cannot resolve request',async(_label,actor,status)=>{
    expect((await call('auth-denial','approve',actor).send({})).status).toBe(status);
    expect(await current('auth-denial')).toEqual({role:'BUYER',status:'pending'});
});
test.each(['BANNED','ADMIN','AGENT','SELLER','PENDING_AGENT','REJECTED_AGENT'])('%s target remains ineligible',async role=>{
    expect((await call(`ineligible-${role}`).send({})).status).toBe(409);
    expect(await current(`ineligible-${role}`)).toEqual({role,status:'pending'});
});
test('unsupported stored ADMIN request is not promoted',async()=>{
    expect((await call('invalid-role').send({})).status).toBe(409);
    expect(await current('invalid-role')).toEqual({role:'BUYER',status:'pending'});
});
test('absent request returns404; malformed UUID returns400',async()=>{
    expect((await call(m.absent).send({})).status).toBe(404);
    expect((await call('invalid-uuid').send({})).status).toBe(400);
});
test('resolved request retains400 and does not change role',async()=>{
    expect((await call('http').send({})).status).toBe(400);
    expect(await current('http')).toEqual({role:'SELLER',status:'approved'});
});
test('forced second-write failure rolls back first user write through real HTTP',async()=>{
    const res=await call('failure').send({});
    expect(res.status).toBe(500);expect(JSON.stringify(res.body)).not.toContain('Synthetic role request status failure');
    expect(await current('failure')).toEqual({role:'BUYER',status:'pending'});
});
test('historical status uniqueness failure rolls back user promotion',async()=>{
    expect((await call('history').send({})).status).toBe(409);
    expect(await current('history')).toEqual({role:'BUYER',status:'pending'});
    expect((await db.query('SELECT status FROM public.role_requests WHERE id=$1',[m.history])).rows[0].status).toBe('approved');
});

async function withPair(fn) {
    const a=new Client(JSON.parse(process.env.PHASE5_DATABASE)),b=new Client(JSON.parse(process.env.PHASE5_DATABASE));
    await a.connect();await b.connect();
    try {await a.query("SET statement_timeout='8s'");await b.query("SET statement_timeout='8s'");await fn(a,b);}
    finally {await a.query('ROLLBACK').catch(()=>{});await b.query('ROLLBACK').catch(()=>{});await a.end();await b.end();}
}
async function waitBlocked(waiter,blocker) {
    const until=Date.now()+5000;
    while(Date.now()<until){
        const blocked=(await db.query('SELECT $2::int=ANY(pg_blocking_pids($1::int)) blocked',[waiter,blocker])).rows[0].blocked;
        if(blocked)return;
        await new Promise(resolve=>setTimeout(resolve,25));
    }
    throw new Error('Expected database lock relationship not observed');
}
async function pids(a,b){return [(await a.query('SELECT pg_backend_pid() id')).rows[0].id,(await b.query('SELECT pg_backend_pid() id')).rows[0].id];}
const resolve=(client,c,decision='approved')=>client.query('SELECT * FROM public.resolve_seller_role_request($1,$2)',[c.request,decision]);
// Attach rejection handlers immediately while the query waits; no unhandled race.
const outcome=promise=>promise.then(result=>({result}),error=>({code:error.code}));
test('ban obtains user lock first: later approval cannot restore SELLER',async()=>withPair(async(a,b)=>{
    const c=byName('ban-first'),[ap,bp]=await pids(a,b);
    await a.query('BEGIN');await a.query("UPDATE public.users SET role='BANNED' WHERE id=$1",[c.user]);
    const pending=outcome(resolve(b,c));
    try {await waitBlocked(bp,ap);await a.query('COMMIT');expect((await pending).code).toBe('P7004');}
    finally {await a.query('ROLLBACK');await pending;}
    expect(await current('ban-first')).toEqual({role:'BANNED',status:'pending'});
}));
test('approval obtains locks first: later ban remains final role',async()=>withPair(async(a,b)=>{
    const c=byName('approve-first'),[ap,bp]=await pids(a,b);
    await a.query('BEGIN');await resolve(a,c);
    const pending=outcome(b.query("UPDATE public.users SET role='BANNED' WHERE id=$1",[c.user]));
    try {await waitBlocked(bp,ap);await a.query('COMMIT');expect((await pending).code).toBeUndefined();}
    finally {await a.query('ROLLBACK');await pending;}
    expect(await current('approve-first')).toEqual({role:'BANNED',status:'approved'});
}));
test.each([['compete-reject','rejected'],['compete-approve','approved']])('%s serializes competing resolution',async(name,decision)=>withPair(async(a,b)=>{
    const c=byName(name),[ap,bp]=await pids(a,b);
    await a.query('BEGIN');await resolve(a,c);
    const pending=outcome(resolve(b,c,decision));
    try {await waitBlocked(bp,ap);await a.query('COMMIT');expect((await pending).code).toBe('P7002');}
    finally {await a.query('ROLLBACK');await pending;}
    expect(await current(name)).toEqual({role:'SELLER',status:'approved'});
}));
