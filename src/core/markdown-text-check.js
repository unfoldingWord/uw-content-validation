import { DEFAULT_EXTRACT_LENGTH } from './text-handling-functions'
import { checkTextField } from './field-text-check';
import { cachedGetFileUsingFullURL } from '../core/getApi';
import { removeDisabledNotices } from './disabled-notices';
import { userLog, parameterAssert } from './utilities';


const MARKDOWN_TEXT_VALIDATOR_VERSION_STRING = '0.4.3';

const IMAGE_REGEX = new RegExp('!\\[([^\\]]+?)\\]\\(([^ \\]]+?)\\)', 'g');


/**
 *
 * @param {string} languageCode
 * @param {string} textOrFileName -- used for identification
 * @param {string} markdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkMarkdownText(languageCode, textOrFileName, markdownText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire markdown text, i.e., all lines.

    This text may not necessarily be from a file -- it may be from a (multiline) field within a file

    Note: This function does not check that any link targets in the markdown are valid links.

     Returns a result object containing a successList and a noticeList
     */
    // debugLog(`checkMarkdownText(${textName}, ${markdownText.length}, ${givenLocation})…`);
    parameterAssert(languageCode !== undefined, "checkMarkdownText: 'languageCode' parameter should be defined");
    parameterAssert(typeof languageCode === 'string', `checkMarkdownText: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    parameterAssert(textOrFileName !== undefined, "checkMarkdownText: 'textOrFileName' parameter should be defined");
    parameterAssert(typeof textOrFileName === 'string', `checkMarkdownText: 'textOrFileName' parameter should be a string not a '${typeof textOrFileName}': ${textOrFileName}`);
    parameterAssert(markdownText !== undefined, "checkMarkdownText: 'markdownText' parameter should be defined");
    parameterAssert(typeof markdownText === 'string', `checkMarkdownText: 'markdownText' parameter should be a string not a '${typeof markdownText}': ${markdownText}`);
    parameterAssert(givenLocation !== undefined, "checkMarkdownText: 'optionalFieldLocation' parameter should be defined");
    parameterAssert(typeof givenLocation === 'string', `checkMarkdownText: 'optionalFieldLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
    parameterAssert(givenLocation.indexOf('true') === -1, `checkMarkdownText: 'optionalFieldLocation' parameter should not be '${givenLocation}'`);
    parameterAssert(checkingOptions !== undefined, "checkMarkdownText: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined)
        parameterAssert(typeof checkingOptions === 'object', `checkMarkdownText: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let extractLength;
    try {
        extractLength = checkingOptions?.extractLength;
    } catch (mdtcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // debugLog("Using default extractLength=" + extractLength);
    }
    // else
    // debugLog("Using supplied extractLength=" + extractLength, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // debugLog("Using halfLength=" + halfLength, `halfLengthPlus=${halfLengthPlus}`);

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // debugLog("checkMarkdownText success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(noticeObject) {
        // debugLog(`checkMarkdownText addNotice: (priority=${noticeObject.priority}) ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? " " + extract : ""}${noticeObject.location}`);
        parameterAssert(noticeObject.priority !== undefined, "cMdT addNotice: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `cMdT addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "cMdT addNotice: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `cMdT addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "cMdT addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cMdT addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(extract !== undefined, "cMdT addNotice: 'extract' parameter should be defined");
        if (noticeObject.extract) parameterAssert(typeof noticeObject.extract === 'string', `cMdT addNotice: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        parameterAssert(noticeObject.location !== undefined, "cMdT addNotice: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `cMdT addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // noticeObject.debugChain = noticeObject.debugChain ? `checkMarkdownText(${languageCode}, ${textOrFileName}) ${noticeObject.debugChain}` : `checkMarkdownText(${languageCode}, ${textOrFileName})`;
        result.noticeList.push(noticeObject); // Used to have filename: textName, but that isn’t always a filename !!!
    }
    // end of addNotice function

    function ourCheckTextField(fieldName, lineNumber, fieldText, allowedLinks, optionalFieldLocation, checkingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {String} fieldName - name of the field being checked
        * @param {String} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {String} optionalFieldLocation - description of where the field is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`cMdT ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${optionalFieldLocation}, …)`);
        parameterAssert(fieldName !== undefined, "cMdT ourCheckTextField: 'fieldName' parameter should be defined");
        parameterAssert(typeof fieldName === 'string', `cMdT ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        parameterAssert(lineNumber !== undefined, "cMdT ourCheckTextField: 'lineNumber' parameter should be defined");
        parameterAssert(typeof lineNumber === 'number', `cMdT ourCheckTextField: 'lineNumber' parameter should be a number not a '${typeof lineNumber}'`);
        parameterAssert(fieldText !== undefined, "cMdT ourCheckTextField: 'fieldText' parameter should be defined");
        parameterAssert(typeof fieldText === 'string', `cMdT ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        parameterAssert(allowedLinks === true || allowedLinks === false, "cMdT ourCheckTextField: allowedLinks parameter must be either true or false");
        parameterAssert(optionalFieldLocation !== undefined, "cMdT ourCheckTextField: 'optionalFieldLocation' parameter should be defined");
        parameterAssert(typeof optionalFieldLocation === 'string', `cMdT ourCheckTextField: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

        const dbtcResultObject = checkTextField('markdown', fieldName, fieldText, allowedLinks, optionalFieldLocation, checkingOptions);

        // If we need to put everything through addNotice, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of dbtcResultObject.noticeList)
            addNotice({ ...noticeEntry, lineNumber });
        return dbtcResultObject.suggestion; // There may or may not be one!
    }
    // end of ourCheckTextField function


    /**
     *
     * @param {string} lineNumber
     * @param {string} lineText -- text to be checked
     * @param {string} lineLocation
     * @returns {string} suggestion (may be undefined) -- suggested fixed replacement field
     */
    async function checkMarkdownLineContents(lineNumber, lineText, lineLocation) {

        // debugLog(`checkMarkdownLineContents for ${lineNumber} '${lineText}' at${lineLocation}`);

        // Check for image links
        let regexResultArray;
        // eslint-disable-next-line no-cond-assign
        while (regexResultArray = IMAGE_REGEX.exec(lineText)) {
            // debugLog(`Got markdown image in line ${lineNumber}:`, JSON.stringify(regexResultArray));
            if (regexResultArray[1] !== 'OBS Image') userLog("This code was only checked for 'OBS Image' links");
            const fetchLink = regexResultArray[2];
            if (!fetchLink.startsWith('https://'))
                addNotice({ priority: 749, message: "Markdown image link seems faulty", lineNumber, extract: fetchLink, location: lineLocation });
            else if (checkingOptions?.disableAllLinkFetchingFlag !== true) {
                // debugLog(`Need to check existence of ${fetchLink}`);
                try {
                    const responseData = await cachedGetFileUsingFullURL({ uri: fetchLink });
                    parameterAssert(responseData.length > 10, `Expected ${fetchLink} image file to be longer: ${responseData.length}`);
                    // debugLog("Markdown link fetch got response: ", responseData.length);
                } catch (flError) {
                    console.error(`Markdown image link fetch had an error fetching '${fetchLink}': ${flError}`);
                    addNotice({ priority: 748, message: "Error fetching markdown image link", lineNumber, extract: fetchLink, location: lineLocation });
                }
            }
        }

        let thisText = lineText; // so we can adjust it

        // Remove leading and trailing hash signs #
        thisText = thisText.replace(/^#+|#+$/g, '');
        // debugLog(`After removing hashes have '${thisText}'`);

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g, '');

        // Remove leading block text markers >
        while (thisText.startsWith('>'))
            thisText = thisText.replace(/^>+ */g, '');
        // if (thisText.indexOf('>') >= 0) userLog(`After removing leading block text markers from '${lineText}' still have '${thisText}'`);

        // Remove leading spaces again
        // thisText = thisText.replace(/^ +/g, '');
        // debugLog(`After removing leading spaces have '${thisText}'`);

        // // Remove leading asterisks
        // thisText = thisText.replace(/^\*/g,'')
        // debugLog(`After removing asterisks have '${thisText}'`);

        // // Remove leading spaces again now
        // thisText = thisText.replace(/^ +/g,'')
        // debugLog(`After removing more leading spaces have '${thisText}'`);

        let suggestion;
        if (thisText && lineText[0] !== '|') // Doesn’t really make sense to check table line entries
            suggestion = ourCheckTextField(textOrFileName, lineNumber, thisText, true, lineLocation, checkingOptions);

        if (thisText === lineText) // i.e., we didn’t premodify the field being checked (otherwise suggestion could be wrong)
            return suggestion;
    }
    // end of checkMarkdownLine function


    // Main code for checkMarkdownText function
    const lines = markdownText.split('\n');
    // debugLog(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    let headerLevel = 0;
    let lastNumLeadingSpaces = 0;
    // let lastLineContents;
    const suggestedLines = [];
    for (let n = 1; n <= lines.length; n++) {

        const line = lines[n - 1];
        let numLeadingSpaces;
        if (line) {

            const thisHeaderLevel = line.match(/^#*/)[0].length;
            // debugLog(`Got thisHeaderLevel=${thisHeaderLevel} for ${line}${atString}`);
            if (thisHeaderLevel > headerLevel + 1
                && !textOrFileName.startsWith('TA ')) // Suppress this notice for translationAcademy subsections
                addNotice({ priority: 172, message: "Header levels should only increment by one", lineNumber: n, characterIndex: 0, location: ourLocation });
            if (thisHeaderLevel > 0)
                headerLevel = thisHeaderLevel;

            numLeadingSpaces = line.match(/^ */)[0].length;
            // debugLog(`Got numLeadingSpaces=${numLeadingSpaces} for ${line}${atString}`);
            if (numLeadingSpaces && lastNumLeadingSpaces && numLeadingSpaces !== lastNumLeadingSpaces)
                addNotice({ priority: 472, message: "Nesting of header levels seems confused", lineNumber: n, characterIndex: 0, location: ourLocation });

            const suggestedLine = await checkMarkdownLineContents(n, line, ourLocation);
            suggestedLines.push(suggestedLine === undefined ? line : suggestedLine);
        } else {
            // This is a blank line
            numLeadingSpaces = 0;
            suggestedLines.push('');
        }

        // lastLineContents = line;
        lastNumLeadingSpaces = numLeadingSpaces;
    }

    const suggestion = suggestedLines.join('\n');
    if (suggestion !== markdownText) {
        // debugLog(`Had markdown ${markdownText}`);
        // debugLog(`Sug markdown ${suggestion}`);
        result.suggestion = suggestion;
    }

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // debugLog(`checkMarkdownText: calling removeDisabledNotices(${result.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        result.noticeList = removeDisabledNotices(result.noticeList);
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (result.noticeList)
        addSuccessMessage(`checkMarkdownText v${MARKDOWN_TEXT_VALIDATOR_VERSION_STRING} finished with ${result.noticeList.length ? result.noticeList.length.toLocaleString() : "zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkMarkdownText v${MARKDOWN_TEXT_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkMarkdownText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    if (textOrFileName.endsWith('walk.md'))
        userLog("checkMarkdownText result is", JSON.stringify(result));
    return result;
}
// end of checkMarkdownText function
