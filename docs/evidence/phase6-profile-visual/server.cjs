// Private synthetic presentation-only observation tool. No application .env/API/auth.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pathToFileURL } = require('node:url');
const frontend = path.resolve(__dirname, '../../../frontend-react');
const fromFrontend = name => pathToFileURL(require.resolve(name, { paths: [frontend] })).href;
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import BeforePanel from 'virtual:phase6-before';
import SavedSearchesPanel from '/src/components/profile/SavedSearchesPanel.jsx';
import '/src/index.css';
const params = new URLSearchParams(location.search);
const rows = params.get('state') === 'empty' ? [] : [
  { id:'synthetic-1', title:'Saved Kandy', district:'Kandy', type:'House', min_price:100000, max_price:25000000, email_alerts_enabled:true },
  { id:'synthetic-2', name:'Legacy Search', district:'Colombo', type:'Land', min_price:0, max_price:5000000, email_alerts_enabled:false },
];
const noop = () => {};
const props = { searches: rows, onDelete: noop, onToggleAlerts: noop, onRun: noop, onStartSearching: noop };
const after = params.get('version') === 'after';
const view = after ? <m.div key="searches" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><SavedSearchesPanel {...props}/></m.div> : <BeforePanel {...props}/>;
createRoot(document.getElementById('fixture')).render(<LazyMotion features={domAnimation}>{view}</LazyMotion>);
`;
(async () => {
    const { createServer } = await import(fromFrontend('vite'));
    const react = (await import(fromFrontend('@vitejs/plugin-react'))).default;
    const tailwind = (await import(fromFrontend('@tailwindcss/vite'))).default;
    const emptyEnv = path.join(__dirname, 'empty-env'); fs.mkdirSync(emptyEnv, { recursive: true });
    const server = await createServer({ configFile: false, root: frontend, envDir: emptyEnv,
        resolve: { dedupe: ['react','react-dom','framer-motion','lucide-react'], alias: { '@': path.join(frontend,'src') } },
        server: { host:'127.0.0.1', port:5174, strictPort:true },
        optimizeDeps: { entries:[], noDiscovery:true, include:['react','react-dom/client','framer-motion','lucide-react'] },
        plugins: [react(), tailwind(), {
            name:'private-phase6-fixture', enforce:'pre',
            resolveId(id) { if(id.startsWith('virtual:phase6-')) return '\0'+id; },
            load(id) {
                if(id==='\0virtual:phase6-before') return fs.readFileSync(path.join(__dirname,'BeforePanel.jsx'),'utf8');
                if(id==='\0virtual:phase6-entry') return { code:entry, map:null };
            },
            async transform(code,id) {
                if(id==='\0virtual:phase6-entry' || id==='\0virtual:phase6-before') {
                    const { transformWithOxc } = await import(fromFrontend('vite'));
                    return transformWithOxc(code,id+'.jsx',{lang:'jsx',jsx:{runtime:'automatic'}});
                }
            },
            configureServer(vite) { vite.middlewares.use(async(req,res,next)=>{
                if(!req.url?.startsWith('/__phase6_searches')) return next();
                const p=new URL(req.url,'http://127.0.0.1:5174');
                const dark=p.searchParams.get('theme')==='dark';
                const html=await vite.transformIndexHtml(p.pathname,'<!doctype html><html class="'+(dark?'dark':'light')+'"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private Phase 6 panel comparison</title></head><body><main id="fixture" style="max-width:1000px;margin:0 auto;padding:24px"></main><script type="module">import "virtual:phase6-entry";</script></body></html>');
                res.setHeader('Content-Type','text/html');res.end(html);
            }); }
        }] });
    await server.listen();
    console.log('READY: synthetic before/after panel only at http://127.0.0.1:5174/__phase6_searches?version=before&state=populated&theme=light');
    const stop=async()=>{await server.close();process.stdin.pause();console.log('Visual fixture stopped.');process.exit(0);};
    process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{if(s.trim()==='stop')stop();});
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
