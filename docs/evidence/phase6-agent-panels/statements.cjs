const fs = require('fs');
const parser = require('../../../frontend-react/node_modules/@babel/parser');
for (const file of ['docs/evidence/phase6-agent-panels/Dashboard.before.jsx', 'frontend-react/src/pages/agent/Dashboard.jsx']) {
  const ast = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  const declaration = ast.program.body.find(node => node.type === 'VariableDeclaration' && node.declarations[0].id.name === 'AgentDashboard');
  const count = declaration.declarations[0].init.body.body.filter(node => node.type !== 'ReturnStatement').length;
  if (count !== 36) throw new Error(`${file}: expected 36 statements, got ${count}`);
  console.log(`${file}: ${count} non-return statements`);
}

