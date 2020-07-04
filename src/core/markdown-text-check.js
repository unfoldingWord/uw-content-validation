import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const checkerVersionString = '0.0.1';


function checkMarkdownText(textName, markdownText, location, optionalOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a warningList
     */
    console.log("checkMarkdownText(" + textName + ", " + markdownText.length + ", " + location + ")…");
    if (location[0] != ' ') location = ' ' + location;

    let result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        console.log("Markdown Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(typeof priority==='number', "addNotice: 'priority' parameter should be a number not a '"+(typeof priority)+"'");
        console.assert(priority!==undefined, "addNotice: 'priority' parameter should be defined");
        console.assert(typeof message==='string', "addNotice: 'message' parameter should be a string not a '"+(typeof message)+"'");
        console.assert(message!==undefined, "addNotice: 'message' parameter should be defined");
        console.assert(typeof index==='number', "addNotice: 'index' parameter should be a number not a '"+(typeof index)+"'");
        console.assert(index!==undefined, "addNotice: 'index' parameter should be defined");
        console.assert(typeof extract==='string', "addNotice: 'extract' parameter should be a string not a '"+(typeof extract)+"'");
        console.assert(extract!==undefined, "addNotice: 'extract' parameter should be defined");
        console.assert(typeof location==='string', "addNotice: 'location' parameter should be a string not a '"+(typeof location)+"'");
        console.assert(location!==undefined, "addNotice: 'location' parameter should be defined");
        result.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        console.assert(typeof fieldName==='string', "doOurBasicTextChecks: 'fieldName' parameter should be a string not a '"+(typeof fieldName)+"'");
        console.assert(fieldName!==undefined, "doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldText==='string', "doOurBasicTextChecks: 'fieldText' parameter should be a string not a '"+(typeof fieldText)+"'");
        console.assert(fieldText!==undefined, "doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert( allowedLinks===true || allowedLinks===false, "doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const resultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        result.noticeList = result.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging
        //  process results line by line
        // for (let noticeEntry of resultObject.noticeList)
        //     addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
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
            doOurBasicTextChecks(lineName, thisText, [], lineLocation, optionalOptions);
    }
    // end of checkMarkdownLine function


    // Main code for checkMarkdownText function
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
                addNotice(172, "Header levels should only increment by one", 0, '', atString);
            if (thisHeaderLevel > 0)
                headerLevel = thisHeaderLevel;

            numLeadingSpaces = line.match(/^ */)[0].length;
            console.log("Got numLeadingSpaces="+ numLeadingSpaces + " for "+line+atString);
            if (numLeadingSpaces && lastNumLeadingSpaces && numLeadingSpaces!=lastNumLeadingSpaces)
                addNotice(472, "Nesting seems confused", 0, '', atString);

            checkMarkdownLineContents("line "+n.toLocaleString(), line, location);
        } else {
            // This is a blank line
            numLeadingSpaces = 0;
        }

        lastLineContents = line;
        lastNumLeadingSpaces = numLeadingSpaces;
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line(s) in '${location}'.`);
    if (result.noticeList)
        addSuccessMessage(`checkMarkdownText v${checkerVersionString} finished with ${result.noticeList.length.toLocaleString()} notice(s)`);
    else
        addSuccessMessage("No errors or warnings found by checkMarkdownText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkMarkdownText result is", JSON.stringify(result));
    return result;
}
// end of checkMarkdownText function


export default checkMarkdownText;
