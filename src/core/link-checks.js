import { doBasicTextChecks } from './basic-text-check'


function doBasicLinkChecks(fieldName, fieldText, linkOptions, optionalFieldLocation) {
    // Does basic checks for fields that are links or that contain links

    // We assume that checking for compulsory fields is done elsewhere

    // Returns an error list and a warning list
    //  Both lists contain lists of two strings:
    //      1/ the error string
    //      2/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)

    console.log("doBasicLinkChecks", fieldName, fieldText);
    // console.log( "linkOptions", JSON.stringify(linkOptions));
    // console.log( "linkOptionsEC", linkOptions.expectedCount);

    let result = { errorList: [], warningList: [] };

    function addError(errorPart, locationPart) {
        console.log("ERROR: " + errorPart + locationPart);
        result.errorList.push([errorPart, locationPart]);
    }
    function addWarning(warningPart, locationPart) {
        console.log(`Warning: ${warningPart}${locationPart}`);
        result.warningList.push([warningPart, locationPart]);
    }

    // Create our more detailed location string by prepending the fieldName
    let ourAtString = " in '" + fieldName + "'";
    if (optionalFieldLocation) {
        if (optionalFieldLocation[0] != ' ') ourAtString += ' ';
        ourAtString += optionalFieldLocation;
    }

    if (!fieldText) { // Nothing to check
        if (linkOptions.expectedCount > 0)
            addError("Blank field / missing link (expected " + linkOptions.expectedCount + " link" + (linkOptions.expectedCount == 1 ? "" : "s") + ")", ourAtString);
        return result;
    }

    // Ok, we have something in our field
    if (linkOptions.otherTextAllowed)
        result = doBasicTextChecks(fieldName, fieldText, true, optionalFieldLocation);

    // Parameter nonsense check
    if (linkOptions.expectedCount > 0 && linkOptions.expectedCount > 0)
        addError("Bad options for doBasicLinkChecks: expectedCount=" + linkOptions.expectedCount + " but allowedCount=" + linkOptions.allowedCount, "");

    // Check for embedded links
    // First, create our regex from the allowed link types
    let linkRegexParts;
    if (linkOptions.linkTypesAllowed) {
        linkRegexParts = [];
        for (let linkType of linkOptions.linkTypesAllowed) {
            console.log("linkType", linkType);
            if (linkType == 'md') {
                linkRegexParts.push('\\[\\[(https*://[^ ]+)\\]\\]');
            }
            else if (linkType == 'naked')
                linkRegexParts.push('(https*://[^ ]+)');
            else
                addError("Unknown '" + linkType + "' linkType parameter", "");
        }
    } else { // No link types specified
        linkRegexParts = [];
    }
    console.log("linkRegexParts", JSON.stringify(linkRegexParts));
    const linkRegex = new RegExp(linkRegexParts.join('|'), 'g');
    // console.log("linkRegex", JSON.stringify(linkRegex));
    // const regexResults = fieldText.matchAll(linkRegex);
    // console.log("regexResults", regexResults.length, JSON.stringify(regexResults));
    const regexResultsArray = [...fieldText.matchAll(linkRegex)];
    console.log("regexResultsArray", regexResultsArray.length, JSON.stringify(regexResultsArray));

    if (regexResultsArray.length < linkOptions.expectedCount)
        addError("Not enough links (expected " + linkOptions.expectedCount + " link" + (linkOptions.expectedCount == 1 ? "" : "s") + ")", " (only found " + regexResultsArray.length + ")" + ourAtString);
    return result;
}
// end of doBasicLinkChecks function

export default doBasicLinkChecks;
