import * as books from '../core/books/books';
import { getFile } from '../core/getApi';
import { ourParseInt } from './utilities';
// import { consoleLogObject } from '../core/utilities';


const TN_LINKS_VALIDATOR_VERSION = '0.1.0';

const DEFAULT_EXTRACT_LENGTH = 10;


async function checkTNLinks(BBB, fieldName, fieldText, givenLocation, optionalCheckingOptions) {
    /* This is for the case of the OccurrenceNote field containing markdown links

    These notes may contain links
        to TA, e.g., “(See: [[rc://en/ta/man/translate/figs-metaphor]] and …”
        to TWs, e.g., “(See: [[rc://en/tw/dict/bible/other/death]] and …”
        To Bibles, e.g., “… how you translated this in [Revelation 3:11](../03/11.md).”

    // We fetch the TA link from Door43 to test that it's really there
    //  -- you can control this with:
    //      optionalCheckingOptions.taRepoUsername
    //      optionalCheckingOptions.taRepoBranch (or tag)
    //      optionalCheckingOptions.taRepoDefaultLanguageCode
    */

    // console.log(`checkTNLinks v${TN_LINKS_VALIDATOR_VERSION} ${BBB} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, …)`);
    console.assert(BBB !== undefined, "checkTNLinks: 'BBB' parameter should be defined");
    console.assert(typeof BBB === 'string', "checkTNLinks: 'BBB' parameter should be a string not a '" + (typeof BBB) + "'");
    console.assert(BBB.length === 3, `checkTNLinks: 'BBB' parameter should be three characters long not ${BBB.length}`);
    console.assert(books.isValidBookCode(BBB), `checkTNLinks: '${BBB}' is not a valid USFM book code`);
    console.assert(fieldName !== undefined, "checkTNLinks: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkTNLinks: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldText !== undefined, "checkTNLinks: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkTNLinks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    console.assert(givenLocation !== undefined, "checkTNLinks: 'fieldText' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkTNLinks: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);
    console.assert(fieldName === 'OccurrenceNote'); // so far

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (fieldName) ourLocation = ` in ${fieldName}${ourLocation}`;

    const ctarResult = { noticeList: [] };

    function addNotice5(priority, message, index, extract, location) {
        // console.log(`checkTNLinks Notice: (priority=${priority}) ${message}${index > 0 ? " (at character " + index + 1 + ")" : ""}${extract ? " " + extract : ""}${location}`);
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


    // Main code for checkTNLinks
    /*
    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (trcELerror) { }
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
    } catch (trcUNerror) { }
    if (!username) username = 'unfoldingWord'; // or Door43-Catalog ???
    let branch;
    try {
        branch = optionalCheckingOptions.taRepoBranch;
    } catch (trcBRerror) { }
    if (!branch) branch = 'master';
    let defaultLanguageCode;
    try {
        defaultLanguageCode = optionalCheckingOptions.taRepoLanguageCode;
    } catch (trcLCerror) { }
    if (!defaultLanguageCode) defaultLanguageCode = 'en';


    // Check TA links like [[rc://en/ta/man/translate/figs-metaphor]]
    let resultArray;
    // console.log("checkTNLinks: Search for TA links")
    const taRegex = new RegExp('\\[\\[rc://([^ /]+?)/ta/man/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');
    while (resultArray = taRegex.exec(fieldText)) {
        // console.log(`  resultArray=${JSON.stringify(resultArray)}`);
        console.assert(resultArray.length === 4, `Expected 4 fields (not ${resultArray.length})`)
        let languageCode = resultArray[1];
        if (!languageCode || languageCode === '*') languageCode = defaultLanguageCode;
        const taRepoName = `${languageCode}_ta`;
        // console.log(`Got taRepoName=${taRepoName}`);
        const filepath = `${resultArray[2]}/${resultArray[3]}/01.md`; // Other files are title.md, sub-title.md
        // console.log(`Got tA filepath=${filepath}`);

        // console.log(`Need to check against ${taRepoName}`);
        let taFileContent; // Not really used here -- just to show that we got something valid
        try {
            taFileContent = await getFile({ username, repository: taRepoName, path: filepath, branch });
            // console.log("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
        } catch (trcGCerror) {
            console.log("ERROR: Failed to load", username, taRepoName, filepath, branch, trcGCerror.message);
            addNotice5(885, `Error loading ${fieldName} TA link`, -1, resultArray[0], `${ourLocation} ${filepath}: ${trcGCerror}`);
        }
        if (!taFileContent)
            addNotice5(886, `Unable to find ${fieldName} TA link`, -1, resultArray[0], `${ourLocation} ${filepath}`);
        else if (taFileContent.length < 10)
            addNotice5(884, `Linked ${fieldName} TA article seems empty`, -1, resultArray[0], `${ourLocation} ${filepath}`);
    }

    // Check TW links like [[rc://en/tw/dict/bible/other/death]]
    // console.log("checkTNLinks: Search for TW links")
    const twRegex = new RegExp('\\[\\[rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');
    while (resultArray = twRegex.exec(fieldText)) {
        // console.log(`  resultArray=${JSON.stringify(resultArray)}`);
        console.assert(resultArray.length === 4, `Expected 4 fields (not ${resultArray.length})`)
        let languageCode = resultArray[1];
        if (!languageCode || languageCode === '*') languageCode = defaultLanguageCode;
        const twRepoName = `${languageCode}_tw`;
        // console.log(`Got twRepoName=${twRepoName}`);
        const filepath = `bible/${resultArray[2]}/${resultArray[3]}.md`; // Other files are title.md, sub-title.md
        // console.log(`Got tW filepath=${filepath}`);

        // console.log(`Need to check against ${twRepoName}`);
        let taFileContent; // Not really used here -- just to show that we got something valid
        try {
            taFileContent = await getFile({ username, repository: twRepoName, path: filepath, branch });
            // console.log("Fetched fileContent for", twRepoName, filepath, typeof fileContent, fileContent.length);
        } catch (trcGCerror) {
            console.log("ERROR: Failed to load", username, twRepoName, filepath, branch, trcGCerror.message);
            addNotice5(882, `Error loading ${fieldName} TW link`, -1, resultArray[0], `${ourLocation} ${filepath}: ${trcGCerror}`);
        }
        if (!taFileContent)
            addNotice5(883, `Unable to find ${fieldName} TW link`, -1, resultArray[0], `${ourLocation} ${filepath}`);
        else if (taFileContent.length < 10)
            addNotice5(881, `Linked ${fieldName} TW article seems empty`, -1, resultArray[0], `${ourLocation} ${filepath}`);
    }

    // Check Bible links like [Revelation 3:11](../03/11.md)
    const bbb = BBB.toLowerCase();
    let numChaptersThisBook;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    } catch (tnlcError) {
        addNotice5to8(979, "Invalid book code passed to checkTNLinks", -1, "", ` '${BBB}' in first parameter: ${tnlcError}`);
    }

    // console.log("checkTNLinks: Search for Bible links")
    const bibleRegex = new RegExp('\\[(\\w+?) (\\d{1,3}):(\\d{1,3})\\]\\(\\.\\./(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');
    while (resultArray = bibleRegex.exec(fieldText)) {
        // console.log(`  resultArray=${JSON.stringify(resultArray)}`);
        console.assert(resultArray.length === 6, `Expected 6 fields (not ${resultArray.length})`)

        let chapterInt, verseInt;
        try {
            chapterInt = ourParseInt(resultArray[4]);
        } catch (tnCIerror) {
            console.log(`TN Link Check couldn't convert chapter '${resultArray[4]}': ${tnCIerror}`);
            chapterInt = 1;
        }
        let numVersesThisChapter;
        if (chapterInt < 1 || chapterInt > numChaptersThisBook)
            addNotice5(843, "Invalid chapter number", -1, resultArray[4], `${ourLocation}`);
        else {
            try {
                numVersesThisChapter = books.versesInChapter(bbb, chapterInt);
            } catch (tnVIerror) {
            console.log(`TN Link Check couldn't convert verse '${resultArray[5]}': ${tnVIerror}`);
            verseInt = 1;
            }
        }
        try {
            if (ourParseInt(resultArray[2]) !== chapterInt)
                addNotice5(743, "Chapter numbers of Bible link don't match", -1, resultArray[0], `${ourLocation}`);
        } catch (ccError) {
            console.log(`TN Link Check couldn't compare chapter numbers: ${ccError}`);
        }
        try {
            verseInt = ourParseInt(resultArray[5]);
        } catch (tnVIerror) {
            console.log(`TN Link Check couldn't convert verse '${resultArray[5]}': ${tnVIerror}`);
        }
        try {
            if (ourParseInt(resultArray[3]) !== ourParseInt(verseInt))
                addNotice5(742, "Verse numbers of Bible link don't match", -1, resultArray[0], `${ourLocation}`);
        } catch (vvError) {
            console.log(`TN Link Check couldn't compare verse numbers: ${vvError}`);
        }
    }

    // console.log(`checkTNLinks is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkTNLinks function


export default checkTNLinks;
