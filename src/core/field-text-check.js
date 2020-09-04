import { isWhitespace, countOccurrences } from './text-handling-functions'

const CHECKER_VERSION_STRING = '0.1.1';

const DEFAULT_EXTRACT_LENGTH = 10;


export function checkTextField(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // fieldName (str): Used for identification
    // fieldText (str): The field being checked
    // allowedLinks (bool): doesn't check links -- only checks lack of links
    // optionalFieldLocation (str): Used to inform where this field is located

    // We assume that checking for compulsory fields is done elsewhere

    // Returns a single notice list
    //  The list contains objects with the following fields:
    //      priority (compulsory): the priority number 0..999 (usually 800+ are errors, lower are warnings)
    //      message (compulsory): the error description string
    //      characterIndeX: the 0-based index for the position in the string
    //      extract: a short extract of the string containing the error (or empty-string if irrelevant)
    //      location: the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)
    // console.log(`checkTextField(${fieldName}, ${fieldText.length.toLocaleString()} chars, ${allowedLinks}, '${optionalFieldLocation}')…`);
    console.assert(fieldName !== undefined, "checkTextField: 'fieldName' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkTextField: 'fieldName' parameter should be a number not a '${typeof fieldName}': ${fieldName}`);
    console.assert(fieldText !== undefined, "checkTextField: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkTextField: 'fieldText' parameter should be a number not a '${typeof fieldText}': ${fieldText}`);
    console.assert(allowedLinks === true || allowedLinks === false, "checkTextField: allowedLinks parameter must be either true or false");

    let result = { noticeList: [] };

    function addNotice6({priority,message, lineNumber,characterIndex, extract, location}) {
        // console.log(`dBTC Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "dBTCs addNotice6: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `dBTCs addNotice6: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "dBTCs addNotice6: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `dBTCs addNotice6: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // console.assert(characterIndex !== undefined, "dBTCs addNotice6: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `dBTCs addNotice6: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // console.assert(extract !== undefined, "dBTCs addNotice6: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `dBTCs addNotice6: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "dBTCs addNotice6: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `dBTCs addNotice6: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({priority, message, lineNumber, characterIndex,extract, location});
    }


    // Main code for checkTextField()
    if (!fieldText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the fieldName
    let ourAtString = ` in '${fieldName}'`;
    if (optionalFieldLocation) {
        if (optionalFieldLocation[0] !== ' ') ourAtString += ' ';
        ourAtString += optionalFieldLocation;
    }

    if (isWhitespace(fieldText)) {
        addNotice6({priority:638, message:"Only found whitespace", location:ourAtString});
        return result;
    }

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (btcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
        // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    let characterIndex = fieldText.indexOf('<<<<<<<');
    if (characterIndex >= 0) {
        const iy = characterIndex + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice6({priority:993, message:"Unresolved GIT conflict", characterIndex, extract, location:ourAtString});
    } else {
        characterIndex = fieldText.indexOf('=======');
        if (characterIndex >= 0) {
            const iy = characterIndex + halfLength; // Want extract to focus more on what follows
            const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice6({priority:992, message:"Unresolved GIT conflict", characterIndex, extract, location:ourAtString});
        } else {
            characterIndex = fieldText.indexOf('>>>>>>>>');
            if (characterIndex >= 0) {
                const iy = characterIndex + halfLength; // Want extract to focus more on what follows
                const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')
                addNotice6({priority:991, message:"Unresolved GIT conflict", characterIndex, extract, location:ourAtString});
            }
        }
    }

    if (fieldText[0] === ' ') {
        const extract = fieldText.substring(0, extractLength).replace(/ /g, '␣') + (fieldText.length > extractLength ? '…' : '');
        addNotice6({priority:106, message:`Unexpected leading space${fieldText[1] === ' ' ? "s" : ""}`, characterIndex:0, extract, location:ourAtString});
    }
    if (fieldText.substring(0, 4) === '<br>' || fieldText.substring(0, 5) === '<br/>' || fieldText.substring(0, 6) === '<br />') {
        const extract = fieldText.substring(0, extractLength) + (fieldText.length > extractLength ? '…' : '');
        addNotice6({priority:107, message:"Unexpected leading break", characterIndex:0, extract, location:ourAtString});
    }
    if (fieldText[fieldText.length - 1] === ' ') {
        const extract = (fieldText.length > extractLength ? '…' : '') + fieldText.substring(fieldText.length - 10).replace(/ /g, '␣');
        addNotice6({priority:105, message:"Unexpected trailing space(s)", characterIndex:fieldText.length - 1, extract, location:ourAtString});
    }
    if (fieldText.substring(fieldText.length - 4) === '<br>' || fieldText.substring(fieldText.length - 5) === '<br/>' || fieldText.substring(fieldText.length - 6) === '<br />') {
        const extract = (fieldText.length > extractLength ? '…' : '') + fieldText.substring(fieldText.length - 10);
        addNotice6({priority:104, message:"Unexpected trailing break", characterIndex:fieldText.length - 1, extract, location:ourAtString});
    }
    if ((characterIndex= fieldText.indexOf('  ')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice6({priority:194, message:"Unexpected double spaces", characterIndex, extract, location:ourAtString});
    }
    if ((characterIndex = fieldText.indexOf('\n')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice6({priority:583, message:"Unexpected newLine character", characterIndex, extract, location:ourAtString});
    }
    if ((characterIndex = fieldText.indexOf('\r')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice6({priority:582, message:"Unexpected carriageReturn character", characterIndex, extract, location:ourAtString});
    }
    if ((characterIndex = fieldText.indexOf('\xA0')) >= 0) { // non-break space
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/\xA0/g, '⍽') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice6({priority:581, message:"Unexpected non-break space character", characterIndex, extract, location:ourAtString});
    }
    if ((characterIndex = fieldText.indexOf('\u202F')) >= 0) { // narrow non-break space
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/\u202F/g, '⍽') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice6({priority:580, message:"Unexpected narrow non-break space character", characterIndex, extract, location:ourAtString});
    }
    if ((characterIndex= fieldText.indexOf(' …')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice6({priority:179, message:"Unexpected space before ellipse character", characterIndex, extract, location:ourAtString});
    }
    if ((characterIndex= fieldText.indexOf('… ')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice6({priority:178, message:"Unexpected space after ellipse character", characterIndex, extract, location:ourAtString});
    }
    // Check for doubled punctuation chars (international)
    // Doesn't check for doubled forward slash coz that might occur in a link, e.g., https://etc…
    //  or doubled # coz that occurs in markdown
    let checkList = '’\'({}<>⟨⟩:,،、‒–—―…!‹›«»‐-?‘’“”\'";⁄·&*@•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
    if (!allowedLinks) checkList += '[].)' // Double square brackets can be part of markdown links, double periods can be part of a path
    for (const punctChar of checkList) {
        characterIndex = fieldText.indexOf(punctChar + punctChar);
        if (characterIndex >= 0) {
            let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice6({priority:177, message:`Unexpected doubled ${punctChar} characters`, characterIndex, extract, location:ourAtString});
        }
    }
    // Check for punctuation chars following space
    for (const punctChar of '.\')}>⟩:,،、‒–—―…!.‹›«»‐-?’”\'";/⁄·*@•^†‡°¡¿※#№÷×ºª%‰‱¶′″‴§~_|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        characterIndex = fieldText.indexOf(' ' + punctChar);
        if (characterIndex >= 0) {
            let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice6({priority:191, message:`Unexpected ${punctChar} character after space`, characterIndex, extract, location:ourAtString});
        }
    }
    // Check for punctuation chars before space
    //  Removed ' (can be normal, e.g., Jesus' cloak)
    for (const punctChar of '[({<⟨،、‒–—―‹«‐‘“/⁄·@\•^†‡°¡¿※№×ºª‰‱¶′″‴§~_|‖¦©℗℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥') {
        characterIndex = fieldText.indexOf(punctChar + ' ');
        if (characterIndex >= 0) {
            let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice6({priority:192, message:`Unexpected space after ${punctChar} character`, characterIndex, extract, location:ourAtString});
        }
    }

    // Check matched pairs
    for (const punctSet of [['[', ']'], ['(', ')'], ['{', '}'],
                            ['<', '>'], ['⟨', '⟩'], ['“', '”'],
                            ['‹', '›'], ['«', '»'], ['**_', '_**']]) {
        // Can't check '‘’' coz they might be used as apostrophe
        const leftChar = punctSet[0], rightChar = punctSet[1];
        const lCount = countOccurrences(fieldText, leftChar);
        const rCount = countOccurrences(fieldText, rightChar);
        if (lCount !== rCount)
            addNotice6({priority:663, message:`Mismatched ${leftChar}${rightChar} characters`, extract:`(left=${lCount.toLocaleString()}, right=${rCount.toLocaleString()})`, location:ourAtString});
    }

    if (!allowedLinks) {
        // Simple check that there aren't any
        characterIndex = fieldText.indexOf('://');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('http');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('ftp');
        // The following might have to be removed if text fields can contain email addresses
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.org');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.com');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.info');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.bible');
        if (characterIndex >= 0) {
            let extract = `${characterIndex > halfLength ? '…' : ''}${fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus)}${characterIndex + halfLengthPlus < fieldText.length ? '…' : ''}`
            addNotice6({priority:765, message:"Unexpected link", characterIndex, extract, location:ourAtString});
        }
    }
    return result;
}
// end of checkTextField function

export default checkTextField;
