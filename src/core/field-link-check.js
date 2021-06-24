// eslint-disable-next-line no-unused-vars
import { REPO_CODES_LIST } from './defaults';
import { checkTextField } from './field-text-check'
import { cachedGetFileUsingFullURL } from './getApi';
// eslint-disable-next-line no-unused-vars
import { userLog, parameterAssert } from './utilities';


const LINK_VALIDATOR_VERSION_STRING = '0.3.5';


export async function startLiveLinksCheck(linksList, existingNoticeList, callbackFunction) {
    // This (IO bound) function checks the targets of the given links
    //  to ensure that they actually exist
    // NOTE: no caching yet
    userLog(`startLiveLinksCheck v${LINK_VALIDATOR_VERSION_STRING} for ${linksList.length} link(s)…`)
    // debugLog(`startLiveLinksCheck was given ${existingNoticeList.length} warnings.`)

    let result = { noticeList: existingNoticeList };

    function addNoticePartial({ priority, message, characterIndex, excerpt, location }) {
        userLog(`sLLC Link Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(priority !== undefined, "sLLC addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof priority === 'number', `sLLC addNoticePartial: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        //parameterAssert(message !== undefined, "sLLC addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof message === 'string', `sLLC addNoticePartial: 'message' parameter should be a string not a '${typeof message}':${message}`);
        // //parameterAssert(characterIndex!==undefined, "sLLC addNoticePartial: 'characterIndex' parameter should be defined");
        if (characterIndex) { //parameterAssert(typeof characterIndex === 'number', `sLLC addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        }
        // //parameterAssert(excerpt!==undefined, "sLLC addNoticePartial: 'excerpt' parameter should be defined");
        if (excerpt) { //parameterAssert(typeof excerpt === 'string', `sLLC addNoticePartial: 'excerpt' parameter should be a string not a '${typeof excerpt}': ${excerpt}`);
        }
        // //parameterAssert(location!==undefined, "sLLC addNoticePartial: 'location' parameter should be defined");
        // //parameterAssert(typeof location==='string', `sLLC addNoticePartial: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({ priority, message, characterIndex, excerpt, location });
    }

    // Now try fetching each link in turn
    for (const linkEntry of linksList) {
        userLog("startLiveLinksCheck linkEntry", JSON.stringify(linkEntry));
        const fetchLink = linkEntry[1] ? linkEntry[1] : linkEntry[2]; // Why ??? !!!
        userLog("startLiveLinksCheck attempting to fetch", fetchLink, '…');
        try {
            const responseData = await cachedGetFileUsingFullURL(fetchLink);
            const responseText = responseData;
            userLog("startLiveLinksCheck got response: ", responseText.length);
        } catch (lcError) {
            console.error(`startLiveLinksCheck had an error fetching '${fetchLink}': ${lcError}`);
            addNoticePartial({ priority: 439, message: "Error fetching link", location: ` ${fetchLink}` });
        }
    }

    userLog("startLiveLinksCheck calling callback function…");
    callbackFunction(result);
}


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode
 * @param {string} fieldName
 * @param {string} fieldText
 * @param {Object} linkOptions
 * @param {string} optionalFieldLocation
 * @param {Object} checkingOptions
 */
export function checkFieldLinks(languageCode, repoCode, fieldName, fieldText, linkOptions, optionalFieldLocation, checkingOptions) {
    // Does basic checks for fields that are links or that contain links

    // NOTE: This function is currently only called from field-link-check.md!!!
    //          TODO: Does it need to be deleted (or finished) ???

    // We assume that checking for compulsory fields is done elsewhere

    // Returns an error list and a warning list
    //  Both lists contain lists of two strings:
    //      1/ the error string
    //      2/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)

    userLog(`checkFieldLinks('${languageCode}', '${repoCode}', '${fieldName}', '${fieldText}', ${JSON.stringify(linkOptions)}, '${optionalFieldLocation}', ${JSON.stringify(checkingOptions)})…`);
    // debugLog( "linkOptions", JSON.stringify(linkOptions));
    // debugLog( "linkOptionsEC", linkOptions.expectedCount);
    //parameterAssert(languageCode !== undefined, "checkFieldLinks: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkFieldLinks: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    //parameterAssert(repoCode !== undefined, "checkFieldLinks: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkFieldLinks: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkFieldLinks: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(fieldName !== undefined, "checkFieldLinks: 'fieldName' parameter should be defined");
    //parameterAssert(typeof fieldName === 'string', `checkFieldLinks: 'fieldName' parameter should be a string not a '${typeof fieldName}': ${fieldName}`);
    //parameterAssert(fieldText !== undefined, "checkFieldLinks: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldText === 'string', `checkFieldLinks: 'fieldText' parameter should be a string not a '${typeof fieldText}': ${fieldText}`);
    //parameterAssert(optionalFieldLocation !== undefined, "checkFieldLinks: 'optionalFieldLocation' parameter should be defined");
    //parameterAssert(typeof optionalFieldLocation === 'string', `checkFieldLinks: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}': ${optionalFieldLocation}`);
    //parameterAssert(optionalFieldLocation.indexOf('true') === -1, `checkFieldLinks: 'optionalFieldLocation' parameter should not be '${optionalFieldLocation}'`);

    let ourLocation = optionalFieldLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let result = { noticeList: [] };

    function addNoticePartial({ priority, message, characterIndex, excerpt, location }) {
        userLog(`cFLs addNoticePartial: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(priority !== undefined, "cFLs addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof priority === 'number', `cFLs addNoticePartial: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        //parameterAssert(message !== undefined, "cFLs addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof message === 'string', `cFLs addNoticePartial: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // //parameterAssert(characterIndex!==undefined, "cFLs addNoticePartial: 'characterIndex' parameter should be defined");
        if (characterIndex) { //parameterAssert(typeof characterIndex === 'number', `cFLs addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        }
        // //parameterAssert(excerpt!==undefined, "cFLs addNoticePartial: 'excerpt' parameter should be defined");
        if (excerpt) { //parameterAssert(typeof excerpt === 'string', `cFLs addNoticePartial: 'excerpt' parameter should be a string not a '${typeof excerpt}': ${excerpt}`);
        }
        //parameterAssert(location !== undefined, "cFLs addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof location === 'string', `cFLs addNoticePartial: 'location' parameter should be a string not a '${typeof location}': ${location}`);

        result.noticeList.push({ priority, message, characterIndex, excerpt, location });
    }

    // // Create our more detailed location string by prepending the fieldName
    // let ourAtString = ` in '${fieldName}'`;
    // if (optionalFieldLocation) {
    //     if (optionalFieldLocation[0] !== ' ') ourAtString += ' ';
    //     ourAtString += optionalFieldLocation;
    // }


    if (!fieldText) { // Nothing to check
        if (linkOptions.expectedCount > 0)
            addNoticePartial({ priority: 438, message: `Blank field / missing link (expected ${linkOptions.expectedCount} link${linkOptions.expectedCount === 1 ? "" : "s"})`, location: ourLocation });
        return result;
    }

    // Ok, we have something in our field
    if (linkOptions.otherTextAllowed)
        result = checkTextField(languageCode, repoCode, 'link', fieldName, fieldText, true, optionalFieldLocation, checkingOptions);

    // Parameter nonsense check
    if (linkOptions.allowedCount > 0 && linkOptions.expectedCount > linkOptions.allowedCount)
        addNoticePartial({ priority: 111, message: `Bad options for checkFieldLinks: expectedCount=${linkOptions.expectedCount} but allowedCount=${linkOptions.allowedCount}` });

    // Check for embedded links
    // First, create our regex from the allowed link types
    let linkRegexParts;
    if (linkOptions.linkTypesAllowed) {
        linkRegexParts = [];
        for (const linkType of linkOptions.linkTypesAllowed) {
            // debugLog("checkFieldLinks linkType", linkType);
            if (linkType === 'RC')
                linkRegexParts.push('(rc://[^ ]+)');
            else if (linkType === 'md') {
                linkRegexParts.push('\\[\\[(https*://[^ ]+)\\]\\]'); // [[link]]
                linkRegexParts.push(']\\((https*://[^ ]+)\\)'); // [this](link)
            }
            else if (linkType === 'naked')
                linkRegexParts.push('(https*://[^ ]+)');
            else
                addNoticePartial({ priority: 441, message: `Unknown linkType parameter`, excerpt: linkType });
        }
    } else { // No link types specified
        linkRegexParts = [];
    }
    // debugLog("checkFieldLinks linkRegexParts", JSON.stringify(linkRegexParts));
    const linkRegex = new RegExp(linkRegexParts.join('|'), 'g');
    // debugLog("linkRegex", JSON.stringify(linkRegex));
    // const regexResults = fieldText.matchAll(linkRegex);
    // debugLog("regexResults", regexResults.length, JSON.stringify(regexResults));
    const regexResultsArray = [...fieldText.matchAll(linkRegex)];
    // debugLog("checkFieldLinks regexResultsArray", regexResultsArray.length, JSON.stringify(regexResultsArray));

    if (regexResultsArray.length < linkOptions.expectedCount)
        addNoticePartial({ priority: 287, message: `Not enough links (expected ${linkOptions.expectedCount} link${linkOptions.expectedCount === 1 ? "" : "s"})`, location: ` (only found ${regexResultsArray.length})${ourLocation}` });

    if (linkOptions.checkTargets && linkOptions.callbackFunction && regexResultsArray) {
        startLiveLinksCheck(regexResultsArray, result.noticeList.slice(0), linkOptions.callbackFunction);
        addNoticePartial({ priority: 600, message: `${regexResultsArray.length} link target${regexResultsArray.length === 1 ? ' is' : 's are'} still being checked…`, location: ourLocation });
        userLog("checkFieldLinks now returning initial result…");
    }

    userLog(`  checkFieldLinks v${LINK_VALIDATOR_VERSION_STRING} returning with ${result.noticeList.length} notices.`);
    return result;
}
// end of checkFieldLinks function
