import * as books from '../core';
import doBasicTextChecks from './basic-text-check';


const NUM_EXPECTED_TSV_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

const DEFAULT_EXTRACT_LENGTH = 10;

function checkTN_TSVDataRow(BBB, line, rowLocation, optionalOptions) {
    /* This function is only for checking one data row
          and doesn't assume that it has any previous context.

          It's designed to be able to quickly show errors for a single row being displayed/edited.

  Returns errorList, warningList
 */
    // console.log("checkTN_TSVDataRow(" + BBB + ", " + line + ", " + rowLocation +", "+JSON.stringify(optionalOptions)+ ")…");
    console.assert(typeof BBB === 'string', "addNotice: 'BBB' parameter should be a string not a '" + (typeof BBB) + "'");
    console.assert(BBB !== undefined, "addNotice: 'BBB' parameter should be defined");
    console.assert(BBB.length == 3, "addNotice: 'BBB' parameter should be three characters long not " + BBB.length);
    console.assert(typeof line === 'string', "addNotice: 'line' parameter should be a string not a '" + (typeof line) + "'");
    console.assert(line !== undefined, "addNotice: 'line' parameter should be defined");
    console.assert(typeof rowLocation === 'string', "addNotice: 'rowLocation' parameter should be a string not a '" + (typeof rowLocation) + "'");
    console.assert(rowLocation !== undefined, "addNotice: 'rowLocation' parameter should be defined");

    let result = { errorList: [], noticeList: [] };

    function addNotice(priority, message, index, extract, location) {
        console.log("TSV Line Notice: (priority=" + priority + ") " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(typeof priority === 'number', "addNotice: 'priority' parameter should be a number not a '" + (typeof priority) + "'");
        console.assert(priority !== undefined, "addNotice: 'priority' parameter should be defined");
        console.assert(typeof message === 'string', "addNotice: 'message' parameter should be a string not a '" + (typeof message) + "'");
        console.assert(message !== undefined, "addNotice: 'message' parameter should be defined");
        console.assert(typeof index === 'number', "addNotice: 'index' parameter should be a number not a '" + (typeof index) + "'");
        console.assert(index !== undefined, "addNotice: 'index' parameter should be defined");
        console.assert(typeof extract === 'string', "addNotice: 'extract' parameter should be a string not a '" + (typeof extract) + "'");
        console.assert(extract !== undefined, "addNotice: 'extract' parameter should be defined");
        console.assert(typeof location === 'string', "addNotice: 'location' parameter should be a string not a '" + (typeof location) + "'");
        console.assert(location !== undefined, "addNotice: 'location' parameter should be defined");
        result.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        console.assert(typeof fieldName === 'string', "doOurBasicTextChecks: 'fieldName' parameter should be a string not a '" + (typeof fieldName) + "'");
        console.assert(fieldName !== undefined, "doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldText === 'string', "doOurBasicTextChecks: 'fieldText' parameter should be a string not a '" + (typeof fieldText) + "'");
        console.assert(fieldText !== undefined, "doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert(allowedLinks === true || allowedLinks === false, "doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const resultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        result.noticeList = result.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging
        //  process results line by line
        // for (let noticeEntry of resultObject.noticeList)
        //     addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
    }
    // end of doOurBasicTextChecks function


    if (line == EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return result; // We can't detect if it's in the wrong place

    let extractLength;
    try {
        extractLength = optionalOptions.extractLength;
    } catch (e) { }
    if (typeof extractLength != 'number' || isNaN(extractLength)) {
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
        addNotice(500, "Invalid book code passed to checkTN_TSVDataRow", -1, "", " '" + BBB + "' in first parameter: " + e);
    }
    const haveGoodBookCode = numChaptersThisBook !== undefined;

    // let inString;
    // if (rowLocation) inString = rowLocation;
    // else inString = " in line " + rowNumber.toLocaleString();

    let fields = line.split('\t');
    if (fields.length == NUM_EXPECTED_TSV_FIELDS) {
        let [B, C, V, fieldID, support_reference, orig_quote, occurrence, GL_quote, occurrenceNote] = fields;
        // let withString = " with '" + fieldID + "'" + inString;
        // let CV_withString = ' ' + C + ':' + V + withString;
        // let atString = " at " + B + ' ' + C + ':' + V + " (" + fieldID + ")" + inString;

        // Check the fields one-by-one
        if (B) {
            if (B != BBB)
                addNotice(500, "Wrong '" + B + "' book code", -1, "", " (expected '" + BBB + "')" + rowLocation);
        }
        else
            addNotice(500, "Missing book code", 0, "", rowLocation);

        let numVersesThisChapter, haveGoodChapterNumber;
        if (C) {
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC == 0) {
                    addNotice(500, "Invalid zero '" + C + "' chapter number", -1, "", rowLocation);
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNotice(500, "Invalid large '" + C + "' chapter number", -1, "", rowLocation);
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(bbb, intC);
                    haveGoodChapterNumber = true;
                } catch (e) {
                    if (!haveGoodBookCode)
                        // addNotice(500, "Invalid chapter number", rowLocation);
                        // else
                        addNotice(500, "Unable to check chapter number", -1, "", " '" + C + "'" + rowLocation);
                    haveGoodChapterNumber = false;
                }
            }
            else
                addNotice(500, "Bad chapter number", -1, "", " '" + C + "' with" + rowLocation);
        }
        else
            addNotice(500, "Missing chapter number", -1, "", ` ?:${V}${withString}`);

        if (V) {
            if (V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV == 0)
                    addNotice(500, "Invalid zero '" + V + "' verse number", -1, "", rowLocation);
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNotice(500, "Invalid large '" + V + "' verse number", " for chapter " + C + rowLocation);
                    } else
                        addNotice(500, "Unable to check verse number", -1, "", " '" + V + "'" + rowLocation);
                }
            }
            else
                addNotice(500, "Bad verse number", -1, "", " '" + V + "'" + rowLocation);

        }
        else
            addNotice(500, "Missing verse number", -1, "" ` after ${C}:? ${rowLocation}`);

        if (!fieldID)
            addNotice(500, "Missing ID field", rowLocation);
        else {
            if (fieldID.length != 4)
                addNotice(500, "ID should be exactly 4 characters", -1, "", " (not " + fieldID.length + ")" + rowLocation)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[0]) < 0)
                addNotice(500, "ID should start with a lowercase letter or digit", 0, "", " (not '" + fieldID[0] + "')" + rowLocation)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[3]) < 0)
                addNotice(500, "ID should end with a lowercase letter or digit", 3, "", " (not '" + fieldID[3] + "')" + rowLocation)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[1]) < 0)
                addNotice(500, "ID characters should only be lowercase letters, digits, or hypen", 1, "", " (not '" + fieldID[1] + "')" + rowLocation)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[2]) < 0)
                addNotice(500, "ID characters should only be lowercase letters, digits, or hypen", 2, "", " (not '" + fieldID[2] + "')" + rowLocation)
        }

        if (support_reference) { // need to check UTN against UTA
            doOurBasicTextChecks('SupportReference', support_reference, true, rowLocation, optionalOptions);
        }


        if (orig_quote) { // need to check UTN against UHB and UGNT
            doOurBasicTextChecks('OrigQuote', orig_quote, false, rowLocation, optionalOptions);
        }

        if (occurrence) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn't occur
                if (orig_quote)
                    addNotice(550, "Invalid zero occurrence field when we have an original quote", -1, "", rowLocation);
                // if (V != 'intro')
                //     addNotice(500, "Invalid zero occurrence field", -1, "", rowLocation);
            }
            else if ('123456789'.indexOf(occurrence) < 0) // it's not one of these integers
                addNotice(500, "Invalid '" + occurrence + "' occurrence field", -1, "", rowLocation);
        }

        if (GL_quote) { // need to check UTN against ULT
            doOurBasicTextChecks('GLQuote', GL_quote, false, rowLocation, optionalOptions);
        }

        if (occurrenceNote) {
            doOurBasicTextChecks('OccurrenceNote', occurrenceNote, true, rowLocation, optionalOptions);
        }

    } else
        addNotice(500, "Found " + fields.length + " field" + (fields.length == 1 ? '' : 's') + " instead of " + NUM_EXPECTED_TSV_FIELDS, -1, "", rowLocation);

    return result;
}
// end of checkTN_TSVDataRow function



export default checkTN_TSVDataRow;
