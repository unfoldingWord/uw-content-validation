import { DEFAULT_EXTRACT_LENGTH, isWhitespace, countOccurrences } from './text-handling-functions'
import * as books from './books/books';
import { checkTextField } from './field-text-check';
import { checkMarkdownText } from './markdown-text-check';
import { checkSupportReferenceInTA } from './ta-reference-check';
import { checkTNLinksToOutside } from './tn-links-check';
import { checkOriginalLanguageQuote } from './orig-quote-check';
import { parameterAssert } from './utilities';


// const TN_TABLE_ROW_VALIDATOR_VERSION_STRING = '0.6.7';

const NUM_EXPECTED_TN_TSV_FIELDS = 9; // so expects 8 tabs per line
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

const LC_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const LC_ALPHABET_PLUS_DIGITS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN = 'abcdefghijklmnopqrstuvwxyz0123456789-';

const TA_REGEX = new RegExp('\\[\\[rc://[^ /]+?/ta/man/[^ /]+?/([^ \\]]+?)\\]\\]', 'g');


/**
 *
 * @description - Checks one TSV data row of translation notes (TN2)
 * @param {string} languageCode - the language code, e.g., 'en'
 * @param {string} annotationType - TN2, TQ2, TWL, SN, or SQ -- allows more specific checks
 * @param {string} line - the TSV line to be checked
 * @param {string} bookID - 3-character UPPERCASE USFM book identifier or 'OBS'
 * @param {string} givenC - chapter number or (for OBS) story number string
 * @param {string} givenV - verse number or (for OBS) frame number string
 * @param {string} givenRowLocation - description of where the line is located
 * @param {Object} checkingOptions - may contain extractLength, twRepoUsername, twRepoBranch (or tag), checkLinkedTWArticleFlag parameters
 * @return {Object} - containing noticeList
 */
export async function checkTN_TSVDataRow(languageCode, line, bookID, givenC, givenV, givenRowLocation, checkingOptions) {
    /* This function is only for checking one data row
          and the function doesn’t assume that it has any previous context.

        It’s designed to be able to quickly show errors for a single row being displayed/edited.

        Returns an object containing the noticeList.
    */
    // functionLog(`checkTN_TSVDataRow(${languageCode}, ${line}, ${bookID}, ${givenRowLocation}, ${JSON.stringify(checkingOptions)})…`);
    parameterAssert(languageCode !== undefined, "checkTN_TSVDataRow: 'languageCode' parameter should be defined");
    parameterAssert(typeof languageCode === 'string', `checkTN_TSVDataRow: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    parameterAssert(line !== undefined, "checkTN_TSVDataRow: 'line' parameter should be defined");
    parameterAssert(typeof line === 'string', `checkTN_TSVDataRow: 'line' parameter should be a string not a '${typeof line}'`);
    parameterAssert(bookID !== undefined, "checkTN_TSVDataRow: 'bookID' parameter should be defined");
    parameterAssert(typeof bookID === 'string', `checkTN_TSVDataRow: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    parameterAssert(bookID.length === 3, `checkTN_TSVDataRow: 'bookID' parameter should be three characters long not ${bookID.length}`);
    parameterAssert(bookID.toUpperCase() === bookID, `checkTN_TSVDataRow: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    parameterAssert(books.isValidBookID(bookID), `checkTN_TSVDataRow: '${bookID}' is not a valid USFM book identifier`);
    // parameterAssert(givenC !== undefined, "checkTN_TSVDataRow: 'givenC' parameter should be defined");
    if (givenC) parameterAssert(typeof givenC === 'string', `checkTN_TSVDataRow: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    // parameterAssert(givenV !== undefined, "checkTN_TSVDataRow: 'givenV' parameter should be defined");
    if (givenV) parameterAssert(typeof givenV === 'string', `checkTN_TSVDataRow: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    parameterAssert(givenRowLocation !== undefined, "checkTN_TSVDataRow: 'givenRowLocation' parameter should be defined");
    parameterAssert(typeof givenRowLocation === 'string', `checkTN_TSVDataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);

    let ourRowLocation = givenRowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    const linkCheckingOptions = { ...checkingOptions };
    linkCheckingOptions.taRepoLanguageCode = languageCode;

    let drResult = { noticeList: [] };

    /**
    * @description - adds a new notice entry, adding bookID,C,V to the given fields
    * @param {Number} priority - notice priority from 1 (lowest) to 999 (highest)
    * @param {string} message - the text of the notice message
    * @param {string} rowID - 4-character row ID field
    * @param {Number} lineNumber - one-based line number
    * @param {Number} characterIndex - zero-based index of where the issue occurs in the line
    * @param {string} extract - short extract from the line centred on the problem (if available)
    * @param {string} location - description of where the issue is located
    */
    function addNoticePartial(noticeObject) {
        // functionLog(`checkTN_TSVDataRow addNoticePartial(priority=${noticeObject.priority}) ${noticeObject.message}, ${noticeObject.characterIndex}, ${noticeObject.extract}, ${noticeObject.location}`);
        parameterAssert(noticeObject.priority !== undefined, "checkTN_TSVDataRow addNoticePartial: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `checkTN_TSVDataRow addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "checkTN_TSVDataRow addNoticePartial: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `checkTN_TSVDataRow addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(lineNumber !== undefined, "checkTN_TSVDataRow addNoticePartial: 'lineNumber' parameter should be defined");
        // parameterAssert(typeof lineNumber === 'number', `checkTN_TSVDataRow addNoticePartial: 'lineNumber' parameter should be a number not a '${typeof lineNumber}': ${lineNumber}`);
        // parameterAssert(characterIndex !== undefined, "checkTN_TSVDataRow addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `checkTN_TSVDataRow addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(extract !== undefined, "checkTN_TSVDataRow addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) parameterAssert(typeof noticeObject.extract === 'string', `checkTN_TSVDataRow addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        parameterAssert(noticeObject.location !== undefined, "checkTN_TSVDataRow addNoticePartial: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `checkTN_TSVDataRow addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        // noticeObject.debugChain = noticeObject.debugChain ? `checkTN_TSVDataRow ${noticeObject.debugChain}` : 'checkTN_TSVDataRow';
        // Also uses the given bookID,C,V, parameters from the main function call
        drResult.noticeList.push({ ...noticeObject, bookID, C: givenC, V: givenV });
    }

    /**
    * @description - checks the given markdown field and processes the returned results
    * @param {string} rowID - 4-character row ID field
    * @param {string} fieldName - name of the field being checked
    * @param {string} fieldText - the actual text of the field being checked
    * @param {} allowedLinks - true if links are allowed in the field, otherwise false
    * @param {string} rowLocation - description of where the line is located
    * @param {Object} checkingOptions - parameters that might affect the check
    */
    async function ourMarkdownTextChecks(rowID, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions) {
        // Does markdown checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // We don’t currently use the allowedLinks parameter

        // functionLog(`checkTN_TSVDataRow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        parameterAssert(rowID !== undefined, "checkTN_TSVDataRow ourMarkdownTextChecks: 'rowID' parameter should be defined");
        parameterAssert(typeof rowID === 'string', `checkTN_TSVDataRow ourMarkdownTextChecks: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        // parameterAssert(fieldName !== undefined, "checkTN_TSVDataRow ourMarkdownTextChecks: 'fieldName' parameter should be defined");
        // parameterAssert(typeof fieldName === 'string', `checkTN_TSVDataRow ourMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        parameterAssert(fieldName === 'OccurrenceNote', "checkTN_TSVDataRow ourMarkdownTextChecks: Only run this check on OccurrenceNotes")
        parameterAssert(fieldText !== undefined, "checkTN_TSVDataRow ourMarkdownTextChecks: 'fieldText' parameter should be defined");
        parameterAssert(typeof fieldText === 'string', `checkTN_TSVDataRow ourMarkdownTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        parameterAssert(allowedLinks === true || allowedLinks === false, "checkTN_TSVDataRow ourMarkdownTextChecks: allowedLinks parameter must be either true or false");
        parameterAssert(rowLocation !== undefined, "checkTN_TSVDataRow ourMarkdownTextChecks: 'rowLocation' parameter should be defined");
        parameterAssert(typeof rowLocation === 'string', `checkTN_TSVDataRow ourMarkdownTextChecks: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
        parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTN_TSVDataRow ourMarkdownTextChecks: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const omtcResultObject = await checkMarkdownText(languageCode, fieldName, fieldText, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(cmtResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of omtcResultObject.noticeList) {
            // parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourMarkdownTextChecks notice length=${Object.keys(noticeEntry).length}`);
            // NOTE: Ellipses in OccurrenceNote have the normal meaning
            //          not like the specialised meaning in the snippet fields OrigQuote and GLQuote
            if (noticeEntry.priority !== 178 && noticeEntry.priority !== 179 // unexpected space after ellipse, ellipse after space
                && !noticeEntry.message.startsWith("Unexpected … character after space") // 191
            )
                addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
        return omtcResultObject.suggestion; // There may or may not be one!
    }
    // end of ourMarkdownTextChecks function

    /**
    * @description - checks the given text field and processes the returned results
    * @param {string} rowID - 4-character row ID field
    * @param {string} fieldName - name of the field being checked
    * @param {string} fieldText - the actual text of the field being checked
    * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
    * @param {string} rowLocation - description of where the line is located
    * @param {Object} checkingOptions - parameters that might affect the check
    */
    function ourCheckTextField(rowID, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // functionLog(`checkTN_TSVDataRow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        parameterAssert(rowID !== undefined, "checkTN_TSVDataRow ourCheckTextField: 'rowID' parameter should be defined");
        parameterAssert(typeof rowID === 'string', `checkTN_TSVDataRow ourCheckTextField: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        parameterAssert(fieldName !== undefined, "checkTN_TSVDataRow ourCheckTextField: 'fieldName' parameter should be defined");
        parameterAssert(typeof fieldName === 'string', `checkTN_TSVDataRow ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        parameterAssert(fieldText !== undefined, "checkTN_TSVDataRow ourCheckTextField: 'fieldText' parameter should be defined");
        parameterAssert(typeof fieldText === 'string', `checkTN_TSVDataRow ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        parameterAssert(allowedLinks === true || allowedLinks === false, "checkTN_TSVDataRow ourCheckTextField: allowedLinks parameter must be either true or false");
        parameterAssert(rowLocation !== undefined, "checkTN_TSVDataRow ourCheckTextField: 'rowLocation' parameter should be defined");
        parameterAssert(typeof rowLocation === 'string', `checkTN_TSVDataRow ourCheckTextField: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
        parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTN_TSVDataRow ourCheckTextField: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const fieldType = fieldName === 'OccurrenceNote' ? 'markdown' : 'raw';
        const octfResultObject = checkTextField(fieldType, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of octfResultObject.noticeList) {
            // parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
        return octfResultObject.suggestion; // There may or may not be one!
    }
    // end of ourCheckTextField function

    /**
     *
     * @param {string} rowID
     * @param {string} fieldName
     * @param {string} taLinkText
     * @param {string} rowLocation
     * @param {Object} checkingOptions
     */
    async function ourCheckSupportReferenceInTA(rowID, fieldName, taLinkText, rowLocation, checkingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // functionLog(`checkTN_TSVDataRow ourCheckSupportReferenceInTA(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        parameterAssert(rowID !== undefined, "checkTN_TSVDataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be defined");
        parameterAssert(typeof rowID === 'string', `checkTN_TSVDataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        parameterAssert(fieldName !== undefined, "checkTN_TSVDataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be defined");
        parameterAssert(typeof fieldName === 'string', `checkTN_TSVDataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        parameterAssert(taLinkText !== undefined, "checkTN_TSVDataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be defined");
        parameterAssert(typeof taLinkText === 'string', `checkTN_TSVDataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);
        parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTN_TSVDataRow ourCheckSupportReferenceInTA: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const coqResultObject = await checkSupportReferenceInTA(fieldName, taLinkText, rowLocation, { ...checkingOptions, taRepoLanguageCode: languageCode });

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckSupportReferenceInTA notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckSupportReferenceInTA function


    /**
     *
     * @param {string} rowID
     * @param {string} fieldName
     * @param {string} fieldText
     * @param {string} occurrence
     * @param {string} rowLocation
     * @param {Object} checkingOptions
     */
    async function ourCheckTNOriginalLanguageQuote(rowID, fieldName, fieldText, occurrence, rowLocation, checkingOptions) {
        // Checks that the Hebrew/Greek quote can be found in the original texts

        // Uses the bookID,C,V values from the main function call

        // Updates the global list of notices

        // functionLog(`checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
        parameterAssert(rowID !== undefined, "checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'rowID' parameter should be defined");
        parameterAssert(typeof rowID === 'string', `checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        parameterAssert(fieldName !== undefined, "checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'fieldName' parameter should be defined");
        parameterAssert(typeof fieldName === 'string', `checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        parameterAssert(fieldText !== undefined, "checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be defined");
        parameterAssert(typeof fieldText === 'string', `checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        parameterAssert(occurrence !== undefined, "checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'occurrence' parameter should be defined");
        parameterAssert(typeof occurrence === 'string', `checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'occurrence' parameter should be a string not a '${typeof occurrence}'`);
        parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTN_TSVDataRow ourCheckTNOriginalLanguageQuote: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const coqResultObject = await checkOriginalLanguageQuote(languageCode, fieldName, fieldText, occurrence, bookID, givenC, givenV, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuote notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckTNOriginalLanguageQuote function


    /**
     *
     * @param {string} rowID
     * @param {string} fieldName
     * @param {string} taLinkText
     * @param {string} rowLocation
     * @param {Object} checkingOptions
     */
    async function ourCheckTNLinksToOutside(rowID, fieldName, taLinkText, rowLocation, checkingOptions) {
        // Checks that the TA/TW/Bible reference can be found

        // Uses
        //      checkingOptions.twRepoUsername
        //      checkingOptions.twRepoBranch (or tag)
        //      checkingOptions.checkLinkedTWArticleFlag

        // Updates the global list of notices

        // functionLog(`checkTN_TSVDataRow ourCheckTNLinksToOutside(${rowID}, ${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        parameterAssert(rowID !== undefined, "checkTN_TSVDataRow ourCheckTNLinksToOutside: 'rowID' parameter should be defined");
        parameterAssert(typeof rowID === 'string', `checkTN_TSVDataRow ourCheckTNLinksToOutside: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        parameterAssert(fieldName !== undefined, "checkTN_TSVDataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be defined");
        parameterAssert(typeof fieldName === 'string', `checkTN_TSVDataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        parameterAssert(fieldName === 'OccurrenceNote', `checkTN_TSVDataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be 'OccurrenceNote' not '${fieldName}'`);
        parameterAssert(taLinkText !== undefined, "checkTN_TSVDataRow ourCheckTNLinksToOutside: 'taLinkText' parameter should be defined");
        parameterAssert(typeof taLinkText === 'string', `checkTN_TSVDataRow ourCheckTNLinksToOutside: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

        const coqResultObject = await checkTNLinksToOutside(bookID, givenC, givenV, fieldName, taLinkText, rowLocation, { ...checkingOptions, defaultLanguageCode: languageCode });
        // debugLog("coqResultObject", JSON.stringify(coqResultObject));

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const coqNoticeEntry of coqResultObject.noticeList) {
            if (coqNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN2 check
                drResult.noticeList.push(coqNoticeEntry); // Just copy the complete notice as is
            else // For our direct checks, we add the repoCode as an extra value
                addNoticePartial({ ...coqNoticeEntry, rowID, fieldName });
        }
        // The following is needed coz we might be checking the linked TA and/or TW articles
        if (coqResultObject.checkedFileCount && coqResultObject.checkedFileCount > 0)
            if (typeof drResult.checkedFileCount === 'number') drResult.checkedFileCount += coqResultObject.checkedFileCount;
            else drResult.checkedFileCount = coqResultObject.checkedFileCount;
        if (coqResultObject.checkedFilesizes && coqResultObject.checkedFilesizes > 0)
            if (typeof drResult.checkedFilesizes === 'number') drResult.checkedFilesizes += coqResultObject.checkedFilesizes;
            else drResult.checkedFilesizes = coqResultObject.checkedFilesizes;
        if (coqResultObject.checkedRepoNames && coqResultObject.checkedRepoNames.length > 0)
            for (const checkedRepoName of coqResultObject.checkedRepoNames)
                try { if (drResult.checkedRepoNames.indexOf(checkedRepoName) < 0) drResult.checkedRepoNames.push(checkedRepoName); }
                catch { drResult.checkedRepoNames = [checkedRepoName]; }
        if (coqResultObject.checkedFilenameExtensions && coqResultObject.checkedFilenameExtensions.length > 0)
            for (const checkedFilenameExtension of coqResultObject.checkedFilenameExtensions)
                try { if (drResult.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) drResult.checkedFilenameExtensions.push(checkedFilenameExtension); }
                catch { drResult.checkedFilenameExtensions = [checkedFilenameExtension]; }
        // if (drResult.checkedFilenameExtensions) userLog("drResult", JSON.stringify(drResult));
    }
    // end of ourCheckTNLinksToOutside function


    // Main code for checkTN_TSVDataRow function
    if (line === EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return drResult; // We can’t detect if it’s in the wrong place

    let extractLength;
    try {
        extractLength = checkingOptions?.extractLength;
    } catch (tlcELerror) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // debugLog(`Using default extractLength=${extractLength}`);
    }
    // else
    // debugLog(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // debugLog(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook;
    try {
        parameterAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in tn_table-row-check");
        numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
    } catch (tlcNCerror) {
        addNoticePartial({ priority: 979, message: "Invalid book identifier passed to checkTN_TSVDataRow", location: ` '${bookID}' in first parameter: ${tlcNCerror}` });
    }
    const haveGoodBookID = numChaptersThisBook !== undefined;

    let fields = line.split('\t');
    let RIDSuggestion, SRSuggestion, GLQSuggestion, OQSuggestion, OSuggestion, ONSuggestion;
    if (fields.length === NUM_EXPECTED_TN_TSV_FIELDS) {
        const [B, C, V, rowID, supportReference, origQuote, occurrence, GLQuote, occurrenceNote] = fields;
        // let withString = ` with '${rowID}'${inString}`;
        // let CV_withString = ` ${C}:${V}${withString}`;
        // let atString = ` at ${B} ${C}:${V} (${rowID})${inString}`;

        // Check the fields one-by-one
        if (B.length) {
            if (B !== bookID)
                addNoticePartial({ priority: 978, message: "Wrong book identifier", details: `expected '${bookID}'`, fieldName: 'Book', rowID, extract: B, location: ourRowLocation });
        }
        else
            addNoticePartial({ priority: 977, message: "Missing book identifier", characterIndex: 0, rowID, location: ourRowLocation });

        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C !== givenC)
                addNoticePartial({ priority: 976, message: "Wrong chapter number", details: `expected '${givenC}'`, fieldName: 'Chapter', rowID, extract: C, location: ourRowLocation });
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNoticePartial({ priority: 824, message: `Invalid zero chapter number`, extract: C, rowID, fieldName: 'Chapter', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNoticePartial({ priority: 823, message: `Invalid large chapter number`, extract: C, rowID, fieldName: 'Chapter', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                    haveGoodChapterNumber = true;
                } catch (tlcNVerror) {
                    if (!haveGoodBookID)
                        // addNoticePartial({priority:500, "Invalid chapter number", rowLocation);
                        // else
                        addNoticePartial({ priority: 822, message: "Unable to check chapter number", extract: C, rowID, fieldName: 'Chapter', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
            }
            else
                addNoticePartial({ priority: 821, message: "Bad chapter number", extract: C, rowID, fieldName: 'Chapter', location: ourRowLocation });
        }
        else
            addNoticePartial({ priority: 820, message: "Missing chapter number", rowID, fieldName: 'Chapter', location: ` ?:${V}${ourRowLocation}` });

        if (V.length) {
            if (V !== givenV)
                addNoticePartial({ priority: 975, message: "Wrong verse number", details: `expected '${givenV}'`, rowID, fieldName: 'Verse', extract: V, location: ourRowLocation });
            if (V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0)
                    addNoticePartial({ priority: 814, message: "Invalid zero verse number", rowID, fieldName: 'Verse', extract: V, location: ourRowLocation });
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNoticePartial({ priority: 813, message: "Invalid large verse number", rowID, fieldName: 'Verse', extract: V, location: ourRowLocation });
                    } else
                        addNoticePartial({ priority: 812, message: "Unable to check verse number", rowID, fieldName: 'Verse', location: ourRowLocation });
                }
            }
            else
                addNoticePartial({ priority: 811, message: "Bad verse number", rowID, fieldName: 'Verse', location: ` '${V}'${ourRowLocation}` });
        }
        else
            addNoticePartial({ priority: 810, message: "Missing verse number", rowID, fieldName: 'Verse', location: ` after ${C}:?${ourRowLocation}` });

        if (!rowID.length)
            addNoticePartial({ priority: 779, message: "Missing row ID field", fieldName: 'Verse', location: ourRowLocation });
        else {
            if (rowID.length !== 4) {
                addNoticePartial({ priority: 778, message: "Row ID should be exactly 4 characters", details: `not ${rowID.length}`, rowID, fieldName: 'ID', extract: rowID, location: ourRowLocation });
                if (rowID.length > 4) RIDSuggestion = rowID.substring(0, 5);
                else { // must be < 4
                    RIDSuggestion = rowID;
                    while (RIDSuggestion.length < 4) RIDSuggestion += LC_ALPHABET_PLUS_DIGITS[Math.floor(Math.random() * LC_ALPHABET_PLUS_DIGITS.length)];;
                }
            } else if (LC_ALPHABET.indexOf(rowID[0]) < 0)
                addNoticePartial({ priority: 176, message: "Row ID should start with a lowercase letter", characterIndex: 0, rowID, fieldName: 'ID', extract: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS.indexOf(rowID[3]) < 0)
                addNoticePartial({ priority: 175, message: "Row ID should end with a lowercase letter or digit", characterIndex: 3, rowID, fieldName: 'ID', extract: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN.indexOf(rowID[1]) < 0)
                addNoticePartial({ priority: 174, message: "Row ID characters should only be lowercase letters, digits, or hypen", fieldName: 'ID', characterIndex: 1, rowID, extract: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN.indexOf(rowID[2]) < 0)
                addNoticePartial({ priority: 173, message: "Row ID characters should only be lowercase letters, digits, or hypen", fieldName: 'ID', characterIndex: 2, rowID, extract: rowID, location: ourRowLocation });
        }

        if (supportReference.length) { // need to check TN2 against TA
            if (isWhitespace(supportReference))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'SupportReference', rowID, location: ourRowLocation });
            else { // More than just whitespace
                if (!supportReference.startsWith('figs-')
                    && !supportReference.startsWith('grammar-')
                    && !supportReference.startsWith('translate-')
                    && !supportReference.startsWith('writing-')
                    && supportReference !== 'guidelines-sonofgodprinciples')
                    addNoticePartial({ priority: 788, message: "Only 'Just-In-Time Training' TA articles allowed here", fieldName: 'SupportReference', extract: supportReference, rowID, location: ourRowLocation });
                SRSuggestion = ourCheckTextField(rowID, 'SupportReference', supportReference, true, ourRowLocation, checkingOptions);
                if (!checkingOptions?.disableAllLinkFetchingFlag)
                    await ourCheckSupportReferenceInTA(rowID, 'SupportReference', supportReference, ourRowLocation, checkingOptions);
                if (occurrenceNote.indexOf(supportReference) < 0) // The full link is NOT in the note!
                    addNoticePartial({ priority: 787, message: "Link to TA should also be in OccurrenceNote", fieldName: 'SupportReference', extract: supportReference, rowID, location: ourRowLocation });
            }
            if (supportReference.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(supportReference,'\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1?'':'s'} found`, fieldName: 'SupportReference', rowID, location: ourRowLocation });
        }
    }
        // // TODO: Check if this is really required????
        // else if (/^\d+$/.test(C) && /^\d+$/.test(V)) // C:V are both digits
        //     addNoticePartial({ priority: 877, message: "Missing SupportReference field", fieldName: 'SupportReference', rowID, location: ourRowLocation });

        if (origQuote.length) { // need to check UTN against UHB and UGNT
            OQSuggestion = ourCheckTextField(rowID, 'OrigQuote', origQuote, false, ourRowLocation, checkingOptions);
            if (occurrence.length)
                await ourCheckTNOriginalLanguageQuote(rowID, 'OrigQuote', origQuote, occurrence, ourRowLocation, checkingOptions);
            else
                addNoticePartial({ priority: 750, message: "Missing occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, location: ourRowLocation });
        }
        else // TODO: Find more details about when these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (V !== 'intro' && occurrence !== '0')
                addNoticePartial({ priority: 919, message: "Missing OrigQuote field", fieldName: 'OrigQuote', rowID, location: ourRowLocation });

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn’t occur
                if (origQuote.length) {
                    addNoticePartial({ priority: 751, message: "Invalid zero occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, extract: occurrence, location: ourRowLocation });
                    OSuggestion = '1';
                }
                // if (V !== 'intro')
                //     addNoticePartial({priority:500, message:"Invalid zero occurrence field", rowID, location:rowLocation);
            }
            else if (occurrence === '-1') // TODO check the special conditions when this can occur???
                ;
            else if ('1234567'.indexOf(occurrence) < 0) { // it’s not one of these integers
                addNoticePartial({ priority: 792, message: `Invalid occurrence field`, fieldName: 'Occurrence', rowID, extract: occurrence, location: ourRowLocation });
                OSuggestion = '1';
            }
        }
        else if (origQuote.length) {
            addNoticePartial({ priority: 791, message: `Missing occurrence field`, fieldName: 'Occurrence', rowID, location: ourRowLocation });
            OSuggestion = '1';
        }

        if (GLQuote.length) { // TODO: need to check UTN against ULT
            if (GLQuote.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(GLQuote,'\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1?'':'s'} found`, fieldName: 'GLQuote', rowID, location: ourRowLocation });
            }
            if (isWhitespace(GLQuote))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'GLQuote', rowID, location: ourRowLocation });
            else // More than just whitespace
                if (V !== 'intro')
                    GLQSuggestion = ourCheckTextField(rowID, 'GLQuote', GLQuote, false, ourRowLocation, checkingOptions);
        }
        // else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
        //     if (V !== 'intro')
        //         addNoticePartial({ priority: 275, message: "Missing GLQuote field", rowID, location: ourRowLocation });

        if (occurrenceNote.length) {
            if (occurrenceNote.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(occurrenceNote,'\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1?'':'s'} found`, fieldName: 'OccurrenceNote', rowID, location: ourRowLocation });
            }
            if (isWhitespace(occurrenceNote))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'OccurrenceNote', rowID, location: ourRowLocation });
            else { // More than just whitespace
                ONSuggestion = await ourMarkdownTextChecks(rowID, 'OccurrenceNote', occurrenceNote, true, ourRowLocation, checkingOptions);
                await ourCheckTNLinksToOutside(rowID, 'OccurrenceNote', occurrenceNote, ourRowLocation, linkCheckingOptions);
                let regexResultArray;
                while ((regexResultArray = TA_REGEX.exec(occurrenceNote))) {
                    // debugLog("Got TA Regex in OccurrenceNote", JSON.stringify(regexResultArray));
                    if (supportReference !== regexResultArray[1] && V !== 'intro') {
                        const details = supportReference ? `(SR='${supportReference}')` : "(empty SR field)"
                        addNoticePartial({ priority: 786, message: "Should have a SupportReference when OccurrenceNote has a TA link", details, rowID, fieldName: 'OccurrenceNote', extract: regexResultArray[1], location: ourRowLocation });
                    }
                }
            }
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            addNoticePartial({ priority: 274, message: "Missing OccurrenceNote field", fieldName: 'OccurrenceNote', rowID, location: ourRowLocation });

        // 9 [B, C, V, rowID, supportReference, origQuote, occurrence, GLQuote, occurrenceNote]
        const suggestion = `${B}\t${C}\t${V}\t${RIDSuggestion === undefined ? rowID : RIDSuggestion}\t${SRSuggestion === undefined ? supportReference : SRSuggestion}\t${OQSuggestion === undefined ? origQuote : OQSuggestion}\t${OSuggestion === undefined ? occurrence : OSuggestion}\t${GLQSuggestion === undefined ? GLQuote : GLQSuggestion}\t${ONSuggestion === undefined ? occurrenceNote : ONSuggestion}`;
        if (suggestion !== line) {
            // debugLog(`Had TN2 ${line}`);
            // debugLog(`Sug TN2 ${suggestion}`);
            drResult.suggestion = suggestion;
        }

    } else { // wrong number of fields in the row
        // Have a go at getting some of the first fields out of the row
        let rowID = '????';
        try { rowID = fields[3]; } catch { }
        addNoticePartial({ priority: 984, message: `Found wrong number of TSV fields (expected ${NUM_EXPECTED_TN_TSV_FIELDS})`, details: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, rowID, location: ourRowLocation });
    }

    // debugLog(`  checkTN_TSVDataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkTN_TSVDataRow result is", JSON.stringify(drResult));
    return drResult; // object with noticeList and possibly suggestion only
}
// end of checkTN_TSVDataRow function
