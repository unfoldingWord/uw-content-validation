import localforage from 'localforage';
import Path from 'path';
import * as books from '../core/books/books';
import { DEFAULT_EXTRACT_LENGTH, countOccurrences } from './text-handling-functions'
import { cachedGetFile, checkMarkdownText } from '../core';
import { userLog, debugLog, parameterAssert, logicAssert, ourParseInt } from './utilities';
// import { consoleLogObject } from '../core/utilities';


// const TN_LINKS_VALIDATOR_VERSION_STRING = '0.7.3';

const DEFAULT_LANGUAGE_CODE = 'en';
const DEFAULT_BRANCH = 'master';

const GENERAL_LINK1_REGEX = new RegExp('\\[[^]]+?\\]\\([^)]+?\\)', 'g');
const GENERAL_LINK2_REGEX = new RegExp('\\[\\[[^]]+?\\]\\]', 'g');

const TA_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/ta/man/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');
const TW_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g');

// TODO: Do we need to normalise Bible links, i.e., make sure that the link itself
//          (we don't care about the displayed text) doesn't specify superfluous levels/information
// TODO: We need a decision on hyphen vs en-dash in verse references
// TODO: Test to see if "[2:23](../02/03.md)" is found by more than one regex below
const OTHER_BOOK_BIBLE_REGEX =                       new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\(([123A-Z]{2,3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');
const THIS_BOOK_BIBLE_REGEX =                        new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\((\\.{2})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');
const BCV_V_TO_THIS_BOOK_BIBLE_REGEX =               new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})[–-](\\d{1,3})\\]\\((\\.{2})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Genesis 26:12-14](../26/12.md) or [4:11–16](../04/11.md) NOTE en-dash
const THIS_CHAPTER_BIBLE_REGEX =                     new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(?:(\\d{1,3}):)?(\\d{1,3})\\]\\(\\./(\\d{1,3})\\.md\\)', 'g');
const THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX =       new RegExp('\\[(\\d{1,3})\\]\\(\\.{2}/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');// [27](../11/27.md)
const THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX = new RegExp('\\[(\\d{1,3})[–-](\\d{1,3})\\]\\(\\.{2}/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');// [2–7](../09/2.md) NOTE en-dash
const BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX =            new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})[–-](\\d{1,3})\\]\\(\\./(\\d{1,3})\\.md\\)', 'g'); // [Genesis 26:12-14](./12.md) NOTE en-dash

const TN_REGEX =                                     new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\((\\.{2})/(\\d{1,3})/(\\d{1,3})/([a-z][a-z0-9][a-z0-9][a-z0-9])\\)', 'g');


// Caches the path names of files which have been already checked
//  Used for storing paths to TA and TW articles that have already been checked
const checkedArticleStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'CV-checked-path-store',
});

export async function clearCheckedArticleCache() {
    userLog("clearCheckedArticleCache()…");
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
    // debugLog(`markAsChecked(${username}, ${repository}, ${path}, ${branch})…`);
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
    // debugLog(`alreadyChecked(${username}, ${repository}, ${path}, ${branch})…`);
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

    // debugLog(`checkTNLinksToOutside v${TN_LINKS_VALIDATOR_VERSION_STRING} ${bookID} (${fieldName}, (${fieldText.length}) '${fieldText}', ${givenLocation}, …)…`);
    parameterAssert(bookID !== undefined, "checkTNLinksToOutside: 'bookID' parameter should be defined");
    parameterAssert(typeof bookID === 'string', `checkTNLinksToOutside: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    parameterAssert(bookID.length === 3, `checkTNLinksToOutside: 'bookID' parameter should be three characters long not ${bookID.length}`);
    parameterAssert(bookID.toUpperCase() === bookID, `checkTNLinksToOutside: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkTNLinksToOutside: '${bookID}' is not a valid USFM book identifier`);
    parameterAssert(typeof givenC === 'string', `checkTNLinksToOutside: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    parameterAssert(typeof givenV === 'string', `checkTNLinksToOutside: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    parameterAssert(fieldName !== undefined, "checkTNLinksToOutside: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldName === 'string', `checkTNLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    parameterAssert(fieldName === 'OccurrenceNote' || fieldName === 'Annotation', `checkTNLinksToOutside: 'fieldName' parameter should be 'OccurrenceNote' or 'Annotation' not '${fieldName}'`);
    parameterAssert(fieldText !== undefined, "checkTNLinksToOutside: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldText === 'string', `checkTNLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    parameterAssert(givenLocation !== undefined, "checkTNLinksToOutside: 'fieldText' parameter should be defined");
    parameterAssert(typeof givenLocation === 'string', `checkTNLinksToOutside: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);
    parameterAssert(fieldName === 'OccurrenceNote' || fieldName === 'Annotation', `Unexpected checkTNLinksToOutside fieldName='${fieldName}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ctarResult = { noticeList: [], checkedFileCount: 0, checkedFilenames: [], checkedRepoNames: [] };

    function addNoticePartial(noticeObject) {
        // debugLog(`checkTNLinksToOutside Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        parameterAssert(noticeObject.priority !== undefined, "cTNlnk addNoticePartial: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `cTNlnk addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "cTNlnk addNoticePartial: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `cTNlnk addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "cTNlnk addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cTNlnk addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(extract !== undefined, "cTNlnk addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) parameterAssert(typeof noticeObject.extract === 'string', `cTNlnk addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        parameterAssert(noticeObject.location !== undefined, "cTNlnk addNoticePartial: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `cTNlnk addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
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
        // debugLog(`Using default extractLength=${extractLength}`);
    }
    // else
    // debugLog(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // debugLog(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;
    let defaultLanguageCode;
    try { defaultLanguageCode = checkingOptions?.defaultLanguageCode; } catch (trcLCerror) { }
    if (!defaultLanguageCode) defaultLanguageCode = DEFAULT_LANGUAGE_CODE;
    // debugLog("checkTNLinksToOutside defaultLanguageCode", defaultLanguageCode);

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

    // Convert our given C:V strings to integers
    let givenVfirstPart = '';
    for (let i = 0; i < givenV.length; i++) {
        if (/^\d$/.test(givenV[i])) givenVfirstPart += givenV[i];
        else break; // stop at the first non-digit
    }
    let givenCint, givenVint;
    try {
        givenCint = (givenC === 'front') ? 0 : ourParseInt(givenC);
        givenVint = (givenV === 'intro') ? 0 : ourParseInt(givenVfirstPart);
        if (givenVfirstPart !== givenV && givenV !== 'intro') debugLog(`From '${givenC}':'${givenV}' got '${givenC}':'${givenVfirstPart}' then integers ${givenCint}:${givenVint}`);
    } catch (cvError) {
        console.error(`TN Link Check couldn’t parse given chapter and verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName}' via ${givenC}:${givenVfirstPart} got ${givenCint}:${givenVint} with ${cvError}`);
    }

    let regexResultArray;

    // Find total links
    const linksList1 = fieldText.match(GENERAL_LINK1_REGEX) || [];
    // debugLog(`linksList1=${JSON.stringify(linksList1)}`);
    const linksList2 = fieldText.match(GENERAL_LINK2_REGEX) || [];
    const totalLinks1 = linksList1.length;
    const totalLinks2 = linksList2.length;
    let taLinkCount = 0, twLinkCount = 0, thisChapterBibleLinkCount = 0, thisVerseBibleLinkCount = 0, thisBookBibleLinkCount = 0, otherBookBibleLinkCount = 0, TNLinkCount = 0;
    let processedLinkList = [];

    // Check for TA links like [[rc://en/ta/man/translate/figs-metaphor]]
    // debugLog("checkTNLinksToOutside: Search for TA links")
    while ((regexResultArray = TA_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside TA resultArray=${JSON.stringify(regexResultArray)}`);
        taLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 4, `TA_REGEX expected 4 fields (not ${regexResultArray.length})`)
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
        // debugLog(`Got taRepoName=${taRepoName}`);
        const filepath = `${regexResultArray[2]}/${regexResultArray[3]}/01.md`; // Other files are title.md, sub-title.md
        // debugLog(`Got tA filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            // debugLog(`checkTNLinksToOutside: need to check against ${taRepoName}`);
            const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
            let taFileContent, alreadyGaveError = false;
            try {
                taFileContent = await getFile_(taPathParameters);
                // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
            } catch (trcGCerror) {
                // console.error(`checkTNLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                addNoticePartial({ priority: 885, message: `Error loading ${fieldName} TA link`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                alreadyGaveError = true;
            }
            if (!alreadyGaveError) {
                if (!taFileContent)
                    addNoticePartial({ priority: 886, message: `Unable to find ${fieldName} TA link`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}` });
                else if (taFileContent.length < 10)
                    addNoticePartial({ priority: 884, message: `Linked ${fieldName} TA article seems empty`, extract: regexResultArray[0], location: `${ourLocation} ${filepath}` });
                else if (checkingOptions?.checkLinkedTAArticleFlag === true) {
                    // debugLog(`checkTNLinksToOutside got ${checkingOptions?.checkLinkedTAArticleFlag} so checking TA article: ${filepath}`);
                    if (await alreadyChecked(taPathParameters) !== true) {
                        // debugLog(`checkTNLinksToOutside needs to check TA article: ${filepath}`);
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
    }

    // Check for TW links like [[rc://en/tw/dict/bible/other/death]]
    //  (These are not nearly as many as TA links.)
    // debugLog("checkTNLinksToOutside: Search for TW links")
    while ((regexResultArray = TW_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside TW resultArray=${JSON.stringify(regexResultArray)}`);
        twLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 4, `TW_REGEX expected 4 fields (not ${regexResultArray.length})`)
        let languageCode = regexResultArray[1];
        if (!languageCode || languageCode === '*') languageCode = defaultLanguageCode;
        const twRepoName = `${languageCode}_tw`;
        // debugLog(`Got twRepoName=${twRepoName}`);
        const filepath = `bible/${regexResultArray[2]}/${regexResultArray[3]}.md`; // Other files are title.md, sub-title.md
        // debugLog(`Got tW filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            // debugLog(`Need to check against ${twRepoName}`);
            const twPathParameters = { username: twRepoUsername, repository: twRepoName, path: filepath, branch: twRepoBranch };
            let twFileContent;
            try {
                twFileContent = await getFile_(twPathParameters);
                // debugLog("Fetched fileContent for", twRepoName, filepath, typeof fileContent, fileContent.length);
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
                    // debugLog(`checkTNLinksToOutside got ${checkingOptions?.checkLinkedTWArticleFlag} so checking TW article: ${filepath}`);
                    if (await alreadyChecked(twPathParameters) !== true) {
                        // debugLog(`checkTNLinksToOutside needs to check TW article: ${filepath}`);
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

    // debugLog("checkTNLinksToOutside: Search for Bible links")

    // Check for this-chapter Bible links like [Revelation 3:11](./11.md)
    while ((regexResultArray = THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside THIS_CHAPTER_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        thisChapterBibleLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 6, `THIS_CHAPTER_BIBLE_REGEX expected 6 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, V2] = regexResultArray;

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = bookID;

        const linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== givenCint)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${givenCint}`, extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check1 couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${linkVerseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check1 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), givenCint);
            } catch (tlcNVerror) { }
            if (!givenCint || givenCint < 1 || givenCint > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${givenCint} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${givenCint}:${linkVerseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check for this-verse Bible links like [11](../03/11.md)
    while ((regexResultArray = THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside THIS_VERSE_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        thisVerseBibleLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 4, `THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX expected 4 fields (not ${regexResultArray.length})`);
        let [totalLink, V1, C2, V2] = regexResultArray;

        let linkBookCode = bookID;

        let linkChapterInt, linkVerseInt;
        try {
            linkChapterInt = ourParseInt(C2);
            linkVerseInt = ourParseInt(V2);
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${V2}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check1 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} ${V1} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check for this-verse Bible links like [11](../03/11.md)
    while ((regexResultArray = THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside THIS_VERSE_RANGE_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        thisVerseBibleLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 5, `THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX expected 5 fields (not ${regexResultArray.length})`);
        let [totalLink, V1a, V1b, C2, V2] = regexResultArray;

        let linkBookCode = bookID;

        let verseInt1a, verseInt1b, linkChapterInt, linkVerseInt;
        try {
            verseInt1a = ourParseInt(V1a);
            verseInt1b = ourParseInt(V1b);
            linkChapterInt = ourParseInt(C2);
            linkVerseInt = ourParseInt(V2);
            if (verseInt1a !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1a} vs ${V2}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check1 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} ${V1a} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }
        if (verseInt1b <= verseInt1a)
            addNoticePartial({ priority: 741, message: "Verse numbers of markdown Bible link range out of order", details: `${V1a} to ${V1b}`, extract: totalLink, location: ourLocation });

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11](../03/11.md)
    while ((regexResultArray = THIS_BOOK_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside THIS_BOOK_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        thisBookBibleLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 8, `THIS_BOOK_BIBLE_REGEX expected 8 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2] = regexResultArray;

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${linkChapterInt}`, extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check2 couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${linkVerseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11-12](../03/11.md)
    while ((regexResultArray = BCV_V_TO_THIS_BOOK_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside THIS_BOOK_RANGE_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        thisBookBibleLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 9, `BCV_V_TO_THIS_BOOK_BIBLE_REGEX expected 9 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1a, V1b, B2, C2, V2] = regexResultArray;

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${linkChapterInt}`, extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check2b couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1a) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1a} vs ${linkVerseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2b couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }
        try {
            if (ourParseInt(V1b) <= ourParseInt(V1a))
                addNoticePartial({ priority: 741, message: "Verse numbers of markdown Bible link range out of order", details: `${V1a} to ${V1b}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2b couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11-12](../03/11.md)
    while ((regexResultArray = BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        thisChapterBibleLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 7, `BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX expected 7 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1a, V1b, V2] = regexResultArray;

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = bookID;

        const linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(V1a) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1a} vs ${linkVerseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2c couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V2} from '${fieldText}': ${vvError}`);
        }
        try {
            if (ourParseInt(V1b) <= ourParseInt(V1a))
                addNoticePartial({ priority: 741, message: "Verse numbers of markdown Bible link range out of order", details: `${V1a} to ${V1b}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2c couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V2} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            // try {
            //     numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            // } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), givenC);
            } catch (tlcNVerror) { }
            if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${givenC}:${linkVerseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check for other book Bible links like [Revelation 3:11](../03/11.md)
    while ((regexResultArray = OTHER_BOOK_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside OTHER_BOOK_BIBLE_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        otherBookBibleLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 8, `OTHER_BOOK_BIBLE_REGEX expected 8 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2] = regexResultArray;

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${linkChapterInt}`, extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check3 couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${linkVerseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check3 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }
    }

    // Check for TN links like [Titus 3:11](../03/11/zd2d)
    while ((regexResultArray = TN_REGEX.exec(fieldText))) {
        // debugLog(`  checkTNLinksToOutside TN_REGEX regexResultArray=${JSON.stringify(regexResultArray)}`);
        TNLinkCount += 1;
        processedLinkList.push(regexResultArray[0]); // Save the full link
        parameterAssert(regexResultArray.length === 9, `TN_REGEX expected 9 fields (not ${regexResultArray.length})`);
        // eslint-disable-next-line no-unused-vars
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2, _noteID2] = regexResultArray;

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 144, message: "Unknown Bible book name in TN link", details: totalLink, extract: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown TN link don’t match", details: `${C1} vs ${linkChapterInt}`, extract: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check3 couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 752, message: "Verse numbers of markdown TN link don’t match", details: `${V1} vs ${linkVerseInt}`, extract: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check3 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', "Shouldn’t happen in tn-links-check");
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 656, message: "Bad chapter number in markdown TN link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, extract: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 654, message: "Bad verse number in markdown TN link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, extract: totalLink, location: ourLocation });
        }

        // TODO: We should see if we can find the correct note
    }

    // Check for additional links that we can’t explain
    const BibleLinkCount = thisChapterBibleLinkCount + thisVerseBibleLinkCount + thisBookBibleLinkCount + otherBookBibleLinkCount + TNLinkCount;
    if (totalLinks1 > BibleLinkCount) {
        const leftoverLinksList1 = linksList1.filter(x => !processedLinkList.includes(x)); // Delete links that we processed above
        if (leftoverLinksList1.length > 0) debugLog(`processedLinkList (${processedLinkList.length})=${JSON.stringify(processedLinkList)}\n       linksList1(${linksList1.length})=${JSON.stringify(linksList1)}\nleftoverLinksList1(${leftoverLinksList1.length})=${JSON.stringify(leftoverLinksList1)}`);
        addNoticePartial({ priority: 648, message: "Unusual [ ]( ) link(s)—not normal Bible or TN links", details: `need to carefully check ${JSON.stringify(leftoverLinksList1)}`, location: ourLocation });
    }
    const twaLinkCount = twLinkCount + taLinkCount;
    if (totalLinks2 > twaLinkCount) {
        const leftoverLinksList2 = linksList2.filter(x => !processedLinkList.includes(x)); // Delete links that we processed above
        if (leftoverLinksList2.length > 0) debugLog(`processedLinkList (${processedLinkList.length})=${JSON.stringify(processedLinkList)}\n       linksList2(${linksList2.length})=${JSON.stringify(linksList2)}\nleftoverLinksList2(${leftoverLinksList2.length})=${JSON.stringify(leftoverLinksList2)}`);
        addNoticePartial({ priority: 649, message: "Unusual [[ ]] link(s)—not normal TA or TW links", details: `need to carefully check ${JSON.stringify(leftoverLinksList2)}`, location: ourLocation });
    }

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


    // debugLog(`checkTNLinksToOutside is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkTNLinksToOutside function
