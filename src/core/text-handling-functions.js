export function isWhitespace(myString) {
    if (/^\s+$/.test(myString)) return true;
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
