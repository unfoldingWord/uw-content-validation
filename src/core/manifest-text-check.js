import checkYAMLText from './yaml-text-check';


const MANIFEST_VALIDATOR_VERSION = '0.1.1';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkManifestText(textName, manifestText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

    See the specification at https://resource-container.readthedocs.io/en/latest/manifest.html.

    Returns a result object containing a successList and a noticeList
    */
    // console.log(`checkManifestText(${textName}, ${manifestText.length}, ${givenLocation})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (mfcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
        // console.log("Using supplied extractLength=" + extractLength, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, `halfLengthPlus=${halfLengthPlus}`);

    const cmtResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkManifestText success: " + successString);
        cmtResult.successList.push(successString);
    }
    function addNotice8(priority, BBB,C,V, message, index, extract, location) {
        // console.log(`checkManifestText Notice: (priority=${priority}) ${message}${index > 0 ? ` (at character ${index}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cManT addNotice8: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cManT addNotice8: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(BBB !== undefined, "cManT addNotice9: 'BBB' parameter should be defined");
        console.assert(typeof BBB === 'string', `cManT addNotice9: 'BBB' parameter should be a string not a '${typeof BBB}'`);
        console.assert(BBB.length === 3, `cManT addNotice9: 'BBB' parameter should be three characters long not ${BBB.length}`);
        console.assert(books.isValidBookCode(BBB), `cManT addNotice9: '${BBB}' is not a valid USFM book code`);
        console.assert(C !== undefined, "cManT addNotice9: 'C' parameter should be defined");
        console.assert(typeof C === 'string', `cManT addNotice9: 'C' parameter should be a string not a '${typeof C}'`);
        console.assert(V !== undefined, "cManT addNotice9: 'V' parameter should be defined");
        console.assert(typeof V === 'string', `cManT addNotice9: 'V' parameter should be a string not a '${typeof V}'`);
        console.assert(message !== undefined, "cManT addNotice8: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cManT addNotice8: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        console.assert(index !== undefined, "cManT addNotice8: 'index' parameter should be defined");
        console.assert(typeof index === 'number', `cManT addNotice8: 'index' parameter should be a number not a '${typeof index}': ${index}`);
        console.assert(extract !== undefined, "cManT addNotice8: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `cManT addNotice8: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cManT addNotice8: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cManT addNotice8: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        cmtResult.noticeList.push([priority, BBB,C,V, message, index, extract, location]);
    }


    function doOurYAMLTextChecks(textName, manifestText, givenLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cManT doOurYAMLTextChecks(${textName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(textName !== undefined, "cManT doOurYAMLTextChecks: 'textName' parameter should be defined");
        console.assert(typeof textName === 'string', `cManT doOurYAMLTextChecks: 'textName' parameter should be a string not a '${typeof textName}'`);
        console.assert(manifestText !== undefined, "cManT doOurYAMLTextChecks: 'manifestText' parameter should be defined");
        console.assert(typeof manifestText === 'string', `cManT doOurYAMLTextChecks: 'manifestText' parameter should be a string not a '${typeof manifestText}'`);
        // console.assert( allowedLinks===true || allowedLinks===false, "cManT doOurYAMLTextChecks: allowedLinks parameter must be either true or false");

        const cYtResultObject = checkYAMLText(textName, manifestText, givenLocation, optionalCheckingOptions);

        // Concat is faster if we don't need to process each notice individually
        cmtResult.successList = cmtResult.successList.concat(cYtResultObject.successList);
        cmtResult.noticeList = cmtResult.noticeList.concat(cYtResultObject.noticeList);
        /* // Process results line by line
        //  suppressing undesired errors
        for (const noticeEntry of cYtResultObject.noticeList)
            if (noticeEntry[0] !== 191 // "Unexpected XXX character after space"
              && noticeEntry[1] !== "Unexpected ' character after space"
              && noticeEntry[1] !== "Unexpected space after ' character"
              && noticeEntry[1] !== "Unexpected space after [ character"
              )
                addNotice8(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7]);
        */
        return cYtResultObject.formData;
    }
    // end of doOurYAMLTextChecks function


    // Main code for checkManifestText function
    const formData = doOurYAMLTextChecks(textName, manifestText, ourLocation, optionalCheckingOptions);
    if (formData) {
        // console.log("formData", JSON.stringify(formData));
        const formDataKeys = Object.keys(formData);
        // console.log("formData keys", JSON.stringify(formDataKeys));

        if (formDataKeys.indexOf('dublin_core') < 0)
            addNotice8(928, "'dublin_core' key is missing", -1, "", ourLocation);
        if (formDataKeys.indexOf('projects') < 0)
            addNotice8(929, "'projects' key is missing", -1, "", ourLocation);
        if (formDataKeys.indexOf('checking') < 0)
            addNotice8(148, "'checking' key is missing", -1, "", ourLocation);
    }

    // addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length==1?'':'s'}${ourLocation}.`);
    if (cmtResult.noticeList)
        addSuccessMessage(`checkManifestText v${MANIFEST_VALIDATOR_VERSION} finished with ${cmtResult.noticeList.length ? cmtResult.noticeList.length.toLocaleString() : "zero"} notice${cmtResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage("No errors or warnings found by checkManifestText v" + MANIFEST_VALIDATOR_VERSION)
    // console.log(`  checkManifestText returning with ${cmtResult.successList.length.toLocaleString()} success(es), ${cmtResult.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkManifestText result is", JSON.stringify(result));
    return cmtResult;
}
// end of checkManifestText function


export default checkManifestText;
