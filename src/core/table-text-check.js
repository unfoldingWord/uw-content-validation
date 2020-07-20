import * as books from '../core';
import checkTN_TSVDataRow from './table-line-check';


const checkerVersionString = '0.0.5';

const NUM_EXPECTED_TN_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

const DEFAULT_EXTRACT_LENGTH = 10;

function checkTN_TSVText(BBB, tableText, location, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     Returns a result object containing a successList and a noticeList
     */
    // console.log("checkTN_TSVText(" + BBB + ", " + tableText.length + ", " + location + ","+JSON.stringify(optionalCheckingOptions)+")…");

    let result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkTN_TSVText success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        console.log("checkTN_TSVText notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority!==undefined, "TSV addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority==='number', "TSV addNotice: 'priority' parameter should be a number not a '"+(typeof priority)+"': "+priority);
        console.assert(message!==undefined, "TSV addNotice: 'message' parameter should be defined");
        console.assert(typeof message==='string', "TSV addNotice: 'message' parameter should be a string not a '"+(typeof message)+"': "+message);
        console.assert(index!==undefined, "TSV addNotice: 'index' parameter should be defined");
        console.assert(typeof index==='number', "TSV addNotice: 'index' parameter should be a number not a '"+(typeof index)+"': "+index);
        console.assert(extract!==undefined, "TSV addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract==='string', "TSV addNotice: 'extract' parameter should be a string not a '"+(typeof extract)+"': "+extract);
        console.assert(location!==undefined, "TSV addNotice: 'location' parameter should be defined");
        console.assert(typeof location==='string', "TSV addNotice: 'location' parameter should be a string not a '"+(typeof location)+"': "+location);
        result.noticeList.push([priority, message, index, extract, location]);
    }


    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (e) {}
    if (typeof extractLength != 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    //     console.log("Using supplied extractLength=" + extractLength, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength+1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, "halfLengthPlus="+halfLengthPlus);

    let bbb = BBB.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    }
    catch {
        addNotice(747, "Bad function call: should be given a valid book abbreviation", -1, BBB, " (not '" + BBB + "')" + location);
    }

    let lines = tableText.split('\n');
    // console.log("  '" + location + "' has " + lines.length.toLocaleString() + " total lines (expecting " + NUM_EXPECTED_TN_FIELDS + " fields in each line)");

    let lastB = '', lastC = '', lastV = '';
    let fieldID_list = [];
    let numVersesThisChapter = 0;
    for (let n = 0; n < lines.length; n++) {
        // console.log("checkTN_TSVText checking line " + n + ": " + JSON.stringify(lines[n]));
        let inString = " in line " + n.toLocaleString() + location;
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
                let withString = " with '" + fieldID + "'" + inString;
                let CV_withString = ' ' + C + ':' + V + withString;
                let atString = " at " + B + ' ' + C + ':' + V + " (" + fieldID + ")" + inString;

                // Use the row check to do most basic checks
                const firstResult = checkTN_TSVDataRow(BBB, lines[n], atString, optionalCheckingOptions);
                // Choose only ONE of the following
                // This is the fast way of append the results from this field
                result.noticeList = result.noticeList.concat(firstResult.noticeList);
                // If we need to put everything through addNotice, e.g., for debugging or filtering
                //  process results line by line
                // for (let noticeEntry of firstResult.noticeList)
                //     addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);

                // So here we only have to check against the previous and next fields for out-of-order problems
                if (B) {
                    if (B != BBB)
                        addNotice(745, "Wrong '" + B + "' book code (expected '" + BBB + "')", -1, "", CV_withString);
                }
                else
                    addNotice(744, "Missing book code", -1, "", " at" + CV_withString);

                if (C) {
                    if (C==='front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C != lastC)
                            numVersesThisChapter = books.versesInChapter(bbb, intC);
                        if (intC == 0)
                            addNotice(551, "Invalid zero '" + C + "' chapter number", -1, "", atString);
                        if (intC > numChaptersThisBook)
                            addNotice(737, "Invalid large '" + C + "' chapter number", -1, "", atString);
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addNotice(736, "Receding '" + C + "' chapter number after '" + lastC + "'", -1, "", atString);
                            else if (intC > lastintC + 1)
                                addNotice(735, "Advancing '" + C + "' chapter number after '" + lastC + "'", -1, "", atString);
                        }
                    }
                    else
                        addNotice(734, "Bad chapter number", -1, "", " with" + CV_withString);
                }
                else
                    addNotice(739, "Missing chapter number", -1, "", " after " + lastC + ':' + V + withString);

                if (V) {
                    if (V==='intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV == 0)
                            addNotice(552, "Invalid zero '" + V + "' verse number", -1, "", atString);
                        if (intV > numVersesThisChapter)
                            addNotice(734, "Invalid large '" + V + "' verse number for chapter " + C, -1, "", atString);
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (intV < lastintV)
                                addNotice(733, "Receding '" + V + "' verse number after '" + lastV + "'", -1, "", atString);
                            // else if (intV > lastintV + 1)
                            //   addNotice(556, "Skipped verses with '" + V + "' verse number after '" + lastV + "'" + atString);
                        }
                    }
                    else
                        addNotice(738, "Bad verse number", -1, "", atString);

                }
                else
                    addNotice(790, "Missing verse number", -1, "", " after " + C + ':' + lastV + withString);

                if (fieldID) {
                    if (fieldID_list.indexOf(fieldID) >= 0)
                        addNotice(729, "Duplicate '" + fieldID + "' ID", atString);
                } else
                    addNotice(730, "Missing ID", -1, "", atString);


                if (B != lastB || C != lastC || V != lastV) {
                    fieldID_list = []; // ID's only need to be unique within each verse
                    lastB = B; lastC = C; lastV = V;
                }

            } else
                if (n==lines.length-1) // it's the last line
                    console.log("  Line " + n + ": Has " + fields.length + " field(s) instead of " +NUM_EXPECTED_TN_FIELDS+": "+ EXPECTED_TN_HEADING_LINE.replace(/\t/g,', '));
                else
                    addNotice(888, "Wrong number of tabbed fields", -1, '', inString)
        }
    }
    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data line(s) in '${location}'.`);
    if (result.noticeList)
        addSuccessMessage(`checkTN_TSVText v${checkerVersionString} finished with ${result.noticeList.length.toLocaleString()} notice(s)`);
    else
        addSuccessMessage("No errors or warnings found by checkTN_TSVText v" + checkerVersionString)
    // console.log(`  checkTN_TSVText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkTN_TSVText result is", JSON.stringify(result));
    return result;
}
// end of checkTN_TSVText function


export default checkTN_TSVText;
