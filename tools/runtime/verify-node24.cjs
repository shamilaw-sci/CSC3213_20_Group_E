// Approved local image builds only. No Compose startup, real env files or host mounts.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {randomUUID,createHash}=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {copyFiltered,isLocalDockerEndpoint}=require('./node24-context.cjs');
const root=path.resolve(__dirname,'../..');
const evidence=path.join(root,'docs/evidence/phase7-node24-runtime');
const digest=data=>createHash('sha256').update(data).digest('hex');
const lines=text=>[...new Set(text.trim().split(/\r?\n/).filter(Boolean))].sort();
const entries={
    'backend-node':['Dockerfile','.dockerignore','package.json','package-lock.json','server.js','api','assets','config','controllers','middleware','repositories','routes','utils','validators'],
    'frontend-react':['Dockerfile','.dockerignore','package.json','package-lock.json','index.html','nginx.conf','vite.config.js','jsconfig.json','tsconfig.json','tsconfig.node.json','public','src']
};
const backendSmoke=String.raw`
const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net');
assert.equal(process.versions.node.split('.')[0],'24');assert.equal(process.getuid(),1000);
let allowedPort=null,blocked=0;const connect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){const v=Array.isArray(args[0])?args[0]:args;const o=typeof v[0]==='object'?v[0]:{port:v[0],host:v[1]};
 if(o.host!=='127.0.0.1'||Number(o.port)!==allowedPort){blocked++;throw Error('Unexpected smoke-test socket');}return connect.apply(this,args);};
function scan(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(item.name==='node_modules')continue;
 assert.ok(!item.name.toLowerCase().startsWith('.env')&&item.name.toLowerCase()!=='.npmrc');if(item.isDirectory())scan(dir+'/'+item.name);}}
scan('/app');
for(const name of ['@supabase/supabase-js','apple-signin-auth','bcryptjs','pg','axios','express','jsonwebtoken'])require(name);
const app=require('./server');
const server=app.listen(0,'127.0.0.1',async()=>{allowedPort=server.address().port;try{
 const response=await fetch('http://127.0.0.1:'+allowedPort+'/health',{signal:AbortSignal.timeout(5000)});
 assert.equal(response.status,200);assert.equal((await response.json()).status,'healthy');assert.equal(blocked,0);
 server.close(()=>{console.log('NODE24_SMOKE '+JSON.stringify({node:process.versions.node,uid:process.getuid(),health:200,unexpectedSockets:blocked}));process.exit(0);});
 }catch(err){console.error(err.message);process.exit(1);}});`;
async function main(){
    const run=randomUUID(),dir=path.join(evidence,run);fs.mkdirSync(dir,{recursive:true});
    let stage='local Docker endpoint',baseline;
    const owned=[];
    const receipt={run,startedAt:new Date().toISOString(),contexts:{},images:{},smokes:{}};
    const save=()=>fs.writeFileSync(path.join(dir,'receipt.private.json'),JSON.stringify(receipt,null,2));
    const env=Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP','COMSPEC','PATHEXT','USERPROFILE','APPDATA','LOCALAPPDATA']
        .filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
    function docker(args,label='docker',timeout=30000){
        const result=spawnSync('docker',args,{encoding:'utf8',env,timeout,maxBuffer:16*1024*1024});
        fs.appendFileSync(path.join(dir,`${label}.private.log`),String(result.stdout||'')+String(result.stderr||''));
        assert.equal(result.status,0,`Docker ${label} failed; private diagnostics retained`);return String(result.stdout||'');
    }
    const inventory=()=>({containers:lines(docker(['container','ls','-a','--no-trunc','--format','{{.ID}}|{{.Names}}|{{.State}}'])),
        images:lines(docker(['image','ls','-q','--no-trunc'])),networks:lines(docker(['network','ls','--no-trunc','--format','{{.ID}}|{{.Name}}'])),
        volumes:lines(docker(['volume','ls','--format','{{.Name}}']))});
    function checkContainer(item,image){
        assert.equal(item.Image,image);assert.equal(item.Config.Labels['thirasara.node24.run'],run);
        assert.equal(item.HostConfig.NetworkMode,'none');assert.equal(item.HostConfig.Privileged,false);
        assert.equal(item.HostConfig.ReadonlyRootfs,true);assert.ok(!(item.HostConfig.Binds||[]).length);
        assert.equal(Object.keys(item.HostConfig.PortBindings||{}).length,0);
        assert.ok(item.Mounts.every(m=>m.Type==='tmpfs'));
    }
    function create(name,image,command,{frontend=false,environment=[]}={}){
        const args=['create','--name',`thirasara-node24-${run}-${name}`,'--label',`thirasara.node24.run=${run}`,
            '--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--tmpfs','/tmp:rw,nosuid,size=64m'];
        if(frontend)args.push('--tmpfs','/var/cache/nginx:rw,nosuid,size=64m','--tmpfs','/var/run:rw,nosuid,size=8m',
            '--cap-add','CHOWN','--cap-add','SETUID','--cap-add','SETGID','--cap-add','NET_BIND_SERVICE');
        for(const value of environment)args.push('--env',value);
        args.push(image,...command);
        const id=docker(args,`${name}-create`).trim();assert.match(id,/^[a-f0-9]{64}$/);
        owned.push({id,image,name});
        checkContainer(JSON.parse(docker(['inspect',id],`${name}-inspect`))[0],image);
        return id;
    }
    function remove(item){
        const state=JSON.parse(docker(['inspect',item.id],`${item.name}-final-inspect`))[0];
        assert.equal(state.Id,item.id);checkContainer(state,item.image);
        if(state.State.Running)docker(['stop','--time','5',item.id],`${item.name}-stop`);
        docker(['rm',item.id],`${item.name}-remove`);item.removed=true;
    }
    const imageInfo=tag=>{
        const i=JSON.parse(docker(['image','inspect',tag],'image-inspect'))[0];
        return {id:i.Id,digests:i.RepoDigests,os:i.Os,architecture:i.Architecture,user:i.Config.User,entrypoint:i.Config.Entrypoint,labels:i.Config.Labels};
    };
    try{
        assert.equal(process.argv.length,2);assert.equal(process.versions.node.split('.')[0],'24');
        const context=docker(['context','show']).trim();
        const info=JSON.parse(docker(['context','inspect',context]))[0];
        assert.ok(isLocalDockerEndpoint(info.Endpoints.docker.Host),'Only exact local Docker Desktop pipes allowed');
        receipt.dockerContext={name:context,endpoint:info.Endpoints.docker.Host};
        baseline=inventory();receipt.baseline=baseline;save();
        stage='dependency graph and filtered source contexts';
        const expected=JSON.parse(fs.readFileSync(path.join(evidence,'dependency-baseline.json'),'utf8'));
        for(const app of Object.keys(entries)){
            const lock=JSON.parse(fs.readFileSync(path.join(root,app,'package-lock.json'),'utf8'));
            assert.equal(lock.packages[''].engines.node,'>=24 <25');delete lock.packages[''].engines;
            assert.equal(digest(JSON.stringify(lock)),expected[app]);
            const contextDir=path.join(dir,app);fs.mkdirSync(contextDir);
            const files=copyFiltered(path.join(root,app),contextDir,entries[app]);
            receipt.contexts[app]={files:files.map(file=>({file,sha256:digest(fs.readFileSync(path.join(contextDir,file)))}))};
        }
        save();console.log('PASS: filtered contexts contain no host env/npmrc/dependencies; dependency graphs unchanged.');
        stage='official cached-or-pulled base images';
        const initialTags=lines(docker(['image','ls','--format','{{.Repository}}:{{.Tag}}']));
        for(const tag of ['node:24-alpine','nginx:1.27-alpine']){
            if(!initialTags.includes(tag)){console.log(`Obtaining approved base ${tag}.`);docker(['pull',tag],'base-pull',600000);}
            receipt.images[tag]=imageInfo(tag);save();
        }
        const proxyArgs=['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy']
            .flatMap(k=>['--build-arg',`${k}=`]);
        for(const [name,app,target] of [['backend','backend-node',null],['frontend-builder','frontend-react','builder'],['frontend','frontend-react',null]]){
            stage=`isolated ${name} image build`;console.log(`Building approved ${name} verification image.`);
            const tag=`thirasara-node24-${name}:${run}`;
            const args=['build','--pull=false','--progress=plain','--label',`thirasara.node24.run=${run}`,'--tag',tag,...proxyArgs];
            if(target)args.push('--target',target);
            if(app==='frontend-react')args.push('--build-arg','VITE_API_URL=http://127.0.0.1:9/api','--build-arg','VITE_MAP_API_URL=http://127.0.0.1:9/api/map/search');
            args.push(path.join(dir,app));docker(args,`${name}-build`,900000);
            receipt.images[name]={tag,...imageInfo(tag)};assert.equal(receipt.images[name].labels['thirasara.node24.run'],run);save();
        }
        stage='backend non-root/import/health/network smoke';
        assert.equal(receipt.images.backend.user,'node');
        assert.deepEqual(receipt.images.backend.entrypoint,['/usr/bin/dumb-init','--']);
        const backend=create('backend',receipt.images.backend.id,['node','-e',backendSmoke],{environment:[
            'NODE_ENV=test','NODE_OPTIONS=--max-old-space-size=512 --max-semi-space-size=4','JWT_SECRET=node24-synthetic-smoke-only',
            'SUPABASE_URL=http://127.0.0.1:9','SUPABASE_KEY=node24-synthetic-key','CLIENT_URL=http://127.0.0.1',
            'EMAIL_HOST=127.0.0.1','EMAIL_PORT=9','GEMINI_API_KEY=node24-synthetic-key']});
        const output=docker(['start','--attach',backend],'backend-smoke',30000);
        const backendState=JSON.parse(docker(['inspect',backend]))[0];assert.equal(backendState.State.ExitCode,0);
        receipt.smokes.backend=JSON.parse(output.match(/NODE24_SMOKE (\{[^\r\n]+\})/)[1]);remove(owned.find(i=>i.id===backend));save();
        stage='frontend builder actual Node version';
        const builder=create('builder',receipt.images['frontend-builder'].id,['node','-e',
            "if(process.versions.node.split('.')[0]!=='24')process.exit(1);console.log(process.versions.node)"]);
        const builderVersion=docker(['start','--attach',builder],'builder-smoke').trim();
        assert.match(builderVersion,/^24\./);assert.equal(JSON.parse(docker(['inspect',builder]))[0].State.ExitCode,0);
        receipt.smokes.frontendBuilderNode=builderVersion;remove(owned.find(i=>i.id===builder));save();
        stage='isolated frontend Nginx/config/health/static smoke';
        const frontend=create('frontend',receipt.images.frontend.id,[],{frontend:true});
        docker(['start',frontend],'frontend-start');docker(['exec',frontend,'nginx','-t'],'frontend-config');
        let healthy=false;
        for(let attempt=0;attempt<20;attempt++){
            try{if(docker(['exec',frontend,'wget','-q','-O','-','http://127.0.0.1/health'],'frontend-health',5000).trim()==='ok'){healthy=true;break;}}
            catch{/* Keep bounded startup diagnostics private. */}
            await new Promise(resolve=>setTimeout(resolve,200));
        }
        assert.ok(healthy,'New frontend container did not become healthy');
        const html=docker(['exec',frontend,'wget','-q','-O','-','http://127.0.0.1/'],'frontend-index');
        assert.ok(html.includes('id="root"'));
        const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[A-Za-z0-9._-]+\.(?:js|css))"/g)].map(m=>m[1]);
        assert.ok(assets.length>0);
        for(const asset of assets)docker(['exec',frontend,'wget','-q','--spider',`http://127.0.0.1${asset}`],'frontend-assets');
        receipt.smokes.frontend={config:true,health:200,index:true,assets:assets.length,network:'none',publishedPorts:0};
        remove(owned.find(i=>i.id===frontend));save();
        receipt.passed=true;console.log('PASS: actual Node24 backend/builder; backend non-root imports/health and frontend Nginx/static smoke passed offline.');
    }catch(err){receipt.failureStage=stage;receipt.privateError=String(err.stack||err);process.exitCode=1;console.error(`FAIL: Node24 verification at ${stage}; private diagnostics retained.`);}
    finally{
        for(const item of owned.filter(i=>!i.removed).reverse())try{remove(item);}catch(err){receipt.cleanupError=String(err.stack||err);process.exitCode=1;}
        if(baseline)try{
            const after=inventory();assert.deepEqual(after.containers,baseline.containers);assert.deepEqual(after.networks,baseline.networks);assert.deepEqual(after.volumes,baseline.volumes);
            assert.ok(baseline.images.every(id=>after.images.includes(id)));receipt.retainedPreserved=true;
            console.log('PASS: all pre-existing container identities/states, networks, volumes and image IDs preserved; only new smoke containers removed.');
        }catch(err){receipt.preservationError=String(err.stack||err);process.exitCode=1;}
        receipt.finishedAt=new Date().toISOString();save();
    }
}
if(require.main===module)void main();
