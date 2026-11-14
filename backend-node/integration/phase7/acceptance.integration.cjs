const { randomUUID } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const app = require('../../server');
const { allowedAppPorts } = require('./network.cjs');
const { tables } = require('./state.cjs');
const e = require('./environment.cjs');
const run = randomUUID(), password = 'Phase7-synthetic-only-123!';
const agent = { id: randomUUID(), email: `${run}-agent@example.test`, role: 'AGENT' };
const other = { id: randomUUID(), email: `${run}-other@example.test`, role: 'BUYER' };
const registeredEmail = `${run}-registered@example.test`;
const ownedUsers = [agent,other];
const properties = ['approved','pending','rejected'].map(status => ({ id: randomUUID(), status }));
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
let server, port, connected = false, owner, cookies = {}, guestLead, boundLead;
const call = (who, method, url) => {
    const result = request(server)[method](url).set('Origin','http://localhost:5173');
    return who ? result.set('Cookie',cookies[who]) : result;
};
const booking = who => call(who,'post',`/api/agents/${agent.id}/book-viewing`).send({
    client_name:'Synthetic contact', client_email:`${run}-contact@example.test`, client_phone:'0771234567', buyer_id:other.id,
});
const roleKey = role => jwt.sign({role,iss:'supabase',...(role==='authenticated'?{sub:other.id}:{})},
    process.env.PHASE7_INFRA_SECRET,{expiresIn:'5m'});
async function rest(role,path,body,method=body===undefined?'GET':'POST') {
    const response = await fetch(`http://127.0.0.1:59321/rest/v1/${path}`,{method,
        headers:{Authorization:`Bearer ${roleKey(role)}`,'Content-Type':'application/json'},
        ...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:response.status,body:await response.json()};
}
beforeAll(async()=>{
    server=await new Promise((resolve,reject)=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));listener.once('error',reject);});
    port=server.address().port;allowedAppPorts.add(port);
    await db.connect();connected=true;e.validateIdentity((await db.query(e.identitySql)).rows[0],e.loadState());
    const hash=await bcrypt.hash(password,10);
    for(const user of ownedUsers) await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',
        [user.id,'Synthetic Phase7 user',user.email,hash,user.role]);
    await db.query('INSERT INTO public.agent_profiles(agent_id,agency_name,rejection_reason) VALUES($1,$2,$3)',[agent.id,'Synthetic agency','synthetic-moderation-marker']);
    for(const property of properties) await db.query('INSERT INTO public.properties(id,seller_id,title,status,price) VALUES($1,$2,$3,$4,1000000)',
        [property.id,agent.id,`${run} property`,property.status]);
    const registration=await call(null,'post','/api/auth/register').send({name:'Registered fixture',email:registeredEmail,password,role:'ADMIN'});
    // Capture committed registration even if a later response assertion fails.
    const registered=(await db.query('SELECT id,email,role FROM public.users WHERE email=$1',[registeredEmail])).rows[0];
    if(registered){owner=registered;ownedUsers.push(owner);}
    expect(registration.status).toBe(201);expect(owner.role).toBe('BUYER');
    for(const [name,user] of [['owner',owner],['other',other],['agent',agent]]) {
        const login=await call(null,'post','/api/auth/login').send({email:user.email,password});
        expect(login.status).toBe(200);cookies[name]=login.headers['set-cookie'].map(value=>value.split(';')[0]).join('; ');
    }
},30000);
afterAll(async()=>{
    try {
        if(connected) {
            // All parents are freshly generated synthetic UUIDs/emails owned by this run.
            const registration=(await db.query('SELECT id,email FROM public.users WHERE email=$1',[registeredEmail])).rows[0];
            if(registration&&!ownedUsers.some(user=>user.id===registration.id))ownedUsers.push(registration);
            const ids=ownedUsers.map(user=>user.id);
            const conversations=(await db.query('SELECT id FROM public.conversations WHERE seller_id=$1 OR buyer_id=ANY($2::uuid[])',[agent.id,ids])).rows.map(row=>row.id);
            const messages=(await db.query('SELECT id FROM public.messages WHERE conversation_id=ANY($1::uuid[])',[conversations])).rows.map(row=>row.id);
            await db.query('DELETE FROM public.message_receipts WHERE message_id=ANY($1::uuid[])',[messages]);
            await db.query('DELETE FROM public.messages WHERE id=ANY($1::uuid[])',[messages]);
            await db.query('DELETE FROM public.conversations WHERE id=ANY($1::uuid[])',[conversations]);
            await db.query('DELETE FROM public.leads WHERE assigned_agent_id=$1',[agent.id]);
            await db.query('DELETE FROM public.favorites WHERE property_id=ANY($1::uuid[])',[properties.map(item=>item.id)]);
            await db.query('DELETE FROM public.properties WHERE id=ANY($1::uuid[]) AND seller_id=$2',[properties.map(item=>item.id),agent.id]);
            await db.query('DELETE FROM public.agent_profiles WHERE agent_id=$1',[agent.id]);
            for(const user of ownedUsers)await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2',[user.id,user.email]);
        }
    } finally {
        if(connected)await db.end();
        if(server)await new Promise(resolve=>server.close(resolve));allowedAppPorts.delete(port);
    }
},30000);

test('all19 application tables deny anonymous/authenticated reads with real service positive controls',async()=>{
    for(const table of tables) {
        expect((await rest('service_role',`${table}?select=*&limit=0`)).status).toBe(200);
        for(const role of ['anon','authenticated']) {
            expect((await db.query('SELECT has_table_privilege($1,$2,$3) allowed',[role,`public.${table}`,'SELECT'])).rows[0].allowed).toBe(false);
            const response=await rest(role,`${table}?select=*&limit=0`);
            expect([401,403]).toContain(response.status);expect(response.body.code).toBe('42501');
        }
    }
});
test('moderation column and direct lead insertion are denied via PostgREST',async()=>{
    for(const role of ['anon','authenticated']) {
        const moderation=await rest(role,'agent_profiles?select=rejection_reason');
        expect([401,403]).toContain(moderation.status);expect(JSON.stringify(moderation.body)).not.toContain('synthetic-moderation-marker');
        const result=await rest(role,'leads',{assigned_agent_id:agent.id,client_name:'Synthetic direct',client_email:`${run}-denied@example.test`,buyer_id:owner.id});
        expect([401,403]).toContain(result.status);expect(result.body.code).toBe('42501');
        const update=await rest(role,`leads?assigned_agent_id=eq.${agent.id}`,{buyer_id:other.id},'PATCH');
        expect([401,403]).toContain(update.status);expect(update.body.code).toBe('42501');
    }
});
test('five application RPCs reject direct client roles with precise privilege errors',async()=>{
    const id=randomUUID();
    const rpc=[['claim_payment_receipts(uuid)','claim_payment_receipts',{p_order_id:id}],
        ['increment_property_views(uuid)','increment_property_views',{property_id:id}],
        ['search_properties(text)','search_properties',{search_polygon:'POLYGON((79 5,82 5,82 10,79 10,79 5))'}],
        ['create_listing_checkout(uuid,uuid,numeric,text,text,text)','create_listing_checkout',{p_property_id:properties[0].id,p_owner_id:agent.id,p_amount:1,p_currency:'LKR',p_mode:'sandbox',p_merchant_id:'synthetic'}],
        ['settle_listing_checkout(uuid,text,numeric,text,text,text)','settle_listing_checkout',{p_order_id:id,p_payment_id:'synthetic',p_amount:1,p_currency:'LKR',p_mode:'sandbox',p_merchant_id:'synthetic'}]];
    for(const [signature,name,args]of rpc) for(const role of ['anon','authenticated']) {
        expect((await db.query('SELECT has_function_privilege($1,$2,$3) allowed',[role,`public.${signature}`,'EXECUTE'])).rows[0].allowed).toBe(false);
        const result=await rest(role,`rpc/${name}`,args);expect([401,403]).toContain(result.status);expect(result.body.code).toBe('42501');
    }
});
test('registered and guest bookings bind only authenticated identity despite contact/body fields',async()=>{
    const bound=await booking('owner');expect(bound.status).toBe(201);
    const guest=await booking(null);expect(guest.status).toBe(201);
    const leads=(await db.query('SELECT lead_id,buyer_id,client_email FROM public.leads WHERE assigned_agent_id=$1 ORDER BY created_at',[agent.id])).rows;
    boundLead=leads.find(row=>row.buyer_id===owner.id);guestLead=leads.find(row=>row.buyer_id===null);
    expect(boundLead).toBeDefined();expect(guestLead).toBeDefined();expect(leads).toHaveLength(2);
    expect(boundLead.client_email).not.toBe(owner.email);
    const own=await call('owner','get','/api/agents/my-appointments');expect(own.status).toBe(200);
    expect(own.body.appointments.map(row=>row.lead_id)).toEqual([boundLead.lead_id]);
    expect(own.body.appointments[0].assigned_agent.id).toBe(agent.id);
});
test('matching contact email grants no guest/foreign access and email changes retain account ownership',async()=>{
    const contact=`${run}-contact@example.test`;
    const otherChange=await call('other','put','/api/auth/profile').send({email:contact});expect(otherChange.status).toBe(200);other.email=contact;
    const list=await call('other','get','/api/agents/my-appointments');expect(list.status).toBe(200);expect(list.body.appointments).toEqual([]);
    for(const id of [boundLead.lead_id,guestLead.lead_id]) expect((await call('other','delete',`/api/agents/my-appointments/${id}`)).status).toBe(404);
    const changed=`${run}-changed@example.test`;
    expect((await call('owner','put','/api/auth/profile').send({email:changed})).status).toBe(200);owner.email=changed;
    const own=await call('owner','get','/api/agents/my-appointments');expect(own.status).toBe(200);
    expect(own.body.appointments.map(row=>row.lead_id)).toEqual([boundLead.lead_id]);
    expect((await call('owner','delete',`/api/agents/my-appointments/${boundLead.lead_id}`)).status).toBe(200);
    expect((await db.query('SELECT lead_id FROM public.leads WHERE lead_id=$1',[guestLead.lead_id])).rowCount).toBe(1);
});
test('FK rejects unknown account and account deletion unbinds while preserving agent lead',async()=>{
    await expect(db.query('INSERT INTO public.leads(assigned_agent_id,client_name,client_email,buyer_id) VALUES($1,$2,$3,$4)',
        [agent.id,'Synthetic FK',`${run}-fk@example.test`,randomUUID()])).rejects.toMatchObject({code:'23503'});
    const user={id:randomUUID(),email:`${run}-deleted@example.test`};ownedUsers.push(user);
    await db.query('INSERT INTO public.users(id,name,email) VALUES($1,$2,$3)',[user.id,'Synthetic deleted account',user.email]);
    const id=randomUUID();await db.query('INSERT INTO public.leads(lead_id,assigned_agent_id,client_name,client_email,buyer_id) VALUES($1,$2,$3,$4,$5)',
        [id,agent.id,'Synthetic retained lead',user.email,user.id]);
    await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2',[user.id,user.email]);
    expect((await db.query('SELECT buyer_id FROM public.leads WHERE lead_id=$1',[id])).rows).toEqual([{buyer_id:null}]);
});
test('favorites use real nested approved filter and allow withdrawn removal without content disclosure',async()=>{
    const [approved,pending,rejected]=properties;
    for(const item of [pending,rejected])expect((await call('owner','post',`/api/favorites/${item.id}`)).status).toBe(404);
    expect((await call('owner','post',`/api/favorites/${approved.id}`)).status).toBe(200);
    await db.query('INSERT INTO public.favorites(user_id,property_id) VALUES($1,$2)',[owner.id,pending.id]);
    const visible=await call('owner','get','/api/favorites');expect(visible.status).toBe(200);
    expect(visible.body.favorites.map(row=>row.id)).toEqual([approved.id]);
    await db.query("UPDATE public.properties SET status='rejected' WHERE id=$1 AND seller_id=$2",[approved.id,agent.id]);
    const hidden=await call('owner','get','/api/favorites');expect(hidden.status).toBe(200);expect(hidden.body.favorites).toEqual([]);
    const removed=await call('owner','post',`/api/favorites/${approved.id}`);expect(removed.status).toBe(200);expect(removed.body.isFavorite).toBe(false);
});
