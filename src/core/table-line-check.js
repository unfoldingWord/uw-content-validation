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
const EXPECTED_TN_HEADING_LINE = 'Book	Chapter	Verse	ID	SupportReference	OrigQuote	Occurrence	GLQuote	OccurrenceNote';

function checkTN_TSVDataRow(BBB, line, rowLocation) {
    /* This function is only for checking one data row
          and doesn't assume that it has any previous context.

          It's designed to be able to quickly show errors for a single row being displayed/edited.

  Returns errorList, warningList
 */
    console.log("checkTN_TSVDataRow(" + BBB + ", " + line + ", " + rowLocation + ")…");

    let result = {};
    result.errorList = [];
    result.warningList = [];

    function addError(errorPart, locationPart) {
        console.log("ERROR: " + errorPart + locationPart);
        result.errorList.push([errorPart, locationPart]);
    }
    function addWarning(warningPart, locationPart) {
        console.log(`Warning: ${warningPart}${locationPart}`);
        result.warningList.push([warningPart, locationPart]);
    }

    function doOurBasicTextChecks(fieldName, fieldText, optionalFieldLocation) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global error and warning lists

        let resultObject = doBasicTextChecks(fieldName, fieldText, optionalFieldLocation)
        for (let errorEntry of resultObject.errorList)
            addError(errorEntry[0], errorEntry[1]);
        for (let warningEntry of resultObject.warningList)
            addWarning(warningEntry[0], warningEntry[1]);
    }
    // end of doOurBasicTextChecks function


    if (line == EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return result; // We can't detect if it's in the wrong place

    let bbb = BBB.toLowerCase();
    console.log("bbb", bbb);
    let numChaptersThisBook = 10;
    // TODO: Why can't we make this work???
    // let numChaptersThisBook = books.chaptersInBook(bbb).length;
    console.log("numChaptersThisBook", numChaptersThisBook);

    let fields = line.split('\t');
    if (fields.length == NUM_EXPECTED_TSV_FIELDS) {
        let [B, C, V, fieldID, support_reference, orig_quote, occurrence, GL_quote, occurrenceNote] = fields;
        let inString = " in line " + rowLocation.toLocaleString();
        let withString = " with '" + fieldID + "'" + inString;
        let CV_withString = ' ' + C + ':' + V + withString;
        let atString = " at " + B + ' ' + C + ':' + V + " (" + fieldID + ")" + inString;

        // Check the fields one-by-one
        if (B) {
            if (B != BBB)
                addError("Wrong '" + B + "' book code", " (expected '" + BBB + "')" + CV_withString);
        }
        else
            addError("Missing book code", " at" + CV_withString);

        let numVersesThisChapter;
        if (C) {
            if (C == 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                numVersesThisChapter = 41;
                // TODO: Why can't we make this work???
                // numVersesThisChapter = books.versesInChapter(bbb, intC);
                if (intC == 0)
                    addError("Invalid zero '" + C + "' chapter number", atString);
                if (intC > numChaptersThisBook)
                    addError("Invalid large '" + C + "' chapter number", atString);
            }
            else
                addError("Bad chapter number", " '" + C + "' with" + CV_withString);
        }
        else
            addError("Missing chapter number", ` ?:${V}${withString}`);

        if (V) {
            if (V == 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV == 0)
                    addError("Invalid zero '" + V + "' verse number", atString);
                if (intV > numVersesThisChapter)
                    addError("Invalid large '" + V + "' verse number", " for chapter " + C + atString);
            }
            else
                addError("Bad verse number", " '" + V + "'" + atString);

        }
        else
            addError("Missing verse number", ` after ${C}:? ${withString}`);

        if (!fieldID)
            addError("Missing ID field", atString);
        else {
            if (fieldID.length != 4)
                addWarning("ID should be exactly 4 characters", " (not " + fieldID.length + ")" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[0]) < 0)
                addWarning("ID should start with a lowercase letter or digit", " (not '" + fieldID[0] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[3]) < 0)
                addWarning("ID should end with a lowercase letter or digit", " (not '" + fieldID[3] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[1]) < 0)
                addWarning("ID characters should only be lowercase letters, digits, or hypen", " (not '" + fieldID[1] + "')" + atString)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[2]) < 0)
                addWarning("ID characters should only be lowercase letters, digits, or hypen", " (not '" + fieldID[2] + "')" + atString)
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
                    addError("Invalid '" + occurrence + "' occurrence field", atString);
            }
            else if ('123456789'.indexOf(occurrence) < 0)
                addError("Invalid '" + occurrence + "' occurrence field", atString);
        }

        if (GL_quote) { // need to check UTN against ULT
            doOurBasicTextChecks('GLQuote', GL_quote, atString);
        }

        if (occurrenceNote) {
            doOurBasicTextChecks('OccurrenceNote', occurrenceNote, atString);
        }

    } else
        addError("Found " + fields.length + " field" + (fields.length == 1 ? '' : 's') + " instead of " + NUM_EXPECTED_TSV_FIELDS, ' in ' + BBB + ' line ' + rowLocation);

    return result;
}
// end of checkTN_TSVDataRow function



export default checkTN_TSVDataRow;
