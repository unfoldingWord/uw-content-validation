import * as books from '../core';
import doBasicTextChecks from './basic-text-check';


const NUM_EXPECTED_TSV_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

const DEFAULT_EXTRACT_LENGTH = 10;

function checkTN_TSVDataRow(BBB, line, rowLocation, optionalCheckingOptions) {
    /* This function is only for checking one data row
          and doesn't assume that it has any previous context.

          It's designed to be able to quickly show errors for a single row being displayed/edited.

  Returns noticeList
 */
    // console.log(`checkTN_TSVDataRow(${BBB}, ${line}, ${rowLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
    console.assert(BBB !== undefined, "checkTN_TSVDataRow: 'BBB' parameter should be defined");
    console.assert(typeof BBB === 'string', `checkTN_TSVDataRow: 'BBB' parameter should be a string not a '${typeof BBB}'`);
    console.assert(BBB.length === 3, "checkTN_TSVDataRow: 'BBB' parameter should be three characters long not " + BBB.length);
    console.assert(line !== undefined, "checkTN_TSVDataRow: 'line' parameter should be defined");
    console.assert(typeof line === 'string', `checkTN_TSVDataRow: 'line' parameter should be a string not a '${typeof line}'`);
    console.assert(rowLocation !== undefined, "checkTN_TSVDataRow: 'rowLocation' parameter should be defined");
    console.assert(typeof rowLocation === 'string', `checkTN_TSVDataRow: 'rowLocation' parameter should be a string not a '${typeof rowLocation}'`);

    let ourRowLocation = rowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    let result = { noticeList: [] };

    function addNotice(priority, message, index, extract, location) {
        console.log(`TSV Line Notice: (priority=${priority}) ${message}, ${index}, ${extract}, ${location}`);
        console.assert(priority !== undefined, "cTSVrow addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cTSVrow addNotice: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "cTSVrow addNotice: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cTSVrow addNotice: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        console.assert(index !== undefined, "cTSVrow addNotice: 'index' parameter should be defined");
        console.assert(typeof index === 'number', `cTSVrow addNotice: 'index' parameter should be a number not a '${typeof index}': ${index}`);
        console.assert(extract !== undefined, "cTSVrow addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `cTSVrow addNotice: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cTSVrow addNotice: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cTSVrow addNotice: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cTSVrow doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(fieldName !== undefined, "cTSVrow doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cTSVrow doOurBasicTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cTSVrow doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cTSVrow doOurBasicTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cTSVrow doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const resultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        result.noticeList = result.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging or filtering
        //  process results line by line
        // for (let noticeEntry of resultObject.noticeList)
        //     addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
    }
    // end of doOurBasicTextChecks function


    if (line === EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return result; // We can't detect if it's in the wrong place

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (e) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    //     console.log("Using supplied extractLength=" + extractLength, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, "halfLengthPlus="+halfLengthPlus);

    const bbb = BBB.toLowerCase();
    let numChaptersThisBook;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    } catch (e) {
        addNotice(979, "Invalid book code passed to checkTN_TSVDataRow", -1, "", ` '${BBB}' in first parameter: ${e}`);
    }
    const haveGoodBookCode = numChaptersThisBook !== undefined;

    // let inString;
    // if (rowLocation) inString = rowLocation;
    // else inString = " in line " + rowNumber.toLocaleString();

    let fields = line.split('\t');
    if (fields.length === NUM_EXPECTED_TSV_FIELDS) {
        let [B, C, V, fieldID, support_reference, orig_quote, occurrence, GL_quote, occurrenceNote] = fields;
        // let withString = " with '" + fieldID + "'" + inString;
        // let CV_withString = ' ' + C + ':' + V + withString;
        // let atString = " at " + B + ' ' + C + ':' + V + " (" + fieldID + ")" + inString;

        // Check the fields one-by-one
        if (B.length) {
            if (B !== BBB)
                addNotice(978, `Wrong '${B}' book code`, -1, "", ` (expected '${BBB}')${ourRowLocation}`);
        }
        else
            addNotice(977, "Missing book code", 0, "", ourRowLocation);

        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNotice(824, `Invalid zero '${C}' chapter number`, -1, "", ourRowLocation);
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNotice(823, `Invalid large '${C}' chapter number`, -1, "", ourRowLocation);
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(bbb, intC);
                    haveGoodChapterNumber = true;
                } catch (e) {
                    if (!haveGoodBookCode)
                        // addNotice(500, "Invalid chapter number", rowLocation);
                        // else
                        addNotice(822, "Unable to check chapter number", -1, "", ` '${C}'${ourRowLocation}`);
                    haveGoodChapterNumber = false;
                }
            }
            else
                addNotice(821, "Bad chapter number", -1, "", ` '${C}' with${ourRowLocation}`);
        }
        else
            addNotice(820, "Missing chapter number", -1, "", ` ?:${V}${ourRowLocation}`);

        if (V.length) {
            if (V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0)
                    addNotice(814, `Invalid zero '${V}' verse number`, -1, "", ourRowLocation);
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNotice(813, `Invalid large '${V}' verse number`, ` for chapter ${C}${ourRowLocation}`);
                    } else
                        addNotice(812, "Unable to check verse number", -1, "", ` '${V}'${ourRowLocation}`);
                }
            }
            else
                addNotice(811, "Bad verse number", -1, "", ` '${V}'${ourRowLocation}`);
        }
        else
            addNotice(810, "Missing verse number", -1, "", ` after ${C}:?${ourRowLocation}`);

        if (!fieldID.length)
            addNotice(779, "Missing ID field", ourRowLocation);
        else {
            if (fieldID.length !== 4)
                addNotice(778, "ID should be exactly 4 characters", -1, "", ` (not ${fieldID.length})${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[0]) < 0)
                addNotice(176, "ID should start with a lowercase letter or digit", 0, "", ` (not '${fieldID[0]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[3]) < 0)
                addNotice(175, "ID should end with a lowercase letter or digit", 3, "", ` (not '${fieldID[3]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[1]) < 0)
                addNotice(174, "ID characters should only be lowercase letters, digits, or hypen", 1, "", ` (not '${fieldID[1]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[2]) < 0)
                addNotice(173, "ID characters should only be lowercase letters, digits, or hypen", 2, "", ` (not '${fieldID[2]}')${ourRowLocation}`)
        }

        if (support_reference.length) { // need to check UTN against UTA
            doOurBasicTextChecks('SupportReference', support_reference, true, ourRowLocation, optionalCheckingOptions);
        }

        if (orig_quote.length) { // need to check UTN against UHB and UGNT
            doOurBasicTextChecks('OrigQuote', orig_quote, false, ourRowLocation, optionalCheckingOptions);
        }

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn't occur
                if (orig_quote.length)
                    addNotice(550, "Invalid zero occurrence field when we have an original quote", -1, "", ourRowLocation);
                // if (V !== 'intro')
                //     addNotice(500, "Invalid zero occurrence field", -1, "", rowLocation);
            }
            else if ('123456789'.indexOf(occurrence) < 0) // it's not one of these integers
                addNotice(592, `Invalid '${occurrence}' occurrence field`, -1, "", ourRowLocation);
        }

        if (GL_quote.length) { // need to check UTN against ULT
            doOurBasicTextChecks('GLQuote', GL_quote, false, ourRowLocation, optionalCheckingOptions);
        }

        if (occurrenceNote.length) {
            doOurBasicTextChecks('OccurrenceNote', occurrenceNote, true, ourRowLocation, optionalCheckingOptions);
        }

    } else
        addNotice(861, `Found ${fields.length} field${fields.length === 1 ? '' : 's'} instead of ${NUM_EXPECTED_TSV_FIELDS}`, -1, "", ourRowLocation);

    return result; // object with noticeList only
}
// end of checkTN_TSVDataRow function

export default checkTN_TSVDataRow;
