from pathlib import Path
import subprocess,json,re
root=Path.cwd()
def git(*args): return subprocess.check_output(['git','-c','core.fsmonitor=false',*args])
new=git('ls-files','--others','--exclude-standard','-z').decode().split('\0')
changed=git('diff','--name-only','-z').decode().split('\0')
files=sorted({p for p in new+changed if p and not p.startswith('docs/evidence/')})
problems=[]
for name in files:
 try: text=Path(name).read_bytes().decode('utf-8-sig')
 except Exception as error: problems.append([name,str(error)]);continue
 if re.search(r'AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text): problems.append([name,'credential-shaped content'])
 if name.endswith('.md'):
  for target in re.findall(r'!?\[[^\]]*\]\(([^\n)]+)\)',text):
   target=target.strip('<>').split('#')[0]
   if target and not re.match(r'^(?:https?:|mailto:|app:|plugin:|codex:)',target) and not (Path(name).parent/target).exists(): problems.append([name,'missing link '+target])
index=git('diff','--cached','--name-only').decode().strip()
if index: problems.append(['index','not empty'])
subprocess.run(['git','-c','core.fsmonitor=false','diff','--check'],check=True)
r={'files':len(files),'indexEmpty':not index,'problems':problems};Path('docs/evidence/phase6-final/hygiene.json').write_text(json.dumps(r,indent=2),encoding='utf-8');print(r)
assert not problems
