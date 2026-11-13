// Private synthetic presentation-only observation tool. No application .env/API/auth.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pathToFileURL } = require('node:url');
const frontend = path.resolve(__dirname, '../../../frontend-react');
const fromFrontend = name => pathToFileURL(require.resolve(name, { paths: [frontend] })).href;
const entry = "import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport {LazyMotion,domAnimation,m} from 'framer-motion';\nimport BeforePanel from 'virtual:phase6-before';\nimport SavedSearchesPanel from '/src/components/profile/SavedSearchesPanel.jsx';\nimport {Button} from '/src/components/ui/button.jsx';\nimport '/src/components/layout/Navbar.css';\nconst params=new URLSearchParams(location.search),after=params.get('version')==='after',noHover=params.get('nohover')==='1';\nif(after){if(noHover)await import('/src/index.css?phase6-nohover=1');else await import('/src/index.css');}else{if(noHover)await import('virtual:phase6-original-index.css?phase6-nohover=1');else await import('virtual:phase6-original-index.css');}\nconst rows=params.get('state')==='empty'?[]:[{id:'synthetic-1',title:'Saved Kandy',district:'Kandy',type:'House',email_alerts_enabled:true},{id:'synthetic-2',name:'Legacy Search',district:'Colombo',type:'Land',email_alerts_enabled:false}];\nconst noop=()=>{},props={searches:rows,onDelete:noop,onToggleAlerts:noop,onRun:noop,onStartSearching:noop};\ncreateRoot(document.getElementById('fixture')).render(<LazyMotion features={domAnimation}><m.div key=\"searches\" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>{after?<SavedSearchesPanel {...props}/>:<BeforePanel {...props}/>}</m.div><div style={{marginTop:24}}><Button>Synthetic Shared Button</Button></div></LazyMotion>);";

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
            resolveId(id) { if(id.startsWith('virtual:phase6-original-index.css')||id.split('?')[0].endsWith('/phase6-original-index.css')) return path.join(frontend,'src','phase6-original-index.css').replaceAll(String.fromCharCode(92),'/')+(id.includes('phase6-nohover=1')?'?phase6-nohover=1':''); if(id.startsWith('virtual:phase6-')) return '\0'+id; },
            load(id) { if(id.split('?')[0]===path.join(frontend,'src','phase6-original-index.css').replaceAll(String.fromCharCode(92),'/')) return fs.readFileSync(path.join(__dirname,'index.before.css'),'utf8');
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
                if(!req.url?.startsWith('/__phase6_action_token')) return next();
                const p=new URL(req.url,'http://127.0.0.1:5174');
                const dark=p.searchParams.get('theme')==='dark';
                const html=await vite.transformIndexHtml(p.pathname,'<!doctype html><html class="'+(dark?'dark':'light')+'"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+(p.searchParams.get('custom')==='1'?'<style>:root:root{--profile-solid-action-bg:rgb(120,30,180);--profile-solid-action-hover-bg:rgb(90,20,140);--profile-solid-action-fg:rgb(255,245,180)}</style>':'')+'<title>Private Phase 6 token comparison</title></head><body><main id="fixture" style="max-width:1000px;margin:0 auto;padding:24px"></main><script type="module">import "virtual:phase6-entry";</script></body></html>');
                res.setHeader('Content-Type','text/html');res.end(html);
            }); }
        }, {name:'private-false-hover-branch',enforce:'post',transform(code,id){if(id.includes('phase6-nohover=1')&&id.split('?')[0].endsWith('.css'))return {code:code.replace(/\(hover:\s*hover\)/g,'(hover: none)'),map:null};}}] });
    await server.listen();
    console.log('READY: synthetic before/after panel only at http://127.0.0.1:5174/__phase6_action_token?version=before&state=populated&theme=light');
    const stop=async()=>{await server.close();process.stdin.pause();console.log('Visual fixture stopped.');process.exit(0);};
    process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{if(s.trim()==='stop')stop();});
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
