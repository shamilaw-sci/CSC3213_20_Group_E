const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');
const before = read('docs/evidence/phase6-agent-remaining/agentController.before.js');
const groups = { agentBookingController: ['postReview', 'bookViewing'], agentProfileController: ['updateAgentProfile', 'resubmitApplication'], agentDashboardController: ['getDashboardStats'] };
const block = (source, handler) => {
    const declaration = source.indexOf(`const ${handler} = async`);
    assert.ok(declaration >= 0, `missing ${handler}`);
    return source.slice(source.lastIndexOf('// ', declaration), source.indexOf('\n};', declaration) + 3);
};
let expected = before;
for (const [moduleName, names] of Object.entries(groups)) {
    const child = read(`backend-node/controllers/agent/${moduleName}.js`);
    const blocks = names.map(name => {
        const copied = block(child, name);
        assert.equal(copied, block(before, name), `${name} exact handler/comments`);
        expected = expected.replace(block(before, name) + '\n\n', '');
        return copied;
    });
    assert.equal(child, `const agentRepository = require('../../repositories/agentRepository');\nconst supabase = require('../../config/supabase');\n\n${blocks.join('\n\n')}\n\nmodule.exports = { ${names.join(', ')} };\n`, `${moduleName} exact whole module`);
}
const imports = Object.entries(groups).map(([file, names]) => `const { ${names.join(', ')} } = require('./agent/${file}');`).join('\n');
expected = expected.replace('\n\nmodule.exports', `\n${imports}\n\nmodule.exports`);
assert.equal(read('backend-node/controllers/agentController.js'), expected, 'normalized complete parent with only exact relocation/import additions');
console.log('PASS: five exact handler/comment copies; three exact child modules; normalized complete parent; retained dependency imports and export order');
