import { cachedGetFile, alreadyChecked, markAsChecked, isFilepathInRepoTree } from './getApi';
// eslint-disable-next-line no-unused-vars
import { functionLog, parameterAssert, aboutToOverwrite } from './utilities';


// const TA_REFERENCE_VALIDATOR_VERSION_STRING = '0.4.0';


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

    // functionLog(`checkSupportReferenceInTA v${TA_REFERENCE_VALIDATOR_VERSION_STRING} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(fieldName !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldName === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    //parameterAssert(fieldText !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldText === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    //parameterAssert(givenLocation !== undefined, "checkSupportReferenceInTA: 'fieldText' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkSupportReferenceInTA: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);
    //parameterAssert(fieldName === 'SupportReference', `Unexpected checkSupportReferenceInTA fieldName='${fieldName}'`); // so far
    //parameterAssert(givenLocation.indexOf(fieldName) < 0, `checkSupportReferenceInTA: 'givenLocation' parameter should be not contain fieldName=${fieldName}`);

    //parameterAssert(fieldName === 'SupportReference');

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ctarResult = { noticeList: [] };

    function addNoticePartial(incompleteNoticeObject) {
        // functionLog(`checkSupportReferenceInTA Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(incompleteNoticeObject.priority !== undefined, "cTAref addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `cTAref addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}': ${incompleteNoticeObject.priority}`);
        //parameterAssert(incompleteNoticeObject.message !== undefined, "cTAref addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.message === 'string', `cTAref addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}': ${incompleteNoticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "cTAref addNoticePartial: 'characterIndex' parameter should be defined");
        if (incompleteNoticeObject.characterIndex) {
            //parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `cTAref addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}': ${incompleteNoticeObject.characterIndex}`);
        }
        // parameterAssert(excerpt !== undefined, "cTAref addNoticePartial: 'excerpt' parameter should be defined");
        if (incompleteNoticeObject.excerpt) {
            //parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `cTAref addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}': ${incompleteNoticeObject.excerpt}`);
        }
        //parameterAssert(incompleteNoticeObject.location !== undefined, "cTAref addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.location === 'string', `cTAref addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}': ${incompleteNoticeObject.location}`);
        aboutToOverwrite('checkSupportReferenceInTA', ['fieldName'], incompleteNoticeObject, { fieldName });
        ctarResult.noticeList.push({ ...incompleteNoticeObject, fieldName });
    }


    // Main code for checkSupportReferenceInTA
    /*
    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (trcELerror) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
        // debugLog(`Using supplied excerptLength=${excerptLength}`, "cf. default="+DEFAULT_EXCERPT_LENGTH);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, "excerptHalfLengthPlus="+excerptHalfLengthPlus);
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
            addNoticePartial({ priority: 879, message: `Badly formatted Resource Container link`, excerpt: fieldText, location: `${ourLocation} ${filepath}` });
        filepath = `${fieldText.replace('rc://*/ta/man/', '')}/01.md`; // Other files are title.md, sub-title.md
    }
    else filepath = `${taRepoSectionName}/${fieldText}/01.md`; // Other files are title.md, sub-title.md
    // debugLog("checkSupportReferenceInTA filepath", filepath);

    const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
    if (!await alreadyChecked(taPathParameters)) {
        if (checkingOptions?.disableLinkedTAArticlesCheckFlag === true) {
            // New code
            // We don't need/want to check the actual article, so we don't need to fetch it
            // However, we still want to know if the given link actually links to an article
            //  so we'll check it against the tree listing from DCS
            if (!await isFilepathInRepoTree(taPathParameters)) {
                addNoticePartial({ priority: 889, message: "Unable to find linked TA article", details: `linked from TN ${fieldName}`, excerpt: fieldText, location: `${ourLocation} ${filepath}` });
            }
        } else {
            // debugLog(`Need to check against ${taRepoName}`);
            let taFileContent; // Not really used here -- just to show that we got something valid
            try {
                const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;
                taFileContent = await getFile_({ username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch });
                // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
                if (!taFileContent)
                    addNoticePartial({ priority: 889, message: "Unable to find/load linked TA article", details: `linked from TN ${fieldName}`, excerpt: fieldText, location: `${ourLocation} ${filepath}` });
                else if (taFileContent.length < 10)
                    addNoticePartial({ priority: 887, message: "Linked TA article seems empty", details: `linked from TN ${fieldName}`, excerpt: fieldText, location: `${ourLocation} ${filepath}` });
            } catch (trcGCerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                // console.error("checkSupportReferenceInTA() failed to load", taRepoUsername, taRepoName, filepath, taRepoBranch, trcGCerror.message);
                addNoticePartial({ priority: 888, message: "Error loading linked TA article", details: `linked from TN ${fieldName}`, excerpt: fieldText, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
            }
        }
        markAsChecked(taPathParameters); // don’t bother waiting for the result of this async call
    }

    // functionLog(`checkSupportReferenceInTA is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkSupportReferenceInTA function
