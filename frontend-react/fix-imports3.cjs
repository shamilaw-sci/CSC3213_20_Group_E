const fs = require('fs');
const path = require('path');
const componentsDir = 'src/pages/agent/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));
files.forEach(f => {
  const filepath = path.join(componentsDir, f);
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/from '\.\.\/\.\.\//g, "from '../../../");
  content = content.replace(/from "\.\.\/\.\.\//g, 'from "../../../');
  fs.writeFileSync(filepath, content);
});
console.log('Fixed imports again');
