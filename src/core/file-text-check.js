import { isWhitespace, countOccurrences } from './text-handling-functions'

export const CHECKER_VERSION_STRING = '0.1.1';

const DEFAULT_EXTRACT_LENGTH = 10;


export function checkFileText(filename, fileText, optionalFileLocation, optionalCheckingOptions) {
    // Does basic checks for small errors like mismatched punctuation pairs, etc.
    //  (Used by usfm-text-check)

    // filename (str): Used for identification
    // fileText (str): The field being checked
    // allowedLinks (bool): doesn't check links -- only checks lack of links
    // optionalFileLocation (str): Used to inform where this field is located

    // We assume that checking for compulsory fields is done elsewhere

    // Returns a single notice list
    //  The list contains objects with the following fields:
    //      priority (compulsory): the priority number 0..999 (usually 800+ are errors, lower are warnings)
    //      message (compulsory): the error description string
    //      characterIndeX: the 0-based index for the position in the string
    //      extract: a short extract of the string containing the error (or empty-string if irrelevant)
    //      location: the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)
    // console.log(`checkFileText(${filename}, ${fileText.length.toLocaleString()} chars, ${allowedLinks}, '${optionalFileLocation}')…`);
    console.assert(filename !== undefined, "checkFileText: 'filename' parameter should be defined");
    console.assert(typeof filename === 'string', `checkFileText: 'filename' parameter should be a number not a '${typeof filename}': ${filename}`);
    console.assert(fileText !== undefined, "checkFileText: 'fileText' parameter should be defined");
    console.assert(typeof fileText === 'string', `checkFileText: 'fileText' parameter should be a number not a '${typeof fileText}': ${fileText}`);
    // console.assert( allowedLinks===true || allowedLinks===false, "checkFileText: allowedLinks parameter must be either true or false");

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


    // Main code for checkFileText()
    if (!fileText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the filename
    let ourAtString = ` in '${filename}'`;
    if (optionalFileLocation) {
        if (optionalFileLocation[0] !== ' ') ourAtString += ' ';
        ourAtString += optionalFileLocation;
    }

    if (isWhitespace(fileText)) {
        addNotice6({priority:638, message:"Only found whitespace", location:ourAtString});
        return result;
    }

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (bfcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
        // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    let characterIndex;
    if ((characterIndex = fileText.indexOf('<<<<<<<')) >= 0) {
        const iy = characterIndex + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + fileText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fileText.length ? '…' : '')
        addNotice6({priority:993, message:"Unresolved GIT conflict", characterIndex, extract, location:ourAtString});
    } else if ((characterIndex = fileText.indexOf('=======')) >= 0) {
        const iy = characterIndex + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + fileText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fileText.length ? '…' : '')
        addNotice6({priority:992, message:"Unresolved GIT conflict", characterIndex, extract, location:ourAtString});
    } else if ((characterIndex = fileText.indexOf('>>>>>>>>')) >= 0) {
        const iy = characterIndex + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + fileText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fileText.length ? '…' : '')
        addNotice6({priority:991, message:"Unresolved GIT conflict", characterIndex, extract, location:ourAtString});
    }

    // Check matched pairs
    for (const punctSet of [['[', ']'], ['(', ')'], ['{', '}'],
    ['<', '>'], ['⟨', '⟩'], ['“', '”'],
    ['‹', '›'], ['«', '»'], ['**_', '_**']]) {
        // Can't check '‘’' coz they might be used as apostrophe
        const leftChar = punctSet[0], rightChar = punctSet[1];
        const lCount = countOccurrences(fileText, leftChar);
        const rCount = countOccurrences(fileText, rightChar);
        if (lCount !== rCount)
            addNotice6({priority:163, message:`Mismatched ${leftChar}${rightChar} characters`, extract:`(left=${lCount.toLocaleString()}, right=${rCount.toLocaleString()})`, location:ourAtString});
    }

    // if (!allowedLinks) {
    //     // Simple check that there aren't any
    //     ix = fileText.indexOf('://');
    //     if (ix === -1) ix = fileText.indexOf('http');
    //     if (ix === -1) ix = fileText.indexOf('ftp');
    //     // The following might have to be removed if text fields can contain email addresses
    //     if (ix === -1) ix = fileText.indexOf('.org');
    //     if (ix === -1) ix = fileText.indexOf('.com');
    //     if (ix === -1) ix = fileText.indexOf('.info');
    //     if (ix === -1) ix = fileText.indexOf('.bible');
    //     if (ix >= 0) {
    //         let extract = (ix>halfLength ? '…' : '') + fileText.substring(ix-halfLength, ix+halfLengthPlus) + (ix+halfLengthPlus < fileText.length ? '…' : '')
    //         addNotice6({765, "Unexpected link", ix,extract, ourAtString});
    //     }
    // }
    return result;
}
// end of checkFileText function

export default checkFileText;
