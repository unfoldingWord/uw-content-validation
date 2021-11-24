// eslint-disable-next-line no-unused-vars
import { debugLog, userLog, functionLog } from './utilities';

/* This file handles the suppression of notices where we don’t want to disable or remove the actual check,
    but we just want to disable it for certain resources to handle special cases.
    In some cases, it’s to handle software deficiencies.

  Some examples:
    An article about punctuation discusses the use of "(" (which would normally cause a warning)
    An article about how to encode markdown discusses "#" (which would normally cause a warning)

    NOTE: This is only recommended for resources which are relatively stable,
          e.g., completed book packages
        as it can rely on details like filename and maybe line number.
*/


// const DISABLED_NOTICES_VERSION_STRING = '1.0.3';


const disabledNotices = [
  // Just enter enough details to disable the required message(s) and no unwanted ones
  //  i.e., you can be as specific as you need about username and/or lineNumber, etc.

  { repoCode: 'TN', priority: 450, }, // TN "Resource container link should have '*' language code with (not 'en')" disabled as tC can’t handle it yet!
  { repoCode: 'OBS-TN', priority: 450, }, // OBS-TN "Resource container link should have '*' language code with (not 'en')" disabled as tS can’t handle it yet!
  { repoCode: 'TW', priority: 450, }, // TW "Resource container link should have '*' language code with (not 'en')" disabled as tC can’t handle it yet!
  { extra: 'TW', priority: 450, }, // TW "Resource container link should have '*' language code with (not 'en')" disabled as tC can’t handle it yet!

  { repoCode: 'ST', message: "Bad punctuation nesting: } closing character doesn’t match", bookID: 'NEH', }, // 777 - complex { } nesting in direct speech
  { repoCode: 'ST', message: "Bad punctuation nesting: ” closing character doesn’t match", bookID: 'NEH', }, // 777 - complex { } nesting in direct speech

  // Many/All of the next section of lines can be deleted after tC 3.0.2 is released
  { repoCode: 'LT', priority: 638, fieldName: '\\p', }, // "Only found whitespace" tC3 outputs trailing spaces here
  { repoCode: 'ST', priority: 638, fieldName: '\\p', }, // "Only found whitespace" tC3 outputs trailing spaces here
  { repoCode: 'LT', priority: 124, excerpt: '\\p␣␣', }, // "Unexpected double spaces" tC3 outputs trailing spaces here
  { repoCode: 'ST', priority: 124, excerpt: '\\p␣␣', }, // "Unexpected double spaces" tC3 outputs trailing spaces here
  { repoCode: 'LT', message: "Unexpected space after | character", }, // 192 tC3 outputs an unneeded/unwanted space in \zaln-s
  { repoCode: 'ST', message: "Unexpected space after | character", }, // 192 tC3 outputs an unneeded/unwanted space in \zaln-s
  { repoCode: 'LT', priority: 95, }, // "Unexpected trailing space(s)" tC3 outputs trailing spaces all over the place
  { repoCode: 'ST', priority: 95, }, // "Unexpected trailing space(s)" tC3 outputs trailing spaces all over the place

  { repoCode: 'TN', bookID: '2PE', priority: 648, details: '10a' }, // "Unusual [ ]( ) link(s)—not a recognized Bible, OBS, or TA, TN, or TW link"
  { repoCode: 'TN', excerpt: 'brackets [ ] ', message: "Unexpected space after [ character", }, // 192 (x2)

  { repoCode: 'TA', priority: 104, }, // "Unexpected trailing line break" UTA uses trailing <BR> for (1) (2) (3) style numbered lists

  // { repoCode: 'TA', message: "Unexpected – (en-dash) character after space", }, // 191 -- temp en-dashes
  // { repoCode: 'TA', message: "Unexpected space after – (en-dash) character", }, // 192 -- temp en-dashes

  { repoCode: 'TA', priority: 172, }, // "Header levels should only increment by one" not required for TA

  { repoCode: 'TA', filename: 'translate/translate-alphabet/01.md', message: "At end of text with unclosed ‘ opening character", }, // 768
  { repoCode: 'TA', filename: 'translate/translate-alphabet/01.md', message: "Mismatched ‘’ characters", }, // 462
  { repoCode: 'TA', filename: 'translate/translate-alphabet/01.md', message: "Unexpected space after ‘ character", }, // 192
  { repoCode: 'TA', filename: 'translate/translate-alphabet/01.md', message: "Unexpected space after ^ character", }, // 192
  { repoCode: 'TA', filename: 'translate/translate-alphabet/01.md', message: "Unexpected ^ character after space", }, // 191

  { repoCode: 'TA', filename: 'translate/translate-textvariants/01.md', message: "Unexpected space after [ character", }, // 192
  { repoCode: 'TA', filename: 'translate/translate-formatsignals/01.md', message: "Unexpected space after ( character", }, // 192

  { repoCode: 'TA', filename: 'translate/figs-litany/01.md', message: "Unexpected non-break space (u00A0) character", }, // 581

  { repoCode: 'TA', filename: 'checking/intro-checking/01.md', excerpt: "Tuggy P.,", }, // 329 Unexpected bad character combination
  { repoCode: 'TA', filename: 'translate/translate-retell/01.md', excerpt: "Tuggy P.,", }, // 329 Unexpected bad character combination

  // This file explains how to use markdown headings
  { repoCode: 'TA', filename: 'translate/file-formats/01.md', message: "Unexpected # character at start of line", }, // 195

  // This file has a space-separated list of typical quotation symbols
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after “ character", lineNumber: 3, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after “ character", lineNumber: 16, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after ‘ character", lineNumber: 16, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after « character", }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after ‹ character", }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after — (em-dash) character", }, // 192

  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected . character after space", lineNumber: 16, }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected ” character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected ’ character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected » character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected › character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected — (em-dash) character after space", }, // 191

  { repoCode: 'TA', filename: 'translate/writing-quotations/01.md', excerpt: " (“ ”).", }, // 192 & 191
  { repoCode: 'TA', filename: 'translate/writing-quotations/01.md', message: "Unexpected » character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/writing-quotations/01.md', message: "Unexpected space after « character", }, // 192

  { repoCode: 'TA', filename: 'checking/self-assessment/01.md', excerpt: "no | yes", }, // 192 & 191

  { repoCode: 'TA', filename: 'translate/translate-formatsignals', excerpt: " “( )” ", }, // 192 & 191

  { repoCode: 'TA', filename: 'translate/source-version/01.md', message: " .1 ", }, // 191 -- Unexpected . character after space

  { repoCode: 'TA', filename: 'translate/figs-metaphor/01.md', message: "Possible misplaced ( character", }, // 17
];


/**
 *
 * @param {Object} givenNotice
 * @returns true if the givenNotice has a match in the disabledNotices list above
 */
export function isDisabledNotice(givenNotice) {
  // NOTE: The function will fail if repoCode is not set in the notices passed to this function
  // NOTE: 'extra' is still valid at this point (not yet prepended to 'message')
  // functionLog(`isDisabledNotice(${JSON.stringify(givenNotice)})…`);
  // if (givenNotice.repoCode === undefined) debugLog(`isDisabledNotice() cannot work without repoCode for ${JSON.stringify(givenNotice)}`);
  for (const disabledNotice of disabledNotices) {
    let matchedAllSpecifiedFields = true;
    for (const dNPropertyName in disabledNotice)
      // if ((propertyName !== 'repoCode' || givenNotice.repoCode !== undefined) // Some individual checks don’t set repoCode
      // && (givenNotice[propertyName] !== disabledNotice[propertyName])) {
      if (dNPropertyName in givenNotice) {// as well as in disabledNotice, so we have it in both
        if (['details', 'excerpt'].includes(dNPropertyName)) {
          // these properties only need their content to be CONTAINED in the actual field
          if (givenNotice[dNPropertyName].indexOf(disabledNotice[dNPropertyName]) === -1) {
            matchedAllSpecifiedFields = false;
            break;
          }
        } else if (givenNotice[dNPropertyName] !== disabledNotice[dNPropertyName]) {
          matchedAllSpecifiedFields = false;
          break;
        }
      } else { // property name not in givenNotice
        // debugLog(`pName=${dNPropertyName} from ${JSON.stringify(disabledNotice)} is not in this notice, so it's not disabled: ${JSON.stringify(givenNotice)}`);
        matchedAllSpecifiedFields = false;
        break;
      }
    if (matchedAllSpecifiedFields) {
      // debugLog(`  isDisabledNotice() returning true for ${JSON.stringify(disabledNotice)}`);
      return true; // i.e., notice is disabled
    }
  }
  return false; // i.e., notice is NOT disabled
}


/**
 *
 * @param {Array} givenNoticeList
 * @returns a new list of notices with disabled ones removed
 */
export function removeDisabledNotices(givenNoticeList) {
  // NOTE: The function will fail if repoCode is not set in the notices passed to this function
  const remainingNoticeList = [];
  // let givenRepoCodeNotice = false; // so we only give the warning once
  for (const thisNotice of givenNoticeList) {
    // if (thisNotice.repoCode === undefined && !givenRepoCodeNotice) { debugLog(`removeDisabledNotices() cannot work without repoCode for ${JSON.stringify(thisNotice)} in list of ${givenNoticeList.length} notices.`); givenRepoCodeNotice = true; }
    if (!isDisabledNotice(thisNotice))
      remainingNoticeList.push(thisNotice);
    // else userLog(`  Removing disabled ${JSON.stringify(thisNotice)}`);
  }
  if (givenNoticeList.length > 2 // This stops the msg from being displayed for lots of tests
    && remainingNoticeList.length !== givenNoticeList.length)
    userLog(`removeDisabledNotices() returning ${remainingNoticeList.length} out of ${givenNoticeList.length} notices`);
  return remainingNoticeList;
}
