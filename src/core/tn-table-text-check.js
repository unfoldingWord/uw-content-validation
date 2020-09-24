import * as books from './books/books';
import {checkTN_TSVDataRow} from './tn-table-row-check';


const TN_TABLE_TEXT_VALIDATOR_VERSION_STRING = '0.2.3';

const NUM_EXPECTED_TN_TSV_FIELDS = 9; // so expects 8 tabs per line
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

const DEFAULT_EXTRACT_LENGTH = 10;


export async function checkTN_TSVText(languageCode, bookID, filename, tableText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

     Returns a result object containing a successList and a noticeList
     */
    // console.log(`checkTN_TSVText(${bookID}, ${tableText.length}, ${location},${JSON.stringify(optionalCheckingOptions)})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (bookID) ourLocation = ` in ${bookID}${ourLocation}`;

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkTN_TSVText success: ${successString}`);
        result.successList.push(successString);
    }
    function addNoticeCV8(noticeObject) {
        // console.log(`checkTN_TSVText notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "TSV addNoticeCV8: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `TSV addNoticeCV8: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "TSV addNoticeCV8: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `TSV addNoticeCV8: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(C !== undefined, "TSV addNoticeCV8: 'C' parameter should be defined");
        if (noticeObject.C) console.assert(typeof noticeObject.C === 'string', `TSV addNoticeCV8: 'C' parameter should be a string not a '${typeof noticeObject.C}': ${noticeObject.C}`);
        // console.assert(V !== undefined, "TSV addNoticeCV8: 'V' parameter should be defined");
        if (noticeObject.V) console.assert(typeof noticeObject.V === 'string', `TSV addNoticeCV8: 'V' parameter should be a string not a '${typeof noticeObject.V}': ${noticeObject.V}`);
        // console.assert(characterIndex !== undefined, "TSV addNoticeCV8: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `TSV addNoticeCV8: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "TSV addNoticeCV8: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `TSV addNoticeCV8: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "TSV addNoticeCV8: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `TSV addNoticeCV8: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        result.noticeList.push({ ...noticeObject, bookID, filename });
    }


    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (ttcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
    // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    let lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
    }
    catch {
        if (!books.isValidBookID(bookID)) // must not be in FRT, BAK, etc.
            addNoticeCV8({ priority: 747, message: "Bad function call: should be given a valid book abbreviation", extract: bookID, location: ` (not '${bookID}')${ourLocation}` });
    }

    let lines = tableText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines (expecting ${NUM_EXPECTED_TN_FIELDS} fields in each line)`);

    let lastB = '', lastC = '', lastV = '';
    let rowIDList = [], uniqueRowList = [];
    let numVersesThisChapter = 0;
    for (let n = 0; n < lines.length; n++) {
        // console.log(`checkTN_TSVText checking line ${n}: ${JSON.stringify(lines[n])}`);
        if (n === 0) {
            if (lines[0] === EXPECTED_TN_HEADING_LINE)
                addSuccessMessage(`Checked TSV header ${ourLocation}`);
            else
                addNoticeCV8({ priority: 746, message: "Bad TSV header", lineNumber: n + 1, location: `${ourLocation}: '${lines[0]}'` });
        }
        else // not the header
        {
            let fields = lines[n].split('\t');
            if (fields.length === NUM_EXPECTED_TN_TSV_FIELDS) {
                // eslint-disable-next-line no-unused-vars
                const [B, C, V, rowID, supportReference, origQuote, occurrence, _GLQuote, _occurrenceNote] = fields;

                // Use the row check to do most basic checks
                const firstResult = await checkTN_TSVDataRow(languageCode, lines[n], bookID, C, V, ourLocation, optionalCheckingOptions);
                // Choose only ONE of the following
                // This is the fast way of append the results from this field
                // result.noticeList = result.noticeList.concat(firstResult.noticeList);
                // If we need to put everything through addNoticeCV8, e.g., for debugging or filtering
                //  process results line by line
                for (const noticeEntry of firstResult.noticeList)
                    addNoticeCV8({ ...noticeEntry, lineNumber: n + 1 });

                // So here we only have to check against the previous and next fields for out-of-order problems and duplicate problems
                if (B !== lastB || C !== lastC || V !== lastV) {
                    rowIDList = []; // ID's only need to be unique within each verse
                    uniqueRowList = []; // Same for these
                }

                // TODO: Check if we need this at all (even though tC 3.0 can't display these "duplicate" notes)
                // Check for duplicate notes
                const uniqueID = C + V + supportReference + origQuote + occurrence; // This combination should not be repeated
                // if (uniqueRowList.indexOf(uniqueID) >= 0)
                //     addNoticeCV8({ priority: 880, C, V, message: `Duplicate note`, rowID, lineNumber: n + 1, location: ourLocation });
                // if (uniqueRowList.indexOf(uniqueID) >= 0)
                //     addNoticeCV8({ priority: 80, C, V, message: `Note: tC 3.0 won't display duplicate note`, rowID, lineNumber: n + 1, location: ourLocation });
                uniqueRowList.push(uniqueID);

                if (B) {
                    if (B !== bookID)
                        addNoticeCV8({ priority: 745, C, V, message: `Wrong '${B}' book identifier (expected '${bookID}')`, rowID, lineNumber: n + 1, location: ourLocation });
                }
                else
                    addNoticeCV8({ priority: 744, C, V, message: "Missing book identifier", rowID, lineNumber: n + 1, location: ourLocation });

                if (C) {
                    if (C === 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C !== lastC)
                            numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                        if (intC === 0)
                            addNoticeCV8({ priority: 551, C, V, message: `Invalid zero '${C}' chapter number`, rowID, lineNumber: n + 1, location: ourLocation });
                        if (intC > numChaptersThisBook)
                            addNoticeCV8({ priority: 737, C, V, message: `Invalid large '${C}' chapter number`, rowID, lineNumber: n + 1, location: ourLocation });
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addNoticeCV8({ priority: 736, C, V, message: `Receding '${C}' chapter number after '${lastC}'`, rowID, lineNumber: n + 1, location: ourLocation });
                            else if (intC > lastintC + 1)
                                addNoticeCV8({ priority: 735, C, V, message: `Advancing '${C}' chapter number after '${lastC}'`, rowID, lineNumber: n + 1, location: ourLocation });
                        }
                    }
                    else
                        addNoticeCV8({ priority: 734, C, V, message: "Bad chapter number", rowID, lineNumber: n + 1, location: ourLocation });
                }
                else
                    addNoticeCV8({ priority: 739, C, V, message: "Missing chapter number", rowID, lineNumber: n + 1, location: ` after ${lastC}:${V}${ourLocation}` });

                if (V) {
                    if (V === 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV === 0)
                            addNoticeCV8({ priority: 552, C, V, message: `Invalid zero '${V}' verse number`, rowID, lineNumber: n + 1, location: ourLocation });
                        if (intV > numVersesThisChapter)
                            addNoticeCV8({ priority: 734, C, V, message: `Invalid large '${V}' verse number for chapter ${C}`, rowID, lineNumber: n + 1, location: ourLocation });
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (intV < lastintV)
                                addNoticeCV8({ priority: 733, C, V, message: `Receding '${V}' verse number after '${lastV}'`, rowID, lineNumber: n + 1, location: ourLocation });
                            // else if (intV > lastintV + 1)
                            //   addNoticeCV8({priority:556, `Skipped verses with '${V}' verse number after '${lastV}'${withString}`);
                        }
                    }
                    else
                        addNoticeCV8({ priority: 738, C, V, message: "Bad verse number", rowID, lineNumber: n + 1, location: ourLocation });

                }
                else
                    addNoticeCV8({ priority: 790, C, V, message: "Missing verse number", rowID, lineNumber: n + 1, location: ` after ${C}:${lastV}${ourLocation}` });

                if (rowID) {
                    if (rowIDList.indexOf(rowID) >= 0)
                        addNoticeCV8({ priority: 729, C, V, message: `Duplicate '${rowID}' ID`, fieldName:'ID', rowID, lineNumber: n + 1, location: ourLocation });
                } else
                    addNoticeCV8({ priority: 730, C, V, message: "Missing ID", fieldName:'ID', lineNumber: n + 1, location: ourLocation });


                lastB = B; lastC = C; lastV = V;

            } else
                // if (n === lines.length - 1) // it's the last line
                //     console.log(`  Line ${n}: Has ${fields.length} field(s) instead of ${NUM_EXPECTED_TN_FIELDS}: ${EXPECTED_TN_HEADING_LINE.replace(/\t/g, ', ')}`);
                // else
                if (n !== lines.length - 1) // it's not the last line
                    addNoticeCV8({ priority: 988, message: `Wrong number of tabbed fields (expected ${NUM_EXPECTED_TN_TSV_FIELDS})`, extract: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, lineNumber: n + 1, location: ourLocation });
        }
    }
    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data line${lines.length - 1 === 1 ? '' : 's'}${ourLocation}.`);
    if (result.noticeList)
        addSuccessMessage(`checkTN_TSVText v${TN_TABLE_TEXT_VALIDATOR_VERSION_STRING} finished with ${result.noticeList.length ? result.noticeList.length.toLocaleString() : "zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkTN_TSVText v${TN_TABLE_TEXT_VALIDATOR_VERSION_STRING}`)
    // console.log(`  checkTN_TSVText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkTN_TSVText result is", JSON.stringify(result));
    return result;
}
// end of checkTN_TSVText function


//export default checkTN_TSVText;
