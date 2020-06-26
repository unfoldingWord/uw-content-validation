import * as books from '../core';
import doBasicTextChecks from './basic-text-check';


const NUM_EXPECTED_TSV_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

function checkTN_TSVDataRow(BBB, line, rowNumber, optionalOptions) {
    /* This function is only for checking one data row
          and doesn't assume that it has any previous context.

          It's designed to be able to quickly show errors for a single row being displayed/edited.

  Returns errorList, warningList
 */
    // console.log("checkTN_TSVDataRow(" + BBB + ", " + line + ", " + rowLocation + ")…");

    let result = {errorList:[], noticeList:[]};

    function addNotice(priority, message, index, extract, location) {
        console.log("TSV Line Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(typeof priority == 'number', "addNotice: 'priority' parameter should be a number not a '"+(typeof priority)+"'");
        console.assert(typeof message == 'string', "addNotice: 'message' parameter should be a string");
        console.assert(typeof index == 'number', "addNotice: 'index' parameter should be a number not a '"+(typeof priority)+"'");
        console.assert(typeof extract == 'string', "addNotice: 'extract' parameter should be a string");
        console.assert(typeof location == 'string', "addNotice: 'location' parameter should be a string");
        result.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation, optionalOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        const resultObject = doBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation, optionalOptions);
        
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

    const bbb = BBB.toLowerCase();
    let numChaptersThisBook;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    } catch (e) {
        addNotice(500, "Invalid book code passed to checkTN_TSVDataRow", -1, "", " '" + BBB + "' in first parameter: " + e);
    }
    const haveGoodBookCode = numChaptersThisBook !== undefined;

    let fields = line.split('\t');
    if (fields.length == NUM_EXPECTED_TSV_FIELDS) {
        let [B, C, V, fieldID, support_reference, orig_quote, occurrence, GL_quote, occurrenceNote] = fields;
        let inString = " in line " + rowNumber.toLocaleString();
        let withString = " with '" + fieldID + "'" + inString;
        let CV_withString = ' ' + C + ':' + V + withString;
        let atString = " at " + B + ' ' + C + ':' + V + " (" + fieldID + ")" + inString;

        // Check the fields one-by-one
        if (B) {
            if (B != BBB)
                addNotice(500, "Wrong '" + B + "' book code", -1, "", " (expected '" + BBB + "')" + CV_withString);
        }
        else
            addNotice(500, "Missing book code", 0, "", " at" + CV_withString);

        let numVersesThisChapter, haveGoodChapterNumber;
        if (C) {
            if (C == 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC == 0){
                    addNotice(500, "Invalid zero '" + C + "' chapter number", -1, "", atString);
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook){
                    addNotice(500, "Invalid large '" + C + "' chapter number", -1, "", atString);
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(bbb, intC);
                    haveGoodChapterNumber = true;
                } catch (e) {
                    if (!haveGoodBookCode)
                    // addNotice(500, "Invalid chapter number", atString);
                    // else
                    addNotice(500, "Unable to check chapter number", -1, "", " '" + C + "'"+atString);
                    haveGoodChapterNumber = false;
                }
            }
            else
                addNotice(500, "Bad chapter number", -1, "", " '" + C + "' with" + CV_withString);
        }
        else
            addNotice(500, "Missing chapter number", -1, "", ` ?:${V}${withString}`);

        if (V) {
            if (V == 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV == 0)
                    addNotice(500, "Invalid zero '" + V + "' verse number", -1, "", atString);
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNotice(500, "Invalid large '" + V + "' verse number", " for chapter " + C + atString);
                    } else
                        addNotice(500, "Unable to check verse number", -1, "", " '" + V + "'"+atString);
                }
            }
            else
                addNotice(500, "Bad verse number", -1, "", " '" + V + "'" + atString);

        }
        else
            addNotice(500, "Missing verse number", -1, "" ` after ${C}:? ${withString}`);

        if (!fieldID)
            addNotice(500, "Missing ID field", atString);
        else {
            if (fieldID.length != 4)
                addNotice(500, "ID should be exactly 4 characters", -1, "", " (not " + fieldID.length + ")" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[0]) < 0)
                addNotice(500, "ID should start with a lowercase letter or digit", 0, "", " (not '" + fieldID[0] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[3]) < 0)
                addNotice(500, "ID should end with a lowercase letter or digit", 3, "", " (not '" + fieldID[3] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[1]) < 0)
                addNotice(500, "ID characters should only be lowercase letters, digits, or hypen", 1, "", " (not '" + fieldID[1] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[2]) < 0)
                addNotice(500, "ID characters should only be lowercase letters, digits, or hypen", 2, "", " (not '" + fieldID[2] + "')" + atString)
        }

        if (support_reference) { // need to check UTN against UTA
            doOurBasicTextChecks('SupportReference', support_reference, atString, optionalOptions);
        }


        if (orig_quote) { // need to check UTN against UHB and UGNT
            doOurBasicTextChecks('OrigQuote', orig_quote, atString, optionalOptions);
        }

        if (occurrence) { // This should usually be a digit
            if (occurrence == '0') {
                if (V != 'intro')
                    addNotice(500, "Invalid '" + occurrence + "' occurrence field", -1, "", atString);
            }
            else if ('123456789'.indexOf(occurrence) < 0)
                addNotice(500, "Invalid '" + occurrence + "' occurrence field", -1, "", atString);
        }

        if (GL_quote) { // need to check UTN against ULT
            doOurBasicTextChecks('GLQuote', GL_quote, atString, optionalOptions);
        }

        if (occurrenceNote) {
            doOurBasicTextChecks('OccurrenceNote', occurrenceNote, atString, optionalOptions);
        }

    } else
        addNotice(500, "Found " + fields.length + " field" + (fields.length == 1 ? '' : 's') + " instead of " + NUM_EXPECTED_TSV_FIELDS, -1, "", ' in ' + BBB + ' line ' + rowNumber);

    return result;
}
// end of checkTN_TSVDataRow function



export default checkTN_TSVDataRow;
