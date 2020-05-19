import { React, useContext } from 'react';
// import {
//     RepositoryContext,
//     FileContext,
// } from 'gitea-react-toolkit';


function isWhitespace(myString) {
    if (/^\s+$/.test(myString)) return true;
    return false;
}


function occurrences(mainString, subString, allowOverlapping = false) {
    // Adapted from https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string

    mainString += "";
    subString += "";
    if (subString.length <= 0) return (mainString.length + 1);

    var n = 0,
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
// end of occurrences function


function doBasicTextChecks(fieldName, fieldText, optionalFieldLocation) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // We assume that checking for compulsory fields is done elsewhere

    // Returns an error list and a warning list
    //  Both lists contain lists of two strings:
    //      1/ the error string
    //      2/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)

    let result = {};
    result.errorList = [];
    result.warningList = [];

    if (!fieldText) return result;

    // Create our more detailed location string by prepending the fieldName
    let ourAtString = " in '" + fieldName + "'";
    if (optionalFieldLocation) {
        if (optionalFieldLocation[0] != ' ') ourAtString += ' ';
        ourAtString += optionalFieldLocation;
    }

    if (isWhitespace(fieldText)) {
        result.errorList.push(["Only found whitespace", ourAtString]);
        return result;
    }
    if (fieldText[0] == ' ') {
        let extract = fieldText.substring(0, 10).replace(/ /g, '␣') + (fieldText.length > 10 ? '…' : '');
        result.warningList.push(["Unexpected leading space" + (fieldText[1] == ' ' ? "s" : ""), ` in '${extract}'${ourAtString}`]);
    }
    if (fieldText.substring(0, 4) == '<br>' || fieldText.substring(0, 5) == '<br/>' || fieldText.substring(0, 6) == '<br />') {
        let extract = fieldText.substring(0, 10) + (fieldText.length > 10 ? '…' : '');
        result.warningList.push(["Unexpected leading break", " in '" + extract + "'" + ourAtString]);
    }
    if (fieldText[fieldText.length - 1] == ' ') {
        let extract = (fieldText.length > 10 ? '…' : '') + fieldText.substring(fieldText.length - 10).replace(/ /g, '␣');
        result.warningList.push(["Unexpected trailing space(s)", " in '" + extract + "'" + ourAtString]);
    }
    if (fieldText.substring(fieldText.length - 4) == '<br>' || fieldText.substring(fieldText.length - 5) == '<br/>' || fieldText.substring(fieldText.length - 6) == '<br />') {
        let extract = (fieldText.length > 10 ? '…' : '') + fieldText.substring(fieldText.length - 10);
        result.warningList.push(["Unexpected trailing break", " in '" + extract + "'" + ourAtString]);
    }
    let ix = fieldText.indexOf('  ');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        result.warningList.push(["Unexpected double spaces", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString]);
    }
    ix = fieldText.indexOf('\n');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        result.warningList.push(["Unexpected newLine character", " (at character " + (ix + 1) + ") in '" + extract + "'" + ourAtString]);
    }
    ix = fieldText.indexOf('\r');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        result.warningList.push(["Unexpected carriageReturn character", " (at character " + (ix + 1) + ") in '" + extract + "'" + ourAtString]);
    }
    ix = fieldText.indexOf('\xA0'); // non-break space
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        result.warningList.push(["Unexpected non-break space character", " (at character " + (ix + 1) + ") in '" + extract.replace(/\xA0/g, '⍽') + "'" + ourAtString]);
    }
    ix = fieldText.indexOf('\u202F'); // narrow non-break space
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        result.warningList.push(["Unexpected narrow non-break space character", " (at character " + (ix + 1) + ") in '" + extract.replace(/\u202F/g, '⍽') + "'" + ourAtString]);
    }
    ix = fieldText.indexOf(' …');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        result.warningList.push(["Unexpected space before ellipse character", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString]);
    }
    ix = fieldText.indexOf('… ');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        result.warningList.push(["Unexpected space after ellipse character", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString]);
    }
    // Check for doubled punctuation chars (international)
    for (let punctChar of '.’\'[](){}<>⟨⟩:,،、‒–—―…!.‹›«»‐-?‘’“”\'";/⁄·&*@•^†‡°”¡¿※#№÷×ºª%‰+−=‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        ix = fieldText.indexOf(punctChar + punctChar);
        if (ix >= 0) {
            let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
            result.warningList.push(["Unexpected doubled " + punctChar + " character", " (at character " + (ix + 1) + ") in '" + extract + "'" + ourAtString]);
        }
    }
    // Check for punctuation chars following space
    for (let punctChar of '.’\'])}>⟩:,،、‒–—―…!.‹›«»‐-?‘’“”\'";/⁄·*@•^†‡°”¡¿※#№÷×ºª%‰+−=‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        ix = fieldText.indexOf(' ' + punctChar);
        if (ix >= 0) {
            let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
            result.warningList.push(["Unexpected " + punctChar + " character after space", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString]);
        }
    }
    // Check for punctuation chars before space
    for (let punctChar of '’\'[({<⟨،、‒–—―….‹«‐-‘’“”\'"/⁄·@\•^†‡°”¡¿※#№÷×ºª%‰+−=‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        ix = fieldText.indexOf(punctChar + ' ');
        if (ix >= 0) {
            let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
            result.warningList.push(["Unexpected space after " + punctChar + " character", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString]);
        }
    }

    // Check matched pairs
    for (let punctSet of ['[]', '()', '{}', '<>', '⟨⟩', '‘’', '“”', '‹›', '«»']) {
        let leftChar = punctSet[0];
        let rightChar = punctSet[1];
        let lCount = occurrences(fieldText, leftChar);
        let rCount = occurrences(fieldText, rightChar);
        if (lCount != rCount)
            result.warningList.push(["Mismatched " + punctSet + " characters (left=" + lCount + ", right=" + rCount + ")", ourAtString]);
    }

    return result;
}
// end of doBasicTextChecks function

export default doBasicTextChecks;
