from pathlib import Path
b=Path('docs/evidence/phase6-agent-public/agentController.before.js').read_text(encoding='utf-8')
p=Path('backend-node/controllers/agentController.js').read_text(encoding='utf-8')
c=Path('backend-node/controllers/agent/publicAgentController.js').read_text(encoding='utf-8')
chunk=c.split('\n\n',1)[1].rsplit('module.exports',1)[0]
assert p.replace("const { getAgents, getAgentProfile } = require('./agent/publicAgentController');\n\n",chunk)==b
print('PASS normalized complete-controller reconstruction')
