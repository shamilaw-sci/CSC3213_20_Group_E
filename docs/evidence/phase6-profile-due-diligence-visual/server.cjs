// Private synthetic presentation-only observation tool. No application .env/API/auth.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pathToFileURL } = require('node:url');
const frontend = path.resolve(__dirname, '../../../frontend-react');
const fromFrontend = name => pathToFileURL(require.resolve(name, { paths: [frontend] })).href;
const entry = "import React,{useState} from 'react';\nimport {createRoot} from 'react-dom/client';\nimport {LazyMotion,domAnimation,m} from 'framer-motion';\nimport BeforePanel from 'virtual:phase6-before';\nimport DueDiligencePanel from '/src/components/profile/DueDiligencePanel.jsx';\nimport '/src/index.css';\nconst params=new URLSearchParams(location.search);\nfunction Fixture(){const defaults={\r\n        extractSearch: true,\r\n        titleRegistration: false,\r\n        surveyPlan: true,\r\n        streetLine: false,\r\n        nonVesting: false,\r\n        encumbranceFree: false\r\n    };const state=params.get('state');\nconst [checkedItems,setCheckedItems]=useState(()=>state==='all'?Object.fromEntries(Object.keys(defaults).map(k=>[k,true])):state==='none'?Object.fromEntries(Object.keys(defaults).map(k=>[k,false])):defaults);\nconst toggleCheckItem = (key) => {\r\n        setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));\r\n    };\nreturn <LazyMotion features={domAnimation}>{params.get('version')==='after'?<m.div key=\"dueDiligence\" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><DueDiligencePanel checkedItems={checkedItems} onToggleCheckItem={toggleCheckItem}/></m.div>:<BeforePanel checkedItems={checkedItems} toggleCheckItem={toggleCheckItem}/>}</LazyMotion>;\n}createRoot(document.getElementById('fixture')).render(<Fixture/>);";

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
                if(!req.url?.startsWith('/__phase6_due_diligence')) return next();
                const p=new URL(req.url,'http://127.0.0.1:5174');
                const dark=p.searchParams.get('theme')==='dark';
                const html=await vite.transformIndexHtml(p.pathname,'<!doctype html><html class="'+(dark?'dark':'light')+'"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private Phase 6 panel comparison</title></head><body><main id="fixture" style="max-width:1000px;margin:0 auto;padding:24px"></main><script type="module">import "virtual:phase6-entry";</script></body></html>');
                res.setHeader('Content-Type','text/html');res.end(html);
            }); }
        }] });
    await server.listen();
    console.log('READY: synthetic before/after panel only at http://127.0.0.1:5174/__phase6_due_diligence?version=before&state=populated&theme=light');
    const stop=async()=>{await server.close();process.stdin.pause();console.log('Visual fixture stopped.');process.exit(0);};
    process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{if(s.trim()==='stop')stop();});
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
