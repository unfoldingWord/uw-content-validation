import { toJSON } from 'usfm-js';
import * as books from '../core/books/books';
import { parameterAssert } from './utilities';


export function runUsfmJsCheck(fileText, convertOptions) {
    // Runs the USFM-JS converter as a check
    //  which can be quite time-consuming on large, complex USFM files
    // debugLog("Running USFM-JS converter check (can take quite a while for a large book)…");

    const jsonResult = toJSON(fileText, convertOptions);
    const jsonKeys = Object.keys(jsonResult); // Expect 'headers', 'chapters'
    const numJSONkeys = jsonKeys.length;
    // debugLog(`  Finished USFM-JS converter check with ${numJSONkeys} json key(s)`);
    // debugLog(`  jsonResult: ${JSON.stringify(jsonResult)}`)
    // NOTE: We don’t know how to get the errors out yet

    return { isValidUSFM: numJSONkeys >= 2, returnedJSON: jsonResult }; // Expect 'headers', 'chapters'
}
// end of runUsfmJsCheck function


export function checkUSFMToJSON(bookID, filename, givenText, givenLocation, checkingOptions) {
    /*
    This function is only used for the demonstration pages -- not for the core!

    bookID is a three-character UPPERCASE USFM book identifier.

        filename parameter can be an empty string if we don’t have one.

     Returns a result object containing a successList and a noticeList
     */
    // debugLog(`checkUSFMToJSON(${givenText.length.toLocaleString()} chars, '${givenLocation}')…`);
    parameterAssert(bookID !== undefined, "checkUSFMToJSON: 'bookID' parameter should be defined");
    parameterAssert(typeof bookID === 'string', `checkUSFMToJSON: 'bookID' parameter should be a string not a '${typeof bookID}': ${bookID}`);
    parameterAssert(bookID.length === 3, `checkUSFMToJSON: 'bookID' parameter should be three characters long not ${bookID.length}`);
    parameterAssert(bookID.toUpperCase() === bookID, `checkUSFMToJSON: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    parameterAssert(books.isValidBookID(bookID), `checkUSFMToJSON: '${bookID}' is not a valid USFM book identifier`);
    parameterAssert(filename !== undefined, "checkUSFMToJSON: 'filename' parameter should be defined");
    parameterAssert(typeof filename === 'string', `checkUSFMToJSON: 'filename' parameter should be a string not a '${typeof filename}': ${filename}`);
    parameterAssert(givenText !== undefined, "checkUSFMToJSON: 'givenText' parameter should be defined");
    parameterAssert(typeof givenText === 'string', `checkUSFMToJSON: 'givenText' parameter should be a string not a '${typeof givenText}': ${givenText}`);
    parameterAssert(givenLocation !== undefined, "checkUSFMToJSON: 'givenRowLocation' parameter should be defined");
    parameterAssert(typeof givenLocation === 'string', `checkUSFMToJSON: 'givenRowLocation' parameter should be a string not a '${typeof givenLocation}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (filename) ourLocation = ` in ${filename}${ourLocation}`;


    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // debugLog(`checkUSFMToJSON success: ${successString}`);
        result.successList.push(successString);
    }
    function addNotice6to7({ priority, message, lineNumber, characterIndex, extract, location }) {
        /**
        * @description - adds a new notice entry, adding bookID,C,V to the given fields
        * @param {Number} priority - notice priority from 1 (lowest) to 999 (highest)
        * @param {String} message - the text of the notice message
        * @param {Number} characterIndex - where the issue occurs in the line
        * @param {String} extract - short extract from the line centred on the problem (if available)
        * @param {String} location - description of where the issue is located
        */
        // debugLog(`checkUSFMToJSON notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        parameterAssert(priority !== undefined, "cUSFMjs addNotice6to7: 'priority' parameter should be defined");
        parameterAssert(typeof priority === 'number', `cUSFMjs addNotice6to7: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        parameterAssert(message !== undefined, "cUSFMjs addNotice6to7: 'message' parameter should be defined");
        parameterAssert(typeof message === 'string', `cUSFMjs addNotice6to7: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // parameterAssert(characterIndex !== undefined, "cUSFMjs addNotice6to7: 'characterIndex' parameter should be defined");
        if (characterIndex) parameterAssert(typeof characterIndex === 'number', `cUSFMjs addNotice6to7: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // parameterAssert(extract !== undefined, "cUSFMjs addNotice6to7: 'extract' parameter should be defined");
        if (extract) parameterAssert(typeof extract === 'string', `cUSFMjs addNotice6to7: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        parameterAssert(location !== undefined, "cUSFMjs addNotice6to7: 'location' parameter should be defined");
        parameterAssert(typeof location === 'string', `cUSFMjs addNotice6to7: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({ priority, message, bookID, lineNumber, characterIndex, extract, location });
    }


    // Set your options here -- change values or comment out lines
    const convertOptions = {
        'chunk': true,
        'content-source': ourLocation,
        'convertToInt': []
    };
    const convertCheckResult = runUsfmJsCheck(givenText, ourLocation, convertOptions);
    // NOTE: We haven’t figured out how to get ERRORS out of this parser yet

    if (!convertCheckResult.isValidUSFM)
        addNotice6to7({ priority: 943, message: `USFM3 toJSON Check doesn’t pass`, location: ourLocation });

    addSuccessMessage(`Checked USFM-JS`);
    // debugLog(`  checkUSFMToJSON returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog(`checkUSFMToJSON result is ${JSON.stringify(result)}`);
    return result;
}
// end of checkUSFMToJSON function
