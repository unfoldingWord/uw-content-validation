import * as books from '../core/books/books';
import { getFile } from '../core/getApi';
import { ourParseInt } from './utilities';
// import { consoleLogObject } from '../core/utilities';


// const TN_LINKS_VALIDATOR_VERSION_STRING = '0.2.2';

// const DEFAULT_EXTRACT_LENGTH = 10;

async function checkTNLinks(bookID, fieldName, fieldText, givenLocation, optionalCheckingOptions) {
    /* This is for the case of the OccurrenceNote field containing markdown links

    bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

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

    // console.log(`checkTNLinks v${TN_LINKS_VALIDATOR_VERSION_STRING} ${bookID} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, …)`);
    console.assert(bookID !== undefined, "checkTNLinks: 'bookID' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkTNLinks: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkTNLinks: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(books.isValidBookID(bookID), `checkTNLinks: '${bookID}' is not a valid USFM book identifier`);
    console.assert(fieldName !== undefined, "checkTNLinks: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkTNLinks: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldText !== undefined, "checkTNLinks: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkTNLinks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    console.assert(givenLocation !== undefined, "checkTNLinks: 'fieldText' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkTNLinks: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);
    console.assert(fieldName === 'OccurrenceNote' || fieldName === 'Annotation', `Unexpected checkTNLinks fieldName='${fieldName}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ctarResult = { noticeList: [] };

    function addNotice6(noticeObject) {
        // console.log(`checkTNLinks Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "cTNlnk addNotice6: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cTNlnk addNotice6: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cTNlnk addNotice6: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cTNlnk addNotice6: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(characterIndex !== undefined, "cTNlnk addNotice6: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cTNlnk addNotice6: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "cTNlnk addNotice6: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cTNlnk addNotice6: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cTNlnk addNotice6: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cTNlnk addNotice6: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        ctarResult.noticeList.push(noticeObject);
    }


    // Main code for checkTNLinks
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
        // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);
    */

  const getFile_ = (optionalCheckingOptions && optionalCheckingOptions.getFile) ? optionalCheckingOptions.getFile : getFile;
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
    // eslint-disable-next-line no-cond-assign
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
            taFileContent = await getFile_({ username, repository: taRepoName, path: filepath, branch });
            // console.log("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
        } catch (trcGCerror) {
            console.log("ERROR: Failed to load", username, taRepoName, filepath, branch, trcGCerror.message);
            addNotice6({priority:885, message:`Error loading ${fieldName} TA link`, extract:resultArray[0], location:`${ourLocation} ${filepath}: ${trcGCerror}`});
        }
        if (!taFileContent)
            addNotice6({priority:886, message:`Unable to find ${fieldName} TA link`, extract:resultArray[0], location:`${ourLocation} ${filepath}`});
        else if (taFileContent.length < 10)
            addNotice6({priority:884, message:`Linked ${fieldName} TA article seems empty`, extract:resultArray[0], location:`${ourLocation} ${filepath}`});
    }

    // Check TW links like [[rc://en/tw/dict/bible/other/death]]
    // console.log("checkTNLinks: Search for TW links")
    const twRegex = new RegExp('\\[\\[rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');
    // eslint-disable-next-line no-cond-assign
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
            taFileContent = await getFile_({ username, repository: twRepoName, path: filepath, branch });
            // console.log("Fetched fileContent for", twRepoName, filepath, typeof fileContent, fileContent.length);
        } catch (trcGCerror) {
            console.log("ERROR: Failed to load", username, twRepoName, filepath, branch, trcGCerror.message);
            addNotice6({priority:882, message:`Error loading ${fieldName} TW link`, extract:resultArray[0], location:`${ourLocation} ${filepath}: ${trcGCerror}`});
        }
        if (!taFileContent)
            addNotice6({priority:883, message:`Unable to find ${fieldName} TW link`, extract:resultArray[0], location:`${ourLocation} ${filepath}`});
        else if (taFileContent.length < 10)
            addNotice6({priority:881, message:`Linked ${fieldName} TW article seems empty`, extract:resultArray[0], location:`${ourLocation} ${filepath}`});
    }

    // Check Bible links like [Revelation 3:11](../03/11.md)
    const lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook;
    try {
        numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
    } catch (tnlcError) {
        addNotice6({priority:979, message:"Invalid book identifier passed to checkTNLinks", location:` '${bookID}' in first parameter: ${tnlcError}`});
    }

    // console.log("checkTNLinks: Search for Bible links")
    const bibleRegex = new RegExp('\\[(\\w+?) (\\d{1,3}):(\\d{1,3})\\]\\(\\.\\./(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');
    // eslint-disable-next-line no-cond-assign
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
        // eslint-disable-next-line no-unused-vars
        let numVersesThisChapter;
        if (chapterInt < 1 || chapterInt > numChaptersThisBook)
            addNotice6({priority:843, message:"Invalid chapter number", extract:resultArray[4], location:`${ourLocation}`});
        else {
            try {
                numVersesThisChapter = books.versesInChapter(lowercaseBookID, chapterInt);
            } catch (tnVIerror) {
            console.log(`TN Link Check couldn't convert verse '${resultArray[5]}': ${tnVIerror}`);
            verseInt = 1;
            }
        }
        try {
            if (ourParseInt(resultArray[2]) !== chapterInt)
                addNotice6({priority:743, message:"Chapter numbers of Bible link don't match", extract:resultArray[0], location:`${ourLocation}`});
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
                addNotice6({priority:742, message:"Verse numbers of Bible link don't match", extract:resultArray[0], location:`${ourLocation}`});
        } catch (vvError) {
            console.log(`TN Link Check couldn't compare verse numbers: ${vvError}`);
        }
    }

    // console.log(`checkTNLinks is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkTNLinks function


export default checkTNLinks;
