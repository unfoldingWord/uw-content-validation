#!/usr/bin/env node
require('@babel/register')({ presets: [['@babel/preset-env', { targets: { node: 'current' } }]] });
const fs = require('fs');
const path = require('path');
const { checkAlternateTranslationSyntax } = require('../src/core/at-syntax-check');

const files = process.argv.slice(2);
if (!files.length) {
    console.error('Usage: test-at-syntax.js <file.tsv> [file.tsv ...]');
    process.exit(1);
}

let totalRows = 0, atRows = 0, notices = 0;
const noticeBuckets = {};

for (const f of files) {
    const text = fs.readFileSync(f, 'utf-8');
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo];
        if (!line || line.startsWith('Reference\t')) continue;
        const fields = line.split('\t');
        if (fields.length < 7) continue;
        const note = fields[6].replace(/\\n/g, '\n');
        totalRows++;
        if (!/altern\w+\s+translat\w+/i.test(note)) continue;
        atRows++;
        const rowID = fields[1];
        const reference = fields[0];
        const result = checkAlternateTranslationSyntax(note, 'Note', rowID, ` line ${lineNo + 1} ${reference}`);
        for (const n of result) {
            notices++;
            const key = `${n.priority} ${n.message}`;
            noticeBuckets[key] = noticeBuckets[key] || [];
            noticeBuckets[key].push({ file: path.basename(f), reference, rowID, excerpt: n.excerpt, details: n.details, note: note.length > 200 ? note.slice(0, 200) + '…' : note });
        }
    }
}

console.log(`\nFiles scanned: ${files.length}`);
console.log(`Rows scanned:  ${totalRows}`);
console.log(`Rows with AT:  ${atRows}`);
console.log(`Total notices: ${notices}\n`);

const sortedKeys = Object.keys(noticeBuckets).sort();
for (const k of sortedKeys) {
    const arr = noticeBuckets[k];
    console.log(`[${arr.length}] ${k}`);
    for (const ex of arr.slice(0, 3)) {
        console.log(`    ${ex.file} ${ex.reference} ${ex.rowID}`);
        if (ex.details) console.log(`      details: ${ex.details}`);
        if (ex.excerpt) console.log(`      excerpt: ${JSON.stringify(ex.excerpt)}`);
        console.log(`      note: ${JSON.stringify(ex.note.slice(0, 200))}`);
    }
    if (arr.length > 3) {
        console.log(`    ... and ${arr.length - 3} more:`);
        for (const ex of arr.slice(3)) console.log(`      ${ex.file} ${ex.reference} ${ex.rowID}`);
    }
}
