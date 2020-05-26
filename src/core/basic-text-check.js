import { isWhitespace, countOccurrences } from './text-handling-functions'


export function doBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // fieldName (str): Used for identification
    // fieldText (str): The field being checked
    // allowedLinks (bool): doesn't check links -- only checks lack of links
    // optionalFieldLocation (str): Used to inform where this field is located

    // We assume that checking for compulsory fields is done elsewhere

    // Returns an error list and a warning list
    //  Both lists contain lists of two strings:
    //      1/ the error string
    //      2/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)

    let result = {errorList:[], warningList:[]};

    function addError(errorPart, locationPart) {
        // console.log("ERROR: " + errorPart + locationPart);
        result.errorList.push([errorPart, locationPart]);
    }
    function addWarning(warningPart, locationPart) {
        // console.log(`Warning: ${warningPart}${locationPart}`);
        result.warningList.push([warningPart, locationPart]);
    }

    if (!fieldText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the fieldName
    let ourAtString = " in '" + fieldName + "'";
    if (optionalFieldLocation) {
        if (optionalFieldLocation[0] != ' ') ourAtString += ' ';
        ourAtString += optionalFieldLocation;
    }

    if (isWhitespace(fieldText)) {
        addError("Only found whitespace", ourAtString);
        return result;
    }
    if (fieldText[0] == ' ') {
        let extract = fieldText.substring(0, 10).replace(/ /g, '␣') + (fieldText.length > 10 ? '…' : '');
        addWarning("Unexpected leading space" + (fieldText[1] == ' ' ? "s" : ""), ` in '${extract}'${ourAtString}`);
    }
    if (fieldText.substring(0, 4) == '<br>' || fieldText.substring(0, 5) == '<br/>' || fieldText.substring(0, 6) == '<br />') {
        let extract = fieldText.substring(0, 10) + (fieldText.length > 10 ? '…' : '');
        addWarning("Unexpected leading break", " in '" + extract + "'" + ourAtString);
    }
    if (fieldText[fieldText.length - 1] == ' ') {
        let extract = (fieldText.length > 10 ? '…' : '') + fieldText.substring(fieldText.length - 10).replace(/ /g, '␣');
        addWarning("Unexpected trailing space(s)", " in '" + extract + "'" + ourAtString);
    }
    if (fieldText.substring(fieldText.length - 4) == '<br>' || fieldText.substring(fieldText.length - 5) == '<br/>' || fieldText.substring(fieldText.length - 6) == '<br />') {
        let extract = (fieldText.length > 10 ? '…' : '') + fieldText.substring(fieldText.length - 10);
        addWarning("Unexpected trailing break", " in '" + extract + "'" + ourAtString);
    }
    let ix = fieldText.indexOf('  ');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        addWarning("Unexpected double spaces", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString);
    }
    ix = fieldText.indexOf('\n');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        addWarning("Unexpected newLine character", " (at character " + (ix + 1) + ") in '" + extract + "'" + ourAtString);
    }
    ix = fieldText.indexOf('\r');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        addWarning("Unexpected carriageReturn character", " (at character " + (ix + 1) + ") in '" + extract + "'" + ourAtString);
    }
    ix = fieldText.indexOf('\xA0'); // non-break space
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        addWarning("Unexpected non-break space character", " (at character " + (ix + 1) + ") in '" + extract.replace(/\xA0/g, '⍽') + "'" + ourAtString);
    }
    ix = fieldText.indexOf('\u202F'); // narrow non-break space
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        addWarning("Unexpected narrow non-break space character", " (at character " + (ix + 1) + ") in '" + extract.replace(/\u202F/g, '⍽') + "'" + ourAtString);
    }
    ix = fieldText.indexOf(' …');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        addWarning("Unexpected space before ellipse character", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString);
    }
    ix = fieldText.indexOf('… ');
    if (ix >= 0) {
        let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
        addWarning("Unexpected space after ellipse character", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString);
    }
    // Check for doubled punctuation chars (international)
    // Doesn't check for doubled forward slash coz that might occur in a link, e.g., https://etc…
    let checkList = '.’\'(){}<>⟨⟩:,،、‒–—―…!.‹›«»‐-?‘’“”\'";⁄·&*@•^†‡°”¡¿※#№÷×ºª%‰+−=‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
    if (! allowedLinks) checkList += '[]' // Double square brackets can be part of markdown links
    for (let punctChar of checkList) {
        ix = fieldText.indexOf(punctChar + punctChar);
        if (ix >= 0) {
            let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
            addWarning("Unexpected doubled " + punctChar + " character", " (at character " + (ix + 1) + ") in '" + extract + "'" + ourAtString);
        }
    }
    // Check for punctuation chars following space
    for (let punctChar of '.’\')}>⟩:,،、‒–—―…!.‹›«»‐-?‘’“”\'";/⁄·*@•^†‡°”¡¿※#№÷×ºª%‰+−=‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        ix = fieldText.indexOf(' ' + punctChar);
        if (ix >= 0) {
            let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
            addWarning("Unexpected " + punctChar + " character after space", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString);
        }
    }
    // Check for punctuation chars before space
    for (let punctChar of '’\'[({<⟨،、‒–—―….‹«‐-‘’“”\'"/⁄·@\•^†‡°”¡¿※#№÷×ºª%‰+−=‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        ix = fieldText.indexOf(punctChar + ' ');
        if (ix >= 0) {
            let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
            addWarning("Unexpected space after " + punctChar + " character", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString);
        }
    }

    // Check matched pairs
    for (let punctSet of ['[]', '()', '{}', '<>', '⟨⟩', '‘’', '“”', '‹›', '«»']) {
        let leftChar = punctSet[0], rightChar = punctSet[1];
        let lCount = countOccurrences(fieldText, leftChar);
        let rCount = countOccurrences(fieldText, rightChar);
        if (lCount != rCount)
            addWarning("Mismatched " + punctSet + " characters (left=" + lCount + ", right=" + rCount + ")", ourAtString);
    }

    if (!allowedLinks) {
        // Simple check that there aren't any
        ix = fieldText.indexOf('://');
        if (ix == -1) ix = fieldText.indexOf('http');
        if (ix == -1) ix = fieldText.indexOf('ftp');
        // The following might have to be removed if text fields can contain email addresses
        if (ix == -1) ix = fieldText.indexOf('.org');
        if (ix == -1) ix = fieldText.indexOf('.com');
        if (ix == -1) ix = fieldText.indexOf('.info');
        if (ix == -1) ix = fieldText.indexOf('.bible');
        if (ix >= 0) {
            let extract = (ix > 5 ? '…' : '') + fieldText.substring(ix - 5, ix + 6) + (ix + 6 < fieldText.length ? '…' : '')
            addWarning("Unexpected link", " (at character " + (ix + 1) + ") in '" + extract.replace(/ /g, '␣') + "'" + ourAtString);
        }
    }
    return result;
}
// end of doBasicTextChecks function

export default doBasicTextChecks;
