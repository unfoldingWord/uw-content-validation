// NOTE: This is only recommended for resources which are relatively stable,
//          e.g., completed book packages
//        as it relies on details like filename and line number.
const disabledNotices = [
  // Just enter enough details to disable the required message(s) and no unwanted ones
  //  i.e., you can be specific about username and/or lineNumber, etc.
  // {username: 'unfoldingWord', repoName:'en_ta', filename:'translate/figs-quotemarks/01.md', message:'Unexpected space after « character'},
  // {username: 'unfoldingWord', repoName:'en_ta', filename:'translate/figs-quotemarks/01.md', message:'Unexpected space after ‹ character'},
  // {username: 'unfoldingWord', repoName:'en_ta', filename:'translate/figs-quotemarks/01.md', message:'Unexpected « character after space'},
  // {username: 'unfoldingWord', repoName:'en_ta', filename:'translate/figs-quotemarks/01.md', message:'Unexpected ‹ character after space'},
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after “ character', lineNumber: 3, },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after “ character', lineNumber: 16, },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after ‘ character', lineNumber: 16, },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after « character', },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after ‹ character', },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected space after — character', },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected . character after space', lineNumber: 16, },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected » character after space', },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected › character after space', },
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: 'Unexpected — character after space', },
];

/**
 *
 * @param {Object} givenNotice
 * @returns true if the givenNotice has a match in the disabledNotices list above
 */
export function isDisabledNotice(givenNotice) {
  // console.log(`isDisabledNotice(${JSON.stringify(givenNotice)})…`);
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