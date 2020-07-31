import * as books from '../core';
import checkTN_TSVDataRow from './table-line-check';


const TABLE_TEXT_VALIDATOR_VERSION = '0.1.1';

const NUM_EXPECTED_TN_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkTN_TSVText(BBB, tableText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     Returns a result object containing a successList and a noticeList
     */
    // console.log("checkTN_TSVText(" + BBB + ", " + tableText.length + ", " + location + ","+JSON.stringify(optionalCheckingOptions)+")…");
    let ourLocation = givenLocation;
    if (ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (BBB) ourLocation = ` in ${BBB}${ourLocation}`;

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkTN_TSVText success: " + successString);
        result.successList.push(successString);
    }
    function addCVNotice(priority, C,V, message, index, extract, location) {
        console.log("checkTN_TSVText notice: (priority=" + priority + ") " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority !== undefined, "TSV addCVNotice: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "TSV addCVNotice: 'priority' parameter should be a number not a '" + (typeof priority) + "': " + priority);
        console.assert(C !== undefined, "TSV addCVNotice: 'C' parameter should be defined");
        console.assert(typeof C === 'string', "TSV addCVNotice: 'C' parameter should be a string not a '" + (typeof C) + "': " + C);
        console.assert(V !== undefined, "TSV addCVNotice: 'V' parameter should be defined");
        console.assert(typeof V === 'string', "TSV addCVNotice: 'V' parameter should be a string not a '" + (typeof V) + "': " + V);
        console.assert(message !== undefined, "TSV addCVNotice: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "TSV addCVNotice: 'message' parameter should be a string not a '" + (typeof message) + "': " + message);
        console.assert(index !== undefined, "TSV addCVNotice: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "TSV addCVNotice: 'index' parameter should be a number not a '" + (typeof index) + "': " + index);
        console.assert(extract !== undefined, "TSV addCVNotice: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "TSV addCVNotice: 'extract' parameter should be a string not a '" + (typeof extract) + "': " + extract);
        console.assert(location !== undefined, "TSV addCVNotice: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "TSV addCVNotice: 'location' parameter should be a string not a '" + (typeof location) + "': " + location);
        result.noticeList.push([priority, BBB,C,V, message, index, extract, location]);
    }


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

    let bbb = BBB.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    }
    catch {
        addCVNotice(747, "","", "Bad function call: should be given a valid book abbreviation", -1, BBB, " (not '" + BBB + "')" + ourLocation);
    }

    let lines = tableText.split('\n');
    // console.log("  '" + location + "' has " + lines.length.toLocaleString() + " total lines (expecting " + NUM_EXPECTED_TN_FIELDS + " fields in each line)");

    let lastB = '', lastC = '', lastV = '';
    let fieldID_list = [];
    let numVersesThisChapter = 0;
    for (let n= 0; n < lines.length; n++) {
        // console.log("checkTN_TSVText checking line " + n + ": " + JSON.stringify(lines[n]));
        let inString = " in line " + n.toLocaleString() + ourLocation;
        if (n === 0) {
            if (lines[0] === EXPECTED_TN_HEADING_LINE)
                addSuccessMessage("Checked TSV header " + ourLocation);
            else
                addCVNotice(746, "","", "Bad TSV header", -1, "", ourLocation + ": '" + lines[0] + "'");
        }
        else // not the header
        {
            let fields = lines[n].split('\t');
            if (fields.length === NUM_EXPECTED_TN_FIELDS) {
                let [B, C, V, fieldID, _support_reference, _orig_quote, _occurrence, _GL_quote, _occurrenceNote] = fields;
                let withString = ` with '${fieldID}'${inString}`;
                // let CV_withString = ` ${C}:${V}${withString}`;
                // let atString = ` at ${B} ${C}:${V} (${fieldID})${inString}`;

                // Use the row check to do most basic checks
                const firstResult = checkTN_TSVDataRow(lines[n], BBB,C,V, withString, optionalCheckingOptions);
                // Choose only ONE of the following
                // This is the fast way of append the results from this field
                result.noticeList = result.noticeList.concat(firstResult.noticeList);
                // If we need to put everything through addCVNotice, e.g., for debugging or filtering
                //  process results line by line
                // for (const noticeEntry of firstResult.noticeList)
                //     addCVNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7]);

                // So here we only have to check against the previous and next fields for out-of-order problems
                if (B) {
                    if (B !== BBB)
                        addCVNotice(745, C,V, `Wrong '${B}' book code (expected '${BBB}')`, -1, "", withString);
                }
                else
                    addCVNotice(744, C,V, "Missing book code", -1, "", withString);

                if (C) {
                    if (C === 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C !== lastC)
                            numVersesThisChapter = books.versesInChapter(bbb, intC);
                        if (intC === 0)
                            addCVNotice(551, C,V, "Invalid zero '" + C + "' chapter number", -1, "", withString);
                        if (intC > numChaptersThisBook)
                            addCVNotice(737, C,V, "Invalid large '" + C + "' chapter number", -1, "", withString);
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addCVNotice(736, C,V, "Receding '" + C + "' chapter number after '" + lastC + "'", -1, "", withString);
                            else if (intC > lastintC + 1)
                                addCVNotice(735, C,V, "Advancing '" + C + "' chapter number after '" + lastC + "'", -1, "", withString);
                        }
                    }
                    else
                        addCVNotice(734, C,V, "Bad chapter number", -1, "", " with" + CV_withString);
                }
                else
                    addCVNotice(739, C,V, "Missing chapter number", -1, "", " after " + lastC + ':' + V + withString);

                if (V) {
                    if (V === 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV === 0)
                            addCVNotice(552, C,V, "Invalid zero '" + V + "' verse number", -1, "", withString);
                        if (intV > numVersesThisChapter)
                            addCVNotice(734, C,V, "Invalid large '" + V + "' verse number for chapter " + C, -1, "", withString);
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (intV < lastintV)
                                addCVNotice(733, C,V, "Receding '" + V + "' verse number after '" + lastV + "'", -1, "", withString);
                            // else if (intV > lastintV + 1)
                            //   addCVNotice(556, "Skipped verses with '" + V + "' verse number after '" + lastV + "'" + withString);
                        }
                    }
                    else
                        addCVNotice(738, C,V, "Bad verse number", -1, "", withString);

                }
                else
                    addCVNotice(790, C,V, "Missing verse number", -1, "", " after " + C + ':' + lastV + withString);

                if (fieldID) {
                    if (fieldID_list.indexOf(fieldID) >= 0)
                        addCVNotice(729, C,V, "Duplicate '" + fieldID + "' ID", withString);
                } else
                    addCVNotice(730, C,V, "Missing ID", -1, "", withString);


                if (B !== lastB || C !== lastC || V !== lastV) {
                    fieldID_list = []; // ID's only need to be unique within each verse
                    lastB = B; lastC = C; lastV = V;
                }

            } else
                // if (n === lines.length - 1) // it's the last line
                //     console.log(`  Line ${n}: Has ${fields.length} field(s) instead of ${NUM_EXPECTED_TN_FIELDS}: ${EXPECTED_TN_HEADING_LINE.replace(/\t/g, ', ')}`);
                // else
                if (n !== lines.length - 1) // it's not the last line
                    addCVNotice(888, "","", "Wrong number of tabbed fields", -1, '', inString)
        }
    }
    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data line${lines.length - 1 === 1 ? '' : 's'}${ourLocation}.`);
    if (result.noticeList)
        addSuccessMessage(`checkTN_TSVText v${TABLE_TEXT_VALIDATOR_VERSION} finished with ${result.noticeList.length?result.noticeList.length.toLocaleString():"zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage("No errors or warnings found by checkTN_TSVText v" + TABLE_TEXT_VALIDATOR_VERSION)
    // console.log(`  checkTN_TSVText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkTN_TSVText result is", JSON.stringify(result));
    return result;
}
// end of checkTN_TSVText function


export default checkTN_TSVText;
