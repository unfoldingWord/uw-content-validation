export const DEFAULT_EXTRACT_LENGTH = 15;


// See http://xahlee.info/comp/unicode_matching_brackets.html for a more complete list
// Also see https://unicode-table.com/en/sets/quotation-marks/
// NOTE: Can't include ‘ and ’ below coz ’ is also used as apostrophe
export const PAIRED_PUNCTUATION_OPENERS = '[({<⟨“«‹《〈⸢⸤';
export const PAIRED_PUNCTUATION_CLOSERS = '])}>⟩”»›》〉⸣⸥';
export const MATCHED_PUNCTUATION_PAIRS = [
    ['[', ']'], ['(', ')'], ['{', '}'],
    ['<', '>'], ['⟨', '⟩'], ['“', '”'],
    ['«', '»'], ['‹', '›'],
    ['《', '》'], ['〈', '〉'],
    ['⸢', '⸣'], ['⸤', '⸥'],
    ['**_', '_**']
];


export function isWhitespace(myString) {
    // includes zero-width space
    if (/^[\s\u200B]+$/.test(myString)) return true;
    return false;
}


export function countOccurrences(mainString, subString, allowOverlapping = false) {
    // Adapted from https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string

    mainString += '';
    subString += '';
    if (subString.length <= 0) return (mainString.length + 1);

    let n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = mainString.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}
// end of countOccurrences function


export function ourReplaceAll(givenString, findString, replaceString) {
    let resultString = givenString;
    while (resultString.indexOf(findString) >= 0)
        resultString = resultString.replace(findString, replaceString);
    return resultString;
}


export function ourDeleteAll(givenString, findString) {
    let resultString = givenString;
    while (resultString.indexOf(findString) >= 0)
        resultString = resultString.replace(findString, '');
    return resultString;
}