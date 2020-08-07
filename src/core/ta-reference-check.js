import * as books from '../core/books/books';
import { getFile } from '../core/getApi';
// import { consoleLogObject } from '../core/utilities';


const TA_REFERENCE_VALIDATOR_VERSION = '0.1.0';

const DEFAULT_EXTRACT_LENGTH = 10;


async function checkTAReference(fieldName, fieldText, givenLocation, optionalCheckingOptions) {
    // Checks that the Hebrew/Greek quote can be found in the original texts

    // Note that the original language verse text can be passed in as optionalCheckingOptions.taVerseText.
    // Alternatively, we can fetch it from Door43 -- you can control this with:
    //      optionalCheckingOptions.taRepoUsername
    //      optionalCheckingOptions.taRepoBranch (or tag)
    //      optionalCheckingOptions.taRepoLanguageCode
    //      optionalCheckingOptions.taRepoSectionName

    // console.log(`checkTAReference v${TA_REFERENCE_VALIDATOR_VERSION} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, …)`);
    console.assert(fieldName !== undefined, "checkTAReference: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkTAReference: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldText !== undefined, "checkTAReference: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkTAReference: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    console.assert(givenLocation !== undefined, "checkTAReference: 'fieldText' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkTAReference: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);
    console.assert(fieldName === 'SupportReference'); // so far

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    ourLocation = ` in ${fieldName}${ourLocation}`;

    const ctarResult = { noticeList: [] };

    function addNotice5(priority, message, index, extract, location) {
        // console.log(`checkTAReference Notice: (priority=${priority}) ${message}${index > 0 ? " (at character " + index + 1 + ")" : ""}${extract ? " " + extract : ""}${location}`);
        console.assert(priority !== undefined, "cTAref addNotice5: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "cTAref addNotice5: 'priority' parameter should be a number not a '" + (typeof priority) + "': " + priority);
        console.assert(message !== undefined, "cTAref addNotice5: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "cTAref addNotice5: 'message' parameter should be a string not a '" + (typeof message) + "': " + message);
        console.assert(index !== undefined, "cTAref addNotice5: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "cTAref addNotice5: 'index' parameter should be a number not a '" + (typeof index) + "': " + index);
        console.assert(extract !== undefined, "cTAref addNotice5: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "cTAref addNotice5: 'extract' parameter should be a string not a '" + (typeof extract) + "': " + extract);
        console.assert(location !== undefined, "cTAref addNotice5: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "cTAref addNotice5: 'location' parameter should be a string not a '" + (typeof location) + "': " + location);
        ctarResult.noticeList.push([priority, message, index, extract, location]);
    }


    // Main code for checkTAReference
    /*
    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (e) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    //     console.log("Using supplied extractLength=" + extractLength, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, "halfLengthPlus="+halfLengthPlus);
    */

    let username;
    try {
        username = optionalCheckingOptions.taRepoUsername;
    } catch (e) { }
    if (!username) username = 'unfoldingWord'; // or Door43-Catalog ???
    let branch;
    try {
        branch = optionalCheckingOptions.taRepoBranch;
    } catch (e) { }
    if (!branch) branch = 'master';
    let languageCode;
    try {
        languageCode = optionalCheckingOptions.taRepoLanguageCode;
    } catch (e) { }
    if (!languageCode) languageCode = 'en';
    let sectionName;
    try {
        sectionName = optionalCheckingOptions.taRepoSectionName;
    } catch (e) { }
    if (!sectionName) sectionName = 'translation';
    const taRepoName = `${languageCode}_ta`;
    const filepath = `${sectionName}/${fieldText}/01.md`; // Other files are title.md, sub-title.md

    // console.log(`Need to check against ${taRepoName}`);
    let taFileContent; // Not really used here -- just to show that we got something valid
    try {
        taFileContent = await getFile({ username, repository: taRepoName, path: filepath, branch });
        // console.log("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
    } catch (e) {
        console.log("ERROR: Failed to load", username, taRepoName, filepath, branch, e.message);
        addNotice5(886, "Error loading TA link", -1, fieldText, `${ourLocation} ${filepath}: ${e}`);
    }
    if (!taFileContent)
        addNotice5(887, "Unable to find TA link", -1, fieldText, `${ourLocation} ${filepath}`);
    else if ( taFileContent.length < 10)
        addNotice5(885, "Linked TA article seems empty", -1, fieldText, `${ourLocation} ${filepath}`);

    // console.log(`checkTAReference is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkTAReference function


export default checkTAReference;
