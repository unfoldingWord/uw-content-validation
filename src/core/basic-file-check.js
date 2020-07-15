import { isWhitespace, countOccurrences } from './text-handling-functions'

const CHECKER_VERSION_STRING = '0.0.1';

const DEFAULT_EXTRACT_LENGTH = 10;


export function doBasicFileChecks(filename, fileText, optionalFileLocation, optionalCheckingOptions) {
    // Does basic checks for small errors like mismatched punctuation pairs, etc.

    // filename (str): Used for identification
    // fileText (str): The field being checked
    // allowedLinks (bool): doesn't check links -- only checks lack of links
    // optionalFileLocation (str): Used to inform where this field is located

    // We assume that checking for compulsory fields is done elsewhere

    // Returns a single notice list
    //  The list contains arrays of five objects:
    //      1/ the priority number 0..999 (usually 800+ are errors, lower are warnings)
    //      2/ the error description string
    //      3/ the 0-based index for the position in the string (or -1 if irrelevant)
    //      4/ a short extract of the string containing the error (or empty-string if irrelevant)
    //      5/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)
    // console.log("doBasicFileChecks(" + filename + ", " + fileText.length.toLocaleString() + " chars, " +allowedLinks +", '"+ optionalFileLocation + "')…");
    console.assert(filename!==undefined, "doBasicFileChecks: 'filename' parameter should be defined");
    console.assert(typeof filename==='string', "doBasicFileChecks: 'filename' parameter should be a number not a '"+(typeof filename)+"': "+filename);
    console.assert(fileText!==undefined, "doBasicFileChecks: 'fileText' parameter should be defined");
    console.assert(typeof fileText==='string', "doBasicFileChecks: 'fileText' parameter should be a number not a '"+(typeof fileText)+"': "+fileText);
    // console.assert( allowedLinks===true || allowedLinks===false, "doBasicFileChecks: allowedLinks parameter must be either true or false");

    let result = { noticeList: [] };

    function addNotice(priority, message, index, extract, location) {
        // console.log("dBTC Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority!==undefined, "dBTCs addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', "dBTCs addNotice: 'priority' parameter should be a number not a '"+(typeof priority)+"': "+priority);
        console.assert(message!==undefined, "dBTCs addNotice: 'message' parameter should be defined");
        console.assert(typeof message==='string', "dBTCs addNotice: 'message' parameter should be a string not a '"+(typeof message)+"': "+message);
        console.assert(index!==undefined, "dBTCs addNotice: 'index' parameter should be defined");
        console.assert(typeof index==='number', "dBTCs addNotice: 'index' parameter should be a number not a '"+(typeof index)+"': "+index);
        console.assert(extract!==undefined, "dBTCs addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract==='string', "dBTCs addNotice: 'extract' parameter should be a string not a '"+(typeof extract)+"': "+extract);
        console.assert(location!==undefined, "dBTCs addNotice: 'location' parameter should be defined");
        console.assert(typeof location==='string', "dBTCs addNotice: 'location' parameter should be a string not a '"+(typeof location)+"': "+location);
        result.noticeList.push([priority, message, index, extract, location]);
    }


    // Main code for doBasicFileChecks()
    if (!fileText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the filename
    let ourAtString = " in '" + filename + "'";
    if (optionalFileLocation) {
        if (optionalFileLocation[0] != ' ') ourAtString += ' ';
        ourAtString += optionalFileLocation;
    }

    if (isWhitespace(fileText)) {
        addNotice(638, "Only found whitespace", -1, "", ourAtString);
        return result;
    }

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (e) {}
    if (typeof extractLength != 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    //     console.log("Using supplied extractLength=" + extractLength, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength+1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, "halfLengthPlus="+halfLengthPlus);

    let ix = fileText.indexOf('<<<<<<<');
    if (ix >= 0) {
        let iy = ix+halfLength; // Want extract to focus more on what follows
        const extract = (iy>halfLength ? '…' : '') + fileText.substring(iy-halfLength, iy+halfLengthPlus).replace(/ /g, '␣') + (iy+halfLengthPlus < fileText.length ? '…' : '')
        addNotice(993, "Unresolved GIT conflict", ix, extract, ourAtString);
    } else {
        ix = fileText.indexOf('=======');
        if (ix >= 0) {
            let iy = ix+halfLength; // Want extract to focus more on what follows
            const extract = (iy>halfLength ? '…' : '') + fileText.substring(iy-halfLength, iy+halfLengthPlus).replace(/ /g, '␣') + (iy+halfLengthPlus < fileText.length ? '…' : '')
            addNotice(992, "Unresolved GIT conflict", ix, extract, ourAtString);
        } else {
            ix = fileText.indexOf('>>>>>>>>');
            if (ix >= 0) {
                let iy = ix+halfLength; // Want extract to focus more on what follows
                const extract = (iy>halfLength ? '…' : '') + fileText.substring(iy-halfLength, iy+halfLengthPlus).replace(/ /g, '␣') + (iy+halfLengthPlus < fileText.length ? '…' : '')
                addNotice(991, "Unresolved GIT conflict", ix, extract, ourAtString);
            }
        }
    }

    // Check matched pairs
    for (let punctSet of [['[',']'], ['(',')'], ['{','}'],
                          ['<','>'], ['⟨','⟩'], ['“','”'],
                          ['‹','›'], ['«','»'], ['**_','_**']]) {
        // Can't check '‘’' coz they might be used as apostrophe
        const leftChar = punctSet[0], rightChar = punctSet[1];
        const lCount = countOccurrences(fileText, leftChar);
        const rCount = countOccurrences(fileText, rightChar);
        if (lCount != rCount)
            addNotice(663, "Mismatched " + leftChar+rightChar + " characters", -1, "(left=" + lCount.toLocaleString() + ", right=" + rCount.toLocaleString() + ")", ourAtString);
    }

    // if (!allowedLinks) {
    //     // Simple check that there aren't any
    //     ix = fileText.indexOf('://');
    //     if (ix == -1) ix = fileText.indexOf('http');
    //     if (ix == -1) ix = fileText.indexOf('ftp');
    //     // The following might have to be removed if text fields can contain email addresses
    //     if (ix == -1) ix = fileText.indexOf('.org');
    //     if (ix == -1) ix = fileText.indexOf('.com');
    //     if (ix == -1) ix = fileText.indexOf('.info');
    //     if (ix == -1) ix = fileText.indexOf('.bible');
    //     if (ix >= 0) {
    //         let extract = (ix>halfLength ? '…' : '') + fileText.substring(ix-halfLength, ix+halfLengthPlus) + (ix+halfLengthPlus < fileText.length ? '…' : '')
    //         addNotice(765, "Unexpected link", ix, extract, ourAtString);
    //     }
    // }
    return result;
}
// end of doBasicFileChecks function

export default doBasicFileChecks;
