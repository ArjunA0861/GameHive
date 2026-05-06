const fs = require('fs');
const content = fs.readFileSync('c:/Users/ASUS/GameHive/src/pages/Profile.jsx', 'utf8');

let tags = []; // Array of objects { name, line }
let inTag = false;
let tagContent = '';
let inString = false;
let stringChar = '';
let line = 1;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\n') line++;
    
    if (inString) {
        if (char === stringChar && content[i-1] !== '\\') inString = false;
        continue;
    }
    if (char === "'" || char === '"' || char === '`') {
        inString = true;
        stringChar = char;
        continue;
    }

    if (char === '<') {
        const nextChar = content[i+1];
        if (nextChar && /[a-zA-Z/]/.test(nextChar)) {
            inTag = true;
            tagContent = '';
            continue;
        }
    }

    if (inTag) {
        if (char === '>') {
            inTag = false;
            processTag(tagContent, line);
            continue;
        }
        tagContent += char;
    }
}

function processTag(t, l) {
    t = t.trim().replace(/\r/g, ''); 
    if (t.endsWith('/')) return; // Self-closing
    if (t.startsWith('/')) {
        const name = t.substring(1).split(/\s/)[0];
        if (tags.length > 0) {
            const last = tags.pop();
            if (last.name !== name) {
                console.log(`Line ${l}: Mismatch! Closing </${name}> but expected </${last.name}> (opened at line ${last.line})`);
                // Put it back to keep tracking
                tags.push(last);
            }
        } else {
             console.log(`Line ${l}: Closing </${name}> but no tags open!`);
        }
    } else {
        const name = t.split(/\s/)[0];
        if (['img', 'input', 'br', 'hr', 'Navbar', 'Shield', 'Zap', 'Crown', 'Award', 'Camera', 'FileText', 'Users', 'Gamepad2', 'Quote', 'MapPin', 'Trophy', 'Edit2', 'X', 'Star'].includes(name)) {
            return;
        }
        tags.push({ name, line: l });
    }
}

console.log('Unclosed tags at end:');
tags.forEach(t => console.log(`  <${t.name}> opened at line ${t.line}`));
