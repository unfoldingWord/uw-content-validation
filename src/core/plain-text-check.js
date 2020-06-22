import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const checkerVersionString = '0.0.1';


function checkPlainText(textName, markdownText, location, optionalOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a warningList
     */
    console.log("checkPlainText(" + textName + ", " + markdownText.length + ", " + location + ")…");
    if (location[0] != ' ') location = ' ' + location;

    let result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        console.log("PlainText Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        result.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation, optionalOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        const resultObject = doBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation, optionalOptions);
        for (let noticeEntry of resultObject.noticeList)
            addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
    }
    // end of doOurBasicTextChecks function

    function checkPlainLineContents(lineName, lineText, lineLocation) {

        console.log("checkPlainLineContents for '"+lineName+"', '"+lineText+"' at"+lineLocation);
        let thisText = lineText.trimStart(); // So we don't get "leading space" and "doubled spaces" errors

        if (thisText)
            doOurBasicTextChecks(lineName, thisText, [], lineLocation, optionalOptions);
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

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} lines in '${location}'.`)
    if (result.errorList || result.noticeList)
        addSuccessMessage(`checkPlainText v${checkerVersionString} finished with ${result.errorList.length.toLocaleString()} errors and ${result.noticeList.length.toLocaleString()} warnings`)
    else
        addSuccessMessage("No errors or warnings found by checkPlainText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} successes, ${result.errorList.length.toLocaleString()} errors, ${result.noticeList.length.toLocaleString()} warnings.`);
    // console.log("checkPlainText result is", JSON.stringify(result));
    return result;
}
// end of checkPlainText function


export default checkPlainText;
