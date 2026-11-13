import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '../../../frontend-react/node_modules/@babel/parser/lib/index.js';
const parentPath = 'frontend-react/src/pages/SellerDashboard.jsx';
const original = fs.readFileSync('docs/evidence/phase6-seller-panels/SellerDashboard.before.jsx', 'utf8').replace(/\r\n/g, '\n');
const current = fs.readFileSync(parentPath, 'utf8').replace(/\r\n/g, '\n');
let restored = current;
for (const name of ['SellerListingsPanel', 'SellerConversationsPanel']) {
  const component = fs.readFileSync(`frontend-react/src/components/dashboard/${name}.jsx`, 'utf8').replace(/\r\n/g, '\n');
  const root = component.slice(component.indexOf('    return (\n') + '    return (\n'.length, component.lastIndexOf('\n    );'));
  restored = restored.replace(new RegExp(`^import ${name} from .*;\\r?\\n`, 'm'), '');
  restored = restored.replace(new RegExp(`^ +<${name} [^\\n]+ />`, 'm'), () => root);
}
assert.equal(current.slice(current.indexOf('const formatLKR'), current.indexOf('const SellerDashboard')), original.slice(original.indexOf('const formatLKR'), original.indexOf('const SellerDashboard')), 'Helper source unchanged');
const normalized = text => text.replace(/\r\n/g, '\n');
assert.equal(normalized(restored), normalized(original), 'Restored parent must equal original source');
const statements = source => {
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const declaration = ast.program.body.find(node => node.type === 'VariableDeclaration' && node.declarations.some(d => d.id.name === 'SellerDashboard'));
  return declaration.declarations[0].init.body.body.filter(node => node.type !== 'ReturnStatement').map(node => source.slice(node.start, node.end));
};
assert.deepEqual(statements(normalized(current)), statements(normalized(original)), 'All parent non-return statements must remain identical');
console.log(`PASS: restored parent matches original normalized text; all ${statements(normalized(current)).length} parent non-return statements unchanged.`);
