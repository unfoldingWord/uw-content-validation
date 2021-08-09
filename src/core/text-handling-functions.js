// See http://xahlee.info/comp/unicode_matching_brackets.html for a more complete list
// Also see https://unicode-table.com/en/sets/quotation-marks/
export const PAIRED_PUNCTUATION_OPENERS = '[({<⟨“‘«‹《〈⸢⸤'; // These are just single/individual characters
export const PAIRED_PUNCTUATION_CLOSERS = '])}>⟩”’»›》〉⸣⸥';
export const OPEN_CLOSE_PUNCTUATION_PAIRS = [
    // These can be multiple character sequences (as long as opener and closer are different/distinguishable)
    ['[', ']'], ['(', ')'], ['{', '}'],
    ['“', '”'], ['‘', '’'],
    ['<', '>'], ['⟨', '⟩'],
    ['«', '»'], ['‹', '›'],
    ['《', '》'], ['〈', '〉'],
    ['⸢', '⸣'], ['⸤', '⸥'],
    ['**_', '_**'] // TODO: Does this markdown belong here???
];
// NOTE: Single closing quote is NOT included below, coz it could be an apostrophe
export const CLOSING_PUNCTUATION_CHARACTERS = ',.?!;:)”־׃'; // NOTE: Some Hebrew characters included there

export const HEBREW_VOWELS = '\\u05B4\\u05B5\\u05B6\\u05B7\\u05B8\\u05B9\\u05BA\\05BB'; // There’s 8 vowel marks in there
export const HEBREW_CANTILLATION_MARKS = '\\u0591\\u0592\\u0593\\u0594\\u0595\\u0596\\u0597\\u0598\\u0599\\u059A\\u059B\\u059C\\u059D\\u059E\\u059F\\u05A0\\u05A1\\u05A2\\u05A3\\u05A4\\u05A5\\u05A6\\u05A7\\u05A8\\u05A9\\u05AA\\u05AB\\u05AC\\u05AD\\u05AE\\u05AF'; // There’s 31 accent marks in there
export const HEBREW_CANTILLATION_REGEX = new RegExp('[\\u0591-\\u05AF]', 'g'); // There’s 31 accent marks in there

export const BAD_CHARACTER_COMBINATIONS = [
    '\\[\\[', '\\]\\]', // These were introduced by a tC Create bug (NOTE: \[ or \] is quite legal)
    '] (http', '] (.', // Bad markdown links (with a space between the parts)
];
export const LEADING_ZERO_COMBINATIONS = [
    ' 0', ':0', '<br>0', '“0', '‘0',
];

export function isWhitespace(myString) {
    // includes zero-width space
    if (/^[\s\u200B]+$/.test(myString)) return true;
    return false;
}


export const countOccurrencesInList = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
// Adapted from https://www.codegrepper.com/code-examples/javascript/javascript+count+number+of+occurrences+in+array

export function countOccurrencesInString(mainString, subString, allowOverlapping = false) {
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
// end of countOccurrencesInString function


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
