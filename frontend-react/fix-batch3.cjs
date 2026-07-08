const fs = require('fs');
const path = require('path');
const oxc = require('oxc-parser');

function walk(dir, res) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p, res);
        else if (p.endsWith('.jsx')) res.push(p);
    });
}
let files = [];
walk('src', files);

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    // 1. Fix duplicate props using regex
    content = content.replace(/aria-label="Accessible interactive control"(\s*)aria-label="Accessible interactive control"/g, 'aria-label="Accessible interactive control"');
    
    // Duplicate className is a bit harder because it could be className="a" className="b"
    // Just fix the known ones
    content = content.replace(/className="([^"]*)"(\s*)className="([^"]*)"/g, 'className="$1 $3"');

    // Parse the new content
    let ast;
    try {
        ast = oxc.parseSync(content, { sourceFilename: f, sourceText: content });
    } catch(e) {
        // If it fails to parse (e.g. syntax error or oxc error), just write the regex changes and return
        if (content !== original) fs.writeFileSync(f, content);
        return;
    }

    let edits = [];
    function traverse(node) {
        if (!node) return;
        if (Array.isArray(node)) { node.forEach(traverse); return; }
        if (typeof node === 'object') {
            if (node.type === 'JSXElement') {
                let opening = node.openingElement;
                let closing = node.closingElement;
                if (opening.name.type !== 'JSXIdentifier') return;
                let name = opening.name.name;
                
                // Fix click-events-have-key-events and no-static-element-interactions
                if (['div', 'span', 'li', 'p', 'article', 'section'].includes(name)) {
                    let hasOnClick = opening.attributes.some(a => a.type === 'JSXAttribute' && a.name.name === 'onClick');
                    let hasOnKeyDown = opening.attributes.some(a => a.type === 'JSXAttribute' && (a.name.name === 'onKeyDown' || a.name.name === 'onKeyUp' || a.name.name === 'onKeyPress'));
                    
                    if (hasOnClick && !hasOnKeyDown) {
                        let hasTabIndex = opening.attributes.some(a => a.type === 'JSXAttribute' && a.name.name === 'tabIndex');
                        let hasRole = opening.attributes.some(a => a.type === 'JSXAttribute' && a.name.name === 'role');
                        
                        let insert = '';
                        if (!hasTabIndex) insert += ' tabIndex={0}';
                        if (!hasRole) insert += ' role="button"';
                        insert += ` onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}`;
                        
                        edits.push({ start: opening.name.end, text: insert });
                    }
                }
                
                // Fix anchor-is-valid
                if (name === 'a') {
                    let hasHref = opening.attributes.some(a => a.type === 'JSXAttribute' && a.name.name === 'href');
                    let hasOnClick = opening.attributes.some(a => a.type === 'JSXAttribute' && a.name.name === 'onClick');
                    
                    if (!hasHref || (hasHref && opening.attributes.find(a => a.type === 'JSXAttribute' && a.name.name === 'href').value?.value === '#')) {
                        // Change 'a' to 'button'
                        edits.push({ start: opening.name.start, end: opening.name.end, text: 'button type="button" className="text-left cursor-pointer"' });
                        if (closing) {
                            edits.push({ start: closing.name.start, end: closing.name.end, text: 'button' });
                        }
                    }
                }
            }
            Object.values(node).forEach(traverse);
        }
    }
    
    traverse(ast.program);
    
    edits.sort((a,b) => b.start - a.start);
    edits.forEach(e => {
        if (e.end) {
            content = content.slice(0, e.start) + e.text + content.slice(e.end);
        } else {
            content = content.slice(0, e.start) + e.text + content.slice(e.start);
        }
    });

    if (content !== original) {
        fs.writeFileSync(f, content);
    }
});

console.log('Batch 3 fixes applied.');
