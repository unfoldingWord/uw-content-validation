import { DEFAULT_EXTRACT_LENGTH, isWhitespace } from './text-handling-functions'
import * as books from './books/books';
import { checkTextField } from './field-text-check';
import { checkMarkdownText } from './markdown-text-check';
import { checkSupportReferenceInTA } from './ta-reference-check';
import { checkTNLinksToOutside } from './tn-links-check';
import { checkOriginalLanguageQuote } from './orig-quote-check';


// const ANNOTATION_TABLE_ROW_VALIDATOR_VERSION_STRING = '0.5.5';

const NUM_EXPECTED_ANNOTATION_TSV_FIELDS = 7; // so expects 6 tabs per line
const EXPECTED_ANNOTATION_HEADING_LINE = 'Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tAnnotation';

const TA_REGEX = new RegExp('\\[\\[rc://[^ /]+?/ta/man/[^ /]+?/([^ \\]]+?)\\]\\]', 'g');


/**
 *
 * @description - Checks one TSV data row of translation notes (TN)
 * @param {String} languageCode - the language code, e.g., 'en'
 * @param {String} annotationType - TN, TQ, TWL, SN, or SQ -- allows more specific checks
 * @param {String} line - the TSV line to be checked
 * @param {String} bookID - 3-character UPPERCASE USFM book identifier or 'OBS'
 * @param {String} givenC - chapter number or (for OBS) story number string
 * @param {String} givenV - verse number or (for OBS) frame number string
 * @param {String} givenRowLocation - description of where the line is located
 * @param {Object} optionalCheckingOptions - may contain extractLength parameter
 * @return {Object} - containing noticeList
 */
export async function checkAnnotationTSVDataRow(languageCode, annotationType, line, bookID, givenC, givenV, givenRowLocation, optionalCheckingOptions) {
    /* This function is only for checking one data row
          and the function doesn't assume that it has any previous context.

        TN, TQ, TWL, SN, or SQ
            being translation or study notes, questions, or word-links.

        bookID is a three-character UPPERCASE USFM book identifier or 'OBS'
            so givenC and givenV are usually chapter number and verse number
                but can be story number and frame number for OBS.

        It's designed to be able to quickly show errors for a single row being displayed/edited.

        Returns an object containing the noticeList.
    */
    // console.log(`checkAnnotationTSVDataRow(${languageCode}, ${annotationType}, ${line}, ${bookID}, ${givenRowLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
    console.assert(languageCode !== undefined, "checkAnnotationTSVDataRow: 'languageCode' parameter should be defined");
    console.assert(typeof languageCode === 'string', `checkAnnotationTSVDataRow: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    console.assert(line !== undefined, "checkAnnotationTSVDataRow: 'line' parameter should be defined");
    console.assert(typeof line === 'string', `checkAnnotationTSVDataRow: 'line' parameter should be a string not a '${typeof line}'`);
    console.assert(bookID !== undefined, "checkAnnotationTSVDataRow: 'bookID' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkAnnotationTSVDataRow: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkAnnotationTSVDataRow: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(bookID.toUpperCase() === bookID, `checkAnnotationTSVDataRow: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    console.assert(bookID === 'OBS' || books.isValidBookID(bookID), `checkAnnotationTSVDataRow: '${bookID}' is not a valid USFM book identifier`);
    // console.assert(givenC !== undefined, "checkAnnotationTSVDataRow: 'givenC' parameter should be defined");
    if (givenC) console.assert(typeof givenC === 'string', `checkAnnotationTSVDataRow: 'givenC' parameter should be a string not a '${typeof givenC}'`);
    // console.assert(givenV !== undefined, "checkAnnotationTSVDataRow: 'givenV' parameter should be defined");
    if (givenV) console.assert(typeof givenV === 'string', `checkAnnotationTSVDataRow: 'givenV' parameter should be a string not a '${typeof givenV}'`);
    console.assert(givenRowLocation !== undefined, "checkAnnotationTSVDataRow: 'givenRowLocation' parameter should be defined");
    console.assert(typeof givenRowLocation === 'string', `checkAnnotationTSVDataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);

    let ourRowLocation = givenRowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    const linkCheckingOptions = { ...optionalCheckingOptions };
    linkCheckingOptions.taRepoLanguageCode = languageCode;

    let drResult = { noticeList: [] };

    function addNoticePartial(noticeObject) {
        /**
        * @description - adds a new notice entry, adding bookID,C,V to the given fields
        * @param {Number} priority - notice priority from 1 (lowest) to 999 (highest)
        * @param {String} message - the text of the notice message
        * @param {String} rowID - 4-character row ID field
        * @param {Number} lineNumber - one-based line number
        * @param {Number} characterIndex - zero-based index of where the issue occurs in the line
        * @param {String} extract - short extract from the line centred on the problem (if available)
        * @param {String} location - description of where the issue is located
        */
        // console.log(`checkAnnotationTSVDataRow addNoticePartial(priority=${noticeObject.priority}) ${noticeObject.message}, ${noticeObject.characterIndex}, ${noticeObject.extract}, ${noticeObject.location}`);
        console.assert(noticeObject.priority !== undefined, "checkAnnotationTSVDataRow addNoticePartial: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `checkAnnotationTSVDataRow addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "checkAnnotationTSVDataRow addNoticePartial: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `checkAnnotationTSVDataRow addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(lineNumber !== undefined, "checkAnnotationTSVDataRow addNoticePartial: 'lineNumber' parameter should be defined");
        // console.assert(typeof lineNumber === 'number', `checkAnnotationTSVDataRow addNoticePartial: 'lineNumber' parameter should be a number not a '${typeof lineNumber}': ${lineNumber}`);
        // console.assert(characterIndex !== undefined, "checkAnnotationTSVDataRow addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `checkAnnotationTSVDataRow addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "checkAnnotationTSVDataRow addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `checkAnnotationTSVDataRow addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "checkAnnotationTSVDataRow addNoticePartial: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `checkAnnotationTSVDataRow addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        // Also uses the given bookID,C,V, parameters from the main function call
        drResult.noticeList.push({ ...noticeObject, bookID, C: givenC, V: givenV });
    }

    function ourMarkdownTextChecks(rowID, fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions) {
        /**
        * @description - checks the given markdown field and processes the returned results
        * @param {String} rowID - 4-character row ID field
        * @param {String} fieldName - name of the field being checked
        * @param {String} fieldText - the actual text of the field being checked
        * @param {} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {String} rowLocation - description of where the line is located
        * @param {Object} optionalCheckingOptions - parameters that might affect the check
        */
        // Does markdown checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // We don't currently use the allowedLinks parameter

        // console.log(`checkAnnotationTSVDataRow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "checkAnnotationTSVDataRow ourMarkdownTextChecks: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `checkAnnotationTSVDataRow ourMarkdownTextChecks: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        // console.assert(fieldName !== undefined, "checkAnnotationTSVDataRow ourMarkdownTextChecks: 'fieldName' parameter should be defined");
        // console.assert(typeof fieldName === 'string', `checkAnnotationTSVDataRow ourMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldName === 'Annotation', "checkAnnotationTSVDataRow ourMarkdownTextChecks: Only run this check on Annotations")
        console.assert(fieldText !== undefined, "checkAnnotationTSVDataRow ourMarkdownTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `checkAnnotationTSVDataRow ourMarkdownTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "checkAnnotationTSVDataRow ourMarkdownTextChecks: allowedLinks parameter must be either true or false");
        console.assert(rowLocation.indexOf(fieldName) < 0, `checkAnnotationTSVDataRow ourMarkdownTextChecks: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const cmtResultObject = checkMarkdownText(fieldName, fieldText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(cmtResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of cmtResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourMarkdownTextChecks notice length=${Object.keys(noticeEntry).length}`);
            // NOTE: Ellipses in Annotation have the normal meaning
            //          not like the specialised meaning in the Quote snippet fields
            if (noticeEntry.priority !== 178 && noticeEntry.priority !== 179 // unexpected space after ellipse, ellipse after space
                && !noticeEntry.message.startsWith("Unexpected … character after space") // 191
            )
                addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourMarkdownTextChecks function

    function ourCheckTextField(rowID, fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {String} rowID - 4-character row ID field
        * @param {String} fieldName - name of the field being checked
        * @param {String} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {String} rowLocation - description of where the line is located
        * @param {Object} optionalCheckingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // console.log(`checkAnnotationTSVDataRow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "checkAnnotationTSVDataRow ourCheckTextField: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `checkAnnotationTSVDataRow ourCheckTextField: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "checkAnnotationTSVDataRow ourCheckTextField: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `checkAnnotationTSVDataRow ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "checkAnnotationTSVDataRow ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `checkAnnotationTSVDataRow ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "checkAnnotationTSVDataRow ourCheckTextField: allowedLinks parameter must be either true or false");
        console.assert(rowLocation.indexOf(fieldName) < 0, `checkAnnotationTSVDataRow ourCheckTextField: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const fieldType = fieldName === 'Annotation' ? 'markdown' : 'raw';
        const dbtcResultObject = checkTextField(fieldType, fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of dbtcResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckTextField function

    async function ourCheckSupportReferenceInTA(rowID, fieldName, taLinkText, rowLocation, optionalCheckingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // console.log(`checkAnnotationTSVDataRow ourCheckSupportReferenceInTA(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "checkAnnotationTSVDataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `checkAnnotationTSVDataRow ourCheckSupportReferenceInTA: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "checkAnnotationTSVDataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `checkAnnotationTSVDataRow ourCheckSupportReferenceInTA: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(taLinkText !== undefined, "checkAnnotationTSVDataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be defined");
        console.assert(typeof taLinkText === 'string', `checkAnnotationTSVDataRow ourCheckSupportReferenceInTA: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);
        console.assert(rowLocation.indexOf(fieldName) < 0, `checkAnnotationTSVDataRow ourCheckSupportReferenceInTA: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const coqResultObject = await checkSupportReferenceInTA(fieldName, taLinkText, rowLocation, { ...optionalCheckingOptions, taRepoLanguageCode: languageCode, expectFullLink: true });

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckSupportReferenceInTA notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckSupportReferenceInTA function


    async function ourCheckTNOriginalLanguageQuote(rowID, fieldName, fieldText, occurrence, rowLocation, optionalCheckingOptions) {
        // Checks that the Hebrew/Greek quote can be found in the original texts

        // Uses the bookID,C,V values from the main function call

        // Updates the global list of notices

        // console.log(`checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(occurrence !== undefined, "checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'occurrence' parameter should be defined");
        console.assert(typeof occurrence === 'string', `checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'occurrence' parameter should be a string not a '${typeof occurrence}'`);
        console.assert(rowLocation.indexOf(fieldName) < 0, `checkAnnotationTSVDataRow ourCheckTNOriginalLanguageQuote: 'rowLocation' parameter should be not contain fieldName=${fieldName}`);

        const coqResultObject = await checkOriginalLanguageQuote(languageCode, fieldName, fieldText, occurrence, bookID, givenC, givenV, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuote notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, rowID, fieldName });
        }
    }
    // end of ourCheckTNOriginalLanguageQuote function


    async function ourCheckTNLinksToOutside(rowID, fieldName, taLinkText, rowLocation, optionalCheckingOptions) {
        // Checks that the TA/TW/Bible reference can be found

        // Updates the global list of notices

        // console.log(`checkAnnotationTSVDataRow ourCheckTNLinksToOutside(${rowID}, ${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "checkAnnotationTSVDataRow ourCheckTNLinksToOutside: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `checkAnnotationTSVDataRow ourCheckTNLinksToOutside: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "checkAnnotationTSVDataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `checkAnnotationTSVDataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldName === 'Annotation', `checkAnnotationTSVDataRow ourCheckTNLinksToOutside: 'fieldName' parameter should be 'Annotation' not '${fieldName}'`);
        console.assert(taLinkText !== undefined, "checkAnnotationTSVDataRow ourCheckTNLinksToOutside: 'taLinkText' parameter should be defined");
        console.assert(typeof taLinkText === 'string', `checkAnnotationTSVDataRow ourCheckTNLinksToOutside: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

        const coqResultObject = await checkTNLinksToOutside(bookID, fieldName, taLinkText, rowLocation, { ...optionalCheckingOptions, defaultLanguageCode: languageCode });
        // console.log("coqResultObject", JSON.stringify(coqResultObject));

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const coqNoticeEntry of coqResultObject.noticeList) {
            if (coqNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN check
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
        // if (drResult.checkedFilenameExtensions) console.log("drResult", JSON.stringify(drResult));
    }
    // end of ourCheckTNLinksToOutside function


    // Main code for checkAnnotationTSVDataRow function
    if (line === EXPECTED_ANNOTATION_HEADING_LINE) // Assume it must be ok
        return drResult; // We can't detect if it's in the wrong place

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (tlcELerror) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
    // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook;
    if (bookID === 'OBS')
        numChaptersThisBook = 50; // There's 50 Open Bible Stories
    else {
        console.assert(lowercaseBookID !== 'obs', "Shouldn't happen in annotation-row-check");
        try {
            numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
        } catch (tlcNCerror) {
            addNoticePartial({ priority: 979, message: "Invalid book identifier passed to checkAnnotationTSVDataRow", location: ` '${bookID}' in first parameter: ${tlcNCerror}` });
        }
    }
    const haveGoodBookID = numChaptersThisBook !== undefined;

    let fields = line.split('\t');
    if (fields.length === NUM_EXPECTED_ANNOTATION_TSV_FIELDS) {
        const [reference, rowID, tags, supportReference, quote, occurrence, annotation] = fields;
        // let withString = ` with '${rowID}'${inString}`;
        // let CV_withString = ` ${C}:${V}${withString}`;
        // let atString = ` at ${B} ${C}:${V} (${rowID})${inString}`;

        // Check the fields one-by-one
        const [C, V] = reference.split(':');
        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C !== givenC)
                addNoticePartial({ priority: 976, message: "Wrong chapter number", details: `(expected '${givenC}')`, fieldName: 'Reference', rowID, extract: C, location: ourRowLocation });
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
                addNoticePartial({ priority: 975, message: "Wrong verse number", details: `(expected '${givenV}')`, rowID, fieldName: 'Reference', extract: V, location: ourRowLocation });
            if (V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0)
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
            if (rowID.length !== 4)
                addNoticePartial({ priority: 778, message: "Row ID should be exactly 4 characters", rowID, fieldName: 'ID', location: ` (not ${rowID.length})${ourRowLocation}` });
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(rowID[0]) < 0)
                addNoticePartial({ priority: 176, message: "Row ID should start with a lowercase letter or digit", characterIndex: 0, rowID, fieldName: 'ID', location: ` (not '${rowID[0]}')${ourRowLocation}` });
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(rowID[3]) < 0)
                addNoticePartial({ priority: 175, message: "Row ID should end with a lowercase letter or digit", characterIndeX: 3, rowID, fieldName: 'ID', location: ` (not '${rowID[3]}')${ourRowLocation}` });
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(rowID[1]) < 0)
                addNoticePartial({ priority: 174, message: "Row ID characters should only be lowercase letters, digits, or hypen", fieldName: 'ID', characterIndex: 1, rowID, location: ` (not '${rowID[1]}')${ourRowLocation}` });
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(rowID[2]) < 0)
                addNoticePartial({ priority: 173, message: "Row ID characters should only be lowercase letters, digits, or hypen", fieldName: 'ID', characterIndex: 2, rowID, location: ` (not '${rowID[2]}')${ourRowLocation}` });
        }

        if (tags.length)
            ;

        if (supportReference.length) { // need to check TN against TA
            if (isWhitespace(supportReference))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'SupportReference', rowID, location: ourRowLocation });
            else if (annotationType === 'TN') { // More than just whitespace
                const supportReferenceArticlePart = supportReference.replace('rc://*/ta/man/translate/', '');
                // console.log("supportReferenceArticlePart", supportReferenceArticlePart);
                if (!supportReferenceArticlePart.startsWith('figs-')
                    && !supportReferenceArticlePart.startsWith('grammar-')
                    && !supportReferenceArticlePart.startsWith('translate-')
                    && !supportReferenceArticlePart.startsWith('writing-')
                    && supportReferenceArticlePart !== 'guidelines-sonofgodprinciples')
                    addNoticePartial({ priority: 788, message: "Only 'Just-In-Time Training' TA articles allowed here", fieldName: 'SupportReference', extract: supportReference, rowID, location: ourRowLocation });
                ourCheckTextField(rowID, 'SupportReference', supportReference, true, ourRowLocation, optionalCheckingOptions);
                await ourCheckSupportReferenceInTA(rowID, 'SupportReference', supportReference, ourRowLocation, optionalCheckingOptions);
                if (annotation.indexOf(supportReference) < 0)
                    addNoticePartial({ priority: 787, message: "Link to TA should also be in Annotation", fieldName: 'SupportReference', extract: supportReference, rowID, location: ourRowLocation });
            }
            if (supportReference.indexOf('\u200B') >= 0)
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", fieldName: 'SupportReference', rowID, location: ourRowLocation });
        }
        // // TODO: Check if this is really required????
        // else if (/^\d+$/.test(C) && /^\d+$/.test(V)) // C:V are both digits
        //     addNoticePartial({ priority: 877, message: "Missing SupportReference field", fieldName: 'SupportReference', rowID, location: ourRowLocation });

        if (quote.length) { // need to check UTN against UHB and UGNT
            ourCheckTextField(rowID, 'Quote', quote, false, ourRowLocation, optionalCheckingOptions);
            if (occurrence.length)
                await ourCheckTNOriginalLanguageQuote(rowID, 'Quote', quote, occurrence, ourRowLocation, optionalCheckingOptions);
        }
        else // TODO: Find more details about when these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (annotationType === 'TN' && V !== 'intro' && occurrence !== '0')
                addNoticePartial({ priority: 919, message: "Missing Quote field", fieldName: 'Quote', rowID, location: ourRowLocation });

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn't occur
                if (quote.length)
                    addNoticePartial({ priority: 550, message: "Invalid zero occurrence field when we have an original quote", fieldName: 'Occurrence', rowID, location: ourRowLocation });
                // if (V !== 'intro')
                //     addNoticePartial({priority:500, message:"Invalid zero occurrence field", rowID, location:rowLocation);
            }
            else if (occurrence === '-1') // TODO check the special conditions when this can occur???
                ;
            else if ('1234567'.indexOf(occurrence) < 0) // it's not one of these integers
                addNoticePartial({ priority: 792, message: `Invalid occurrence field`, fieldName: 'Occurrence', rowID, extract: occurrence, location: ourRowLocation });
        }
        else if (quote.length)
            addNoticePartial({ priority: 791, message: `Missing occurrence field`, fieldName: 'Occurrence', rowID, location: ourRowLocation });

        if (annotation.length) {
            if (annotation.indexOf('\u200B') >= 0)
                addNoticePartial({ priority: 374, message: "Field contains zero-width space(s)", fieldName: 'Annotation', rowID, location: ourRowLocation });
            if (isWhitespace(annotation))
                addNoticePartial({ priority: 373, message: "Field is only whitespace", fieldName: 'Annotation', rowID, location: ourRowLocation });
            else { // More than just whitespace
                ourMarkdownTextChecks(rowID, 'Annotation', annotation, true, ourRowLocation, optionalCheckingOptions);
                await ourCheckTNLinksToOutside(rowID, 'Annotation', annotation, ourRowLocation, linkCheckingOptions);
                let regexResultArray;
                // eslint-disable-next-line no-cond-assign
                while (regexResultArray = TA_REGEX.exec(annotation)) {
                    // console.log("Got TA Regex in Annotation", JSON.stringify(regexResultArray));
                    const adjustedLink = regexResultArray[0].substring(2, regexResultArray[0].length - 2)
                    if (supportReference !== adjustedLink && V !== 'intro') {
                        const details = supportReference ? `(SR='${supportReference}')` : "(empty SR field)"
                        addNoticePartial({ priority: 786, message: "Link to TA should also be in SupportReference", details, rowID, fieldName: 'Annotation', extract: adjustedLink, location: ourRowLocation });
                    }
                }
            }
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (annotationType === 'TN')
                addNoticePartial({ priority: 274, message: "Missing Annotation field", fieldName: 'Annotation', rowID, location: ourRowLocation });

    } else { // wrong number of fields in the row
        // Have a go at getting some of the first fields out of the row
        let rowID = '????';
        try { rowID = fields[1]; } catch { }
        addNoticePartial({ priority: 984, message: `Found wrong number of TSV fields (expected ${NUM_EXPECTED_ANNOTATION_TSV_FIELDS})`, details: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, rowID, location: ourRowLocation });
    }

    // console.log(`  checkAnnotationTSVDataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkAnnotationTSVDataRow result is", JSON.stringify(drResult));
    return drResult; // object with noticeList only
}
// end of checkAnnotationTSVDataRow function
