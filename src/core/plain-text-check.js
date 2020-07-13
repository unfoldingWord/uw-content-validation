import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const checkerVersionString = '0.0.1';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkPlainText(textName, markdownText, location, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a warningList
     */
    // console.log("checkPlainText(" + textName + ", " + markdownText.length + ", " + location + ")…");
    if (location[0] != ' ') location = ' ' + location;

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

    let result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkPlainText success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        console.log("checkPlainText notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(typeof priority==='number', "cPT addNotice: 'priority' parameter should be a number not a '"+(typeof priority)+"': "+priority);
        console.assert(priority!==undefined, "cPT addNotice: 'priority' parameter should be defined");
        console.assert(typeof message==='string', "cPT addNotice: 'message' parameter should be a string not a '"+(typeof message)+"': "+message);
        console.assert(message!==undefined, "cPT addNotice: 'message' parameter should be defined");
        console.assert(typeof index==='number', "cPT addNotice: 'index' parameter should be a number not a '"+(typeof index)+"': "+index);
        console.assert(index!==undefined, "cPT addNotice: 'index' parameter should be defined");
        console.assert(typeof extract==='string', "cPT addNotice: 'extract' parameter should be a string not a '"+(typeof extract)+"': "+extract);
        console.assert(extract!==undefined, "cPT addNotice: 'extract' parameter should be defined");
        console.assert(typeof location==='string', "cPT addNotice: 'location' parameter should be a string not a '"+(typeof location)+"': "+location);
        console.assert(location!==undefined, "cPT addNotice: 'location' parameter should be defined");
        result.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        console.assert(typeof fieldName==='string', "doOurBasicTextChecks: 'fieldName' parameter should be a string not a '"+(typeof fieldName)+"'");
        console.assert(fieldName!==undefined, "doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldText==='string', "doOurBasicTextChecks: 'fieldText' parameter should be a string not a '"+(typeof fieldText)+"'");
        console.assert(fieldText!==undefined, "doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert( allowedLinks===true || allowedLinks===false, "doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const resultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        result.noticeList = result.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging
        //  process results line by line
        // for (let noticeEntry of resultObject.noticeList)
        //     addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
    }
    // end of doOurBasicTextChecks function

    function checkPlainLineContents(lineName, lineText, lineLocation) {

        // console.log("checkPlainLineContents for '"+lineName+"', '"+lineText+"' at"+lineLocation);
        let thisText = lineText.trimStart(); // So we don't get "leading space" and "doubled spaces" errors

        if (thisText)
            doOurBasicTextChecks(lineName, thisText, false, lineLocation, optionalCheckingOptions);
    }
    // end of checkPlainLine function


    // Main code for checkPlainText function
    const lines = markdownText.split('\n');
    console.log("  '" + location + "' has " + lines.length.toLocaleString() + " total lines");

    let headerLevel = 0;
    let lastNumLeadingSpaces = 0;
    let lastLineContents;
    for (let n = 1; n <= lines.length; n++) {
        const atString = " in line "+n.toLocaleString()+location;

        const line = lines[n - 1];
        if (line) {
            checkPlainLineContents("line "+n.toLocaleString(), line, location);
        } else {
            // This is a blank line
        }

        lastLineContents = line;
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line(s) in '${location}'.`);
    if (result.noticeList)
        addSuccessMessage(`checkPlainText v${checkerVersionString} finished with ${result.noticeList.length.toLocaleString()} notice(s)`);
    else
        addSuccessMessage("No errors or warnings found by checkPlainText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkPlainText result is", JSON.stringify(result));
    return result;
}
// end of checkPlainText function


export default checkPlainText;
