import {checkYAMLText} from './yaml-text-check';
import * as books from './books';


const MANIFEST_VALIDATOR_VERSION_STRING = '0.2.1';

const DEFAULT_EXTRACT_LENGTH = 10;


export function checkManifestText(textName, manifestText, givenLocation, optionalCheckingOptions) {
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
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
        // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const cmtResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkManifestText success: ${successString}`);
        cmtResult.successList.push(successString);
    }
    function addNotice9({priority,message, bookID,C,V, lineNumber, characterIndex, extract, location}) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // console.log(`checkManifestText Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cManT addNotice9: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cManT addNotice9: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "cManT addNotice9: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cManT addNotice9: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        console.assert(bookID !== undefined, "cManT addNotice9: 'bookID' parameter should be defined");
        console.assert(typeof bookID === 'string', `cManT addNotice9: 'bookID' parameter should be a string not a '${typeof bookID}'`);
        console.assert(bookID.length === 3, `cManT addNotice9: 'bookID' parameter should be three characters long not ${bookID.length}`);
        console.assert(books.isValidBookID(bookID), `cManT addNotice9: '${bookID}' is not a valid USFM book identifier`);
        // console.assert(C !== undefined, "cManT addNotice9: 'C' parameter should be defined");
        if (C) console.assert(typeof C === 'string', `cManT addNotice9: 'C' parameter should be a string not a '${typeof C}'`);
        // console.assert(V !== undefined, "cManT addNotice9: 'V' parameter should be defined");
        if (V) console.assert(typeof V === 'string', `cManT addNotice9: 'V' parameter should be a string not a '${typeof V}'`);
        // console.assert(characterIndex !== undefined, "cManT addNotice9: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `cManT addNotice9: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // console.assert(extract !== undefined, "cManT addNotice9: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `cManT addNotice9: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cManT addNotice9: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cManT addNotice9: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        cmtResult.noticeList.push({priority,message, bookID,C,V, lineNumber, characterIndex,extract, location});
    }


    function ourYAMLTextChecks(textName, manifestText, givenLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cManT ourYAMLTextChecks(${textName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(textName !== undefined, "cManT ourYAMLTextChecks: 'textName' parameter should be defined");
        console.assert(typeof textName === 'string', `cManT ourYAMLTextChecks: 'textName' parameter should be a string not a '${typeof textName}'`);
        console.assert(manifestText !== undefined, "cManT ourYAMLTextChecks: 'manifestText' parameter should be defined");
        console.assert(typeof manifestText === 'string', `cManT ourYAMLTextChecks: 'manifestText' parameter should be a string not a '${typeof manifestText}'`);
        // console.assert( allowedLinks===true || allowedLinks===false, "cManT ourYAMLTextChecks: allowedLinks parameter must be either true or false");

        const cYtResultObject = checkYAMLText(textName, manifestText, givenLocation, optionalCheckingOptions);

        // Concat is faster if we don't need to process each notice individually
        cmtResult.successList = cmtResult.successList.concat(cYtResultObject.successList);
        cmtResult.noticeList = cmtResult.noticeList.concat(cYtResultObject.noticeList);
        /* // Process results line by line
        //  suppressing undesired errors
        for (const noticeEntry of cYtResultObject.noticeList)
            if (noticeEntry.priority !== 191 // "Unexpected XXX character after space"
              && noticeEntry.message !== "Unexpected ' character after space"
              && noticeEntry.message !== "Unexpected space after ' character"
              && noticeEntry.message !== "Unexpected space after [ character"
              )
                addNotice9(noticeEntry.priority, noticeEntry.message, noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7]);
        */
        return cYtResultObject.formData;
    }
    // end of ourYAMLTextChecks function


    // Main code for checkManifestText function
    const formData = ourYAMLTextChecks(textName, manifestText, ourLocation, optionalCheckingOptions);
    if (formData) {
        // console.log("formData", JSON.stringify(formData));
        const formDataKeys = Object.keys(formData);
        // console.log("formData keys", JSON.stringify(formDataKeys));

        if (formDataKeys.indexOf('dublin_core') < 0)
            addNotice9({priority:928, message:"'dublin_core' key is missing", location:ourLocation});
        if (formDataKeys.indexOf('projects') < 0)
            addNotice9({priority:929, message:"'projects' key is missing", location:ourLocation});
        if (formDataKeys.indexOf('checking') < 0)
            addNotice9({priority:148, message:"'checking' key is missing", location:ourLocation});
    }

    // addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length==1?'':'s'}${ourLocation}.`);
    if (cmtResult.noticeList)
        addSuccessMessage(`checkManifestText v${MANIFEST_VALIDATOR_VERSION_STRING} finished with ${cmtResult.noticeList.length ? cmtResult.noticeList.length.toLocaleString() : "zero"} notice${cmtResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkManifestText v${MANIFEST_VALIDATOR_VERSION_STRING}`)
    // console.log(`  checkManifestText returning with ${cmtResult.successList.length.toLocaleString()} success(es), ${cmtResult.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkManifestText result is", JSON.stringify(result));
    return cmtResult;
}
// end of checkManifestText function


//export default checkManifestText;
