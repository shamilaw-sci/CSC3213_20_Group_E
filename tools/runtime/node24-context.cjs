const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const blocked=name=>name.toLowerCase().startsWith('.env') || name.toLowerCase()==='.npmrc'
    || ['node_modules','.git','dist','coverage','.agents','.codex'].includes(name.toLowerCase())
    || /\.(pem|key|p12|pfx)$/i.test(name);
function copyFiltered(source,destination,entries) {
    assert.ok(!fs.lstatSync(source).isSymbolicLink(),'Source symbolic link refused');
    assert.ok(!fs.lstatSync(destination).isSymbolicLink(),'Destination symbolic link refused');
    const src=fs.realpathSync(source),dst=fs.realpathSync(destination);
    const relative=path.relative(src,dst);
    assert.ok(relative && (relative==='..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative)),
        'Destination must be outside source');
    const copied=[];
    function copy(name,from,to,prefix='') {
        if(blocked(name))return;
        const file=path.join(from,name),target=path.join(to,name),stat=fs.lstatSync(file);
        assert.ok(!stat.isSymbolicLink(),'Source symbolic link refused');
        if(stat.isDirectory()){
            fs.mkdirSync(target,{recursive:true});
            for(const child of fs.readdirSync(file).sort())copy(child,file,target,prefix+name+'/');
        }else{
            assert.ok(stat.isFile(),'Only regular source files allowed');
            fs.copyFileSync(file,target,fs.constants.COPYFILE_EXCL);copied.push(prefix+name);
        }
    }
    for(const name of entries || fs.readdirSync(src).sort()){
        assert.ok(name===path.basename(name) && name!=='.' && name!=='..','Invalid source entry');
        copy(name,src,dst);
    }
    return copied.sort();
}
const isLocalDockerEndpoint=endpoint=>[
    'npipe:////./pipe/dockerDesktopLinuxEngine',
    'npipe:////./pipe/docker_engine'
].includes(endpoint);
module.exports={copyFiltered,isLocalDockerEndpoint};
