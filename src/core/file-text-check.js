// eslint-disable-next-line no-unused-vars
import { REPO_CODES_LIST } from './defaults';
import { checkPlainText } from './plain-text-check';
// eslint-disable-next-line no-unused-vars
import { parameterAssert } from './utilities';

// const FILE_TEXT_VALIDATOR_VERSION_STRING = '0.3.1';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode -- e.g., 'TN' or 'TQ2', etc.
 * @param {string} fileType
 * @param {string} filename
 * @param {string} fileText
 * @param {string} optionalFileLocation
 * @param {Object} checkingOptions
 */
export function checkTextfileContents(languageCode, repoCode, fileType, filename, fileText, optionalFileLocation, checkingOptions) {
    // Does basic checks for small errors like mismatched punctuation pairs, etc.
    //  (Used by ourBasicFileChecks() in checkUSFMText() in usfm-text-check.js)

    // filename (str): Used for identification
    // fileText (str): The field being checked
    // optionalFileLocation (str): Used to inform where this field is located

    // We assume that checking for compulsory fields is done elsewhere

    // Returns a single notice list
    //  The list contains objects with the following fields:
    //      priority (compulsory): the priority number 0..999 (usually 800+ are errors, lower are warnings)
    //      message (compulsory): the error description string
    //      characterIndex: the 0-based index for the position in the string
    //      excerpt: a short excerpt of the string containing the error (or empty-string if irrelevant)
    //  (Returned in this way for more intelligent processing at a higher level)
    // functionLog(`checkTextfileContents(${filename}, ${fileText.length.toLocaleString()} chars, '${optionalFileLocation}')…`);
    //parameterAssert(languageCode !== undefined, "checkTextfileContents: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkTextfileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    //parameterAssert(repoCode !== undefined, "checkTextfileContents: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkTextfileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkTextfileContents: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(fileType !== undefined, "checkTextfileContents: 'fileType' parameter should be defined");
    //parameterAssert(typeof fileType === 'string', `checkTextfileContents: 'fileType' parameter should be a string not a '${typeof fileType}': ${fileType}`);
    //parameterAssert(fileType !== '', `checkTextfileContents: 'fileType' ${fileType} parameter should be not be an empty string`);
    //parameterAssert(fileType === 'markdown' || fileType === 'USFM' || fileType === 'YAML' || fileType === 'text', `checkTextfileContents: unrecognised 'fileType' parameter: '${fileType}'`);
    //parameterAssert(filename !== undefined, "checkTextfileContents: 'filename' parameter should be defined");
    //parameterAssert(typeof filename === 'string', `checkTextfileContents: 'filename' parameter should be a string not a '${typeof filename}': ${filename}`);
    //parameterAssert(fileText !== undefined, "checkTextfileContents: 'fileText' parameter should be defined");
    //parameterAssert(typeof fileText === 'string', `checkTextfileContents: 'fileText' parameter should be a string not a '${typeof fileText}': ${fileText}`);
    //parameterAssert(checkingOptions !== undefined, "checkTextfileContents: 'checkingOptions' parameter should be defined");

    let result = { noticeList: [] };

    function addNotice(noticeObject) {
        // debugLog(`dBTC Notice: (priority=${noticeObject.priority}) ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? ` ${noticeObject.excerpt}` : ""}${noticeObject.location}`);
        //parameterAssert(noticeObject.priority !== undefined, "dBTCs addNotice: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `dBTCs addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "dBTCs addNotice: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `dBTCs addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "dBTCs addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `dBTCs addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "dBTCs addNotice: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `dBTCs addNotice: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "dBTCs addNotice: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `dBTCs addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        if (noticeObject.debugChain) noticeObject.debugChain = `checkTextfileContents(${languageCode}, ${fileType}, ${filename}) ${noticeObject.debugChain}`;
        result.noticeList.push(noticeObject);
    }

    function ourCheckPlainText(textType, textFilename, plainText, givenLocation, checkingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {string} plainText - the actual text of the field being checked
        * @param {string} givenLocation - description of where the field is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`cPT ourCheckPlainText(${fieldName}, (${fieldText.length}), ${fieldLocation}, …)`);
        // //parameterAssert(textName !== undefined, "cPT ourCheckPlainText: 'textName' parameter should be defined");
        // //parameterAssert(typeof textName === 'string', `cPT ourCheckPlainText: 'fieldName' parameter should be a string not a '${typeof textName}'`);
        //parameterAssert(plainText !== undefined, "cPT ourCheckPlainText: 'plainText' parameter should be defined");
        //parameterAssert(typeof plainText === 'string', `cPT ourCheckPlainText: 'plainText' parameter should be a string not a '${typeof plainText}'`);
        //parameterAssert(checkingOptions !== undefined, "cPT ourCheckPlainText: 'checkingOptions' parameter should be defined");

        const resultObject = checkPlainText(languageCode, repoCode, textType, textFilename, plainText, givenLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // cptResult.noticeList = cptResult.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList)
            addNotice({ ...noticeEntry, filename: textFilename });
    }
    // end of ourCheckTextField function


    // Main code for checkTextfileContents()
    if (!fileText) // Nothing to check
        return result;

    let ourLocation = optionalFileLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    /*
    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (bfcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);
    */

    /*
    let textType = 'raw';
    const filenameLower = filename.toLowerCase();
    if (filenameLower.endsWith('.usfm')) textType = 'USFM';
    else if (filenameLower.endsWith('.md')) textType = 'markdown';
    else if (filenameLower.endsWith('.yaml') || filenameLower.endsWith('.yml')) textType = 'YAML';
    */
    ourCheckPlainText(fileType, filename, fileText, ourLocation, checkingOptions);

    //     // Simple check that there aren’t any
    //     ix = fileText.indexOf('://');
    //     if (ix === -1) ix = fileText.indexOf('http');
    //     if (ix === -1) ix = fileText.indexOf('ftp');
    //     // The following might have to be removed if text fields can contain email addresses
    //     if (ix === -1) ix = fileText.indexOf('.org');
    //     if (ix === -1) ix = fileText.indexOf('.com');
    //     if (ix === -1) ix = fileText.indexOf('.info');
    //     if (ix === -1) ix = fileText.indexOf('.bible');
    //     if (ix >= 0) {
    //         const excerpt = (ix>excerptHalfLength ? '…' : '') + fileText.substring(ix-excerptHalfLength, ix+excerptHalfLengthPlus) + (ix+excerptHalfLengthPlus < fileText.length ? '…' : '')
    //         addNotice({765, "Unexpected link", ix,excerpt, ourAtString});
    //     }
    // }
    return result;
}
// end of checkTextfileContents function
