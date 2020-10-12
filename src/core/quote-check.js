import * as books from '../core/books/books';
import { cachedGetFile } from '../core/getApi';
// import { consoleLogObject } from '../core/utilities';


// const QUOTE_VALIDATOR_VERSION_STRING = '0.4.2';

const DEFAULT_EXTRACT_LENGTH = 10;


export async function checkOriginalLanguageQuote(fieldName, fieldText, bookID, C, V, givenLocation, optionalCheckingOptions) {
    // Checks that the Hebrew/Greek quote can be found in the original texts

    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

    // Note that the original language verse text can be passed in as
    //      optionalCheckingOptions.originalLanguageVerseText.
    // Alternatively, we can fetch it from Door43 -- you can control this with:
    //      optionalCheckingOptions.originalLanguageRepoUsername
    //      (UHB or UGNT will be used for the repo name)
    //      optionalCheckingOptions.originalLanguageRepoBranch (or tag)

    // console.log(`checkOriginalLanguageQuote v${QUOTE_VALIDATOR_VERSION_STRING} (${fieldName}, (${fieldText.length}) '${fieldText}', ${bookID} ${C}:${V} ${givenLocation}, …)`);
    console.assert(fieldName !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldName}'`);
    console.assert(fieldText !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    console.assert(bookID !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkOriginalLanguageQuote: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(bookID.toUpperCase() === bookID, `checkOriginalLanguageQuote: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    console.assert(books.isValidBookID(bookID), `checkOriginalLanguageQuote: '${bookID}' is not a valid USFM book identifier`);
    console.assert(C !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof C === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof C}'`);
    console.assert(V !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof V === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof V}'`);
    console.assert(givenLocation !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof givenLocation}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const colqResult = { noticeList: [] };

    function addNotice(noticeObject) {
        // console.log(`checkOriginalLanguageQuote Notice: (priority=${noticeObject.priority}) ${noticeObject.message}${characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? ` ${noticeObject.extract}` : ""}${noticeObject.location}`);
        console.assert(noticeObject.priority !== undefined, "cOLQ addNotice: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cOLQ addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cOLQ addNotice: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cOLQ addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(characterIndex !== undefined, "cOLQ addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cOLQ addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "cOLQ addNotice: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cOLQ addNotice: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cOLQ addNotice: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cOLQ addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        colqResult.noticeList.push(noticeObject);
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
        if (!username) username = 'Door43-Catalog'; // or unfoldingWord ???
        let branch;
        try {
            branch = optionalCheckingOptions.originalLanguageRepoBranch;
        } catch (qcunError) { }
        if (!branch) branch = 'master';

        let originalUSFM;
        // console.log(`Need to check against ${originalLanguageRepoCode}`);
        const getFile_ = (optionalCheckingOptions && optionalCheckingOptions.getFile) ? optionalCheckingOptions.getFile : cachedGetFile;
        if (originalLanguageRepoCode === 'UHB') {
            try {
                originalUSFM = await getFile_({ username, repository: originalLanguageRepoName, path: filename, branch });
                // console.log("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
            } catch (gcUHBerror) {
                console.error(`getPassage(${bookID}, ${C}:${V}, ${JSON.stringify(optionalCheckingOptions)}) failed to load UHB`, username, originalLanguageRepoCode, filename, branch, gcUHBerror.message);
                addNotice({ priority: 601, message: "Failed to load", filename, location: `${ourLocation}: ${gcUHBerror}`, extra: originalLanguageRepoName });
            }
        } else if (originalLanguageRepoCode === 'UGNT') {
            try {
                originalUSFM = await getFile_({ username, repository: originalLanguageRepoName, path: filename, branch });
                // console.log("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
            } catch (gcUGNTerror) {
                console.error(`getPassage(${bookID}, ${C}:${V}, ${JSON.stringify(optionalCheckingOptions)}) failed to load UGNT`, username, originalLanguageRepoCode, filename, branch, gcUGNTerror.message);
                addNotice({ priority: 601, message: "Failed to load", filename, location: `${ourLocation}: ${gcUGNTerror}`, extra: originalLanguageRepoName });
            }
        }
        if (!originalUSFM) return '';


        // Do global fixes
        originalUSFM = originalUSFM.replace(/\\k-e\\\*/g, ''); // Remove \k-e self-closed milestones
        originalUSFM = originalUSFM.replace(/\\k-s.+?\\\*/g, ''); // Remove \k-s self-closed milestones


        // Now find the desired C:V
        let foundChapter = false, foundVerse = false;
        let verseText = '';
        for (let bookLine of originalUSFM.split('\n')) {
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
        verseText = verseText.replace(/\\p/g, '').trim().replace(/ {2}/g, ' ')
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
                console.log(`Missing \\w* in ${bookID} ${C}:${V} verseText: '${verseText}'`);
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
        verseText = verseText.replace(/ {2}/g, ' ');
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
    //     addNotice({priority:0, message:`Unexpected whitespace at start of {TNid} '{fieldText}'")
    // if fieldText.rstrip() !== fieldText:
    //     addNotice({priority:0, message:`Unexpected whitespace at end of {TNid} '{fieldText}'")
    // fieldText = fieldText.strip() # so we don't get consequential errors

    let characterIndex;
    if ((characterIndex = fieldText.indexOf('...')) >= 0) {
        // console.log(`Bad ellipse characters in '${fieldText}'`);
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '');
        addNotice({ priority: 159, message: "Should use proper ellipse character (not periods)", characterIndex, extract, location: ourLocation });
    }

    let quoteBits;
    if (fieldText.indexOf('…') >= 0) {
        quoteBits = fieldText.split('…');
        if ((characterIndex = fieldText.indexOf(' …')) >= 0 || (characterIndex = fieldText.indexOf('… ')) >= 0) {
            // console.log(`Unexpected space(s) beside ellipse in '${fieldText}'`);
            const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '');
            addNotice({ priority: 158, message: "Unexpected space(s) beside ellipse character", characterIndex, extract, location: ourLocation });
        }
    } else if (fieldText.indexOf('...') >= 0) { // Yes, we still actually allow this
        quoteBits = fieldText.split('...');
        if ((characterIndex = fieldText.indexOf(' ...')) >= 0 || (characterIndex = fieldText.indexOf('... ')) >= 0) {
            // console.log(`Unexpected space(s) beside ellipse characters in '${fieldText}'`);
            const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '');
            addNotice({ priority: 158, message: "Unexpected space(s) beside ellipse characters", characterIndex, extract, location: ourLocation });
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
        addNotice({ priority: 851, message: "Unable to load original language verse text", location: ourLocation });
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
                    const extract = `${quoteBits[bitIndex]}' ${partDescription ? '(' + partDescription + ')' : ''}`;
                    addNotice({ priority: 721, message: "Unable to find original language quote in verse text", extract, location: ourLocation });
                }
            }
        } else // < 2
            addNotice({ priority: 375, message: "Ellipsis without surrounding snippet", location: ourLocation });
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
            if (remainingBits[0] && remainingBits[0].slice(-1).search(/[^־A-Za-z\s*[(]/) !== -1) {
                // const badChar = remainingBits[0].slice(-1);
                // const badCharString = ` by '{badChar}' {unicodedata.name(badChar)}={hex(ord(badChar))}`;
                // console.log(`Seems '${fieldText}' might not start at the beginning of a word—it's preceded ${badCharString} in '${verseText}'`);
                const extract = `(${remainingBits[0].slice(-1)}=D${remainingBits[0].slice(-1).charCodeAt()}/H${remainingBits[0].slice(-1).charCodeAt().toString(16)})` + fieldText.substring(0, extractLength - 3) + (fieldText.length > extractLength - 3 ? '…' : '');
                addNotice({ priority: 620, message: "Seems original language quote might not start at the beginning of a word", characterIndex: 0, extract, location: ourLocation });
            }
            // Note: There's some Hebrew (RTL) characters at the beginning of the following regex
            if (remainingBits[1] && remainingBits[1][0].search(/[^׃־A-Za-z\s.,:;?!–)]/) !== -1) {
                // const badChar = remainingBits[1][0];
                // const badCharString = ` by '${badChar}' {unicodedata.name(badChar)}={hex(ord(badChar))}`;
                // console.log(`Seems '${fieldText}' might not finish at the end of a word—it's followed ${badCharString} in '${verseText}'`);
                const extract = (fieldText.length > extractLength - 3 ? '…' : '') + fieldText.substring(fieldText.length - extractLength + 3, fieldText.length) + `(${remainingBits[1][0]}=D${remainingBits[1].charCodeAt(0)}/H${remainingBits[1].charCodeAt(0).toString(16)})`;
                addNotice({ priority: 621, message: "Seems original language quote might not finish at the end of a word", characterIndex: fieldText.length, extract, location: ourLocation });
            }
        } else { // can't find the given text
            // console.log(`Unable to find '${fieldText}' in '${verseText}'`);
            const noBreakSpaceText = fieldText.indexOf('\u00A0') >= 0 ? "quote which contains No-Break Space shown as '⍽'" : "";
            if (noBreakSpaceText) fieldText = fieldText.replace(/\u00A0/g, '⍽');
            // console.log(`722 fieldText='${fieldText}'${extraText}`);
            // console.log(`722 verseText='${verseText}'`);
            if (fieldText[0] === '\u2060') { // Word joiner
                const extract = fieldText.substring(0, extractLength) + fieldText.length > extractLength ? '…' : '';
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'word joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), extract, location: ourLocation });
            } else if (fieldText.endsWith('\u2060')) { // Word joiner
                const extract = fieldText.length > extractLength ? '…' : '' + fieldText.substring(fieldText.length - extractLength, fieldText.length);
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'word joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), extract, location: ourLocation });
            } else if (fieldText[0] === '\u200B') { // Zero-width space
                const extract = fieldText.substring(0, extractLength) + fieldText.length > extractLength ? '…' : '';
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'zero-width space'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), extract, location: ourLocation });
            } else if (fieldText.endsWith('\u200B')) { // Zero-width space
                const extract = fieldText.length > extractLength ? '…' : '' + fieldText.substring(fieldText.length - extractLength, fieldText.length);
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'zero-width space'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), extract, location: ourLocation });
            } else if (fieldText[0] === '\u200D') { // Zero-width joiner
                const extract = fieldText.substring(0, extractLength) + fieldText.length > extractLength ? '…' : '';
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'zero-width joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), extract, location: ourLocation });
            } else if (fieldText.endsWith('\u200D')) { // Zero-width joiner
                const extract = fieldText.length > extractLength ? '…' : '' + fieldText.substring(fieldText.length - extractLength, fieldText.length);
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'zero-width joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), extract, location: ourLocation });
            } else {
                const extract = fieldText.substring(0, halfLength) + (fieldText.length > 2 * halfLength ? '…' : '') + fieldText.substring(fieldText.length - halfLength, fieldText.length);
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: noBreakSpaceText, extract, location: ourLocation });
            }
        }
    }

    // console.log(`checkOriginalLanguageQuote is returning ${JSON.stringify(colqResult)}`);
    return colqResult;
}
// end of checkOriginalLanguageQuote function
