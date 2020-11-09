import { checkTextField } from './field-text-check';
import { DEFAULT_EXTRACT_LENGTH } from './text-handling-functions'


const MARKDOWN_VALIDATOR_VERSION_STRING = '0.3.5';


/**
 *
 * @param {string} textName -- used for identification
 * @param {string} markdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} optionalCheckingOptions
 */
export function checkMarkdownText(textName, markdownText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire markdown file, i.e., all lines.

    Note: This function does not check that any link targets in the markdown are valid links.

     Returns a result object containing a successList and a noticeList
     */
    // console.log(`checkMarkdownText(${textName}, ${markdownText.length}, ${givenLocation})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (mdtcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    // console.log("Using supplied extractLength=" + extractLength, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, `halfLengthPlus=${halfLengthPlus}`);

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkMarkdownText success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(noticeObject) {
        // console.log(`checkMarkdownText addNotice: (priority=${noticeObject.priority}) ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? " " + extract : ""}${noticeObject.location}`);
        console.assert(noticeObject.priority !== undefined, "cMdT addNotice: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cMdT addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cMdT addNotice: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cMdT addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(characterIndex !== undefined, "cMdT addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cMdT addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "cMdT addNotice: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cMdT addNotice: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cMdT addNotice: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cMdT addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        result.noticeList.push(noticeObject); // Used to have filename: textName, but that isn't always a filename !!!
    }
    // end of addNotice function

    function ourCheckTextField(lineNumber, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
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
        // console.log(`cMdT ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${optionalFieldLocation}, …)`);
        console.assert(lineNumber !== undefined, "cMdT ourCheckTextField: 'lineNumber' parameter should be defined");
        console.assert(typeof lineNumber === 'number', `cMdT ourCheckTextField: 'lineNumber' parameter should be a number not a '${typeof lineNumber}'`);
        console.assert(fieldText !== undefined, "cMdT ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cMdT ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cMdT ourCheckTextField: allowedLinks parameter must be either true or false");

        const dbtcResultObject = checkTextField('markdown', '', fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // If we need to put everything through addNotice, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of dbtcResultObject.noticeList)
            addNotice({ ...noticeEntry, lineNumber });
        return dbtcResultObject.suggestion; // There may or may not be one!
    }
    // end of ourCheckTextField function


    function checkMarkdownLineContents(lineNumber, lineText, lineLocation) {

        // console.log(`checkMarkdownLineContents for ${lineNumber} '${lineText}' at${lineLocation}`);
        let thisText = lineText;

        // Remove leading and trailing hash signs #
        thisText = thisText.replace(/^#+|#+$/g, '');
        // console.log(`After removing hashes have '${thisText}'`);

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g, '');

        // Remove leading block text markers >
        while (thisText.startsWith('>'))
            thisText = thisText.replace(/^>+ */g, '');
        // if (thisText.indexOf('>') >= 0) console.log(`After removing leading block text markers from '${lineText}' still have '${thisText}'`);

        // Remove leading spaces again
        // thisText = thisText.replace(/^ +/g, '');
        // console.log(`After removing leading spaces have '${thisText}'`);

        // // Remove leading asterisks
        // thisText = thisText.replace(/^\*/g,'')
        // console.log(`After removing asterisks have '${thisText}'`);

        // // Remove leading spaces again now
        // thisText = thisText.replace(/^ +/g,'')
        // console.log(`After removing more leading spaces have '${thisText}'`);

        let suggestion;
        if (thisText)
            suggestion = ourCheckTextField(lineNumber, thisText, true, lineLocation, optionalCheckingOptions);

        if (thisText === lineText) // i.e., we didn't premodify the field being checked
            return suggestion;
    }
    // end of checkMarkdownLine function


    // Main code for checkMarkdownText function
    const lines = markdownText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    let headerLevel = 0;
    let lastNumLeadingSpaces = 0;
    // let lastLineContents;
    const suggestedLines = [];
    for (let n = 1; n <= lines.length; n++) {

        const line = lines[n - 1];
        let numLeadingSpaces;
        if (line) {

            const thisHeaderLevel = line.match(/^#*/)[0].length;
            // console.log(`Got thisHeaderLevel=${thisHeaderLevel} for ${line}${atString}`);
            if (thisHeaderLevel > headerLevel + 1
                && !textName.startsWith('TA ')) // Suppress this notice for translationAcademy subsections
                addNotice({ priority: 172, message: "Header levels should only increment by one", lineNumber: n, characterIndex: 0, location: ourLocation });
            if (thisHeaderLevel > 0)
                headerLevel = thisHeaderLevel;

            numLeadingSpaces = line.match(/^ */)[0].length;
            // console.log(`Got numLeadingSpaces=${numLeadingSpaces} for ${line}${atString}`);
            if (numLeadingSpaces && lastNumLeadingSpaces && numLeadingSpaces !== lastNumLeadingSpaces)
                addNotice({ priority: 472, message: "Nesting of header levels seems confused", lineNumber: n, characterIndex: 0, location: ourLocation });

            const suggestedLine = checkMarkdownLineContents(n, line, ourLocation);
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
        // console.log(`Had markdown ${markdownText}`);
        // console.log(`Sug markdown ${suggestion}`);
        result.suggestion = suggestion;
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (result.noticeList)
        addSuccessMessage(`checkMarkdownText v${MARKDOWN_VALIDATOR_VERSION_STRING} finished with ${result.noticeList.length ? result.noticeList.length.toLocaleString() : "zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkMarkdownText v${MARKDOWN_VALIDATOR_VERSION_STRING}`)
    // console.log(`  checkMarkdownText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkMarkdownText result is", JSON.stringify(result));
    return result;
}
// end of checkMarkdownText function
