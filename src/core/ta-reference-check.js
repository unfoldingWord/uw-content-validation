import { cachedGetFile } from '../core/getApi';
// import { consoleLogObject } from '../core/utilities';


// const TA_REFERENCE_VALIDATOR_VERSION_STRING = '0.2.2';

// const DEFAULT_EXTRACT_LENGTH = 10;


export async function checkSupportReferenceInTA(fieldName, fieldText, givenLocation, optionalCheckingOptions) {
    // This is for the case of the full SupportReference field being the article link
    //  which is assumed to be in the translate part of the TA manual.

    // We fetch the TA link from Door43 to test that it's really there
    //  -- you can control this with:
    //      optionalCheckingOptions.taRepoUsername
    //      optionalCheckingOptions.taRepoBranch (or tag)
    //      optionalCheckingOptions.taRepoLanguageCode
    //      optionalCheckingOptions.taRepoSectionName

    // console.log(`checkSupportReferenceInTA v${TA_REFERENCE_VALIDATOR_VERSION_STRING} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, …)`);
    console.assert(fieldName !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldText !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    console.assert(givenLocation !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);
    console.assert(fieldName === 'SupportReference', `Unexpected checkSupportReferenceInTA fieldName='${fieldName}'`); // so far
    console.assert(givenLocation.indexOf(fieldName) < 0, `checkSupportReferenceInTA: 'givenLocation' parameter should be not contain fieldName=${fieldName}`);

    console.assert(fieldName === 'SupportReference');

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (fieldName) ourLocation = ` in ${fieldName}${ourLocation}`;

    const ctarResult = { noticeList: [] };

    function addNoticePartial(noticeObject) {
        // console.log(`checkSupportReferenceInTA Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "cTAref addNoticePartial: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cTAref addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cTAref addNoticePartial: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cTAref addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(characterIndex !== undefined, "cTAref addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cTAref addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "cTAref addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cTAref addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cTAref addNoticePartial: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cTAref addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        ctarResult.noticeList.push({ ...noticeObject, fieldName });
    }


    // Main code for checkSupportReferenceInTA
    /*
    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (trcELerror) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
        // console.log(`Using supplied extractLength=${extractLength}`, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, "halfLengthPlus="+halfLengthPlus);
    */

    let taRepoUsername;
    try {
        taRepoUsername = optionalCheckingOptions.taRepoUsername;
    } catch (trcUNerror) { }
    if (!taRepoUsername) taRepoUsername = 'Door43-Catalog'; // or unfoldingWord ???
    let taRepoBranch;
    try {
        taRepoBranch = optionalCheckingOptions.taRepoBranch;
    } catch (trcBRerror) { }
    if (!taRepoBranch) taRepoBranch = 'master';
    let taRepoLanguageCode;
    try {
        taRepoLanguageCode = optionalCheckingOptions.taRepoLanguageCode;
    } catch (trcLCerror) { }
    if (!taRepoLanguageCode) taRepoLanguageCode = 'en';
    let taRepoSectionName;
    try {
        taRepoSectionName = optionalCheckingOptions.taRepoSectionName;
    } catch (trcSNerror) { }
    if (!taRepoSectionName) taRepoSectionName = 'translate';
    const taRepoName = `${taRepoLanguageCode}_ta`;
    const filepath = `${taRepoSectionName}/${fieldText}/01.md`; // Other files are title.md, sub-title.md

    // console.log(`Need to check against ${taRepoName}`);
    let taFileContent; // Not really used here -- just to show that we got something valid
    try {
        const getFile_ = (optionalCheckingOptions && optionalCheckingOptions.getFile) ? optionalCheckingOptions.getFile : cachedGetFile;
        taFileContent = await getFile_({ username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch });
        // console.log("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
    } catch (trcGCerror) {
        console.error("checkSupportReferenceInTA() failed to load", taRepoUsername, taRepoName, filepath, taRepoBranch, trcGCerror.message);
        addNoticePartial({ priority: 888, message: `Error loading ${fieldName} TA link`, extract: fieldText, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
    }
    if (!taFileContent)
        addNoticePartial({ priority: 889, message: `Unable to find ${fieldName} TA link`, extract: fieldText, location: `${ourLocation} ${filepath}` });
    else if (taFileContent.length < 10)
        addNoticePartial({ priority: 887, message: `Linked ${fieldName} TA article seems empty`, extract: fieldText, location: `${ourLocation} ${filepath}` });

    // console.log(`checkSupportReferenceInTA is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkSupportReferenceInTA function
