const fs=require('fs');
const path=require('path');
const dir=path.join(__dirname,'src','components');
function p(d){
  for(const f of fs.readdirSync(d)){
    const F=path.join(d,f);
    if(fs.statSync(F).isDirectory()) p(F);
    else if(F.endsWith('.jsx')||F.endsWith('.js')){
      const R=path.relative(dir,F);
      if(R.includes(path.sep)){
        let c=fs.readFileSync(F,'utf8');
        let changed = false;
        c = c.replace(/from\s+['"]\.\.\/(context|hooks|utils|assets|pages)\/(.*?)['"]/g, "from '../../$1/$2'");
        if(c !== fs.readFileSync(F,'utf8')) {
          fs.writeFileSync(F,c);
          console.log('Fixed '+R);
        }
      }
    }
  }
}
p(dir);
