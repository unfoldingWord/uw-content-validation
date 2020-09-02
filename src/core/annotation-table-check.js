import * as books from './books/books';
import checkAnnotationTSVDataRow from './annotation-row-check';


const TABLE_TEXT_VALIDATOR_VERSION = '0.2.1';

const NUM_EXPECTED_TN_FIELDS = 7; // so expects 6 tabs per line
const EXPECTED_TN_HEADING_LINE = 'Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tAnnotation';

const DEFAULT_EXTRACT_LENGTH = 10;


async function CheckAnnotationRows(annotationType, bookID, tableText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

     Returns a result object containing a successList and a noticeList
     */
    // console.log(`CheckAnnotationRows(${annotationType}, ${bookID}, ${tableText.length}, ${location},${JSON.stringify(optionalCheckingOptions)})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (bookID) ourLocation = ` in ${bookID}${ourLocation}`;

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`CheckAnnotationRows success: ${successString}`);
        result.successList.push(successString);
    }
    function addNoticeCV8({priority,message, C,V, lineNumber, characterIndex, extract, location}) {
        // console.log(`CheckAnnotationRows notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "ATSV addNoticeCV8: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `TSV addNoticeCV8: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "ATSV addNoticeCV8: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `TSV addNoticeCV8: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // console.assert(C !== undefined, "ATSV addNoticeCV8: 'C' parameter should be defined");
        if (C) console.assert(typeof C === 'string', `TSV addNoticeCV8: 'C' parameter should be a string not a '${typeof C}': ${C}`);
        // console.assert(V !== undefined, "ATSV addNoticeCV8: 'V' parameter should be defined");
        if (V) console.assert(typeof V === 'string', `TSV addNoticeCV8: 'V' parameter should be a string not a '${typeof V}': ${V}`);
        // console.assert(characterIndex !== undefined, "ATSV addNoticeCV8: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `TSV addNoticeCV8: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // console.assert(extract !== undefined, "ATSV addNoticeCV8: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `TSV addNoticeCV8: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "ATSV addNoticeCV8: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `TSV addNoticeCV8: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        result.noticeList.push({priority,message, bookID,C,V, lineNumber, characterIndex, extract, location});
    }


    addNoticeCV8({priority:997, message:"CheckAnnotationRows() is still a placeholder -- not completed yet", location:ourLocation});

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
            addNoticeCV8({priority:747, message:"Bad function call: should be given a valid book abbreviation", extract:bookID, location:` (not '${bookID}')${ourLocation}`});
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
                addNoticeCV8({priority:746, message:"Bad TSV header", lineNumber:n+1, location:`${ourLocation}: '${lines[0]}'`});
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
                // If we need to put everything through addNoticeCV8, e.g., for debugging or filtering
                //  process results line by line
                // for (const noticeEntry of firstResult.noticeList)
                //     addNoticeCV8({priority:noticeEntry.priority, noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7]);

                // So here we only have to check against the previous and next fields for out-of-order problems
                if (C) {
                    if (C === 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C !== lastC)
                            numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                        if (intC === 0)
                            addNoticeCV8({priority:551, C,V, message:`Invalid zero '${C}' chapter number`, lineNumber:n+1, location:withString});
                        if (intC > numChaptersThisBook)
                            addNoticeCV8({priority:737, C,V, message:`Invalid large '${C}' chapter number`, lineNumber:n+1, location:withString});
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addNoticeCV8({priority:736, C,V, message:`Receding '${C}' chapter number after '${lastC}'`, lineNumber:n+1, location:withString});
                            else if (intC > lastintC + 1)
                                addNoticeCV8({priority:735, C,V, message:`Advancing '${C}' chapter number after '${lastC}'`, lineNumber:n+1, location:withString});
                        }
                    }
                    else
                        addNoticeCV8({priority:734, C,V, message:"Bad chapter number", lineNumber:n+1, location:withString});
                }
                else
                    addNoticeCV8({priority:739, C,V, message:"Missing chapter number", lineNumber:n+1, location:` after ${lastC}:${V}${withString}`});

                if (V) {
                    if (V === 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV === 0)
                            addNoticeCV8({priority:552, C,V, message:`Invalid zero '${V}' verse number`, lineNumber:n+1, location:withString});
                        if (intV > numVersesThisChapter)
                            addNoticeCV8({priority:734, C,V, message:`Invalid large '${V}' verse number for chapter ${C}`, lineNumber:n+1, location:withString});
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (intV < lastintV)
                                addNoticeCV8({priority:733, C,V, message:`Receding '${V}' verse number after '${lastV}'`, lineNumber:n+1, location:withString});
                            // else if (intV > lastintV + 1)
                            //   addNoticeCV8({priority:556, `Skipped verses with '${V}' verse number after '${lastV}'${withString}`);
                        }
                    }
                    else
                        addNoticeCV8({priority:738, C,V, message:"Bad verse number", lineNumber:n+1, location:withString});

                }
                else
                    addNoticeCV8({priority:790, C,V, message:"Missing verse number", lineNumber:n+1, location:` after ${C}:${lastV}${withString}`});

                if (fieldID) {
                    if (fieldID_list.indexOf(fieldID) >= 0)
                        addNoticeCV8({priority:729, C,V, message:`Duplicate '${fieldID}' ID`, lineNumber:n+1, location:withString});
                } else
                    addNoticeCV8({priority:730, C,V, message:"Missing ID", lineNumber:n+1, location:withString});


                if (C !== lastC || V !== lastV) {
                    fieldID_list = []; // ID's only need to be unique within each verse
                    lastC = C; lastV = V;
                }

            } else
                // if (n === lines.length - 1) // it's the last line
                //     console.log(`  Line ${n}: Has ${fields.length} field(s) instead of ${NUM_EXPECTED_TN_FIELDS}: ${EXPECTED_TN_HEADING_LINE.replace(/\t/g, ', ')}`);
                // else
                if (n !== lines.length - 1) // it's not the last line
                    addNoticeCV8({priority:988, message:`Wrong number of tabbed fields (expected ${NUM_EXPECTED_TN_FIELDS})`, extract:`Found ${fields.length} field${fields.length===1?'':'s'}`, lineNumber:n+1, location:inString});
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
