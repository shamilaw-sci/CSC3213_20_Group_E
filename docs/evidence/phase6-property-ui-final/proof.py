from pathlib import Path
import json
base=Path('docs/evidence/phase6-property-ui-final')
b=(base/'PropertyDetails.before.jsx').read_text(encoding='utf-8')
p=Path('frontend-react/src/pages/PropertyDetails.jsx').read_text(encoding='utf-8')
for item in json.loads((base/'manifest.json').read_text(encoding='utf-8')):
 name=item['name'];c=Path('frontend-react/src/components/property/details/'+name+'.jsx').read_text(encoding='utf-8')
 assert c==item['header']+item['body']+item['footer']
 p=p.replace("import "+name+" from '../components/property/details/"+name+"';\n",'')
 p=p.replace(item['call'],item['body'])
assert p==b
print('PASS exact children and complete normalized original page incl statements/effects/imports')
