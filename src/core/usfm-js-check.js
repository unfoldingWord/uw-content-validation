import { toJSON } from 'usfm-js';


export function runUsfmJsCheck(fileText, convertOptions) {
    // Runs the USFM-JS converter as a check
    //  which can be quite time-consuming on large, complex USFM files
    // console.log("Running USFM-JS converter check (can take quite a while for a large book)…");

    const jsonResult = toJSON(fileText, convertOptions);
    const jsonKeys = Object.keys(jsonResult); // Expect 'headers', 'chapters'
    const numJSONkeys = jsonKeys.length;
    // console.log(`  Finished USFM-JS converter check with ${numJSONkeys} json key(s)`);
    // console.log(`  jsonResult: ${JSON.stringify(jsonResult)}`)
    // NOTE: We don't know how to get the errors out yet

    return { isValidUSFM: numJSONkeys >= 2, returnedJSON:jsonResult }; // Expect 'headers', 'chapters'
}
// end of runUsfmJsCheck function


export function checkUSFMToJSON(BBB, filename, givenText, givenLocation, optionalCheckingOptions) {
    /*
    This function is only used for the demonstration pages -- not for the core!

    filename parameter can be an empty string if we don't have one.

     Returns a result object containing a successList and a noticeList
     */
    // console.log("checkUSFMToJSON(" + givenText.length.toLocaleString() + " chars, '" + location + "')…");

    let ourLocation = givenLocation;
    if (ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (filename) ourLocation = ` in ${filename}${ourLocation}`;


    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkUSFMToJSON success: " + successString);
        result.successList.push(successString);
    }
    function addNotice5to8(priority, message, index, extract, location) {
        // console.log("checkUSFMToJSON notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority !== undefined, "cUSFMjs addNotice5to8: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "cUSFMjs addNotice5to8: 'priority' parameter should be a number not a '" + (typeof priority) + "': " + priority);
        console.assert(message !== undefined, "cUSFMjs addNotice5to8: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "cUSFMjs addNotice5to8: 'message' parameter should be a string not a '" + (typeof message) + "': " + message);
        console.assert(index !== undefined, "cUSFMjs addNotice5to8: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "cUSFMjs addNotice5to8: 'index' parameter should be a number not a '" + (typeof index) + "': " + index);
        console.assert(extract !== undefined, "cUSFMjs addNotice5to8: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "cUSFMjs addNotice5to8: 'extract' parameter should be a string not a '" + (typeof extract) + "': " + extract);
        console.assert(location !== undefined, "cUSFMjs addNotice5to8: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "cUSFMjs addNotice5to8: 'location' parameter should be a string not a '" + (typeof location) + "': " + location);
        result.noticeList.push([priority, BBB,"","", message, index, extract, location]);
    }


    // Set your options here -- change values or comment out lines
    const convertOptions = {
        'chunk': true,
        'content-source': 'ourLocation',
        'convertToInt': []
        };
    const convertCheckResult = runUsfmJsCheck(givenText, ourLocation, convertOptions);
    // NOTE: We haven't figured out how to get ERRORS out of this parser yet

    if (!convertCheckResult.isValidUSFM)
        addNotice5to8(944, `USFM3 toJSON Check doesn't pass`, -1, "", ourLocation);

    addSuccessMessage(`Checked USFM-JS`);
    console.log(`  checkUSFMToJSON returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log(`checkUSFMToJSON result is ${JSON.stringify(result)}`);
    return result;
}
// end of checkUSFMToJSON function


export default checkUSFMToJSON;
