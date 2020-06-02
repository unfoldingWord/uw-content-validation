import * as books from '../core';
import checkTN_TSVDataRow from './table-line-check';


const checkerVersionString = '0.0.5';
const MAX_SIMILAR_MESSAGES = 3;

const NUM_EXPECTED_TN_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';


function checkTN_TSVText(BBB, tableText, location) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     Returns a result object containing a successList, errorList, warningList
     */
    console.log("checkTN_TSVText(" + BBB + ", " + tableText.length + ", " + location + ")…");

    let result = { successList: [], errorList: [], warningList: [] };
    let suppressedErrorCount = 0, suppressedWarningCount = 0;

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        result.successList.push(successString);
    }
    function addError(message, index, extract, location) {
        console.log("tfc ERROR: " + message + (index > 0 ? " (at character " + index + ")" : "") + (extract ? " " + extract : "") + location);
        let similarCount = 0;
        result.errorList.forEach((errMsg) => { if (errMsg[0] == message) similarCount += 1 });
        if (similarCount < MAX_SIMILAR_MESSAGES)
            // result.errorList.push(message + (index > 0 ? " (at character " + index + ")" : "") + (extract ? " " + extract : "") + location);
            result.errorList.push([message, index, extract, location]);
            else if (similarCount == MAX_SIMILAR_MESSAGES)
            result.errorList.push([`${message}  ◄ MORE SIMILAR ERRORS SUPPRESSED`, -1, "", ""]);
        else suppressedErrorCount += 1;
    }
    function addWarning(message, index, extract, location) {
        console.log("tfc Warning: " + message + (index > 0 ? " (at character " + index + ")" : "") + (extract ? " " + extract : "") + location);
        let similarCount = 0;
        result.warningList.forEach((warningMsg) => { if (warningMsg[0] == message) similarCount += 1 });
        if (similarCount < MAX_SIMILAR_MESSAGES)
            // result.warningList.push(message + (index > 0 ? " (at character " + index + ")" : "") + (extract ? " " + extract : "") + location);
            result.warningList.push([message, index, extract, location]);
        else if (similarCount == MAX_SIMILAR_MESSAGES)
            result.warningList.push([`${message}  ◄ MORE SIMILAR WARNINGS SUPPRESSED`, -1, "", ""]);
        else suppressedWarningCount += 1;
    }


    // if (ALLOWED_BBBs.indexOf(BBB) == -1)
    let bbb = BBB.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    }
    catch {
        addError("Bad function call: should be given a valid book abbreviation", -1, BBB, " (not '" + BBB + "')" + location);
    }

    let lines = tableText.split('\n');
    console.log("  '" + location + "' has " + lines.length.toLocaleString() + " total lines (expecting " + NUM_EXPECTED_TN_FIELDS + " fields in each line)");

    let lastB = '', lastC = '', lastV = '';
    let fieldID_list = [];
    let numVersesThisChapter = 0;
    for (let n = 0; n < lines.length; n++) {
        console.log("checkTN_TSVText checking line " + n + ": " + JSON.stringify(lines[n]));
        if (n == 0) {
            if (lines[0] == EXPECTED_TN_HEADING_LINE)
                addSuccessMessage("Checked TSV header " + location);
            else
                addError("Bad TSV header", -1, "", location + ": '" + lines[0] + "'");
        }
        else // not the header
        {
            let fields = lines[n].split('\t');
            if (fields.length == NUM_EXPECTED_TN_FIELDS) {
                let [B, C, V, fieldID, support_reference, orig_quote, occurrence, GL_quote, occurrenceNote] = fields;
                let inString = " in line " + n.toLocaleString() + " in " + location;
                let withString = " with '" + fieldID + "'" + inString;
                let CV_withString = ' ' + C + ':' + V + withString;
                let atString = " at " + B + ' ' + C + ':' + V + " (" + fieldID + ")" + inString;

                // Use the row check to do most basic checks
                const firstResult = checkTN_TSVDataRow(BBB, lines[n], n);
                for (let errorEntry of firstResult.errorList)
                    addError(errorEntry[0], errorEntry[1], errorEntry[2], errorEntry[3]);
                for (let warningEntry of firstResult.warningList)
                    addWarning(warningEntry[0], warningEntry[1], warningEntry[2], warningEntry[3]);

                // So here we only have to check against the previous and next fields for out-of-order problems
                if (B) {
                    if (B != BBB)
                        addError("Wrong '" + B + "' book code (expected '" + BBB + "')", CV_withString);
                }
                else
                    addError("Missing book code", " at" + CV_withString);

                if (C) {
                    if (C == 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C != lastC)
                            numVersesThisChapter = books.versesInChapter(bbb, intC);
                        if (intC == 0)
                            addError("Invalid zero '" + C + "' chapter number", atString);
                        if (intC > numChaptersThisBook)
                            addError("Invalid large '" + C + "' chapter number", atString);
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addError("Receding '" + C + "' chapter number after '" + lastC + "'", atString);
                            else if (intC > lastintC + 1)
                                addError("Advancing '" + C + "' chapter number after '" + lastC + "'", atString);
                        }
                    }
                    else
                        addError("Bad chapter number", " with" + CV_withString);
                }
                else
                    addError("Missing chapter number", " after " + lastC + ':' + V + withString);

                if (V) {
                    if (V == 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV == 0)
                            addError("Invalid zero '" + V + "' verse number", atString);
                        if (intV > numVersesThisChapter)
                            addError("Invalid large '" + V + "' verse number for chapter " + C, atString);
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (intV < lastintV)
                                addError("Receding '" + V + "' verse number after '" + lastV + "'", atString);
                            // else if (intV > lastintV + 1)
                            //   addWarning("Skipped verses with '" + V + "' verse number after '" + lastV + "'" + atString);
                        }
                    }
                    else
                        addError("Bad verse number", atString);

                }
                else
                    addError("Missing verse number", " after " + C + ':' + lastV + withString);

                if (fieldID) {
                    if (fieldID_list.indexOf(fieldID) >= 0)
                        addError("Duplicate '" + fieldID + "' ID", atString);
                } else
                    addError("Missing ID", atString);


                if (B != lastB || C != lastC || V != lastV) {
                    fieldID_list = []; // ID's only need to be unique within each verse
                    lastB = B; lastC = C; lastV = V;
                }

            } else
                console.log("  Line " + n + ": Has " + fields.length + " fields instead of " + EXPECTED_TN_HEADING_LINE);

        }
    }
    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data lines in '${location}'.`)
    if (result.errorList || result.warningList)
        addSuccessMessage(`checkTN_TSVText v${checkerVersionString} finished with ${result.errorList.length.toLocaleString()} errors and ${result.warningList.length.toLocaleString()} warnings`)
    else
        addSuccessMessage("No errors or warnings found by checkTN_TSVText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} successes, ${result.errorList.length.toLocaleString()} errors, ${result.warningList.length.toLocaleString()} warnings.`);
    console.log("checkTN_TSVText result is", JSON.stringify(result));
    return result;
}
// end of checkTN_TSVText function


export default checkTN_TSVText;
