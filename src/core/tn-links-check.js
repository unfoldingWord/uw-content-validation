import localforage from 'localforage';
import Path from 'path';
import * as books from '../core/books/books';
import { DEFAULT_EXTRACT_LENGTH, countOccurrences } from './text-handling-functions'
import { cachedGetFile, checkMarkdownText } from '../core';
import { ourParseInt } from './utilities';
// import { consoleLogObject } from '../core/utilities';


// const TN_LINKS_VALIDATOR_VERSION_STRING = '0.6.6';

const DEFAULT_LANGUAGE_CODE = 'en';
const DEFAULT_BRANCH = 'master';

const GENERAL_LINK1_REGEX = new RegExp('\\[.+?\\]\\(.+?\\)', 'g');
const GENERAL_LINK2_REGEX = new RegExp('\\[\\[.+?\\]\\]', 'g');

const TA_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/ta/man/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');
const TW_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');

// TODO: Allow [Titus 1:9](../01/09/pzi1)
// TODO: See if "[2:23](../02/03.md)" is found by more than one regex below
const OTHER_BOOK_BIBLE_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\(([123A-Z]{2,3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');
const THIS_BOOK_BIBLE_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\((\\.{2,3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');
const THIS_CHAPTER_BIBLE_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(?:(\\d{1,3}):)?(\\d{1,3})\\]\\(\\./(\\d{1,3})\\.md\\)', 'g');


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
 * @param {Object} checkingOptions
 */
export async function checkTNLinksToOutside(bookID, givenC, givenV, fieldName, fieldText, givenLocation, checkingOptions) {
    /* This is for the case of the OccurrenceNote field containing markdown links

    bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

    These notes may contain links
        to TA, e.g., “(See: [[rc://en/ta/man/translate/figs-metaphor]] and …”
        to TWs, e.g., “(See: [[rc://en/tw/dict/bible/other/death]] and …”
        To Bibles, e.g., “… how you translated this in [Revelation 3:11](../03/11.md).”

    // You can supply the function to try to load outside links
    //      checkingOptions?.getFile takes parameters ({username, repository, path, branch})
    // and
    //      checkingOptions?.defaultLanguageCode

    // We attempt to fetch any TA links to test that the destination is really there
    //  -- you can control this with:
    //      checkingOptions?.taRepoUsername
    //      checkingOptions?.taRepoBranch (or tag)
    //      checkingOptions?.checkLinkedTAArticleFlag

    // We attempt to fetch any TW links to test that the destination is really there
    //  -- you can control this with:
    //      checkingOptions?.twRepoUsername
    //      checkingOptions?.twRepoBranch (or tag)
    //      checkingOptions?.checkLinkedTWArticleFlag
    */

    // console.log(`checkTNLinksToOutside v${TN_LINKS_VALIDATOR_VERSION_STRING} ${bookID} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, …)…`);
    console.assert(bookID !== undefined, "checkTNLinksToOutside: 'bookID' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkTNLinksToOutside: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkTNLinksToOutside: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(bookID.toUpperCase() === bookID, `checkTNLinksToOutside: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    console.assert(bookID === 'OBS' || books.isValidBookID(bookID), `checkTNLinksToOutside: '${bookID}' is not a valid USFM book identifier`);
    console.assert(typeof givenC === 'string', `checkTNLinksToOutside: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    console.assert(typeof givenV === 'string', `checkTNLinksToOutside: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    console.assert(fieldName !== undefined, "checkTNLinksToOutside: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkTNLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldName === 'OccurrenceNote' || fieldName === 'Annotation', `checkTNLinksToOutside: 'fieldName' parameter should be 'OccurrenceNote' or 'Annotation' not '${fieldName}'`);
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
        // noticeObject.debugChain = noticeObject.debugChain ? `checkTNLinksToOutside ${noticeObject.debugChain}` : `checkTNLinksToOutside(${fieldName})`;
        ctarResult.noticeList.push({ ...noticeObject, bookID, fieldName });
    }


    // Main code for checkTNLinksToOutside
    // Get any options that were suppplied, or else set default values
    let extractLength;
    try {
        extractLength = checkingOptions?.extractLength;
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

    const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;
    let defaultLanguageCode;
    try { defaultLanguageCode = checkingOptions?.defaultLanguageCode; } catch (trcLCerror) { }
    if (!defaultLanguageCode) defaultLanguageCode = DEFAULT_LANGUAGE_CODE;
    // console.log("checkTNLinksToOutside defaultLanguageCode", defaultLanguageCode);

    let taRepoUsername;
    try { taRepoUsername = checkingOptions?.taRepoUsername; } catch (trcUNerror) { }
    if (!taRepoUsername) taRepoUsername = defaultLanguageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog';
    let taRepoBranch;
    try { taRepoBranch = checkingOptions?.taRepoBranch; } catch (trcBRerror) { }
    if (!taRepoBranch) taRepoBranch = DEFAULT_BRANCH;
    let twRepoUsername;
    try { twRepoUsername = checkingOptions?.twRepoUsername; } catch (trcUNerror) { }
    if (!twRepoUsername) twRepoUsername = defaultLanguageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog';
    let twRepoBranch;
    try { twRepoBranch = checkingOptions?.twRepoBranch; } catch (trcBRerror) { }
    if (!twRepoBranch) twRepoBranch = DEFAULT_BRANCH;

    let regexResultArray;

    // Find total links
    const linksList1 = fieldText.match(GENERAL_LINK1_REGEX) || [];
    // console.log(`linksList1=${JSON.stringify(linksList1)}`);
    const linksList2 = fieldText.match(GENERAL_LINK2_REGEX) || [];
    const totalLinks1 = linksList1.length;
    const totalLinks2 = linksList2.length;
    let taLinkCount = 0, twLinkCount = 0, thisChapterBibleLinkCount = 0, thisBookBibleLinkCount = 0, otherBookBibleLinkCount = 0;

    // Check TA links like [[rc://en/ta/man/translate/figs-metaphor]]
    // console.log("checkTNLinksToOutside: Search for TA links")
    // eslint-disable-next-line no-cond-assign
    while (regexResultArray = TA_REGEX.exec(fieldText)) {
        // console.log(`  checkTNLinksToOutside TA resultArray=${JSON.stringify(resultArray)}`);
        taLinkCount += 1;
        console.assert(regexResultArray.length === 4, `Expected 4 fields (not ${regexResultArray.length})`)
        let languageCode = regexResultArray[1];
        if (languageCode !== '*') {
            const characterIndex = TA_REGEX.lastIndex - regexResultArray[0].length + 7; // lastIndex points to the end of the field that was found
            const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 450, message: "Resource container link should have '*' language code", details: `not '${languageCode}'`, characterIndex, extract, location: ourLocation });
        } else { // At the moment, tC can’t handle these links with * so we have to ensure that they're not there
            const characterIndex = TA_REGEX.lastIndex - regexResultArray[0].length + 7; // lastIndex points to the end of the field that was found
            const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 950, message: "tC cannot yet process '*' language code", characterIndex, extract, location: ourLocation });
        }
        if (!languageCode || languageCode === '*') languageCode = defaultLanguageCode;
        const taRepoName = `${languageCode}_ta`;
        // console.log(`Got taRepoName=${taRepoName}`);
        const filepath = `${regexResultArray[2]}/${regexResultArray[3]}/01.md`; // Other files are title.md, sub-title.md
        // console.log(`Got tA filepath=${filepath}`);

        console.log(`checkTNLinksToOutside: checkingOptions = ${JSON.stringify(checkingOptions)}`);
        console.log(`checkingOptions = ${checkingOptions ? true : false}`);
        console.log(`checkingOptions?.disableAllLinkFetchingFlag = ${checkingOptions?.disableAllLinkFetchingFlag}`);
        console.log(`!checkingOptions?.disableAllLinkFetchingFlag = ${!checkingOptions?.disableAllLinkFetchingFlag}`);
        console.log(`checkingOptions===undefined || checkingOptions.disableAllLinkFetchingFlag!==true = ${checkingOptions===undefined || checkingOptions.disableAllLinkFetchingFlag !== true}`);
        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            console.log(`checkTNLinksToOutside: need to check against ${taRepoName}`);
            const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
            let taFileContent;
            try {
                taFileContent = await getFile_(taPathParameters);
                // console.log("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
            } catch (trcGCerror) {
                // console.error(`checkTNLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                addNoticePartial({ priority: 885, message: `Error loading ${fieldName} TA link`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}: ${trcGCerror}` });
            }
            if (!taFileContent)
                addNoticePartial({ priority: 886, message: `Unable to find ${fieldName} TA link`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}` });
            else if (taFileContent.length < 10)
                addNoticePartial({ priority: 884, message: `Linked ${fieldName} TA article seems empty`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}` });
            else if (checkingOptions?.checkLinkedTAArticleFlag === true) {
                // console.log(`checkTNLinksToOutside got ${checkingOptions?.checkLinkedTAArticleFlag} so checking TA article: ${filepath}`);
                if (await alreadyChecked(taPathParameters) !== true) {
                    // console.log(`checkTNLinksToOutside needs to check TA article: ${filepath}`);
                    const checkTAFileResult = await checkMarkdownText(languageCode, `TA ${regexResultArray[3]}.md`, taFileContent, ourLocation, checkingOptions);
                    for (const noticeObject of checkTAFileResult.noticeList)
                        ctarResult.noticeList.push({ ...noticeObject, username: taRepoUsername, repoCode: 'TA', repoName: taRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TA' });
                    ctarResult.checkedFileCount += 1;
                    ctarResult.checkedFilenames.push(`${regexResultArray[3]}.md`);
                    ctarResult.checkedFilesizes = taFileContent.length;
                    ctarResult.checkedFilenameExtensions = ['md'];
                    ctarResult.checkedRepoNames.push(taRepoName);
                    markAsChecked(taPathParameters); // don’t bother waiting for the result
                }
            }
        }
    }

    // Check TW links like [[rc://en/tw/dict/bible/other/death]]
    //  (These are not nearly as many as TA links.)
    // console.log("checkTNLinksToOutside: Search for TW links")
    // eslint-disable-next-line no-cond-assign
    while (regexResultArray = TW_REGEX.exec(fieldText)) {
        // console.log(`  checkTNLinksToOutside TW resultArray=${JSON.stringify(resultArray)}`);
        twLinkCount += 1;
        console.assert(regexResultArray.length === 4, `Expected 4 fields (not ${regexResultArray.length})`)
        let languageCode = regexResultArray[1];
        if (!languageCode || languageCode === '*') languageCode = defaultLanguageCode;
        const twRepoName = `${languageCode}_tw`;
        // console.log(`Got twRepoName=${twRepoName}`);
        const filepath = `bible/${regexResultArray[2]}/${regexResultArray[3]}.md`; // Other files are title.md, sub-title.md
        // console.log(`Got tW filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
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
                else if (checkingOptions?.checkLinkedTWArticleFlag === true) {
                    // console.log(`checkTNLinksToOutside got ${checkingOptions?.checkLinkedTWArticleFlag} so checking TW article: ${filepath}`);
                    if (await alreadyChecked(twPathParameters) !== true) {
                        // console.log(`checkTNLinksToOutside needs to check TW article: ${filepath}`);
                        const checkTWFileResult = await checkMarkdownText(languageCode, `TW ${regexResultArray[3]}.md`, twFileContent, ourLocation, checkingOptions);
                        for (const noticeObject of checkTWFileResult.noticeList)
                            ctarResult.noticeList.push({ ...noticeObject, username: twRepoUsername, repoCode: 'TW', repoName: twRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TW' });
                        ctarResult.checkedFileCount += 1;
                        ctarResult.checkedFilenames.push(`${regexResultArray[3]}.md`);
                        ctarResult.checkedFilesizes = twFileContent.length;
                        ctarResult.checkedFilenameExtensions = ['md'];
                        ctarResult.checkedRepoNames.push(twRepoName);
                        markAsChecked(twPathParameters); // don’t bother waiting for the result
                    }
                }
            }
        }
    }

    // console.log("checkTNLinksToOutside: Search for Bible links")

    // Check this chapter Bible links like [Revelation 3:11](./11.md)
    // eslint-disable-next-line no-cond-assign
    while (regexResultArray = THIS_CHAPTER_BIBLE_REGEX.exec(fieldText)) {
        // console.log(`  checkTNLinksToOutside THIS_CHAPTER_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        thisChapterBibleLinkCount += 1;
        console.assert(regexResultArray.length === 6, `Expected 6 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, V2] = regexResultArray;

        if (optionalN1) console.assert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // console.log(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = bookID;

        const chapterInt = ourParseInt(givenC), verseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== chapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${chapterInt}`, extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check couldn’t compare chapter numbers: ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== ourParseInt(verseInt))
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${verseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check couldn’t compare verse numbers: ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            console.assert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), chapterInt);
            } catch (tlcNVerror) { }
            if (!chapterInt || chapterInt < 1 || chapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${chapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!verseInt || verseInt < 0 || verseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${chapterInt}:${verseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check this book Bible links like [Revelation 3:11](../03/11.md)
    // eslint-disable-next-line no-cond-assign
    while (regexResultArray = THIS_BOOK_BIBLE_REGEX.exec(fieldText)) {
        // console.log(`  checkTNLinksToOutside THIS_BOOK_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        thisBookBibleLinkCount += 1;
        console.assert(regexResultArray.length === 8, `Expected 8 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2] = regexResultArray;

        if (optionalN1) console.assert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // console.log(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const chapterInt = ourParseInt(C2), verseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== chapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${chapterInt}`, extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check couldn’t compare chapter numbers: ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== ourParseInt(verseInt))
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${verseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check couldn’t compare verse numbers: ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            console.assert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), chapterInt);
            } catch (tlcNVerror) { }
            if (!chapterInt || chapterInt < 1 || chapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${chapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!verseInt || verseInt < 0 || verseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${chapterInt}:${verseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check other book Bible links like [Revelation 3:11](../03/11.md)
    // eslint-disable-next-line no-cond-assign
    while (regexResultArray = OTHER_BOOK_BIBLE_REGEX.exec(fieldText)) {
        console.log(`  checkTNLinksToOutside OTHER_BOOK_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        otherBookBibleLinkCount += 1;
        console.assert(regexResultArray.length === 8, `Expected 8 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2] = regexResultArray;

        if (optionalN1) console.assert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // console.log(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const chapterInt = ourParseInt(C2), verseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== chapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${chapterInt}`, extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check couldn’t compare chapter numbers: ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== ourParseInt(verseInt))
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${verseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check couldn’t compare verse numbers: ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            console.assert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), chapterInt);
            } catch (tlcNVerror) { }
            if (!chapterInt || chapterInt < 1 || chapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${chapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!verseInt || verseInt < 0 || verseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${chapterInt}:${verseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check for additional links that we can’t explain
    const BibleLinkCount = thisChapterBibleLinkCount + thisBookBibleLinkCount + otherBookBibleLinkCount;
    if (totalLinks1 > BibleLinkCount)
        addNoticePartial({ priority: 648, message: "More [ ]( ) links than valid Bible links", details: `detected ${totalLinks1} link${totalLinks1 === 1 ? '' : 's'} but ${BibleLinkCount ? `only ${BibleLinkCount}` : 'no'} Bible link${BibleLinkCount === 1 ? '' : 's'} from ${JSON.stringify(linksList1)}`, location: ourLocation });
    const twaLinkCount = twLinkCount + taLinkCount;
    if (totalLinks2 > twaLinkCount)
        addNoticePartial({ priority: 649, message: "More [[ ]] links than valid TA/TW links", details: `detected ${totalLinks2} link${totalLinks2 === 1 ? '' : 's'} but ${twaLinkCount ? `only ${twaLinkCount}` : 'no'} TA/TW link${twaLinkCount === 1 ? '' : 's'} from ${JSON.stringify(linksList2)}`, location: ourLocation });

    // Check for badly formed links (not processed by the above code)
    // Check for badly formed [[ ]] links
    let leftCount = countOccurrences(fieldText, '[[');
    let rightCount = countOccurrences(fieldText, ']]');
    if (leftCount !== rightCount)
        addNoticePartial({ priority: 845, message: `Mismatched [[ ]] link characters`, details: `left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });
    else {
        leftCount = countOccurrences(fieldText, '[[rc://');
        if (leftCount !== rightCount)
            addNoticePartial({ priority: 844, message: `Mismatched [[rc:// ]] link characters`, details: `left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });
    }
    // Check for badly formed [ ]( ) links
    leftCount = countOccurrences(fieldText, '[');
    const middleCount = countOccurrences(fieldText, '](');
    rightCount = countOccurrences(fieldText, ')');
    if (leftCount < middleCount || rightCount < middleCount)
        addNoticePartial({ priority: 843, message: `Mismatched [ ]( ) link characters`, details: `left=${leftCount.toLocaleString()}, middle=${middleCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });


    // console.log(`checkTNLinksToOutside is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkTNLinksToOutside function
