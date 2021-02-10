import { cachedGetFile } from '../core/getApi';
import { parameterAssert } from './utilities';
// import { consoleLogObject } from '../core/utilities';


// const TA_REFERENCE_VALIDATOR_VERSION_STRING = '0.3.1';


export async function checkSupportReferenceInTA(fieldName, fieldText, givenLocation, checkingOptions) {
    // This is for the case of the full SupportReference field being the article link
    //  which is assumed to be in the translate part of the TA manual.

    // We fetch the TA link from Door43 to test that it’s really there
    //  -- you can control this with:
    //      checkingOptions?.taRepoUsername
    //      checkingOptions?.taRepoBranch (or tag)
    //      checkingOptions?.taRepoLanguageCode
    //      checkingOptions?.taRepoSectionName
    //      checkingOptions?.expectFullLink (bool)

    // functionLog(`checkSupportReferenceInTA v${TA_REFERENCE_VALIDATOR_VERSION_STRING} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, …)`);
    parameterAssert(fieldName !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldName === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    parameterAssert(fieldText !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldText === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    parameterAssert(givenLocation !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    parameterAssert(typeof givenLocation === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);
    parameterAssert(fieldName === 'SupportReference', `Unexpected checkSupportReferenceInTA fieldName='${fieldName}'`); // so far
    parameterAssert(givenLocation.indexOf(fieldName) < 0, `checkSupportReferenceInTA: 'givenLocation' parameter should be not contain fieldName=${fieldName}`);

    parameterAssert(fieldName === 'SupportReference');

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ctarResult = { noticeList: [] };

    function addNoticePartial(noticeObject) {
        // functionLog(`checkSupportReferenceInTA Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        parameterAssert(noticeObject.priority !== undefined, "cTAref addNoticePartial: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `cTAref addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "cTAref addNoticePartial: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `cTAref addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "cTAref addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cTAref addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(extract !== undefined, "cTAref addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) parameterAssert(typeof noticeObject.extract === 'string', `cTAref addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        parameterAssert(noticeObject.location !== undefined, "cTAref addNoticePartial: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `cTAref addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        ctarResult.noticeList.push({ ...noticeObject, fieldName });
    }


    // Main code for checkSupportReferenceInTA
    /*
    let extractLength;
    try {
        extractLength = checkingOptions?.extractLength;
    } catch (trcELerror) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // debugLog(`Using default extractLength=${extractLength}`);
    }
    // else
        // debugLog(`Using supplied extractLength=${extractLength}`, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // debugLog(`Using halfLength=${halfLength}`, "halfLengthPlus="+halfLengthPlus);
    */

    let taRepoUsername;
    try {
        taRepoUsername = checkingOptions?.taRepoUsername;
    } catch (trcUNerror) { }
    if (!taRepoUsername) taRepoUsername = 'Door43-Catalog'; // or unfoldingWord ???
    let taRepoBranch;
    try {
        taRepoBranch = checkingOptions?.taRepoBranch;
    } catch (trcBRerror) { }
    if (!taRepoBranch) taRepoBranch = 'master';
    let taRepoLanguageCode;
    try {
        taRepoLanguageCode = checkingOptions?.taRepoLanguageCode;
    } catch (trcLCerror) { }
    if (!taRepoLanguageCode) taRepoLanguageCode = 'en';
    let taRepoSectionName;
    try {
        taRepoSectionName = checkingOptions?.taRepoSectionName;
    } catch (trcSNerror) { }
    if (!taRepoSectionName) taRepoSectionName = 'translate';
    const taRepoName = `${taRepoLanguageCode}_ta`;
    let filepath;
    if (checkingOptions?.expectFullLink) {
        // debugLog("checkSupportReferenceInTA expect full link")
        if (!fieldText.startsWith('rc://*/'))
            addNoticePartial({ priority: 879, message: `Badly formatted Resource Container link`, extract: fieldText, location: `${ourLocation} ${filepath}` });
        filepath = `${fieldText.replace('rc://*/ta/man/', '')}/01.md`; // Other files are title.md, sub-title.md
    }
    else filepath = `${taRepoSectionName}/${fieldText}/01.md`; // Other files are title.md, sub-title.md
    // debugLog("checkSupportReferenceInTA filepath", filepath);

    // debugLog(`Need to check against ${taRepoName}`);
    let taFileContent; // Not really used here -- just to show that we got something valid
    try {
        const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;
        taFileContent = await getFile_({ username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch });
        // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
        if (!taFileContent)
            addNoticePartial({ priority: 889, message: `Unable to find TA link`, extract: fieldText, location: `${ourLocation} ${filepath}` });
        else if (taFileContent.length < 10)
            addNoticePartial({ priority: 887, message: `Linked TA article seems empty`, extract: fieldText, location: `${ourLocation} ${filepath}` });
    } catch (trcGCerror) {
        // console.error("checkSupportReferenceInTA() failed to load", taRepoUsername, taRepoName, filepath, taRepoBranch, trcGCerror.message);
        addNoticePartial({ priority: 888, message: `Error loading TA link`, extract: fieldText, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
    }

    // functionLog(`checkSupportReferenceInTA is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkSupportReferenceInTA function
