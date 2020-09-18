import checkTextField from './field-text-check';


const PLAIN_TEXT_VALIDATOR_VERSION_STRING = '0.1.1';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkPlainText(textName, plainText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire text, i.e., all lines.

     Returns a result object containing a successList and a noticeList
     */
    console.log(`checkPlainText(${textName}, ${plainText.length}, ${givenLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (ptcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
    // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength+1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const cptResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkPlainText success: ${successString}`);
        cptResult.successList.push(successString);
    }
    function addNotice9(noticeObject) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // console.log(`checkPlainText notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "cPT addNotice9: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cPT addNotice9: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cPT addNotice9: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cPT addNotice9: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        console.assert(noticeObject.bookID !== undefined, "cPT addNotice9: 'bookID' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cPT addNotice9: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract!==undefined, "cPT addNotice9: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cPT addNotice9: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cPT addNotice9: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cPT addNotice9: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        cptResult.noticeList.push(noticeObject);
    }

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
        // console.log(`cPT ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(lineNumber !== undefined, "cPT ourCheckTextField: 'lineNumber' parameter should be defined");
        console.assert(typeof lineNumber === 'number', `cPT ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof lineNumber}'`);
        console.assert(fieldText !== undefined, "cPT ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cPT ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cPT ourCheckTextField: allowedLinks parameter must be either true or false");

        const resultObject = checkTextField('', fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // cptResult.noticeList = cptResult.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice9, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList)
            addNotice9({ ...noticeEntry, lineNumber });
    }
    // end of ourCheckTextField function

    function checkPlainLineContents(lineNumber, lineText, lineLocation) {

        // console.log(`checkPlainLineContents for '${lineName}', '${lineText}' at${lineLocation}`);
        let thisText = lineText.trimStart(); // So we don't get "leading space" and "doubled spaces" errors

        if (thisText)
            ourCheckTextField(lineNumber, thisText, false, lineLocation, optionalCheckingOptions);
    }
    // end of checkPlainLine function


    // Main code for checkPlainText function
    const lines = plainText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    // let headerLevel = 0;
    // let lastNumLeadingSpaces = 0;
    // let lastLineContents;
    for (let n = 1; n <= lines.length; n++) {

        const line = lines[n - 1];
        if (line) {
            checkPlainLineContents(n, line, ourLocation);
        } else {
            // This is a blank line
        }

        // lastLineContents = line;
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (cptResult.noticeList)
        addSuccessMessage(`checkPlainText v${PLAIN_TEXT_VALIDATOR_VERSION_STRING} finished with ${cptResult.noticeList.length ? cptResult.noticeList.length.toLocaleString() : "zero"} notice${cptResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkPlainText v${PLAIN_TEXT_VALIDATOR_VERSION_STRING}`)
    // console.log(`  checkPlainText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkPlainText result is", JSON.stringify(result));
    return cptResult;
}
// end of checkPlainText function


export default checkPlainText;
