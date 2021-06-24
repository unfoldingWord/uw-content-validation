import { DEFAULT_EXCERPT_LENGTH } from './defaults';
import { isWhitespace, countOccurrences } from './text-handling-functions';
import * as books from './books/books';
import { checkTextField } from './field-text-check';
import { checkMarkdownText } from './markdown-text-check';
import { checkSupportReferenceInTA } from './ta-reference-check';
// import { checkNotesLinksToOutside } from './notes-links-check';
import { checkOriginalLanguageQuoteAndOccurrence } from './orig-quote-check';
// eslint-disable-next-line no-unused-vars
import { parameterAssert } from './utilities';


// const TN_TABLE_ROW_VALIDATOR_VERSION_STRING = '0.7.2';

const NUM_EXPECTED_TN_TSV_FIELDS = 9; // so expects 8 tabs per line
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

const LC_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const LC_ALPHABET_PLUS_DIGITS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN = 'abcdefghijklmnopqrstuvwxyz0123456789-';

const TA_REGEX = new RegExp('\\[\\[rc://[^ /]+?/ta/man/[^ /]+?/([^ \\]]+?)\\]\\]', 'g');


/**
 *
 * @description - Checks one TSV data row of translation notes (TN)
 * @param {string} languageCode - the language code, e.g., 'en'
 * @param {string} repoCode - 'TN'
 * @param {string} line - the TSV line to be checked
 * @param {string} bookID - 3-character UPPERCASE USFM book identifier or 'OBS'
 * @param {string} givenC - chapter number or (for OBS) story number string
 * @param {string} givenV - verse number or (for OBS) frame number string
 * @param {string} givenRowLocation - description of where the line is located
 * @param {Object} checkingOptions - may contain excerptLength, twRepoUsername, twRepoBranch (or tag), disableLinkedTWArticlesCheckFlag parameters
 * @return {Object} - containing noticeList
 */
export async function checkTN_TSV9DataRow(languageCode, repoCode, line, bookID, givenC, givenV, givenRowLocation, checkingOptions) {
    /* This function is only for checking one data row
          and the function doesn’t assume that it has any previous context.

        It’s designed to be able to quickly show errors for a single row being displayed/edited.

        Returns an object containing the noticeList.
    */
    // functionLog(`checkTN_TSV9DataRow(${languageCode}, ${repoCode}, ${line}, ${bookID}, ${givenRowLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(languageCode !== undefined, "checkTN_TSV9DataRow: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkTN_TSV9DataRow: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    //parameterAssert(repoCode === 'TN', `checkTN_TSV9DataRow: repoCode expected 'TN' not '${repoCode}'`);
    //parameterAssert(line !== undefined, "checkTN_TSV9DataRow: 'line' parameter should be defined");
    //parameterAssert(typeof line === 'string', `checkTN_TSV9DataRow: 'line' parameter should be a string not a '${typeof line}'`);
    //parameterAssert(bookID !== undefined, "checkTN_TSV9DataRow: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkTN_TSV9DataRow: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    //parameterAssert(bookID.length === 3, `checkTN_TSV9DataRow: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //parameterAssert(bookID.toUpperCase() === bookID, `checkTN_TSV9DataRow: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //parameterAssert(books.isValidBookID(bookID), `checkTN_TSV9DataRow: '${bookID}' is not a valid USFM book identifier`);
    // //parameterAssert(givenC !== undefined, "checkTN_TSV9DataRow: 'givenC' parameter should be defined");
    if (givenC) { //parameterAssert(typeof givenC === 'string', `checkTN_TSV9DataRow: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    }
    // //parameterAssert(givenV !== undefined, "checkTN_TSV9DataRow: 'givenV' parameter should be defined");
    if (givenV) { //parameterAssert(typeof givenV === 'string', `checkTN_TSV9DataRow: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    }
    //parameterAssert(givenRowLocation !== undefined, "checkTN_TSV9DataRow: 'givenRowLocation' parameter should be defined");
    //parameterAssert(typeof givenRowLocation === 'string', `checkTN_TSV9DataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);

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
    * @param {string} excerpt - short excerpt from the line centred on the problem (if available)
    * @param {string} location - description of where the issue is located
    */
    function addNoticePartial(noticeObject) {
        // functionLog(`checkTN_TSV9DataRow addNoticePartial(priority=${noticeObject.priority}) ${noticeObject.message}, ${noticeObject.characterIndex}, ${noticeObject.excerpt}, ${noticeObject.location}`);
        //parameterAssert(noticeObject.priority !== undefined, "checkTN_TSV9DataRow addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `checkTN_TSV9DataRow addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "checkTN_TSV9DataRow addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `checkTN_TSV9DataRow addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(lineNumber !== undefined, "checkTN_TSV9DataRow addNoticePartial: 'lineNumber' parameter should be defined");
        // //parameterAssert(typeof lineNumber === 'number', `checkTN_TSV9DataRow addNoticePartial: 'lineNumber' parameter should be a number not a '${typeof lineNumber}': ${lineNumber}`);
        // //parameterAssert(characterIndex !== undefined, "checkTN_TSV9DataRow addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `checkTN_TSV9DataRow addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "checkTN_TSV9DataRow addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `checkTN_TSV9DataRow addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "checkTN_TSV9DataRow addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `checkTN_TSV9DataRow addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        // noticeObject.debugChain = noticeObject.debugChain ? `checkTN_TSV9DataRow ${noticeObject.debugChain}` : 'checkTN_TSV9DataRow';
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

        // functionLog(`checkTN_TSV9DataRow ourMarkdownTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkTN_TSV9DataRow ourMarkdownTextChecks: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkTN_TSV9DataRow ourMarkdownTextChecks: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        // //parameterAssert(fieldName !== undefined, "checkTN_TSV9DataRow ourMarkdownTextChecks: 'fieldName' parameter should be defined");
        // //parameterAssert(typeof fieldName === 'string', `checkTN_TSV9DataRow ourMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldName === 'OccurrenceNote', `checkTN_TSV9DataRow ourMarkdownTextChecks: Only run this check on OccurrenceNotes not '${fieldName}'`);
        //parameterAssert(fieldText !== undefined, "checkTN_TSV9DataRow ourMarkdownTextChecks: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `checkTN_TSV9DataRow ourMarkdownTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "checkTN_TSV9DataRow ourMarkdownTextChecks: allowedLinks parameter must be either true or false");
        //parameterAssert(rowLocation !== undefined, "checkTN_TSV9DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be defined");
        //parameterAssert(typeof rowLocation === 'string', `checkTN_TSV9DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTN_TSV9DataRow ourMarkdownTextChecks: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const omtcResultObject = await checkMarkdownText(languageCode, repoCode, fieldName, fieldText, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(cmtResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of omtcResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourMarkdownTextChecks notice length=${Object.keys(noticeEntry).length}`);
            // NOTE: Ellipses in OccurrenceNote have the normal meaning
            //          not like the specialised meaning in the snippet fields Quote and GLQuote
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

        // functionLog(`checkTN_TSV9DataRow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkTN_TSV9DataRow ourCheckTextField: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkTN_TSV9DataRow ourCheckTextField: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName !== undefined, "checkTN_TSV9DataRow ourCheckTextField: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `checkTN_TSV9DataRow ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldText !== undefined, "checkTN_TSV9DataRow ourCheckTextField: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `checkTN_TSV9DataRow ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "checkTN_TSV9DataRow ourCheckTextField: allowedLinks parameter must be either true or false");
        //parameterAssert(rowLocation !== undefined, "checkTN_TSV9DataRow ourCheckTextField: 'rowLocation' parameter should be defined");
        //parameterAssert(typeof rowLocation === 'string', `checkTN_TSV9DataRow ourCheckTextField: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTN_TSV9DataRow ourCheckTextField: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const fieldType = fieldName === 'OccurrenceNote' ? 'markdown' : 'raw';
        const octfResultObject = checkTextField(languageCode, repoCode, fieldType, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of octfResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
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

        // functionLog(`checkTN_TSV9DataRow ourCheckSupportReferenceInTA(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkTN_TSV9DataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkTN_TSV9DataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName !== undefined, "checkTN_TSV9DataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `checkTN_TSV9DataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(taLinkText !== undefined, "checkTN_TSV9DataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be defined");
        //parameterAssert(typeof taLinkText === 'string', `checkTN_TSV9DataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTN_TSV9DataRow ourCheckSupportReferenceInTA: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const coqResultObject = await checkSupportReferenceInTA(fieldName, taLinkText, rowLocation, { ...checkingOptions, taRepoLanguageCode: languageCode });

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckSupportReferenceInTA notice length=${Object.keys(noticeEntry).length}`);
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
    async function ourCheckTNOriginalLanguageQuoteAndOccurrence(rowID, fieldName, fieldText, occurrence, rowLocation, checkingOptions) {
        // Checks that the Hebrew/Greek quote can be found in the original texts

        // Uses the bookID,C,V values from the main function call

        // Updates the global list of notices

        // functionLog(`checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName !== undefined, "checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldText !== undefined, "checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(occurrence !== undefined, "checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'occurrence' parameter should be defined");
        //parameterAssert(typeof occurrence === 'string', `checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'occurrence' parameter should be a string not a '${typeof occurrence}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTN_TSV9DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const coqResultObject = await checkOriginalLanguageQuoteAndOccurrence(languageCode, repoCode, fieldName, fieldText, occurrence, bookID, givenC, givenV, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuoteAndOccurrence notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckTNOriginalLanguageQuoteAndOccurrence function


    // Main code for checkTN_TSV9DataRow function
    if (line === EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return drResult; // We can’t detect if it’s in the wrong place

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (tlcELerror) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    // const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    // const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook;
    try {
        //parameterAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in tn_table-row-check");
        numChaptersThisBook = books.chaptersInBook(bookID);
    } catch (tlcNCerror) {
        addNoticePartial({ priority: 979, message: "Invalid book identifier passed to checkTN_TSV9DataRow", location: ` '${bookID}' in first parameter: ${tlcNCerror}` });
    }
    const haveGoodBookID = numChaptersThisBook !== undefined;

    let fields = line.split('\t');
    let RIDSuggestion, SRSuggestion, GLQSuggestion, OQSuggestion, OSuggestion, ONSuggestion;
    if (fields.length === NUM_EXPECTED_TN_TSV_FIELDS) {
        const [B, C, V, rowID, supportReference, quote, occurrence, GLQuote, occurrenceNote] = fields;

        // Check the fields one-by-one
        if (B.length) {
            if (B !== bookID)
                addNoticePartial({ priority: 978, message: "Wrong book identifier", details: `expected '${bookID}'`, fieldName: 'Book', rowID, excerpt: B, location: ourRowLocation });
        }
        else
            addNoticePartial({ priority: 977, message: "Missing book identifier", characterIndex: 0, rowID, location: ourRowLocation });

        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C !== givenC)
                addNoticePartial({ priority: 976, message: "Wrong chapter number", details: `expected '${givenC}'`, fieldName: 'Chapter', rowID, excerpt: C, location: ourRowLocation });
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNoticePartial({ priority: 824, message: `Invalid zero chapter number`, excerpt: C, rowID, fieldName: 'Chapter', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNoticePartial({ priority: 823, message: `Invalid large chapter number`, excerpt: C, rowID, fieldName: 'Chapter', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                    haveGoodChapterNumber = true;
                } catch (tlcNVerror) {
                    if (!haveGoodBookID)
                        // addNoticePartial({priority:500, "Invalid chapter number", rowLocation);
                        // else
                        addNoticePartial({ priority: 822, message: "Unable to check chapter number", excerpt: C, rowID, fieldName: 'Chapter', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
            }
            else
                addNoticePartial({ priority: 821, message: "Bad chapter number", excerpt: C, rowID, fieldName: 'Chapter', location: ourRowLocation });
        }
        else
            addNoticePartial({ priority: 820, message: "Missing chapter number", rowID, fieldName: 'Chapter', location: ` ?:${V}${ourRowLocation}` });

        if (V.length) {
            if (V !== givenV)
                addNoticePartial({ priority: 975, message: "Wrong verse number", details: `expected '${givenV}'`, rowID, fieldName: 'Verse', excerpt: V, location: ourRowLocation });
            if (bookID === 'OBS' || V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0 && bookID !== 'PSA') // Psalms have \d as verse zero
                    addNoticePartial({ priority: 814, message: "Invalid zero verse number", rowID, fieldName: 'Verse', excerpt: V, location: ourRowLocation });
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNoticePartial({ priority: 813, message: "Invalid large verse number", details: `${bookID} chapter ${C} only has ${numVersesThisChapter} verses`, rowID, fieldName: 'Verse', excerpt: V, location: ourRowLocation });
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
            addNoticePartial({ priority: 931, message: "Missing row ID field", fieldName: 'Verse', location: ourRowLocation });
        else {
            if (rowID.length !== 4) {
                addNoticePartial({ priority: 778, message: "Row ID should be exactly 4 characters", details: `not ${rowID.length}`, rowID, fieldName: 'ID', excerpt: rowID, location: ourRowLocation });
                if (rowID.length > 4) RIDSuggestion = rowID.substring(0, 5);
                else { // must be < 4
                    RIDSuggestion = rowID;
                    while (RIDSuggestion.length < 4) RIDSuggestion += LC_ALPHABET_PLUS_DIGITS[Math.floor(Math.random() * LC_ALPHABET_PLUS_DIGITS.length)];;
                }
            } else if (LC_ALPHABET.indexOf(rowID[0]) < 0)
                addNoticePartial({ priority: 176, message: "Row ID should start with a lowercase letter", characterIndex: 0, rowID, fieldName: 'ID', excerpt: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS.indexOf(rowID[3]) < 0)
                addNoticePartial({ priority: 175, message: "Row ID should end with a lowercase letter or digit", characterIndex: 3, rowID, fieldName: 'ID', excerpt: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN.indexOf(rowID[1]) < 0)
                addNoticePartial({ priority: 174, message: "Row ID characters should only be lowercase letters, digits, or hypen", fieldName: 'ID', characterIndex: 1, rowID, excerpt: rowID, location: ourRowLocation });
            else if (LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN.indexOf(rowID[2]) < 0)
                addNoticePartial({ priority: 173, message: "Row ID characters should only be lowercase letters, digits, or hypen", fieldName: 'ID', characterIndex: 2, rowID, excerpt: rowID, location: ourRowLocation });
        }

        if (supportReference.length) { // need to check TN against TA
            if (isWhitespace(supportReference))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'SupportReference', rowID, location: ourRowLocation });
            else { // More than just whitespace
                if (!supportReference.startsWith('figs-')
                    && !supportReference.startsWith('grammar-')
                    && !supportReference.startsWith('translate-')
                    && !supportReference.startsWith('writing-')
                    && supportReference !== 'guidelines-sonofgodprinciples')
                    addNoticePartial({ priority: 788, message: "Only 'Just-In-Time Training' TA articles allowed here", fieldName: 'SupportReference', excerpt: supportReference, rowID, location: ourRowLocation });
                SRSuggestion = ourCheckTextField(rowID, 'SupportReference', supportReference, true, ourRowLocation, checkingOptions);
                if (!checkingOptions?.disableAllLinkFetchingFlag)
                    await ourCheckSupportReferenceInTA(rowID, 'SupportReference', supportReference, ourRowLocation, checkingOptions);
                if (occurrenceNote.indexOf(supportReference) < 0) // The full link is NOT in the note!
                    addNoticePartial({ priority: 787, message: "Link to TA should also be in OccurrenceNote", fieldName: 'SupportReference', excerpt: supportReference, rowID, location: ourRowLocation });
            }
            if (supportReference.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(supportReference, '\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, fieldName: 'SupportReference', rowID, location: ourRowLocation });
            }
        }
        // // TODO: Check if this is really required????
        // else if (/^\d+$/.test(C) && /^\d+$/.test(V)) // C:V are both digits
        //     addNoticePartial({ priority: 877, message: "Missing SupportReference field", fieldName: 'SupportReference', rowID, location: ourRowLocation });

        if (quote.length) { // need to check UTN against UHB and UGNT
            OQSuggestion = ourCheckTextField(rowID, 'OrigQuote', quote, false, ourRowLocation, checkingOptions);
            if (occurrence.length)
                await ourCheckTNOriginalLanguageQuoteAndOccurrence(rowID, 'OrigQuote', quote, occurrence, ourRowLocation, checkingOptions);
            else
                addNoticePartial({ priority: 750, message: "Missing occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, location: ourRowLocation });
        }
        else // TODO: Find more details about when these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (V !== 'intro' && occurrence !== '0')
                addNoticePartial({ priority: 919, message: "Missing OrigQuote field", fieldName: 'OrigQuote', rowID, location: ourRowLocation });

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn’t occur
                if (quote.length) {
                    addNoticePartial({ priority: 751, message: "Invalid zero occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, excerpt: occurrence, location: ourRowLocation });
                    OSuggestion = '1';
                }
                // if (V !== 'intro')
                //     addNoticePartial({priority:500, message:"Invalid zero occurrence field", rowID, location:rowLocation);
            }
            else if (occurrence === '-1') { } // TODO check the special conditions when this can occur???
            else if ('12345678'.indexOf(occurrence) < 0) { // it’s not one of these integers
                addNoticePartial({ priority: 792, message: `Invalid occurrence field`, fieldName: 'Occurrence', rowID, excerpt: occurrence, location: ourRowLocation });
                OSuggestion = '1';
            }
        }
        else if (quote.length) {
            addNoticePartial({ priority: 791, message: `Missing occurrence field`, fieldName: 'Occurrence', rowID, location: ourRowLocation });
            OSuggestion = '1';
        }

        if (GLQuote.length) { // TODO: need to check UTN against ULT
            if (GLQuote.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(GLQuote, '\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, fieldName: 'GLQuote', rowID, location: ourRowLocation });
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
                const charCount = countOccurrences(occurrenceNote, '\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, fieldName: 'OccurrenceNote', rowID, location: ourRowLocation });
            }
            if (isWhitespace(occurrenceNote))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'OccurrenceNote', rowID, location: ourRowLocation });
            else { // More than just whitespace
                const adjustedOccurrenceNote = occurrenceNote.replace(/<br>/g, '\n');
                ONSuggestion = await ourMarkdownTextChecks(rowID, 'OccurrenceNote', adjustedOccurrenceNote, true, ourRowLocation, checkingOptions);
                // await ourCheckNotesLinksToOutside(rowID, 'OccurrenceNote', adjustedOccurrenceNote, ourRowLocation, linkCheckingOptions);
                let regexResultArray, linksList = [], foundSR = false;
                while ((regexResultArray = TA_REGEX.exec(adjustedOccurrenceNote))) {
                    // debugLog("Got TA Regex in OccurrenceNote", JSON.stringify(regexResultArray));
                    linksList.push(regexResultArray[1])
                    if (regexResultArray[1] === supportReference) foundSR = true;
                }
                if (linksList.length && V !== 'intro') {
                    let details = supportReference ? `SR='${supportReference}'` : "empty SR field"
                    if (linksList.length > 1) details += `—found ${linksList.length} TA links`;
                    const excerpt = linksList.length > 1 ? JSON.stringify(linksList) : linksList[0];
                    if (foundSR) {
                        if (linksList.length > 1)
                            addNoticePartial({ priority: 786, message: "Shouldn’t have multiple TA links in OccurrenceNote", details, rowID, fieldName: 'OccurrenceNote', excerpt, location: ourRowLocation });
                    } else // didn't find SR
                        addNoticePartial({ priority: 789, message: "Should have a SupportReference when OccurrenceNote has a TA link", details, rowID, fieldName: 'OccurrenceNote', excerpt, location: ourRowLocation });
                }
            }
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            addNoticePartial({ priority: 274, message: "Missing OccurrenceNote field", fieldName: 'OccurrenceNote', rowID, location: ourRowLocation });

        // 9 [B, C, V, rowID, supportReference, quote, occurrence, GLQuote, occurrenceNote]
        const suggestion = `${B}\t${C}\t${V}\t${RIDSuggestion === undefined ? rowID : RIDSuggestion}\t${SRSuggestion === undefined ? supportReference : SRSuggestion}\t${OQSuggestion === undefined ? quote : OQSuggestion}\t${OSuggestion === undefined ? occurrence : OSuggestion}\t${GLQSuggestion === undefined ? GLQuote : GLQSuggestion}\t${ONSuggestion === undefined ? occurrenceNote : ONSuggestion}`;
        if (suggestion !== line) {
            // debugLog(`Had TN ${line}`);
            // debugLog(`Sug TN ${suggestion}`);
            drResult.suggestion = suggestion;
        }

    } else { // wrong number of fields in the row
        // Have a go at getting some of the first fields out of the row
        let rowID = '????';
        try { rowID = fields[3]; } catch { }
        addNoticePartial({ priority: 984, message: `Found wrong number of TSV fields (expected ${NUM_EXPECTED_TN_TSV_FIELDS})`, details: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, rowID, location: ourRowLocation });
    }

    // debugLog(`  checkTN_TSV9DataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkTN_TSV9DataRow result is", JSON.stringify(drResult));
    return drResult; // object with noticeList and possibly suggestion only
}
// end of checkTN_TSV9DataRow function
