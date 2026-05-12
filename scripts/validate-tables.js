#!/usr/bin/env node
// Run validation across selected OT + NT books and emit a per-resource cross-book table.

require('@babel/register')({ presets: [['@babel/preset-env', { targets: { node: 'current' } }]] });
const fs = require('fs');
const path = require('path');
const { checkTN_TSV7Table, checkTQ_TSV7Table, checkTWL_TSV6Table } = require('../src/core/wrapper');
const { checkUSFMText } = require('../src/core/usfm-text-check');

const DCS_ROOT = path.resolve(__dirname, '../../git.door43.org');
const USERNAME = 'unfoldingWord';
const LANGUAGE_CODE = 'en';

const ALL_BOOKS = [
    ['GEN', '01'], ['EXO', '02'], ['LEV', '03'], ['NUM', '04'], ['DEU', '05'],
    ['JOS', '06'], ['JDG', '07'], ['RUT', '08'], ['1SA', '09'], ['2SA', '10'],
    ['1KI', '11'], ['2KI', '12'], ['1CH', '13'], ['2CH', '14'], ['EZR', '15'],
    ['NEH', '16'], ['EST', '17'], ['JOB', '18'], ['PSA', '19'], ['PRO', '20'],
    ['ECC', '21'], ['SNG', '22'], ['ISA', '23'], ['JER', '24'], ['LAM', '25'],
    ['EZK', '26'], ['DAN', '27'], ['HOS', '28'], ['JOL', '29'], ['AMO', '30'],
    ['OBA', '31'], ['JON', '32'], ['MIC', '33'], ['NAM', '34'], ['HAB', '35'],
    ['ZEP', '36'], ['HAG', '37'], ['ZEC', '38'], ['MAL', '39'],
    ['MAT', '41'], ['MRK', '42'], ['LUK', '43'], ['JHN', '44'], ['ACT', '45'],
    ['ROM', '46'], ['1CO', '47'], ['2CO', '48'], ['GAL', '49'], ['EPH', '50'],
    ['PHP', '51'], ['COL', '52'], ['1TH', '53'], ['2TH', '54'], ['1TI', '55'],
    ['2TI', '56'], ['TIT', '57'], ['PHM', '58'], ['HEB', '59'], ['JAS', '60'],
    ['1PE', '61'], ['2PE', '62'], ['1JN', '63'], ['2JN', '64'], ['3JN', '65'],
    ['JUD', '66'], ['REV', '67'],
];

const EXCLUDE = new Set(['NUM', '1CH', '2CH', 'ECC', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'AMO', 'MIC', 'ZEC']);
const BOOKS = ALL_BOOKS.filter(([b]) => !EXCLUDE.has(b));

const readLocal = (repoName, filePath) => {
    const fullPath = path.join(DCS_ROOT, repoName, filePath);
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
};

const checkingOptions = {
    disableAllLinkFetchingFlag: true,
    getFile: ({ repository, path: filePath }) => readLocal(repository, filePath),
};

// counts[resource][priority|message][bookID] = count
const counts = {};
// details[resource][priority|message][bookID] = [example info strings]
const details = {};

const collect = (book, resource, notices) => {
    for (const n of notices) {
        if (n.priority === 20 || n.priority === 25) continue; // skip informational
        const key = `${n.priority}|${n.message || ''}`;
        counts[resource] = counts[resource] || {};
        counts[resource][key] = counts[resource][key] || {};
        counts[resource][key][book] = (counts[resource][key][book] || 0) + 1;
        details[resource] = details[resource] || {};
        details[resource][key] = details[resource][key] || {};
        details[resource][key][book] = details[resource][key][book] || [];
        if (details[resource][key][book].length < 3) {
            const where = [n.C && n.V ? `${n.C}:${n.V}` : null, n.rowID ? `id=${n.rowID}` : null, n.lineNumber ? `L${n.lineNumber}` : null].filter(Boolean).join(' ');
            details[resource][key][book].push(where || '(no loc)');
        }
    }
};

async function validateBook(bookID, bookNum) {
    const usfm = `${bookNum}-${bookID}.usfm`;
    const ult = readLocal('en_ult', usfm);
    const ust = readLocal('en_ust', usfm);
    const tn = readLocal('en_tn', `tn_${bookID}.tsv`);
    const tq = readLocal('en_tq', `tq_${bookID}.tsv`);
    const twl = readLocal('en_twl', `twl_${bookID}.tsv`);

    const tasks = [];
    if (ult) tasks.push(checkUSFMText(USERNAME, LANGUAGE_CODE, 'ULT', bookID, usfm, ult, '', checkingOptions).then(r => collect(bookID, 'ULT', r.noticeList)));
    if (ust) tasks.push(checkUSFMText(USERNAME, LANGUAGE_CODE, 'UST', bookID, usfm, ust, '', checkingOptions).then(r => collect(bookID, 'UST', r.noticeList)));
    if (tn) tasks.push(checkTN_TSV7Table(USERNAME, LANGUAGE_CODE, bookID, `tn_${bookID}.tsv`, tn, checkingOptions).then(r => collect(bookID, 'TN', r.noticeList)));
    if (tq) tasks.push(checkTQ_TSV7Table(USERNAME, LANGUAGE_CODE, bookID, `tq_${bookID}.tsv`, tq, checkingOptions).then(r => collect(bookID, 'TQ', r.noticeList)));
    if (twl) tasks.push(checkTWL_TSV6Table(USERNAME, LANGUAGE_CODE, bookID, `twl_${bookID}.tsv`, twl, checkingOptions).then(r => collect(bookID, 'TWL', r.noticeList)));

    await Promise.all(tasks);
    process.stderr.write(`  ${bookID} done\n`);
}

(async () => {
    process.stderr.write(`Validating ${BOOKS.length} books\n`);
    for (const [b, n] of BOOKS) {
        try { await validateBook(b, n); }
        catch (e) { console.error(`ERROR ${b}:`, e.message); }
    }

    const RESOURCES = ['ULT', 'UST', 'TN', 'TQ', 'TWL'];
    console.log('# Cross-Book Validation Tables\n');
    console.log(`Run date: ${new Date().toISOString().slice(0, 10)}\n`);
    console.log(`Books: ${BOOKS.length} (${BOOKS.map(([b]) => b).join(', ')})\n`);

    for (const resource of RESOURCES) {
        if (!counts[resource]) continue;
        const rows = Object.keys(counts[resource]);
        if (!rows.length) continue;

        // Sort rows by priority desc
        rows.sort((a, b) => {
            const pa = parseInt(a.split('|')[0], 10), pb = parseInt(b.split('|')[0], 10);
            return pb - pa;
        });

        // Get only books that have any notices for this resource
        const bookSet = new Set();
        for (const r of rows) for (const b of Object.keys(counts[resource][r])) bookSet.add(b);
        const bookCols = BOOKS.map(([b]) => b).filter(b => bookSet.has(b));

        const total = rows.reduce((s, r) => s + Object.values(counts[resource][r]).reduce((a, c) => a + c, 0), 0);

        console.log(`\n## ${resource} — ${total} notices across ${bookCols.length} books\n`);

        // Header
        console.log(`| Pri | Message | ` + bookCols.join(' | ') + ' | Total |');
        console.log(`|---|---|` + bookCols.map(() => '---').join('|') + '|---|');

        for (const row of rows) {
            const [pri, ...msgParts] = row.split('|');
            const msg = msgParts.join('|').replace(/\|/g, '\\|');
            const cells = bookCols.map(b => counts[resource][row][b] || '');
            const rowTotal = cells.reduce((s, x) => s + (x || 0), 0);
            console.log(`| ${pri} | ${msg} | ` + cells.join(' | ') + ` | ${rowTotal} |`);
        }

        // Details section
        console.log(`\n### ${resource} examples (first 3 per book per error)\n`);
        for (const row of rows) {
            const [pri, ...msgParts] = row.split('|');
            const msg = msgParts.join('|');
            console.log(`**[${pri}] ${msg}**`);
            for (const b of bookCols) {
                const exs = (details[resource][row] || {})[b];
                if (exs && exs.length) console.log(`- ${b}: ${exs.join('; ')}`);
            }
            console.log('');
        }
    }
})();
