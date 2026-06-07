/**
 * validate-local.js
 *
 * Run uw-content-validation against locally cloned DCS files.
 *
 * Usage:
 *   node -r @babel/register scripts/validate-local.js [BOOK_ID] [--resource tn|tq|twl|ult|ust] [--min-priority N]
 *
 * Examples:
 *   node -r @babel/register scripts/validate-local.js DEU
 *   node -r @babel/register scripts/validate-local.js DEU --resource tn
 *   node -r @babel/register scripts/validate-local.js DEU --min-priority 700
 *
 * Expects local DCS clones at ../git.door43.org/unfoldingWord/<repo>/<file>
 */

import fs from 'fs';
import path from 'path';
import { checkTN_TSV7Table, checkTQ_TSV7Table, checkTWL_TSV6Table } from '../src/core/wrapper';
import { checkUSFMText } from '../src/core/usfm-text-check';

const DCS_ROOT = path.resolve(__dirname, '../../git.door43.org/unfoldingWord');
const USERNAME = 'unfoldingWord';
const LANGUAGE_CODE = 'en';

function readLocal(repoName, filePath) {
  const fullPath = path.join(DCS_ROOT, repoName, filePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

function makeGetFile(repoMap) {
  return function getFile({ repository, path: filePath }) {
    const repoName = repoMap[repository] || repository;
    return readLocal(repoName, filePath);
  };
}

function printResults(label, results, minPriority) {
  const notices = results.noticeList
    .filter(n => n.priority >= minPriority)
    .sort((a, b) => b.priority - a.priority);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`${label}: ${results.noticeList.length} total notices, ${notices.length} at priority >= ${minPriority}`);
  console.log(`Successes: ${results.successList.length}`);

  if (notices.length === 0) {
    console.log('  (none)');
    return;
  }

  for (const n of notices) {
    const loc = [
      n.C && n.V ? `${n.C}:${n.V}` : null,
      n.rowID ? `id=${n.rowID}` : null,
      n.lineNumber ? `line ${n.lineNumber}` : null,
      n.fieldName ? `field '${n.fieldName}'` : null,
    ].filter(Boolean).join(', ');

    const excerpt = n.excerpt ? ` | "${n.excerpt}"` : '';
    const details = n.details ? ` | ${n.details}` : '';
    console.log(`  [${n.priority}] ${n.message}${details}${excerpt}${loc ? ` (${loc})` : ''}`);
  }
}

async function run() {
  const args = process.argv.slice(2);
  const bookID = (args.find(a => !a.startsWith('--')) || 'DEU').toUpperCase();
  const resourceFilter = (() => {
    const idx = args.indexOf('--resource');
    return idx >= 0 ? args[idx + 1] : null;
  })();
  const minPriority = (() => {
    const idx = args.indexOf('--min-priority');
    return idx >= 0 ? parseInt(args[idx + 1], 10) : 1;
  })();

  const bookNum = bookID === 'GEN' ? '01' : bookID === 'EXO' ? '02' : bookID === 'LEV' ? '03' :
    bookID === 'NUM' ? '04' : bookID === 'DEU' ? '05' : bookID === 'JOS' ? '06' :
    bookID === 'JDG' ? '07' : bookID === 'RUT' ? '08' : bookID === '1SA' ? '09' :
    bookID === '2SA' ? '10' : bookID === '1KI' ? '11' : bookID === '2KI' ? '12' :
    bookID === '1CH' ? '13' : bookID === '2CH' ? '14' : bookID === 'EZR' ? '15' :
    bookID === 'NEH' ? '16' : bookID === 'EST' ? '17' : bookID === 'JOB' ? '18' :
    bookID === 'PSA' ? '19' : bookID === 'PRO' ? '20' : bookID === 'ECC' ? '21' :
    bookID === 'SNG' ? '22' : bookID === 'ISA' ? '23' : bookID === 'JER' ? '24' :
    bookID === 'LAM' ? '25' : bookID === 'EZK' ? '26' : bookID === 'DAN' ? '27' :
    bookID === 'HOS' ? '28' : bookID === 'JOL' ? '29' : bookID === 'AMO' ? '30' :
    bookID === 'OBA' ? '31' : bookID === 'JON' ? '32' : bookID === 'MIC' ? '33' :
    bookID === 'NAM' ? '34' : bookID === 'HAB' ? '35' : bookID === 'ZEP' ? '36' :
    bookID === 'HAG' ? '37' : bookID === 'ZEC' ? '38' : bookID === 'MAL' ? '39' :
    bookID === 'MAT' ? '41' : bookID === 'MRK' ? '42' : bookID === 'LUK' ? '43' :
    bookID === 'JHN' ? '44' : bookID === 'ACT' ? '45' : bookID === 'ROM' ? '46' :
    bookID === '1CO' ? '47' : bookID === '2CO' ? '48' : bookID === 'GAL' ? '49' :
    bookID === 'EPH' ? '50' : bookID === 'PHP' ? '51' : bookID === 'COL' ? '52' :
    bookID === '1TH' ? '53' : bookID === '2TH' ? '54' : bookID === '1TI' ? '55' :
    bookID === '2TI' ? '56' : bookID === 'TIT' ? '57' : bookID === 'PHM' ? '58' :
    bookID === 'HEB' ? '59' : bookID === 'JAS' ? '60' : bookID === '1PE' ? '61' :
    bookID === '2PE' ? '62' : bookID === '1JN' ? '63' : bookID === '2JN' ? '64' :
    bookID === '3JN' ? '65' : bookID === 'JUD' ? '66' : bookID === 'REV' ? '67' : '00';

  const usfmFile = `${bookNum}-${bookID}.usfm`;

  const checkingOptions = {
    disableAllLinkFetchingFlag: true,
    getFile: makeGetFile({
      en_ult: 'en_ult',
      en_ust: 'en_ust',
      en_tn: 'en_tn',
      en_tq: 'en_tq',
      en_twl: 'en_twl',
      en_ta: 'en_ta',
      en_tw: 'en_tw',
    }),
  };

  const shouldRun = (res) => !resourceFilter || resourceFilter === res;

  console.log(`Validating ${bookID} (book number ${bookNum}) from ${DCS_ROOT}`);

  if (shouldRun('ult')) {
    const ultText = readLocal('en_ult', usfmFile);
    if (ultText) {
      console.log(`\nChecking ULT USFM (${usfmFile}, ${ultText.length.toLocaleString()} chars)…`);
      const results = await checkUSFMText(USERNAME, LANGUAGE_CODE, 'ULT', bookID, usfmFile, ultText, '', checkingOptions);
      printResults('ULT USFM', results, minPriority);
    } else {
      console.log(`\nULT file not found: ${path.join(DCS_ROOT, 'en_ult', usfmFile)}`);
    }
  }

  if (shouldRun('ust')) {
    const ustText = readLocal('en_ust', usfmFile);
    if (ustText) {
      console.log(`\nChecking UST USFM (${usfmFile}, ${ustText.length.toLocaleString()} chars)…`);
      const results = await checkUSFMText(USERNAME, LANGUAGE_CODE, 'UST', bookID, usfmFile, ustText, '', checkingOptions);
      printResults('UST USFM', results, minPriority);
    } else {
      console.log(`\nUST file not found: ${path.join(DCS_ROOT, 'en_ust', usfmFile)}`);
    }
  }

  if (shouldRun('tn')) {
    const tnFile = `tn_${bookID}.tsv`;
    const tnText = readLocal('en_tn', tnFile);
    if (tnText) {
      console.log(`\nChecking TN TSV (${tnFile}, ${tnText.length.toLocaleString()} chars)…`);
      const results = await checkTN_TSV7Table(USERNAME, LANGUAGE_CODE, bookID, tnFile, tnText, checkingOptions);
      printResults('TN', results, minPriority);
    } else {
      console.log(`\nTN file not found: ${path.join(DCS_ROOT, 'en_tn', tnFile)}`);
    }
  }

  if (shouldRun('tq')) {
    const tqFile = `tq_${bookID}.tsv`;
    const tqText = readLocal('en_tq', tqFile);
    if (tqText) {
      console.log(`\nChecking TQ TSV (${tqFile}, ${tqText.length.toLocaleString()} chars)…`);
      const results = await checkTQ_TSV7Table(USERNAME, LANGUAGE_CODE, bookID, tqFile, tqText, checkingOptions);
      printResults('TQ', results, minPriority);
    } else {
      console.log(`\nTQ file not found: ${path.join(DCS_ROOT, 'en_tq', tqFile)}`);
    }
  }

  if (shouldRun('twl')) {
    const twlFile = `twl_${bookID}.tsv`;
    const twlText = readLocal('en_twl', twlFile);
    if (twlText) {
      console.log(`\nChecking TWL TSV (${twlFile}, ${twlText.length.toLocaleString()} chars)…`);
      const results = await checkTWL_TSV6Table(USERNAME, LANGUAGE_CODE, bookID, twlFile, twlText, checkingOptions);
      printResults('TWL', results, minPriority);
    } else {
      console.log(`\nTWL file not found: ${path.join(DCS_ROOT, 'en_twl', twlFile)}`);
    }
  }

  console.log('\nDone.');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
