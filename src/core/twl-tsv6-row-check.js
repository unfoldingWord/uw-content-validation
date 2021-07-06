import { DEFAULT_EXCERPT_LENGTH } from './defaults';
import { isWhitespace, countOccurrences } from './text-handling-functions';
import * as books from './books/books';
import { checkTextField } from './field-text-check';
// import { checkMarkdownText } from './markdown-text-check';
// import { checkSupportReferenceInTA } from './ta-reference-check';
import { checkNotesLinksToOutside } from './notes-links-check';
import { checkOriginalLanguageQuoteAndOccurrence } from './orig-quote-check';
// eslint-disable-next-line no-unused-vars
import { parameterAssert } from './utilities';


// const TWL_TABLE_ROW_VALIDATOR_VERSION_STRING = '0.1.8';

const NUM_EXPECTED_TWL_TSV_FIELDS = 6; // so expects 5 tabs per line
const EXPECTED_TWL_HEADING_LINE = 'Reference\tID\tTags\tOrigWords\tOccurrence\tTWLink';

const LC_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const LC_ALPHABET_PLUS_DIGITS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LC_ALPHABET_PLUS_DIGITS_PLUS_HYPHEN = 'abcdefghijklmnopqrstuvwxyz0123456789-';


/**
 *
 * @description - Checks one TSV data row of translation word links (TWL)
 * @param {string} languageCode - the language code, e.g., 'en'
 * @param {string} repoCode - 'TWL' or 'OBS-TWL'-- keeps parameter set consistent with other similar functions
 * @param {string} line - the TSV line to be checked
 * @param {string} bookID - 3-character UPPERCASE USFM book identifier or 'OBS'
 * @param {string} givenC - chapter number or (for OBS) story number string
 * @param {string} givenV - verse number or (for OBS) frame number string
 * @param {string} givenRowLocation - description of where the line is located
 * @param {Object} checkingOptions - may contain excerptLength parameter
 * @return {Object} - containing noticeList
 */
export async function checkTWL_TSV6DataRow(languageCode, repoCode, line, bookID, givenC, givenV, givenRowLocation, checkingOptions) {
    /* This function is only for checking one data row
          and the function doesn’t assume that it has any previous context.

        TWL being translation word-links.

        bookID is a three-character UPPERCASE USFM book identifier or 'OBS'
            so givenC and givenV are usually chapter number and verse number
                but can be story number and frame number for OBS.

        It’s designed to be able to quickly show errors for a single row being displayed/edited.

        Returns an object containing the noticeList.
    */
    // functionLog(`checkTWL_TSV6DataRow(${languageCode}, ${repoCode}, ${line}, ${bookID}, ${givenRowLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(languageCode !== undefined, "checkTWL_TSV6DataRow: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkTWL_TSV6DataRow: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    //parameterAssert(repoCode === 'TWL' || repoCode === 'OBS-TWL', `checkTWL_TSV6DataRow: repoCode expected 'TWL' or 'OBS-TWL' not '${repoCode}'`);
    //parameterAssert(line !== undefined, "checkTWL_TSV6DataRow: 'line' parameter should be defined");
    //parameterAssert(typeof line === 'string', `checkTWL_TSV6DataRow: 'line' parameter should be a string not a '${typeof line}'`);
    //parameterAssert(bookID !== undefined, "checkTWL_TSV6DataRow: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkTWL_TSV6DataRow: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    //parameterAssert(bookID.length === 3, `checkTWL_TSV6DataRow: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //parameterAssert(bookID.toUpperCase() === bookID, `checkTWL_TSV6DataRow: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkTWL_TSV6DataRow: '${bookID}' is not a valid USFM book identifier`);
    // //parameterAssert(givenC !== undefined, "checkTWL_TSV6DataRow: 'givenC' parameter should be defined");
    if (givenC) { //parameterAssert(typeof givenC === 'string', `checkTWL_TSV6DataRow: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    }
    // //parameterAssert(givenV !== undefined, "checkTWL_TSV6DataRow: 'givenV' parameter should be defined");
    if (givenV) { //parameterAssert(typeof givenV === 'string', `checkTWL_TSV6DataRow: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    }
    //parameterAssert(givenRowLocation !== undefined, "checkTWL_TSV6DataRow: 'givenRowLocation' parameter should be defined");
    //parameterAssert(typeof givenRowLocation === 'string', `checkTWL_TSV6DataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);
    //parameterAssert(givenRowLocation.indexOf('true') === -1, "checkTWL_TSV6DataRow: 'givenRowLocation' parameter should not be 'true'");

    let ourRowLocation = givenRowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    const linkCheckingOptions = { ...checkingOptions };
    linkCheckingOptions.twRepoLanguageCode = languageCode;

    let drResult = { noticeList: [] };

    function addNoticePartial(noticeObject) {
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
        // functionLog(`checkTWL_TSV6DataRow addNoticePartial(priority=${noticeObject.priority}) ${noticeObject.message}, ${noticeObject.characterIndex}, ${noticeObject.excerpt}, ${noticeObject.location}`);
        //parameterAssert(noticeObject.priority !== undefined, "checkTWL_TSV6DataRow addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `checkTWL_TSV6DataRow addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "checkTWL_TSV6DataRow addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `checkTWL_TSV6DataRow addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(lineNumber !== undefined, "checkTWL_TSV6DataRow addNoticePartial: 'lineNumber' parameter should be defined");
        // //parameterAssert(typeof lineNumber === 'number', `checkTWL_TSV6DataRow addNoticePartial: 'lineNumber' parameter should be a number not a '${typeof lineNumber}': ${lineNumber}`);
        // //parameterAssert(characterIndex !== undefined, "checkTWL_TSV6DataRow addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `checkTWL_TSV6DataRow addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "checkTWL_TSV6DataRow addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `checkTWL_TSV6DataRow addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "checkTWL_TSV6DataRow addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `checkTWL_TSV6DataRow addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // Also uses the given bookID,C,V, parameters from the main function call
        // noticeObject.debugChain = noticeObject.debugChain ? `checkTWL_TSV6DataRow ${noticeObject.debugChain}` : `checkTWL_TSV6DataRow(${repoCode})`;
        drResult.noticeList.push({ ...noticeObject, bookID, C: givenC, V: givenV });
    }

    function ourCheckTextField(rowID, fieldName, fieldText, allowedLinks, rowLocation, checkingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {string} rowID - 4-character row ID field
        * @param {string} fieldName - name of the field being checked
        * @param {string} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {string} rowLocation - description of where the line is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // functionLog(`checkTWL_TSV6DataRow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkTWL_TSV6DataRow ourCheckTextField: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkTWL_TSV6DataRow ourCheckTextField: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName !== undefined, "checkTWL_TSV6DataRow ourCheckTextField: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `checkTWL_TSV6DataRow ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldText !== undefined, "checkTWL_TSV6DataRow ourCheckTextField: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `checkTWL_TSV6DataRow ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "checkTWL_TSV6DataRow ourCheckTextField: allowedLinks parameter must be either true or false");
        //parameterAssert(rowLocation !== undefined, "checkTWL_TSV6DataRow ourCheckTextField: 'rowLocation' parameter should be defined");
        //parameterAssert(typeof rowLocation === 'string', `checkTWL_TSV6DataRow ourCheckTextField: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTWL_TSV6DataRow ourCheckTextField: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const fieldType = 'raw';
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


    async function ourCheckTNOriginalLanguageQuoteAndOccurrence(rowID, fieldName, fieldText, occurrence, rowLocation, checkingOptions) {
        // Checks that the Hebrew/Greek quote can be found in the original texts

        // Uses the bookID,C,V values from the main function call

        // Updates the global list of notices

        // functionLog(`checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
        //parameterAssert(rowID !== undefined, "checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName !== undefined, "checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldText !== undefined, "checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(occurrence !== undefined, "checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'occurrence' parameter should be defined");
        //parameterAssert(typeof occurrence === 'string', `checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'occurrence' parameter should be a string not a '${typeof occurrence}'`);
        //parameterAssert(rowLocation.indexOf(fieldName) < 0, `checkTWL_TSV6DataRow ourCheckTNOriginalLanguageQuoteAndOccurrence: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const colqResultObject = await checkOriginalLanguageQuoteAndOccurrence(languageCode, repoCode, fieldName, fieldText, occurrence, bookID, givenC, givenV, rowLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(colqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of colqResultObject.noticeList) {
            // //parameterAssert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuoteAndOccurrence notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckTNOriginalLanguageQuoteAndOccurrence function


    async function ourCheckNotesLinksToOutside(rowID, fieldName, twLinkText, rowLocation, checkingOptions) {
        // Checks that the TA/TW/Bible reference can be found

        // Updates the global list of notices

        // functionLog(`checkTWL_TSV6DataRow ourCheckNotesLinksToOutside(${rowID}, ${fieldName}, (${twLinkText.length}) '${twLinkText}', ${rowLocation}, ${JSON.stringify(checkingOptions)})`);
        //parameterAssert(rowID !== undefined, "checkTWL_TSV6DataRow ourCheckNotesLinksToOutside: 'rowID' parameter should be defined");
        //parameterAssert(typeof rowID === 'string', `checkTWL_TSV6DataRow ourCheckNotesLinksToOutside: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        //parameterAssert(fieldName === 'TWLink', `checkTWL_TSV6DataRow ourCheckNotesLinksToOutside: 'fieldName' parameter should be 'TWLink' not '${fieldName}'`);
        //parameterAssert(twLinkText !== undefined, "checkTWL_TSV6DataRow ourCheckNotesLinksToOutside: 'twLinkText' parameter should be defined");
        //parameterAssert(typeof twLinkText === 'string', `checkTWL_TSV6DataRow ourCheckNotesLinksToOutside: 'twLinkText' parameter should be a string not a '${typeof twLinkText}'`);

        let adjustedLanguageCode = languageCode; // This is the language code of the resource with the link
        if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won't be needed for TWs when we switch to TWLs)
        const coTNlResultObject = await checkNotesLinksToOutside(languageCode, repoCode, bookID, givenC, givenV, fieldName, twLinkText, rowLocation, { ...checkingOptions, defaultLanguageCode: adjustedLanguageCode });
        // debugLog(`coTNlResultObject=${JSON.stringify(coTNlResultObject)}`);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coTNlResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const coqNoticeEntry of coTNlResultObject.noticeList) {
            if (coqNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN2 check
                drResult.noticeList.push(coqNoticeEntry); // Just copy the complete notice as is
            else // For our direct checks, we add the repoCode as an extra value
                addNoticePartial({ ...coqNoticeEntry, rowID, fieldName });
        }
        // The following is needed coz we might be checking the linked TA and/or TW articles
        if (coTNlResultObject.checkedFileCount && coTNlResultObject.checkedFileCount > 0)
            if (typeof drResult.checkedFileCount === 'number') drResult.checkedFileCount += coTNlResultObject.checkedFileCount;
            else drResult.checkedFileCount = coTNlResultObject.checkedFileCount;
        if (coTNlResultObject.checkedFilesizes && coTNlResultObject.checkedFilesizes > 0)
            if (typeof drResult.checkedFilesizes === 'number') drResult.checkedFilesizes += coTNlResultObject.checkedFilesizes;
            else drResult.checkedFilesizes = coTNlResultObject.checkedFilesizes;
        if (coTNlResultObject.checkedRepoNames && coTNlResultObject.checkedRepoNames.length > 0)
            for (const checkedRepoName of coTNlResultObject.checkedRepoNames)
                try { if (drResult.checkedRepoNames.indexOf(checkedRepoName) < 0) drResult.checkedRepoNames.push(checkedRepoName); }
                catch { drResult.checkedRepoNames = [checkedRepoName]; }
        if (coTNlResultObject.checkedFilenameExtensions && coTNlResultObject.checkedFilenameExtensions.length > 0)
            for (const checkedFilenameExtension of coTNlResultObject.checkedFilenameExtensions)
                try { if (drResult.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) drResult.checkedFilenameExtensions.push(checkedFilenameExtension); }
                catch { drResult.checkedFilenameExtensions = [checkedFilenameExtension]; }
        // if (drResult.checkedFilenameExtensions) userLog("drResult", JSON.stringify(drResult));
    }
    // end of ourCheckNotesLinksToOutside function


    // Main code for checkTWL_TSV6DataRow function
    if (line === EXPECTED_TWL_HEADING_LINE) // Assume it must be ok
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
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook;
    if (bookID === 'OBS')
        numChaptersThisBook = 50; // There's 50 Open Bible Stories
    else {
        //parameterAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in checkTWL_TSV6DataRow");
        try {
            numChaptersThisBook = books.chaptersInBook(bookID);
        } catch (tlcNCerror) {
            addNoticePartial({ priority: 979, message: "Invalid book identifier passed to checkTWL_TSV6DataRow", location: ` '${bookID}' in first parameter: ${tlcNCerror}` });
        }
    }
    const haveGoodBookID = numChaptersThisBook !== undefined;

    let fields = line.split('\t');
    let RIDSuggestion, QSuggestion, OSuggestion, LSuggestion;
    if (fields.length === NUM_EXPECTED_TWL_TSV_FIELDS) {
        const [reference, rowID, tags, origWords, occurrence, TWLink] = fields;
        // let withString = ` with '${rowID}'${inString}`;
        // let CV_withString = ` ${C}:${V}${withString}`;
        // let atString = ` at ${B} ${C}:${V} (${rowID})${inString}`;

        // Check the fields one-by-one
        const [C, V] = reference.split(':');
        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C !== givenC)
                addNoticePartial({ priority: 976, message: "Wrong chapter number", details: `expected '${givenC}'`, fieldName: 'Reference', rowID, excerpt: C, location: ourRowLocation });
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNoticePartial({ priority: 824, message: `Invalid zero chapter number`, excerpt: C, rowID, fieldName: 'Reference', location: ourRowLocation });
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNoticePartial({ priority: 823, message: `Invalid large chapter number`, excerpt: C, rowID, fieldName: 'Reference', location: ourRowLocation });
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
                            addNoticePartial({ priority: 822, message: "Unable to check chapter number", excerpt: C, rowID, fieldName: 'Reference', location: ourRowLocation });
                        haveGoodChapterNumber = false;
                    }
                }
            }
            else
                addNoticePartial({ priority: 821, message: "Bad chapter number", excerpt: C, rowID, fieldName: 'Reference', location: ourRowLocation });
        }
        else
            addNoticePartial({ priority: 820, message: "Missing chapter number", rowID, fieldName: 'Reference', location: ` ?:${V}${ourRowLocation}` });

        if (V?.length) { // can be undefined if no colon at split above
            if (V !== givenV)
                addNoticePartial({ priority: 975, message: "Wrong verse number", details: `expected '${givenV}'`, rowID, fieldName: 'Reference', excerpt: V, location: ourRowLocation });
            if (bookID === 'OBS' || V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0 && bookID !== 'PSA') // Psalms have \d as verse zero
                    addNoticePartial({ priority: 814, message: "Invalid zero verse number", rowID, fieldName: 'Reference', excerpt: V, location: ourRowLocation });
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNoticePartial({ priority: 813, message: "Invalid large verse number", details: `${bookID} chapter ${C} only has ${numVersesThisChapter} verses`, rowID, fieldName: 'Reference', excerpt: V, location: ourRowLocation });
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
            addNoticePartial({ priority: 931, message: "Missing row ID field", fieldName: 'Reference', location: ourRowLocation });
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

        if (tags.length) {
            let tagsList = tags.split('; ');
            for (const thisTag of tagsList) {
                if (thisTag !== 'keyterm' && thisTag !== 'name')
                    addNoticePartial({ priority: 740, message: "Unrecognized tag", details: `found '${thisTag}' but expected 'keyterm' or 'name'`, excerpt: tags, fieldName: 'Tags', rowID, location: ourRowLocation });
            }
        }

        if (origWords.length) { // need to check UTN against UHB and UGNT
            QSuggestion = ourCheckTextField(rowID, 'OrigWords', origWords, false, ourRowLocation, checkingOptions);
            if (occurrence.length)
                await ourCheckTNOriginalLanguageQuoteAndOccurrence(rowID, 'OrigWords', origWords, occurrence, ourRowLocation, checkingOptions);
            else
                addNoticePartial({ priority: 750, message: "Missing occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, location: ourRowLocation });
        }
        else // TODO: Find more details about when these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (V !== 'intro' && occurrence !== '0')
                addNoticePartial({ priority: 919, message: "Missing OrigWords field", fieldName: 'OrigWords', rowID, location: ourRowLocation });

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn’t occur
                if (origWords.length) {
                    addNoticePartial({ priority: 751, message: "Invalid zero occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, excerpt: occurrence, location: ourRowLocation });
                    OSuggestion = '1';
                }
                // if (V !== 'intro')
                //     addNoticePartial({priority:500, message:"Invalid zero occurrence field", rowID, location:rowLocation);
            }
            else if (occurrence === '-1') { }// TODO check the special conditions when this can occur???
            else if ('12345678'.indexOf(occurrence) < 0) { // it’s not one of these integers
                addNoticePartial({ priority: 792, message: `Invalid occurrence field`, fieldName: 'Occurrence', rowID, excerpt: occurrence, location: ourRowLocation });
                OSuggestion = '1';
            }
        }
        else if (origWords.length) {
            addNoticePartial({ priority: 791, message: `Missing occurrence field`, fieldName: 'Occurrence', rowID, location: ourRowLocation });
            OSuggestion = '1';
        }

        if (TWLink.length) {
            // debugLog(`checkTWL_TSV6DataRow checking ${bookID} ${rowID} TWLink='${TWLink}'`);
            if (TWLink.indexOf('\u200B') >= 0) {
                const charCount = countOccurrences(TWLink, '\u200B');
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, fieldName: 'TWLink', rowID, location: ourRowLocation });
            }
            if (isWhitespace(TWLink))
                addNoticePartial({ priority: 796, message: "Field is only whitespace", fieldName: 'TWLink', rowID, location: ourRowLocation });
            else { // More than just whitespace
                if (!TWLink.startsWith('rc://*/tw/dict/bible/'))
                    addNoticePartial({ priority: 798, message: "Field doesn’t contain expected TW link", details: `should start with 'rc://*/tw/dict/bible/'`, fieldName: 'TWLink', rowID, location: ourRowLocation });
                else { // it starts correctly
                    const bits = TWLink.substring('rc://*/tw/dict/bible/'.length).split('/'); // Get the last two bits of the link path
                    // debugLog(`checkTWL_TSV6DataRow checking ${bookID} ${rowID} TWLink='${TWLink}' got bits=${JSON.stringify(bits)}`);
                    if (bits[0] !== 'kt' && bits[0] !== 'names' && bits[0] !== 'other') {
                        const characterIndex = 'rc://*/tw/dict/bible/'.length;
                        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + TWLink.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < TWLink.length ? '…' : '')
                        addNoticePartial({ priority: 797, message: "Field doesn’t contain proper TW link", details: `should be 'kt', 'names', or 'other'`, fieldName: 'TWLink', rowID, characterIndex, excerpt, location: ourRowLocation });
                    } else { // all good so far
                        // debugLog(`checkTWL_TSV6DataRow looking up ${bookID} ${rowID} TWLink='${TWLink}' got bits=${JSON.stringify(bits)}`);
                        await ourCheckNotesLinksToOutside(rowID, 'TWLink', TWLink, ourRowLocation, linkCheckingOptions);
                    }
                }
            }
        }
        else // TWLink is empty/missing
            addNoticePartial({ priority: 799, message: "Missing TWLink field", fieldName: 'TWLink', rowID, location: ourRowLocation });

        // 7 [reference, rowID, tags, quote, occurrence, TWLink]
        const suggestion = `${reference}\t${RIDSuggestion === undefined ? rowID : RIDSuggestion}\t${tags}\t${QSuggestion === undefined ? origWords : QSuggestion}\t${OSuggestion === undefined ? occurrence : OSuggestion}\t${LSuggestion === undefined ? TWLink : LSuggestion}`;
        if (suggestion !== line) {
            drResult.suggestion = suggestion;
        }

    } else { // wrong number of fields in the row
        // Have a go at getting some of the first fields out of the row
        let rowID = '????';
        try { rowID = fields[1]; } catch { }
        addNoticePartial({ priority: 984, message: `Found wrong number of TSV fields (expected ${NUM_EXPECTED_TWL_TSV_FIELDS})`, details: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, rowID, location: ourRowLocation });
    }

    // debugLog(`  checkTWL_TSV6DataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkTWL_TSV6DataRow result is", JSON.stringify(drResult));
    return drResult; // object with noticeList and possibly suggestion only
}
// end of checkTWL_TSV6DataRow function
