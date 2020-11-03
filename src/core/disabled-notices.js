// NOTE: This is only recommended for resources which are relatively stable,
//          e.g., completed book packages
//        as it relies on details like filename and maybe line number.
const disabledNotices = [
  // Just enter enough details to disable the required message(s) and no unwanted ones
  //  i.e., you can be as specific as you need about username and/or lineNumber, etc.

  { repoCode: 'LT', priority: 194, fieldName:'\\p',}, // "Unexpected double spaces" tC 3 outputs trailing spaces here
  { repoCode: 'ST', priority: 194, fieldName:'\\p',}, // "Unexpected double spaces" tC 3 outputs trailing spaces here
  { repoCode: 'LT', priority: 638, fieldName:'\\p',}, // "Only found whitespace" tC 3 outputs trailing spaces here
  { repoCode: 'ST', priority: 638, fieldName:'\\p',}, // "Only found whitespace" tC 3 outputs trailing spaces here
  { repoCode: 'LT', message: "Unexpected space after | character", fieldName:'\\v',}, // 192 tC 3 outputs an unneeded/unwanted space in \zaln-s
  { repoCode: 'ST', message: "Unexpected space after | character", fieldName:'\\v',}, // 192 tC 3 outputs an unneeded/unwanted space in \zaln-s

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