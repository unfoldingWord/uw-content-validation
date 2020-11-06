// NOTE: This is only recommended for resources which are relatively stable,
//          e.g., completed book packages
//        as it relies on details like filename and maybe line number.
const disabledNotices = [
  // Just enter enough details to disable the required message(s) and no unwanted ones
  //  i.e., you can be as specific as you need about username and/or lineNumber, etc.
  { repoCode: 'TN1', priority: 450, }, // "TN Resource container link should have '*' language code with (not 'en')" as tC can't handle it yet!

  { repoCode: 'LT', priority: 638, fieldName: '\\p', }, // "Only found whitespace" tC3 outputs trailing spaces here
  { repoCode: 'ST', priority: 638, fieldName: '\\p', }, // "Only found whitespace" tC3 outputs trailing spaces here
  { repoCode: 'LT', priority: 194, extract: '\\p␣␣', }, // "Unexpected double spaces" tC3 outputs trailing spaces here
  { repoCode: 'ST', priority: 194, extract: '\\p␣␣', }, // "Unexpected double spaces" tC3 outputs trailing spaces here
  { repoCode: 'LT', message: "Unexpected space after | character", }, // 192 tC3 outputs an unneeded/unwanted space in \zaln-s
  { repoCode: 'ST', message: "Unexpected space after | character", }, // 192 tC3 outputs an unneeded/unwanted space in \zaln-s
  { repoCode: 'LT', priority: 95, }, // "Unexpected trailing space(s)" tC3 outputs trailing spaces all over the place
  { repoCode: 'ST', priority: 95, }, // "Unexpected trailing space(s)" tC3 outputs trailing spaces all over the place

  // {username: 'unfoldingWord', repoName:'en_ta', filename:'translate/figs-quotemarks/01.md', message:'Unexpected space after « character'},
  // {username: 'unfoldingWord', repoName:'en_ta', filename:'translate/figs-quotemarks/01.md', message:'Unexpected space after ‹ character'},
  // {username: 'unfoldingWord', repoName:'en_ta', filename:'translate/figs-quotemarks/01.md', message:'Unexpected « character after space'},
  // {username: 'unfoldingWord', repoName:'en_ta', filename:'translate/figs-quotemarks/01.md', message:'Unexpected ‹ character after space'},
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected . character after space', lineNumber: 16, }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected ” character after space', }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected ’ character after space', }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected » character after space', }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected › character after space', }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected — character after space', }, // 191
  { repoCode: 'TA', filename: 'translate/translate-bdistance/01.md', message: 'Unexpected | character after space', }, // 191
  { repoCode: 'TA', filename: 'translate/translate-bmoney/01.md', message: 'Unexpected | character after space', }, // 191
  { repoCode: 'TA', filename: 'translate/grammar-connect-time-background/01.md', message: 'Unexpected | character after space', }, // 191

  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after “ character', lineNumber: 3, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after “ character', lineNumber: 16, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after ‘ character', lineNumber: 16, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after « character', }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after ‹ character', }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after — character', }, // 192
  { repoCode: 'TA', filename: 'translate/translate-textvariants/01.md', message: 'Unexpected space after [ character', }, // 192
  { repoCode: 'TA', filename: 'translate/translate-formatsignals/01.md', message: 'Unexpected space after ( character', }, // 192

  { repoCode: 'TA', message: 'Unexpected – character after space', }, // 191 -- temp en-dashes
  { repoCode: 'TA', message: 'Unexpected space after – character', }, // 192 -- temp en-dashes

  { repoCode: 'TA', filename: 'translate/translate-ordinal/01.md', message: 'Unexpected doubled - characters',}, // 177
  { repoCode: 'TA', filename: 'translate/translate-bdistance/01.md', message: 'Unexpected doubled - characters',}, // 177
  { repoCode: 'TA', filename: 'translate/translate-bmoney/01.md', message: 'Unexpected doubled - characters',}, // 177
];

/**
 *
 * @param {Object} givenNotice
 * @returns true if the givenNotice has a match in the disabledNotices list above
 */
export function isDisabledNotice(givenNotice) {
  // if (givenNotice.priority===638) console.log(`isDisabledNotice(${JSON.stringify(givenNotice)})…`);
  for (const disabledNotice of disabledNotices) {
    let matched = true;
    for (const propertyName in disabledNotice)
      if (givenNotice[propertyName] !== disabledNotice[propertyName]) {
        matched = false;
        break;
      }
    if (matched) return true;
  }
  return false;
}