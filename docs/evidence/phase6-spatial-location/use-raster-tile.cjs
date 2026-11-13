const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'server.cjs');
let s=fs.readFileSync(file,'utf8');
const a=s.indexOf("res.setHeader('Content-Type','image/svg+xml');"),b=s.indexOf('return;}',a);
if(a<0||b<0)throw new Error('SVG handler not found');
s=s.slice(0,a)+"res.setHeader('Content-Type','image/png');res.end(fs.readFileSync(path.join(__dirname,'tile.png')));"+s.slice(b);
fs.writeFileSync(file,s);
