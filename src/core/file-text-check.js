import checkPlainText from './plain-text-check';

//const FILE_TEXT_VALIDATOR_VERSION_STRING = '0.2.1';

// const DEFAULT_EXTRACT_LENGTH = 10;


export function checkTextfileContents(languageCode, filename, fileText, optionalFileLocation, optionalCheckingOptions) {
    // Does basic checks for small errors like mismatched punctuation pairs, etc.
    //  (Used by ourBasicFileChecks() in checkUSFMText() in usfm-text-check.js)

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
    // console.log(`checkTextfileContents(${filename}, ${fileText.length.toLocaleString()} chars, ${allowedLinks}, '${optionalFileLocation}')…`);
    console.assert(filename !== undefined, "checkTextfileContents: 'filename' parameter should be defined");
    console.assert(typeof filename === 'string', `checkTextfileContents: 'filename' parameter should be a string not a '${typeof filename}': ${filename}`);
    console.assert(fileText !== undefined, "checkTextfileContents: 'fileText' parameter should be defined");
    console.assert(typeof fileText === 'string', `checkTextfileContents: 'fileText' parameter should be a string not a '${typeof fileText}': ${fileText}`);
    // console.assert( allowedLinks===true || allowedLinks===false, "checkTextfileContents: allowedLinks parameter must be either true or false");

    let result = { noticeList: [] };

    function addNotice(noticeObject) {
        // console.log(`dBTC Notice: (priority=${noticeObject.priority}) ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? ` ${noticeObject.extract}` : ""}${noticeObject.location}`);
        console.assert(noticeObject.priority !== undefined, "dBTCs addNotice: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `dBTCs addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "dBTCs addNotice: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `dBTCs addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(characterIndex !== undefined, "dBTCs addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `dBTCs addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "dBTCs addNotice: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `dBTCs addNotice: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "dBTCs addNotice: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `dBTCs addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        result.noticeList.push(noticeObject);
    }

        function ourCheckPlainText(plainText, givenLocation, optionalCheckingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {String} fieldName - name of the field being checked
        * @param {String} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {String} optionalFieldLocation - description of where the field is located
        * @param {Object} optionalCheckingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cPT ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        // console.assert(textName !== undefined, "cPT ourCheckTextField: 'textName' parameter should be defined");
        // console.assert(typeof textName === 'string', `cPT ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof textName}'`);
        console.assert(plainText !== undefined, "cPT ourCheckTextField: 'plainText' parameter should be defined");
        console.assert(typeof plainText === 'string', `cPT ourCheckTextField: 'plainText' parameter should be a string not a '${typeof plainText}'`);

        const resultObject = checkPlainText('', plainText, givenLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // cptResult.noticeList = cptResult.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice9, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList)
            addNotice({ ...noticeEntry, filename });
    }
    // end of ourCheckTextField function


    // Main code for checkTextfileContents()
    if (!fileText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the filename
    let ourLocation = optionalFileLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    /*
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
    */

    ourCheckPlainText(fileText, ourLocation, optionalCheckingOptions);

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
    //         addNotice({765, "Unexpected link", ix,extract, ourAtString});
    //     }
    // }
    return result;
}
// end of checkTextfileContents function

export default checkTextfileContents;
