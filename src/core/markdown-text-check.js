import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const MARKDOWN_VALIDATOR_VERSION = '0.2.1';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkMarkdownText(textName, markdownText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a noticeList
     */
    // console.log("checkMarkdownText(" + textName + ", " + markdownText.length + ", " + location + ")…");
    let ourLocation = givenLocation;
    if (ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (e) {}
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
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
        // console.log("checkMarkdownText success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        // console.log("checkMarkdownText notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority!==undefined, "cMdT addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', "cMdT addNotice: 'priority' parameter should be a number not a '"+(typeof priority)+"': "+priority);
        console.assert(message!==undefined, "cMdT addNotice: 'message' parameter should be defined");
        console.assert(typeof message==='string', "cMdT addNotice: 'message' parameter should be a string not a '"+(typeof message)+"': "+message);
        console.assert(index!==undefined, "cMdT addNotice: 'index' parameter should be defined");
        console.assert(typeof index==='number', "cMdT addNotice: 'index' parameter should be a number not a '"+(typeof index)+"': "+index);
        console.assert(extract!==undefined, "cMdT addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract==='string', "cMdT addNotice: 'extract' parameter should be a string not a '"+(typeof extract)+"': "+extract);
        console.assert(location!==undefined, "cMdT addNotice: 'location' parameter should be defined");
        console.assert(typeof location==='string', "cMdT addNotice: 'location' parameter should be a string not a '"+(typeof location)+"': "+location);
        result.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cMdT doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(fieldName!==undefined, "cMdT doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName==='string', "cMdT doOurBasicTextChecks: 'fieldName' parameter should be a string not a '"+(typeof fieldName)+"'");
        console.assert(fieldText!==undefined, "cMdT doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText==='string', "cMdT doOurBasicTextChecks: 'fieldText' parameter should be a string not a '"+(typeof fieldText)+"'");
        console.assert( allowedLinks===true || allowedLinks===false, "cMdT doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const dbtcResultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging or filtering
        //  process results line by line
        for (let noticeEntry of dbtcResultObject.noticeList)
            if (!noticeEntry[1].startsWith("Unexpected doubled * characters") // 577 Markdown allows this
            && !noticeEntry[1].startsWith("Unexpected * character after space") // 591
            )
                addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
    }
    // end of doOurBasicTextChecks function


    function checkMarkdownLineContents(lineName, lineText, lineLocation) {

        // console.log(`checkMarkdownLineContents for '${lineName} ${lineText}' at${lineLocation}`);
        let thisText = lineText

        // Remove leading and trailing hash signs
        thisText = thisText.replace(/^#+|#$/g,'')
        // console.log("After removing hashes have '"+thisText+"'");

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g,'')
        // console.log("After removing leading spaces have '"+thisText+"'");

        // // Remove leading asterisks
        // thisText = thisText.replace(/^\*/g,'')
        // console.log("After removing asterisks have '"+thisText+"'");

        // // Remove leading spaces again now
        // thisText = thisText.replace(/^ +/g,'')
        // console.log("After removing more leading spaces have '"+thisText+"'");

        if (thisText)
            doOurBasicTextChecks(lineName, thisText, true, lineLocation, optionalCheckingOptions);
    }
    // end of checkMarkdownLine function


    // Main code for checkMarkdownText function
    const lines = markdownText.split('\n');
    // console.log("  '" + location + "' has " + lines.length.toLocaleString() + " total lines");

    let headerLevel = 0;
    let lastNumLeadingSpaces = 0;
    let lastLineContents;
    for (let n = 1; n <= lines.length; n++) {
        const atString = " in line "+n.toLocaleString()+ourLocation;

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
            // console.log("Got numLeadingSpaces="+ numLeadingSpaces + " for "+line+atString);
            if (numLeadingSpaces && lastNumLeadingSpaces && numLeadingSpaces!=lastNumLeadingSpaces)
                addNotice(472, "Nesting seems confused", 0, '', atString);

            checkMarkdownLineContents("line "+n.toLocaleString(), line, ourLocation);
        } else {
            // This is a blank line
            numLeadingSpaces = 0;
        }

        lastLineContents = line;
        lastNumLeadingSpaces = numLeadingSpaces;
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length==1?'':'s'}'${ourLocation}'.`);
    if (result.noticeList)
        addSuccessMessage(`checkMarkdownText v${MARKDOWN_VALIDATOR_VERSION} finished with ${result.noticeList.length?result.noticeList.length.toLocaleString():"zero"} notice${result.noticeList.length == 1 ? '' : 's'}`);
    else
        addSuccessMessage("No errors or warnings found by checkMarkdownText v" + MARKDOWN_VALIDATOR_VERSION)
    // console.log(`  checkMarkdownText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkMarkdownText result is", JSON.stringify(result));
    return result;
}
// end of checkMarkdownText function


export default checkMarkdownText;
