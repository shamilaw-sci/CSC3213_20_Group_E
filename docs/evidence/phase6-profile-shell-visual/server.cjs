// Private synthetic presentation-only observation tool. No application .env/API/auth.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pathToFileURL } = require('node:url');
const frontend = path.resolve(__dirname, '../../../frontend-react');
const fromFrontend = name => pathToFileURL(require.resolve(name, { paths: [frontend] })).href;
const entry = "import React,{useState} from 'react';\nimport {createRoot} from 'react-dom/client';\nimport {LazyMotion,domAnimation} from 'framer-motion';\nimport BeforePanel from 'virtual:phase6-before';\nimport ProfileHeader from '/src/components/profile/ProfileHeader.jsx';\nimport ProfileSummaryCards from '/src/components/profile/ProfileSummaryCards.jsx';\nimport ProfileTabs from '/src/components/profile/ProfileTabs.jsx';\nimport '/src/index.css';\nconst params=new URLSearchParams(location.search),scenario=params.get('state'),noop=()=>{};\nconst picture='data:image/svg+xml,'+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><rect width=\"100\" height=\"100\" fill=\"#64748b\"/></svg>');\nconst fallback=scenario==='fallback';\nconst user=fallback?{}:{name:'Synthetic '+scenario,role:scenario,email:'fixture@example.test',phone:scenario==='PENDING_AGENT'?'':'0000000000'};\nconst avatarUrl=fallback||scenario==='PENDING_AGENT'?'':picture;\nconst appointmentCount=fallback?0:2,favoriteCount=fallback?0:3,savedSearchCount=fallback?0:4,unreadMessagesCount=fallback||scenario==='BUYER'?0:5;\nconst appointments=Array(appointmentCount).fill({}),favorites=Array(favoriteCount).fill({}),savedSearches=Array(savedSearchCount).fill({});\nfunction Fixture(){const [activeTab,setActiveTab]=useState(scenario==='AGENT'?'agentSettings':scenario==='PENDING_AGENT'?'appointments':scenario==='BUYER'?'favorites':'profile');const handleTabChange=setActiveTab;\nreturn <LazyMotion features={domAnimation}>{params.get('version')==='after'?<><ProfileHeader user={user} avatarUrl={avatarUrl} onAvatarChange={noop} onExploreListings={noop} onFindAgents={noop}><ProfileSummaryCards appointmentCount={appointmentCount} favoriteCount={favoriteCount} savedSearchCount={savedSearchCount} unreadMessagesCount={unreadMessagesCount} onTabChange={handleTabChange} onMessages={noop}/></ProfileHeader><div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 flex-1\"><ProfileTabs userRole={user.role} activeTab={activeTab} appointmentCount={appointmentCount} favoriteCount={favoriteCount} savedSearchCount={savedSearchCount} onTabChange={handleTabChange}/></div></>:<BeforePanel user={user} avatarUrl={avatarUrl} handleAvatarChange={noop} appointments={appointments} favorites={favorites} savedSearches={savedSearches} unreadMessagesCount={unreadMessagesCount} handleTabChange={handleTabChange} navigate={noop} activeTab={activeTab}/>}</LazyMotion>;\n}createRoot(document.getElementById('fixture')).render(<Fixture/>);";

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
                if(!req.url?.startsWith('/__phase6_profile_shell')) return next();
                const p=new URL(req.url,'http://127.0.0.1:5174');
                const dark=p.searchParams.get('theme')==='dark';
                const html=await vite.transformIndexHtml(p.pathname,'<!doctype html><html class="'+(dark?'dark':'light')+'"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private Phase 6 panel comparison</title></head><body><main id="fixture" style="max-width:1000px;margin:0 auto;padding:24px"></main><script type="module">import "virtual:phase6-entry";</script></body></html>');
                res.setHeader('Content-Type','text/html');res.end(html);
            }); }
        }] });
    await server.listen();
    console.log('READY: synthetic before/after panel only at http://127.0.0.1:5174/__phase6_profile_shell?version=before&state=populated&theme=light');
    const stop=async()=>{await server.close();process.stdin.pause();console.log('Visual fixture stopped.');process.exit(0);};
    process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{if(s.trim()==='stop')stop();});
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
