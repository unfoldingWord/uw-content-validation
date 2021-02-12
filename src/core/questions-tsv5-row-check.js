import { DEFAULT_EXTRACT_LENGTH, isWhitespace, countOccurrences } from './text-handling-functions'
import * as books from './books/books';
// import { checkTextField } from './field-text-check';
import { checkMarkdownText } from './markdown-text-check';
// import { checkSupportReferenceInTA } from './ta-reference-check';
import { checkTNLinksToOutside } from './tn-links-check';
// import { checkOriginalLanguageQuote } from './orig-quote-check';
import { parameterAssert } from './utilities';


// const QUESTIONS_TABLE_ROW_VALIDATOR_VERSION_STRING = '0.1.0';

const NUM_EXPECTED_QUESTIONS_TSV_FIELDS = 5; // so expects 4 tabs per line
const EXPECTED_QUESTIONS_HEADING_LINE = 'Reference\tID\tTags\tQuestion\tResponse';

const LC_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const LC_ALPHABET_PLUS_DIGITS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN = 'abcdefghijklmnopqrstuvwxyz0123456789-';

// const TA_REGEX = new RegExp('\\[\\[rc://[^ /]+?/ta/man/[^ /]+?/([^ \\]]+?)\\]\\]', 'g');


/**
 *
 * @description - Checks one TSV data row of translation notes (TN2)
 * @param {string} languageCode - the language code, e.g., 'en'
 * @param {string} repoCode - TN2, TQ2, TWL, SN, or SQ -- allows more specific checks
 * @param {string} line - the TSV line to be checked
 * @param {string} bookID - 3-character UPPERCASE USFM book identifier or 'OBS'
 * @param {string} givenC - chapter number or (for OBS) story number string
 * @param {string} givenV - verse number or (for OBS) frame number string
 * @param {string} givenRowLocation - description of where the line is located
 * @param {Object} checkingOptions - may contain extractLength parameter
 * @return {Object} - containing noticeList
 */
export async function checkQuestionsTSV5DataRow(languageCode, repoCode, line, bookID, givenC, givenV, givenRowLocation, checkingOptions) {
    /* This function is only for checking one data row
          and the function doesn’t assume that it has any previous context.

        TN2, TQ2, TWL, SN, or SQ
            being translation or study notes, questions, or word-links.

        bookID is a three-character UPPERCASE USFM book identifier or 'OBS'
            so givenC and givenV are usually chapter number and verse number
                but can be story number and frame number for OBS.

        It’s designed to be able to quickly show errors for a single row being displayed/edited.

        Returns an object containing the noticeList.
    */
    // functionLog(`checkQuestionsTSV5DataRow(${languageCode}, ${repoCode}, ${line}, ${bookID}, ${givenRowLocation}, ${JSON.stringify(checkingOptions)})…`);
    parameterAssert(languageCode !== undefined, "checkQuestionsTSV5DataRow: 'languageCode' parameter should be defined");
    parameterAssert(typeof languageCode === 'string', `checkQuestionsTSV5DataRow: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    parameterAssert(line !== undefined, "checkQuestionsTSV5DataRow: 'line' parameter should be defined");
    parameterAssert(typeof line === 'string', `checkQuestionsTSV5DataRow: 'line' parameter should be a string not a '${typeof line}'`);
    parameterAssert(bookID !== undefined, "checkQuestionsTSV5DataRow: 'bookID' parameter should be defined");
    parameterAssert(typeof bookID === 'string', `checkQuestionsTSV5DataRow: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    parameterAssert(bookID.length === 3, `checkQuestionsTSV5DataRow: 'bookID' parameter should be three characters long not ${bookID.length}`);
    parameterAssert(bookID.toUpperCase() === bookID, `checkQuestionsTSV5DataRow: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkQuestionsTSV5DataRow: '${bookID}' is not a valid USFM book identifier`);
    // parameterAssert(givenC !== undefined, "checkQuestionsTSV5DataRow: 'givenC' parameter should be defined");
    if (givenC) parameterAssert(typeof givenC === 'string', `checkQuestionsTSV5DataRow: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    // parameterAssert(givenV !== undefined, "checkQuestionsTSV5DataRow: 'givenV' parameter should be defined");
    if (givenV) parameterAssert(typeof givenV === 'string', `checkQuestionsTSV5DataRow: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    parameterAssert(givenRowLocation !== undefined, "checkQuestionsTSV5DataRow: 'givenRowLocation' parameter should be defined");
    parameterAssert(typeof givenRowLocation === 'string', `checkQuestionsTSV5DataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);
    parameterAssert(givenRowLocation.indexOf('true') === -1, "checkQuestionsTSV5DataRow: 'givenRowLocation' parameter should not be 'true'");

    let ourRowLocation = givenRowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    const linkCheckingOptions = { ...checkingOptions };
    linkCheckingOptions.taRepoLanguageCode = languageCode;

    let drResult = { noticeList: [] };

    function addNoticePartial(noticeObject) {
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
        // functionLog(`checkQuestionsTSV5DataRow addNoticePartial(priority=${noticeObject.priority}) ${noticeObject.message}, ${noticeObject.characterIndex}, ${noticeObject.extract}, ${noticeObject.location}`);
        parameterAssert(noticeObject.priority !== undefined, "checkQuestionsTSV5DataRow addNoticePartial: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `checkQuestionsTSV5DataRow addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "checkQuestionsTSV5DataRow addNoticePartial: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `checkQuestionsTSV5DataRow addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(lineNumber !== undefined, "checkQuestionsTSV5DataRow addNoticePartial: 'lineNumber' parameter should be defined");
        // parameterAssert(typeof lineNumber === 'number', `checkQuestionsTSV5DataRow addNoticePartial: 'lineNumber' parameter should be a number not a '${typeof lineNumber}': ${lineNumber}`);
        // parameterAssert(characterIndex !== undefined, "checkQuestionsTSV5DataRow addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `checkQuestionsTSV5DataRow addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(extract !== undefined, "checkQuestionsTSV5DataRow addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) parameterAssert(typeof noticeObject.extract === 'string', `checkQuestionsTSV5DataRow addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        parameterAssert(noticeObject.location !== undefined, "checkQuestionsTSV5DataRow addNoticePartial: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `checkQuestionsTSV5DataRow addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // Also uses the given bookID,C,V, parameters from the main function call
        // noticeObject.debugChain = noticeObject.debugChain ? `checkQuestionsTSV5DataRow ${noticeObject.debugChain}` : `checkQuestionsTSV5DataRow(${repoCode})`;
        drResult.noticeList.push({ ...noticeObject, bookID, C: givenC, V: givenV });
    }

    async function ourMarkdownTextChecks(rowID, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions) {
        /**
        * @description - checks the given markdown field and processes the returned results
        * @param {string} rowID - 4-character row ID field
        * @param {string} fieldName - name of the field being checked
        * @param {string} fieldText - the actual text of the field being checked
        * @param {} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {string} rowLocation - description of where the line is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does markdown checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // We don’t currently use the allowedLinks parameter

        // functionLog(`checkQuestionsTSV5DataRow ourMarkdownTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        parameterAssert(rowID !== undefined, "checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'rowID' parameter should be defined");
        parameterAssert(typeof rowID === 'string', `checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        // parameterAssert(fieldName !== undefined, "checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'fieldName' parameter should be defined");
        // parameterAssert(typeof fieldName === 'string', `checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        parameterAssert(fieldName === 'Annotation', "checkQuestionsTSV5DataRow ourMarkdownTextChecks: Only run this check on Annotations")
        parameterAssert(fieldText !== undefined, "checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'fieldText' parameter should be defined");
        parameterAssert(typeof fieldText === 'string', `checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        parameterAssert(allowedLinks === true || allowedLinks === false, "checkQuestionsTSV5DataRow ourMarkdownTextChecks: allowedLinks parameter must be either true or false");
        parameterAssert(rowLocation !== undefined, "checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be defined");
        parameterAssert(typeof rowLocation === 'string', `checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
        parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkQuestionsTSV5DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const omtcResultObject = await checkMarkdownText(languageCode, fieldName, fieldText, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(cmtResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of omtcResultObject.noticeList) {
            // parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourMarkdownTextChecks notice length=${Object.keys(noticeEntry).length}`);
            // NOTE: Ellipses in Annotation have the normal meaning
            //          not like the specialised meaning in the Quote snippet fields
            if (noticeEntry.priority !== 178 && noticeEntry.priority !== 179 // unexpected space after ellipse, ellipse after space
                && !noticeEntry.message.startsWith("Unexpected … character after space") // 191
            )
                addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
        return omtcResultObject.suggestion; // There may or may not be one!
    }
    // end of ourMarkdownTextChecks function

    // function ourCheckTextField(rowID, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions) {
    //     /**
    //     * @description - checks the given text field and processes the returned results
    //     * @param {string} rowID - 4-character row ID field
    //     * @param {string} fieldName - name of the field being checked
    //     * @param {string} fieldText - the actual text of the field being checked
    //     * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
    //     * @param {string} rowLocation - description of where the line is located
    //     * @param {Object} checkingOptions - parameters that might affect the check
    //     */
    //     // Does basic checks for small errors like leading/trailing spaces, etc.

    //     // We assume that checking for compulsory fields is done elsewhere

    //     // Updates the global list of notices

    //     // functionLog(`checkQuestionsTSV5DataRow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
    //     parameterAssert(rowID !== undefined, "checkQuestionsTSV5DataRow ourCheckTextField: 'rowID' parameter should be defined");
    //     parameterAssert(typeof rowID === 'string', `checkQuestionsTSV5DataRow ourCheckTextField: 'rowID' parameter should be a string not a '${typeof rowID}'`);
    //     parameterAssert(fieldName !== undefined, "checkQuestionsTSV5DataRow ourCheckTextField: 'fieldName' parameter should be defined");
    //     parameterAssert(typeof fieldName === 'string', `checkQuestionsTSV5DataRow ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
    //     parameterAssert(fieldText !== undefined, "checkQuestionsTSV5DataRow ourCheckTextField: 'fieldText' parameter should be defined");
    //     parameterAssert(typeof fieldText === 'string', `checkQuestionsTSV5DataRow ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    //     parameterAssert(allowedLinks === true || allowedLinks === false, "checkQuestionsTSV5DataRow ourCheckTextField: allowedLinks parameter must be either true or false");
    //     parameterAssert(rowLocation !== undefined, "checkQuestionsTSV5DataRow ourCheckTextField: 'rowLocation' parameter should be defined");
    //     parameterAssert(typeof rowLocation === 'string', `checkQuestionsTSV5DataRow ourCheckTextField: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
    //     parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkQuestionsTSV5DataRow ourCheckTextField: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

    //     const fieldType = fieldName === 'Annotation' ? 'markdown' : 'raw';
    //     const octfResultObject = checkTextField(languageCode, fieldType, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions);

    //     // Choose only ONE of the following
    //     // This is the fast way of append the results from this field
    //     // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
    //     // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
    //     //  process results line by line
    //     for (const noticeEntry of octfResultObject.noticeList) {
    //         // parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
    //         addNoticePartial({ ...noticeEntry, rowID, fieldName });
    //     }
    //     return octfResultObject.suggestion; // There may or may not be one!
    // }
    // // end of ourCheckTextField function

    // async function ourCheckSupportReferenceInTA(rowID, fieldName, taLinkText, rowLocation, checkingOptions) {
    //     // Checks that the TA reference can be found

    //     // Updates the global list of notices

    //     // functionLog(`checkQuestionsTSV5DataRow ourCheckSupportReferenceInTA(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
    //     parameterAssert(rowID !== undefined, "checkQuestionsTSV5DataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be defined");
    //     parameterAssert(typeof rowID === 'string', `checkQuestionsTSV5DataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be a string not a '${typeof rowID}'`);
    //     parameterAssert(fieldName !== undefined, "checkQuestionsTSV5DataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be defined");
    //     parameterAssert(typeof fieldName === 'string', `checkQuestionsTSV5DataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
    //     parameterAssert(taLinkText !== undefined, "checkQuestionsTSV5DataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be defined");
    //     parameterAssert(typeof taLinkText === 'string', `checkQuestionsTSV5DataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);
    //     parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkQuestionsTSV5DataRow ourCheckSupportReferenceInTA: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

    //     const coqResultObject = await checkSupportReferenceInTA(fieldName, taLinkText, rowLocation, { ...checkingOptions, taRepoLanguageCode: languageCode, expectFullLink: true });

    //     // Choose only ONE of the following
    //     // This is the fast way of append the results from this field
    //     // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
    //     // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
    //     //  process results line by line
    //     for (const noticeEntry of coqResultObject.noticeList) {
    //         // parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckSupportReferenceInTA notice length=${Object.keys(noticeEntry).length}`);
    //         addNoticePartial({ ...noticeEntry, rowID, fieldName });
    //     }
    // }
    // // end of ourCheckSupportReferenceInTA function


    // async function ourCheckTNOriginalLanguageQuote(rowID, fieldName, fieldText, occurrence, rowLocation, checkingOptions) {
    //     // Checks that the Hebrew/Greek quote can be found in the original texts

    //     // Uses the bookID,C,V values from the main function call

    //     // Updates the global list of notices

    //     // functionLog(`checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
    //     parameterAssert(rowID !== undefined, "checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'rowID' parameter should be defined");
    //     parameterAssert(typeof rowID === 'string', `checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'rowID' parameter should be a string not a '${typeof rowID}'`);
    //     parameterAssert(fieldName !== undefined, "checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'fieldName' parameter should be defined");
    //     parameterAssert(typeof fieldName === 'string', `checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
    //     parameterAssert(fieldText !== undefined, "checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be defined");
    //     parameterAssert(typeof fieldText === 'string', `checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    //     parameterAssert(occurrence !== undefined, "checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'occurrence' parameter should be defined");
    //     parameterAssert(typeof occurrence === 'string', `checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'occurrence' parameter should be a string not a '${typeof occurrence}'`);
    //     parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkQuestionsTSV5DataRow ourCheckTNOriginalLanguageQuote: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

    //     const coqResultObject = await checkOriginalLanguageQuote(languageCode, fieldName, fieldText, occurrence, bookID, givenC, givenV, rowLocation, checkingOptions);

    //     // Choose only ONE of the following
    //     // This is the fast way of append the results from this field
    //     // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
    //     // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
    //     //  process results line by line
    //     for (const noticeEntry of coqResultObject.noticeList) {
    //         // parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuote notice length=${Object.keys(noticeEntry).length}`);
    //         addNoticePartial({ ...noticeEntry, rowID, fieldName });
    //     }
    // }
    // // end of ourCheckTNOriginalLanguageQuote function


    async function ourCheckTNLinksToOutside(rowID, fieldName, taLinkText, rowLocation, checkingOptions) {
        // Checks that the TA/TW/Bible reference can be found

        // Updates the global list of notices

        // functionLog(`checkQuestionsTSV5DataRow ourCheckTNLinksToOutside(${rowID}, ${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        parameterAssert(rowID !== undefined, "checkQuestionsTSV5DataRow ourCheckTNLinksToOutside: 'rowID' parameter should be defined");
        parameterAssert(typeof rowID === 'string', `checkQuestionsTSV5DataRow ourCheckTNLinksToOutside: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        parameterAssert(fieldName !== undefined, "checkQuestionsTSV5DataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be defined");
        parameterAssert(typeof fieldName === 'string', `checkQuestionsTSV5DataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        parameterAssert(fieldName === 'Annotation', `checkQuestionsTSV5DataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be 'Annotation' not '${fieldName}'`);
        parameterAssert(taLinkText !== undefined, "checkQuestionsTSV5DataRow ourCheckTNLinksToOutside: 'taLinkText' parameter should be defined");
        parameterAssert(typeof taLinkText === 'string', `checkQuestionsTSV5DataRow ourCheckTNLinksToOutside: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

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


    // Main code for checkQuestionsTSV5DataRow function
    if (line === EXPECTED_QUESTIONS_HEADING_LINE) // Assume it must be ok
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
    if (bookID === 'OBS')
        numChaptersThisBook = 50; // There's 50 Open Bible Stories
    else {
        parameterAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in question-row-check");
        try {
            numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
        } catch (tlcNCerror) {
            addNoticePartial({ priority: 979, message: "Invalid book identifier passed to checkQuestionsTSV5DataRow", location: ` '${bookID}' in first parameter: ${tlcNCerror}` });
        }
    }
    const haveGoodBookID = numChaptersThisBook !== undefined;

    let fields = line.split('\t');
    let RIDSuggestion, QSuggestion, ASuggestion;
    if (fields.length === NUM_EXPECTED_QUESTIONS_TSV_FIELDS) {
        const [reference, rowID, tags, question, answer] = fields;
        // let withString = ` with '${rowID}'${inString}`;
        // let CV_withString = ` ${C}:${V}${withString}`;
        // let atString = ` at ${B} ${C}:${V} (${rowID})${inString}`;

        // Check the fields one-by-one
        const [C, V] = reference.split(':');
        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C !== givenC)
                addNoticePartial({ priority: 976, message: "Wrong chapter number", details: `expected '${givenC}'`, fieldName: 'Reference', rowID, extract: C, location: ourRowLocation });
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNoticePartial({ priority: 824, message: `Invalid zero chapter number`, extract: C, rowID, fieldName: 'Reference', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNoticePartial({ priority: 823, message: `Invalid large chapter number`, extract: C, rowID, fieldName: 'Reference', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                if (lowercaseBookID === 'obs')
                    numVersesThisChapter = 99; // Set to maximum expected number of frames
                else {
                    try {
                        numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                        haveGoodChapterNumber = true;
                    } catch (tlcNVerror) {
                        if (!haveGoodBookID)
                            // addNoticePartial({priority:500, "Invalid chapter number", rowLocation);
                            // else
                            addNoticePartial({ priority: 822, message: "Unable to check chapter number", extract: C, rowID, fieldName: 'Reference', location: ourRowLocation });
                        haveGoodChapterNumber = false;
                    }
                }
            }
            else
                addNoticePartial({ priority: 821, message: "Bad chapter number", extract: C, rowID, fieldName: 'Reference', location: ourRowLocation });
        }
        else
            addNoticePartial({ priority: 820, message: "Missing chapter number", rowID, fieldName: 'Reference', location: ` ?:${V}${ourRowLocation}` });

        if (V.length) {
            if (V !== givenV)
                addNoticePartial({ priority: 975, message: "Wrong verse number", details: `expected '${givenV}'`, rowID, fieldName: 'Reference', extract: V, location: ourRowLocation });
            if (bookID === 'OBS' || V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0 && bookID !== 'PSA') // Psalms have \d as verse zero
                    addNoticePartial({ priority: 814, message: "Invalid zero verse number", rowID, fieldName: 'Reference', extract: V, location: ourRowLocation });
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNoticePartial({ priority: 813, message: "Invalid large verse number", rowID, fieldName: 'Reference', extract: V, location: ourRowLocation });
                    } else
                        addNoticePartial({ priority: 812, message: "Unable to check verse number", rowID, fieldName: 'Reference', location: ourRowLocation });
                }
            }
            else
                addNoticePartial({ priority: 811, message: "Bad verse number", rowID, fieldName: 'Reference', location: ` '${V}'${ourRowLocation}` });
        }
        else
            addNoticePartial({ priority: 810, message: "Missing verse number", rowID, fieldName: 'Reference', location: ` after ${C}:?${ourRowLocation}` });

        if (!rowID.length)
            addNoticePartial({ priority: 779, message: "Missing row ID field", fieldName: 'Reference', location: ourRowLocation });
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

        if (tags.length)
            ;

        if (question.length) {
            if (question.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(question, '\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, fieldName: 'Annotation', rowID, location: ourRowLocation });
            }
            if (isWhitespace(question))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'Annotation', rowID, location: ourRowLocation });
            else { // More than just whitespace
                ASuggestion = await ourMarkdownTextChecks(rowID, 'Annotation', question, true, ourRowLocation, checkingOptions);
                await ourCheckTNLinksToOutside(rowID, 'Annotation', question, ourRowLocation, linkCheckingOptions);
                // let regexResultArray;
                // while ((regexResultArray = TA_REGEX.exec(question))) {
                //     // debugLog("Got TA Regex in Annotation", JSON.stringify(regexResultArray));
                //     const adjustedLink = regexResultArray[0].substring(2, regexResultArray[0].length - 2)
                //     if (supportReference !== adjustedLink && V !== 'intro') {
                //         const details = supportReference ? `(SR='${supportReference}')` : "(empty SR field)"
                //         addNoticePartial({ priority: 786, message: "Should have a SupportReference when OccurrenceNote has a TA link", details, rowID, fieldName: 'Annotation', extract: adjustedLink, location: ourRowLocation });
                //     }
                // }
            }
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (repoCode === 'TN2')
                addNoticePartial({ priority: 274, message: "Missing Annotation field", fieldName: 'Annotation', rowID, location: ourRowLocation });

        if (answer.length) {
            if (answer.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(answer, '\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, fieldName: 'Annotation', rowID, location: ourRowLocation });
            }
            if (isWhitespace(answer))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'Annotation', rowID, location: ourRowLocation });
            else { // More than just whitespace
                ASuggestion = await ourMarkdownTextChecks(rowID, 'Annotation', answer, true, ourRowLocation, checkingOptions);
                await ourCheckTNLinksToOutside(rowID, 'Annotation', answer, ourRowLocation, linkCheckingOptions);
                // let regexResultArray;
                // while ((regexResultArray = TA_REGEX.exec(answer))) {
                //     // debugLog("Got TA Regex in Annotation", JSON.stringify(regexResultArray));
                //     const adjustedLink = regexResultArray[0].substring(2, regexResultArray[0].length - 2)
                //     if (supportReference !== adjustedLink && V !== 'intro') {
                //         const details = supportReference ? `(SR='${supportReference}')` : "(empty SR field)"
                //         addNoticePartial({ priority: 786, message: "Should have a SupportReference when OccurrenceNote has a TA link", details, rowID, fieldName: 'Annotation', extract: adjustedLink, location: ourRowLocation });
                //     }
                // }
            }
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (repoCode === 'TN2')
                addNoticePartial({ priority: 274, message: "Missing Annotation field", fieldName: 'Annotation', rowID, location: ourRowLocation });

        // 7 [reference, rowID, tags, question, answer]
        const suggestion = `${reference}\t${RIDSuggestion === undefined ? rowID : RIDSuggestion}\t${tags}\t${QSuggestion === undefined ? question : QSuggestion}\t${ASuggestion === undefined ? answer : ASuggestion}`;
        if (suggestion !== line) {
            // debugLog(`Had question ${line}`);
            // debugLog(`Sug question ${suggestion}`);
            drResult.suggestion = suggestion;
        }

    } else { // wrong number of fields in the row
        // Have a go at getting some of the first fields out of the row
        let rowID = '????';
        try { rowID = fields[1]; } catch { }
        addNoticePartial({ priority: 984, message: `Found wrong number of TSV fields (expected ${NUM_EXPECTED_QUESTIONS_TSV_FIELDS})`, details: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, rowID, location: ourRowLocation });
    }

    // debugLog(`  checkQuestionsTSV5DataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkQuestionsTSV5DataRow result is", JSON.stringify(drResult));
    return drResult; // object with noticeList and possibly suggestion only
}
// end of checkQuestionsTSV5DataRow function
