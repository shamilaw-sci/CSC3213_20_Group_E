const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const Module = require('node:module');
const readline = require('node:readline');
const { randomUUID } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { Client } = require('pg');
const { issueSessionToken } = require('../utils/sessionToken');
const jwt = require('jsonwebtoken');
const { identitySql, validateDatabase } = require('./local-stack.cjs');
const { snapshotState, assertSameState } = require('./database-state.cjs');
const { directRestUrl, allowSocket, allowedAppPorts } = require('./network-policy.cjs');
const { allowPrivate, allowPublic } = require('./checkout-browser-guard.cjs');
const { trackCheckoutResponse } = require('./checkout-response.cjs');
const { makeLifecycle, hashState } = require('./checkout-browser-lifecycle.cjs');

if (process.env.PHASE5_LOCAL_APPROVED !== 'stack-c' || process.env.NODE_ENV !== 'test'
    || process.env.SUPABASE_URL !== 'http://127.0.0.1:58321' || process.env.PAYHERE_MODE !== 'sandbox'
    || process.env.JWT_SECRET !== 'phase5-browser-fixtures-only') throw new Error('Verified sandbox launcher required.');
const tables = ['users','properties','saved_searches','transactions','payment_orders','payment_receipt_outbox','leads','conversations','messages','message_receipts','platform_settings'];
const run = randomUUID(), callbackBase = `/phase5/${randomUUID()}`;
const sellerUI = process.env.PHASE5_SELLER_UI === '1';
const sellerPassword = sellerUI ? randomUUID() : null;
const users = ['SELLER','AGENT'].map(role => ({ id: randomUUID(), role, name: `Sandbox ${role === 'SELLER' ? 'Seller' : 'Agent'}`, email: `${run}-${role.toLowerCase()}@example.test` }));
const fixturePasswordHashes = new Map();
const fixtures = ['Visa','Mastercard','Cancel','Decline'].map((label, i) => ({ label, id: randomUUID(), user: users[i === 1 ? 1 : 0] }));
const scope = { properties: new Set(fixtures.map(f => f.id)), orders: new Set(), callback: callbackBase + '/api/payment/notify', health: callbackBase + '/health', merchant: process.env.PAYHERE_MERCHANT_ID };
const callbacks = [], receiptAttempts = [];
const evidence = path.resolve(__dirname, '../../docs/evidence');
const db = new Client(JSON.parse(process.env.PHASE5_DATABASE));
let before, apiServer, bridgeServer, vite, timer, seeded = false;
const lifecycle = makeLifecycle(cleanup);
const stop = () => { clearTimeout(timer); return lifecycle.stop().then(() => process.exit(process.exitCode || 0)); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
process.stdin.on('end', stop); process.stdin.on('close', stop);
const input = readline.createInterface({ input: process.stdin });
input.on('line', line => {
    if (line.trim() === 'status' && before && !lifecycle.stopping) status().catch(() => console.error('Status failed.'));
    if (line.trim() === 'stop') stop();
});

const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
    if (!allowSocket(args, allowedAppPorts)) throw new Error('Browser fixture outbound socket refused.');
    return originalConnect.apply(this, args);
};
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => originalFetch(directRestUrl(input), { ...init, redirect: 'error', signal: AbortSignal.timeout(5000) });
const load = Module._load;
Module._load = function (id, parent, main) {
    if (id === 'dotenv' && parent?.filename.startsWith(path.resolve(__dirname, '..'))) return { config: () => ({ parsed: {} }) };
    const resolved = Module._resolveFilename(id, parent, main);
    if (resolved === path.resolve(__dirname, '../utils/paymentReceiptQueue.js')) return {
        start: () => { throw new Error('Worker forbidden in browser fixture.'); },
        drain: async id => { if (!scope.orders.has(id)) throw new Error('Unowned receipt boundary refused.'); receiptAttempts.push(id); },
    };
    if (resolved === path.resolve(__dirname, '../utils/emailService.js')) return new Proxy({}, { get: () => () => { throw new Error('Email forbidden in browser fixture.'); } });
    return load.apply(this, arguments);
};
const express = require('express');
const app = require('../server');
Module._load = load;
if (sellerUI) require('../repositories/propertyRepository').uploadImage = async () => { throw new Error('Media uploads forbidden in seller payment test.'); };
const listen = (server, port) => new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server)); });
const close = server => new Promise((resolve, reject) => server?.listening ? server.close(error => error ? reject(error) : resolve()) : resolve());

async function status() {
    const rows = [];
    for (const f of fixtures) {
        const property = (await db.query('SELECT payment_status,status FROM public.properties WHERE id=$1 AND seller_id=$2', [f.id, f.user.id])).rows[0];
        const orders = (await db.query('SELECT id,status,provider_payment_id FROM public.payment_orders WHERE property_id=$1 AND owner_id=$2 ORDER BY created_at', [f.id, f.user.id])).rows;
        const tx = (await db.query('SELECT count(*)::int AS n FROM public.transactions WHERE property_id=$1', [f.id])).rows[0].n;
        const outbox = (await db.query('SELECT r.status FROM public.payment_receipt_outbox r JOIN public.payment_orders o ON o.id=r.order_id WHERE o.property_id=$1 AND o.owner_id=$2', [f.id, f.user.id])).rows;
        rows.push({ label: f.label, property, orders, transactions: tx, outbox });
    }
    const summary = { run, sandbox: true, rows, callbacks, receiptBoundaryCalls: receiptAttempts.length };
    fs.writeFileSync(path.join(evidence, 'phase5-checkout-browser-status.private.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary));
}
async function cleanup() {
    try {
        await close(bridgeServer); await close(apiServer); if (vite) await vite.close();
        if (seeded) {
            validateDatabase((await db.query(identitySql)).rows[0]);
            for (const f of fixtures) {
                const orders = (await db.query('SELECT id,owner_id FROM public.payment_orders WHERE property_id=$1', [f.id])).rows;
                if (orders.some(o => o.owner_id !== f.user.id)) throw new Error('Browser cleanup owner mismatch.');
                const ids = orders.map(o => o.id);
                await db.query('DELETE FROM public.payment_receipt_outbox WHERE order_id=ANY($1::uuid[])', [ids]);
                await db.query('DELETE FROM public.transactions WHERE property_id=$1 AND payment_order_id=ANY($2::uuid[])', [f.id, ids]);
                await db.query('DELETE FROM public.payment_orders WHERE property_id=$1 AND owner_id=$2', [f.id, f.user.id]);
                await db.query('DELETE FROM public.properties WHERE id=$1 AND seller_id=$2 AND title=$3', [f.id, f.user.id, f.createdViaUI ? f.label : `${run} ${f.label}`]);
            }
            for (const u of users) await db.query('DELETE FROM public.users WHERE id=$1 AND email=$2', [u.id, u.email]);
        }
        if (before) { validateDatabase((await db.query(identitySql)).rows[0]); assertSameState(before, await snapshotState(db, tables)); }
        console.log(before ? 'PASS: browser listeners closed; eleven complete app snapshots and canonical ledger preserved after exact fixture cleanup.' : 'Browser listeners closed before fixture initialization.');
    } catch { console.error('Browser fixture cleanup/preservation failed; investigate exact private fixture IDs.'); process.exitCode = 1; }
    finally { await db.end().catch(() => {}); process.stdin.pause(); }
}

const startup = (async () => {
    try {
        await db.connect(); lifecycle.assertActive(); validateDatabase((await db.query(identitySql)).rows[0]);
        before = await snapshotState(db, tables); lifecycle.assertActive(); seeded = true;
        fs.writeFileSync(path.join(evidence, 'phase5-checkout-browser-fixtures.private.json'), JSON.stringify({ run, users, fixtures, callbackBase, beforeHashes: hashState(before) }, null, 2));
        for (const u of users) {
            lifecycle.assertActive();
            const hash = sellerUI ? await require('bcryptjs').hash(sellerPassword,10) : 'not-a-login-hash';
            fixturePasswordHashes.set(u.id, hash);
            await db.query('INSERT INTO public.users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)', [u.id,u.name,u.email,hash,u.role]);
        }
        for (const f of fixtures) { lifecycle.assertActive(); await db.query("INSERT INTO public.properties(id,seller_id,title,description,price,status,payment_status,type,latitude,longitude) VALUES($1,$2,$3,'Isolated sandbox checkout',1000,'pending','Unpaid','House',7,80)", [f.id,f.user.id,`${run} ${f.label}`]); }
        lifecycle.assertActive();
        const privateApi = express(); privateApi.use(express.json({ limit: '16kb' }));
        if (sellerUI) privateApi.use(require('cookie-parser')());
        privateApi.use((req, res, next) => {
            if (req.headers.origin && req.headers.origin !== 'http://localhost:5173') return res.sendStatus(403);
            let uiAllowed = false;
            if (sellerUI) {
                const p = req.path;
                uiAllowed = req.method === 'GET' && ['/api/auth/me','/api/properties/my-listings'].includes(p);
                if (req.method === 'POST' && p === '/api/auth/login') uiAllowed = req.body?.email === users[0].email;
                if (req.method === 'POST' && p === '/api/auth/logout') uiAllowed = true;
                if (req.method === 'OPTIONS') uiAllowed = true;
                if (req.method === 'POST' && p === '/api/properties') {
                    try { uiAllowed = jwt.verify(req.cookies.token, process.env.JWT_SECRET).id === users[0].id; } catch {}
                }
            }
            if (!uiAllowed && !allowPrivate(req.method, req.originalUrl, req.body, scope)) return res.sendStatus(404);
            trackCheckoutResponse(req, res, scope, value => {
                if (sellerUI && value?.property?.seller_id === users[0].id) {
                    const f = {id:value.property.id,label:value.property.title,user:users[0],createdViaUI:true}; fixtures.push(f); scope.properties.add(f.id);
                    fs.writeFileSync(path.join(evidence,'phase5-seller-created.private.json'),JSON.stringify({run,fixtures}));
                }
            });
            next();
        }); privateApi.use(app);
        apiServer = await listen(require('node:http').createServer(privateApi), 0); lifecycle.assertActive(); const apiPort = apiServer.address().port; allowedAppPorts.add(apiPort);
        const bridge = express(); bridge.use(express.urlencoded({ extended: false, limit: '16kb' }));
        bridge.use((req, res) => {
            if (!allowPublic(req.method, req.originalUrl, req.body, scope)) return res.sendStatus(404);
            if (req.method === 'GET') return res.json({ run, sandbox: true, isolated: true });
            if (!req.is('application/x-www-form-urlencoded')) return res.sendStatus(415);
            const body = { ...req.body };
            res.on('finish', () => { callbacks.push({ order_id: body.order_id, payment_id: body.payment_id, status_code: String(body.status_code), http_status: res.statusCode });
                if (res.statusCode === 200) fs.writeFileSync(path.join(evidence, `phase5-checkout-callback-${body.order_id}.private.json`), JSON.stringify(body)); });
            req.url = '/api/payment/notify'; req.originalUrl = req.url; app(req, res);
        });
        bridgeServer = await listen(require('node:http').createServer(bridge), 5000); lifecycle.assertActive();

        const frontend = path.resolve(__dirname, '../../frontend-react');
        const { createServer } = await import(pathToFileURL(require.resolve('vite', { paths: [frontend] })).href);
        const publicFixtures = fixtures.map(f => ({ label: f.label, id: f.id, user: f.user,
            token: issueSessionToken({ ...f.user, password_hash: fixturePasswordHashes.get(f.user.id) }, { expiresIn: '30m' }) }));
        const apiCode = `const cases=${JSON.stringify(publicFixtures)};async function request(method,url,body){const id=body?.property_id||url.split('/').at(-1);const f=cases.find(x=>x.id===id);const r=await fetch('http://127.0.0.1:${apiPort}/api'+url,{method,headers:{'Content-Type':'application/json',...(f?{Authorization:'Bearer '+f.token}:{})},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok){const e=new Error(data.error||data.message||'Fixture request failed');e.response={status:r.status,data};throw e;}if(url==='/payment/generate-hash'&&(!data.sandbox||data.merchant_id!==${JSON.stringify(scope.merchant)}))throw new Error('Sandbox terms refused');return {data};}export default{get:url=>request('GET',url),post:(url,body)=>request('POST',url,body)};`;
        const entry = `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import{TestAuth}from'virtual:phase5-auth';import api from'virtual:phase5-api';import{usePayhere}from'/src/hooks/usePayhere.js';const cases=${JSON.stringify(publicFixtures.map(({token,...f})=>f))};function Case({f}){const[m,setM]=useState(null),[state,S]=useState(null);const{triggerPayment}=usePayhere(setM);return React.createElement('section',null,React.createElement('h2',null,f.label+' — '+f.user.role),React.createElement('button',{onClick:()=>window.payhere?triggerPayment(f.id):setM({text:'SDK unavailable'})},'Start '+f.label),React.createElement('button',{onClick:async()=>S((await api.get('/properties/'+f.id)).data.property)},'Refresh '+f.label),React.createElement('p',{role:'status'},m?.text||'Ready; sandbox only'),React.createElement('pre',null,state?JSON.stringify({payment_status:state.payment_status,status:state.status}):''));}createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter,null,React.createElement('h1',null,'Isolated PayHere sandbox checkout'),React.createElement('p',null,'Test data only. Database is local. Receipt delivery disabled.'),cases.map(f=>React.createElement(TestAuth.Provider,{key:f.id,value:{user:f.user}},React.createElement(Case,{f})))));`;
        const emptyEnv = path.join(evidence, 'checkout-empty-env'); fs.mkdirSync(emptyEnv, { recursive: true });
        vite = await createServer({ configFile: false, root: frontend, envDir: emptyEnv, logLevel: 'error',
            server: { host: '127.0.0.1', port: 5173, strictPort: true },
            define: { 'import.meta.env.VITE_PAYHERE_NOTIFY_URL': JSON.stringify(process.env.PHASE5_TUNNEL + scope.callback) },
            optimizeDeps: { entries: [], noDiscovery: true, include: ['react','react-dom/client','react-router-dom'] },
            plugins: [{ name: 'phase5-checkout-fixture', enforce: 'pre',
                resolveId(id, importer) { if (id.startsWith('virtual:phase5-')) return '\0'+id;
                    if (importer?.replaceAll('\\','/').endsWith('/src/hooks/usePayhere.js')) {
                        if (id === '../context/api') return '\0virtual:phase5-api';
                        if (id === '../context/UserAuthContext') return '\0virtual:phase5-auth';
                    } },
                load(id) { if (id === '\0virtual:phase5-entry') return entry;
                    if (id === '\0virtual:phase5-api') return apiCode;
                    if (id === '\0virtual:phase5-auth') return "import{createContext,useContext}from'react';export const TestAuth=createContext(null);export const useAuth=()=>useContext(TestAuth);"; },
                configureServer(server) { server.middlewares.use(async (req,res,next) => {
                    if (!['/__phase5_checkout','/seller-dashboard','/agent-dashboard'].includes(req.url)) return next();
                    try { const html=await server.transformIndexHtml(req.url,`<!doctype html><html><head><title>Isolated sandbox checkout</title><style>body{font:16px sans-serif;max-width:900px;margin:40px auto}section{border:1px solid #bbb;padding:16px;margin:16px 0}button{padding:10px;margin-right:12px}</style></head><body><div id="root"></div><script src="https://www.payhere.lk/lib/payhere-2.0.js"></script><script type="module">import 'virtual:phase5-entry';</script></body></html>`);res.setHeader('Content-Type','text/html');res.end(html); } catch { res.statusCode=500;res.end('Fixture page failed.'); }
                }); },
            }] });
        lifecycle.assertActive(); await vite.listen(); lifecycle.assertActive();
        if (sellerUI) {
            await vite.close();
            vite = await createServer({ root: frontend, envDir: emptyEnv, server:{host:'127.0.0.1',port:5173,strictPort:true},
                define:{'import.meta.env.VITE_PAYHERE_NOTIFY_URL':JSON.stringify(process.env.PHASE5_TUNNEL + scope.callback)},
                plugins:[{name:'phase5-real-ui-api',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/src/context/api.ts')) return `import axios from 'axios';export default axios.create({baseURL:'http://localhost:${apiPort}/api',withCredentials:true});`;}}] });
            await vite.listen();
            fs.writeFileSync(path.join(evidence,'phase5-seller-login.private.json'),JSON.stringify({email:users[0].email,password:sellerPassword}));
            console.log('SELLER UI: http://localhost:5173/login ; disposable login saved privately. Media uploads disabled.');
        }
        const metadata = { run, url: 'http://localhost:5173/__phase5_checkout', health: process.env.PHASE5_TUNNEL + scope.health, notify: process.env.PHASE5_TUNNEL + scope.callback, apiPort };
        fs.writeFileSync(path.join(evidence, 'phase5-checkout-browser-session.private.json'), JSON.stringify(metadata, null, 2));
        console.log('READY: http://localhost:5173/__phase5_checkout ; sandbox-only isolated backend; verify private health sentinel before payment. Commands: status, stop.');
        timer = setTimeout(stop, 25 * 60 * 1000); timer.unref();
    } catch { if (!lifecycle.stopping) { console.error('Sandbox browser fixture startup failed; credentials suppressed.'); process.exitCode = 1; } queueMicrotask(stop); }
})();
lifecycle.setStartup(startup);
