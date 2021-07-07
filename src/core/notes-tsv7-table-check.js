import * as books from './books/books';
import { DEFAULT_EXCERPT_LENGTH } from './defaults'
import { checkNotesTSV7DataRow } from './notes-tsv7-row-check';
import { removeDisabledNotices } from './disabled-notices';
// eslint-disable-next-line no-unused-vars
import { parameterAssert } from './utilities';


const NOTES_TABLE_VALIDATOR_VERSION_STRING = '0.3.5';

const NUM_EXPECTED_NOTES_TSV_FIELDS = 7; // so expects 6 tabs per line
const EXPECTED_NOTES_HEADING_LINE = 'Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode -- 'TN' or 'SN'
 * @param {string} bookID
 * @param {string} filename
 * @param {string} tableText
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkNotesTSV7Table(languageCode, repoCode, bookID, filename, tableText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

     Returns a result object containing a successList and a noticeList
     */
    // functionLog(`checkNotesTSV7Table(${languageCode}, ${repoCode}, ${bookID}, ${tableText.length}, ${givenLocation},${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(languageCode !== undefined, "checkNotesTSV7Table: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkNotesTSV7Table: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    //parameterAssert(repoCode.endsWith('TN') || repoCode.endsWith('TN2') || repoCode.endsWith('SN'), `checkNotesTSV7Table: repoCode expected to end with 'TN', 'TN2', or 'SN' not '${repoCode}'`);
    //parameterAssert(bookID !== undefined, "checkNotesTSV7Table: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkNotesTSV7Table: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    //parameterAssert(bookID.length === 3, `checkNotesTSV7Table: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //parameterAssert(bookID.toUpperCase() === bookID, `checkNotesTSV7Table: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkNotesTSV7Table: '${bookID}' is not a valid USFM book identifier`);
    //parameterAssert(givenLocation !== undefined, "checkNotesTSV7Table: 'givenLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkNotesTSV7Table: 'givenLocation' parameter should be a string not a '${typeof givenLocation}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const carResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // functionLog(`checkNotesTSV7Table success: ${successString}`);
        carResult.successList.push(successString);
    }
    function addNoticePartial(noticeObject) {
        // functionLog(`checkNotesTSV7Table notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(noticeObject.priority !== undefined, "ATSV addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `TSV addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "ATSV addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `TSV addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(C !== undefined, "ATSV addNoticePartial: 'C' parameter should be defined");
        if (noticeObject.C) { //parameterAssert(typeof noticeObject.C === 'string', `TSV addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}': ${noticeObject.C}`);
        }
        // //parameterAssert(V !== undefined, "ATSV addNoticePartial: 'V' parameter should be defined");
        if (noticeObject.V) { //parameterAssert(typeof noticeObject.V === 'string', `TSV addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}': ${noticeObject.V}`);
        }
        // //parameterAssert(characterIndex !== undefined, "ATSV addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `TSV addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "ATSV addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `TSV addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "ATSV addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `TSV addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        if (noticeObject.debugChain) noticeObject.debugChain = `checkNotesTSV7Table ${noticeObject.debugChain}`;
        carResult.noticeList.push({ ...noticeObject, bookID, filename, repoCode });
    }


    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (ttcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    // const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    // const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    let lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook = 0;
    if (bookID === 'OBS')
        numChaptersThisBook = 50; // There's 50 Open Bible Stories
    else {
        //parameterAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in checkNotesTSV7Table");
        try {
            numChaptersThisBook = books.chaptersInBook(bookID);
        }
        catch {
            if (!books.isValidBookID(bookID)) // must not be in FRT, BAK, etc.
                addNoticePartial({ priority: 747, message: "Bad function call: should be given a valid book abbreviation", excerpt: bookID, location: ` (not '${bookID}')${ourLocation}` });
        }
    }

    let lines = tableText.split('\n');
    // debugLog(`  '${location}' has ${lines.length.toLocaleString()} total lines (expecting ${NUM_EXPECTED_TN_FIELDS} fields in each line)`);

    let lastC = '', lastV = '';
    let rowIDListForVerse = [], uniqueRowListForVerse = [];
    let numVersesThisChapter = 0;
    for (let n = 0; n < lines.length; n++) {
        // functionLog(`checkNotesTSV7Table checking line ${n}: ${JSON.stringify(lines[n])}`);
        if (n === 0) {
            if (lines[0] === EXPECTED_NOTES_HEADING_LINE)
                addSuccessMessage(`Checked TSV header ${ourLocation}`);
            else
                addNoticePartial({ priority: 988, message: "Bad TSV header", details: `expected '${EXPECTED_NOTES_HEADING_LINE}'`, excerpt: lines[0], lineNumber: 1, location: ourLocation });
        }
        else // not the header
        {
            let fields = lines[n].split('\t');
            if (fields.length === NUM_EXPECTED_NOTES_TSV_FIELDS) {
                // eslint-disable-next-line no-unused-vars
                const [reference, rowID, tags, supportReference, quote, occurrence, note] = fields;
                const [C, V] = reference.split(':')

                // Use the row check to do most basic checks
                const drResultObject = await checkNotesTSV7DataRow(languageCode, repoCode, lines[n], bookID, C, V, ourLocation, checkingOptions);
                // Choose only ONE of the following
                // This is the fast way of append the results from this field
                // result.noticeList = result.noticeList.concat(firstResult.noticeList);
                // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
                //  process results line by line
                for (const drNoticeEntry of drResultObject.noticeList)
                    if (drNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN2 check
                        carResult.noticeList.push(drNoticeEntry); // Just copy the complete notice as is
                    else if (drNoticeEntry.priority !== 931) // We already caught Missing row ID
                        addNoticePartial({ ...drNoticeEntry, lineNumber: n + 1 });
                // The following is needed coz we might be checking the linked TA and/or TW articles
                if (drResultObject.checkedFileCount && drResultObject.checkedFileCount > 0)
                    if (typeof carResult.checkedFileCount === 'number') carResult.checkedFileCount += drResultObject.checkedFileCount;
                    else carResult.checkedFileCount = drResultObject.checkedFileCount;
                if (drResultObject.checkedFilesizes && drResultObject.checkedFilesizes > 0)
                    if (typeof carResult.checkedFilesizes === 'number') carResult.checkedFilesizes += drResultObject.checkedFilesizes;
                    else carResult.checkedFilesizes = drResultObject.checkedFilesizes;
                if (drResultObject.checkedRepoNames && drResultObject.checkedRepoNames.length > 0)
                    for (const checkedRepoName of drResultObject.checkedRepoNames)
                        try { if (carResult.checkedRepoNames.indexOf(checkedRepoName) < 0) carResult.checkedRepoNames.push(checkedRepoName); }
                        catch { carResult.checkedRepoNames = [checkedRepoName]; }
                if (drResultObject.checkedFilenameExtensions && drResultObject.checkedFilenameExtensions.length > 0)
                    for (const checkedFilenameExtension of drResultObject.checkedFilenameExtensions)
                        try { if (carResult.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) carResult.checkedFilenameExtensions.push(checkedFilenameExtension); }
                        catch { carResult.checkedFilenameExtensions = [checkedFilenameExtension]; }
                // if (ttResult.checkedFilenameExtensions) userLog("ttResult", JSON.stringify(ttResult));

                // So here we only have to check against the previous and next fields for out-of-order problems and duplicate problems
                if (C !== lastC || V !== lastV) {
                    rowIDListForVerse = []; // ID's only need to be unique within each verse
                    uniqueRowListForVerse = []; // Same for these
                }

                // TODO: Check if we need this at all (even though tC 3.0 can’t display these "duplicate" notes)
                // Check for duplicate notes
                const uniqueID = C + V + supportReference + quote + occurrence; // This combination should not be repeated
                // if (uniqueRowListForVerse.includes(uniqueID))
                //     addNoticePartial({ priority: 880, C, V, message: `Duplicate note`, rowID, lineNumber: n + 1, location: ourLocation });
                // if (uniqueRowListForVerse.includes(uniqueID))
                //     addNoticePartial({ priority: 80, C, V, message: `Note: tC 3.0 won’t display duplicate note`, rowID, lineNumber: n + 1, location: ourLocation });
                uniqueRowListForVerse.push(uniqueID);

                if (C) {
                    if (C === 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C !== lastC)
                            if (lowercaseBookID === 'obs')
                                numVersesThisChapter = 99; // Set to maximum expected number of frames
                            else
                                numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                        if (intC === 0)
                            addNoticePartial({ priority: 551, C, V, message: `Invalid zero chapter number`, rowID, lineNumber: n + 1, excerpt: C, location: ourLocation });
                        if (intC > numChaptersThisBook)
                            addNoticePartial({ priority: 737, C, V, message: "Invalid large chapter number", rowID, lineNumber: n + 1, excerpt: C, location: ourLocation });
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addNoticePartial({ priority: 736, C, V, message: "Receding chapter number", details: `'${C}' after '${lastC}'`, rowID, lineNumber: n + 1, location: ourLocation });
                            else if (intC > lastintC + 1)
                                addNoticePartial({ priority: 735, C, V, message: "Advancing chapter number", details: `'${C}' after '${lastC}'`.rowID, lineNumber: n + 1, location: ourLocation });
                        }
                    }
                    else
                        addNoticePartial({ priority: 734, C, V, message: "Bad chapter number", rowID, lineNumber: n + 1, location: ourLocation });
                }
                else
                    addNoticePartial({ priority: 739, C, V, message: "Missing chapter number", rowID, lineNumber: n + 1, location: ` after ${lastC}:${V}${ourLocation}` });

                if (V) {
                    if (V === 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV === 0 && bookID !== 'PSA') // Psalms have \d titles
                            addNoticePartial({ priority: 552, C, V, message: "Invalid zero verse number", details: `for chapter ${C}`, rowID, lineNumber: n + 1, excerpt: V, location: ourLocation });
                        if (intV > numVersesThisChapter)
                            addNoticePartial({ priority: 734, C, V, message: "Invalid large verse number", details: `for chapter ${C}`, rowID, lineNumber: n + 1, excerpt: V, location: ourLocation });
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (C === lastC && intV < lastintV)
                                addNoticePartial({ priority: 733, C, V, message: "Receding verse number", details: `'${V}' after '${lastV} for chapter ${C}`, rowID, lineNumber: n + 1, excerpt: V, location: ourLocation });
                            // else if (intV > lastintV + 1)
                            //   addNoticePartial({priority:556, `Skipped verses with '${V}' verse number after '${lastV}'${withString}`);
                        }
                    }
                    else
                        addNoticePartial({ priority: 738, C, V, message: "Bad verse number", rowID, lineNumber: n + 1, location: ourLocation });

                }
                else
                    addNoticePartial({ priority: 790, C, V, message: "Missing verse number", rowID, lineNumber: n + 1, location: ` after ${C}:${lastV}${ourLocation}` });

                if (rowID) {
                    if (rowIDListForVerse.includes(rowID))
                        addNoticePartial({ priority: 831, C, V, message: `Duplicate '${rowID}' ID`, fieldName: 'ID', rowID, lineNumber: n + 1, location: ourLocation });
                    rowIDListForVerse.push(rowID);
                } else
                    addNoticePartial({ priority: 932, C, V, message: "Missing row ID", fieldName: 'ID', lineNumber: n + 1, location: ourLocation });


                lastC = C; lastV = V;

            } else // wrong number of fields in the row
                // if (n === lines.length - 1) // it’s the last line
                //     userLog(`  Line ${n}: Has ${fields.length} field(s) instead of ${NUM_EXPECTED_TN_FIELDS}: ${EXPECTED_TN_HEADING_LINE.replace(/\t/g, ', ')}`);
                // else
                if (n !== lines.length - 1) { // it’s not the last line
                    // Have a go at getting some of the first fields out of the line
                    let reference = '?:?', C = '?', V = '?', rowID = '????';
                    try { reference = fields[0]; } catch { }
                    try { rowID = fields[1]; } catch { }
                    try { [C, V] = reference.split(':'); } catch { }
                    addNoticePartial({ priority: 983, message: `Wrong number of tabbed fields (expected ${NUM_EXPECTED_NOTES_TSV_FIELDS})`, excerpt: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, C, V, rowID, lineNumber: n + 1, location: ourLocation });
                }
        }
    }

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // functionLog(`checkNotesTSV7Table: calling removeDisabledNotices(${carResult.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        carResult.noticeList = removeDisabledNotices(carResult.noticeList);
    }

    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 20)
        && checkingOptions?.disableAllLinkFetchingFlag)
        addNoticePartial({ priority: 20, message: "Note that 'disableAllLinkFetchingFlag' was set so link targets were not checked", location: ourLocation });

    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data line${lines.length - 1 === 1 ? '' : 's'}${ourLocation}.`);
    if (carResult.noticeList.length)
        addSuccessMessage(`checkNotesTSV7Table v${NOTES_TABLE_VALIDATOR_VERSION_STRING} finished with ${carResult.noticeList.length ? carResult.noticeList.length.toLocaleString() : "zero"} notice${carResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkNotesTSV7Table v${NOTES_TABLE_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkNotesTSV7Table returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkNotesTSV7Table result is", JSON.stringify(carResult));
    return carResult;
}
// end of checkNotesTSV7Table function
