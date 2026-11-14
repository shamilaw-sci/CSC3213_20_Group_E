const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {copyFiltered,isLocalDockerEndpoint}=require('./node24-context.cjs');
test('copies regular app source while excluding secrets, dependencies and symlinks',()=>{
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'node24-context-'));
    const source=path.join(dir,'source'),destination=path.join(dir,'destination');
    fs.mkdirSync(source);fs.mkdirSync(destination);
    fs.mkdirSync(path.join(source,'nested'));fs.mkdirSync(path.join(source,'node_modules'));
    for(const file of ['app.js','.env','.env.local','.ENV.production','.env.example','.npmrc','private.key','nested/.env','node_modules/package.js'])
        fs.writeFileSync(path.join(source,file),'synthetic file only');
    const copied=copyFiltered(source,destination);
    assert.deepEqual(copied,['app.js']);
    assert.equal(fs.readFileSync(path.join(destination,'app.js'),'utf8'),'synthetic file only');
    assert.deepEqual(fs.readdirSync(path.join(destination,'nested')),[]);
    assert.equal(fs.existsSync(path.join(destination,'node_modules')),false);
});
test('refuses source symlink instead of reading outside the context',()=>{
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'node24-link-'));
    const source=path.join(dir,'source'),destination=path.join(dir,'destination'),outside=path.join(dir,'outside');
    fs.mkdirSync(source);fs.mkdirSync(destination);fs.mkdirSync(outside);
    fs.symlinkSync(outside,path.join(source,'link'),process.platform==='win32'?'junction':'dir');
    assert.throws(()=>copyFiltered(source,destination),/symbolic link/i);
});
test('refuses a destination inside the source tree',()=>{
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'node24-nested-'));
    fs.mkdirSync(path.join(dir,'nested'));
    assert.throws(()=>copyFiltered(dir,path.join(dir,'nested')),/destination/i);
});
test('accepts the exact local Docker Desktop pipe names',()=>{
    assert.equal(isLocalDockerEndpoint('npipe:////./pipe/dockerDesktopLinuxEngine'),true);
    assert.equal(isLocalDockerEndpoint('npipe:////./pipe/docker_engine'),true);
});
for(const endpoint of ['npipe://remote-host/pipe/docker_engine','npipe:////remote-host/pipe/dockerDesktopLinuxEngine','tcp://127.0.0.1:2375','ssh://host'])
    test(`refuses nonlocal or unapproved Docker endpoint ${endpoint}`,()=>assert.equal(isLocalDockerEndpoint(endpoint),false));
