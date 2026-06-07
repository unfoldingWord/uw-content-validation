#!/usr/bin/env node
// Run full validation across all NT books and aggregate by (priority, message).

require('@babel/register')({ presets: [['@babel/preset-env', { targets: { node: 'current' } }]] });
const fs = require('fs');
const path = require('path');
const { checkTN_TSV7Table, checkTQ_TSV7Table, checkTWL_TSV6Table } = require('../src/core/wrapper');
const { checkUSFMText } = require('../src/core/usfm-text-check');

const DCS_ROOT = path.resolve(__dirname, '../../git.door43.org');
const USERNAME = 'unfoldingWord';
const LANGUAGE_CODE = 'en';

const NT_BOOKS = [
    ['MAT', '41'], ['MRK', '42'], ['LUK', '43'], ['JHN', '44'], ['ACT', '45'],
    ['ROM', '46'], ['1CO', '47'], ['2CO', '48'], ['GAL', '49'], ['EPH', '50'],
    ['PHP', '51'], ['COL', '52'], ['1TH', '53'], ['2TH', '54'], ['1TI', '55'],
    ['2TI', '56'], ['TIT', '57'], ['PHM', '58'], ['HEB', '59'], ['JAS', '60'],
    ['1PE', '61'], ['2PE', '62'], ['1JN', '63'], ['2JN', '64'], ['3JN', '65'],
    ['JUD', '66'], ['REV', '67'],
];

function readLocal(repoName, filePath) {
    const fullPath = path.join(DCS_ROOT, repoName, filePath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf8');
}

const checkingOptions = {
    disableAllLinkFetchingFlag: true,
    getFile: ({ repository, path: filePath }) => readLocal(repository, filePath),
};

const minPriority = parseInt(process.argv[2] || '0', 10);

const buckets = {};

function bucket(resource, bookID, notices) {
    for (const n of notices) {
        if (n.priority < minPriority) continue;
        const key = `${n.priority}|${resource}|${n.message}`;
        if (!buckets[key]) buckets[key] = { priority: n.priority, resource, message: n.message, count: 0, examples: [], compact: [] };
        buckets[key].count++;
        const where = [n.C && n.V ? `${n.C}:${n.V}` : null, n.rowID ? `id=${n.rowID}` : null, n.lineNumber ? `L${n.lineNumber}` : null, n.fieldName].filter(Boolean).join(' ');
        if (buckets[key].examples.length < 3) {
            buckets[key].examples.push({ book: bookID, where, excerpt: n.excerpt, details: n.details });
        } else {
            buckets[key].compact.push(`${bookID} ${where}`);
        }
    }
}

async function validateBook(bookID, bookNum) {
    const usfm = `${bookNum}-${bookID}.usfm`;
    const ultText = readLocal('en_ult', usfm);
    const ustText = readLocal('en_ust', usfm);
    const tnText = readLocal('en_tn', `tn_${bookID}.tsv`);
    const tqText = readLocal('en_tq', `tq_${bookID}.tsv`);
    const twlText = readLocal('en_twl', `twl_${bookID}.tsv`);

    const tasks = [];
    if (ultText) tasks.push(checkUSFMText(USERNAME, LANGUAGE_CODE, 'ULT', bookID, usfm, ultText, '', checkingOptions).then(r => bucket('ULT', bookID, r.noticeList)));
    if (ustText) tasks.push(checkUSFMText(USERNAME, LANGUAGE_CODE, 'UST', bookID, usfm, ustText, '', checkingOptions).then(r => bucket('UST', bookID, r.noticeList)));
    if (tnText) tasks.push(checkTN_TSV7Table(USERNAME, LANGUAGE_CODE, bookID, `tn_${bookID}.tsv`, tnText, checkingOptions).then(r => bucket('TN', bookID, r.noticeList)));
    if (tqText) tasks.push(checkTQ_TSV7Table(USERNAME, LANGUAGE_CODE, bookID, `tq_${bookID}.tsv`, tqText, checkingOptions).then(r => bucket('TQ', bookID, r.noticeList)));
    if (twlText) tasks.push(checkTWL_TSV6Table(USERNAME, LANGUAGE_CODE, bookID, `twl_${bookID}.tsv`, twlText, checkingOptions).then(r => bucket('TWL', bookID, r.noticeList)));

    await Promise.all(tasks);
    process.stderr.write(`  ${bookID} done\n`);
}

(async () => {
    process.stderr.write(`Validating ${NT_BOOKS.length} NT books from ${DCS_ROOT} (min priority ${minPriority})\n`);
    for (const [b, n] of NT_BOOKS) {
        try { await validateBook(b, n); }
        catch (e) { console.error(`ERROR validating ${b}:`, e.message); }
    }

    const sorted = Object.values(buckets).sort((a, b) =>
        b.priority - a.priority || b.count - a.count || a.message.localeCompare(b.message));
    const total = sorted.reduce((s, x) => s + x.count, 0);
    const byResource = {};
    const byPriorityBand = { '700+': 0, '500-699': 0, '300-499': 0, '<300': 0 };
    for (const b of sorted) {
        byResource[b.resource] = (byResource[b.resource] || 0) + b.count;
        const p = b.priority;
        if (p >= 700) byPriorityBand['700+'] += b.count;
        else if (p >= 500) byPriorityBand['500-699'] += b.count;
        else if (p >= 300) byPriorityBand['300-499'] += b.count;
        else byPriorityBand['<300'] += b.count;
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total notices: ${total}`);
    console.log(`By resource:`, byResource);
    console.log(`By priority:`, byPriorityBand);
    console.log(`Distinct check×resource buckets: ${sorted.length}\n`);

    console.log(`=== Top buckets (priority desc, then count desc) ===`);
    for (const b of sorted.slice(0, 50)) {
        console.log(`\n[${b.priority}] (${b.resource}) ${b.message}  ×${b.count}`);
        for (const ex of b.examples) {
            const det = ex.details ? ` | ${ex.details}` : '';
            const exc = ex.excerpt ? ` | "${ex.excerpt}"` : '';
            console.log(`    ${ex.book} ${ex.where}${det}${exc}`);
        }
        if (b.compact.length) {
            console.log(`    ... and ${b.compact.length} more:`);
            for (const c of b.compact) console.log(`      ${c}`);
        }
    }
})();
