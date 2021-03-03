import localforage from 'localforage';
import Path from 'path';
import * as books from '../core/books/books';
import { DEFAULT_EXCERPT_LENGTH, countOccurrences } from './text-handling-functions'
import { cachedGetFile, cachedGetFileUsingFullURL, checkMarkdownText } from '../core';
// eslint-disable-next-line no-unused-vars
import { userLog, debugLog, functionLog, parameterAssert, logicAssert, dataAssert, ourParseInt } from './utilities';
// import { consoleLogObject } from '../core/utilities';


// const NOTES_LINKS_VALIDATOR_VERSION_STRING = '0.7.14';

// const DEFAULT_LANGUAGE_CODE = 'en';
const DEFAULT_BRANCH = 'master';

const GENERAL_MARKDOWN_LINK1_REGEX = new RegExp('\\[[^\\]]+?\\]\\([^\\)]+?\\)', 'g'); // [displayLink](URL)
const GENERAL_MARKDOWN_LINK2_REGEX = new RegExp('\\[\\[[^\\]]+?\\]\\]', 'g'); // [[combinedDisplayLink]]

const TA_DOUBLE_BRACKETED_LINK_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/ta/man/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g'); // Enclosed in [[  ]]
const TA_FULL_DISPLAY_LINK_REGEX = new RegExp('\\[([^\\]]+?)\\]\\(rc://([^ /]+?)/ta/man/([^ /]+?)/([^ \\]]+?)\\)', 'g'); // [How to Translate Names](rc://en/ta/man/translate/translate-names)
const TA_RELATIVE_DISPLAY_LINK_REGEX = new RegExp('\\[([^\\]]+?)\\]\\(\\.{2}/([^ /\\]]+?)/01\\.md\\)', 'g'); // [Borrow Words](../translate-transliterate/01.md)

const TW_DOUBLE_BRACKETED_LINK_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/([^ /\\]]+?)\\]\\]', 'g'); // Enclosed in [[  ]]
const TWL_RAW_LINK_REGEX = new RegExp('rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/(.+)', 'g'); // Just a raw link
const TW_INTERNAL_REGEX = new RegExp('\\[([A-za-z ()]+?)\\]\\(\\.{2}/([a-z]{2,5})/([-A-Za-z\\d]{2,20})\\.md\\)', 'g');// [Asher](../names/asher.md)

// TODO: Do we need to normalise Bible links, i.e., make sure that the link itself
//          (we don't care about the displayed text) doesn't specify superfluous levels/information
// TODO: We need a decision on hyphen vs en-dash in verse references
// TODO: Test to see if "[2:23](../02/03.md)" is found by more than one regex below
const BIBLE_REGEX_OTHER_BOOK_ABSOLUTE = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\(([123a-z]{3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Revelation 3:11](rev/03/11.md)
const BIBLE_REGEX_OTHER_BOOK_RELATIVE = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\(\\.{2}/\\.{2}/([123a-z]{3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Revelation 3:11](../../rev/03/11.md)
const BIBLE_REGEX_THIS_BOOK_RELATIVE = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\(\\.{2}/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Revelation 3:11](../03/11.md)
const BCV_V_TO_THIS_BOOK_BIBLE_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})[–-](\\d{1,3})\\]\\((\\.{2})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Genesis 26:12-14](../26/12.md) or [4:11–16](../04/11.md) NOTE en-dash
const BIBLE_REGEX_THIS_CHAPTER_RELATIVE = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(?:(\\d{1,3}):)?(\\d{1,3})\\]\\(\\./(\\d{1,3})\\.md\\)', 'g');
const THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX = new RegExp('\\[(\\d{1,3})\\]\\(\\.{2}/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');// [27](../11/27.md)
const THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX = new RegExp('\\[(\\d{1,3})[–-](\\d{1,3})\\]\\(\\.{2}/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');// [2–7](../09/2.md) NOTE en-dash
const BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})[–-](\\d{1,3})\\]\\(\\./(\\d{1,3})\\.md\\)', 'g'); // [Genesis 26:12-14](./12.md) NOTE en-dash

const BIBLE_FULL_HELP_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})(?:-\\d{1,3})?\\]\\(rc://([^ /]+?)/tn/help/([123a-z]{3})/(\\d{1,3})/(\\d{1,3})\\)', 'g'); // [Genesis 29:23-24](rc://en/tn/help/gen/29/23)

const TN_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:\\w+? )?)(\\d{1,3}):(\\d{1,3})\\]\\((\\.{2})/(\\d{1,3})/(\\d{1,3})/([a-z][a-z0-9][a-z0-9][a-z0-9])\\)', 'g');

const SIMPLE_DISPLAY_LINK_REGEX = new RegExp('\\[([^\\]]+?)\\]\\((https?://[^\\)]+?)\\)', 'g');// [ULT](https://something)

const SIMPLE_IMAGE_REGEX = new RegExp('!\\[([^\\]]*?)\\]\\(([^ "\\)]+?)\\)', 'g'); // ![alt](y)
const TITLED_IMAGE_REGEX = new RegExp('!\\[([^\\]]*?)\\]\\(([^ \\)]+?) "([^"\\)]+?)"\\)', 'g'); // ![alt](link "title")


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
 * @param {string} languageCode, e.g., 'en'
 * @param {string} repoCode, e.g., 'TN', 'SN', 'TN2', or even 'TWL'
 * @param {string} bookID
 * @param {string} fieldName, e.g., 'TWLink' or 'OccurrenceNote' or 'Note' or .md filename, etc.
 * @param {string} fieldText
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkNotesLinksToOutside(languageCode, repoCode, bookID, givenC, givenV, fieldName, fieldText, givenLocation, checkingOptions) {
    /* This is for the case of the OccurrenceNote or Note field containing markdown links

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
    //      checkingOptions?.disableLinkedTAArticlesCheckFlag

    // We attempt to fetch any TW links to test that the destination is really there
    //  -- you can control this with:
    //      checkingOptions.twRepoUsername
    //      checkingOptions.twRepoBranch (or tag)
    //      checkingOptions.disableLinkedTWArticlesCheckFlag
    */

    // if (fieldText.indexOf('brother') !== -1)
    // functionLog(`checkNotesLinksToOutside('${languageCode}', '${repoCode}', ${bookID} ${givenC}:${givenV} '${fieldName}', (${fieldText.length})'${fieldText}', ${givenLocation}, ${JSON.stringify(checkingOptions)})…`);
    parameterAssert(languageCode !== undefined, "checkNotesLinksToOutside: 'languageCode' parameter should be defined");
    parameterAssert(typeof languageCode === 'string', `checkNotesLinksToOutside: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    parameterAssert(repoCode !== undefined, "checkNotesLinksToOutside: 'repoCode' parameter should be defined");
    parameterAssert(typeof repoCode === 'string', `checkNotesLinksToOutside: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    parameterAssert(bookID !== undefined, "checkNotesLinksToOutside: 'bookID' parameter should be defined");
    parameterAssert(typeof bookID === 'string', `checkNotesLinksToOutside: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    parameterAssert(typeof givenC === 'string', `checkNotesLinksToOutside: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    parameterAssert(typeof givenV === 'string', `checkNotesLinksToOutside: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    // if (fieldName !== 'MDFile') {
    //     parameterAssert(bookID.length === 3, `checkNotesLinksToOutside: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //     parameterAssert(bookID.toUpperCase() === bookID, `checkNotesLinksToOutside: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //     parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkNotesLinksToOutside: '${bookID}' is not a valid USFM book identifier`);
    // }
    parameterAssert(fieldName !== undefined, "checkNotesLinksToOutside: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldName === 'string', `checkNotesLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    // parameterAssert(fieldName === 'OccurrenceNote' || fieldName === 'Note' || fieldName === 'TWLink', `checkNotesLinksToOutside: 'fieldName' parameter should be 'OccurrenceNote' or 'Note' or 'TWLink' not '${fieldName}'`);
    parameterAssert(fieldText !== undefined, "checkNotesLinksToOutside: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldText === 'string', `checkNotesLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    parameterAssert(givenLocation !== undefined, "checkNotesLinksToOutside: 'fieldText' parameter should be defined");
    parameterAssert(typeof givenLocation === 'string', `checkNotesLinksToOutside: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ctarResult = { noticeList: [], checkedFileCount: 0, checkedFilenames: [], checkedRepoNames: [] };

    function addNoticePartial(noticeObject) {
        // functionLog(`checkNotesLinksToOutside Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        parameterAssert(noticeObject.priority !== undefined, "cTNlnk addNoticePartial: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `cTNlnk addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "cTNlnk addNoticePartial: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `cTNlnk addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "cTNlnk addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cTNlnk addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(excerpt !== undefined, "cTNlnk addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) parameterAssert(typeof noticeObject.excerpt === 'string', `cTNlnk addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        parameterAssert(noticeObject.location !== undefined, "cTNlnk addNoticePartial: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `cTNlnk addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        // noticeObject.debugChain = noticeObject.debugChain ? `checkNotesLinksToOutside ${noticeObject.debugChain}` : `checkNotesLinksToOutside(${fieldName})`;
        ctarResult.noticeList.push({ ...noticeObject, bookID, fieldName });
    }


    // Main code for checkNotesLinksToOutside
    // Get any options that were suppplied, or else set default values
    let excerptLength = checkingOptions?.excerptLength;
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;
    let defaultLanguageCode = checkingOptions?.defaultLanguageCode;
    // if (!defaultLanguageCode) defaultLanguageCode = DEFAULT_LANGUAGE_CODE;
    if (!defaultLanguageCode) defaultLanguageCode = languageCode;
    // debugLog("checkNotesLinksToOutside defaultLanguageCode", defaultLanguageCode);

    let taRepoUsername = checkingOptions?.taRepoUsername;
    if (!taRepoUsername) taRepoUsername = defaultLanguageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog';
    let taRepoBranch = checkingOptions?.taRepoBranch;
    if (!taRepoBranch) taRepoBranch = DEFAULT_BRANCH;
    let twRepoUsername = checkingOptions?.twRepoUsername;
    if (!twRepoUsername) twRepoUsername = defaultLanguageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog';
    let twRepoBranch = checkingOptions?.twRepoBranch;
    if (!twRepoBranch) twRepoBranch = DEFAULT_BRANCH;

    // Convert our given C:V strings to integers
    let givenVfirstPart = '';
    for (let i = 0; i < givenV.length; i++) {
        if (/^\d$/.test(givenV[i])) givenVfirstPart += givenV[i];
        else break; // stop at the first non-digit
    }
    let givenCint, givenVint;
    if (givenC && givenV) {
        try {
            givenCint = (givenC === 'front') ? 0 : ourParseInt(givenC);
            givenVint = (givenV === 'intro') ? 0 : ourParseInt(givenVfirstPart);
            if (givenVfirstPart !== givenV && givenV !== 'intro') debugLog(`From '${givenC}':'${givenV}' got '${givenC}':'${givenVfirstPart}' then integers ${givenCint}:${givenVint}`);
        } catch (cvError) {
            console.error(`TN Link Check couldn’t parse given chapter and verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName}' via ${givenC}:${givenVfirstPart} got ${givenCint}:${givenVint} with ${cvError}`);
        }
    }

    let regexResultArray;

    // Check for image links
    while ((regexResultArray = SIMPLE_IMAGE_REGEX.exec(fieldText))) {
        // debugLog(`Got markdown image in line ${lineNumber}:`, JSON.stringify(regexResultArray));
        const [totalLink, altText, fetchLink] = regexResultArray;
        // if (altText !== 'OBS Image') userLog("This code was only checked for 'OBS Image' links");
        if (!altText)
            addNoticePartial({ priority: 349, message: "Markdown image link has no alternative text", excerpt: totalLink, location: ourLocation });
        if (!fetchLink.startsWith('https://'))
            addNoticePartial({ priority: 749, message: "Markdown image link seems faulty", excerpt: fetchLink, location: ourLocation });
        else if (checkingOptions?.disableAllLinkFetchingFlag !== true) {
            // debugLog(`Need to check existence of ${fetchLink}`);
            try {
                const responseData = await cachedGetFileUsingFullURL({ uri: fetchLink });
                dataAssert(responseData.length > 10, `Expected ${fetchLink} image file to be longer: ${responseData.length}`);
                // debugLog("Markdown link fetch got response: ", responseData.length);
            } catch (flError) {
                console.error(`Markdown image link fetch had an error fetching '${fetchLink}': ${flError}`);
                addNoticePartial({ priority: 748, message: "Error fetching markdown image link", excerpt: fetchLink, location: ourLocation });
            }
        }
    }
    while ((regexResultArray = TITLED_IMAGE_REGEX.exec(fieldText))) {
        // debugLog(`Got markdown image in line ${lineNumber}:`, JSON.stringify(regexResultArray));
        const [totalLink, alt, fetchLink, title] = regexResultArray;
        if (!alt)
            addNoticePartial({ priority: 349, message: "Markdown image link has no alternative text", excerpt: totalLink, location: ourLocation });
        if (!title)
            addNoticePartial({ priority: 348, message: "Markdown image link has no title text", excerpt: totalLink, location: ourLocation });
        if (!fetchLink.startsWith('https://'))
            addNoticePartial({ priority: 749, message: "Markdown image link seems faulty", excerpt: fetchLink, location: ourLocation });
        else if (checkingOptions?.disableAllLinkFetchingFlag !== true) {
            // debugLog(`Need to check existence of ${fetchLink}`);
            try {
                const responseData = await cachedGetFileUsingFullURL({ uri: fetchLink });
                dataAssert(responseData.length > 10, `Expected ${fetchLink} image file to be longer: ${responseData.length}`);
                // debugLog("Markdown link fetch got response: ", responseData.length);
            } catch (flError) {
                console.error(`Markdown image link fetch had an error fetching '${fetchLink}': ${flError}`);
                addNoticePartial({ priority: 748, message: "Error fetching markdown image link", excerpt: fetchLink, location: ourLocation });
            }
        }
    }

    // Find total regular (non-image) links
    const linksList1 = fieldText.match(GENERAL_MARKDOWN_LINK1_REGEX) || []; // [[something]]
    // if (linksList1.length) debugLog(`linksList1 (${linksList1.length}) = ${JSON.stringify(linksList1)}`);
    const linksList2 = fieldText.match(GENERAL_MARKDOWN_LINK2_REGEX) || []; // [display](link)
    // if (linksList2.length) debugLog(`linksList2 (${linksList2.length}) = ${JSON.stringify(linksList2)}`);
    const totalLinks1 = linksList1.length;
    const totalLinks2 = linksList2.length;
    let taLinkCount1 = 0, taLinkCount2 = 0, twLinkCount1 = 0, twLinkCount2 = 0, TNLinkCount1 = 0,
        thisChapterBibleLinkCount1 = 0, thisVerseBibleLinkCount1 = 0, thisBookBibleLinkCount1 = 0, otherBookBibleLinkCount1 = 0,
        generalLinkCount1 = 0;
    let processedLinkList = [];

    // Check for internal TW links like [Asher](../names/asher.md)
    while ((regexResultArray = TW_INTERNAL_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TW_INTERNAL_REGEX regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        twLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 4, `TW_INTERNAL_REGEX expected 4 fields (not ${regexResultArray.length})`);
        // eslint-disable-next-line no-unused-vars
        let [totalLink, _displayName, category, article] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        const twRepoName = `${languageCode}_tw`;
        // debugLog(`Got twRepoName=${twRepoName}`);
        const filepath = `bible/${category}/${article}.md`;
        // debugLog(`Got tW filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            // if (regexResultArray[3] === 'brother') debugLog(`Need to check ${fieldName} TW link ${regexResultArray} against ${twRepoName}`);
            const twPathParameters = { username: twRepoUsername, repository: twRepoName, path: filepath, branch: twRepoBranch };
            let twFileContent;
            try {
                twFileContent = await getFile_(twPathParameters);
                // if (regexResultArray[3] === 'brother') debugLog(`Fetched fileContent for ${JSON.stringify(twPathParameters)}: ${typeof twFileContent} ${twFileContent.length}`);
            } catch (trcGCerror) {
                console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TW`, twRepoUsername, twRepoName, filepath, twRepoBranch, trcGCerror.message);
                addNoticePartial({ priority: 882, message: `Error loading ${fieldName} TW link`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
            }
            if (!twFileContent)
                addNoticePartial({ priority: 883, message: `Unable to find/load ${fieldName} TW link`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
            else { // we got the content of the TW article
                if (twFileContent.length < 10)
                    addNoticePartial({ priority: 881, message: `Linked ${fieldName} TW article seems empty`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                // THIS IS DISABLED COZ IT CAN GIVE AN INFINITE LOOP !!!
                // else if (checkingOptions?.disableLinkedTWArticlesCheckFlag !== true) {
                //     // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTWArticlesCheckFlag} so checking TW article: ${filepath}`);
                //     if (await alreadyChecked(twPathParameters) !== true) {
                //         // functionLog(`checkNotesLinksToOutside needs to check TW article: ${filepath}`);
                //         const checkTWFileResult = await checkMarkdownText(languageCode, repoCode, `TW ${regexResultArray[3]}.md`, twFileContent, ourLocation, checkingOptions);
                //         for (const noticeObject of checkTWFileResult.noticeList)
                //             ctarResult.noticeList.push({ ...noticeObject, username: twRepoUsername, repoCode: 'TW', repoName: twRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TW' });
                //         ctarResult.checkedFileCount += 1;
                //         ctarResult.checkedFilenames.push(`${regexResultArray[3]}.md`);
                //         ctarResult.checkedFilesizes = twFileContent.length;
                //         ctarResult.checkedFilenameExtensions = ['md'];
                //         ctarResult.checkedRepoNames.push(twRepoName);
                //         markAsChecked(twPathParameters); // don’t bother waiting for the result
                //     }
                // }
                // else debugLog("disableLinkedTWArticlesCheckFlag is set to TRUE!");
            }
        }
        else debugLog("disableAllLinkFetchingFlag is set to TRUE!");
    }

    // Check for TA links like [How to Translate Names](rc://en/ta/man/translate/translate-names)
    while ((regexResultArray = TA_FULL_DISPLAY_LINK_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TA_FULL_DISPLAY_LINK_REGEX resultArray=${JSON.stringify(regexResultArray)}`);
        taLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 5, `TA_FULL_DISPLAY_LINK_REGEX expected 5 fields (not ${regexResultArray.length})`)
        // eslint-disable-next-line no-unused-vars
        let [totalLink, _displayName, foundLanguageCode, part, article] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (foundLanguageCode !== '*') {
            const characterIndex = TA_FULL_DISPLAY_LINK_REGEX.lastIndex - totalLink.length + 7; // lastIndex points to the end of the field that was found
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 450, message: "Resource container link should have '*' language code", details: `not '${foundLanguageCode}'`, characterIndex, excerpt, location: ourLocation });
        } else if (repoCode === 'TN') { // but not TN2
            // At the moment, tC can’t handle these links with * so we have to ensure that they're not there
            const characterIndex = TA_FULL_DISPLAY_LINK_REGEX.lastIndex - totalLink.length + 7; // lastIndex points to the end of the field that was found
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 950, message: "tC cannot yet process '*' language code", characterIndex, excerpt, location: ourLocation });
        }
        if (!foundLanguageCode || foundLanguageCode === '*') foundLanguageCode = defaultLanguageCode;
        const taRepoName = `${foundLanguageCode}_ta`;
        // debugLog(`Got taRepoName=${taRepoName}`);
        const filepath = `${part}/${article}/01.md`; // Other files are title.md, sub-title.md
        // debugLog(`Got tA filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            // functionLog(`checkNotesLinksToOutside: need to check against ${taRepoName}`);
            const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
            let taFileContent, alreadyGaveError = false;
            try {
                taFileContent = await getFile_(taPathParameters);
                // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
            } catch (trcGCerror) {
                // console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                addNoticePartial({ priority: 885, message: `Error loading ${fieldName} linked TA article`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                alreadyGaveError = true;
            }
            if (!alreadyGaveError) {
                if (!taFileContent)
                    addNoticePartial({ priority: 886, message: `Unable to find ${fieldName} linked TA article`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                else if (taFileContent.length < 10)
                    addNoticePartial({ priority: 884, message: `Linked ${fieldName} TA article seems empty`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                else if (checkingOptions?.disableLinkedTAArticlesCheckFlag !== true) {
                    // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTAArticlesCheckFlag} so checking TA article: ${filepath}`);
                    if (await alreadyChecked(taPathParameters) !== true) {
                        // functionLog(`checkNotesLinksToOutside needs to check TA article: ${filepath}`);
                        const checkTAFileResult = await checkMarkdownText(foundLanguageCode, repoCode, `TA ${regexResultArray[3]}.md`, taFileContent, ourLocation, checkingOptions);
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

    if (fieldName.startsWith('TA ')) {
        // Check for relative TA links like [Borrow Words](../translate-transliterate/01.md)
        while ((regexResultArray = TA_RELATIVE_DISPLAY_LINK_REGEX.exec(fieldText))) {
            // debugLog(`  checkNotesLinksToOutside TA_RELATIVE_DISPLAY_LINK_REGEX resultArray=${JSON.stringify(regexResultArray)}`);
            taLinkCount1 += 1;
            parameterAssert(regexResultArray.length === 3, `TA_RELATIVE_DISPLAY_LINK_REGEX expected 3 fields (not ${regexResultArray.length})`)
            // eslint-disable-next-line no-unused-vars
            let [totalLink, _displayName, article] = regexResultArray;
            processedLinkList.push(totalLink); // Save the full link

            const taRepoName = `${languageCode}_ta`;
            // debugLog(`Got taRepoName=${taRepoName}`);
            const filepath = `translate/${article}/01.md`; // Other files are title.md, sub-title.md
            // debugLog(`Got tA filepath=${filepath}`);

            if (!checkingOptions?.disableAllLinkFetchingFlag) {
                // functionLog(`checkNotesLinksToOutside: need to check against ${taRepoName}`);
                const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
                let taFileContent, alreadyGaveError = false;
                try {
                    taFileContent = await getFile_(taPathParameters);
                    // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
                } catch (trcGCerror) {
                    // console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                    addNoticePartial({ priority: 885, message: `Error loading ${fieldName} linked TA article`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                    alreadyGaveError = true;
                }
                if (!alreadyGaveError) {
                    if (!taFileContent)
                        addNoticePartial({ priority: 886, message: `Unable to find ${fieldName} linked TA article`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                    else if (taFileContent.length < 10)
                        addNoticePartial({ priority: 884, message: `Linked ${fieldName} TA article seems empty`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                    // Don't do this or it gets infinite recursion!!!
                    // else if (checkingOptions?.disableLinkedTAArticlesCheckFlag !== true) {
                    //     // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTAArticlesCheckFlag} so checking TA article: ${filepath}`);
                    //     if (await alreadyChecked(taPathParameters) !== true) {
                    //         // functionLog(`checkNotesLinksToOutside needs to check TA article: ${filepath}`);
                    //         const checkTAFileResult = await checkMarkdownText(languageCode, repoCode, `TA ${regexResultArray[3]}.md`, taFileContent, ourLocation, checkingOptions);
                    //         for (const noticeObject of checkTAFileResult.noticeList)
                    //             ctarResult.noticeList.push({ ...noticeObject, username: taRepoUsername, repoCode: 'TA', repoName: taRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TA' });
                    //         ctarResult.checkedFileCount += 1;
                    //         ctarResult.checkedFilenames.push(`${regexResultArray[3]}.md`);
                    //         ctarResult.checkedFilesizes = taFileContent.length;
                    //         ctarResult.checkedFilenameExtensions = ['md'];
                    //         ctarResult.checkedRepoNames.push(taRepoName);
                    //         markAsChecked(taPathParameters); // don’t bother waiting for the result
                    //     }
                    // }
                }
            }
        }
    }

    // Check for TA links like [[rc://en/ta/man/translate/figs-metaphor]]
    // if (fieldText.indexOf('brother') !== -1) debugLog("checkNotesLinksToOutside: Search for TA links")
    while ((regexResultArray = TA_DOUBLE_BRACKETED_LINK_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TA_DOUBLE_BRACKETED_LINK_REGEX resultArray=${JSON.stringify(regexResultArray)}`);
        taLinkCount2 += 1;
        parameterAssert(regexResultArray.length === 4, `TA_DOUBLE_BRACKETED_LINK_REGEX expected 4 fields (not ${regexResultArray.length})`)
        let [totalLink, foundLanguageCode, part, article] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (foundLanguageCode !== '*') {
            const characterIndex = TA_DOUBLE_BRACKETED_LINK_REGEX.lastIndex - totalLink.length + 7; // lastIndex points to the end of the field that was found
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 450, message: "Resource container link should have '*' language code", details: `not '${foundLanguageCode}'`, characterIndex, excerpt, location: ourLocation });
        } else if (repoCode === 'TN') { // but not TN2
            // At the moment, tC can’t handle these links with * so we have to ensure that they're not there
            const characterIndex = TA_DOUBLE_BRACKETED_LINK_REGEX.lastIndex - totalLink.length + 7; // lastIndex points to the end of the field that was found
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 950, message: "tC cannot yet process '*' language code", characterIndex, excerpt, location: ourLocation });
        }
        if (!foundLanguageCode || foundLanguageCode === '*') foundLanguageCode = defaultLanguageCode;
        const taRepoName = `${foundLanguageCode}_ta`;
        // debugLog(`Got taRepoName=${taRepoName}`);
        const filepath = `${part}/${article}/01.md`; // Other files are title.md, sub-title.md
        // debugLog(`Got tA filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            // functionLog(`checkNotesLinksToOutside: need to check against ${taRepoName}`);
            const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
            let taFileContent, alreadyGaveError = false;
            try {
                taFileContent = await getFile_(taPathParameters);
                // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
            } catch (trcGCerror) {
                // console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                addNoticePartial({ priority: 885, message: `Error loading ${fieldName} linked TA article`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                alreadyGaveError = true;
            }
            if (!alreadyGaveError) {
                if (!taFileContent)
                    addNoticePartial({ priority: 886, message: `Unable to find ${fieldName} linked TA article`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                else if (taFileContent.length < 10)
                    addNoticePartial({ priority: 884, message: `Linked ${fieldName} TA article seems empty`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                else if (checkingOptions?.disableLinkedTAArticlesCheckFlag !== true) {
                    // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTAArticlesCheckFlag} so checking TA article: ${filepath}`);
                    if (await alreadyChecked(taPathParameters) !== true) {
                        // functionLog(`checkNotesLinksToOutside needs to check TA article: ${filepath}`);
                        const checkTAFileResult = await checkMarkdownText(foundLanguageCode, repoCode, `TA ${regexResultArray[3]}.md`, taFileContent, ourLocation, checkingOptions);
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

    // Check for external TW links like [[rc://en/tw/dict/bible/other/death]] in TN or rc://en/tw/dict/bible/other/death in TWLinks
    //  (These are not nearly as many as TA links.)
    const ourTWRegex = (fieldName === 'TWLink') ? TWL_RAW_LINK_REGEX : TW_DOUBLE_BRACKETED_LINK_REGEX;
    // if (fieldText.indexOf('brother') !== -1) debugLog(`checkNotesLinksToOutside: ${bookID} ${givenC}:${givenV} Search for TW links with ${ourTWRegex}`)
    while ((regexResultArray = ourTWRegex.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside ${languageCode} ${repoCode} ${fieldName} ${givenC}:${givenV} found TW resultArray=${JSON.stringify(regexResultArray)}`);
        twLinkCount2 += 1;
        parameterAssert(regexResultArray.length === 4, `TW_REGEX expected 4 fields (not ${regexResultArray.length})`)
        let [totalLink, foundLanguageCode, category, article] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (!foundLanguageCode || foundLanguageCode === '*') foundLanguageCode = defaultLanguageCode;
        const twRepoName = `${foundLanguageCode}_tw`;
        // debugLog(`Got twRepoName=${twRepoName}`);
        const filepath = `bible/${category}/${article}.md`;
        // debugLog(`Got tW filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            // if (article === 'brother') debugLog(`Need to check ${fieldName} TW link ${regexResultArray} against ${twRepoName}`);
            const twPathParameters = { username: twRepoUsername, repository: twRepoName, path: filepath, branch: twRepoBranch };
            let twFileContent;
            try {
                twFileContent = await getFile_(twPathParameters);
                // if (article === 'brother') debugLog(`Fetched fileContent for ${JSON.stringify(twPathParameters)}: ${typeof twFileContent} ${twFileContent.length}`);
            } catch (trcGCerror) {
                console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TW`, twRepoUsername, twRepoName, filepath, twRepoBranch, trcGCerror.message);
                addNoticePartial({ priority: 882, message: `Error loading ${fieldName} TW link`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
            }
            if (!twFileContent)
                addNoticePartial({ priority: 883, message: `Unable to find/load ${fieldName} TW link`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
            else { // we got the content of the TW article
                if (twFileContent.length < 10)
                    addNoticePartial({ priority: 881, message: `Linked ${fieldName} TW article seems empty`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                else if (checkingOptions?.disableLinkedTWArticlesCheckFlag !== true) {
                    // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTWArticlesCheckFlag} so checking TW article: ${filepath}`);
                    if (await alreadyChecked(twPathParameters) !== true) {
                        // functionLog(`checkNotesLinksToOutside needs to check TW article: ${filepath}`);
                        const checkTWFileResult = await checkMarkdownText(foundLanguageCode, repoCode, `TW ${regexResultArray[3]}.md`, twFileContent, ourLocation, checkingOptions);
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
                else debugLog("disableLinkedTWArticlesCheckFlag is set to TRUE!");
            }
        }
        else debugLog("disableAllLinkFetchingFlag is set to TRUE!");
    }

    // debugLog("checkNotesLinksToOutside: Search for Bible links")
    // Check for other book Bible links like [Genesis 29:23](rc://en/tn/help/gen/29/23)
    while ((regexResultArray = BIBLE_FULL_HELP_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_FULL_HELP_REGEX regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        otherBookBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 9, `BIBLE_FULL_HELP_REGEX expected 9 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, Lg, B2, C2, V2] = regexResultArray;
        // debugLog(`Lg='${Lg}' B2='${B2}' C2='${C2}' V2='${V2}'`);
        processedLinkList.push(totalLink); // Save the full link

        if (Lg !== '*' && Lg !== languageCode)
            addNoticePartial({ priority: 669, message: "Unexpected language code in link", details: `resource language code is '${languageCode}'`, excerpt: Lg, location: ourLocation });

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${linkChapterInt}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link CheckA couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link CheckA couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode === 'obs') {
            const numStories = 50, numFramesThisStory = 99;
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numStories)
                addNoticePartial({ priority: 655, message: "Bad story number in markdown OBS help link", details: `${linkBookCode} ${linkChapterInt} vs ${numStories} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numFramesThisStory)
                addNoticePartial({ priority: 653, message: "Bad frame number in markdown OBS help link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numFramesThisStory} verses`, excerpt: totalLink, location: ourLocation });
        } else if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_FULL_HELP_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible help link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible help link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        } else
            debugLog(`Seems BIBLE_FULL_HELP_REGEX '${totalLink}' didn't have a link book code!`);
    }

    // Check for this-chapter Bible links like [Revelation 3:11](./11.md)
    while ((regexResultArray = BIBLE_REGEX_THIS_CHAPTER_RELATIVE.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_REGEX_THIS_CHAPTER_RELATIVE regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        thisChapterBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 6, `BIBLE_REGEX_THIS_CHAPTER_RELATIVE expected 6 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, V2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = bookID;

        const linkVerseInt = ourParseInt(V2);
        if (C1 === undefined) {
            if (!books.isOneChapterBook(linkBookCode)) {
                // debugLog(`  checkNotesLinksToOutside C1 missing in BIBLE_REGEX_THIS_CHAPTER_RELATIVE regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
                addNoticePartial({ priority: 555, message: "Possible missing chapter number in markdown Bible link", excerpt: totalLink, location: ourLocation });
            }
            C1 = '0'; // Try to avoid consequential errors
        }
        try {
            if (ourParseInt(C1) !== givenCint)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${givenCint}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check1 couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check1 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_REGEX_THIS_CHAPTER_RELATIVE linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), givenCint);
            } catch (tlcNVerror) { }
            if (!givenCint || givenCint < 1 || givenCint > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${givenCint} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${givenCint}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-verse Bible links like [11](../03/11.md)
    while ((regexResultArray = THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        thisVerseBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 4, `THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX expected 4 fields (not ${regexResultArray.length})`);
        let [totalLink, V1, C2, V2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        let linkBookCode = bookID;

        let linkChapterInt, linkVerseInt;
        try {
            linkChapterInt = ourParseInt(C2);
            linkVerseInt = ourParseInt(V2);
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${V2}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check1b couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} ${V1} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-verse Bible links like [11](../03/11.md)
    while ((regexResultArray = THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        thisVerseBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 5, `THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX expected 5 fields (not ${regexResultArray.length})`);
        let [totalLink, V1a, V1b, C2, V2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        let linkBookCode = bookID;

        let verseInt1a, verseInt1b, linkChapterInt, linkVerseInt;
        try {
            verseInt1a = ourParseInt(V1a);
            verseInt1b = ourParseInt(V1b);
            linkChapterInt = ourParseInt(C2);
            linkVerseInt = ourParseInt(V2);
            if (verseInt1a !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1a} vs ${V2}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check1c couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} ${V1a} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }
        if (verseInt1b <= verseInt1a)
            addNoticePartial({ priority: 741, message: "Verse numbers of markdown Bible link range out of order", details: `${V1a} to ${V1b}`, excerpt: totalLink, location: ourLocation });

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11](../03/11.md)
    while ((regexResultArray = BIBLE_REGEX_THIS_BOOK_RELATIVE.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_REGEX_THIS_BOOK_RELATIVE regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        thisBookBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 7, `BIBLE_REGEX_THIS_BOOK_RELATIVE expected 7 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, C2, V2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = bookID;
        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${linkChapterInt}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check2 couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_REGEX_THIS_BOOK_RELATIVE linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11-12](../03/11.md)
    while ((regexResultArray = BCV_V_TO_THIS_BOOK_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BCV_V_TO_THIS_BOOK_BIBLE_REGEX regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        thisBookBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 9, `BCV_V_TO_THIS_BOOK_BIBLE_REGEX expected 9 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1a, V1b, B2, C2, V2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${linkChapterInt}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check2b couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1a) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1a} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2b couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }
        try {
            if (ourParseInt(V1b) <= ourParseInt(V1a))
                addNoticePartial({ priority: 741, message: "Verse numbers of markdown Bible link range out of order", details: `${V1a} to ${V1b}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2c couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C2}:${V2} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BCV_V_TO_THIS_BOOK_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11-12](../03/11.md)
    while ((regexResultArray = BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        thisChapterBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 7, `BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX expected 7 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1a, V1b, V2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = bookID;

        const linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(V1a) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1a} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2d couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V2} from '${fieldText}': ${vvError}`);
        }
        try {
            if (ourParseInt(V1b) <= ourParseInt(V1a))
                addNoticePartial({ priority: 741, message: "Verse numbers of markdown Bible link range out of order", details: `${V1a} to ${V1b}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check2e couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V2} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            // try {
            //     numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            // } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), givenC);
            } catch (tlcNVerror) { }
            if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${givenC}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for other book Bible links like [Revelation 3:11](rev/03/11.md)
    while ((regexResultArray = BIBLE_REGEX_OTHER_BOOK_ABSOLUTE.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_REGEX_OTHER_BOOK_ABSOLUTE regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        otherBookBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 8, `BIBLE_REGEX_OTHER_BOOK_ABSOLUTE expected 8 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${linkChapterInt}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check3 couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check3 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_REGEX_OTHER_BOOK_ABSOLUTE linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for other book Bible links like [Revelation 3:11](../../rev/03/11.md)
    while ((regexResultArray = BIBLE_REGEX_OTHER_BOOK_RELATIVE.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_REGEX_OTHER_BOOK_RELATIVE regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        otherBookBibleLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 8, `BIBLE_REGEX_OTHER_BOOK_RELATIVE expected 8 fields (not ${regexResultArray.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 143, message: "Unknown Bible book name in link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown Bible link don’t match", details: `${C1} vs ${linkChapterInt}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check3 couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown Bible link don’t match", details: `${V1} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check3 couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_REGEX_OTHER_BOOK_RELATIVE linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for TN links like [Titus 3:11](../03/11/zd2d)
    while ((regexResultArray = TN_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TN_REGEX regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        TNLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 9, `TN_REGEX expected 9 fields (not ${regexResultArray.length})`);
        // eslint-disable-next-line no-unused-vars
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2, _noteID2] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) parameterAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial({ priority: 144, message: "Unknown Bible book name in TN link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown TN link don’t match", details: `${C1} vs ${linkChapterInt}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link Check3b couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 752, message: "Verse numbers of markdown TN link don’t match", details: `${V1} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link Check3b couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `TN_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode.toLowerCase()).length;
            } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode.toLowerCase(), linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 656, message: "Bad chapter number in markdown TN link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 654, message: "Bad verse number in markdown TN link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }

        // TODO: We should see if we can find the correct note
    }

    // Check for simple display links like [ULT](https://something)
    // if (fieldText.indexOf('http') !== -1) debugLog(`Checking for http links in '${fieldName}' '${fieldText}'`);
    while ((regexResultArray = SIMPLE_DISPLAY_LINK_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside SIMPLE_DISPLAY_LINK_REGEX regexResultArray(${regexResultArray.length})=${JSON.stringify(regexResultArray)}`);
        generalLinkCount1 += 1;
        parameterAssert(regexResultArray.length === 3, `SIMPLE_DISPLAY_LINK_REGEX expected 3 fields (not ${regexResultArray.length})`);
        // eslint-disable-next-line no-unused-vars
        let [totalLink, displayText, uri] = regexResultArray;
        processedLinkList.push(totalLink); // Save the full link

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            const dummyPathParameters = { username: uri, repository: '', path: '', branch: '' };
            if (await alreadyChecked(dummyPathParameters) !== true) {
                // debugLog(`checkNotesLinksToOutside general link check needs to check: ${uri}`);
                const serverString = uri.replace('://','!!!').split('/')[0].replace('!!!','://').toLowerCase(); // Get the bit before any forward slashes

                // NOTE: These message strings must match RenderProcessedResults.js
                if (!serverString.endsWith('door43.org') && !serverString.endsWith('unfoldingword.org') && !serverString.endsWith('ufw.io')) // don't try to fetch general links
                    addNoticePartial({ priority: 32, message: `Untested general/outside link`, details: "please manually double-check link—probably no problem", excerpt: totalLink, location: ourLocation });
                else { // Try to fetch general links
                    let generalFileContent, hadError = false;
                    try {
                        // generalFileContent = await cachedGetFileUsingFullURL({ uri });
                        // debugLog(`${displayText} ${uri} got: (${generalFileContent.length}) ${generalFileContent.substring(0, 10)}...`);
                        // debugLog(`uri='${uri}', serverString='${serverString}'`);
                        // NOTE: The following line (with or without the mode) doesn't help -- actually makes things slightly worse
                        // const response = await fetch(uri, {headers:{'Access-Control-Allow-Origin': serverString}});
                        // const response = await fetch(uri, {mode: 'cors'});
                        // const response = await fetch(uri, {mode: 'cors', headers:{'Access-Control-Allow-Origin': serverString}});
                        const response = await fetch(uri);
                        if (response.ok) {// if HTTP-status is 200-299
                            generalFileContent = await response.text();
                            // debugLog(`General link ${displayText} @ ${uri} got: (${generalFileContent.length}) ${generalFileContent.substring(0, 10)}...`);
                        } else throw new Error(`Our Network error: ${response.statusCode}`);
                    } catch (trcGCerror) {
                        // debugLog(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load general ${uri}: ${trcGCerror}`);
                        // TODO: Put back up to 882 if we can solve cross-origin problems
                        addNoticePartial({ priority: 82, message: `Error loading general link`, details: "please double-check link—there may be no problem", excerpt: totalLink, location: `${ourLocation}: ${trcGCerror}` });
                        hadError = true;
                    }
                    if (!hadError && !generalFileContent)
                        addNoticePartial({ priority: 883, message: `Unable to find/load general link`, excerpt: totalLink, location: ourLocation });
                    else if (generalFileContent) { // we got the content of the general article
                        if (generalFileContent.length < 10)
                            addNoticePartial({ priority: 881, message: `Linked general article seems empty`, excerpt: totalLink, location: ourLocation });
                    }
                }
                await markAsChecked(dummyPathParameters); // don’t bother waiting for the result of this async call
            }
            // else debugLog(`Had already checked '${displayText}' ${uri}`);

            if (uri.startsWith('http:'))
                addNoticePartial({ priority: 152, message: "Should http link be https", excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for additional links that we can’t explain
    // if (processedLinkList.length) debugLog(`processedLinkList (${processedLinkList.length}) = ${JSON.stringify(processedLinkList)}`);
    const linkCount1 = thisChapterBibleLinkCount1 + thisVerseBibleLinkCount1 + thisBookBibleLinkCount1 + otherBookBibleLinkCount1 + TNLinkCount1 + twLinkCount1 + taLinkCount1 + generalLinkCount1;
    if (totalLinks1 > linkCount1) {
        const leftoverLinksList1 = linksList1.filter(x => !processedLinkList.includes(x)); // Delete links that we processed above
        // if (leftoverLinksList1.length) debugLog(`'${languageCode}', ${repoCode}, '${bookID}', '${fieldName}' processedLinkList (${processedLinkList.length}) = ${JSON.stringify(processedLinkList)}\n        linksList1(${linksList1.length})=${JSON.stringify(linksList1)}\nleftoverLinksList1(${leftoverLinksList1.length})=${JSON.stringify(leftoverLinksList1)}`);
        // if (leftoverLinksList1.length) debugLog(`'${languageCode}', ${repoCode}, '${bookID}', '${fieldName}' leftoverLinksList1 (${leftoverLinksList1.length}) = ${JSON.stringify(leftoverLinksList1)}`);
        addNoticePartial({ priority: 648, message: "Unusual [ ]( ) link(s)—not a recognized Bible or TA, TN, or TW link", details: `need to carefully check ${leftoverLinksList1.length === 1 ? '"' + leftoverLinksList1[0] + '"' : JSON.stringify(leftoverLinksList1)}`, location: ourLocation });
    }
    const linkCount2 = twLinkCount2 + taLinkCount2; // These are double-bracketed links, e.g., [[something]]
    // debugLog(`twLinkCount2 ${twLinkCount2} + taLinkCount2 ${taLinkCount2} = linkCount2 ${linkCount2}`);
    if (totalLinks2 > linkCount2) {
        const leftoverLinksList2 = linksList2.filter(x => !processedLinkList.includes(x)); // Delete links that we processed above
        // if (leftoverLinksList2.length) debugLog(`'${languageCode}', ${repoCode}, '${bookID}', '${fieldName}' processedLinkList (${processedLinkList.length}) = ${JSON.stringify(processedLinkList)}\n        linksList2(${linksList2.length})=${JSON.stringify(linksList2)}\nleftoverLinksList2(${leftoverLinksList2.length})=${JSON.stringify(leftoverLinksList2)}`);
        // if (leftoverLinksList2.length) debugLog(`'${languageCode}', ${repoCode}, '${bookID}', '${fieldName}' leftoverLinksList2 (${leftoverLinksList2.length}) = ${JSON.stringify(leftoverLinksList2)}`);
        addNoticePartial({ priority: 649, message: "Unusual [[ ]] link(s)—not a recognized TA or TW link", details: `need to carefully check ${leftoverLinksList2.length === 1 ? '"' + leftoverLinksList2[0] + '"' : JSON.stringify(leftoverLinksList2)}`, location: ourLocation });
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


    // functionLog(`checkNotesLinksToOutside is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkNotesLinksToOutside function
