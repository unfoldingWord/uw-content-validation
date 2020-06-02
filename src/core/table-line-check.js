// import { React, useContext } from 'react';
// import PropTypes from 'prop-types';
// import ReactJson from 'react-json-view';
// import { Paper, Button } from '@material-ui/core';
// import {
//     RepositoryContext,
//     FileContext,
// } from 'gitea-react-toolkit';
import * as books from '../core';
import doBasicTextChecks from './basic-text-check';


const NUM_EXPECTED_TSV_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

function checkTN_TSVDataRow(BBB, line, rowNumber) {
    /* This function is only for checking one data row
          and doesn't assume that it has any previous context.

          It's designed to be able to quickly show errors for a single row being displayed/edited.

  Returns errorList, warningList
 */
    // console.log("checkTN_TSVDataRow(" + BBB + ", " + line + ", " + rowLocation + ")…");

    let result = {errorList:[], warningList:[]};

    function addError(message, index, extract, location) {
        console.log("TSV LINE ERROR: '" + message + "', " + index + ", '" + extract + "', " + location);
        result.errorList.push([message, index, extract, location]);
    }
    function addWarning(message, index, extract, location) {
        console.log("TSV Line Warning: '" + message + "', " + index + ", '" + extract + "', " + location);
        result.warningList.push([message, index, extract, location]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global error and warning lists

        const resultObject = doBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation)
        for (let errorEntry of resultObject.errorList)
            addError(errorEntry[0], errorEntry[1], errorEntry[2], errorEntry[3]);
        for (let warningEntry of resultObject.warningList)
            addWarning(warningEntry[0], warningEntry[1], warningEntry[2], warningEntry[3]);
    }
    // end of doOurBasicTextChecks function


    if (line == EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return result; // We can't detect if it's in the wrong place

    const bbb = BBB.toLowerCase();
    let numChaptersThisBook;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    } catch (e) {
        addError("Invalid book code passed to checkTN_TSVDataRow", -1, "", " '" + BBB + "' in first parameter: " + e);
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
                addError("Wrong '" + B + "' book code", -1, "", " (expected '" + BBB + "')" + CV_withString);
        }
        else
            addError("Missing book code", 0, "", " at" + CV_withString);

        let numVersesThisChapter, haveGoodChapterNumber;
        if (C) {
            if (C == 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC == 0){
                    addError("Invalid zero '" + C + "' chapter number", -1, "", atString);
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook){
                    addError("Invalid large '" + C + "' chapter number", -1, "", atString);
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(bbb, intC);
                    haveGoodChapterNumber = true;
                } catch (e) {
                    if (!haveGoodBookCode)
                    // addError("Invalid chapter number", atString);
                    // else
                    addWarning("Unable to check chapter number", -1, "", " '" + C + "'"+atString);
                    haveGoodChapterNumber = false;
                }
            }
            else
                addError("Bad chapter number", -1, "", " '" + C + "' with" + CV_withString);
        }
        else
            addError("Missing chapter number", -1, "", ` ?:${V}${withString}`);

        if (V) {
            if (V == 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV == 0)
                    addError("Invalid zero '" + V + "' verse number", -1, "", atString);
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addError("Invalid large '" + V + "' verse number", " for chapter " + C + atString);
                    } else
                        addWarning("Unable to check verse number", -1, "", " '" + V + "'"+atString);
                }
            }
            else
                addError("Bad verse number", -1, "", " '" + V + "'" + atString);

        }
        else
            addError("Missing verse number", -1, "" ` after ${C}:? ${withString}`);

        if (!fieldID)
            addError("Missing ID field", atString);
        else {
            if (fieldID.length != 4)
                addWarning("ID should be exactly 4 characters", -1, "", " (not " + fieldID.length + ")" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[0]) < 0)
                addWarning("ID should start with a lowercase letter or digit", 0, "", " (not '" + fieldID[0] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[3]) < 0)
                addWarning("ID should end with a lowercase letter or digit", 3, "", " (not '" + fieldID[3] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[1]) < 0)
                addWarning("ID characters should only be lowercase letters, digits, or hypen", 1, "", " (not '" + fieldID[1] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[2]) < 0)
                addWarning("ID characters should only be lowercase letters, digits, or hypen", 2, "", " (not '" + fieldID[2] + "')" + atString)
        }

        if (support_reference) { // need to check UTN against UTA
            doOurBasicTextChecks('SupportReference', support_reference, atString);
        }


        if (orig_quote) { // need to check UTN against UHB and UGNT
            doOurBasicTextChecks('OrigQuote', orig_quote, atString);
        }

        if (occurrence) { // This should usually be a digit
            if (occurrence == '0') {
                if (V != 'intro')
                    addError("Invalid '" + occurrence + "' occurrence field", -1, "", atString);
            }
            else if ('123456789'.indexOf(occurrence) < 0)
                addError("Invalid '" + occurrence + "' occurrence field", -1, "", atString);
        }

        if (GL_quote) { // need to check UTN against ULT
            doOurBasicTextChecks('GLQuote', GL_quote, atString);
        }

        if (occurrenceNote) {
            doOurBasicTextChecks('OccurrenceNote', occurrenceNote, atString);
        }

    } else
        addError("Found " + fields.length + " field" + (fields.length == 1 ? '' : 's') + " instead of " + NUM_EXPECTED_TSV_FIELDS, -1, "", ' in ' + BBB + ' line ' + rowNumber);

    return result;
}
// end of checkTN_TSVDataRow function



export default checkTN_TSVDataRow;
