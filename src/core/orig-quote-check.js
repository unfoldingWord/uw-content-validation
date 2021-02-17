import * as books from '../core/books/books';
import { DEFAULT_EXCERPT_LENGTH } from './text-handling-functions'
import { cachedGetFile } from '../core/getApi';
import { debugLog, parameterAssert, ourParseInt } from './utilities';


// const QUOTE_VALIDATOR_VERSION_STRING = '0.9.0';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode
 * @param {string} fieldName
 * @param {string} fieldText
 * @param {string} occurrenceString
 * @param {string} bookID
 * @param {string} C
 * @param {string} V
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkOriginalLanguageQuote(languageCode, repoCode, fieldName, fieldText, occurrenceString, bookID, C, V, givenLocation, checkingOptions) {
    // Checks that the Hebrew/Greek quote can be found in the original texts

    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

    // Note that the original language verse text can be passed in as
    //      checkingOptions?.originalLanguageVerseText.
    // Alternatively, we can fetch it from Door43 -- you can control this with:
    //      checkingOptions?.originalLanguageRepoUsername
    //      (UHB or UGNT will be used for the repo name)
    //      checkingOptions?.originalLanguageRepoBranch (or tag)

    // functionLog(`checkOriginalLanguageQuote v${QUOTE_VALIDATOR_VERSION_STRING} ${languageCode}, ${repoCode}, ${fieldName}, (${fieldText.length}) '${fieldText}', ${occurrenceString}, ${bookID} ${C}:${V} ${givenLocation}, …)…`);
    parameterAssert(languageCode !== undefined, "checkOriginalLanguageQuote: 'languageCode' parameter should be defined");
    parameterAssert(typeof languageCode === 'string', `checkOriginalLanguageQuote: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    parameterAssert(repoCode !== undefined, "checkOriginalLanguageQuote: 'repoCode' parameter should be defined");
    parameterAssert(typeof repoCode === 'string', `checkOriginalLanguageQuote: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    parameterAssert(fieldName !== undefined, "checkOriginalLanguageQuote: 'fieldName' parameter should be defined");
    parameterAssert(typeof fieldName === 'string', `checkOriginalLanguageQuote: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
    parameterAssert(fieldText !== undefined, "checkOriginalLanguageQuote: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldText === 'string', `checkOriginalLanguageQuote: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    parameterAssert(fieldText.length >= 1, `checkOriginalLanguageQuote: 'fieldText' parameter should have text not ${fieldText.length} characters`);
    parameterAssert(occurrenceString !== undefined, "checkOriginalLanguageQuote: 'occurrenceString' parameter should be defined");
    parameterAssert(typeof occurrenceString === 'string', `checkOriginalLanguageQuote: 'occurrenceString' parameter should be a string not a '${typeof occurrenceString}'`);
    parameterAssert(bookID !== undefined, "checkOriginalLanguageQuote: 'bookID' parameter should be defined");
    parameterAssert(typeof bookID === 'string', `checkOriginalLanguageQuote: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    parameterAssert(bookID.length === 3, `checkOriginalLanguageQuote: 'bookID' parameter should be three characters long not ${bookID.length}`);
    parameterAssert(bookID.toUpperCase() === bookID, `checkOriginalLanguageQuote: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkOriginalLanguageQuote: '${bookID}' is not a valid USFM book identifier`);
    parameterAssert(C !== undefined, "checkOriginalLanguageQuote: 'C' parameter should be defined");
    parameterAssert(typeof C === 'string', `checkOriginalLanguageQuote: 'C' parameter should be a string not a '${typeof C}'`);
    parameterAssert(V !== undefined, "checkOriginalLanguageQuote: 'V' parameter should be defined");
    parameterAssert(typeof V === 'string', `checkOriginalLanguageQuote: 'V' parameter should be a string not a '${typeof V}'`);
    parameterAssert(givenLocation !== undefined, "checkOriginalLanguageQuote: 'givenLocation' parameter should be defined");
    parameterAssert(typeof givenLocation === 'string', `checkOriginalLanguageQuote: 'givenLocation' parameter should be a string not a '${typeof givenLocation}'`);

    const discontiguousDivider = (repoCode === 'TN') ? '…' : ' & ';
    // debugLog(`Got discontiguousDivider='${discontiguousDivider}' for ${repoCode}`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const colqResult = { noticeList: [] };

    function addNotice(noticeObject) {
        // functionLog(`checkOriginalLanguageQuote Notice: (priority=${noticeObject.priority}) ${noticeObject.message}${characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? ` ${noticeObject.excerpt}` : ""}${noticeObject.location}`);
        parameterAssert(noticeObject.priority !== undefined, "cOLQ addNotice: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `cOLQ addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "cOLQ addNotice: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `cOLQ addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "cOLQ addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cOLQ addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(excerpt !== undefined, "cOLQ addNotice: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) parameterAssert(typeof noticeObject.excerpt === 'string', `cOLQ addNotice: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt} for ${noticeObject.priority}`);
        parameterAssert(noticeObject.location !== undefined, "cOLQ addNotice: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `cOLQ addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        colqResult.noticeList.push(noticeObject);
    }

    /**
     *
     * @param {string} bookID -- USFM book ID or 'OBS'
     * @param {string} C -- chapter or story number
     * @param {string} V -- verse or frame number
     * @param {Object} checkingOptions
     */
    async function getOriginalPassage(bookID, C, V, checkingOptions) {
        // TODO: Cache these ???

        // debugLog(`getOriginalPassage(${bookID}, ${C}, ${V})…`);
        let username;
        try {
            username = checkingOptions?.originalLanguageRepoUsername;
        } catch (qcoError) { }
        if (!username) username = languageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog'; // ??? !!!
        let branch;
        try {
            branch = checkingOptions?.originalLanguageRepoBranch;
        } catch (qcunError) { }
        if (!branch) branch = 'master';
        const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;

        let verseText = '';
        if (bookID === 'OBS') {
            let originalMarkdown;
            const OBSRepoName = `${languageCode}_obs`;
            const adjC = C.length === 2 ? C : '0' + C;
            const adjV = V.length === 2 ? V : '0' + V;
            const OBSPathname = `content/${adjC}.md`;
            try {
                originalMarkdown = await getFile_({ username, repository: OBSRepoName, path: OBSPathname, branch });
                // debugLog("Fetched fileContent for", OBSRepoName, OBSPathname, typeof originalMarkdown, originalMarkdown.length);
            } catch (gcUHBerror) {
                console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UHB`, username, languageCode, OBSPathname, branch, gcUHBerror.message);
                addNotice({ priority: 601, message: "Unable to load", details: `username=${username} error=${gcUHBerror}`, OBSPathname, location: ourLocation, extra: OBSRepoName });
            }
            if (!originalMarkdown) return '';

            let gotIt = V === 'intro'; // normally false, but true for intro (so grabs first line of text = heading line)
            const searchString = `-${adjC}-${adjV}.`;
            // NOTE: Bible references get appended to the last frame text (but I don’t think it does any harm)
            for (const line of originalMarkdown.split('\n')) {
                if (!line) continue;
                if (line.indexOf(searchString) > 0) { gotIt = true; continue; }
                if (gotIt)
                    if (line.indexOf('[OBS Image]') > 0) // This is the next frame
                        break;
                    else
                        verseText += line; // NOTE: works coz all text on one line, otherwise would need to insert spaces here
            }
            // debugLog(`Got OBS ${V}:${C} '${verseText}'`);
        } else { // not OBS, so a USFM Bible book
            const bookNumberAndName = books.usfmNumberName(bookID);
            const whichTestament = books.testament(bookID); // returns 'old' or 'new'
            const originalLanguageRepoLanguageCode = whichTestament === 'old' ? 'hbo' : 'el-x-koine';
            const originalLanguageRepoCode = whichTestament === 'old' ? 'UHB' : 'UGNT';
            const originalLanguageRepoName = `${originalLanguageRepoLanguageCode}_${originalLanguageRepoCode.toLowerCase()}`;
            const filename = `${bookNumberAndName}.usfm`;

            let originalUSFM;
            // debugLog(`Need to check against ${originalLanguageRepoCode}`);
            if (originalLanguageRepoCode === 'UHB') {
                try {
                    originalUSFM = await getFile_({ username, repository: originalLanguageRepoName, path: filename, branch });
                    // debugLog("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
                } catch (gcUHBerror) {
                    console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UHB`, username, originalLanguageRepoCode, filename, branch, gcUHBerror.message);
                    addNotice({ priority: 601, message: "Unable to load", details: `username=${username} error=${gcUHBerror}`, filename, location: ourLocation, extra: originalLanguageRepoName });
                }
            } else if (originalLanguageRepoCode === 'UGNT') {
                try {
                    originalUSFM = await getFile_({ username, repository: originalLanguageRepoName, path: filename, branch });
                    // debugLog("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
                } catch (gcUGNTerror) {
                    console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UGNT`, username, originalLanguageRepoCode, filename, branch, gcUGNTerror.message);
                    addNotice({ priority: 601, message: "Unable to load", details: `username=${username} error=${gcUGNTerror}`, filename, location: ourLocation, extra: originalLanguageRepoName });
                }
            }
            if (!originalUSFM) return '';


            // Do global fixes
            originalUSFM = originalUSFM.replace(/\\k-e\\\*/g, ''); // Remove \k-e self-closed milestones
            originalUSFM = originalUSFM.replace(/\\k-s.+?\\\*/g, ''); // Remove \k-s self-closed milestones


            // Now find the desired C:V
            let foundChapter = false, foundVerse = false;
            for (let bookLine of originalUSFM.split('\n')) {
                // debugLog("bookLine", bookLine);
                if (!foundChapter && bookLine === `\\c ${C}`) {
                    foundChapter = true;
                    continue;
                }
                if (foundChapter && !foundVerse && bookLine.startsWith(`\\v ${V}`)) {
                    foundVerse = true;
                    bookLine = bookLine.substring(3 + V.length); // Delete verse number so below bit doesn’t fail
                }
                if (foundVerse) {
                    if (bookLine.startsWith('\\v ') || bookLine.startsWith('\\c '))
                        break; // Don’t go into the next verse or chapter
                    verseText += (bookLine.startsWith('\\f ') ? '' : ' ') + bookLine;
                }
            }
            verseText = verseText.replace(/\\p/g, '').trim().replace(/ {2}/g, ' ')
            // debugLog(`Got verse text1: '${verseText}'`);

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
                    debugLog(`Missing \\w* in ${bookID} ${C}:${V} verseText: '${verseText}'`);
                    verseText = verseText.replace(/\\w /g, '', 1); // Attempt to limp on
                }
                ixW = verseText.indexOf('\\w ', ixW + 1); // Might be another one
            }
            // debugLog(`Got verse text2: '${verseText}'`);

            // Remove footnotes
            verseText = verseText.replace(/\\f (.+?)\\f\*/g, '');
            // Remove alternative versifications
            verseText = verseText.replace(/\\va (.+?)\\va\*/g, '');
            // debugLog(`Got verse text3: '${verseText}'`);

            // Final clean-up (shouldn’t be necessary, but just in case)
            verseText = verseText.replace(/ {2}/g, ' ');
            parameterAssert(verseText.indexOf('\\w') === -1, `getOriginalPassage: Should be no \\w in ${bookID} ${C}:${V} '${verseText}'`);
            parameterAssert(verseText.indexOf('\\k') === -1, `getOriginalPassage: Should be no \\k in ${bookID} ${C}:${V} '${verseText}'`);
            parameterAssert(verseText.indexOf('x-') === -1, `getOriginalPassage: Should be no x- in ${bookID} ${C}:${V} '${verseText}'`);
            parameterAssert(verseText.indexOf('\\f') === -1, `getOriginalPassage: Should be no \\f in ${bookID} ${C}:${V} '${verseText}'`);
            parameterAssert(verseText.indexOf('\\x') === -1, `getOriginalPassage: Should be no \\x in ${bookID} ${C}:${V} '${verseText}'`);
        }

        // debugLog(`  getOriginalPassage(${bookID} ${C}:${V}) is returning '${verseText}'`);
        return verseText;
    }
    // end of getOriginalPassage function


    // Main code for checkOriginalLanguageQuote
    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (gcELerror) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    let occurrence = 1;
    try { occurrence = ourParseInt(occurrenceString); } catch { } // errors in this field are noted elsewhere

    // if fieldText.lstrip() !== fieldText:
    //     addNotice({priority:0, message:`Unexpected whitespace at start of {TNid} '{fieldText}'")
    // if fieldText.rstrip() !== fieldText:
    //     addNotice({priority:0, message:`Unexpected whitespace at end of {TNid} '{fieldText}'")
    // fieldText = fieldText.strip() # so we don’t get consequential errors

    let characterIndex;
    if (discontiguousDivider === '…' && (characterIndex = fieldText.indexOf('...')) >= 0) {
        // debugLog(`Bad ellipse characters in '${fieldText}'`);
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNotice({ priority: 159, message: "Should use proper ellipse character (not periods)", characterIndex, excerpt, location: ourLocation });
    }

    let quoteBits;
    if (fieldText.indexOf(discontiguousDivider) >= 0) {
        quoteBits = fieldText.split(discontiguousDivider);
        if ((characterIndex = fieldText.indexOf(` ${discontiguousDivider}`)) >= 0 || (characterIndex = fieldText.indexOf(`${discontiguousDivider} `)) >= 0) {
            // debugLog(`Unexpected space(s) beside ellipse in '${fieldText}'`);
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNotice({ priority: 158, message: `Unexpected space(s) beside divider ${discontiguousDivider}`, characterIndex, excerpt, location: ourLocation });
        }
        // } else if (fieldText.indexOf('↔') >= 0) {
        //     quoteBits = fieldText.split('↔');
        //     if ((characterIndex = fieldText.indexOf(' ↔')) >= 0 || (characterIndex = fieldText.indexOf('↔ ')) >= 0) {
        //         // debugLog(`Unexpected space(s) beside ellipse in '${fieldText}'`);
        //         const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        //         addNotice({ priority: 157, message: `Unexpected space(s) beside divider ${discontiguousDivider}`, characterIndex, excerpt, location: ourLocation });
        //     }
    } else if (discontiguousDivider === '…' && fieldText.indexOf('...') >= 0) { // Yes, we still actually allow this
        quoteBits = fieldText.split('...');
        if ((characterIndex = fieldText.indexOf(' ...')) >= 0 || (characterIndex = fieldText.indexOf('... ')) >= 0) {
            // debugLog(`Unexpected space(s) beside ellipse characters in '${fieldText}'`);
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNotice({ priority: 156, message: "Unexpected space(s) beside ellipse characters", characterIndex, excerpt, location: ourLocation });
        }
    }
    // debugLog(`Got quoteBits=${quoteBits}`);

    // Find the verse text in the original language
    let verseText;
    try {
        verseText = checkingOptions?.originalLanguageVerseText;
    } catch (gcVTerror) { }
    if (!verseText) {// not supplied, so then we need to get it ourselves
        if (checkingOptions?.disableAllLinkFetchingFlag)
            return colqResult; // nothing else we can do here
        else {
            verseText = await getOriginalPassage(bookID, C, V, checkingOptions);
            if (!verseText) {
                addNotice({ priority: 851, message: bookID === 'OBS' ? "Unable to load OBS story text" : "Unable to load original language verse text", location: ourLocation });
                return colqResult; // nothing else we can do here
            }
        }
    }

    // Now check if the quote can be found in the verse text
    if (quoteBits) { // it had an ellipsis
        // parameterAssert(occurrence === 1, `Oh -- can get '${fieldText}' with occurrence=${occurrence} in ${bookID} ${C}:${V}`);
        if (occurrence !== 1) {
            addNotice({ priority: 50, message: "Is this quote/occurrence correct???", details: `Occurrence=${occurrence}`, excerpt: fieldText, location: ourLocation });
        }
        const numQuoteBits = quoteBits.length;
        if (numQuoteBits >= 2) {
            let quoteIndex = -1; // These parts have to be in order, i.e., found in the verse one AFTER the other
            for (let bitIndex = 0; bitIndex < numQuoteBits; bitIndex++) {
                // debugLog(`Checking quote part ${bitIndex} '${quoteBits[bitIndex]}' in '${verseText.substring(quoteIndex)}' from '${verseText}'`)
                if ((quoteIndex = verseText.indexOf(quoteBits[bitIndex], quoteIndex + 1)) < 0) { // this is what we really want to catch
                    // If the quote has multiple parts, create a description of the current part
                    let partDescription;
                    if (numQuoteBits === 1) partDescription = '';
                    else if (bitIndex === 0) partDescription = 'beginning';
                    else if (bitIndex === numQuoteBits - 1) partDescription = 'end';
                    else partDescription = `middle${numQuoteBits > 3 ? bitIndex : ''}`;
                    const excerpt = `${partDescription ? '(' + partDescription + ' quote portion)' : ''} '${quoteBits[bitIndex]}'`;
                    if (verseText.indexOf(quoteBits[bitIndex]) >= 0) {
                        console.assert(bitIndex > 0, "This shouldn't happen for bitIndex of zero!");
                        // debugLog(`914, Unable to find '${fieldText}' ${numQuoteBits === 1 ? '' : `'${quoteBits[bitIndex]}' `}${partDescription ? '(' + partDescription + ') ' : ''}in '${verseText}'`);
                        addNotice({ priority: 914, message: "Unable to find original language quote portion in the right place in the verse text", details: `passage ►${verseText}◄`, excerpt, location: ourLocation });
                    } else {
                        // debugLog(`915, Unable to find '${fieldText}' ${numQuoteBits === 1 ? '' : `'${quoteBits[bitIndex]}' `}${partDescription ? '(' + partDescription + ') ' : ''}in '${verseText}'`);
                        addNotice({ priority: 915, message: "Unable to find original language quote portion in verse text", details: `passage ►${verseText}◄`, excerpt, location: ourLocation });
                    }
                }
                // else debugLog(`Found quote ${bitIndex} at ${quoteIndex} (num text chars = ${verseText.length})`);
            }
        } else // < 2
            addNotice({ priority: 375, message: "Divider without surrounding snippet", location: ourLocation });
    } else { // Only a single quote (no discontiguousDivider)
        if (verseText.indexOf(fieldText) >= 0) {
            if (occurrence > 1) {
                // functionLog(`checkOriginalLanguageQuote is checking for ${occurrence} occurrences of ${fieldText}`);
                if (verseText.split(fieldText).length <= occurrence) { // There's not enough of them
                    const excerpt = fieldText.substring(0, excerptHalfLength) + (fieldText.length > 2 * excerptHalfLength ? '…' : '') + fieldText.substring(fieldText.length - excerptHalfLength, fieldText.length);
                    addNotice({ priority: 917, message: "Unable to find duplicate original language quote in verse text", details: `occurrence=${occurrenceString}, passage ►${verseText}◄`, excerpt, location: ourLocation });
                }
            } else { // We only need to check for one occurrence
                // Double check that it doesn’t start/stop in the middle of a word
                // debugLog(`Here with fieldText=${fieldText} and verseText=${verseText}`);
                let remainingBits = verseText.split(fieldText);
                // debugLog(`remaingBits=${JSON.stringify(remainingBits)}`);
                if (remainingBits.length > 2) // Join the extra bits back up
                    remainingBits = [remainingBits[0], remainingBits.slice(1).join(discontiguousDivider)];
                parameterAssert(remainingBits.length === 2, `remaining bits are ${remainingBits.length}`);
                // Note: There's some Hebrew (RTL) characters at the beginning of the following regex
                // Note: Straight quotes are included here (even though unwanted) as other code warns about them
                let offendingChar;
                if (fieldText.slice(0) !== ' ' && remainingBits[0] && (offendingChar = remainingBits[0].slice(-1)).search(/[^־A-Za-z\s*[("'“‘]/) !== -1) {
                    // const offendingChar = remainingBits[0].slice(-1);
                    // const badCharString = ` by '{offendingChar}' {unicodedata.name(offendingChar)}={hex(ord(offendingChar))}`;
                    // debugLog(`Seems '${fieldText}' might not start at the beginning of a word—it’s preceded ${badCharString} in '${verseText}'`);
                    let precederDescription;
                    if (offendingChar === '\u2060') precederDescription = 'WordJoiner';
                    else if (offendingChar === '\u200D') precederDescription = 'ZeroWidth-WordJoiner';
                    else precederDescription = `${offendingChar}=D${offendingChar.charCodeAt()}/H${offendingChar.charCodeAt().toString(16)}`;
                    const excerpt = `(${precederDescription})` + fieldText.substring(0, excerptLength - 3) + (fieldText.length > excerptLength - 3 ? '…' : '');
                    addNotice({ priority: 909, message: "Seems original language quote might not start at the beginning of a word", details: `passage ►${verseText}◄`, characterIndex: 0, excerpt, location: ourLocation });
                }
                // Note: There's some Hebrew (RTL) characters at the beginning of the following regex
                if (fieldText.slice(-1) !== ' ' && remainingBits[1] && remainingBits[1][0].search(/[^׃־A-Za-z\s.,:;?!–)]…/) !== -1) {
                    // No problems if quote is followed by expected terminator-type punctuation
                    // const offendingChar = remainingBits[1][0];
                    // const badCharString = ` by '${offendingChar}' {unicodedata.name(offendingChar)}={hex(ord(offendingChar))}`;
                    // debugLog(`Seems '${fieldText}' might not finish at the end of a word—it’s followed ${badCharString} in '${verseText}'`);
                    const excerpt = (fieldText.length > excerptLength - 3 ? '…' : '') + fieldText.substring(fieldText.length - excerptLength + 3, fieldText.length) + `(${remainingBits[1][0]}=D${remainingBits[1].charCodeAt(0)}/H${remainingBits[1].charCodeAt(0).toString(16)})`;
                    addNotice({ priority: 908, message: "Seems original language quote might not finish at the end of a word", details: `passage ►${verseText}◄`, characterIndex: fieldText.length, excerpt, location: ourLocation });
                }
            }
        } else { // can’t find the given text
            // debugLog(`Unable to find '${fieldText}' in '${verseText}'`);
            const noBreakSpaceText = fieldText.indexOf('\u00A0') >= 0 ? "quote which contains No-Break Space shown as '⍽'" : "";
            if (noBreakSpaceText) fieldText = fieldText.replace(/\u00A0/g, '⍽');
            // debugLog(`722 fieldText='${fieldText}'${extraText}`);
            // debugLog(`722 verseText='${verseText}'`);
            if (fieldText[0] === ' ') {
                const excerpt = fieldText.substring(0, excerptLength) + (fieldText.length > excerptLength ? '…' : '');
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with a space" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
            } else if (fieldText.endsWith(' ')) {
                const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - excerptLength, fieldText.length);
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with a space" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
            } else if (fieldText[0] === '\u2060') { // Word joiner
                const excerpt = fieldText.substring(0, excerptLength) + (fieldText.length > excerptLength ? '…' : '');
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'word joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
            } else if (fieldText.endsWith('\u2060')) { // Word joiner
                const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - excerptLength, fieldText.length);
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'word joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
            } else if (fieldText[0] === '\u200B') { // Zero-width space
                const excerpt = fieldText.substring(0, excerptLength) + (fieldText.length > excerptLength ? '…' : '');
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'zero-width space'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
            } else if (fieldText.endsWith('\u200B')) { // Zero-width space
                const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - excerptLength, fieldText.length);
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'zero-width space'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
            } else if (fieldText[0] === '\u200D') { // Zero-width joiner
                const excerpt = fieldText.substring(0, excerptLength) + (fieldText.length > excerptLength ? '…' : '');
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with 'zero-width joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
            } else if (fieldText.endsWith('\u200D')) { // Zero-width joiner
                const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - excerptLength, fieldText.length);
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with 'zero-width joiner'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: ourLocation });
            } else {
                const excerpt = fieldText.length <= excerptLength ? fieldText : (fieldText.substring(0, excerptHalfLength) + (fieldText.length > 2 * excerptHalfLength ? '…' : '') + fieldText.substring(fieldText.length - excerptHalfLength, fieldText.length));
                addNotice({ priority: 916, message: "Unable to find original language quote in verse text", details: noBreakSpaceText ? noBreakSpaceText : `passage ►${verseText}◄`, excerpt, location: ourLocation });
            }
        }
    }

    // functionLog(`checkOriginalLanguageQuote is returning ${ JSON.stringify(colqResult) }`);
    return colqResult;
}
// end of checkOriginalLanguageQuote function
