#!/usr/bin/env node
// Run validation across all NT books and emit a per-book × per-resource × per-priority table.

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

const readLocal = (repoName, filePath) => {
    const fullPath = path.join(DCS_ROOT, repoName, filePath);
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
};

const checkingOptions = {
    disableAllLinkFetchingFlag: true,
    getFile: ({ repository, path: filePath }) => readLocal(repository, filePath),
};

// All notices indexed by [book, resource]
const data = {};

const collect = (book, resource, notices) => {
    const key = `${book}|${resource}`;
    if (!data[key]) data[key] = [];
    for (const n of notices) {
        if (n.priority === 20 || n.priority === 25) continue; // skip informational
        data[key].push(n);
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
    for (const [b, n] of NT_BOOKS) {
        try { await validateBook(b, n); }
        catch (e) { console.error(`ERROR ${b}:`, e.message); }
    }

    // Output: detailed table grouped by book then resource
    const RESOURCE_ORDER = ['ULT', 'UST', 'TN', 'TQ', 'TWL'];
    let totalReal = 0, totalFP = 0;

    console.log('# NT Validation — Detailed Report\n');
    console.log(`Run date: ${new Date().toISOString().slice(0, 10)}\n`);

    for (const [book] of NT_BOOKS) {
        const bookHasNotices = RESOURCE_ORDER.some(r => (data[`${book}|${r}`] || []).length);
        if (!bookHasNotices) continue;
        console.log(`\n## ${book}\n`);

        for (const resource of RESOURCE_ORDER) {
            const notices = data[`${book}|${resource}`] || [];
            if (!notices.length) continue;

            // Sort by priority desc
            notices.sort((a, b) => b.priority - a.priority);

            console.log(`### ${resource} (${notices.length} notices)\n`);
            console.log('| Pri | C:V | RowID | Line | Field | Message | Excerpt | Class | Fix |');
            console.log('|---|---|---|---|---|---|---|---|---|');

            for (const n of notices) {
                const cv = n.C && n.V ? `${n.C}:${n.V}` : '';
                const rid = n.rowID || '';
                const ln = n.lineNumber ? `L${n.lineNumber}` : '';
                const fn = n.fieldName || '';
                const msg = (n.message || '').replace(/\|/g, '\\|');
                const det = n.details ? ` — ${n.details}` : '';
                const exc = n.excerpt ? n.excerpt.replace(/\|/g, '\\|').replace(/\n/g, ' ') : '';
                const { cls, fix } = classify(n);
                if (cls === 'Real') totalReal++; else totalFP++;
                console.log(`| ${n.priority} | ${cv} | ${rid} | ${ln} | ${fn} | ${msg}${det} | ${exc} | ${cls} | ${fix} |`);
            }
            console.log('');
        }
    }

    console.log(`\n## Totals\n`);
    console.log(`- Real bugs: ${totalReal}`);
    console.log(`- False positives / unsure: ${totalFP}`);
})();

// Heuristic classification for each notice
function classify(n) {
    const m = n.message || '';
    const det = n.details || '';
    const exc = n.excerpt || '';

    // High-confidence real bugs
    if (m.includes('Verse seems to have no text')) return { cls: 'Real', fix: 'Versification — known critical-text difference (e.g. 2CO 13:14)' };
    if (m.includes('Verse appears to be missing')) return { cls: 'Real', fix: 'Same versification difference; add to oftenMissingBCVList if intentional' };
    if (m.includes('Verse appears to be left out')) return { cls: 'Info', fix: 'Already in oftenMissingBCVList — informational' };
    if (m.includes('Bad verse range') || m.includes('Bad verse number')) return { cls: 'Real', fix: 'Fix the Reference column to use a single verse or contiguous bridge' };
    if (m.includes('Bad punctuation nesting')) return { cls: 'Real', fix: 'Repair unclosed quote/brace in alignment chunk' };
    if (m.includes('At end of text with unclosed')) return { cls: 'Real', fix: 'Close the dangling alignment opener at end of book' };
    if (m.includes("Verse number didn’t increment correctly")) return { cls: 'Real', fix: 'Add the missing verse or annotate as oftenMissing' };
    if (m.includes("Verse numbers of markdown Bible link don’t match")) return { cls: 'Real', fix: 'Fix the link text or path so they agree' };
    if (m.includes('Unusual [ ]( ) link')) return { cls: 'Real', fix: 'Lowercase the book code (e.g., 1Ki → 1ki) or fix the path' };
    if (m.includes('Useless USFM paragraph marker')) return { cls: 'Real', fix: 'Remove the redundant \\pm before \\ts\\*' };
    if (m.includes('Unexpected bad character combination')) return { cls: 'Real', fix: 'Add the missing space (or the appropriate following char) after the punctuation' };
    if (m.includes('Unexpected space after')) return { cls: 'Real', fix: 'Remove the space, or change the dash to em-dash' };
    if (m.includes('character after space')) return { cls: 'Real', fix: 'Remove the leading space or replace hyphen with em-dash' };
    if (m.includes('Possible receding verse number')) return { cls: 'Real', fix: 'Reorder rows so verse numbers ascend' };
    if (m.includes('Consecutive use of empty paragraph markers')) return { cls: 'Real', fix: 'Remove the duplicate empty \\p (or similar)' };
    if (m.includes('Possible missing separator in digit string')) return { cls: 'Real', fix: 'Add a thousands separator (e.g., 5000 → 5,000)' };
    if (m.includes('Mismatched')) return { cls: 'Real', fix: 'Add the missing closing character' };
    if (m.includes("Only 'Just-In-Time Training'")) return { cls: 'Real', fix: 'SR must be under ta/man/(translate|checking|intro|process)/ with a translate-track suffix' };
    if (m.includes("wrong divider for discontiguous quote")) return { cls: 'Real', fix: 'Use ◗ and ◖ or … as the discontiguous quote divider' };
    if (m.includes('Unexpected USFM field')) return { cls: 'Real', fix: 'Check for stray \\ or | inside the line content' };
    if (m.includes("Note: skipped running BCS USFMGrammar")) return { cls: 'Info', fix: 'By design — large books skip BCS' };
    if (m.includes("Note that 'disableAllLinkFetchingFlag'")) return { cls: 'Info', fix: 'By design — link fetching disabled in offline mode' };
    if (m.includes('Missing Quote field')) return { cls: 'Info', fix: 'Set Occurrence to 0 when Quote is empty (TQ convention)' };
    return { cls: 'Unsure', fix: '—' };
}
