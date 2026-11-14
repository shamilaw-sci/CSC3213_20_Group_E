const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const git = args => cp.execFileSync('git', ['-c','core.fsmonitor=false',...args], {encoding:'utf8'});
const fresh = git(['ls-files','--others','--exclude-standard','-z']).split('\0').filter(Boolean);
const changed = git(['diff','--name-only','-z']).split('\0').filter(Boolean);
const files = [...new Set([...fresh,...changed])].filter(p => !p.startsWith('docs/evidence/') && fs.existsSync(p));
const dotenv = require(path.resolve('backend-node/node_modules/dotenv'));
const env = dotenv.parse(fs.readFileSync('backend-node/.env'));
const secrets = Object.entries(env).filter(([k,v]) => /SECRET|PASSWORD|TOKEN|KEY/i.test(k) && v.length >= 12).map(([,v]) => v);
let issues = 0;
for (const file of files) {
  const content = fs.readFileSync(file,'utf8');
  if (secrets.some(value => content.includes(value)) || /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(content)) {
    console.log('Credential pattern found in ' + file); issues++;
  }
  if (fresh.includes(file)) {
    const check = cp.spawnSync('git',['-c','core.fsmonitor=false','diff','--no-index','--check','--','NUL',file],{encoding:'utf8'});
    if (check.stdout.trim() || check.status > 1) { console.log('Whitespace check failed for ' + file); issues++; }
  }
}
git(['diff','--check']);
if (git(['diff','--cached','--name-only']).trim()) { console.log('Index is not empty'); issues++; }
console.log(JSON.stringify({filesScanned:files.length,issues,indexEmpty:!git(['diff','--cached','--name-only']).trim()}));
process.exitCode = issues ? 1 : 0;
