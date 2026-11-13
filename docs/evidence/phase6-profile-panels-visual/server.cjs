// Private synthetic presentation-only observation tool. No application .env/API/auth.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pathToFileURL } = require('node:url');
const frontend = path.resolve(__dirname, '../../../frontend-react');
const fromFrontend = name => pathToFileURL(require.resolve(name, { paths: [frontend] })).href;
const entry = "\nimport React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport {LazyMotion,domAnimation,m} from 'framer-motion';\nimport BeforeAppointments from 'virtual:phase6-before-appointments';\nimport BeforeFavorites from 'virtual:phase6-before-favorites';\nimport AppointmentsPanel from '/src/components/profile/AppointmentsPanel.jsx';\nimport FavoritesPanel from '/src/components/profile/FavoritesPanel.jsx';\nimport '/src/index.css';\nconst p=new URLSearchParams(location.search), noop=()=>{};\nconst picture='data:image/svg+xml,'+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\"><rect width=\"400\" height=\"300\" fill=\"#cbd5e1\"/></svg>');\nconst appointments=p.get('state')==='empty'?[]:['Active','Attempted Contact','Closed','New'].map((status,i)=>({lead_id:'fixture-'+i,lifecycle_status:status,created_at:'2026-11-01T06:00:00Z',lead_source:i===0?'Property Tour':null,assigned_agent:i===3?null:{id:'agent-'+i,name:'Synthetic Agent '+i,phone:i===0?'0000000000':null,avatar_url:picture,agent_profiles:i===0?{agency_name:'Synthetic Agency',license_number:'TEST-ONLY'}:{}},properties:i===0?{title:'Synthetic Kandy Home',price:25000000}:null}));\nconst favorites=p.get('state')==='empty'?[]:[{id:'property-1',title:'Synthetic Kandy Home',price:25000000,city:'Kandy',district:'Kandy',bedrooms:3,bathrooms:2,land_size:'12 perches',images:[picture]},{id:'property-2',title:'Synthetic Zero Defaults',city:'Colombo',district:'Colombo',images:[picture]}];\nconst ap={appointments,onFindAgent:noop,onViewAgent:noop,onCancel:noop,onMessage:noop},fp={favorites,onExplore:noop,onRemove:noop,onViewDetails:noop};\nconst beforeProps={appointments,favorites,navigate:noop,handleCancelAppointment:noop,handleRemoveFavorite:noop};\nconst isA=p.get('panel')==='appointments';\nconst before=isA?<BeforeAppointments {...beforeProps}/>:<BeforeFavorites {...beforeProps}/>;\nconst after=<m.div key={isA?'appointments':'favorites'} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>{isA?<AppointmentsPanel {...ap}/>:<FavoritesPanel {...fp}/>}</m.div>;\ncreateRoot(document.getElementById('fixture')).render(<LazyMotion features={domAnimation}>{p.get('version')==='after'?after:before}</LazyMotion>);\n";

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
                if(id.startsWith('\0virtual:phase6-before-')) return fs.readFileSync(path.join(__dirname,'Before-'+id.split('before-')[1]+'.jsx'),'utf8');
                if(id==='\0virtual:phase6-entry') return { code:entry, map:null };
            },
            async transform(code,id) {
                if(id==='\0virtual:phase6-entry' || id.startsWith('\0virtual:phase6-before-')) {
                    const { transformWithOxc } = await import(fromFrontend('vite'));
                    return transformWithOxc(code,id+'.jsx',{lang:'jsx',jsx:{runtime:'automatic'}});
                }
            },
            configureServer(vite) { vite.middlewares.use(async(req,res,next)=>{
                if(!req.url?.startsWith('/__phase6_panels')) return next();
                const p=new URL(req.url,'http://127.0.0.1:5174');
                const dark=p.searchParams.get('theme')==='dark';
                const html=await vite.transformIndexHtml(p.pathname,'<!doctype html><html class="'+(dark?'dark':'light')+'"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>.animate-pulse{animation-play-state:paused!important}</style><title>Private Phase 6 panel comparison</title></head><body><main id="fixture" style="max-width:1000px;margin:0 auto;padding:24px"></main><script type="module">import "virtual:phase6-entry";</script></body></html>');
                res.setHeader('Content-Type','text/html');res.end(html);
            }); }
        }] });
    await server.listen();
    console.log('READY: synthetic before/after panel only at http://127.0.0.1:5174/__phase6_panels?version=before&state=populated&theme=light');
    const stop=async()=>{await server.close();process.stdin.pause();console.log('Visual fixture stopped.');process.exit(0);};
    process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{if(s.trim()==='stop')stop();});
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
