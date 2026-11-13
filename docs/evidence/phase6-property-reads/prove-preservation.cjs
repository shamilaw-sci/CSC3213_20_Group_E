const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const evidence = __dirname;
const parentPath = path.join(root, 'backend-node/controllers/propertyController.js');
const childPath = path.join(root, 'backend-node/controllers/property/propertyReadController.js');
const names = ['getProperties', 'getMyProperties', 'getPropertyById'];
const normalize = source => source.replace(/\r\n/g, '\n');
const before = normalize(fs.readFileSync(path.join(evidence, 'propertyController.before.js'), 'utf8'));
const chunk = (source, name) => {
    const start = source.indexOf(`const ${name} = async(req, res, next) => {`);
    if (start < 0) throw new Error(`Missing handler ${name}`);
    const end = source.indexOf('\n};', start) + 3;
    if (end < start) throw new Error(`Missing end ${name}`);
    return source.slice(start, end);
};
const imported = "const { getProperties, getMyProperties, getPropertyById } = require('./property/propertyReadController');\n";
if (process.argv.includes('--extract')) {
    let parent = before;
    for (const name of names) parent = parent.replace(chunk(before, name) + '\n\n', '');
    parent = imported + parent;
    const child = "const propertyRepository = require('../../repositories/propertyRepository');\n\n" + names.map(name => chunk(before, name)).join('\n\n') + '\n\nmodule.exports = { getProperties, getMyProperties, getPropertyById };\n';
    fs.mkdirSync(path.dirname(childPath), { recursive: true });
    fs.writeFileSync(childPath, child, 'utf8');
    fs.writeFileSync(parentPath, parent, 'utf8');
}
const assert = require('assert/strict');
const parent = normalize(fs.readFileSync(parentPath, 'utf8'));
const child = normalize(fs.readFileSync(childPath, 'utf8'));
let reconstructed = parent.replace(imported, '');
for (const name of [...names].reverse()) {
    assert.equal(chunk(child, name), chunk(before, name), `${name}: copied body`);
    const originalChunk = chunk(before, name);
    const originalEnd = before.indexOf(originalChunk) + originalChunk.length + 2;
    const successor = before.slice(originalEnd).match(/^(?:const [^\n]+|\/\*\*)/)[0];
    reconstructed = reconstructed.replace(successor, originalChunk + '\n\n' + successor);
}
assert.equal(reconstructed, before, 'Entire parent reconstructed exactly after newline normalization');
const exportBlock = source => source.slice(source.lastIndexOf('module.exports = '));
assert.equal(exportBlock(parent), exportBlock(before), 'Facade exports unchanged');
const expectedChild = "const propertyRepository = require('../../repositories/propertyRepository');\n\n" + names.map(name => chunk(before, name)).join('\n\n') + '\n\nmodule.exports = { getProperties, getMyProperties, getPropertyById };\n';
assert.equal(child, expectedChild, 'Child contains only approved dependency, copied bodies and exports');
console.log('PASS: 3 exact copied bodies; normalized whole-parent reconstruction; unchanged facade export block; exact child contents.');

