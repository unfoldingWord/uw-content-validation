import * as books from './books/books';
import doBasicTextChecks from './basic-text-check';
import checkMarkdownText from './markdown-text-check';
import checkTAReference from './ta-reference-check';
import checkTNLinks from './tn-links-check';
import checkOriginalLanguageQuote from './quote-check';


const TABLE_LINE_VALIDATOR_VERSION = '0.1.0';

const NUM_EXPECTED_TSV_FIELDS = 7; // so expects 6 tabs per line
const EXPECTED_TN_HEADING_LINE = 'Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tAnnotation';

const DEFAULT_EXTRACT_LENGTH = 10;


async function checkAnnotationTSVDataRow(annotationType, line, bookID, C, V, givenRowLocation, optionalCheckingOptions) {
    /**
    * @description - Checks one TSV data row of translation notes (TN)
    * @param {String} annotationType - TN, TQ, TWL, SN, or SQ -- allows more specific checks
    * @param {String} line - the TSV line to be checked
    * @param {String} bookID - 3-character UPPERCASE USFM book identifier or 'OBS'
    * @param {String} C - chapter number or (for OBS) story number string
    * @param {String} V - verse number or (for OBS) frame number string
    * @param {String} givenRowLocation - description of where the line is located
    * @param {Object} optionalCheckingOptions - may contain extractLength parameter
    * @return {Object} - containing noticeList
    */
    /* This function is only for checking one data row
          and the function doesn't assume that it has any previous context.

        annotationType is a 2-3 character string, being
            TN, TQ, TWL, SN, or SQ
                being translation or study notes, questions, or word-links.

        bookID is a three-character UPPERCASE USFM book identifier or 'OBS'
            so C and V are usually chapter number and verse number
                but can be story number and frame number for OBS.

        It's designed to be able to quickly show errors for a single row being displayed/edited.

        Returns an object containing the noticeList.
    */
    // console.log(`checkAnnotationTSVDataRow(${annotationType}, ${line}, ${bookID} ${C}:${V} ${givenRowLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
    console.assert(annotationType !== undefined, "checkAnnotationTSVDataRow: 'annotationType' parameter should be defined");
    console.assert(typeof annotationType === 'string', `checkAnnotationTSVDataRow: 'annotationType' parameter should be a string not a '${typeof annotationType}'`);
    console.assert(annotationType.length === 2 || annotationType.length === 3, `checkAnnotationTSVDataRow: 'annotationType' parameter should be 2-3 characters long not ${annotationType.length}`);
    console.assert(line !== undefined, "checkAnnotationTSVDataRow: 'line' parameter should be defined");
    console.assert(typeof line === 'string', `checkAnnotationTSVDataRow: 'line' parameter should be a string not a '${typeof line}'`);
    console.assert(bookID !== undefined, "checkAnnotationTSVDataRow: 'bookID' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkAnnotationTSVDataRow: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkAnnotationTSVDataRow: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(books.isValidBookID(bookID), `checkAnnotationTSVDataRow: '${bookID}' is not a valid USFM book identifier`);
    console.assert(C !== undefined, "checkAnnotationTSVDataRow: 'C' parameter should be defined");
    console.assert(typeof C === 'string', `checkAnnotationTSVDataRow: 'C' parameter should be a string not a '${typeof C}'`);
    console.assert(V !== undefined, "checkAnnotationTSVDataRow: 'V' parameter should be defined");
    console.assert(typeof V === 'string', `checkAnnotationTSVDataRow: 'V' parameter should be a string not a '${typeof V}'`);
    console.assert(givenRowLocation !== undefined, "checkAnnotationTSVDataRow: 'givenRowLocation' parameter should be defined");
    console.assert(typeof givenRowLocation === 'string', `checkAnnotationTSVDataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);

    let ourRowLocation = givenRowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    let adrResult = { noticeList: [] };

    function addNotice5to8(priority, message, characterIndex, extract, location) {
        /**
        * @description - adds a new notice entry, adding bookID,C,V to the given fields
        * @param {Number} priority - notice priority from 1 (lowest) to 999 (highest)
        * @param {String} message - the text of the notice message
        * @param {Number} characterIndex - where the issue occurs in the line (or -1 if unknown)
        * @param {String} extract - short extract from the line centred on the problem (if available)
        * @param {String} location - description of where the issue is located
        */
        // console.log(`Annotation TSV Line Notice: (priority=${priority}) ${message}, ${characterIndex}, ${extract}, ${location}`);
        console.assert(priority !== undefined, "cATSVrow addNotice5to8: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cATSVrow addNotice5to8: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "cATSVrow addNotice5to8: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cATSVrow addNotice5to8: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        console.assert(characterIndex !== undefined, "cATSVrow addNotice5to8: 'characterIndex' parameter should be defined");
        console.assert(typeof characterIndex === 'number', `cATSVrow addNotice5to8: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        console.assert(extract !== undefined, "cATSVrow addNotice5to8: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `cATSVrow addNotice5to8: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cATSVrow addNotice5to8: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cATSVrow addNotice5to8: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        // Also uses the given bookID,C,V, parameters from the main function call
        adrResult.noticeList.push({ priority, bookID, C, V, message, characterIndex, extract, location });
    }

    function doOurMarkdownTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions) {
        /**
        * @description - checks the given markdown field and processes the returned results
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

        // console.log(`cATSVrow doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cATSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cATSVrow doOurMarkdownTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cATSVrow doOurMarkdownTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cATSVrow doOurMarkdownTextChecks: allowedLinks parameter must be either true or false");

        const cmtResultObject = checkMarkdownText(fieldName, fieldText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(cmtResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of cmtResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL doOurMarkdownTextChecks notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.characterIndex, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of doOurMarkdownTextChecks function

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {String} fieldName - name of the field being checked
        * @param {String} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {String} rowLocation - description of where the line is located
        * @param {Object} optionalCheckingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // console.log(`cATSVrow doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cATSVrow doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow doOurBasicTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cATSVrow doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cATSVrow doOurBasicTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cATSVrow doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const dbtcResultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of dbtcResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL doOurBasicTextChecks notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.characterIndex, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of doOurBasicTextChecks function

    async function ourCheckTAReference(fieldName, taLinkText, rowLocation, optionalCheckingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // console.log(`cATSVrow ourCheckTAReference(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cATSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(taLinkText !== undefined, "cATSVrow ourCheckTAReference: 'taLinkText' parameter should be defined");
        console.assert(typeof taLinkText === 'string', `cATSVrow ourCheckTAReference: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

        const coqResultObject = await checkTAReference(fieldName, taLinkText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTAReference notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.characterIndex, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of ourCheckTAReference function

    async function ourCheckTNOriginalLanguageQuote(fieldName, fieldText, rowLocation, optionalCheckingOptions) {
        // Checks that the Hebrew/Greek quote can be found in the original texts

        // Uses the bookID,C,V values from the main function call

        // Updates the global list of notices

        // console.log(`cATSVrow ourCheckTNOriginalLanguageQuote(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cATSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cATSVrow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cATSVrow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);

        const coqResultObject = await checkOriginalLanguageQuote(fieldName, fieldText, bookID, C, V, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuote notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.characterIndex, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of ourCheckTNOriginalLanguageQuote function

    async function ourCheckTNLinks(fieldName, taLinkText, rowLocation, optionalCheckingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // console.log(`cATSVrow ourCheckTNLinks(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cATSVrow ourCheckTNLinks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow ourCheckTNLinks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(taLinkText !== undefined, "cATSVrow ourCheckTNLinks: 'taLinkText' parameter should be defined");
        console.assert(typeof taLinkText === 'string', `cATSVrow ourCheckTNLinks: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

        const coqResultObject = await checkTNLinks(bookID, fieldName, taLinkText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNLinks notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.characterIndex, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of ourCheckTNLinks function


    // Main code for checkAnnotationTSVDataRow function
    if (line === EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return adrResult; // We can't detect if it's in the wrong place

    addNotice5to8(998, "checkAnnotationTSVDataRow() is still a placeholder -- not completed yet", -1, "", ourRowLocation);

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
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    let numChaptersThisBook;
    if (bookID != 'OBS') {
        const lowercaseBookID = bookID.toLowerCase();
        try {
            numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
        } catch (tlcNCerror) {
            addNotice5to8(979, "Invalid book identifier passed to checkAnnotationTSVDataRow", -1, "", ` '${bookID}' in first parameter: ${tlcNCerror}`);
        }
    }
    const haveBibleBookID = numChaptersThisBook !== undefined;

    // let inString;
    // if (rowLocation) inString = rowLocation;
    // else inString = ` in line ${rowNumber.toLocaleString()}`;

    let fields = line.split('\t');
    if (fields.length === NUM_EXPECTED_TSV_FIELDS) {
        const [reference, fieldID, tags, supportReference, quote, occurrence, annotation] = fields;
        // let withString = ` with '${fieldID}'${inString}`;
        // let CV_withString = ` ${C}:${V}${withString}`;
        // let atString = ` at ${B} ${C}:${V} (${fieldID})${inString}`;

        // Check the fields one-by-one
        const [C, V] = reference.split(':')
        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNotice5to8(824, `Invalid zero chapter number`, -1, C, ourRowLocation);
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNotice5to8(823, `Invalid large chapter number`, -1, C, ourRowLocation);
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                    haveGoodChapterNumber = true;
                } catch (tlcNVerror) {
                    if (!haveBibleBookID)
                        // addNotice5to8(500, "Invalid chapter number", rowLocation);
                        // else
                        addNotice5to8(822, "Unable to check chapter number", -1, "", ` '${C}'${ourRowLocation}`);
                    haveGoodChapterNumber = false;
                }
            }
            else
                addNotice5to8(821, "Bad chapter number", -1, "", ` '${C}' with${ourRowLocation}`);
        }
        else
            addNotice5to8(820, "Missing chapter number", -1, "", ` ?:${V}${ourRowLocation}`);

        if (V.length) {
            if (V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0)
                    addNotice5to8(814, `Invalid zero '${V}' verse number`, -1, "", ourRowLocation);
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNotice5to8(813, `Invalid large '${V}' verse number`, ` for chapter ${C}${ourRowLocation}`);
                    } else
                        addNotice5to8(812, "Unable to check verse number", -1, "", ` '${V}'${ourRowLocation}`);
                }
            }
            else
                addNotice5to8(811, "Bad verse number", -1, "", ` '${V}'${ourRowLocation}`);
        }
        else
            addNotice5to8(810, "Missing verse number", -1, "", ` after ${C}:?${ourRowLocation}`);

        if (!fieldID.length)
            addNotice5to8(779, "Missing ID field", -1, "", ourRowLocation);
        else {
            if (fieldID.length !== 4)
                addNotice5to8(778, "ID should be exactly 4 characters", -1, "", ` (not ${fieldID.length})${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[0]) < 0)
                addNotice5to8(176, "ID should start with a lowercase letter or digit", 0, "", ` (not '${fieldID[0]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[3]) < 0)
                addNotice5to8(175, "ID should end with a lowercase letter or digit", 3, "", ` (not '${fieldID[3]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[1]) < 0)
                addNotice5to8(174, "ID characters should only be lowercase letters, digits, or hypen", 1, "", ` (not '${fieldID[1]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[2]) < 0)
                addNotice5to8(173, "ID characters should only be lowercase letters, digits, or hypen", 2, "", ` (not '${fieldID[2]}')${ourRowLocation}`)
        }

        if (tags.length)
            ;

        if (supportReference.length) { // need to check UTN against UTA
            doOurBasicTextChecks('SupportReference', supportReference, true, ourRowLocation, optionalCheckingOptions);
            await ourCheckTAReference('SupportReference', supportReference, ourRowLocation, optionalCheckingOptions);
        }
        // else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
        //     addNotice5to8(277, "Missing SupportReference field", -1, "", ourRowLocation);

        if (quote.length) { // need to check UTN against UHB and UGNT
            doOurBasicTextChecks('Quote', quote, false, ourRowLocation, optionalCheckingOptions);
            await ourCheckTNOriginalLanguageQuote('Quote', quote, ourRowLocation, optionalCheckingOptions);
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (V !== 'intro')
                addNotice5to8(276, "Missing Quote field", -1, "", ourRowLocation);

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn't occur
                if (quote.length)
                    addNotice5to8(550, "Invalid zero occurrence field when we have an original quote", -1, "", ourRowLocation);
                // if (V !== 'intro')
                //     addNotice5to8(500, "Invalid zero occurrence field", -1, "", rowLocation);
            }
            else if (occurrence === '-1') // TODO check the special conditions when this can occur???
                ;
            else if ('12345'.indexOf(occurrence) < 0) // it's not one of these integers
                addNotice5to8(792, `Invalid '${occurrence}' occurrence field`, -1, "", ourRowLocation);
        }

        if (annotation.length) {
            doOurMarkdownTextChecks('Annotation', annotation, true, ourRowLocation, optionalCheckingOptions);
            await ourCheckTNLinks('Annotation', annotation, ourRowLocation, optionalCheckingOptions);
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            addNotice5to8(274, `Missing ${annotationType} Annotation field`, -1, "", ourRowLocation);

    } else
        addNotice5to8(861, `Found wrong number of TSV fields (expected ${NUM_EXPECTED_TSV_FIELDS})`, -1, `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, ourRowLocation);

    // console.log(`  checkAnnotationTSVDataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkAnnotationTSVDataRow result is", JSON.stringify(drResult));
    return adrResult; // object with noticeList only
}
// end of checkAnnotationTSVDataRow function

export default checkAnnotationTSVDataRow;
