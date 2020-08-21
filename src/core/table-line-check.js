import * as books from '../core/books/books';
import doBasicTextChecks from './basic-text-check';
import checkMarkdownText from './markdown-text-check';
import checkTAReference from './ta-reference-check';
import checkTNLinks from './tn-links-check';
import checkOriginalLanguageQuote from './quote-check';


const TABLE_LINE_VALIDATOR_VERSION = '0.3.2';

const NUM_EXPECTED_TSV_FIELDS = 9;
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';

const DEFAULT_EXTRACT_LENGTH = 10;


async function checkTN_TSVDataRow(line, BBB, C, V, givenRowLocation, optionalCheckingOptions) {
    /* This function is only for checking one data row
          and doesn't assume that it has any previous context.

        BBB is a three-character UPPERCASE USFM book code or 'OBS'.
        
        It's designed to be able to quickly show errors for a single row being displayed/edited.

        Returns noticeList
    */
    // console.log(`checkTN_TSVDataRow(${BBB}, ${line}, ${givenRowLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
    console.assert(line !== undefined, "checkTN_TSVDataRow: 'line' parameter should be defined");
    console.assert(typeof line === 'string', `checkTN_TSVDataRow: 'line' parameter should be a string not a '${typeof line}'`);
    console.assert(BBB !== undefined, "checkTN_TSVDataRow: 'BBB' parameter should be defined");
    console.assert(typeof BBB === 'string', `checkTN_TSVDataRow: 'BBB' parameter should be a string not a '${typeof BBB}'`);
    console.assert(BBB.length === 3, `checkTN_TSVDataRow: 'BBB' parameter should be three characters long not ${BBB.length}`);
    console.assert(books.isValidBookCode(BBB), `checkTN_TSVDataRow: '${BBB}' is not a valid USFM book code`);
    console.assert(C !== undefined, "checkTN_TSVDataRow: 'C' parameter should be defined");
    console.assert(typeof C === 'string', `checkTN_TSVDataRow: 'C' parameter should be a string not a '${typeof C}'`);
    console.assert(V !== undefined, "checkTN_TSVDataRow: 'V' parameter should be defined");
    console.assert(typeof V === 'string', `checkTN_TSVDataRow: 'V' parameter should be a string not a '${typeof V}'`);
    console.assert(givenRowLocation !== undefined, "checkTN_TSVDataRow: 'givenRowLocation' parameter should be defined");
    console.assert(typeof givenRowLocation === 'string', `checkTN_TSVDataRow: 'givenRowLocation' parameter should be a string not a '${typeof givenRowLocation}'`);

    let ourRowLocation = givenRowLocation;
    if (ourRowLocation && ourRowLocation[0] !== ' ') ourRowLocation = ` ${ourRowLocation}`;

    let drResult = { noticeList: [] };

    function addNotice5to8(priority, message, index, extract, location) {
        // console.log(`TSV Line Notice: (priority=${priority}) ${message}, ${index}, ${extract}, ${location}`);
        console.assert(priority !== undefined, "cTSVrow addNotice5to8: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cTSVrow addNotice5to8: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "cTSVrow addNotice5to8: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cTSVrow addNotice5to8: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        console.assert(index !== undefined, "cTSVrow addNotice5to8: 'index' parameter should be defined");
        console.assert(typeof index === 'number', `cTSVrow addNotice5to8: 'index' parameter should be a number not a '${typeof index}': ${index}`);
        console.assert(extract !== undefined, "cTSVrow addNotice5to8: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `cTSVrow addNotice5to8: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cTSVrow addNotice5to8: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cTSVrow addNotice5to8: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        // Also uses the given BBB,C,V, parameters from the main function call
        drResult.noticeList.push({priority, BBB, C, V, message, index, extract, location});
    }

    function doOurMarkdownTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions) {
        // Does markdown checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // We don't currently use the allowedLinks parameter

        // console.log(`cTSVrow doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(fieldName !== undefined, "cTSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cTSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cTSVrow doOurMarkdownTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cTSVrow doOurMarkdownTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cTSVrow doOurMarkdownTextChecks: allowedLinks parameter must be either true or false");

        const cmtResultObject = checkMarkdownText(fieldName, fieldText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(cmtResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of cmtResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL doOurMarkdownTextChecks notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.index, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of doOurMarkdownTextChecks function

    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        // console.log(`cTSVrow doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cTSVrow doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cTSVrow doOurBasicTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cTSVrow doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cTSVrow doOurBasicTextChecks: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cTSVrow doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const dbtcResultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(dbtcResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of dbtcResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL doOurBasicTextChecks notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.index, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of doOurBasicTextChecks function

    async function ourCheckTAReference(fieldName, taLinkText, rowLocation, optionalCheckingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // console.log(`cTSVrow ourCheckTAReference(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cTSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cTSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(taLinkText !== undefined, "cTSVrow ourCheckTAReference: 'taLinkText' parameter should be defined");
        console.assert(typeof taLinkText === 'string', `cTSVrow ourCheckTAReference: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

        const coqResultObject = await checkTAReference(fieldName, taLinkText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTAReference notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.index, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of ourCheckTAReference function

    async function ourCheckTNOriginalLanguageQuote(fieldName, fieldText, rowLocation, optionalCheckingOptions) {
        // Checks that the Hebrew/Greek quote can be found in the original texts

        // Uses the BBB,C,V values from the main function call

        // Updates the global list of notices

        // console.log(`cTSVrow ourCheckTNOriginalLanguageQuote(${fieldName}, (${fieldText.length}) '${fieldText}', ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cTSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cTSVrow doOurMarkdownTextChecks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cTSVrow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cTSVrow ourCheckTNOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);

        const coqResultObject = await checkOriginalLanguageQuote(fieldName,fieldText, BBB,C,V, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNOriginalLanguageQuote notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.index, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of ourCheckTNOriginalLanguageQuote function

    async function ourCheckTNLinks(fieldName, taLinkText, rowLocation, optionalCheckingOptions) {
        // Checks that the TA reference can be found

        // Updates the global list of notices

        // console.log(`cTSVrow ourCheckTNLinks(${fieldName}, (${taLinkText.length}) '${taLinkText}', ${rowLocation}, …)`);
        console.assert(fieldName !== undefined, "cTSVrow ourCheckTNLinks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cTSVrow ourCheckTNLinks: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(taLinkText !== undefined, "cTSVrow ourCheckTNLinks: 'taLinkText' parameter should be defined");
        console.assert(typeof taLinkText === 'string', `cTSVrow ourCheckTNLinks: 'taLinkText' parameter should be a string not a '${typeof taLinkText}'`);

        const coqResultObject = await checkTNLinks(BBB, fieldName, taLinkText, rowLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coqResultObject.noticeList);
        // If we need to put everything through addNotice5to8, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of coqResultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length === 5, `TL ourCheckTNLinks notice length=${Object.keys(noticeEntry).length}`);
            addNotice5to8(noticeEntry.priority, noticeEntry.message, noticeEntry.index, noticeEntry.extract, noticeEntry.location);
        }
    }
    // end of ourCheckTNLinks function


    // Main code for checkTN_TSVDataRow function
    if (line === EXPECTED_TN_HEADING_LINE) // Assume it must be ok
        return drResult; // We can't detect if it's in the wrong place

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (tlcELerror) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
        // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const bbb = BBB.toLowerCase();
    let numChaptersThisBook;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    } catch (tlcNCerror) {
        addNotice5to8(979, "Invalid book code passed to checkTN_TSVDataRow", -1, "", ` '${BBB}' in first parameter: ${tlcNCerror}`);
    }
    const haveGoodBookCode = numChaptersThisBook !== undefined;

    // let inString;
    // if (rowLocation) inString = rowLocation;
    // else inString = ` in line ${rowNumber.toLocaleString()}`;

    let fields = line.split('\t');
    if (fields.length === NUM_EXPECTED_TSV_FIELDS) {
        let [B, C, V, fieldID, supportReference, origQuote, occurrence, GLQuote, occurrenceNote] = fields;
        // let withString = ` with '${fieldID}'${inString}`;
        // let CV_withString = ` ${C}:${V}${withString}`;
        // let atString = ` at ${B} ${C}:${V} (${fieldID})${inString}`;

        // Check the fields one-by-one
        if (B.length) {
            if (B !== BBB)
                addNotice5to8(978, `Wrong '${B}' book code`, -1, "", ` (expected '${BBB}')${ourRowLocation}`);
        }
        else
            addNotice5to8(977, "Missing book code", 0, "", ourRowLocation);

        let numVersesThisChapter, haveGoodChapterNumber;
        if (C.length) {
            if (C === 'front') { }
            else if (/^\d+$/.test(C)) {
                let intC = Number(C);
                if (intC === 0) {
                    addNotice5to8(824, `Invalid zero chapter number`, -1, C, ourRowLocation);
                    haveGoodChapterNumber = false;
                }
                // TODO: Does this next section need rewriting (see verse check below)???
                else if (intC > numChaptersThisBook) {
                    addNotice5to8(823, `Invalid large chapter number`, -1, C, ourRowLocation);
                    haveGoodChapterNumber = false;
                }
                try {
                    numVersesThisChapter = books.versesInChapter(bbb, intC);
                    haveGoodChapterNumber = true;
                } catch (tlcNVerror) {
                    if (!haveGoodBookCode)
                        // addNotice5to8(500, "Invalid chapter number", rowLocation);
                        // else
                        addNotice5to8(822, "Unable to check chapter number", -1, "", ` '${C}'${ourRowLocation}`);
                    haveGoodChapterNumber = false;
                }
            }
            else
                addNotice5to8(821, "Bad chapter number", -1, "", ` '${C}' with${ourRowLocation}`);
        }
        else
            addNotice5to8(820, "Missing chapter number", -1, "", ` ?:${V}${ourRowLocation}`);

        if (V.length) {
            if (V === 'intro') { }
            else if (/^\d+$/.test(V)) {
                let intV = Number(V);
                if (intV === 0)
                    addNotice5to8(814, `Invalid zero '${V}' verse number`, -1, "", ourRowLocation);
                else {
                    if (haveGoodChapterNumber) {
                        if (intV > numVersesThisChapter)
                            addNotice5to8(813, `Invalid large '${V}' verse number`, ` for chapter ${C}${ourRowLocation}`);
                    } else
                        addNotice5to8(812, "Unable to check verse number", -1, "", ` '${V}'${ourRowLocation}`);
                }
            }
            else
                addNotice5to8(811, "Bad verse number", -1, "", ` '${V}'${ourRowLocation}`);
        }
        else
            addNotice5to8(810, "Missing verse number", -1, "", ` after ${C}:?${ourRowLocation}`);

        if (!fieldID.length)
            addNotice5to8(779, "Missing ID field", -1, "", ourRowLocation);
        else {
            if (fieldID.length !== 4)
                addNotice5to8(778, "ID should be exactly 4 characters", -1, "", ` (not ${fieldID.length})${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[0]) < 0)
                addNotice5to8(176, "ID should start with a lowercase letter or digit", 0, "", ` (not '${fieldID[0]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[3]) < 0)
                addNotice5to8(175, "ID should end with a lowercase letter or digit", 3, "", ` (not '${fieldID[3]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[1]) < 0)
                addNotice5to8(174, "ID characters should only be lowercase letters, digits, or hypen", 1, "", ` (not '${fieldID[1]}')${ourRowLocation}`)
            else if ('abcdefghijklmnopqrstuvwxyz0123456789'.indexOf(fieldID[2]) < 0)
                addNotice5to8(173, "ID characters should only be lowercase letters, digits, or hypen", 2, "", ` (not '${fieldID[2]}')${ourRowLocation}`)
        }

        if (supportReference.length) { // need to check UTN against UTA
            doOurBasicTextChecks('SupportReference', supportReference, true, ourRowLocation, optionalCheckingOptions);
            await ourCheckTAReference('SupportReference', supportReference, ourRowLocation, optionalCheckingOptions);
        }
        // else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
        //     addNotice5to8(277, "Missing SupportReference field", -1, "", ourRowLocation);

        if (origQuote.length) { // need to check UTN against UHB and UGNT
            doOurBasicTextChecks('OrigQuote', origQuote, false, ourRowLocation, optionalCheckingOptions);
            await ourCheckTNOriginalLanguageQuote('OrigQuote', origQuote, ourRowLocation, optionalCheckingOptions);
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (V !== 'intro')
                addNotice5to8(276, "Missing OrigQuote field", -1, "", ourRowLocation);

        if (occurrence.length) { // This should usually be a digit
            if (occurrence === '0') { // zero means that it doesn't occur
                if (origQuote.length)
                    addNotice5to8(550, "Invalid zero occurrence field when we have an original quote", -1, "", ourRowLocation);
                // if (V !== 'intro')
                //     addNotice5to8(500, "Invalid zero occurrence field", -1, "", rowLocation);
            }
            else if (occurrence === '-1') // TODO check the special conditions when this can occur???
                ;
            else if ('12345'.indexOf(occurrence) < 0) // it's not one of these integers
                addNotice5to8(792, `Invalid '${occurrence}' occurrence field`, -1, "", ourRowLocation);
        }

        if (GLQuote.length) { // TODO: need to check UTN against ULT
            if (V !== 'intro')
                doOurBasicTextChecks('GLQuote', GLQuote, false, ourRowLocation, optionalCheckingOptions);
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            if (V !== 'intro')
                addNotice5to8(275, "Missing GLQuote field", -1, "", ourRowLocation);

        if (occurrenceNote.length) {
            doOurMarkdownTextChecks('OccurrenceNote', occurrenceNote, true, ourRowLocation, optionalCheckingOptions);
            await ourCheckTNLinks('OccurrenceNote', occurrenceNote, ourRowLocation, optionalCheckingOptions);
        }
        else // TODO: Find out if these fields are really compulsory (and when they're not, e.g., for 'intro') ???
            addNotice5to8(274, "Missing OccurrenceNote field", -1, "", ourRowLocation);

    } else
        addNotice5to8(861, `Found wrong number of TSV fields (expected ${NUM_EXPECTED_TSV_FIELDS})`, -1, `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, ourRowLocation);

        // console.log(`  checkTN_TSVDataRow returning with ${drResult.noticeList.length.toLocaleString()} notice(s).`);
        // console.log("checkTN_TSVDataRow result is", JSON.stringify(drResult));
        return drResult; // object with noticeList only
}
// end of checkTN_TSVDataRow function

export default checkTN_TSVDataRow;
