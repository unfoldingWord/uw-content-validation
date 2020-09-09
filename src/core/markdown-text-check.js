import checkTextField from './field-text-check';


export const MARKDOWN_VALIDATOR_VERSION = '0.3.1';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkMarkdownText(textName, markdownText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire markdown file, i.e., all lines.

    Note: This function does not check that any link targets in the markdown are valid links.

     Returns a result object containing a successList and a noticeList
     */
    // console.log(`checkMarkdownText(${textName}, ${markdownText.length}, ${givenLocation})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (textName) ourLocation = ` in ${textName}${ourLocation}`;

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
    function addNotice6({priority,message, lineNumber,characterIndex, extract, location}) {
        // console.log(`checkMarkdownText addNotice6: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? " " + extract : ""}${location}`);
        console.assert(priority !== undefined, "cMdT addNotice6: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cMdT addNotice6: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "cMdT addNotice6: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cMdT addNotice6: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // console.assert(characterIndex !== undefined, "cMdT addNotice6: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `cMdT addNotice6: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // console.assert(extract !== undefined, "cMdT addNotice6: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `cMdT addNotice6: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cMdT addNotice6: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cMdT addNotice6: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({priority, message, lineNumber, characterIndex, extract, location});
    }
    // end of addNotice6 function

    function ourCheckTextField(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
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
        console.assert(fieldName !== undefined, "cMdT ourCheckTextField: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cMdT ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cMdT ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cMdT ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cMdT ourCheckTextField: allowedLinks parameter must be either true or false");

        const dbtcResultObject = checkTextField(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNotice6, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of dbtcResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `MD ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
            if (!noticeEntry.message.startsWith("Unexpected doubled * characters") // 577 Markdown allows this
                && !noticeEntry.message.startsWith("Unexpected * character after space") // 191
            )
                addNotice6({priority:noticeEntry.priority, message:noticeEntry.message,
                    characterIndex:noticeEntry.characterIndex, extract:noticeEntry.extract,
                    location:noticeEntry.location});
        }
    }
    // end of ourCheckTextField function


    function checkMarkdownLineContents(lineName, lineText, lineLocation) {

        // console.log(`checkMarkdownLineContents for '${lineName} ${lineText}' at${lineLocation}`);
        let thisText = lineText

        // Remove leading and trailing hash signs
        thisText = thisText.replace(/^#+|#$/g, '')
        // console.log(`After removing hashes have '${thisText}'`);

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g, '')
        // console.log(`After removing leading spaces have '${thisText}'`);

        // // Remove leading asterisks
        // thisText = thisText.replace(/^\*/g,'')
        // console.log(`After removing asterisks have '${thisText}'`);

        // // Remove leading spaces again now
        // thisText = thisText.replace(/^ +/g,'')
        // console.log(`After removing more leading spaces have '${thisText}'`);

        if (thisText)
            ourCheckTextField(lineName, thisText, true, lineLocation, optionalCheckingOptions);
    }
    // end of checkMarkdownLine function


    // Main code for checkMarkdownText function
    const lines = markdownText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    let headerLevel = 0;
    let lastNumLeadingSpaces = 0;
    // let lastLineContents;
    for (let n = 1; n <= lines.length; n++) {

        const line = lines[n - 1];
        let numLeadingSpaces;
        if (line) {

            const thisHeaderLevel = line.match(/^#*/)[0].length;
            // console.log(`Got thisHeaderLevel=${thisHeaderLevel} for ${line}${atString}`);
            if (thisHeaderLevel > headerLevel + 1)
                addNotice6({priority:172, message:"Header levels should only increment by one", lineNumber:n, characterIndex:0, location:ourLocation});
            if (thisHeaderLevel > 0)
                headerLevel = thisHeaderLevel;

            numLeadingSpaces = line.match(/^ */)[0].length;
            // console.log(`Got numLeadingSpaces=${numLeadingSpaces} for ${line}${atString}`);
            if (numLeadingSpaces && lastNumLeadingSpaces && numLeadingSpaces !== lastNumLeadingSpaces)
                addNotice6({priority:472, message:"Nesting seems confused", lineNumber:n, characterIndex:0, location:ourLocation});

            checkMarkdownLineContents(`line ${n.toLocaleString()}`, line, ourLocation);
        } else {
            // This is a blank line
            numLeadingSpaces = 0;
        }

        // lastLineContents = line;
        lastNumLeadingSpaces = numLeadingSpaces;
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (result.noticeList)
        addSuccessMessage(`checkMarkdownText v${MARKDOWN_VALIDATOR_VERSION} finished with ${result.noticeList.length ? result.noticeList.length.toLocaleString() : "zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage("No errors or warnings found by checkMarkdownText v" + MARKDOWN_VALIDATOR_VERSION)
    // console.log(`  checkMarkdownText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkMarkdownText result is", JSON.stringify(result));
    return result;
}
// end of checkMarkdownText function


export default checkMarkdownText;
