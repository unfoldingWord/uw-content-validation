import * as books from '../core/books/books';
import { getFile } from '../core/getApi';
// import { consoleLogObject } from '../core/utilities';


const QUOTE_VALIDATOR_VERSION = '0.1.1';

const DEFAULT_EXTRACT_LENGTH = 10;


async function checkOriginalLanguageQuote(fieldName, fieldText, BBB, C, V, givenLocation, optionalCheckingOptions) {
    // Checks that the Hebrew/Greek quote can be found in the original texts

    // Note that the original language verse text can be passed in as optionalCheckingOptions.originalLanguageVerseText.
    // Alternatively, we can fetch it from Door43 -- you can control this with:
    //      optionalCheckingOptions.originalLanguageRepoUsername
    //      optionalCheckingOptions.originalLanguageRepoBranch (or tag)

    // console.log(`checkOriginalLanguageQuote v${QUOTE_VALIDATOR_VERSION} (${fieldName}, (${fieldText.length}) '${fieldText}', ${BBB} ${C}:${V} ${givenLocation}, …)`);
    console.assert(fieldName !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldText !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    console.assert(BBB !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof BBB === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof BBB}'`);
    console.assert(BBB.length === 3, `checkOriginalLanguageQuote: 'BBB' parameter should be three characters long not ${BBB.length}`);
    console.assert(C !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof C === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof C}'`);
    console.assert(V !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof V === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof V}'`);
    console.assert(givenLocation !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    ourLocation = ` in ${fieldName}${ourLocation}`;

    const colqResult = { noticeList: [] };

    function addNotice5(priority, message, index, extract, location) {
        // console.log(`checkOriginalLanguageQuote Notice: (priority=${priority}) ${message}${index > 0 ? " (at character " + index + 1 + ")" : ""}${extract ? " " + extract : ""}${location}`);
        console.assert(priority !== undefined, "cOLQ addNotice5: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "cOLQ addNotice5: 'priority' parameter should be a number not a '" + (typeof priority) + "': " + priority);
        console.assert(message !== undefined, "cOLQ addNotice5: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "cOLQ addNotice5: 'message' parameter should be a string not a '" + (typeof message) + "': " + message);
        console.assert(index !== undefined, "cOLQ addNotice5: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "cOLQ addNotice5: 'index' parameter should be a number not a '" + (typeof index) + "': " + index);
        console.assert(extract !== undefined, "cOLQ addNotice5: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "cOLQ addNotice5: 'extract' parameter should be a string not a '" + (typeof extract) + "': " + extract);
        console.assert(location !== undefined, "cOLQ addNotice5: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "cOLQ addNotice5: 'location' parameter should be a string not a '" + (typeof location) + "': " + location);
        colqResult.noticeList.push([priority, message, index, extract, location]);
    }

    async function getPassage(BBB, C, V, optionalCheckingOptions) {
        // console.log(`getPassage(${BBB}, ${C}, ${V})`);

        const bookNumberAndName = books.usfmNumberName(BBB);
        const whichTestament = books.testament(BBB); // returns 'old' or 'new'
        const originalLanguageRepoLanguageCode = whichTestament === 'old' ? 'hbo' : 'el-x-koine';
        const originalLanguageRepoCode = whichTestament === 'old' ? 'UHB' : 'UGNT';
        const originalLanguageRepoName = `${originalLanguageRepoLanguageCode}_${originalLanguageRepoCode.toLowerCase()}`;
        const filename = `${bookNumberAndName}.usfm`;

        let username;
        try {
            username = optionalCheckingOptions.originalLanguageRepoUsername;
        } catch (qcoError) { }
        if (!username) username = 'unfoldingWord'; // or Door43-Catalog ???
        let branch;
        try {
            branch = optionalCheckingOptions.originalLanguageRepoBranch;
        } catch (qcunError) { }
        if (!branch) branch = 'master';

        let originalUSFM;
        // console.log(`Need to check against ${originalLanguageRepoCode}`);
        if (originalLanguageRepoCode === 'UHB') {
            try {
                originalUSFM = await getFile({ username, repository: originalLanguageRepoName, path: filename, branch });
                // console.log("Fetched file_content for", repoName, filename, typeof originalUSFM, originalUSFM.length);
            } catch (gcUHBerror) {
                console.log("ERROR: Failed to load", username, originalLanguageRepoCode, filename, branch, gcUHBerror.message);
                addNotice5(996, "Failed to load", -1, "", `${generalLocation} ${filename}: ${gcUHBerror}`, repoCode);
            }
        } else if (originalLanguageRepoCode === 'UGNT') {
            try {
                originalUSFM = await getFile({ username, repository: originalLanguageRepoName, path: filename, branch });
                // console.log("Fetched file_content for", repoName, filename, typeof originalUSFM, originalUSFM.length);
            } catch (gcUGNTerror) {
                console.log("ERROR: Failed to load", username, originalLanguageRepoCode, filename, branch, gcUGNTerror.message);
                addNotice5(996, "Failed to load", -1, "", `${generalLocation} ${filename}: ${gcUGNTerror}`, repoCode);
            }
        }

        let foundChapter = false, foundVerse = false;
        let verseText = '';
        for (const bookLine of originalUSFM.split('\n')) {
            // console.log("bookLine", bookLine);
            if (!foundChapter && bookLine === `\\c ${C}`) {
                foundChapter = true;
                continue;
            }
            if (foundChapter && !foundVerse && bookLine.startsWith(`\\v ${V}`)) {
                foundVerse = true;
                bookLine = bookLine.substring(3 + V.length); // Delete verse number so below bit doesn't fail
            }
            if (foundVerse) {
                if (bookLine.startsWith('\\v ') || bookLine.startsWith('\\c '))
                    break; // Don't go into the next verse or chapter
                verseText += (bookLine.startsWith('\\f ') ? '' : ' ') + bookLine;
            }
        }
        verseText = verseText.replace('\\p', '').trim().replace('  ', ' ')
        // console.log(`Got verse text1: '${verseText}'`);

        // Remove \w fields (just leaving the actual Bible text words)
        let ixW = verseText.indexOf('\\w ')
        while (ixW !== -1) {
            const ixEnd = verseText.indexOf('\\w*', ixW)
            if (ixEnd !== -1) {
                const field = verseText.substring(ixW + 3, ixEnd);
                const bits = field.split('|');
                const adjusted_field = bits[0];
                verseText = verseText.substring(0, ixW) + adjusted_field + verseText.substring(ixEnd + 3);
            } else {
                console.log(`Missing \\w* in ${B} ${C}:${V} verseText: '${verseText}'`);
                verseText = verseText.replace('\\w ', '', 1); // Attempt to limp on
            }
            ixW = verseText.indexOf('\\w ', ixW + 1); // Might be another one
        }
        // console.log(`Got verse text2: '${verseText}'`);

        // Remove footnotes
        // verseText = re.sub(r'\\f (.+?)\\f\*', '', verseText)
        // Remove alternative versifications
        // verseText = re.sub(r'\\va (.+?)\\va\*', '', verseText)
        // print(`Got verse text3: '{verseText}'")

        // Final clean-up (shouldn't be necessary, but just in case)
        verseText = verseText.replace('  ', ' ');
        // console.log(`  getPassage(${BBB} ${C}:${V}) is returning '${verseText}'`);
        return verseText;
    }
    // end of getPassage function


    // Main code for checkOriginalLanguageQuote
    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (gcELerror) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    //     console.log("Using supplied extractLength=" + extractLength, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, "halfLengthPlus="+halfLengthPlus);


    // if fieldText.lstrip() !== fieldText:
    //     addNotice5(0, `Unexpected whitespace at start of {TNid} '{fieldText}'")
    // if fieldText.rstrip() !== fieldText:
    //     addNotice5(0, `Unexpected whitespace at end of {TNid} '{fieldText}'")
    // fieldText = fieldText.strip() # so we don't get consequential errors

    let ix;
    if ((ix = fieldText.indexOf('...')) >= 0) {
        // console.log(`Bad ellipse characters in '${fieldText}'`);
        const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
        addNotice5(159, "Should use proper ellipse character (not periods)", ix, extract, ourLocation);
    }

    let quoteBits;
    if (fieldText.indexOf('…') >= 0) {
        quoteBits = fieldText.split('…');
        if ((ix = fieldText.indexOf(' …')) >= 0 || (ix = fieldText.indexOf('… ')) >= 0) {
            // console.log(`Unexpected space(s) beside ellipse in '${fieldText}'`);
            const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice5(158, "Unexpected space(s) beside ellipse character", ix, extract, ourLocation);
        }
    } else if (fieldText.indexOf('...') >= 0) { // Yes, we still actually allow this
        quoteBits = fieldText.split('...');
        if ((ix = fieldText.indexOf(' ...')) >= 0 || (ix = fieldText.indexOf('... ')) >= 0) {
            // console.log(`Unexpected space(s) beside ellipse characters in '${fieldText}'`);
            const extract = (ix > halfLength ? '…' : '') + fieldText.substring(ix - halfLength, ix + halfLengthPlus) + (ix + halfLengthPlus < fieldText.length ? '…' : '')
            addNotice5(158, "Unexpected space(s) beside ellipse characters", ix, extract, ourLocation);
        }
    }
    // console.log(`Got quoteBits=${quoteBits}`);

    // Find the verse text in the original language
    let verseText;
    try {
        verseText = optionalCheckingOptions.originalLanguageVerseText;
    } catch (gcVTerror) { }
    if (!verseText) // not supplied, so then we need to get it ourselves
        verseText = await getPassage(BBB, C, V, optionalCheckingOptions);
    if (!verseText) {
        addNotice5(851, "Unable to load original language verse text", -1, "", ourLocation);
        return colqResult; // nothing else we can do here
    }

    // Now check if the quote can be found in the verse text
    if (quoteBits) {
        const numQuoteBits = quoteBits.length;
        if (numQuoteBits >= 2) {
            for (let index = 0; index < numQuoteBits; index++) {
                if (verseText.indexOf(quoteBits[index]) < 0) { // this is what we really want to catch
                    // If the quote has multiple parts, create a description of the current part
                    let partDescription;
                    if (index === 0) partDescription = 'beginning';
                    else if (index === numQuoteBits - 1) partDescription = 'end';
                    else partDescription = `middle${numQuoteBits > 3 ? index : ''}`;
                    // console.log(`Unable to find '${quoteBits[index]}' (${partDescription}) in '${verseText}'`);
                    addNotice5(721, "Unable to find original language quote in verse text", -1, partDescription, ourLocation);
                }
            }
        } else // < 2
            addNotice5(375, "Ellipsis without surrounding snippet", -1, "", ourLocation);
    } else { // Only a single quote (no ellipsis)
        if (verseText.indexOf(fieldText) >= 0) {
            // Double check that it doesn't start/stop in the middle of a word
            // console.log(`Here with fieldText=${fieldText} and verseText=${verseText}`);
            const remainingBits = verseText.split(fieldText);
            // console.log(`remaingBits=${JSON.stringify(remainingBits)}`);
            console.assert(remainingBits.length === 2, `remaining bits are ${remainingBits.length}`);
            if (remainingBits[0] && remainingBits[0].slice(-1).search(/[^A-Za-z\s]/) !== -1) {
                const badChar = remainingBits[0].slice(-1);
                const badCharString = ` by '{badChar}' {unicodedata.name(badChar)}={hex(ord(badChar))}`;
                // console.log(`Seems '${fieldText}' might not start at the beginning of a word—it's preceded ${badCharString} in '${verseText}'`);
                addNotice5(620, "Seems original language quote might not start at the beginning of a word", -1, "", ourLocation);
            }
            if (remainingBits[1] && remainingBits[1][0].search(/[^A-Za-z\s]/) !== -1) {
                const badChar = remainingBits[1][0];
                const badCharString = ` by '${badChar}' {unicodedata.name(badChar)}={hex(ord(badChar))}`;
                // console.log(`Seems '${fieldText}' might not finish at the end of a word—it's followed ${badCharString} in '${verseText}'`);
                addNotice5(621, "Seems original language quote might not finish at the end of a word", -1, "", ourLocation);
            }
        } else { // can't find the given text
            // console.log(`Unable to find '${fieldText}' in '${verseText}'`);
            const extraText = fieldText.indexOf('\u00A0') >= 0 ? " (contains No-Break Space shown as '⍽')" : "";
            if (extraText) fieldText = fieldText.replace('\u00A0', '⍽');
            addNotice5(721, "Unable to find original language quote in verse text", -1, "", ourLocation);

        }
    }

    // console.log(`checkOriginalLanguageQuote is returning ${JSON.stringify(colqResult)}`);
    return colqResult;
}
// end of checkOriginalLanguageQuote function


export default checkOriginalLanguageQuote;
