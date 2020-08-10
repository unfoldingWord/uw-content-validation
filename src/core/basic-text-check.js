import { isWhitespace, countOccurrences } from './text-handling-functions'

const CHECKER_VERSION_STRING = '0.0.3';

const DEFAULT_EXTRACT_LENGTH = 10;


export function doBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // fieldName (str): Used for identification
    // fieldText (str): The field being checked
    // allowedLinks (bool): doesn't check links -- only checks lack of links
    // optionalFieldLocation (str): Used to inform where this field is located

    // We assume that checking for compulsory fields is done elsewhere

    // Returns a single notice list
    //  The list contains arrays of five objects:
    //      1/ the priority number 0..999 (usually 800+ are errors, lower are warnings)
    //      2/ the error description string
    //      3/ the 0-based index for the position in the string (or -1 if irrelevant)
    //      4/ a short extract of the string containing the error (or empty-string if irrelevant)
    //      5/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)
    // console.log("doBasicTextChecks(" + fieldName + ", " + fieldText.length.toLocaleString() + " chars, " +allowedLinks +", '"+ optionalFieldLocation + "')…");
    console.assert(fieldName !== undefined, "doBasicTextChecks: 'fieldName' parameter should be defined");
    console.assert(typeof fieldName === 'string', "doBasicTextChecks: 'fieldName' parameter should be a number not a '" + (typeof fieldName) + "': " + fieldName);
    console.assert(fieldText !== undefined, "doBasicTextChecks: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', "doBasicTextChecks: 'fieldText' parameter should be a number not a '" + (typeof fieldText) + "': " + fieldText);
    console.assert(allowedLinks === true || allowedLinks === false, "doBasicTextChecks: allowedLinks parameter must be either true or false");

    let result = { noticeList: [] };

    function addNotice5(priority, message, index, extract, location) {
        // console.log("dBTC Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority !== undefined, "dBTCs addNotice5: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "dBTCs addNotice5: 'priority' parameter should be a number not a '" + (typeof priority) + "': " + priority);
        console.assert(message !== undefined, "dBTCs addNotice5: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "dBTCs addNotice5: 'message' parameter should be a string not a '" + (typeof message) + "': " + message);
        console.assert(index !== undefined, "dBTCs addNotice5: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "dBTCs addNotice5: 'index' parameter should be a number not a '" + (typeof index) + "': " + index);
        console.assert(extract !== undefined, "dBTCs addNotice5: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "dBTCs addNotice5: 'extract' parameter should be a string not a '" + (typeof extract) + "': " + extract);
        console.assert(location !== undefined, "dBTCs addNotice5: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "dBTCs addNotice5: 'location' parameter should be a string not a '" + (typeof location) + "': " + location);
        result.noticeList.push([priority, message, index, extract, location]);
    }


    // Main code for doBasicTextChecks()
    if (!fieldText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the fieldName
    let ourAtString = " in '" + fieldName + "'";
    if (optionalFieldLocation) {
        if (optionalFieldLocation[0] !== ' ') ourAtString += ' ';
        ourAtString += optionalFieldLocation;
    }

    if (isWhitespace(fieldText)) {
        addNotice5(638, "Only found whitespace", -1, "", ourAtString);
        return result;
    }

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (btcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    //     console.log("Using supplied extractLength=" + extractLength, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, "halfLengthPlus="+halfLengthPlus);

    let ix = fieldText.indexOf('<<<<<<<');
    if (ix >= 0) {
        const iy = ix + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(993, "Unresolved GIT conflict", ix, extract, ourAtString);
    } else {
        ix = fieldText.indexOf('=======');
        if (ix >= 0) {
            const iy = ix + halfLength; // Want extract to focus more on what follows
            const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice5(992, "Unresolved GIT conflict", ix, extract, ourAtString);
        } else {
            ix = fieldText.indexOf('>>>>>>>>');
            if (ix >= 0) {
                const iy = ix + halfLength; // Want extract to focus more on what follows
                const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')
                addNotice5(991, "Unresolved GIT conflict", ix, extract, ourAtString);
            }
        }
    }

    if (fieldText[0] === ' ') {
        const extract = fieldText.substring(0, extractLength).replace(/ /g, '␣') + (fieldText.length > extractLength ? '…' : '');
        addNotice5(106, "Unexpected leading space" + (fieldText[1] === ' ' ? "s" : ""), 0, extract, ourAtString);
    }
    if (fieldText.substring(0, 4) === '<br>' || fieldText.substring(0, 5) === '<br/>' || fieldText.substring(0, 6) === '<br />') {
        const extract = fieldText.substring(0, extractLength) + (fieldText.length > extractLength ? '…' : '');
        addNotice5(107, "Unexpected leading break", 0, extract, ourAtString);
    }
    if (fieldText[fieldText.length - 1] === ' ') {
        const extract = (fieldText.length > extractLength ? '…' : '') + fieldText.substring(fieldText.length - 10).replace(/ /g, '␣');
        addNotice5(105, "Unexpected trailing space(s)", fieldText.length - 1, extract, ourAtString);
    }
    if (fieldText.substring(fieldText.length - 4) === '<br>' || fieldText.substring(fieldText.length - 5) === '<br/>' || fieldText.substring(fieldText.length - 6) === '<br />') {
        const extract = (fieldText.length > extractLength ? '…' : '') + fieldText.substring(fieldText.length - 10);
        addNotice5(104, "Unexpected trailing break", fieldText.length - 1, extract, ourAtString);
    }
    if ((ix= fieldText.indexOf('  ')) >= 0) {
        const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus).replace(/ /g, '␣') + (ix + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(194, "Unexpected double spaces", ix, extract, ourAtString);
    }
    if ((ix = fieldText.indexOf('\n')) >= 0) {
        const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(583, "Unexpected newLine character", ix, extract, ourAtString);
    }
    if ((ix = fieldText.indexOf('\r')) >= 0) {
        const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(582, "Unexpected carriageReturn character", ix, extract, ourAtString);
    }
    if ((ix = fieldText.indexOf('\xA0')) >= 0) { // non-break space
        const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus).replace(/\xA0/g, '⍽') + (ix + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(581, "Unexpected non-break space character", ix, extract, ourAtString);
    }
    if ((ix = fieldText.indexOf('\u202F')) >= 0) { // narrow non-break space
        const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus).replace(/\u202F/g, '⍽') + (ix + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(580, "Unexpected narrow non-break space character", ix, extract, ourAtString);
    }
    if ((ix= fieldText.indexOf(' …')) >= 0) {
        const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(179, "Unexpected space before ellipse character", ix, extract, ourAtString);
    }
    if ((ix= fieldText.indexOf('… ')) >= 0) {
        const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(178, "Unexpected space after ellipse character", ix, extract, ourAtString);
    }
    // Check for doubled punctuation chars (international)
    // Doesn't check for doubled forward slash coz that might occur in a link, e.g., https://etc…
    //  or doubled # coz that occurs in markdown
    let checkList = '’\'({}<>⟨⟩:,،、‒–—―…!‹›«»‐-?‘’“”\'";⁄·&*@•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
    if (!allowedLinks) checkList += '[].)' // Double square brackets can be part of markdown links, double periods can be part of a path
    for (const punctChar of checkList) {
        ix = fieldText.indexOf(punctChar + punctChar);
        if (ix >= 0) {
            let extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice5(177, "Unexpected doubled " + punctChar + " characters", ix, extract, ourAtString);
        }
    }
    // Check for punctuation chars following space
    for (const punctChar of '.\')}>⟩:,،、‒–—―…!.‹›«»‐-?’”\'";/⁄·*@•^†‡°¡¿※#№÷×ºª%‰‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        ix = fieldText.indexOf(' ' + punctChar);
        if (ix >= 0) {
            let extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice5(191, "Unexpected " + punctChar + " character after space", ix, extract, ourAtString);
        }
    }
    // Check for punctuation chars before space
    for (const punctChar of '\'[({<⟨،、‒–—―‹«‐‘“/⁄·@\•^†‡°¡¿※№×ºª%‰‱¶′″‴§~_|‖¦©℗℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        ix = fieldText.indexOf(punctChar + ' ');
        if (ix >= 0) {
            let extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice5(192, "Unexpected space after " + punctChar + " character", ix, extract, ourAtString);
        }
    }

    // Check matched pairs
    // for (const punctSet of ['[]', '()', '{}', '<>', '⟨⟩', '“”', '‹›', '«»']) {
    for (const punctSet of [['[', ']'], ['(', ')'], ['{', '}'],
    ['<', '>'], ['⟨', '⟩'], ['“', '”'],
    ['‹', '›'], ['«', '»'], ['**_', '_**']]) {
        // Can't check '‘’' coz they might be used as apostrophe
        const leftChar = punctSet[0], rightChar = punctSet[1];
        const lCount = countOccurrences(fieldText, leftChar);
        const rCount = countOccurrences(fieldText, rightChar);
        if (lCount !== rCount)
            addNotice5(663, "Mismatched " + leftChar + rightChar + " characters", -1, "(left=" + lCount.toLocaleString() + ", right=" + rCount.toLocaleString() + ")", ourAtString);
    }

    if (!allowedLinks) {
        // Simple check that there aren't any
        ix = fieldText.indexOf('://');
        if (ix === -1) ix = fieldText.indexOf('http');
        if (ix === -1) ix = fieldText.indexOf('ftp');
        // The following might have to be removed if text fields can contain email addresses
        if (ix === -1) ix = fieldText.indexOf('.org');
        if (ix === -1) ix = fieldText.indexOf('.com');
        if (ix === -1) ix = fieldText.indexOf('.info');
        if (ix === -1) ix = fieldText.indexOf('.bible');
        if (ix >= 0) {
            let extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice5(765, "Unexpected link", ix, extract, ourAtString);
        }
    }
    return result;
}
// end of doBasicTextChecks function

export default doBasicTextChecks;
