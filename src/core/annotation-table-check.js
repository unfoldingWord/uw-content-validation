import * as books from './books/books';
import checkAnnotationTSVDataRow from './annotation-row-check';


const TABLE_TEXT_VALIDATOR_VERSION = '0.1.0';

const NUM_EXPECTED_TN_FIELDS = 7; // so expects 6 tabs per line
const EXPECTED_TN_HEADING_LINE = 'Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tAnnotation';

const DEFAULT_EXTRACT_LENGTH = 10;


async function CheckAnnotationRows(annotationType, bookID, tableText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

     Returns a result object containing a successList and a noticeList
     */
    console.log(`CheckAnnotationRows(${annotationType}, ${bookID}, ${tableText.length}, ${location},${JSON.stringify(optionalCheckingOptions)})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (bookID) ourLocation = ` in ${bookID}${ourLocation}`;

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`CheckAnnotationRows success: ${successString}`);
        result.successList.push(successString);
    }
    function addNoticeCV7(priority, C,V, message, characterIndex, extract, location) {
        console.log(`CheckAnnotationRows notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "ATSV addNoticeCV7: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `TSV addNoticeCV7: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(C !== undefined, "ATSV addNoticeCV7: 'C' parameter should be defined");
        console.assert(typeof C === 'string', `TSV addNoticeCV7: 'C' parameter should be a string not a '${typeof C}': ${C}`);
        console.assert(V !== undefined, "ATSV addNoticeCV7: 'V' parameter should be defined");
        console.assert(typeof V === 'string', `TSV addNoticeCV7: 'V' parameter should be a string not a '${typeof V}': ${V}`);
        console.assert(message !== undefined, "ATSV addNoticeCV7: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `TSV addNoticeCV7: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        console.assert(characterIndex !== undefined, "ATSV addNoticeCV7: 'characterIndex' parameter should be defined");
        console.assert(typeof characterIndex === 'number', `TSV addNoticeCV7: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        console.assert(extract !== undefined, "ATSV addNoticeCV7: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `TSV addNoticeCV7: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "ATSV addNoticeCV7: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `TSV addNoticeCV7: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({priority, bookID,C,V, message, characterIndex, extract, location});
    }


    addNoticeCV7(997, '','', "CheckAnnotationRows() is still a placeholder -- not completed yet", -1, "", ourLocation);

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
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    let lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
    }
    catch {
        if (!books.isValidBookID(bookID)) // must not be in FRT, BAK, etc.
            addNoticeCV7(747, '','', "Bad function call: should be given a valid book abbreviation", -1, bookID, ` (not '${bookID}')${ourLocation}`);
    }

    let lines = tableText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines (expecting ${NUM_EXPECTED_TN_FIELDS} fields in each line)`);

    let lastC = '', lastV = '';
    let fieldID_list = [];
    let numVersesThisChapter = 0;
    for (let n= 0; n < lines.length; n++) {
        // console.log(`CheckAnnotationRows checking line ${n}: ${JSON.stringify(lines[n])}`);
        let inString = ` in line ${(n + 1).toLocaleString()}${ourLocation}`;
        if (n === 0) {
            if (lines[0] === EXPECTED_TN_HEADING_LINE)
                addSuccessMessage(`Checked TSV header ${ourLocation}`);
            else
                addNoticeCV7(746, '','', "Bad TSV header", -1, "", `${ourLocation}: '${lines[0]}'`);
        }
        else // not the header
        {
            let fields = lines[n].split('\t');
            if (fields.length === NUM_EXPECTED_TN_FIELDS) {
                const [reference, fieldID, tags, _support_reference, _quote, _occurrence, _annotation] = fields;
                const [C, V] = reference.split(':')
                const withString = ` with ID '${fieldID}'${inString}`;
                // let CV_withString = ` ${C}:${V}${withString}`;
                // let atString = ` at ${Annotation} ${C}:${V} (${fieldID})${inString}`;

                // Use the row check to do most basic checks
                const firstResult = await checkAnnotationTSVDataRow(annotationType, lines[n], bookID,C,V, withString, optionalCheckingOptions);
                // Choose only ONE of the following
                // This is the fast way of append the results from this field
                result.noticeList = result.noticeList.concat(firstResult.noticeList);
                // If we need to put everything through addNoticeCV7, e.g., for debugging or filtering
                //  process results line by line
                // for (const noticeEntry of firstResult.noticeList)
                //     addNoticeCV7(noticeEntry.priority, noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7]);

                // So here we only have to check against the previous and next fields for out-of-order problems
                if (C) {
                    if (C === 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C !== lastC)
                            numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                        if (intC === 0)
                            addNoticeCV7(551, C,V, `Invalid zero '${C}' chapter number`, -1, "", withString);
                        if (intC > numChaptersThisBook)
                            addNoticeCV7(737, C,V, `Invalid large '${C}' chapter number`, -1, "", withString);
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addNoticeCV7(736, C,V, `Receding '${C}' chapter number after '${lastC}'`, -1, "", withString);
                            else if (intC > lastintC + 1)
                                addNoticeCV7(735, C,V, `Advancing '${C}' chapter number after '${lastC}'`, -1, "", withString);
                        }
                    }
                    else
                        addNoticeCV7(734, C,V, "Bad chapter number", -1, "", withString);
                }
                else
                    addNoticeCV7(739, C,V, "Missing chapter number", -1, "", ` after ${lastC}:${V}${withString}`);

                if (V) {
                    if (V === 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV === 0)
                            addNoticeCV7(552, C,V, `Invalid zero '${V}' verse number`, -1, "", withString);
                        if (intV > numVersesThisChapter)
                            addNoticeCV7(734, C,V, `Invalid large '${V}' verse number for chapter ${C}`, -1, "", withString);
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (intV < lastintV)
                                addNoticeCV7(733, C,V, `Receding '${V}' verse number after '${lastV}'`, -1, "", withString);
                            // else if (intV > lastintV + 1)
                            //   addNoticeCV7(556, `Skipped verses with '${V}' verse number after '${lastV}'${withString}`);
                        }
                    }
                    else
                        addNoticeCV7(738, C,V, "Bad verse number", -1, "", withString);

                }
                else
                    addNoticeCV7(790, C,V, "Missing verse number", -1, "", ` after ${C}:${lastV}${withString}`);

                if (fieldID) {
                    if (fieldID_list.indexOf(fieldID) >= 0)
                        addNoticeCV7(729, C,V, `Duplicate '${fieldID}' ID`, withString);
                } else
                    addNoticeCV7(730, C,V, "Missing ID", -1, "", withString);


                if (C !== lastC || V !== lastV) {
                    fieldID_list = []; // ID's only need to be unique within each verse
                    lastC = C; lastV = V;
                }

            } else
                // if (n === lines.length - 1) // it's the last line
                //     console.log(`  Line ${n}: Has ${fields.length} field(s) instead of ${NUM_EXPECTED_TN_FIELDS}: ${EXPECTED_TN_HEADING_LINE.replace(/\t/g, ', ')}`);
                // else
                if (n !== lines.length - 1) // it's not the last line
                    addNoticeCV7(988, '','', `Wrong number of tabbed fields (expected ${NUM_EXPECTED_TN_FIELDS})`, -1, `Found ${fields.length} field${fields.length===1?'':'s'}`, inString)
        }
    }
    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data line${lines.length - 1 === 1 ? '' : 's'}${ourLocation}.`);
    if (result.noticeList)
        addSuccessMessage(`CheckAnnotationRows v${TABLE_TEXT_VALIDATOR_VERSION} finished with ${result.noticeList.length?result.noticeList.length.toLocaleString():"zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by CheckAnnotationRows v${TABLE_TEXT_VALIDATOR_VERSION}`)
    // console.log(`  CheckAnnotationRows returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("CheckAnnotationRows result is", JSON.stringify(result));
    return result;
}
// end of CheckAnnotationRows function


export default CheckAnnotationRows;
