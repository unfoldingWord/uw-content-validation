import * as books from '../core/books/books';
import { getFile } from '../core/getApi';
// import { consoleLogObject } from '../core/utilities';


const QUOTE_VALIDATOR_VERSION = '0.2.1';

const DEFAULT_EXTRACT_LENGTH = 10;


async function checkOriginalLanguageQuote(fieldName, fieldText, bookID, C, V, givenLocation, optionalCheckingOptions) {
    // Checks that the Hebrew/Greek quote can be found in the original texts

    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

    // Note that the original language verse text can be passed in as
    //      optionalCheckingOptions.originalLanguageVerseText.
    // Alternatively, we can fetch it from Door43 -- you can control this with:
    //      optionalCheckingOptions.originalLanguageRepoUsername
    //      (UHB or UGNT will be used for the repo name)
    //      optionalCheckingOptions.originalLanguageRepoBranch (or tag)

    // console.log(`checkOriginalLanguageQuote v${QUOTE_VALIDATOR_VERSION} (${fieldName}, (${fieldText.length}) '${fieldText}', ${bookID} ${C}:${V} ${givenLocation}, …)`);
    console.assert(fieldName !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldText !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    console.assert(bookID !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkOriginalLanguageQuote: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(books.isValidBookID(bookID), `checkOriginalLanguageQuote: '${bookID}' is not a valid USFM book identifier`);
    console.assert(C !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof C === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof C}'`);
    console.assert(V !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof V === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof V}'`);
    console.assert(givenLocation !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (fieldName) ourLocation = ` in ${fieldName}${ourLocation}`;

    const colqResult = { noticeList: [] };

    function addNotice5(priority, message, characterIndex, extract, location) {
        // console.log(`checkOriginalLanguageQuote Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cOLQ addNotice5: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cOLQ addNotice5: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "cOLQ addNotice5: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cOLQ addNotice5: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        console.assert(characterIndex !== undefined, "cOLQ addNotice5: 'characterIndex' parameter should be defined");
        console.assert(typeof characterIndex === 'number', `cOLQ addNotice5: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        console.assert(extract !== undefined, "cOLQ addNotice5: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `cOLQ addNotice5: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cOLQ addNotice5: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cOLQ addNotice5: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        colqResult.noticeList.push({priority, message, characterIndex, extract, location});
    }

    async function getPassage(bookID, C, V, optionalCheckingOptions) {
        // console.log(`getPassage(${bookID}, ${C}, ${V})`);

        const bookNumberAndName = books.usfmNumberName(bookID);
        const whichTestament = books.testament(bookID); // returns 'old' or 'new'
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

        // Do global fixes
        originalUSFM = originalUSFM.replace(/\\k-e\\\*/g, ''); // Remove \k-e self-closed milestones
        originalUSFM = originalUSFM.replace(/\\k-s.+?\\\*/g, ''); // Remove \k-s self-closed milestones


        // Now find the desired C:V
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
        verseText = verseText.replace(/\\p/g, '').trim().replace(/  /g, ' ')
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
                verseText = verseText.replace(/\\w /g, '', 1); // Attempt to limp on
            }
            ixW = verseText.indexOf('\\w ', ixW + 1); // Might be another one
        }
        // console.log(`Got verse text2: '${verseText}'`);

        // Remove footnotes
        verseText = verseText.replace(/\\f (.+?)\\f\*/g, '');
        // Remove alternative versifications
        verseText = verseText.replace(/\\va (.+?)\\va\*/g, '');
        // console.log(`Got verse text3: '${verseText}'`);

        // Final clean-up (shouldn't be necessary, but just in case)
        verseText = verseText.replace(/  /g, ' ');
        console.assert(verseText.indexOf('\\w') === -1, `getPassage: Should be no \\w in ${bookID} ${C}:${V} '${verseText}'`);
        console.assert(verseText.indexOf('\\k') === -1, `getPassage: Should be no \\k in ${bookID} ${C}:${V} '${verseText}'`);
        console.assert(verseText.indexOf('x-') === -1, `getPassage: Should be no x- in ${bookID} ${C}:${V} '${verseText}'`);
        console.assert(verseText.indexOf('\\f') === -1, `getPassage: Should be no \\f in ${bookID} ${C}:${V} '${verseText}'`);
        console.assert(verseText.indexOf('\\x') === -1, `getPassage: Should be no \\x in ${bookID} ${C}:${V} '${verseText}'`);
        // console.log(`  getPassage(${bookID} ${C}:${V}) is returning '${verseText}'`);
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
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
        // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);


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
        verseText = await getPassage(bookID, C, V, optionalCheckingOptions);
    if (!verseText) {
        addNotice5(851, "Unable to load original language verse text", -1, "", ourLocation);
        return colqResult; // nothing else we can do here
    }

    // Now check if the quote can be found in the verse text
    if (quoteBits) {
        const numQuoteBits = quoteBits.length;
        if (numQuoteBits >= 2) {
            for (let bitIndex = 0; bitIndex < numQuoteBits; bitIndex++) {
                if (verseText.indexOf(quoteBits[bitIndex]) < 0) { // this is what we really want to catch
                    // If the quote has multiple parts, create a description of the current part
                    let partDescription;
                    if (numQuoteBits === 1) partDescription = '';
                    else if (bitIndex === 0) partDescription = 'beginning';
                    else if (bitIndex === numQuoteBits - 1) partDescription = 'end';
                    else partDescription = `middle${numQuoteBits > 3 ? bitIndex : ''}`;
                    // console.log(`721 Unable to find '${fieldText}' ${numQuoteBits === 1? '': `'${quoteBits[bitIndex]}' `}${partDescription? '('+partDescription+') ':''}in '${verseText}'`);
                    const extract = `${quoteBits[bitIndex]}' ${partDescription? '('+partDescription+')':''}`;
                    addNotice5(721, "Unable to find original language quote in verse text", -1, extract, ourLocation);
                }
            }
        } else // < 2
            addNotice5(375, "Ellipsis without surrounding snippet", -1, "", ourLocation);
    } else { // Only a single quote (no ellipsis)
        if (verseText.indexOf(fieldText) >= 0) {
            // Double check that it doesn't start/stop in the middle of a word
            // console.log(`Here with fieldText=${fieldText} and verseText=${verseText}`);
            let remainingBits = verseText.split(fieldText);
            // console.log(`remaingBits=${JSON.stringify(remainingBits)}`);
            if (remainingBits.length > 2) // Join the extra bits back up
                remainingBits = [remainingBits[0], remainingBits.slice(1).join('…')];
            console.assert(remainingBits.length === 2, `remaining bits are ${remainingBits.length}`);
            // Note: There's some Hebrew (RTL) characters at the beginning of the following regex
            if (remainingBits[0] && remainingBits[0].slice(-1).search(/[^־A-Za-z\s*\(]/) !== -1) {
                const badChar = remainingBits[0].slice(-1);
                const badCharString = ` by '{badChar}' {unicodedata.name(badChar)}={hex(ord(badChar))}`;
                // console.log(`Seems '${fieldText}' might not start at the beginning of a word—it's preceded ${badCharString} in '${verseText}'`);
                const extract = `(${remainingBits[0].slice(-1)})` + fieldText.substring(0, extractLength-3) + (fieldText.length > extractLength-3 ? '…' : '');
                addNotice5(620, "Seems original language quote might not start at the beginning of a word", 0, extract, ourLocation);
            }
            // Note: There's some Hebrew (RTL) characters at the beginning of the following regex
            if (remainingBits[1] && remainingBits[1][0].search(/[^׃־A-Za-z\s.,:;?!–)]/) !== -1) {
                const badChar = remainingBits[1][0];
                const badCharString = ` by '${badChar}' {unicodedata.name(badChar)}={hex(ord(badChar))}`;
                // console.log(`Seems '${fieldText}' might not finish at the end of a word—it's followed ${badCharString} in '${verseText}'`);
                const extract = (fieldText.length > extractLength-3 ? '…' : '') + fieldText.substring(fieldText.length-extractLength+3, fieldText.length) + `(${remainingBits[1][0]})`;
                addNotice5(621, "Seems original language quote might not finish at the end of a word", fieldText.length, extract, ourLocation);
            }
        } else { // can't find the given text
            // console.log(`Unable to find '${fieldText}' in '${verseText}'`);
            const extraText = fieldText.indexOf('\u00A0') >= 0 ? " (contains No-Break Space shown as '⍽')" : "";
            if (extraText) fieldText = fieldText.replace(/\u00A0/g, '⍽');
            const extract = fieldText.substring(0, halfLength) + (fieldText.length > 2*halfLength? '…':'') + fieldText.substring(fieldText.length-halfLength, fieldText.length);
            // console.log(`722 fieldText='${fieldText}'${extraText}`);
            // console.log(`722 verseText='${verseText}'`);
            addNotice5(722, "Unable to find original language quote in verse text", -1, extract, ourLocation);

        }
    }

    // console.log(`checkOriginalLanguageQuote is returning ${JSON.stringify(colqResult)}`);
    return colqResult;
}
// end of checkOriginalLanguageQuote function


export default checkOriginalLanguageQuote;