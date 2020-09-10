import * as books from './books/books';
import checkTextField from './field-text-check';
import checkMarkdownText from './markdown-text-check';
import checkTAReference from './ta-reference-check';
import checkTNLinks from './tn-links-check';
import checkOriginalLanguageQuote from './quote-check';


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
    // console.assert(C !== undefined, "checkAnnotationTSVDataRow: 'C' parameter should be defined");
    if (C) console.assert(typeof C === 'string', `checkAnnotationTSVDataRow: 'C' parameter should be a string not a '${typeof C}'`);
    // console.assert(V !== undefined, "checkAnnotationTSVDataRow: 'V' parameter should be defined");
    if (V) console.assert(typeof V === 'string', `checkAnnotationTSVDataRow: 'V' parameter should be a string not a '${typeof V}'`);
    console.assert(givenRowLocation !== undefined, "checkAnnotationTSVDataRow: 'givenRowLocation' parameter should be defined");
    console.assert(typeof givenRowLocation === 'string', `checkAnnotationTSVDataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);

    let ourRowLocation = givenRowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    let adrResult = { noticeList: [] };

    function addNotice6to9({priority, message, rowID, lineNumber, characterIndex, extract, location}) {
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
        // console.log(`Annotation TSV Row Notice: (priority=${priority}) ${message}, ${characterIndex}, ${extract}, ${location}`);
        console.assert(priority !== undefined, "cATSVrow addNotice6to9: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cATSVrow addNotice6to9: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "cATSVrow addNotice6to9: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cATSVrow addNotice6to9: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // console.assert(lineNumber !== undefined, "cATSVrow addNotice6to9: 'lineNumber' parameter should be defined");
        // console.assert(typeof lineNumber === 'number', `cATSVrow addNotice6to9: 'lineNumber' parameter should be a number not a '${typeof lineNumber}': ${lineNumber}`);
        // console.assert(characterIndex !== undefined, "cATSVrow addNotice6to9: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `cATSVrow addNotice6to9: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // console.assert(extract !== undefined, "cATSVrow addNotice6to9: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `cATSVrow addNotice6to9: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cATSVrow addNotice6to9: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cATSVrow addNotice6to9: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        // Also uses the given bookID,C,V, parameters from the main function call
        adrResult.noticeList.push({ priority, message, bookID, C, V, rowID, lineNumber, characterIndex, extract, location });
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

        // console.log(`cATSVrow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "cATSVrow ourMarkdownTextChecks: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `cATSVrow ourMarkdownTextChecks: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "cATSVrow ourMarkdownTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow ourMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cATSVrow ourMarkdownTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cATSVrow ourMarkdownTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cATSVrow ourMarkdownTextChecks: allowedLinks parameter must be either true or false");

        const cmtResultObject = checkMarkdownText(fieldName, fieldText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(cmtResultObject.noticeList);
        // If we need to put everything through addNotice6to9, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of cmtResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourMarkdownTextChecks notice length=${Object.keys(noticeEntry).length}`);
            addNotice6to9({ ...noticeEntry, rowID });
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

        // console.log(`cATSVrow ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "cATSVrow ourCheckTextField: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `cATSVrow ourCheckTextField: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "cATSVrow ourCheckTextField: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cATSVrow ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cATSVrow ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cATSVrow ourCheckTextField: allowedLinks parameter must be either true or false");

        const dbtcResultObject = checkTextField(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNotice6to9, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of dbtcResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
            addNotice6to9({ ...noticeEntry, rowID });
        }
    }
    // end of ourCheckTextField function


    async function ourCheckTAReference(rowID, fieldName, taLinkText, rowLocation, optionalCheckingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // console.log(`cATSVrow ourCheckTAReference(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "cATSVrow ourCheckTAReference: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `cATSVrow ourCheckTAReference: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "cATSVrow ourCheckTAReference: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow ourCheckTAReference: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(taLinkText !== undefined, "cATSVrow ourCheckTAReference: 'taLinkText' parameter should be defined");
        console.assert(typeof taLinkText === 'string', `cATSVrow ourCheckTAReference: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

        const coqResultObject = await checkTAReference(fieldName, taLinkText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice6to9, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTAReference notice length=${Object.keys(noticeEntry).length}`);
            addNotice6to9({ ...noticeEntry, rowID });
        }
    }
    // end of ourCheckTAReference function

    async function ourCheckTNOriginalLanguageQuote(rowID, fieldName, fieldText, rowLocation, optionalCheckingOptions) {
        // Checks that the Hebrew/Greek quote can be found in the original texts

        // Uses the bookID,C,V values from the main function call

        // Updates the global list of notices

        // console.log(`cATSVrow ourCheckTNOriginalLanguageQuote(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "cATSVrow ourMarkdownTextChecks: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `cATSVrow ourMarkdownTextChecks: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "cATSVrow ourMarkdownTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow ourMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cATSVrow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cATSVrow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);

        const coqResultObject = await checkOriginalLanguageQuote(fieldName,fieldText, bookID,C,V, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice6to9, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuote notice length=${Object.keys(noticeEntry).length}`);
            addNotice6to9({ ...noticeEntry, rowID });
        }
    }
    // end of ourCheckTNOriginalLanguageQuote function

    async function ourCheckTNLinks(rowID, fieldName, taLinkText, rowLocation, optionalCheckingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // console.log(`cATSVrow ourCheckTNLinks(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        console.assert(rowID !== undefined, "cATSVrow ourCheckTNLinks: 'rowID' parameter should be defined");
        console.assert(typeof rowID === 'string', `cATSVrow ourCheckTNLinks: 'rowID' parameter should be a string not a '${typeof rowID}'`);
        console.assert(fieldName !== undefined, "cATSVrow ourCheckTNLinks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cATSVrow ourCheckTNLinks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(taLinkText !== undefined, "cATSVrow ourCheckTNLinks: 'taLinkText' parameter should be defined");
        console.assert(typeof taLinkText === 'string', `cATSVrow ourCheckTNLinks: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

        const coqResultObject = await checkTNLinks(bookID, fieldName, taLinkText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice6to9, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            // console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNLinks notice length=${Object.keys(noticeEntry).length}`);
            addNotice6to9({ ...noticeEntry, rowID });
        }
    }
    // end of ourCheckTNLinks function


    // Main code for checkAnnotationTSVDataRow function
    if (line === EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return adrResult; // We can't detect if it's in the wrong place

    addNotice6to9({priority:998, message:"checkAnnotationTSVDataRow() is still a placeholder -- not completed yet", location:ourRowLocation});

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

    let numChaptersThisBook;
    if (bookID !== 'OBS') {
        const lowercaseBookID = bookID.toLowerCase();
        try {
            numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
        } catch (tlcNCerror) {
            addNotice6to9({priority:979, message:"Invalid book identifier passed to checkAnnotationTSVDataRow", location:` '${bookID}' in first parameter: ${tlcNCerror}`});
        }
    }
    const haveBibleBookID = numChaptersThisBook !== undefined;

    let fields = line.split('\t');
    if (fields.length === NUM_EXPECTED_TSV_FIELDS) {
        const [reference, rowID, tags, supportReference, quote, occurrence, annotation] = fields;
        // let withString = ` with '${rowID}'${inString}`;
        // let CV_withString = ` ${C}:${V}${withString}`;
        // let atString = ` at ${B} ${C}:${V} (${rowID})${inString}`;

        // Check the fields one-by-one
        const [C, V] = reference.split(':')
        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNotice6to9({priority:824, message:`Invalid zero chapter number`, extract:C, rowID, location:ourRowLocation});
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNotice6to9({priority:823, message:`Invalid large chapter number`, extract:C, rowID, location:ourRowLocation});
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(bookID.toLowerCase(), intC);
                    haveGoodChapterNumber = true;
                } catch (tlcNVerror) {
                    if (!haveBibleBookID)
                        // addNotice6to9({priority:500, message:"Invalid chapter number", rowLocation);
                        // else
                        addNotice6to9({priority:822, message:"Unable to check chapter number", rowID, location:` '${C}'${ourRowLocation}`});
                    haveGoodChapterNumber = false;
                }
            }
            else
                addNotice6to9({priority:821, message:"Bad chapter number", rowID, location:` '${C}' with${ourRowLocation}`});
        }
        else
            addNotice6to9({priority:820, message:"Missing chapter number", rowID, location:` ?:${V}${ourRowLocation}`});

        if (V.length) {
            if (V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0)
                    addNotice6to9({priority:814, message:`Invalid zero '${V}' verse number`, rowID, location:ourRowLocation});
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNotice6to9({priority:813, message:`Invalid large '${V}' verse number`, rowID, location:` for chapter ${C}${ourRowLocation}`});
                    } else
                        addNotice6to9({priority:812, message:"Unable to check verse number", rowID, location:` '${V}'${ourRowLocation}`});
                }
            }
            else
                addNotice6to9({priority:811, message:"Bad verse number", rowID, location:` '${V}'${ourRowLocation}`});
        }
        else
            addNotice6to9({priority:810, message:"Missing verse number", rowID, location:` after ${C}:?${ourRowLocation}`});

        if (!rowID.length)
            addNotice6to9({priority:779, message:"Missing ID field", location:ourRowLocation});
        else {
            if (rowID.length !== 4)
                addNotice6to9({priority:778, message:"ID should be exactly 4 characters", rowID, location:` (not ${rowID.length})${ourRowLocation}`});
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(rowID[0]) < 0)
                addNotice6to9({priority:176, message:"ID should start with a lowercase letter or digit", characterIndex:0, rowID, location:` (not '${rowID[0]}')${ourRowLocation}`});
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(rowID[3]) < 0)
                addNotice6to9({priority:175, message:"ID should end with a lowercase letter or digit", characterIndex:3, rowID, location:` (not '${rowID[3]}')${ourRowLocation}`});
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(rowID[1]) < 0)
                addNotice6to9({priority:174, message:"ID characters should only be lowercase letters, digits, or hypen", characterIndex:1, rowID, location:` (not '${rowID[1]}')${ourRowLocation}`});
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(rowID[2]) < 0)
                addNotice6to9({priority:173, message:"ID characters should only be lowercase letters, digits, or hypen", characterIndex:2, rowID, location:` (not '${rowID[2]}')${ourRowLocation}`});
        }

        if (tags.length)
            ;

        if (supportReference.length) { // need to check UTN against UTA
            ourCheckTextField(rowID, 'SupportReference', supportReference, true, ourRowLocation, optionalCheckingOptions);
            await ourCheckTAReference(rowID, 'SupportReference', supportReference, ourRowLocation, optionalCheckingOptions);
        }
        // else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
        //     addNotice6to9({priority:277, message:"Missing SupportReference field", location:ourRowLocation});

        if (quote.length) { // need to check UTN against UHB and UGNT
            ourCheckTextField(rowID, 'Quote', quote, false, ourRowLocation, optionalCheckingOptions);
            await ourCheckTNOriginalLanguageQuote(rowID, 'Quote', quote, ourRowLocation, optionalCheckingOptions);
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (V !== 'intro')
                addNotice6to9({priority:276, message:"Missing Quote field", rowID, location:ourRowLocation});

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn't occur
                if (quote.length)
                    addNotice6to9({priority:550, message:"Invalid zero occurrence field when we have an original quote", rowID, location:ourRowLocation});
                // if (V !== 'intro')
                //     addNotice6to9({priority:500, message:"Invalid zero occurrence field", rowID, location:rowLocation);
            }
            else if (occurrence === '-1') // TODO check the special conditions when this can occur???
                ;
            else if ('12345'.indexOf(occurrence) < 0) // it's not one of these integers
                addNotice6to9({priority:792, message:`Invalid '${occurrence}' occurrence field`, rowID, location:ourRowLocation});
        }

        if (annotation.length) {
            ourMarkdownTextChecks(rowID, 'Annotation', annotation, true, ourRowLocation, optionalCheckingOptions);
            await ourCheckTNLinks(rowID, 'Annotation', annotation, ourRowLocation, optionalCheckingOptions);
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            addNotice6to9({priority:274, message:`Missing ${annotationType} Annotation field`, rowID, location:ourRowLocation});

    } else
        addNotice6to9({priority:861, message:`Found wrong number of TSV fields (expected ${NUM_EXPECTED_TSV_FIELDS})`, extract:`Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, location:ourRowLocation});

    // console.log(`  checkAnnotationTSVDataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkAnnotationTSVDataRow result is", JSON.stringify(drResult));
    return adrResult; // object with noticeList only
}
// end of checkAnnotationTSVDataRow function

export default checkAnnotationTSVDataRow;
