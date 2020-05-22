import { doBasicTextCheck } from './basic-text-check'


function doBasicLinkChecks(fieldName, fieldText, optionalFieldLocation) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // We assume that checking for compulsory fields is done elsewhere

    // Returns an error list and a warning list
    //  Both lists contain lists of two strings:
    //      1/ the error string
    //      2/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)

    let result = {};
    result.errorList = [];
    result.warningList = [];

    function addError(errorPart, locationPart) {
        console.log("ERROR: " + errorPart + locationPart);
        result.errorList.push([errorPart, locationPart]);
    }
    function addWarning(warningPart, locationPart) {
        console.log(`Warning: ${warningPart}${locationPart}`);
            result.warningList.push([warningPart, locationPart]);
    }

    if (!fieldText) // Nothing to check
    return result;


    result = doBasicTextCheck(fieldName, fieldText, optionalFieldLocation);

    // Create our more detailed location string by prepending the fieldName
    let ourAtString = " in '" + fieldName + "'";
    if (optionalFieldLocation) {
        if (optionalFieldLocation[0] != ' ') ourAtString += ' ';
        ourAtString += optionalFieldLocation;
    }

    // Check for embedded links
    let regexResult = fieldText.matchAll(/a/g);

    return result;
}
// end of doBasicLinkChecks function

export default doBasicLinkChecks;
