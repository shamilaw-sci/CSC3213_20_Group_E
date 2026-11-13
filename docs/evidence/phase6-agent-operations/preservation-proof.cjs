const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');
const before = read('docs/evidence/phase6-agent-operations/agentController.before.js');
const groups = { agentCrmController: ['getAgentLeads', 'updateLeadMetadata', 'deleteLead'], buyerAppointmentController: ['getMyAppointments', 'cancelBuyerAppointment'] };
const block = (source, handler) => {
    const declaration = source.indexOf(`const ${handler} = async`);
    assert.ok(declaration >= 0, `missing ${handler}`);
    const start = source.lastIndexOf('// ', declaration);
    return source.slice(start, source.indexOf('\n};', declaration) + 3);
};
let reconstructed = read('backend-node/controllers/agentController.js');
for (const [moduleName, names] of Object.entries(groups)) {
    const child = read(`backend-node/controllers/agent/${moduleName}.js`);
    const blocks = names.map(name => {
        const copied = block(child, name); assert.equal(copied, block(before, name), `${name} exact handler/comments`); return copied;
    });
    assert.equal(child, `const agentRepository = require('../../repositories/agentRepository');\n\n${blocks.join('\n\n')}\n\nmodule.exports = { ${names.join(', ')} };\n`, `${moduleName} exact module`);
    reconstructed = reconstructed.replace(`const { ${names.join(', ')} } = require('./agent/${moduleName}');\n`, '');
}
const ordered = Object.values(groups).flat().map(name => ({ name, offset: before.indexOf(`const ${name} = async`) })).sort((a, b) => b.offset - a.offset);
for (const { name } of ordered) {
    const original = block(before, name);
    const end = before.indexOf(original) + original.length + 2;
    const followingComment = before.slice(end).match(/^\/\/[^\n]*/)[0];
    reconstructed = reconstructed.replace(followingComment, original + '\n\n' + followingComment);
}
assert.equal(reconstructed, before, 'normalized whole parent reconstructed exactly');
console.log('PASS: five exact handler/comment copies, exact child module shapes, normalized whole-parent reconstruction');
