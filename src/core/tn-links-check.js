import localforage from 'localforage';
import Path from 'path';
import * as books from '../core/books/books';
import { cachedGetFile, checkMarkdownText } from '../core';
import { ourParseInt } from './utilities';
// import { consoleLogObject } from '../core/utilities';


// const TN_LINKS_VALIDATOR_VERSION_STRING = '0.5.1';

const DEFAULT_EXTRACT_LENGTH = 10;

const DEFAULT_USERNAME = 'Door43-Catalog'; // or unfoldingWord ???
const DEFAULT_BRANCH = 'master';
const DEFAULT_LANGUAGE_CODE = 'en';

const TA_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/ta/man/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');
const TW_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');
const BIBLE_REGEX = new RegExp('\\[(\\w+?) (\\d{1,3}):(\\d{1,3})\\]\\((.{2,3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');


// Caches the path names of files which have been already checked
//  Used for storing paths to TA and TW articles that have already been checked
const checkedArticleStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'CV-checked-path-store',
});

export async function clearCheckedArticleCache() {
    console.log("clearCheckedArticleCache()…");
    await checkedArticleStore.clear();
}

/**
 *
 * @param {string} username
 * @param {string} repository name
 * @param {string} path
 * @param {string} branch
 */
async function markAsChecked({ username, repository, path, branch }) {
    // console.log(`markAsChecked(${username}, ${repository}, ${path}, ${branch})…`);
    const dummyPath = Path.join(username, repository, branch, path);
    await checkedArticleStore.setItem(dummyPath, true);
}

/**
 *
 * @param {string} username
 * @param {string} repository name
 * @param {string} path
 * @param {string} branch
 */
async function alreadyChecked({ username, repository, path, branch }) {
    // console.log(`alreadyChecked(${username}, ${repository}, ${path}, ${branch})…`);
    const dummyPath = Path.join(username, repository, branch, path);
    return await checkedArticleStore.getItem(dummyPath);
}


/**
 *
 * @param {string} bookID
 * @param {string} fieldName
 * @param {string} fieldText
 * @param {string} givenLocation
 * @param {Object} optionalCheckingOptions
 */
export async function checkTNLinksToOutside(bookID, fieldName, fieldText, givenLocation, optionalCheckingOptions) {
    /* This is for the case of the OccurrenceNote field containing markdown links

    bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

    These notes may contain links
        to TA, e.g., “(See: [[rc://en/ta/man/translate/figs-metaphor]] and …”
        to TWs, e.g., “(See: [[rc://en/tw/dict/bible/other/death]] and …”
        To Bibles, e.g., “… how you translated this in [Revelation 3:11](../03/11.md).”

    // You can supply the function to try to load outside links
    //      optionalCheckingOptions.getFile takes parameters ({username, repository, path, branch})
    // and
    //      optionalCheckingOptions.defaultLanguageCode

    // We attempt to fetch any TA links to test that the destination is really there
    //  -- you can control this with:
    //      optionalCheckingOptions.taRepoUsername
    //      optionalCheckingOptions.taRepoBranch (or tag)
    //      optionalCheckingOptions.checkLinkedTAArticleFlag

    // We attempt to fetch any TW links to test that the destination is really there
    //  -- you can control this with:
    //      optionalCheckingOptions.twRepoUsername
    //      optionalCheckingOptions.twRepoBranch (or tag)
    //      optionalCheckingOptions.checkLinkedTWArticleFlag
    */

    // console.log(`checkTNLinksToOutside v${TN_LINKS_VALIDATOR_VERSION_STRING} ${bookID} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, …)…`);
    console.assert(bookID !== undefined, "checkTNLinksToOutside: 'bookID' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkTNLinksToOutside: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkTNLinksToOutside: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(bookID.toUpperCase() === bookID, `checkTNLinksToOutside: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    console.assert(books.isValidBookID(bookID), `checkTNLinksToOutside: '${bookID}' is not a valid USFM book identifier`);
    console.assert(fieldName !== undefined, "checkTNLinksToOutside: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkTNLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldText !== undefined, "checkTNLinksToOutside: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkTNLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    console.assert(givenLocation !== undefined, "checkTNLinksToOutside: 'fieldText' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkTNLinksToOutside: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);
    console.assert(fieldName === 'OccurrenceNote' || fieldName === 'Annotation', `Unexpected checkTNLinksToOutside fieldName='${fieldName}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ctarResult = { noticeList: [], checkedFileCount: 0, checkedFilenames: [], checkedRepoNames: [] };

    function addNoticePartial(noticeObject) {
        // console.log(`checkTNLinksToOutside Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "cTNlnk addNoticePartial: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cTNlnk addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cTNlnk addNoticePartial: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cTNlnk addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(characterIndex !== undefined, "cTNlnk addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cTNlnk addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "cTNlnk addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cTNlnk addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cTNlnk addNoticePartial: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cTNlnk addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        ctarResult.noticeList.push({ ...noticeObject, bookID, fieldName });
    }


    // Main code for checkTNLinksToOutside
    // Get any options that were suppplied, or else set default values
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

    const getFile_ = (optionalCheckingOptions && optionalCheckingOptions.getFile) ? optionalCheckingOptions.getFile : cachedGetFile;
    let defaultLanguageCode;
    try { defaultLanguageCode = optionalCheckingOptions.defaultLanguageCode; } catch (trcLCerror) { }
    if (!defaultLanguageCode) defaultLanguageCode = DEFAULT_LANGUAGE_CODE;
    // console.log("checkTNLinksToOutside defaultLanguageCode", defaultLanguageCode);

    let taRepoUsername;
    try { taRepoUsername = optionalCheckingOptions.taRepoUsername; } catch (trcUNerror) { }
    if (!taRepoUsername) taRepoUsername = DEFAULT_USERNAME;
    let taRepoBranch;
    try { taRepoBranch = optionalCheckingOptions.taRepoBranch; } catch (trcBRerror) { }
    if (!taRepoBranch) taRepoBranch = DEFAULT_BRANCH;
    let twRepoUsername;
    try { twRepoUsername = optionalCheckingOptions.twRepoUsername; } catch (trcUNerror) { }
    if (!twRepoUsername) twRepoUsername = DEFAULT_USERNAME;
    let twRepoBranch;
    try { twRepoBranch = optionalCheckingOptions.twRepoBranch; } catch (trcBRerror) { }
    if (!twRepoBranch) twRepoBranch = DEFAULT_BRANCH;


    // Check TA links like [[rc://en/ta/man/translate/figs-metaphor]]
    let regexResultArray;
    // console.log("checkTNLinksToOutside: Search for TA links")
    // eslint-disable-next-line no-cond-assign
    while (regexResultArray = TA_REGEX.exec(fieldText)) {
        // console.log(`  checkTNLinksToOutside TA resultArray=${JSON.stringify(resultArray)}`);
        console.assert(regexResultArray.length === 4, `Expected 4 fields (not ${regexResultArray.length})`)
        let languageCode = regexResultArray[1];
        if (languageCode !== '*') {
            const characterIndex = TA_REGEX.lastIndex - regexResultArray[0].length + 7; // lastIndex points to the end of the field that was found
            const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 450, message: "Resource container link should have '*' language code", details: `(not '${languageCode}')`, characterIndex, extract, location: ourLocation });
        }
        if (!languageCode || languageCode === '*') languageCode = defaultLanguageCode;
        const taRepoName = `${languageCode}_ta`;
        // console.log(`Got taRepoName=${taRepoName}`);
        const filepath = `${regexResultArray[2]}/${regexResultArray[3]}/01.md`; // Other files are title.md, sub-title.md
        // console.log(`Got tA filepath=${filepath}`);

        // console.log(`Need to check against ${taRepoName}`);
        const taPathParameters = { username: twRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
        let taFileContent; // Not really used here -- just to show that we got something valid
        try {
            taFileContent = await getFile_(taPathParameters);
            // console.log("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
        } catch (trcGCerror) {
            console.error(`checkTNLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
            addNoticePartial({ priority: 885, message: `Error loading ${fieldName} TA link`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}: ${trcGCerror}` });
        }
        if (!taFileContent)
            addNoticePartial({ priority: 886, message: `Unable to find ${fieldName} TA link`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}` });
        else if (taFileContent.length < 10)
            addNoticePartial({ priority: 884, message: `Linked ${fieldName} TA article seems empty`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}` });
        else if (optionalCheckingOptions.checkLinkedTAArticleFlag === true) {
            // console.log(`checkTNLinksToOutside got ${optionalCheckingOptions.checkLinkedTAArticleFlag} so checking TA article: ${filepath}`);
            if (await alreadyChecked(taPathParameters) !== true) {
                // console.log(`checkTNLinksToOutside needs to check TA article: ${filepath}`);
                const checkTAFileResult = checkMarkdownText(`${regexResultArray[3]}.md`, taFileContent, ourLocation, optionalCheckingOptions);
                for (const noticeObject of checkTAFileResult.noticeList)
                    ctarResult.noticeList.push({ ...noticeObject, repoName: taRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TA' });
                ctarResult.checkedFileCount += 1;
                ctarResult.checkedFilenames.push(`${regexResultArray[3]}.md`);
                ctarResult.checkedFilesizes = taFileContent.length;
                ctarResult.checkedFilenameExtensions = ['md'];
                ctarResult.checkedRepoNames.push(taRepoName);
                markAsChecked(taPathParameters); // don't bother waiting for the result
            }
        }
    }

    // Check TW links like [[rc://en/tw/dict/bible/other/death]]
    //  (These are not nearly as many as TA links.)
    // console.log("checkTNLinksToOutside: Search for TW links")
    // eslint-disable-next-line no-cond-assign
    while (regexResultArray = TW_REGEX.exec(fieldText)) {
        // console.log(`  checkTNLinksToOutside TW resultArray=${JSON.stringify(resultArray)}`);
        console.assert(regexResultArray.length === 4, `Expected 4 fields (not ${regexResultArray.length})`)
        let languageCode = regexResultArray[1];
        if (!languageCode || languageCode === '*') languageCode = defaultLanguageCode;
        const twRepoName = `${languageCode}_tw`;
        // console.log(`Got twRepoName=${twRepoName}`);
        const filepath = `bible/${regexResultArray[2]}/${regexResultArray[3]}.md`; // Other files are title.md, sub-title.md
        // console.log(`Got tW filepath=${filepath}`);

        // console.log(`Need to check against ${twRepoName}`);
        const twPathParameters = { username: twRepoUsername, repository: twRepoName, path: filepath, branch: twRepoBranch };
        let twFileContent;
        try {
            twFileContent = await getFile_(twPathParameters);
            // console.log("Fetched fileContent for", twRepoName, filepath, typeof fileContent, fileContent.length);
        } catch (trcGCerror) {
            console.error(`checkTNLinksToOutside(${bookID}, ${fieldName}, …) failed to load TW`, twRepoUsername, twRepoName, filepath, twRepoBranch, trcGCerror.message);
            addNoticePartial({ priority: 882, message: `Error loading ${fieldName} TW link`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}: ${trcGCerror}` });
        }
        if (!twFileContent)
            addNoticePartial({ priority: 883, message: `Unable to find ${fieldName} TW link`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}` });
        else { // we got the content of the TW article
            if (twFileContent.length < 10)
                addNoticePartial({ priority: 881, message: `Linked ${fieldName} TW article seems empty`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}` });
            else if (optionalCheckingOptions.checkLinkedTWArticleFlag === true) {
                // console.log(`checkTNLinksToOutside got ${optionalCheckingOptions.checkLinkedTWArticleFlag} so checking TW article: ${filepath}`);
                if (await alreadyChecked(twPathParameters) !== true) {
                    // console.log(`checkTNLinksToOutside needs to check TW article: ${filepath}`);
                    const checkTWFileResult = checkMarkdownText(`${regexResultArray[3]}.md`, twFileContent, ourLocation, optionalCheckingOptions);
                    for (const noticeObject of checkTWFileResult.noticeList)
                        ctarResult.noticeList.push({ ...noticeObject, repoName: twRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TW' });
                    ctarResult.checkedFileCount += 1;
                    ctarResult.checkedFilenames.push(`${regexResultArray[3]}.md`);
                    ctarResult.checkedFilesizes = twFileContent.length;
                    ctarResult.checkedFilenameExtensions = ['md'];
                    ctarResult.checkedRepoNames.push(twRepoName);
                    markAsChecked(twPathParameters); // don't bother waiting for the result
                }
            }
        }
    }

    // Check Bible links like [Revelation 3:11](../03/11.md)
    // console.log("checkTNLinksToOutside: Search for Bible links")
    // eslint-disable-next-line no-cond-assign
    while (regexResultArray = BIBLE_REGEX.exec(fieldText)) {
        // console.log(`  checkTNLinksToOutside Bible resultArray=${JSON.stringify(resultArray)}`);
        console.assert(regexResultArray.length === 7, `Expected 7 fields (not ${regexResultArray.length})`);
        const [totalLink, B1, C1, V1, B2, C2, V2] = regexResultArray;

        let linkBookCode = B2 === '..' ? bookID : B2;

        if (defaultLanguageCode === 'en') { // should be able to check the book name
            const checkResult = books.isGoodEnglishBookName(B1);
            // console.log(B1, "isGoodEnglishBookName checkResult", checkResult);
            if (checkResult === undefined || checkResult === false)
                addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", extract: B1, location: ourLocation });
        }

        const chapterInt = ourParseInt(C2), verseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== chapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don't match", extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check couldn't compare chapter numbers: ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== ourParseInt(verseInt))
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don't match", extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check couldn't compare verse numbers: ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), chapterInt);
            } catch (tlcNVerror) { }
            if (!chapterInt || chapterInt < 1 || chapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", extract: totalLink, location: ourLocation });
            else if (!verseInt || verseInt < 0 || verseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", extract: totalLink, location: ourLocation });
        }
    }

    // console.log(`checkTNLinksToOutside is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkTNLinksToOutside function
