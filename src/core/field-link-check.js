import { checkTextField } from './field-text-check'
import { cachedGetURL } from './getApi';


const LINK_VALIDATOR_VERSION_STRING = '0.3.2';

// const DEFAULT_EXTRACT_LENGTH = 10;


async function startLiveLinksCheck(linksList, existingNoticeList, callbackFunction) {
    // This (slow) function checks the targets of the given links
    //  to ensure that they actually exist
    // NOTE: no caching yet
    console.log(`startLiveLinksCheck v${LINK_VALIDATOR_VERSION_STRING} for ${linksList.length} link(s)…`)
    // console.log(`startLiveLinksCheck was given ${existingNoticeList.length} warnings.`)

    let result = { noticeList: existingNoticeList };

    function addNotice5({priority,message, characterIndex, extract, location}) {
        console.log(`sLLC Link Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority!==undefined, "sLLC addNotice5: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', `sLLC addNotice5: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message!==undefined, "sLLC addNotice5: 'message' parameter should be defined");
        console.assert(typeof message==='string', `sLLC addNotice5: 'message' parameter should be a string not a '${typeof message}':${message}`);
        // console.assert(characterIndex!==undefined, "sLLC addNotice5: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex==='number', `sLLC addNotice5: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // console.assert(extract!==undefined, "sLLC addNotice5: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract==='string', `sLLC addNotice5: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        // console.assert(location!==undefined, "sLLC addNotice5: 'location' parameter should be defined");
        // console.assert(typeof location==='string', `sLLC addNotice5: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({priority, message, characterIndex,extract, location});
    }

    // Now try fetching each link in turn
    for (const linkEntry of linksList) {
        console.log("startLiveLinksCheck linkEntry", JSON.stringify(linkEntry));
        const fetchLink = linkEntry[1]? linkEntry[1]: linkEntry[2]; // Why ??? !!!
        console.log("startLiveLinksCheck attempting to fetch", fetchLink, '…');
        try {
            let response = await cachedGetURL(fetchLink);
            const reponseText = response.text();
            console.log("startLiveLinksCheck got response: ", reponseText.length, reponseText);
        } catch (lcError) {
            console.log(`startLiveLinksCheck had an error fetching '${fetchLink}': ${lcError}`);
            addNotice5({priority:439, message:"Error fetching link", location:` ${fetchLink}`});
        }
    }

    console.log("startLiveLinksCheck calling callback function…");
    callbackFunction(result);
}

function checkFieldLinks(fieldName, fieldText, linkOptions, optionalFieldLocation, optionalCheckingOptions) {
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

    let result = { noticeList: [] };

    function addNotice5({priority,message, characterIndex, extract, location}) {
        console.log(`cFLs addNotice5: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority!==undefined, "cFLs addNotice5: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', `cFLs addNotice5: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message!==undefined, "cFLs addNotice5: 'message' parameter should be defined");
        console.assert(typeof message==='string', `cFLs addNotice5: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // console.assert(characterIndex!==undefined, "cFLs addNotice5: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex==='number', `cFLs addNotice5: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // console.assert(extract!==undefined, "cFLs addNotice5: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract==='string', `cFLs addNotice5: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location!==undefined, "cFLs addNotice5: 'location' parameter should be defined");
        console.assert(typeof location==='string', `cFLs addNotice5: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({priority, message, characterIndex,extract, location});
    }

    // Create our more detailed location string by prepending the fieldName
    let ourAtString = ` in '${fieldName}'`;
    if (optionalFieldLocation) {
        if (optionalFieldLocation[0] !== ' ') ourAtString += ' ';
        ourAtString += optionalFieldLocation;
    }

    if (!fieldText) { // Nothing to check
        if (linkOptions.expectedCount > 0)
            addNotice5({priority:438, message:`Blank field / missing link (expected ${linkOptions.expectedCount} link${linkOptions.expectedCount === 1 ? "" : "s"})`, location:ourAtString});
        return result;
    }

    // Ok, we have something in our field
    if (linkOptions.otherTextAllowed)
        result = checkTextField(fieldName, fieldText, true, optionalFieldLocation, optionalCheckingOptions);

    // Parameter nonsense check
    if (linkOptions.allowedCount > 0 && linkOptions.expectedCount > linkOptions.allowedCount)
        addNotice5({priority:111, message:`Bad options for checkFieldLinks: expectedCount=${linkOptions.expectedCount} but allowedCount=${linkOptions.allowedCount}`});

    // Check for embedded links
    // First, create our regex from the allowed link types
    let linkRegexParts;
    if (linkOptions.linkTypesAllowed) {
        linkRegexParts = [];
        for (const linkType of linkOptions.linkTypesAllowed) {
            // console.log("checkFieldLinks linkType", linkType);
            if (linkType==='RC')
                linkRegexParts.push('(rc://[^ ]+)');
            else if (linkType==='md') {
                linkRegexParts.push('\\[\\[(https*://[^ ]+)\\]\\]'); // [[link]]
                linkRegexParts.push(']\\((https*://[^ ]+)\\)'); // [this](link)
            }
            else if (linkType==='naked')
                linkRegexParts.push('(https*://[^ ]+)');
            else
                addNotice5({priority:441, message:`Unknown linkType parameter`, extract:linkType});
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
        addNotice5({priority:287, message:`Not enough links (expected ${linkOptions.expectedCount} link${linkOptions.expectedCount === 1 ? "" : "s"})`, location:` (only found ${regexResultsArray.length})${ourAtString}`});

    if (linkOptions.checkTargets && linkOptions.callbackFunction && regexResultsArray) {
        startLiveLinksCheck(regexResultsArray, result.noticeList.slice(0), linkOptions.callbackFunction);
        addNotice5({priority:600, message:`${regexResultsArray.length} link target${regexResultsArray.length === 1 ? ' is' : 's are'} still being checked…`, location:ourAtString});
        console.log("checkFieldLinks now returning initial result…");
    }

    console.log(`  checkFieldLinks v${LINK_VALIDATOR_VERSION_STRING} returning with ${result.noticeList.length} notices.`);
    return result;
}
// end of checkFieldLinks function

export default checkFieldLinks;
