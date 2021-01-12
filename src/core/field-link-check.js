import { checkTextField } from './field-text-check'
import { cachedGetFileUsingFullURL } from './getApi';
import { parameterAssert } from './utilities';


const LINK_VALIDATOR_VERSION_STRING = '0.3.4';


export async function startLiveLinksCheck(linksList, existingNoticeList, callbackFunction) {
    // This (IO bound) function checks the targets of the given links
    //  to ensure that they actually exist
    // NOTE: no caching yet
    console.log(`startLiveLinksCheck v${LINK_VALIDATOR_VERSION_STRING} for ${linksList.length} link(s)…`)
    // console.log(`startLiveLinksCheck was given ${existingNoticeList.length} warnings.`)

    let result = { noticeList: existingNoticeList };

    function addNoticePartial({ priority, message, characterIndex, extract, location }) {
        console.log(`sLLC Link Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        parameterAssert(priority !== undefined, "sLLC addNoticePartial: 'priority' parameter should be defined");
        parameterAssert(typeof priority === 'number', `sLLC addNoticePartial: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        parameterAssert(message !== undefined, "sLLC addNoticePartial: 'message' parameter should be defined");
        parameterAssert(typeof message === 'string', `sLLC addNoticePartial: 'message' parameter should be a string not a '${typeof message}':${message}`);
        // parameterAssert(characterIndex!==undefined, "sLLC addNoticePartial: 'characterIndex' parameter should be defined");
        if (characterIndex) parameterAssert(typeof characterIndex === 'number', `sLLC addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // parameterAssert(extract!==undefined, "sLLC addNoticePartial: 'extract' parameter should be defined");
        if (extract) parameterAssert(typeof extract === 'string', `sLLC addNoticePartial: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        // parameterAssert(location!==undefined, "sLLC addNoticePartial: 'location' parameter should be defined");
        // parameterAssert(typeof location==='string', `sLLC addNoticePartial: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({ priority, message, characterIndex, extract, location });
    }

    // Now try fetching each link in turn
    for (const linkEntry of linksList) {
        console.log("startLiveLinksCheck linkEntry", JSON.stringify(linkEntry));
        const fetchLink = linkEntry[1] ? linkEntry[1] : linkEntry[2]; // Why ??? !!!
        console.log("startLiveLinksCheck attempting to fetch", fetchLink, '…');
        try {
            const responseData = await cachedGetFileUsingFullURL(fetchLink);
            const responseText = responseData;
            console.log("startLiveLinksCheck got response: ", responseText.length);
        } catch (lcError) {
            console.error(`startLiveLinksCheck had an error fetching '${fetchLink}': ${lcError}`);
            addNoticePartial({ priority: 439, message: "Error fetching link", location: ` ${fetchLink}` });
        }
    }

    console.log("startLiveLinksCheck calling callback function…");
    callbackFunction(result);
}


export function checkFieldLinks(fieldName, fieldText, linkOptions, optionalFieldLocation, checkingOptions) {
    // Does basic checks for fields that are links or that contain links

    // We assume that checking for compulsory fields is done elsewhere

    // Returns an error list and a warning list
    //  Both lists contain lists of two strings:
    //      1/ the error string
    //      2/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)

    console.log(`checkFieldLinks('${fieldName}', '${fieldText}')…`);
    // console.log( "linkOptions", JSON.stringify(linkOptions));
    // console.log( "linkOptionsEC", linkOptions.expectedCount);
    parameterAssert(fieldName !== undefined, "checkFieldLinks: 'fieldName' parameter should be defined");
    parameterAssert(typeof fieldName === 'string', `checkFieldLinks: 'fieldName' parameter should be a string not a '${typeof fieldName}': ${fieldName}`);
    parameterAssert(fieldText !== undefined, "checkFieldLinks: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldText === 'string', `checkFieldLinks: 'fieldText' parameter should be a string not a '${typeof fieldText}': ${fieldText}`);
    parameterAssert(optionalFieldLocation !== undefined, "checkFieldLinks: 'optionalFieldLocation' parameter should be defined");
    parameterAssert(typeof optionalFieldLocation === 'string', `checkFieldLinks: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}': ${optionalFieldLocation}`);
    parameterAssert(optionalFieldLocation.indexOf('true') === -1, `checkFieldLinks: 'optionalFieldLocation' parameter should not be '${optionalFieldLocation}'`);

    let ourLocation = optionalFieldLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let result = { noticeList: [] };

    function addNoticePartial({ priority, message, characterIndex, extract, location }) {
        console.log(`cFLs addNoticePartial: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        parameterAssert(priority !== undefined, "cFLs addNoticePartial: 'priority' parameter should be defined");
        parameterAssert(typeof priority === 'number', `cFLs addNoticePartial: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        parameterAssert(message !== undefined, "cFLs addNoticePartial: 'message' parameter should be defined");
        parameterAssert(typeof message === 'string', `cFLs addNoticePartial: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // parameterAssert(characterIndex!==undefined, "cFLs addNoticePartial: 'characterIndex' parameter should be defined");
        if (characterIndex) parameterAssert(typeof characterIndex === 'number', `cFLs addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // parameterAssert(extract!==undefined, "cFLs addNoticePartial: 'extract' parameter should be defined");
        if (extract) parameterAssert(typeof extract === 'string', `cFLs addNoticePartial: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        parameterAssert(location !== undefined, "cFLs addNoticePartial: 'location' parameter should be defined");
        parameterAssert(typeof location === 'string', `cFLs addNoticePartial: 'location' parameter should be a string not a '${typeof location}': ${location}`);

        result.noticeList.push({ priority, message, characterIndex, extract, location });
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
        result = checkTextField('link', fieldName, fieldText, true, optionalFieldLocation, checkingOptions);

    // Parameter nonsense check
    if (linkOptions.allowedCount > 0 && linkOptions.expectedCount > linkOptions.allowedCount)
        addNoticePartial({ priority: 111, message: `Bad options for checkFieldLinks: expectedCount=${linkOptions.expectedCount} but allowedCount=${linkOptions.allowedCount}` });

    // Check for embedded links
    // First, create our regex from the allowed link types
    let linkRegexParts;
    if (linkOptions.linkTypesAllowed) {
        linkRegexParts = [];
        for (const linkType of linkOptions.linkTypesAllowed) {
            // console.log("checkFieldLinks linkType", linkType);
            if (linkType === 'RC')
                linkRegexParts.push('(rc://[^ ]+)');
            else if (linkType === 'md') {
                linkRegexParts.push('\\[\\[(https*://[^ ]+)\\]\\]'); // [[link]]
                linkRegexParts.push(']\\((https*://[^ ]+)\\)'); // [this](link)
            }
            else if (linkType === 'naked')
                linkRegexParts.push('(https*://[^ ]+)');
            else
                addNoticePartial({ priority: 441, message: `Unknown linkType parameter`, extract: linkType });
        }
    } else { // No link types specified
        linkRegexParts = [];
    }
    // console.log("checkFieldLinks linkRegexParts", JSON.stringify(linkRegexParts));
    const linkRegex = new RegExp(linkRegexParts.join('|'), 'g');
    // console.log("linkRegex", JSON.stringify(linkRegex));
    // const regexResults = fieldText.matchAll(linkRegex);
    // console.log("regexResults", regexResults.length, JSON.stringify(regexResults));
    const regexResultsArray = [...fieldText.matchAll(linkRegex)];
    // console.log("checkFieldLinks regexResultsArray", regexResultsArray.length, JSON.stringify(regexResultsArray));

    if (regexResultsArray.length < linkOptions.expectedCount)
        addNoticePartial({ priority: 287, message: `Not enough links (expected ${linkOptions.expectedCount} link${linkOptions.expectedCount === 1 ? "" : "s"})`, location: ` (only found ${regexResultsArray.length})${ourLocation}` });

    if (linkOptions.checkTargets && linkOptions.callbackFunction && regexResultsArray) {
        startLiveLinksCheck(regexResultsArray, result.noticeList.slice(0), linkOptions.callbackFunction);
        addNoticePartial({ priority: 600, message: `${regexResultsArray.length} link target${regexResultsArray.length === 1 ? ' is' : 's are'} still being checked…`, location: ourLocation });
        console.log("checkFieldLinks now returning initial result…");
    }

    console.log(`  checkFieldLinks v${LINK_VALIDATOR_VERSION_STRING} returning with ${result.noticeList.length} notices.`);
    return result;
}
// end of checkFieldLinks function
