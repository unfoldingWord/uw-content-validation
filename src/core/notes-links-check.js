import * as books from './books/books';
import { alreadyChecked, markAsChecked, isFilepathInRepoTree } from './getApi';
// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST, NUM_OBS_STORIES, MAX_OBS_FRAMES } from './defaults'
import { countOccurrencesInString } from './text-handling-functions'
import { cachedGetFile, cachedGetFileUsingFullURL, checkMarkdownFileContents } from '../core';
// eslint-disable-next-line no-unused-vars
import { userLog, debugLog, functionLog, parameterAssert, logicAssert, dataAssert, ourParseInt, aboutToOverwrite } from './utilities';
import jQuery from 'jquery'; // For avoiding CORS checking


// const NOTES_LINKS_VALIDATOR_VERSION_STRING = '1.0.3';

// const DEFAULT_LANGUAGE_CODE = 'en';
const DEFAULT_BRANCH = 'master';

const MISSING_FOLDER_SLASH_LINK_REGEX = new RegExp('\\d]\\(\\.\\.\\d', 'g'); // [2:1](..02/01.md) missing a forward slash after the ..

const GENERAL_MARKDOWN_LINK1_REGEX = new RegExp('\\[[^\\]]+?\\]\\([^\\)]+?\\)', 'g'); // [displayLink](URL)
const GENERAL_MARKDOWN_LINK2_REGEX = new RegExp('\\[\\[[^\\]]+?\\]\\]', 'g'); // [[combinedDisplayLink]]

const TA_DOUBLE_BRACKETED_LINK_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/ta/man/([^ /]+?)/([^ \\]]+?)\\]\\]', 'g'); // Enclosed in [[  ]]
const TA_FULL_DISPLAY_LINK_REGEX = new RegExp('\\[([^\\]]+?)\\]\\(rc://([^ /]+?)/ta/man/([^ /]+?)/([^ \\]]+?)\\)', 'g'); // [How to Translate Names](rc://en/ta/man/translate/translate-names)
const TA_RELATIVE1_DISPLAY_LINK_REGEX = new RegExp('\\[([^\\]]+?)\\]\\(\\.{2}/([^ /\\]]+?)/01\\.md\\)', 'g'); // [Borrow Words](../translate-transliterate/01.md)
const TA_RELATIVE2_DISPLAY_LINK_REGEX = new RegExp('\\[([^\\]]+?)\\]\\(\\.{2}/\\.{2}/([^ /\\]]+?)/([^ /\\]]+?)/01\\.md\\)', 'g'); // [Borrow Words](../../translate/translate-transliterate/01.md)

const TW_DOUBLE_BRACKETED_LINK_REGEX = new RegExp('\\[\\[rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/([^ /\\]]+?)\\]\\]', 'g'); // Enclosed in [[  ]]
const TWL_RAW_LINK_REGEX = new RegExp('rc://([^ /]+?)/tw/dict/bible/([^ /]+?)/(.+)', 'g'); // Just a raw link
const TW_INTERNAL_REGEX = new RegExp('\\[([-,\\w ()]+?)\\]\\(\\.{2}/([a-z]{2,5})/([-A-Za-z12]{2,20})\\.md\\)', 'g');// [Asher](../names/asher.md)

// NOTE: Bible link format is archaic, presumably from pre-USFM days!
// TODO: Do we need to normalise Bible links, i.e., make sure that the link itself
//          (we don’t care about the displayed text) doesn’t specify superfluous levels/information
// TODO: We need a decision on hyphen vs en-dash in verse references -- we currently allow either which isn't good in the long term!
// TODO: Test to see if "[2:23](../02/03.md)" is found by more than one regex below
const BIBLE_REGEX_OTHER_BOOK_ABSOLUTE = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3}):(\\d{1,3})\\]\\(([123a-z]{3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Revelation 3:11](rev/03/11.md)
// TODO: Is this option with ../../ really valid? Where/Why does it occur?
const BIBLE_REGEX_OTHER_BOOK_RELATIVE = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3}):(\\d{1,3})\\]\\((?:\\.{2}/)?\\.{2}/([123a-z]{3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Revelation 3:11](../../rev/03/11.md) or (../rev/03/11.md) NOTE: only one of these must theoretically be correct!!!
const BIBLE_REGEX_THIS_BOOK_RELATIVE = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3}):(\\d{1,3})\\]\\(\\.{2}/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Revelation 3:11](../03/11.md) or [Song of Solomon 3:11](../03/11.md)
const BCV_V_TO_OTHER_BOOK_BIBLE_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3}):(\\d{1,3})[–-](\\d{1,3})\\]\\((?:\\.{2})/([123a-z]{3})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Genesis 26:12-14](../gen/26/12.md) NOTE en-dash
const BCV_V_TO_THIS_BOOK_BIBLE_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3}):(\\d{1,3})[–-](\\d{1,3})\\]\\((\\.{2})/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g'); // [Genesis 26:12-14](../26/12.md) or [4:11–16](../04/11.md) NOTE en-dash
const BIBLE_REGEX_THIS_CHAPTER_RELATIVE = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(?:(\\d{1,3}):)?(\\d{1,3})\\]\\(\\./(\\d{1,3})\\.md\\)', 'g'); // [Exodus 2:7](./07.md)
const THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX = new RegExp('\\[(?:verse )?(\\d{1,3})\\]\\(\\.{2}/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');// [27](../11/27.md) or [verse 27](../11/27.md)
const THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX = new RegExp('\\[(?:verses )?(\\d{1,3})[–-](\\d{1,3})\\]\\(\\.{2}/(\\d{1,3})/(\\d{1,3})\\.md\\)', 'g');// [2–7](../09/2.md) or [verses 2–7](../09/2.md) NOTE en-dash
const BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3}):(\\d{1,3})[–-](\\d{1,3})\\]\\(\\./(\\d{1,3})\\.md\\)', 'g'); // [Genesis 26:12-14](./12.md) NOTE en-dash

const TN_FULL_HELP_CV_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3}):(\\d{1,3})(?:[–-]\\d{1,3})?\\]\\(rc://([^ /]+?)/tn/help/([123a-z]{3})/(\\d{1,3})/(\\d{1,3})\\)', 'g'); // [Song of Solomon 29:23-24](rc://en/tn/help/sng/29/23)
const TN_FULL_HELP_C_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3})\\]\\(rc://([^ /]+?)/tn/help/([123a-z]{3})/(\\d{1,3})/(\\d{1,3})\\)', 'g'); // [Song of Solomon 29:23-24](rc://en/tn/help/sng/29/23)

const TN_REGEX = new RegExp('\\[((?:1 |2 |3 )?)((?:[\\w ]+? )?)(\\d{1,3}):(\\d{1,3})\\]\\((\\.{2})/(\\d{1,3})/(\\d{1,3})/([a-z][a-z0-9][a-z0-9][a-z0-9])\\)', 'g');

const SIMPLE_DISPLAY_LINK_REGEX = new RegExp('\\[([^\\]]+?)\\]\\((https?://[^\\)]+?)\\)', 'g');// [ULT](https://something)

const SIMPLE_IMAGE_REGEX = new RegExp('!\\[([^\\]]*?)\\]\\(([^ "\\)]+?)\\)', 'g'); // ![alt](y)
const TITLED_IMAGE_REGEX = new RegExp('!\\[([^\\]]*?)\\]\\(([^ \\)]+?) "([^"\\)]+?)"\\)', 'g'); // ![alt](link "title")

const OBS_LINK_REGEX = new RegExp('\\[(\\d?\\d):(\\d?\\d)\\]\\((\\d\\d)/(\\d\\d)\\)', 'g'); // [7:3](07/03)


/**
 *
 * @param {string} languageCode, e.g., 'en'
 * @param {string} repoCode, e.g., 'TN', 'SN', 'TN2', or even 'UHB', 'UGNT', or 'TWL' for the initial repo for the file being checked
 * @param {string} bookID may be blank
 * @param {string} givenC may be blank
 * @param {string} givenV may be blank
 * @param {string} fieldName, e.g., 'TWLink' or 'OccurrenceNote' or 'Note' or .md filename, etc.
 * @param {string} fieldText
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkNotesLinksToOutside(username, languageCode, repoCode, bookID, givenC, givenV, fieldName, fieldText, givenLocation, checkingOptions) {
    /* This is for the case of the OccurrenceNote or Note or TWLink fields containing markdown links

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
    // functionLog(`checkNotesLinksToOutside(lC=${languageCode}, rC=${repoCode}', bk=${bookID} ${givenC}:${givenV} fN=${fieldName}, (${fieldText.length}), ${givenLocation}, …)…`);
    // functionLog(`checkNotesLinksToOutside(lC=${languageCode}, rC=${repoCode}', bk=${bookID} ${givenC}:${givenV} fN=${fieldName}, (${fieldText.length}), ${givenLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(languageCode !== undefined, "checkNotesLinksToOutside: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkNotesLinksToOutside: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    // parameterAssert(languageCode !== 'hbo' && languageCode !== 'el-x-koine', `checkNotesLinksToOutside: 'languageCode' parameter should not be an original language code: '${languageCode}'`);
    //parameterAssert(repoCode !== undefined, "checkNotesLinksToOutside: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkNotesLinksToOutside: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkNotesLinksToOutside: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(bookID !== undefined, "checkNotesLinksToOutside: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkNotesLinksToOutside: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    //parameterAssert(typeof givenC === 'string', `checkNotesLinksToOutside: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    //parameterAssert(typeof givenV === 'string', `checkNotesLinksToOutside: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    // if (fieldName !== 'MDFile') {
    //     //parameterAssert(bookID.length === 3, `checkNotesLinksToOutside: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //     //parameterAssert(bookID.toUpperCase() === bookID, `checkNotesLinksToOutside: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //     //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkNotesLinksToOutside: '${bookID}' is not a valid USFM book identifier`);
    // }
    //parameterAssert(fieldName !== undefined, "checkNotesLinksToOutside: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldName === 'string', `checkNotesLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    //parameterAssert(fieldName !== `${languageCode}_${repoCode.toLowerCase()}`, `checkNotesLinksToOutside: 'fieldText' parameter should not be the repoName: '${fieldName}'`);
    // if (fieldName === `${languageCode}_${repoCode.toLowerCase()}`) { console.trace('checkNotesLinksToOutside()'); }
    if (!fieldName.startsWith('TA ') && !fieldName.startsWith('TW ') && !fieldName.endsWith('.md') && fieldName.indexOf('/') === -1) {
        //parameterAssert(fieldName === 'OccurrenceNote' || fieldName === 'Note' || fieldName === 'TWLink' || fieldName === 'Response' || fieldName === 'README' || fieldName === 'LICENSE', `checkNotesLinksToOutside: 'fieldName' parameter should be 'OccurrenceNote', 'Note', 'TWLink', 'Response', 'README' or 'LICENSE' not '${fieldName}'`);
    }
    //parameterAssert(fieldText !== undefined, "checkNotesLinksToOutside: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldText === 'string', `checkNotesLinksToOutside: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    //parameterAssert(givenLocation !== undefined, "checkNotesLinksToOutside: 'fieldText' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkNotesLinksToOutside: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);

    /* // Regex test
    debugLog("Starting TextRegex…");
    const testRegex = BCV_V_TO_OTHER_BOOK_BIBLE_REGEX;
    const testText = 'See [Acts 15:13-21](../act/15/13.md).';
    let regexTestResultArray;
    while ((regexTestResultArray = testRegex.exec(testText))) {
        debugLog(`TestRegex got regexTestResultArray(${regexTestResultArray.length})=${JSON.stringify(regexTestResultArray)} from '${testText}'`);
    }
    debugLog("Finished TextRegex."); */

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ctarResult = { noticeList: [], checkedFileCount: 0, checkedFilenames: [], checkedRepoNames: [] };

    /**
     *
     * @description - adds a new notice entry from the partial fields given -- adding bookID and fieldName to the given fields
     * @param {Object} incompleteNoticeObject expected to contain priority, message, characterIndex, exerpt, location
     */
    function addNoticePartial(incompleteNoticeObject) {
        // functionLog(`checkNotesLinksToOutside Notice: (priority = ${ priority }) ${ message } ${ characterIndex > 0 ? ` (at character ${characterIndex})` : "" } ${ excerpt ? ` ${excerpt}` : "" } ${ location }`);
        //parameterAssert(incompleteNoticeObject.priority !== undefined, "cTNlnk addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `cTNlnk addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}': ${incompleteNoticeObject.priority}`);
        //parameterAssert(incompleteNoticeObject.message !== undefined, "cTNlnk addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.message === 'string', `cTNlnk addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}': ${incompleteNoticeObject.message}`);
        // parameterAssert(incompleteNoticeObject.characterIndex !== undefined, `cTNlnk addNoticePartial: 'characterIndex' parameter should be defined`);
        if (incompleteNoticeObject.characterIndex) {
            //parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `cTNlnk addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}': ${incompleteNoticeObject.characterIndex}`);
        }
        // parameterAssert(excerpt !== undefined, "cTNlnk addNoticePartial: 'excerpt' parameter should be defined");
        if (incompleteNoticeObject.excerpt) {
            //parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `cTNlnk addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}': ${incompleteNoticeObject.excerpt}`);
        }
        //parameterAssert(incompleteNoticeObject.location !== undefined, "cTNlnk addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.location === 'string', `cTNlnk addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}': ${incompleteNoticeObject.location}`);
        // incompleteNoticeObject.debugChain = incompleteNoticeObject.debugChain ? `checkNotesLinksToOutside ${ incompleteNoticeObject.debugChain } ` : `checkNotesLinksToOutside(${ fieldName })`;
        if (bookID.length) incompleteNoticeObject.bookID = bookID; // Don't set the field if we don't have a useful bookID
        aboutToOverwrite('checkNotesLinksToOutside', ['fieldName'], incompleteNoticeObject, { fieldName });
        ctarResult.noticeList.push({ ...incompleteNoticeObject, fieldName });
    }


    // Main code for checkNotesLinksToOutside
    // Get any options that were suppplied, or else set default values
    let excerptLength = checkingOptions?.excerptLength;
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength = ${ excerptLength }`);
    } // else debugLog(`Using supplied excerptLength = ${ excerptLength } `, `cf.default = ${ DEFAULT_EXCERPT_LENGTH }`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength = ${ excerptHalfLength } `, `excerptHalfLengthPlus = ${ excerptHalfLengthPlus }`);

    const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;
    let defaultLanguageCode = checkingOptions?.defaultLanguageCode;
    // if (!defaultLanguageCode) defaultLanguageCode = DEFAULT_LANGUAGE_CODE;
    let adjustedLanguageCode = languageCode; // This is the language code of the resource with the link
    if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won’t be needed for TWs when we switch to TWLs)
    if (!defaultLanguageCode) defaultLanguageCode = adjustedLanguageCode;
    // debugLog(`checkNotesLinksToOutside defaultLanguageCode=${defaultLanguageCode}`);

    let taRepoUsername = checkingOptions?.taRepoUsername;
    if (!taRepoUsername) taRepoUsername = defaultLanguageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog';
    let taRepoBranch = checkingOptions?.taRepoBranch;
    if (!taRepoBranch) taRepoBranch = DEFAULT_BRANCH;
    let twRepoUsername = checkingOptions?.twRepoUsername;
    if (!twRepoUsername) twRepoUsername = defaultLanguageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog';
    let twRepoBranch = checkingOptions?.twRepoBranch;
    if (!twRepoBranch) twRepoBranch = DEFAULT_BRANCH;
    // debugLog(`checkNotesLinksToOutside ended up with taRepoUsername=${taRepoUsername} taRepoBranch=${taRepoBranch} twRepoUsername=${twRepoUsername} twRepoBranch=${twRepoBranch}`);

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
            if (givenVfirstPart !== givenV && givenV !== 'intro') debugLog(`From '${givenC}': '${givenV}' got '${givenC}': '${givenVfirstPart}' then integers ${givenCint}: ${givenVint}`);
        } catch (cvError) {
            console.error(`TN Link Check couldn’t parse given chapter and verse numbers for ${bookID} ${givenC}: ${givenV} ${fieldName} ' via ${givenC}:${givenVfirstPart} got ${givenCint}:${givenVint} with ${cvError}`);
        }
    }

    if (fieldName === 'x-tw' || fieldName === 'TWLink' || fieldName === 'SupportReference') {
        // The link should be the entire field (not just a string inside the field), so check for leading/trailing spaces
        const trimStartFieldText = fieldText.trimStart(), trimEndFieldText = fieldText.trimEnd();
        if (trimStartFieldText !== fieldText) {
            const excerpt = fieldText.slice(0, excerptLength).replace(/ /g, '␣') + (fieldText.length > excerptLength ? '…' : '');
            addNoticePartial({ priority: 784, message: "Unexpected leading whitespace in link field", excerpt, characterIndex: 0, location: ourLocation });
        }
        else if (trimEndFieldText !== fieldText) {
            const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - 10).replace(/ /g, '␣');
            addNoticePartial({ priority: 785, message: "Unexpected trailing whitespace in link field", excerpt, characterIndex: fieldText.length - 1, location: ourLocation });
        }
    }

    let regexMatchObject;

    // Check for common bad links like [2:1](..02/01.md) which is missing a forward slash after the double dots
    while ((regexMatchObject = MISSING_FOLDER_SLASH_LINK_REGEX.exec(fieldText))) {
        // debugLog(`Got bad link ${JSON.stringify(regexMatchObject)}`);
        // const [totalLink] = regexMatchObject;
        const characterIndex = regexMatchObject.index + 4;
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 753, message: "Link target is missing a forward slash", excerpt, location: ourLocation });
    }

    // Check for image links (including OBS pictures)
    while ((regexMatchObject = SIMPLE_IMAGE_REGEX.exec(fieldText))) {
        // debugLog(`Got markdown image in line ${lineNumber}:`, JSON.stringify(regexMatchObject));
        const [totalLink, altText, fetchLink] = regexMatchObject;
        // if (altText !== 'OBS Image') userLog("This code was only checked for 'OBS Image' links");
        if (!altText)
            addNoticePartial({ priority: 199, message: "Markdown image link has no alternative text", excerpt: totalLink, location: ourLocation });
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
    while ((regexMatchObject = TITLED_IMAGE_REGEX.exec(fieldText))) {
        // debugLog(`Got markdown image in line ${lineNumber}:`, JSON.stringify(regexMatchObject));
        const [totalLink, alt, fetchLink, title] = regexMatchObject;
        if (!alt)
            addNoticePartial({ priority: 199, message: "Markdown image link has no alternative text", excerpt: totalLink, location: ourLocation });
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
    const singlePartLinksList = fieldText.match(GENERAL_MARKDOWN_LINK1_REGEX) || []; // [[something]]
    // if (singlePartLinksList.length) debugLog(`singlePartLinksList (${singlePartLinksList.length}) = ${JSON.stringify(singlePartLinksList)}`);
    const doublePartLinksList = fieldText.match(GENERAL_MARKDOWN_LINK2_REGEX) || []; // [display](link)
    // if (doublePartLinksList.length) debugLog(`doublePartLinksList (${doublePartLinksList.length}) = ${JSON.stringify(doublePartLinksList)}`);
    // let taLinkCount1 = 0, taLinkCount2 = 0, twLinkCount1 = 0, twLinkCount2 = 0, TNLinkCount1 = 0, thisChapterBibleLinkCount1 = 0, thisVerseBibleLinkCount1 = 0, thisBookBibleLinkCount1 = 0, otherBookBibleLinkCount1 = 0, OBSLinkCount = 0, generalLinkCount1 = 0;
    const processedLinkList = [];

    // Check for internal TW links like [Asher](../names/asher.md)
    while ((regexMatchObject = TW_INTERNAL_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TW_INTERNAL_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // twLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 4, `TW_INTERNAL_REGEX expected 4 fields (not ${regexMatchObject.length})`);
        logicAssert(repoCode === 'TW', `Shouldn't this only be for TW repos, not for ${repoCode}?`);
        // eslint-disable-next-line no-unused-vars
        let [totalLink, _displayName, category, article] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        const twRepoName = `${defaultLanguageCode}_tw`;
        // debugLog(`Got twRepoName=${twRepoName}`);
        const filename = `${article.trim()}.md`;
        const filepath = `bible/${category}/${filename}`;
        // debugLog(`Got tW filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            // if (regexMatchObject[3] === 'brother') debugLog(`Need to check ${fieldName} TW link ${regexMatchObject} against ${twRepoName}`);
            const twPathParameters = { username: twRepoUsername, repository: twRepoName, path: filepath, branch: twRepoBranch };
            if (!await alreadyChecked(twPathParameters)) {
                if (checkingOptions?.disableLinkedTWArticlesCheckFlag === true && repoCode !== 'TW') {
                    // New code
                    // We don't need/want to check the actual article, so we don't need to fetch it
                    // However, we still want to know if the given link actually links to an article
                    //  so we'll check it against the tree listing from DCS
                    if (!await isFilepathInRepoTree(twPathParameters))
                        addNoticePartial({ priority: 883, message: "Unable to find linked TW article", details: `${twRepoUsername} ${twRepoName} ${twRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                }
                else {
                    let twFileContent;
                    try {
                        twFileContent = await getFile_(twPathParameters);
                        // if (regexMatchObject[3] === 'brother') debugLog(`Fetched fileContent for ${JSON.stringify(twPathParameters)}: ${typeof twFileContent} ${twFileContent.length}`);
                    } catch (trcGCerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                        console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TW ${twRepoUsername} ${twRepoName}, ${filepath}, ${twRepoBranch}: ${trcGCerror.message}`);
                        addNoticePartial({ priority: 882, message: `Error loading TW article`, details: `${twRepoUsername} ${twRepoName} ${twRepoBranch} ${filepath}`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                    }
                    if (!twFileContent)
                        addNoticePartial({ priority: 883, message: "Unable to find/load linked TW article", details: `${twRepoUsername} ${twRepoName} ${twRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                    else { // we got the content of the TW article
                        if (twFileContent.length < 10)
                            addNoticePartial({ priority: 881, message: `TW article seems empty`, details: `${twRepoUsername} ${twRepoName} ${twRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                        // THIS IS DISABLED COZ IT CAN GIVE AN INFINITE LOOP !!!
                        // else if (checkingOptions?.disableLinkedTWArticlesCheckFlag !== true) {
                        //     // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTWArticlesCheckFlag} so checking TW article: ${filepath}`);
                        //     if (!await alreadyChecked(twPathParameters)) {
                        //         // functionLog(`checkNotesLinksToOutside needs to check TW article: ${filepath}`);
                        //         const checkTWFileResult = await checkMarkdownFileContents(username, languageCode, repoCode, `TW ${filename}`, twFileContent, ourLocation, checkingOptions);
                        //         for (const noticeObject of checkTWFileResult.noticeList)
                        //             ctarResult.noticeList.push({ ...noticeObject, username: twRepoUsername, repoCode: 'TW', repoName: twRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TW' });
                        //         ctarResult.checkedFileCount += 1;
                        //         ctarResult.checkedFilenames.push(filename);
                        //         ctarResult.checkedFilesizes = twFileContent.length;
                        //         ctarResult.checkedFilenameExtensions = ['md'];
                        //         ctarResult.checkedRepoNames.push(twRepoName);
                        //         markAsChecked(twPathParameters); // don’t bother waiting for the result of this async call
                        //     }
                        // }
                        // else debugLog("checkNotesLinksToOutside: disableLinkedTWArticlesCheckFlag is set to TRUE!");
                    }
                }
                markAsChecked(twPathParameters); // don’t bother waiting for the result of this async call
            }
        }
        // else debugLog("checkNotesLinksToOutside: disableAllLinkFetchingFlag is set to TRUE!");
    }

    // Check for TA links like [How to Translate Names](rc://en/ta/man/translate/translate-names)
    while ((regexMatchObject = TA_FULL_DISPLAY_LINK_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TA_FULL_DISPLAY_LINK_REGEX resultArray=${JSON.stringify(regexMatchObject)}`);
        // taLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 5, `TA_FULL_DISPLAY_LINK_REGEX expected 5 fields (not ${regexMatchObject.length})`)
        // eslint-disable-next-line no-unused-vars
        let [totalLink, _displayName, foundLanguageCode, part, article] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (foundLanguageCode !== '*') {
            const characterIndex = regexMatchObject.index + 7;
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 450, message: "Resource container link should have '*' language code", details: `not ‘${foundLanguageCode}’`, characterIndex, excerpt, location: ourLocation });
        } else if (repoCode === 'TN') { // but not TN2
            // At the moment, tC can’t handle these links with * so we have to ensure that they're not there
            const characterIndex = regexMatchObject.index + 7;
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
            if (!await alreadyChecked(taPathParameters)) {
                if (checkingOptions?.disableLinkedTAArticlesCheckFlag === true) {
                    // New code
                    // We don't need/want to check the actual article, so we don't need to fetch it
                    // However, we still want to know if the given link actually links to an article
                    //  so we'll check it against the tree listing from DCS
                    if (!await isFilepathInRepoTree(taPathParameters)) {
                        addNoticePartial({ priority: 886, message: "Unable to find linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                    }
                } else {
                    let taFileContent, alreadyGaveError = false;
                    try {
                        taFileContent = await getFile_(taPathParameters);
                        // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
                    } catch (trcGCerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                        // console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                        addNoticePartial({ priority: 885, message: `Error loading TA article`, details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                        alreadyGaveError = true;
                    }
                    if (!alreadyGaveError) {
                        if (!taFileContent)
                            addNoticePartial({ priority: 886, message: "Unable to find/load linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                        else if (taFileContent.length < 10)
                            addNoticePartial({ priority: 884, message: `TA article seems empty`, details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                        else if (checkingOptions?.disableLinkedTAArticlesCheckFlag !== true) {
                            // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTAArticlesCheckFlag} so checking TA article: ${filepath}`);
                            // functionLog(`checkNotesLinksToOutside needs to check TA article: ${filepath}`);
                            const checkTAFileResult = await checkMarkdownFileContents(username, foundLanguageCode, 'TA', filepath, taFileContent, ourLocation, checkingOptions);
                            for (const noticeObject of checkTAFileResult.noticeList) {
                                // Why don’t we use addNoticePartial() here? (It adds bookID and fieldName.) Maybe it would be misleading???
                                if (noticeObject.repoCode === undefined) {
                                    // debugLog(`checkMarkdownText 378 added rC=TA to ${JSON.stringify(noticeObject)}`);
                                    noticeObject.repoCode = 'TA';
                                }
                                // else if (noticeObject.repoCode !== 'TA') debugLog(`checkMarkdownText 378 DIDN'T ADD rC=TA to ${JSON.stringify(noticeObject)}`);
                                ctarResult.noticeList.push({ ...noticeObject, username: taRepoUsername, repoName: taRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TA' });
                            }
                            ctarResult.checkedFileCount += 1;
                            ctarResult.checkedFilenames.push(filepath);
                            ctarResult.checkedFilesizes = taFileContent.length;
                            ctarResult.checkedFilenameExtensions = ['md'];
                            ctarResult.checkedRepoNames.push(taRepoName);
                        }
                    }
                }
                markAsChecked(taPathParameters); // don’t bother waiting for the result of this async call
            }
        }
    }

    if (repoCode === 'TA' || fieldName.startsWith('TA ')) {
        // Check for relative TA links like [Borrow Words](../translate-transliterate/01.md)
        while ((regexMatchObject = TA_RELATIVE1_DISPLAY_LINK_REGEX.exec(fieldText))) {
            // debugLog(`  checkNotesLinksToOutside TA_RELATIVE1_DISPLAY_LINK_REGEX resultArray=${JSON.stringify(regexMatchObject)}`);
            // taLinkCount1 += 1;
            logicAssert(regexMatchObject.length === 3, `TA_RELATIVE1_DISPLAY_LINK_REGEX expected 3 fields (not ${regexMatchObject.length})`)
            // eslint-disable-next-line no-unused-vars
            let [totalLink, _displayName, article] = regexMatchObject;
            processedLinkList.push(totalLink); // Save the full link

            const taRepoName = `${defaultLanguageCode}_ta`;
            // debugLog(`Got taRepoName=${taRepoName}`);
            let TAsection = 'translate';
            if (fieldName.startsWith('checking/')) TAsection = 'checking';
            else if (fieldName.startsWith('process/')) TAsection = 'process';
            if (fieldName.startsWith('intro/')) TAsection = 'intro';
            dataAssert(TAsection === 'translate' || TAsection === 'checking' || TAsection === 'process' || TAsection === 'intro', `Unexpected TA section name = '${TAsection}'`);
            const filepath = `${TAsection}/${article}/01.md`; // Other files are title.md, sub-title.md
            // debugLog(`checkNotesLinksToOutside TA_RELATIVE1_DISPLAY_LINK_REGEX got tA filepath=${filepath}`);

            if (!checkingOptions?.disableAllLinkFetchingFlag) {
                // debugLog(`checkNotesLinksToOutside TA_RELATIVE1_DISPLAY_LINK_REGEX need to check ${filepath} against ${taRepoName}`);
                const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
                // debugLog(`checkNotesLinksToOutside TA_RELATIVE1_DISPLAY_LINK_REGEX need to check taPathParameters=${JSON.stringify(taPathParameters)})`);
                if (!await alreadyChecked(taPathParameters)) {
                    if (repoCode !== 'TA' && checkingOptions?.disableLinkedTAArticlesCheckFlag === true) {
                        // New code
                        // We don't need/want to check the actual article, so we don't need to fetch it
                        // However, we still want to know if the given link actually links to an article
                        //  so we'll check it against the tree listing from DCS
                        if (!await isFilepathInRepoTree(taPathParameters))
                            addNoticePartial({ priority: 886, message: "Unable to find linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                    }
                    else { // hopefully all the TA articles were preloaded
                        let taFileContent, alreadyGaveError = false;
                        try {
                            taFileContent = await getFile_(taPathParameters);
                            // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
                        } catch (trcGCerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                            console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                            addNoticePartial({ priority: 885, message: `Error loading TA article`, details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                            alreadyGaveError = true;
                        }
                        if (!alreadyGaveError) {
                            if (!taFileContent)
                                addNoticePartial({ priority: 886, message: "Unable to find/load linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                            else if (taFileContent.length < 10)
                                addNoticePartial({ priority: 884, message: "Linked TA article seems empty", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                            // Don’t do this or it gets infinite recursion!!!
                            // else if (checkingOptions?.disableLinkedTAArticlesCheckFlag !== true) {
                            //     // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTAArticlesCheckFlag} so checking TA article: ${filepath}`);
                            //     if (!await alreadyChecked(taPathParameters)) {
                            //         // functionLog(`checkNotesLinksToOutside needs to check TA article: ${filepath}`);
                            //         const checkTAFileResult = await checkMarkdownFileContents(username, languageCode, repoCode, `TA ${article.trim()}/01.md`, taFileContent, ourLocation, checkingOptions);
                            //         for (const noticeObject of checkTAFileResult.noticeList)
                            //             ctarResult.noticeList.push({ ...noticeObject, username: taRepoUsername, repoCode: 'TA', repoName: taRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TA' });
                            //         ctarResult.checkedFileCount += 1;
                            //         ctarResult.checkedFilenames.push(`${article.trim()}/01.md`);
                            //         ctarResult.checkedFilesizes = taFileContent.length;
                            //         ctarResult.checkedFilenameExtensions = ['md'];
                            //         ctarResult.checkedRepoNames.push(taRepoName);
                            //         markAsChecked(taPathParameters); // don’t bother waiting for the result of this async call
                            //     }
                            // }
                        }
                    }
                    markAsChecked(taPathParameters); // don’t bother waiting for the result of this async call
                }
            }
        }
        // Check for relative TA links like [Borrow Words](../../translate/translate-transliterate/01.md)
        while ((regexMatchObject = TA_RELATIVE2_DISPLAY_LINK_REGEX.exec(fieldText))) {
            // debugLog(`  checkNotesLinksToOutside TA_RELATIVE2_DISPLAY_LINK_REGEX resultArray=${JSON.stringify(regexMatchObject)}`);
            // taLinkCount1 += 1;
            logicAssert(regexMatchObject.length === 4, `TA_RELATIVE2_DISPLAY_LINK_REGEX expected 4 fields (not ${regexMatchObject.length})`)
            // eslint-disable-next-line no-unused-vars
            let [totalLink, _displayName, TAsection, article] = regexMatchObject;
            processedLinkList.push(totalLink); // Save the full link

            const taRepoName = `${defaultLanguageCode}_ta`;
            // debugLog(`Got taRepoName=${taRepoName}`);
            const filepath = `${TAsection}/${article}/01.md`; // Other files are title.md, sub-title.md
            // debugLog(`Got tA filepath=${filepath}`);

            if (!checkingOptions?.disableAllLinkFetchingFlag) {
                // functionLog(`checkNotesLinksToOutside: need to check against ${taRepoName}`);
                const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
                if (!await alreadyChecked(taPathParameters)) {
                    if (repoCode !== 'TA' && checkingOptions?.disableLinkedTAArticlesCheckFlag === true) {
                        // New code
                        // We don't need/want to check the actual article, so we don't need to fetch it
                        // However, we still want to know if the given link actually links to an article
                        //  so we'll check it against the tree listing from DCS
                        if (!await isFilepathInRepoTree(taPathParameters))
                            addNoticePartial({ priority: 886, message: "Unable to find linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                    }
                    else {
                        let taFileContent, alreadyGaveError = false;
                        try {
                            taFileContent = await getFile_(taPathParameters);
                            // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
                        } catch (trcGCerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                            // console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                            addNoticePartial({ priority: 885, message: `Error loading TA article`, details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                            alreadyGaveError = true;
                        }
                        if (!alreadyGaveError) {
                            if (!taFileContent)
                                addNoticePartial({ priority: 886, message: "Unable to find/load linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                            else if (taFileContent.length < 10)
                                addNoticePartial({ priority: 884, message: "Linked TA article seems empty", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                            // Don’t do this or it gets infinite recursion!!!
                            // else if (checkingOptions?.disableLinkedTAArticlesCheckFlag !== true) {
                            //     // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTAArticlesCheckFlag} so checking TA article: ${filepath}`);
                            //     if (!await alreadyChecked(taPathParameters)) {
                            //         // functionLog(`checkNotesLinksToOutside needs to check TA article: ${filepath}`);
                            //         const checkTAFileResult = await checkMarkdownFileContents(username, languageCode, repoCode, `TA ${filepath}`, taFileContent, ourLocation, checkingOptions);
                            //         for (const noticeObject of checkTAFileResult.noticeList)
                            //             ctarResult.noticeList.push({ ...noticeObject, username: taRepoUsername, repoCode: 'TA', repoName: taRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TA' });
                            //         ctarResult.checkedFileCount += 1;
                            //         ctarResult.checkedFilenames.push(filepath);
                            //         ctarResult.checkedFilesizes = taFileContent.length;
                            //         ctarResult.checkedFilenameExtensions = ['md'];
                            //         ctarResult.checkedRepoNames.push(taRepoName);
                            //         markAsChecked(taPathParameters); // don’t bother waiting for the result of this async call
                            //     }
                            // }
                        }
                    }
                    markAsChecked(taPathParameters); // don’t bother waiting for the result of this async call
                }
            }
        }
    }

    // Check for TA links like [[rc://en/ta/man/translate/figs-metaphor]]
    // if (fieldText.indexOf('brother') !== -1) debugLog("checkNotesLinksToOutside: Search for TA links")
    while ((regexMatchObject = TA_DOUBLE_BRACKETED_LINK_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TA_DOUBLE_BRACKETED_LINK_REGEX resultArray=${JSON.stringify(regexMatchObject)}`);
        // taLinkCount2 += 1;
        logicAssert(regexMatchObject.length === 4, `TA_DOUBLE_BRACKETED_LINK_REGEX expected 4 fields (not ${regexMatchObject.length})`)
        let [totalLink, foundLanguageCode, part, article] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (foundLanguageCode !== '*') {
            const characterIndex = regexMatchObject.index + 7;
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 450, message: "Resource container link should have '*' language code", details: `not ‘${foundLanguageCode}’`, characterIndex, excerpt, location: ourLocation });
        } else if (repoCode === 'TN') { // but not TN2
            // At the moment, tC can’t handle these links with * so we have to ensure that they're not there
            const characterIndex = regexMatchObject.index + 7;
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
            if (!await alreadyChecked(taPathParameters)) {
                if (checkingOptions?.disableLinkedTAArticlesCheckFlag === true) {
                    // New code
                    // We don't need/want to check the actual article, so we don't need to fetch it
                    // However, we still want to know if the given link actually links to an article
                    //  so we'll check it against the tree listing from DCS
                    if (!await isFilepathInRepoTree(taPathParameters))
                        addNoticePartial({ priority: 886, message: "Unable to find linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                }
                else
                    if (!await alreadyChecked(taPathParameters)) {
                        let taFileContent, alreadyGaveError = false;
                        try {
                            taFileContent = await getFile_(taPathParameters);
                            // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
                        } catch (trcGCerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                            // console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                            addNoticePartial({ priority: 885, message: `Error loading TA article`, details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                            alreadyGaveError = true;
                        }
                        if (!alreadyGaveError) {
                            if (!taFileContent)
                                addNoticePartial({ priority: 886, message: "Unable to find/load linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                            else if (taFileContent.length < 10)
                                addNoticePartial({ priority: 884, message: "Linked TA article seems empty", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                            else if (checkingOptions?.disableLinkedTAArticlesCheckFlag !== true) {
                                // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTAArticlesCheckFlag} so checking TA article: ${filepath}`);
                                // functionLog(`checkNotesLinksToOutside needs to check TA article: ${filepath}`);
                                const checkTAFileResult = await checkMarkdownFileContents(username, foundLanguageCode, 'TA', filepath, taFileContent, ourLocation, checkingOptions);
                                for (const noticeObject of checkTAFileResult.noticeList) {
                                    // Why don’t we use addNoticePartial() here? (It adds bookID and fieldName.) Maybe it would be misleading???
                                    if (noticeObject.repoCode === undefined) {
                                        // debugLog(`checkMarkdownText 554 added rC=TA to ${JSON.stringify(noticeObject)}`);
                                        noticeObject.repoCode = 'TA';
                                    }
                                    // else if (noticeObject.repoCode !== 'TA') debugLog(`checkMarkdownText 554 DIDN'T ADD rC=TA to ${JSON.stringify(noticeObject)}`);
                                    ctarResult.noticeList.push({ ...noticeObject, username: taRepoUsername, repoName: taRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TA' });
                                }
                                ctarResult.checkedFileCount += 1;
                                ctarResult.checkedFilenames.push(filepath);
                                ctarResult.checkedFilesizes = taFileContent.length;
                                ctarResult.checkedFilenameExtensions = ['md'];
                                ctarResult.checkedRepoNames.push(taRepoName);
                            }
                        }
                    }
                markAsChecked(taPathParameters); // don’t bother waiting for the result of this async call
            }
        }
    }

    // Check for external TW links like [[rc://en/tw/dict/bible/other/death]] in TN or rc://en/tw/dict/bible/other/death in TWLinks
    //  (These are not nearly as many as TA links.)
    const ourTWRegex = (fieldName === 'TWLink') ? TWL_RAW_LINK_REGEX : TW_DOUBLE_BRACKETED_LINK_REGEX;
    // if (fieldText.indexOf('brother') !== -1) debugLog(`checkNotesLinksToOutside: ${bookID} ${givenC}:${givenV} Search for TW links with ${ourTWRegex}`)
    while ((regexMatchObject = ourTWRegex.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside ${languageCode} ${repoCode} ${fieldName} ${givenC}:${givenV} found TW resultArray=${JSON.stringify(regexMatchObject)}`);
        // twLinkCount2 += 1;
        logicAssert(regexMatchObject.length === 4, `TW_REGEX expected 4 fields (not ${regexMatchObject.length})`)
        let [totalLink, foundLanguageCode, category, article] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (!foundLanguageCode || foundLanguageCode === '*') foundLanguageCode = defaultLanguageCode;
        const twRepoName = `${foundLanguageCode}_tw`;
        // debugLog(`Got twRepoName=${twRepoName}`);
        const filename = `${article.trim()}.md`;
        const filepath = `bible/${category}/${filename}`;
        // debugLog(`Got tW filepath=${filepath}`);

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            // if (article === 'brother') debugLog(`Need to check ${fieldName} TW link ${regexMatchObject} against ${twRepoName}`);
            const twPathParameters = { username: twRepoUsername, repository: twRepoName, path: filepath, branch: twRepoBranch };
            if (!await alreadyChecked(twPathParameters)) {
                if (checkingOptions?.disableLinkedTWArticlesCheckFlag === true) {
                    // New code
                    // We don't need/want to check the actual article, so we don't need to fetch it
                    // However, we still want to know if the given link actually links to an article
                    //  so we'll check it against the tree listing from DCS
                    if (!await isFilepathInRepoTree(twPathParameters))
                        addNoticePartial({ priority: 883, message: "Unable to find linked TW article", details: `${twRepoUsername} ${twRepoName} ${twRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                }
                else
                    if (!await alreadyChecked(twPathParameters)) {
                        let twFileContent;
                        try {
                            twFileContent = await getFile_(twPathParameters);
                            // if (article === 'brother') debugLog(`Fetched fileContent for ${JSON.stringify(twPathParameters)}: ${typeof twFileContent} ${twFileContent.length}`);
                        } catch (trcGCerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                            console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TW ${twRepoUsername} ${twRepoName}, ${filepath}, ${twRepoBranch}: ${trcGCerror.message}`);
                            addNoticePartial({ priority: 882, message: `Error loading TW article`, details: `${twRepoUsername} ${twRepoName} ${twRepoBranch} ${filepath}: ${trcGCerror}`, excerpt: totalLink, location: ourLocation });
                        }
                        if (!twFileContent)
                            addNoticePartial({ priority: 883, message: "Unable to find/load linked TW article", details: `${twRepoUsername} ${twRepoName} ${twRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                        else { // we got the content of the TW article
                            if (twFileContent.length < 10)
                                addNoticePartial({ priority: 881, message: `TW article seems empty`, details: `${twRepoUsername} ${twRepoName} ${twRepoBranch} ${filepath}`, excerpt: totalLink, location: ourLocation });
                            else if (checkingOptions?.disableLinkedTWArticlesCheckFlag !== true) {
                                // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTWArticlesCheckFlag} so checking TW article: ${filepath}`);
                                // functionLog(`checkNotesLinksToOutside needs to check TW article: ${filepath}`);
                                // NOTE: repoCode is the caller's repo code in the line below
                                const checkTWFileResult = await checkMarkdownFileContents(username, foundLanguageCode, 'TW', `${filename}`, twFileContent, ourLocation, checkingOptions);
                                for (const noticeObject of checkTWFileResult.noticeList) {
                                    // Why don’t we use addNoticePartial() here? (It adds bookID and fieldName.) Maybe it would be misleading???
                                    if (noticeObject.repoCode === undefined) {
                                        // debugLog(`checkMarkdownText 600 added rC=TW to ${JSON.stringify(noticeObject)}`);
                                        noticeObject.repoCode = 'TW';
                                    }
                                    // else if (noticeObject.repoCode !== 'TW') debugLog(`checkMarkdownText 600 DIDN'T ADD rC=TW to ${JSON.stringify(noticeObject)}`);
                                    ctarResult.noticeList.push({ ...noticeObject, username: twRepoUsername, repoName: twRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TW' });
                                }
                                ctarResult.checkedFileCount += 1;
                                ctarResult.checkedFilenames.push(filename);
                                ctarResult.checkedFilesizes = twFileContent.length;
                                ctarResult.checkedFilenameExtensions = ['md'];
                                ctarResult.checkedRepoNames.push(twRepoName);
                            }
                        }
                    }
                markAsChecked(twPathParameters); // don’t bother waiting for the result of this async call
                // else debugLog("checkNotesLinksToOutside: disableLinkedTWArticlesCheckFlag is set to TRUE!");
            }
        }
        // else debugLog("checkNotesLinksToOutside: disableAllLinkFetchingFlag is set to TRUE!");
    }

    // debugLog("checkNotesLinksToOutside: Search for TN links")
    // Check for other book Bible links like [Genesis 29:23](rc://en/tn/help/gen/29/23) or [Leviticus 11:44–45](rc://en/tn/help/lev/11/44)
    while ((regexMatchObject = TN_FULL_HELP_CV_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TN_FULL_HELP_CV_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // otherBookBibleLinkCount1 += 1; // TODO: What should this really be?
        logicAssert(regexMatchObject.length === 9, `TN_FULL_HELP_CV_REGEX expected 9 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, Lg, B2, C2, V2] = regexMatchObject;
        // debugLog(`Lg='${Lg}' B2='${B2}' C2='${C2}' V2='${V2}'`);
        processedLinkList.push(totalLink); // Save the full link

        if (Lg !== '*' && Lg !== languageCode)
            addNoticePartial({ priority: 669, message: "Unexpected language code in link", details: `resource language code is ‘${languageCode}’`, excerpt: Lg, location: ourLocation });

        if (optionalN1) {
            logicAssert(optionalB1, `Should have book name as well as number '${optionalN1}' in '${totalLink}'`);
        }
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial(optionalB1 === 'Song of Solomon' ?
                        { priority: 43, message: "Unexpected Bible book name in TN RC link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: optionalB1, location: ourLocation } :
                        { priority: 143, message: "Unknown Bible book name in TN RC link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown TN link don’t match", details: `${C1} vs ${linkChapterInt}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link CheckA couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        try {
            if (ourParseInt(V1) !== linkVerseInt)
                addNoticePartial({ priority: 742, message: "Verse numbers of markdown TN link don’t match", details: `${V1} vs ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });
        } catch (vvError) {
            console.error(`TN Link CheckA couldn’t compare verse numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1}:${V1} from '${fieldText}': ${vvError}`);
        }

        if (linkBookCode === 'obs') {
            const numStories = 50, numFramesThisStory = 99;
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numStories)
                addNoticePartial({ priority: 655, message: "Bad story number in markdown OBS help link", details: `${linkBookCode} ${linkChapterInt} vs ${numStories} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numFramesThisStory)
                addNoticePartial({ priority: 653, message: "Bad frame number in markdown OBS help link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numFramesThisStory} verses`, excerpt: totalLink, location: ourLocation });
        } else if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `TN_FULL_HELP_CV_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside1 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown TN help link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown TN help link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        } else
            debugLog(`Seems TN_FULL_HELP_CV_REGEX '${totalLink}' didn’t have a link book code!`);
    }
    while ((regexMatchObject = TN_FULL_HELP_C_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TN_FULL_HELP_C_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // otherBookBibleLinkCount1 += 1; // TODO: What should this really be?
        logicAssert(regexMatchObject.length === 8, `TN_FULL_HELP_C_REGEX expected 8 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, optionalB1, C1, Lg, B2, C2, V2] = regexMatchObject;
        // debugLog(`Lg='${Lg}' B2='${B2}' C2='${C2}' V2='${V2}'`);
        processedLinkList.push(totalLink); // Save the full link

        if (Lg !== '*' && Lg !== languageCode)
            addNoticePartial({ priority: 669, message: "Unexpected language code in link", details: `resource language code is '${languageCode}’`, excerpt: Lg, location: ourLocation });

        if (optionalN1) {
            logicAssert(optionalB1, `Should have book name as well as number '${optionalN1}' in '${totalLink}'`);
        }
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial(optionalB1 === 'Song of Solomon' ?
                        { priority: 43, message: "Unexpected Bible book name in TN RC link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: optionalB1, location: ourLocation } :
                        { priority: 143, message: "Unknown Bible book name in TN RC link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = B2 === '..' ? bookID : B2;

        const linkChapterInt = ourParseInt(C2), linkVerseInt = ourParseInt(V2);
        try {
            if (ourParseInt(C1) !== linkChapterInt)
                addNoticePartial({ priority: 743, message: "Chapter numbers of markdown TN link don’t match", details: `${C1} vs ${linkChapterInt}`, excerpt: totalLink, location: ourLocation });
        } catch (ccError) {
            console.error(`TN Link CheckA couldn’t compare chapter numbers for ${bookID} ${givenC}:${givenV} ${fieldName} with ${C1} from '${fieldText}': ${ccError}`);
        }
        if (linkVerseInt !== 1)
            addNoticePartial({ priority: 729, message: "Expected verse one for whole chapter link", details: `not verse ${linkVerseInt}`, excerpt: totalLink, location: ourLocation });

        if (linkBookCode === 'obs') {
            const numStories = 50;
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numStories)
                addNoticePartial({ priority: 655, message: "Bad story number in markdown OBS help link", details: `${linkBookCode} ${linkChapterInt} vs ${numStories} chapters`, excerpt: totalLink, location: ourLocation });
        } else if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `TN_FULL_HELP_C_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside1 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown TN help link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
        } else
            debugLog(`Seems TN_FULL_HELP_C_REGEX '${totalLink}' didn’t have a link book code!`);
    }

    // debugLog("checkNotesLinksToOutside: Search for Bible links")
    // Check for this-chapter Bible links like [Revelation 3:11](./11.md)
    while ((regexMatchObject = BIBLE_REGEX_THIS_CHAPTER_RELATIVE.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_REGEX_THIS_CHAPTER_RELATIVE regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // thisChapterBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 6, `BIBLE_REGEX_THIS_CHAPTER_RELATIVE expected 6 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, V2] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) {
            logicAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        }
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial(optionalB1 === 'Song of Solomon' ?
                        { priority: 43, message: "Unexpected Bible book name in Bible link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: optionalB1, location: ourLocation } :
                        { priority: 143, message: "Unknown Bible book name in Bible link", details: totalLink, excerpt: optionalB1, location: ourLocation });
            }
        }

        let linkBookCode = bookID;

        const linkVerseInt = ourParseInt(V2);
        if (C1 === undefined) {
            if (linkBookCode.length === 0 || !books.isOneChapterBook(linkBookCode)) {
                // debugLog(`  checkNotesLinksToOutside C1 missing in BIBLE_REGEX_THIS_CHAPTER_RELATIVE regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_REGEX_THIS_CHAPTER_RELATIVE linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside2 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, givenCint);
            } catch (tlcNVerror) { }
            if (!givenCint || givenCint < 1 || givenCint > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${givenCint} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${givenCint}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-verse Bible links like [11](../03/11.md)
    while ((regexMatchObject = THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // thisVerseBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 4, `THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX expected 4 fields (not ${regexMatchObject.length})`);
        let [totalLink, V1, C2, V2] = regexMatchObject;
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `THIS_VERSE_TO_THIS_CHAPTER_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside3 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-verse Bible links like [11](../03/11.md)
    while ((regexMatchObject = THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // thisVerseBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 5, `THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX expected 5 fields (not ${regexMatchObject.length})`);
        let [totalLink, V1a, V1b, C2, V2] = regexMatchObject;
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `THIS_VERSE_RANGE_TO_THIS_CHAPTER_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside4 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11](../03/11.md)
    while ((regexMatchObject = BIBLE_REGEX_THIS_BOOK_RELATIVE.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_REGEX_THIS_BOOK_RELATIVE regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // thisBookBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 7, `BIBLE_REGEX_THIS_BOOK_RELATIVE expected 7 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1, C2, V2] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) {
            logicAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        }
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial(optionalB1 === 'Song of Solomon' ?
                        { priority: 43, message: "Unexpected Bible book name in relative Bible link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: optionalB1, location: ourLocation } :
                        { priority: 143, message: "Unknown Bible book name in relative Bible link", details: totalLink, excerpt: optionalB1, location: ourLocation });
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_REGEX_THIS_BOOK_RELATIVE linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside5 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for other-book Bible links like [Revelation 3:11-12](../rev/03/11.md)
    while ((regexMatchObject = BCV_V_TO_OTHER_BOOK_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BCV_V_TO_OTHER_BOOK_BIBLE_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // thisBookBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 9, `BCV_V_TO_OTHER_BOOK_BIBLE_REGEX expected 9 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, B1, C1, V1a, V1b, B2, C2, V2] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) {
            logicAssert(B1.length, `Should have book name as well as number '${optionalN1}'`);
        }
        B1 = `${optionalN1}${B1}`.trim(); // e.g., 1 Timothy
        dataAssert(B1.length, `BCV_V_TO_OTHER_BOOK_BIBLE_REGEX should have B1 with '${totalLink}'`);
        if (defaultLanguageCode === 'en') { // should be able to check the book name
            const checkResult = books.isGoodEnglishBookName(B1);
            // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
            if (checkResult === undefined || checkResult === false)
                addNoticePartial(B1 === 'Song of Solomon' ?
                    { priority: 43, message: "Unexpected Bible book name in Bible link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: B1, location: ourLocation } :
                    { priority: 143, message: "Unknown Bible book name in Bible link", details: totalLink, excerpt: B1, location: ourLocation });
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BCV_V_TO_OTHER_BOOK_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside6 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11-12](../03/11.md)
    while ((regexMatchObject = BCV_V_TO_THIS_BOOK_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BCV_V_TO_THIS_BOOK_BIBLE_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // thisBookBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 9, `BCV_V_TO_THIS_BOOK_BIBLE_REGEX expected 9 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1a, V1b, B2, C2, V2] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) {
            logicAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        }
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial(optionalB1 === 'Song of Solomon' ?
                        { priority: 43, message: "Unexpected Bible book name in Bible link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: optionalB1, location: ourLocation } :
                        { priority: 143, message: "Unknown Bible book name in Bible link", details: totalLink, excerpt: optionalB1, location: ourLocation });
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BCV_V_TO_THIS_BOOK_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside6 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for this-book Bible links like [Revelation 3:11-12](../03/11.md)
    while ((regexMatchObject = BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // thisChapterBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 7, `BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX expected 7 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, optionalB1, C1, V1a, V1b, V2] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) {
            logicAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        }
        if (optionalB1) {
            optionalB1 = `${optionalN1}${optionalB1}`.trim(); // e.g., 1 Timothy
            if (defaultLanguageCode === 'en') { // should be able to check the book name
                const checkResult = books.isGoodEnglishBookName(optionalB1);
                // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
                if (checkResult === undefined || checkResult === false)
                    addNoticePartial(optionalB1 === 'Song of Solomon' ?
                        { priority: 43, message: "Unexpected Bible book name in Bible link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: optionalB1, location: ourLocation } :
                        { priority: 143, message: "Unknown Bible book name in Bible link", details: totalLink, excerpt: optionalB1, location: ourLocation });
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BCV_V_TO_THIS_CHAPTER_BIBLE_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            // try {
            //     numChaptersThisBook = books.chaptersInBook(linkBookCode);
            // } catch (tlcNCerror) { }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, givenC);
            } catch (tlcNVerror) { }
            if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${givenC}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for other book Bible links like [Revelation 3:11](rev/03/11.md)
    while ((regexMatchObject = BIBLE_REGEX_OTHER_BOOK_ABSOLUTE.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_REGEX_OTHER_BOOK_ABSOLUTE regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // otherBookBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 8, `BIBLE_REGEX_OTHER_BOOK_ABSOLUTE expected 8 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, B1, C1, V1, B2, C2, V2] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) {
            logicAssert(B1.length, `Should have book name as well as number '${optionalN1}'`);
        }
        B1 = `${optionalN1}${B1}`.trim(); // e.g., 1 Timothy
        dataAssert(B1.length, `BIBLE_REGEX_OTHER_BOOK_ABSOLUTE should have B1 with '${totalLink}'`);
        if (defaultLanguageCode === 'en') { // should be able to check the book name
            const checkResult = books.isGoodEnglishBookName(B1);
            // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
            if (checkResult === undefined || checkResult === false)
                addNoticePartial(B1 === 'Song of Solomon' ?
                    { priority: 43, message: "Unexpected Bible book name in Bible link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: B1, location: ourLocation } :
                    { priority: 143, message: "Unknown Bible book name in Bible link", details: totalLink, excerpt: B1, location: ourLocation });
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_REGEX_OTHER_BOOK_ABSOLUTE linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside8 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for other book Bible links like [Revelation 3:11](../../rev/03/11.md)
    while ((regexMatchObject = BIBLE_REGEX_OTHER_BOOK_RELATIVE.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside BIBLE_REGEX_OTHER_BOOK_RELATIVE regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // otherBookBibleLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 8, `BIBLE_REGEX_OTHER_BOOK_RELATIVE expected 8 fields (not ${regexMatchObject.length})`);
        let [totalLink, optionalN1, B1, C1, V1, B2, C2, V2] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) {
            logicAssert(B1.length, `Should have book name as well as number '${optionalN1}'`);
        }
        B1 = `${optionalN1}${B1}`.trim(); // e.g., 1 Timothy
        dataAssert(B1.length, `BIBLE_REGEX_OTHER_BOOK_RELATIVE should have B1 with '${totalLink}'`);
        if (defaultLanguageCode === 'en') { // should be able to check the book name
            const checkResult = books.isGoodEnglishBookName(B1);
            // debugLog(optionalB1, "isGoodEnglishBookName checkResult", checkResult);
            if (checkResult === undefined || checkResult === false)
                addNoticePartial(B1 === 'Song of Solomon' ?
                    { priority: 43, message: "Unexpected Bible book name in Bible link", details: `expected 'Song of Songs' in ${totalLink}`, excerpt: B1, location: ourLocation } :
                    { priority: 143, message: "Unknown Bible book name in Bible link", details: totalLink, excerpt: B1, location: ourLocation });
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `BIBLE_REGEX_OTHER_BOOK_RELATIVE linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside9 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 655, message: "Bad chapter number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 653, message: "Bad verse number in markdown Bible link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for TN links like [Titus 3:11](../03/11/zd2d)
    while ((regexMatchObject = TN_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside TN_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // TNLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 9, `TN_REGEX expected 9 fields (not ${regexMatchObject.length})`);
        // eslint-disable-next-line no-unused-vars
        let [totalLink, optionalN1, optionalB1, C1, V1, B2, C2, V2, _noteID2] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (optionalN1) {
            logicAssert(optionalB1, `Should have book name as well as number '${optionalN1}'`);
        }
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

        if (linkBookCode.length) { // then we know which Bible book this link is to
            // So we can check for valid C:V numbers
            let numChaptersThisBook, numVersesThisChapter;
            logicAssert(linkBookCode.toLowerCase() !== 'obs', `TN_REGEX linkBookCode shouldn’t be '${linkBookCode}' in notes-links-check`);
            try {
                numChaptersThisBook = books.chaptersInBook(linkBookCode);
            } catch (tlcNCerror) {
                debugLog(`checkNotesLinksToOutside10 with linkBookCode '${linkBookCode}' got error: ${tlcNCerror}`);
                numChaptersThisBook = 0;
            }
            try {
                numVersesThisChapter = books.versesInChapter(linkBookCode, linkChapterInt);
            } catch (tlcNVerror) { }
            if (!linkChapterInt || linkChapterInt < 1 || linkChapterInt > numChaptersThisBook)
                addNoticePartial({ priority: 656, message: "Bad chapter number in markdown TN link", details: `${linkBookCode} ${linkChapterInt} vs ${numChaptersThisBook} chapters`, excerpt: totalLink, location: ourLocation });
            else if (!linkVerseInt || linkVerseInt < 0 || linkVerseInt > numVersesThisChapter)
                addNoticePartial({ priority: 654, message: "Bad verse number in markdown TN link", details: `${linkBookCode} ${linkChapterInt}:${linkVerseInt} vs ${numVersesThisChapter} verses`, excerpt: totalLink, location: ourLocation });
        }

        // TODO: We should see if we can find the correct note
    }

    if (repoCode.startsWith('OBS-')) {
        // Check for OBS links like [03:04](03/04)
        while ((regexMatchObject = OBS_LINK_REGEX.exec(fieldText))) {
            // debugLog(`  checkNotesLinksToOutside OBS_LINK_REGEX resultArray=${JSON.stringify(regexMatchObject)}`);
            // OBSLinkCount += 1;
            logicAssert(regexMatchObject.length === 5, `OBS_LINK_REGEX expected 5 fields (not ${regexMatchObject.length})`)
            // eslint-disable-next-line no-unused-vars
            let [totalLink, storyNumberA, frameNumberA, storyNumberB, frameNumberB] = regexMatchObject;
            processedLinkList.push(totalLink); // Save the full link

            const storyIntA = ourParseInt(storyNumberA), frameIntA = ourParseInt(frameNumberA);
            const storyIntB = ourParseInt(storyNumberB), frameIntB = ourParseInt(frameNumberB);
            if (storyIntA !== storyIntB || frameIntA !== frameIntB)
                addNoticePartial({ priority: 731, message: `OBS link has internal mismatch`, details: `${storyNumberA}:${frameNumberA} should equal ${storyNumberB}/${frameNumberA}`, excerpt: totalLink, location: ourLocation });
            else {
                if (storyIntB < 1 || storyIntB > NUM_OBS_STORIES || frameIntB < 1 || frameIntB > MAX_OBS_FRAMES)
                    addNoticePartial({ priority: 730, message: `OBS link has out-of-range values`, details: `${NUM_OBS_STORIES} stories, max of ${MAX_OBS_FRAMES} frames`, excerpt: `${storyNumberA}/${frameNumberA}`, location: ourLocation });
            }
            // const OBSRepoName = `${defaultLanguageCode}_obs`;
            // // debugLog(`Got taRepoName=${taRepoName}`);
            // let TAsection = 'translate';
            // if (fieldName.startsWith('checking/')) TAsection = 'checking';
            // else if (fieldName.startsWith('process/')) TAsection = 'process';
            // if (fieldName.startsWith('intro/')) TAsection = 'intro';
            // dataAssert(TAsection === 'translate' || TAsection === 'checking' || TAsection === 'process' || TAsection === 'intro', `Unexpected TA section name = '${TAsection}'`);
            // const filepath = `${TAsection}/${article}/01.md`; // Other files are title.md, sub-title.md
            // // debugLog(`checkNotesLinksToOutside OBS_LINK_REGEX got tA filepath=${filepath}`);

            /*
            if (!checkingOptions?.disableAllLinkFetchingFlag) {
                // debugLog(`checkNotesLinksToOutside OBS_LINK_REGEX need to check ${filepath} against ${taRepoName}`);
                const taPathParameters = { username: taRepoUsername, repository: taRepoName, path: filepath, branch: taRepoBranch };
                let taFileContent, alreadyGaveError = false;
                try {
                    taFileContent = await getFile_(taPathParameters);
                    // debugLog("Fetched fileContent for", taRepoName, filepath, typeof fileContent, fileContent.length);
                } catch (trcGCerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                    console.error(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load TA for '${taRepoUsername}', '${taRepoName}', '${filepath}', '${taRepoBranch}', ${trcGCerror.message}`);
                    addNoticePartial({ priority: 885, message: `Error loading TA article`, details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: `${ourLocation} ${filepath}: ${trcGCerror}` });
                    alreadyGaveError = true;
                }
                if (!alreadyGaveError) {
                    if (!taFileContent)
                        addNoticePartial({ priority: 886, message: "Unable to find/load linked TA article", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                    else if (taFileContent.length < 10)
                        addNoticePartial({ priority: 884, message: "Linked TA article seems empty", details: `${taRepoUsername} ${taRepoName} ${taRepoBranch} ${filepath}`, excerpt: totalLink, location: `${ourLocation} ${filepath}` });
                    // Don’t do this or it gets infinite recursion!!!
                    // else if (checkingOptions?.disableLinkedTAArticlesCheckFlag !== true) {
                    //     // functionLog(`checkNotesLinksToOutside got ${checkingOptions?.disableLinkedTAArticlesCheckFlag} so checking TA article: ${filepath}`);
                    //     if (!await alreadyChecked(taPathParameters)) {
                    //         // functionLog(`checkNotesLinksToOutside needs to check TA article: ${filepath}`);
                    //         const checkTAFileResult = await checkMarkdownFileContents(username, languageCode, repoCode, `TA ${article.trim()}/01.md`, taFileContent, ourLocation, checkingOptions);
                    //         for (const noticeObject of checkTAFileResult.noticeList)
                    //             ctarResult.noticeList.push({ ...noticeObject, username: taRepoUsername, repoCode: 'TA', repoName: taRepoName, filename: filepath, location: ` linked to${ourLocation}`, extra: 'TA' });
                    //         ctarResult.checkedFileCount += 1;
                    //         ctarResult.checkedFilenames.push(`${article.trim()}/01.md`);
                    //         ctarResult.checkedFilesizes = taFileContent.length;
                    //         ctarResult.checkedFilenameExtensions = ['md'];
                    //         ctarResult.checkedRepoNames.push(taRepoName);
                    //         markAsChecked(taPathParameters); // don’t bother waiting for the result of this async call
                    //     }
                    // }
                } */
        }
    }

    // Check for simple display links like [ULT](https://something)
    // if (fieldText.indexOf('http') !== -1) debugLog(`Checking for http links in '${fieldName}' '${fieldText}'`);
    while ((regexMatchObject = SIMPLE_DISPLAY_LINK_REGEX.exec(fieldText))) {
        // debugLog(`  checkNotesLinksToOutside SIMPLE_DISPLAY_LINK_REGEX regexMatchObject(${regexMatchObject.length})=${JSON.stringify(regexMatchObject)}`);
        // generalLinkCount1 += 1;
        logicAssert(regexMatchObject.length === 3, `SIMPLE_DISPLAY_LINK_REGEX expected 3 fields (not ${regexMatchObject.length})`);
        // eslint-disable-next-line no-unused-vars
        let [totalLink, displayText, uri] = regexMatchObject;
        processedLinkList.push(totalLink); // Save the full link

        if (!checkingOptions?.disableAllLinkFetchingFlag) {
            const dummyPathParameters = { username: uri, repository: '', path: '', branch: '' };
            if (!await alreadyChecked(dummyPathParameters)) {
                // debugLog(`checkNotesLinksToOutside general link check needs to check: ${uri}`);
                // Set as checked so that we only check this particular URL once
                markAsChecked(dummyPathParameters); // don’t bother waiting for the result of this async call

                const serverString = uri.replace('://', '!!!').split('/')[0].replace('!!!', '://').toLowerCase(); // Get the bit before any forward slashes
                const isUW = serverString.endsWith('door43.org') || serverString.endsWith('unfoldingword.org') || serverString.endsWith('ufw.io');
                // debugLog(`checkNotesLinksToOutside general link check needs to check: ${uri} on server ${serverString}`);

                jQuery.ajax({
                    // Calling this way seems to avoid CORS (cross-origin) issues (although they still appear in the console)
                    // See https://stackoverflow.com/questions/59116711/how-to-check-or-validate-if-url-exists-cors-error-returned
                    url: uri,
                    dataType: 'text',
                    statusCode: {
                        // 200: function () {
                        //     console.log(`Status code 200 OK returned for ${uri}`);
                        // },
                        404: function () {
                            console.log(`Status code 404 NOT FOUND returned for ${uri}`);
                            addNoticePartial({ priority: isUW ? 782 : 182, message: `Error loading link`, details: "please double-check link—there may be no problem", excerpt: totalLink, location: ourLocation });
                        }
                    },
                    success: function (data) {
                        // console.log(`Received ${data.length} bytes for ${uri}`);
                        if (data.length < 10)
                            addNoticePartial({ priority: isUW ? 781 : 181, message: "Linked web page seems empty", excerpt: totalLink, location: ourLocation });
                    },
                    error: function (ts) {
                        if (ts.responseText) console.log(`Error for ${uri} is '${ts.responseText}'`);
                    }
                });
                /* Re-written as above 20Sep2021
                // NOTE: These message strings must match RenderProcessedResults.js
            let fetchedFileContent, hadError = false;
            // Don’t try to fetch general links
            // addNoticePartial({ priority: 32, message: `Untested general/outside link`, details: "please manually double-check link—probably no problem", excerpt: totalLink, location: ourLocation });
        } else { // Try to fetch uW links
            try {
                // generalFileContent = await cachedGetFileUsingFullURL({ uri });
                // debugLog(`${displayText} ${uri} got: (${generalFileContent.length}) ${generalFileContent.slice(0, 10)}...`);
                // debugLog(`uri='${uri}', serverString='${serverString}'`);
                // NOTE: The following line (with or without the mode) doesn’t help -- actually makes things slightly worse
                // const response = await fetch(uri, {headers:{'Access-Control-Allow-Origin': serverString}});
                // const response = await fetch(uri, {mode: 'cors'});
                // const response = await fetch(uri, {mode: 'cors', headers:{'Access-Control-Allow-Origin': serverString}});
                const response = await fetch(uri);
                if (response.ok) {// if HTTP-status is 200-299
                    fetchedFileContent = await response.text();
                    // debugLog(`General link ${displayText} @ ${uri} got: (${generalFileContent.length}) ${generalFileContent.slice(0, 10)}...`);
                } else throw new Error(`Our Network error: ${response.statusCode}`);
            } catch (trcGCerror) {
                // debugLog(`checkNotesLinksToOutside(${bookID}, ${fieldName}, …) failed to load general ${uri}: ${trcGCerror}`);
                // TODO: Put back up to 882 if we can solve cross-origin (CORS) problems
                jQuery.ajax({ // try again without CORS checking
                    url: uri,
                    dataType: 'text',
                    statusCode: {
                        200: function () {
                            console.log(`Status code 200 OK returned for uW ${uri}`);
                        },
                        404: function () {
                            console.log(`Status code 404 NOT FOUND returned for uW ${uri}`);
                            addNoticePartial({ priority: 82, message: `Error loading unfoldingWord link`, details: "please double-check link—there may be no problem", excerpt: totalLink, location: ourLocation });
                            hadError = true;
                        }
                    },
                    success: function(data) {
                        console.log(`Got ${data.length} bytes for uW ${uri}`);
                        fetchedFileContent = data;
                    },
                    error: function (ts) {
                        if (ts.responseText) console.log(`Error for uW ${uri} is '${ts.responseText}'`);
                    }
                });
                // addNoticePartial({ priority: 82, message: `Error loading unfoldingWord link`, details: "please double-check link—there may be no problem", excerpt: totalLink, location: `${ourLocation}: ${trcGCerror}` });
                // hadError = true;
            }
            if (!hadError && !fetchedFileContent)
                addNoticePartial({ priority: 783, message: "Unable to find/load unfoldingWord link", excerpt: totalLink, location: ourLocation });
            else if (fetchedFileContent) { // we got the content of the general article
                if (fetchedFileContent.length < 10)
                    addNoticePartial({ priority: 781, message: "Linked unfoldingWord article seems empty", excerpt: totalLink, location: ourLocation });
            }
        }
        */
                // markAsChecked(dummyPathParameters); // don’t bother waiting for the result of this async call
            }
            // else debugLog(`Had already checked '${displayText}' ${uri}`);

            if (uri.startsWith('http:'))
                addNoticePartial({ priority: 152, message: "Should http link be https", excerpt: totalLink, location: ourLocation });
        }
    }

    // Check for additional links that we can’t explain
    // if (processedLinkList.length || singlePartLinksList.length || doublePartLinksList.length) {
    //     debugLog(`processedLinkList (${processedLinkList.length}) = ${JSON.stringify(processedLinkList)}`);
    //     if (singlePartLinksList.length) {
    //         debugLog(`   ${thisChapterBibleLinkCount1? 'thisChapterBibleLinkCount1='+thisChapterBibleLinkCount1:''} ${thisVerseBibleLinkCount1?'thisVerseBibleLinkCount1='+thisVerseBibleLinkCount1:''} ${thisBookBibleLinkCount1?'thisBookBibleLinkCount1='+thisBookBibleLinkCount1:''} ${otherBookBibleLinkCount1?'otherBookBibleLinkCount1='+otherBookBibleLinkCount1:''} ${TNLinkCount1?'TNLinkCount1='+TNLinkCount1:''} ${twLinkCount1?'twLinkCount1='+twLinkCount1:''} ${taLinkCount1?'taLinkCount1='+taLinkCount1:''} ${generalLinkCount1?'generalLinkCount1='+generalLinkCount1:''}`);
    //         debugLog(`   singlePartLinksList (${singlePartLinksList.length}) = ${JSON.stringify(singlePartLinksList)}`);
    //     }
    //     if (doublePartLinksList.length) {
    //         debugLog(`   ${twLinkCount2?'twLinkCount2='+twLinkCount2:''} ${taLinkCount2?'taLinkCount2='+taLinkCount2:''}`);
    //         debugLog(`   doublePartLinksList (${doublePartLinksList.length}) = ${JSON.stringify(doublePartLinksList)}`);
    //     }
    // }
    // NOTE: This additional check using counts would fail if a link was found by more than one RegEx
    // const linkCount1 = thisChapterBibleLinkCount1 + thisVerseBibleLinkCount1 + thisBookBibleLinkCount1 + otherBookBibleLinkCount1 + TNLinkCount1 + twLinkCount1 + taLinkCount1 + generalLinkCount1;
    // if (totalLinks1 > linkCount1) {
    const singlePartLeftoverLinksList = singlePartLinksList.filter(x => !processedLinkList.includes(x)); // Delete links that we processed above
    if (singlePartLeftoverLinksList.length)
        // if (singlePartLeftoverLinksList.length) debugLog(`'${languageCode}', ${repoCode}, '${bookID}', '${fieldName}' processedLinkList (${processedLinkList.length}) = ${JSON.stringify(processedLinkList)}\n        singlePartLinksList(${singlePartLinksList.length})=${JSON.stringify(singlePartLinksList)}\nsinglePartLeftoverLinksList(${singlePartLeftoverLinksList.length})=${JSON.stringify(singlePartLeftoverLinksList)}`);
        // if (singlePartLeftoverLinksList.length) debugLog(`'${languageCode}', ${repoCode}, '${bookID}', '${fieldName}' singlePartLeftoverLinksList (${singlePartLeftoverLinksList.length}) = ${JSON.stringify(singlePartLeftoverLinksList)}`);
        addNoticePartial({ priority: 648, message: "Unusual [ ]( ) link(s)—not a recognized Bible, OBS, or TA, TN, or TW link", details: `need to carefully check ${singlePartLeftoverLinksList.length === 1 ? '"' + singlePartLeftoverLinksList[0] + '"' : JSON.stringify(singlePartLeftoverLinksList)}`, location: ourLocation });
    // }
    // const linkCount2 = twLinkCount2 + taLinkCount2; // These are double-bracketed links, e.g., [[something]]
    // debugLog(`twLinkCount2 ${twLinkCount2} + taLinkCount2 ${taLinkCount2} = linkCount2 ${linkCount2}`);
    // if (totalLinks2 > linkCount2) {
    const doublePartLeftoverLinksList = doublePartLinksList.filter(x => !processedLinkList.includes(x)); // Delete links that we processed above
    if (doublePartLeftoverLinksList.length)
        // if (doublePartLeftoverLinksList.length) debugLog(`'${languageCode}', ${repoCode}, '${bookID}', '${fieldName}' processedLinkList (${processedLinkList.length}) = ${JSON.stringify(processedLinkList)}\n        doublePartLinksList(${doublePartLinksList.length})=${JSON.stringify(doublePartLinksList)}\ndoublePartLeftoverLinksList(${doublePartLeftoverLinksList.length})=${JSON.stringify(doublePartLeftoverLinksList)}`);
        // if (doublePartLeftoverLinksList.length) debugLog(`'${languageCode}', ${repoCode}, '${bookID}', '${fieldName}' doublePartLeftoverLinksList (${doublePartLeftoverLinksList.length}) = ${JSON.stringify(doublePartLeftoverLinksList)}`);
        addNoticePartial({ priority: 649, message: "Unusual [[ ]] link(s)—not a recognized TA or TW link", details: `need to carefully check ${doublePartLeftoverLinksList.length === 1 ? '"' + doublePartLeftoverLinksList[0] + '"' : JSON.stringify(doublePartLeftoverLinksList)}`, location: ourLocation });
    // }

    // Check for badly formed links (not processed by the above code)
    // Check for badly formed [[ ]] links
    let leftCount = countOccurrencesInString(fieldText, '[[');
    let rightCount = countOccurrencesInString(fieldText, ']]');
    if (leftCount !== rightCount)
        addNoticePartial({ priority: 845, message: `Mismatched [[ ]] link characters`, details: `left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });
    else {
        leftCount = countOccurrencesInString(fieldText, '[[rc://');
        if (leftCount !== rightCount)
            addNoticePartial({ priority: 844, message: `Mismatched [[rc:// ]] link characters`, details: `left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });
    }
    // Check for badly formed [ ]( ) links
    leftCount = countOccurrencesInString(fieldText, '[');
    const middleCount = countOccurrencesInString(fieldText, '](');
    rightCount = countOccurrencesInString(fieldText, ')');
    if (leftCount < middleCount || rightCount < middleCount)
        addNoticePartial({ priority: 843, message: `Mismatched [ ]( ) link characters`, details: `left=${leftCount.toLocaleString()}, middle=${middleCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });


    // functionLog(`checkNotesLinksToOutside is returning ${JSON.stringify(ctarResult)}`);
    return ctarResult;
}
// end of checkNotesLinksToOutside function
