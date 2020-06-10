import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const checkerVersionString = '0.0.1';
const MAX_SIMILAR_MESSAGES = 3;


function checkMarkdownText(textName, markdownText, location) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList, errorList, warningList
     */
    console.log("checkMarkdownText(" + textName + ", " + markdownText.length + ", " + location + ")…");
    if (location[0] != ' ') location = ' ' + location;

    let result = { successList: [], errorList: [], warningList: [] };
    let suppressedErrorCount = 0, suppressedWarningCount = 0;

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        result.successList.push(successString);
    }
    function addError(message, index, extract, location) {
        console.log("tfc ERROR: " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        let similarCount = 0;
        result.errorList.forEach((errMsg) => { if (errMsg[0].startsWith(message)) similarCount += 1 });
        if (similarCount < MAX_SIMILAR_MESSAGES)
            // result.errorList.push(message + (index > 0 ? " (at character " + index+1 + ")" : "") + (extract ? " " + extract : "") + location);
            result.errorList.push([message, index, extract, location]);
        else if (similarCount == MAX_SIMILAR_MESSAGES)
            result.errorList.push([`${message}  ◄ MORE SIMILAR ERRORS SUPPRESSED`, -1, "", ""]);
        else suppressedErrorCount += 1;
    }
    function addWarning(message, index, extract, location) {
        console.log("tfc Warning: " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        let similarCount = 0;
        result.warningList.forEach((warningMsg) => { if (warningMsg[0].startsWith(message)) similarCount += 1 });
        if (similarCount < MAX_SIMILAR_MESSAGES)
            // result.warningList.push(message + (index > 0 ? " (at character " + index+1 + ")" : "") + (extract ? " " + extract : "") + location);
            result.warningList.push([message, index, extract, location]);
        else if (similarCount == MAX_SIMILAR_MESSAGES)
            result.warningList.push([`${message}  ◄ MORE SIMILAR WARNINGS SUPPRESSED`, -1, "", ""]);
        else suppressedWarningCount += 1;
    }

    function doOurBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global error and warning lists

        const resultObject = doBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation)
        for (let errorEntry of resultObject.errorList)
            addError(errorEntry[0], errorEntry[1], errorEntry[2], errorEntry[3]);
        for (let warningEntry of resultObject.warningList)
            addWarning(warningEntry[0], warningEntry[1], warningEntry[2], warningEntry[3]);
    }
    // end of doOurBasicTextChecks function

    function checkMarkdownLineContents(lineName, lineText, lineLocation) {

        console.log("checkMarkdownLineContents for '"+lineName+"', '"+lineText+"' at"+lineLocation);
        let thisText = lineText

        // Remove leading and trailing hash signs
        thisText = thisText.replace(/^#+|#$/g,'')
        console.log("After removing hashes have '"+thisText+"'");

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g,'')
        console.log("After removing leading spaces have '"+thisText+"'");

        // // Remove leading asterisks
        // thisText = thisText.replace(/^\*/g,'')
        // console.log("After removing asterisks have '"+thisText+"'");

        // // Remove leading spaces again now
        // thisText = thisText.replace(/^ +/g,'')
        // console.log("After removing more leading spaces have '"+thisText+"'");

        if (thisText)
            doOurBasicTextChecks(lineName, thisText, [], lineLocation);
    }
    // end of checkMarkdownLine function


    const lines = markdownText.split('\n');
    console.log("  '" + location + "' has " + lines.length.toLocaleString() + " total lines");

    let headerLevel = 0;
    let lastNumLeadingSpaces = 0;
    let lastLineContents;
    for (let n = 1; n <= lines.length; n++) {
        const atString = " in line "+n.toLocaleString()+location;

        const line = lines[n - 1];
        let numLeadingSpaces;
        if (line) {

            const thisHeaderLevel = line.match(/^#*/)[0].length;
            // console.log("Got thisHeaderLevel="+ thisHeaderLevel + " for "+line+atString);
            if (thisHeaderLevel > headerLevel+1)
                addWarning("Header levels should only increment by one", 0, '', atString);
            if (thisHeaderLevel > 0)
                headerLevel = thisHeaderLevel;

            numLeadingSpaces = line.match(/^ */)[0].length;
            console.log("Got numLeadingSpaces="+ numLeadingSpaces + " for "+line+atString);
            if (numLeadingSpaces && lastNumLeadingSpaces && numLeadingSpaces!=lastNumLeadingSpaces)
                addWarning("Nesting seems confused", 0, '', atString);

            checkMarkdownLineContents("line "+n.toLocaleString(), line, location);
        } else {
            // This is a blank line
            numLeadingSpaces = 0;
        }

        lastLineContents = line;
        lastNumLeadingSpaces = numLeadingSpaces;
    }

    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data lines in '${location}'.`)
    if (result.errorList || result.warningList)
        addSuccessMessage(`checkTN_TSVText v${checkerVersionString} finished with ${result.errorList.length.toLocaleString()} errors and ${result.warningList.length.toLocaleString()} warnings`)
    else
        addSuccessMessage("No errors or warnings found by checkTN_TSVText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} successes, ${result.errorList.length.toLocaleString()} errors, ${result.warningList.length.toLocaleString()} warnings.`);
    console.log("checkTN_TSVText result is", JSON.stringify(result));
    return result;
}
// end of checkMarkdownText function


export default checkMarkdownText;
