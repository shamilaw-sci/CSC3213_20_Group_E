from pathlib import Path
import re
p=Path('backend-node/controllers/adminController.js').read_text(encoding='utf-8')
b=Path('docs/evidence/phase6-admin-remaining/adminController.before.js').read_text(encoding='utf-8')
for name in ['adminReportController','adminSettingsController','adminRoleRequestController']:
 c=Path('backend-node/controllers/admin/'+name+'.js').read_text(encoding='utf-8')
 body=c.split('\n\n',1)[1].rsplit('module.exports =',1)[0]
 p=re.sub(r"const \{ [^\n]+ \} = require\('./admin/"+name+r"'\);\n\n",lambda m:body,p)
assert p==b
print('PASS complete normalized parent reconstructed from exact child bodies')
