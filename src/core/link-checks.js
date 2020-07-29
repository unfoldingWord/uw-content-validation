import { doBasicTextChecks } from './basic-text-check'
import { getURL } from './getApi';

const DEFAULT_EXTRACT_LENGTH = 10;


async function startLiveLinksCheck(linksList, existingNoticeList, callbackFunction) {
    // This (slow) function checks the targets of the given links
    //  to ensure that they actually exist
    // NOTE: no caching yet
    console.log("startLiveLinksCheck for " + linksList.length + " link(s)…")
    // console.log("startLiveLinksCheck was given " + existingNoticeList.length + " warnings.")

    let result = { noticeList: existingNoticeList };

    function addNotice(priority, message, index, extract, location) {
        console.log("sLLC Link Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority!==undefined, "sLLC addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', "sLLC addNotice: 'priority' parameter should be a number not a '"+(typeof priority)+"': "+priority);
        console.assert(message!==undefined, "sLLC addNotice: 'message' parameter should be defined");
        console.assert(typeof message==='string', "sLLC addNotice: 'message' parameter should be a string not a '"+(typeof message)+"':"+message);
        console.assert(index!==undefined, "sLLC addNotice: 'index' parameter should be defined");
        console.assert(typeof index==='number', "sLLC addNotice: 'index' parameter should be a number not a '"+(typeof index)+"': "+index);
        console.assert(extract!==undefined, "sLLC addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract==='string', "sLLC addNotice: 'extract' parameter should be a string not a '"+(typeof extract)+"': "+extract);
        console.assert(location!==undefined, "sLLC addNotice: 'location' parameter should be defined");
        console.assert(typeof location==='string', "sLLC addNotice: 'location' parameter should be a string not a '"+(typeof location)+"': "+location);
        result.noticeList.push([priority, message, index, extract, location]);
    }

    // Now try fetching each link in turn
    for (const linkEntry of linksList) {
        console.log("startLiveLinksCheck linkEntry", JSON.stringify(linkEntry));
        const fetchLink = linkEntry[1]? linkEntry[1]: linkEntry[2]; // Why ??? !!!
        console.log("startLiveLinksCheck attempting to fetch", fetchLink, '…');
        try {
            let response = await getURL(fetchLink);
            const reponseText = response.text();
            console.log("startLiveLinksCheck got response: ", reponseText.length, reponseText);
        } catch (e) {
            console.log("startLiveLinksCheck had an error fetching '" + fetchLink + "': " + e);
            addNotice(439, "Error fetching link", -1, "", " " + fetchLink);
        }
    }

    console.log("startLiveLinksCheck calling callback function…");
    callbackFunction(result);
}

function doBasicLinkChecks(fieldName, fieldText, linkOptions, optionalFieldLocation, optionalCheckingOptions) {
    // Does basic checks for fields that are links or that contain links

    // We assume that checking for compulsory fields is done elsewhere

    // Returns an error list and a warning list
    //  Both lists contain lists of two strings:
    //      1/ the error string
    //      2/ the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)

    console.log("doBasicLinkChecks('"+fieldName+"', '"+fieldText+"')…");
    // console.log( "linkOptions", JSON.stringify(linkOptions));
    // console.log( "linkOptionsEC", linkOptions.expectedCount);

    let result = { noticeList: [] };

    function addNotice(priority, message, index, extract, location) {
        console.log("dBLC Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority!==undefined, "sLLC addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', "sLLC addNotice: 'priority' parameter should be a number not a '"+(typeof priority)+"': "+priority);
        console.assert(message!==undefined, "sLLC addNotice: 'message' parameter should be defined");
        console.assert(typeof message==='string', "sLLC addNotice: 'message' parameter should be a string not a '"+(typeof message)+"': "+message);
        console.assert(index!==undefined, "sLLC addNotice: 'index' parameter should be defined");
        console.assert(typeof index==='number', "sLLC addNotice: 'index' parameter should be a number not a '"+(typeof index)+"': "+index);
        console.assert(extract!==undefined, "sLLC addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract==='string', "sLLC addNotice: 'extract' parameter should be a string not a '"+(typeof extract)+"': "+extract);
        console.assert(location!==undefined, "sLLC addNotice: 'location' parameter should be defined");
        console.assert(typeof location==='string', "sLLC addNotice: 'location' parameter should be a string not a '"+(typeof location)+"': "+location);
        result.noticeList.push([priority, message, index, extract, location]);
    }

    // Create our more detailed location string by prepending the fieldName
    let ourAtString = " in '" + fieldName + "'";
    if (optionalFieldLocation) {
        if (optionalFieldLocation[0] !== ' ') ourAtString += ' ';
        ourAtString += optionalFieldLocation;
    }

    if (!fieldText) { // Nothing to check
        if (linkOptions.expectedCount > 0)
            addNotice(438, "Blank field / missing link (expected " + linkOptions.expectedCount + " link" + (linkOptions.expectedCount === 1 ? "" : "s") + ")", -1, "", ourAtString);
        return result;
    }

    // Ok, we have something in our field
    if (linkOptions.otherTextAllowed)
        result = doBasicTextChecks(fieldName, fieldText, true, optionalFieldLocation, optionalCheckingOptions);

    // Parameter nonsense check
    if (linkOptions.allowedCount > 0 && linkOptions.expectedCount > linkOptions.allowedCount)
        addNotice(111, "Bad options for doBasicLinkChecks: expectedCount=" + linkOptions.expectedCount + " but allowedCount=" + linkOptions.allowedCount, -1, "", "");

    // Check for embedded links
    // First, create our regex from the allowed link types
    let linkRegexParts;
    if (linkOptions.linkTypesAllowed) {
        linkRegexParts = [];
        for (const linkType of linkOptions.linkTypesAllowed) {
            // console.log("doBasicLinkChecks linkType", linkType);
            if (linkType==='RC')
                linkRegexParts.push('(rc://[^ ]+)');
            else if (linkType==='md') {
                linkRegexParts.push('\\[\\[(https*://[^ ]+)\\]\\]'); // [[link]]
                linkRegexParts.push(']\\((https*://[^ ]+)\\)'); // [this](link)
            }
            else if (linkType==='naked')
                linkRegexParts.push('(https*://[^ ]+)');
            else
                addNotice(441, "Unknown '" + linkType + "' linkType parameter", -1, "", "");
        }
    } else { // No link types specified
        linkRegexParts = [];
    }
    // console.log("doBasicLinkChecks linkRegexParts", JSON.stringify(linkRegexParts));
    const linkRegex = new RegExp(linkRegexParts.join('|'), 'g');
    // console.log("linkRegex", JSON.stringify(linkRegex));
    // const regexResults = fieldText.matchAll(linkRegex);
    // console.log("regexResults", regexResults.length, JSON.stringify(regexResults));
    const regexResultsArray = [...fieldText.matchAll(linkRegex)];
    // console.log("doBasicLinkChecks regexResultsArray", regexResultsArray.length, JSON.stringify(regexResultsArray));

    if (regexResultsArray.length < linkOptions.expectedCount)
        addNotice(287, "Not enough links (expected " + linkOptions.expectedCount + " link" + (linkOptions.expectedCount === 1 ? "" : "s") + ")", -1, "", " (only found " + regexResultsArray.length + ")" + ourAtString);

    if (linkOptions.checkTargets && linkOptions.callbackFunction && regexResultsArray) {
        startLiveLinksCheck(regexResultsArray, result.noticeList.slice(0), linkOptions.callbackFunction);
        addNotice(600, regexResultsArray.length + " link target" + (regexResultsArray.length === 1 ? ' is' : 's are') + " still being checked…", -1, "", "");
        console.log("doBasicLinkChecks now returning initial result…");
    }

    // console.log("  doBasicLinkChecks returning with " + result.noticeList.length + " notices.");
    return result;
}
// end of doBasicLinkChecks function

export default doBasicLinkChecks;
