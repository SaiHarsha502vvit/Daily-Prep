const fs = require('fs');
const path = require('path');

const targets = process.argv.slice(2);

if (targets.length === 0) {
    console.error('Usage: node _tmp_flow_numbered_style.js <folder> [folder2 ...]');
    process.exit(1);
}

function walkMarkdownFiles(dir, out) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkMarkdownFiles(fullPath, out);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
            out.push(fullPath);
        }
    }
}

function parseListText(line) {
    const m = line.match(/^\s*(?:-|\d+\.)\s+(.*)$/);
    return m ? m[1].trim() : null;
}

function convertFlowBlocks(content) {
    const lines = content.split(/\r?\n/);
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== '**Flow:**') continue;

        let listStart = i + 1;
        while (listStart < lines.length && lines[listStart].trim() === '') {
            listStart++;
        }

        if (listStart >= lines.length) continue;

        const firstText = parseListText(lines[listStart]);
        if (firstText === null) continue;

        let listEnd = listStart;
        while (listEnd < lines.length) {
            const text = parseListText(lines[listEnd]);
            if (text === null) break;
            listEnd++;
        }

        const rawItems = [];
        for (let k = listStart; k < listEnd; k++) {
            const text = parseListText(lines[k]);
            if (text !== null) rawItems.push(text);
        }

        const hasArrowChain = rawItems.some((t) => t === '↓');
        if (!hasArrowChain) continue;

        const cleanedItems = rawItems
            .filter((t) => t !== '↓')
            .map((t) => t.trim())
            .filter((t) => t.length > 0);

        if (cleanedItems.length === 0) continue;

        const numbered = cleanedItems.map((item, idx) => `${idx + 1}. ${item}`);

        lines.splice(listStart, listEnd - listStart, ...numbered);
        changed = true;
        i = listStart + numbered.length - 1;
    }

    if (!changed) return null;

    return lines.join('\n');
}

let changedCount = 0;
const changedFiles = [];

for (const target of targets) {
    const absTarget = path.resolve(target);
    const files = [];
    walkMarkdownFiles(absTarget, files);

    for (const file of files) {
        let content;
        try {
            content = fs.readFileSync(file, 'utf8');
        } catch {
            continue;
        }

        const converted = convertFlowBlocks(content);
        if (converted === null || converted === content) continue;

        fs.writeFileSync(file, converted, 'utf8');
        changedCount++;
        changedFiles.push(path.relative(process.cwd(), file).replace(/\\/g, '/'));
    }
}

console.log(`Changed files: ${changedCount}`);
for (const f of changedFiles) {
    console.log(` - ${f}`);
}
