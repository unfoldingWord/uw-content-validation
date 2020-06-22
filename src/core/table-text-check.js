import * as books from '../core';
import checkTN_TSVDataRow from './table-line-check';


const checkerVersionString = '0.0.5';

const NUM_EXPECTED_TN_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';


function checkTN_TSVText(BBB, tableText, location, optionalOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     Returns a result object containing a successList and a warningList
     */
    console.log("checkTN_TSVText(" + BBB + ", " + tableText.length + ", " + location + ")…");

    let result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        console.log("TSV Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        result.noticeList.push([priority, message, index, extract, location]);
    }


    // if (ALLOWED_BBBs.indexOf(BBB) == -1)
    let bbb = BBB.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    }
    catch {
        addNotice(747, "Bad function call: should be given a valid book abbreviation", -1, BBB, " (not '" + BBB + "')" + location);
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
                addNotice(746, "Bad TSV header", -1, "", location + ": '" + lines[0] + "'");
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
                for (let noticeEntry of firstResult.warningList)
                    addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);

                // So here we only have to check against the previous and next fields for out-of-order problems
                if (B) {
                    if (B != BBB)
                        addNotice(745, "Wrong '" + B + "' book code (expected '" + BBB + "')", CV_withString);
                }
                else
                    addNotice(744, "Missing book code", " at" + CV_withString);

                if (C) {
                    if (C == 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C != lastC)
                            numVersesThisChapter = books.versesInChapter(bbb, intC);
                        if (intC == 0)
                            addNotice(551, "Invalid zero '" + C + "' chapter number", atString);
                        if (intC > numChaptersThisBook)
                            addNotice(737, "Invalid large '" + C + "' chapter number", atString);
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addNotice(736, "Receding '" + C + "' chapter number after '" + lastC + "'", atString);
                            else if (intC > lastintC + 1)
                                addNotice(735, "Advancing '" + C + "' chapter number after '" + lastC + "'", atString);
                        }
                    }
                    else
                        addNotice(734, "Bad chapter number", " with" + CV_withString);
                }
                else
                    addNotice(739, "Missing chapter number", " after " + lastC + ':' + V + withString);

                if (V) {
                    if (V == 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV == 0)
                            addNotice(552, "Invalid zero '" + V + "' verse number", atString);
                        if (intV > numVersesThisChapter)
                            addNotice(734, "Invalid large '" + V + "' verse number for chapter " + C, atString);
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (intV < lastintV)
                                addNotice(733, "Receding '" + V + "' verse number after '" + lastV + "'", atString);
                            // else if (intV > lastintV + 1)
                            //   addNotice(556, "Skipped verses with '" + V + "' verse number after '" + lastV + "'" + atString);
                        }
                    }
                    else
                        addNotice(738, "Bad verse number", atString);

                }
                else
                    addNotice(790, "Missing verse number", " after " + C + ':' + lastV + withString);

                if (fieldID) {
                    if (fieldID_list.indexOf(fieldID) >= 0)
                        addNotice(729, "Duplicate '" + fieldID + "' ID", atString);
                } else
                    addNotice(730, "Missing ID", atString);


                if (B != lastB || C != lastC || V != lastV) {
                    fieldID_list = []; // ID's only need to be unique within each verse
                    lastB = B; lastC = C; lastV = V;
                }

            } else
                console.log("  Line " + n + ": Has " + fields.length + " fields instead of " + EXPECTED_TN_HEADING_LINE);

        }
    }
    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data lines in '${location}'.`)
    if (result.errorList || result.noticeList)
        addSuccessMessage(`checkTN_TSVText v${checkerVersionString} finished with ${result.errorList.length.toLocaleString()} errors and ${result.noticeList.length.toLocaleString()} warnings`)
    else
        addSuccessMessage("No errors or warnings found by checkTN_TSVText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} successes, ${result.errorList.length.toLocaleString()} errors, ${result.noticeList.length.toLocaleString()} warnings.`);
    // console.log("checkTN_TSVText result is", JSON.stringify(result));
    return result;
}
// end of checkTN_TSVText function


export default checkTN_TSVText;
