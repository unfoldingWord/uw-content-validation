import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const PLAIN_TEXT_VALIDATOR_VERSION = '0.0.2';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkPlainText(textName, markdownText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a noticeList
     */
    // console.log(`checkPlainText(${textName}, ${markdownText.length}, ${location})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (ptcError) {}
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
        // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength+1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const cptResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkPlainText success: ${successString}`);
        cptResult.successList.push(successString);
    }
    function addNotice8(priority, bookID,C,V, message, characterIndex, extract, location) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // console.log(`checkPlainText notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority!==undefined, "cPT addNotice8: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', `cPT addNotice8: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(bookID !== undefined, "cPT addNotice9: 'bookID' parameter should be defined");
        console.assert(typeof bookID === 'string', `cPT addNotice9: 'bookID' parameter should be a string not a '${typeof bookID}'`);
        console.assert(bookID.length === 3, `cPT addNotice9: 'bookID' parameter should be three characters long not ${bookID.length}`);
        console.assert(books.isValidBookID(bookID), `cPT addNotice9: '${bookID}' is not a valid USFM book identifier`);
        console.assert(C !== undefined, "cPT addNotice9: 'C' parameter should be defined");
        console.assert(typeof C === 'string', `cPT addNotice9: 'C' parameter should be a string not a '${typeof C}'`);
        console.assert(V !== undefined, "cPT addNotice9: 'V' parameter should be defined");
        console.assert(typeof V === 'string', `cPT addNotice9: 'V' parameter should be a string not a '${typeof V}'`);
        console.assert(message!==undefined, "cPT addNotice8: 'message' parameter should be defined");
        console.assert(typeof message==='string', `cPT addNotice8: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        console.assert(characterIndex!==undefined, "cPT addNotice8: 'characterIndex' parameter should be defined");
        console.assert(typeof characterIndex==='number', `cPT addNotice8: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        console.assert(extract!==undefined, "cPT addNotice8: 'extract' parameter should be defined");
        console.assert(typeof extract==='string', `cPT addNotice8: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location!==undefined, "cPT addNotice8: 'location' parameter should be defined");
        console.assert(typeof location==='string', `cPT addNotice8: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        cptResult.noticeList.push({priority, bookID,C,V, message, characterIndex, extract, location});
    }

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
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
        // console.log(`cPT doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(fieldName!==undefined, "cPT doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName==='string', `cPT doOurBasicTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText!==undefined, "cPT doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText==='string', `cPT doOurBasicTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert( allowedLinks===true || allowedLinks===false, "cPT doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const resultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        cptResult.noticeList = cptResult.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice8, e.g., for debugging or filtering
        //  process results line by line
        // for (const noticeEntry of resultObject.noticeList)
        //     addNotice8(noticeEntry.priority, noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7]);
    }
    // end of doOurBasicTextChecks function

    function checkPlainLineContents(lineName, lineText, lineLocation) {

        // console.log(`checkPlainLineContents for '${lineName}', '${lineText}' at${lineLocation}`);
        let thisText = lineText.trimStart(); // So we don't get "leading space" and "doubled spaces" errors

        if (thisText)
            doOurBasicTextChecks(lineName, thisText, false, lineLocation, optionalCheckingOptions);
    }
    // end of checkPlainLine function


    // Main code for checkPlainText function
    const lines = markdownText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    let headerLevel = 0;
    let lastNumLeadingSpaces = 0;
    let lastLineContents;
    for (let n= 1; n <= lines.length; n++) {
        const atString = ` in line ${n.toLocaleString()}${ourLocation}`;

        const line = lines[n - 1];
        if (line) {
            checkPlainLineContents(`line ${n.toLocaleString()}`, line, ourLocation);
        } else {
            // This is a blank line
        }

        lastLineContents = line;
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length==1?'':'s'}${ourLocation}.`);
    if (cptResult.noticeList)
        addSuccessMessage(`checkPlainText v${PLAIN_TEXT_VALIDATOR_VERSION} finished with ${cptResult.noticeList.length?cptResult.noticeList.length.toLocaleString():"zero"} notice${cptResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkPlainText v${PLAIN_TEXT_VALIDATOR_VERSION}`)
    // console.log(`  checkPlainText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkPlainText result is", JSON.stringify(result));
    return cptResult;
}
// end of checkPlainText function


export default checkPlainText;
