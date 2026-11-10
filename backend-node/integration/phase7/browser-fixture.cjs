const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { randomUUID } = require('node:crypto');
const express = require('express');

const frontend = path.resolve(__dirname, '../../../frontend-react');
const port = 5187;
const origin = `http://127.0.0.1:${port}`;
const sandboxOrigin = `http://localhost:${port}`;

function simulation() {
    const user = { id: randomUUID(), name: 'Synthetic Seller', role: 'SELLER', email: 'fixture@example.test' };
    let property, order, fee = '750.00', unavailable = false;
    const counts = { drafts: 0, hashes: 0, advisories: 0 };
    const merchant = 'synthetic-merchant';
    function request(method, url, body) {
        if (method === 'GET' && url === '/payment/config') {
            return unavailable ? [503, {}] : [200, { listing_fee: fee, currency: 'LKR', merchant_id: merchant, sandbox: true }];
        }
        if (method === 'GET' && url === '/properties/my-listings') return [200, { properties: property ? [property] : [] }];
        if (method === 'POST' && url === '/properties' && body?.fixtureForm === true) {
            counts.drafts++;
            property = { id: randomUUID(), seller_id: user.id, title: 'Synthetic listing', price: 1000, status: 'pending', payment_status: 'Unpaid', images: [] };
            order = null;
            return [201, { property }];
        }
        if (method === 'GET' && property && url === `/properties/${property.id}`) return [200, { property }];
        if (method === 'POST' && property && body?.property_id === property.id) {
            if (url === '/payment/generate-hash' && property.payment_status === 'Unpaid') {
                counts.hashes++;
                order ??= { property_id: property.id, order_id: randomUUID(), amount: fee, currency: 'LKR', merchant_id: merchant, sandbox: true, hash: 'A'.repeat(32) };
                return [200, order];
            }
            if (url === '/payment/confirm-client-success' && order && body.order_id === order.order_id) {
                counts.advisories++;
                return [200, {}];
            }
        }
        return [404, {}];
    }
    function control(action) {
        switch (action) {
            case 'fail-config': unavailable = true; break;
            case 'restore-config': unavailable = false; break;
            case 'change-fee': fee = '800.00'; break;
            case 'mark-paid': if (!order || !property) return false; property.payment_status = 'Paid'; break;
            case 'reset':
                property = order = null;
                fee = '750.00'; unavailable = false;
                for (const key of Object.keys(counts)) counts[key] = 0;
                break;
            default: return false;
        }
        return true;
    }
    return { user, request, control, status: () => ({ ...counts, payment: property?.payment_status ?? 'No draft' }) };
}

async function startFixture({ dir, mode, manifest, request, status, control, notifyUrl }) {
    const fixtureOrigin = mode === 'sandbox' ? sandboxOrigin : origin;
    const { createServer, transformWithOxc } = await import(pathToFileURL(require.resolve('vite', { paths: [frontend] })).href);
    const entryPath = path.join(__dirname, 'browser-entry.jsx');
    const { code: entry } = await transformWithOxc(fs.readFileSync(entryPath, 'utf8'), entryPath);
    const prefix = `/fixture-${randomUUID()}`;
    const nonce = randomUUID();
    const envDir = path.join(dir, 'empty-env');
    fs.mkdirSync(envDir, { recursive: true });
    const routes = express();
    routes.disable('x-powered-by');
    routes.use(express.json({ limit: '8kb' }));
    routes.use(async (req, res) => {
        if (req.headers.origin && req.headers.origin !== fixtureOrigin) return res.sendStatus(403);
        try {
            if (req.method === 'GET' && req.url === '/status') return res.json(await status());
            if (control && req.method === 'POST' && req.url === '/control') return res.sendStatus(control(req.body?.action) ? 204 : 400);
            if (!req.url.startsWith('/api/')) return res.sendStatus(404);
            const [code, data] = await request(req.method, req.url.slice(4), req.body, req.headers['x-fixture-case']);
            return res.status(code).json(data);
        } catch { return res.status(500).json({ message: 'Fixture request failed.' }); }
    });
    routes.use((error, req, res, next) => res.status(error.status === 413 ? 413 : 400).json({ message: 'Fixture request refused.' }));
    const modules = {
        'fixture-entry.jsx': entry,
        'fixture-settings': `export default ${JSON.stringify({ mode, prefix, manifest })};`,
        'fixture-auth': "import {createContext,useContext} from 'react'; export const FixtureAuth=createContext(null); export const useAuth=()=>useContext(FixtureAuth);",
        'fixture-empty': 'export default function Empty(){return null}',
        'fixture-api': `import settings from 'virtual:fixture-settings';
            async function request(method,url,body,options){
                const f=new URLSearchParams(location.search).get('case')||'Visa';
                const response=await fetch(settings.prefix+'/api'+url,{method,signal:options?.signal,headers:{'Content-Type':'application/json','X-Fixture-Case':f},body:body===undefined?undefined:JSON.stringify(body instanceof FormData?{fixtureForm:true}:body)});
                const data=await response.json(); if(!response.ok){const error=new Error('Fixture API unavailable.');error.response={data,status:response.status};throw error;}return {data};
            }
            export default {get:(url,options)=>request('GET',url,undefined,options),post:(url,body,options)=>request('POST',url,body,options)};`,
    };
    const vite = await createServer({
        root: frontend, configFile: false, envDir, publicDir: false, cacheDir: path.join(dir, 'vite-cache'),
        optimizeDeps: { noDiscovery: true, include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/client', 'react-router-dom', 'framer-motion', 'lucide-react', 'react-hot-toast'] },
        resolve: { alias: { '@': path.join(frontend, 'src') } },
        appType: 'custom', server: { host: '127.0.0.1', port, strictPort: true, hmr: false, fs: { strict: true, allow: [frontend] } },
        define: { 'import.meta.env.VITE_API_URL': JSON.stringify(fixtureOrigin), ...(notifyUrl ? { 'import.meta.env.VITE_PAYHERE_NOTIFY_URL': JSON.stringify(notifyUrl) } : {}) },
        plugins: [{
            name: 'phase7-browser-fixture', enforce: 'pre',
            resolveId(id, importer) {
                if (id.startsWith('virtual:') && Object.hasOwn(modules, id.slice(8))) return `\0${id}`;
                if (!importer) return;
                if (id === '../context/api' || id === '../context/api.ts') return '\0virtual:fixture-api';
                if (id === '../context/UserAuthContext') return '\0virtual:fixture-auth';
                if (['../components/layout/Navbar', '../components/layout/Footer'].includes(id)) return '\0virtual:fixture-empty';
            },
            load(id) { return id.startsWith('\0virtual:') ? modules[id.slice(9)] : undefined; },
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.headers.host !== new URL(fixtureOrigin).host) { res.statusCode = 403; return res.end(); }
                    next();
                });
                server.middlewares.use(prefix, routes);
                server.middlewares.use(async (req, res, next) => {
                    if (req.method !== 'GET' || req.url.split('?')[0] !== '/') return next();
                    const sandbox = mode === 'sandbox';
                    const provider = sandbox ? ' https://www.payhere.lk https://sandbox.payhere.lk' : '';
                    res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'nonce-${nonce}'${provider}; style-src 'self' 'unsafe-inline'; connect-src 'self'${provider}; img-src 'self' data: blob:${provider}; frame-src ${sandbox ? 'https://sandbox.payhere.lk' : "'none'"}; form-action 'self'${sandbox ? ' https://sandbox.payhere.lk' : ''}; base-uri 'none'; frame-ancestors 'none'`);
                    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
                    const sdk = sandbox ? '<script src="https://www.payhere.lk/lib/payhere.js"></script>' : '';
                    const html = `<!doctype html><html lang="en"><head><title>Phase 7 browser fixture</title><style>body{font:16px system-ui;margin:24px;max-width:980px}button,a{margin:4px;padding:6px}section{border:1px solid #bbb;padding:12px;margin:12px 0}button:disabled{opacity:.5}</style>${sdk}</head><body><div id="root"></div><script nonce="${nonce}" type="module" src="/@id/__x00__virtual:fixture-entry.jsx"></script></body></html>`;
                    res.end(html);
                });
            },
        }],
    });
    try { await vite.listen(); } catch (error) { await vite.close(); throw error; }
    return vite;
}
module.exports = { simulation, startFixture, origin, sandboxOrigin };
