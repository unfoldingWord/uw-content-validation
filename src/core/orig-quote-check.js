import * as books from './books/books';
// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults';
// eslint-disable-next-line no-unused-vars
import { CLOSING_PUNCTUATION_CHARACTERS, HEBREW_CANTILLATION_REGEX, PAIRED_PUNCTUATION_OPENERS, PAIRED_PUNCTUATION_CLOSERS } from './text-handling-functions';
import { cachedGetFile } from './getApi';
// eslint-disable-next-line no-unused-vars
import { functionLog, debugLog, parameterAssert, logicAssert, dataAssert, ourParseInt } from './utilities';


// const OL_QUOTE_VALIDATOR_VERSION_STRING = '0.10.7';


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
export async function checkOriginalLanguageQuoteAndOccurrence(languageCode, repoCode, fieldName, fieldText, occurrenceString, bookID, C, V, givenLocation, checkingOptions) {
    // Checks that the Hebrew/Greek quote can be found in the original texts

    // Also checks that the Occurrence is valid

    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

    // Note that the original language verse text can be passed in as
    //      checkingOptions?.originalLanguageVerseText.
    // Alternatively, we can fetch it from Door43 -- you can control this with:
    //      checkingOptions?.originalLanguageRepoUsername
    //      (UHB or UGNT will be used for the repo name)
    //      checkingOptions?.originalLanguageRepoBranch (or tag)

    // functionLog(`checkOriginalLanguageQuoteAndOccurrence v${OL_QUOTE_VALIDATOR_VERSION_STRING} ${languageCode}, ${repoCode}, ${fieldName}, (${fieldText.length}) '${fieldText}', ${occurrenceString}, ${bookID} ${C}:${V} ${givenLocation}, …)…`);
    //parameterAssert(languageCode !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    //parameterAssert(repoCode !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkOriginalLanguageQuoteAndOccurrence: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(fieldName !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be defined");
    //parameterAssert(typeof fieldName === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
    //parameterAssert(fieldText !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldText === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    //parameterAssert(fieldText.length >= 1, `checkOriginalLanguageQuoteAndOccurrence: 'fieldText' parameter should have text not ${fieldText.length} characters`);
    //parameterAssert(occurrenceString !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'occurrenceString' parameter should be defined");
    //parameterAssert(typeof occurrenceString === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'occurrenceString' parameter should be a string not a '${typeof occurrenceString}'`);
    //parameterAssert(bookID !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    //parameterAssert(bookID.length === 3, `checkOriginalLanguageQuoteAndOccurrence: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //parameterAssert(bookID.toUpperCase() === bookID, `checkOriginalLanguageQuoteAndOccurrence: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkOriginalLanguageQuoteAndOccurrence: '${bookID}' is not a valid USFM book identifier`);
    //parameterAssert(C !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'C' parameter should be defined");
    //parameterAssert(typeof C === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'C' parameter should be a string not a '${typeof C}'`);
    //parameterAssert(V !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'V' parameter should be defined");
    //parameterAssert(typeof V === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'V' parameter should be a string not a '${typeof V}'`);
    //parameterAssert(givenLocation !== undefined, "checkOriginalLanguageQuoteAndOccurrence: 'givenLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkOriginalLanguageQuoteAndOccurrence: 'givenLocation' parameter should be a string not a '${typeof givenLocation}'`);

    const discontiguousDivider = (repoCode === 'TN') ? '…' : ' & ';
    const wrongDiscontiguousDivider = (repoCode === 'TN') ? '&' : '…'; // leave out the spaces around ampersand
    // debugLog(`Got discontiguousDivider='${discontiguousDivider}' for ${repoCode}`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let whichTestament = 'both'; // for OBS
    if (bookID !== 'OBS') {
        try {
            whichTestament = books.testament(bookID); // returns 'old' or 'new'
        } catch (bNNerror) {
            if (books.isValidBookID(bookID)) // must be in FRT, BAK, etc.
                whichTestament = 'other';
        }
        logicAssert(whichTestament === 'old' || whichTestament === 'new', `getOriginalPassage() couldn’t find testament for '${bookID}'`);
    }

    const colqResult = { noticeList: [] };

    function addNoticePartial(noticeObject) {
        // functionLog(`checkOriginalLanguageQuoteAndOccurrence Notice: (priority=${noticeObject.priority}) ${noticeObject.message}${characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? ` ${noticeObject.excerpt}` : ""}${noticeObject.location}`);
        //parameterAssert(noticeObject.priority !== undefined, "cOLQ addNotice: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `cOLQ addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "cOLQ addNotice: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `cOLQ addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "cOLQ addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cOLQ addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "cOLQ addNotice: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cOLQ addNotice: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt} for ${noticeObject.priority}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "cOLQ addNotice: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `cOLQ addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        colqResult.noticeList.push({ ...noticeObject, bookID, C, V });
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

        // functionLog(`getOriginalPassage(${bookID}, ${C}:${V})…`);
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
            } catch (gcUHBerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UHB`, username, languageCode, OBSPathname, branch, gcUHBerror.message);
                addNoticePartial({ priority: 601, message: "Unable to load file", details: `username=${username} error=${gcUHBerror}`, OBSPathname, location: ourLocation, extra: OBSRepoName });
            }
            if (!originalMarkdown) return '';

            let gotIt = V === 'intro'; // normally false, but true for intro (so grabs first line of text = heading line)
            const searchString = `-${adjC}-${adjV}.`;
            // NOTE: Bible references get appended to the last frame text (but I don’t think it does any harm)
            for (const line of originalMarkdown.split('\n')) {
                if (!line) continue; // Skip empty line
                if (line.indexOf(searchString) > 0) { gotIt = true; continue; }
                if (gotIt)
                    if (line.indexOf('[OBS Image]') > 0) // This is the next frame
                        break;
                    else if (line[0] === '_') // e.g., _A Bible story from...
                        verseText += ` ${line.replace(/_/, '')}`; // NOTE: remove underlines (markdown format codes)
                    else
                        verseText += line; // NOTE: works coz all text on one line, otherwise would need to insert spaces here
            }
            // debugLog(`getOriginalPassage got OBS ${V}:${C} '${verseText}'`);
        } else { // not OBS, so a USFM Bible book
            const bookNumberAndName = books.usfmNumberName(bookID);
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
                } catch (gcUHBerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                    console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UHB`, username, originalLanguageRepoCode, filename, branch, gcUHBerror.message);
                    addNoticePartial({ priority: 601, message: "Unable to load file", details: `username=${username} error=${gcUHBerror}`, filename, location: ourLocation, extra: originalLanguageRepoName });
                }
            } else if (originalLanguageRepoCode === 'UGNT') {
                try {
                    originalUSFM = await getFile_({ username, repository: originalLanguageRepoName, path: filename, branch });
                    // debugLog("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
                } catch (gcUGNTerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                    console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UGNT`, username, originalLanguageRepoCode, filename, branch, gcUGNTerror.message);
                    addNoticePartial({ priority: 601, message: "Unable to load file", details: `username=${username} error=${gcUGNTerror}`, filename, location: ourLocation, extra: originalLanguageRepoName });
                }
            }
            if (!originalUSFM) {
                debugLog(`Oops: getOriginalPassage(${bookID}, ${C}:${V}, ) didn’t find a file!!!`);
                return '';
            }

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
                    debugLog(`getOriginalPassage: missing \\w* in ${bookID} ${C}:${V} verseText: '${verseText}'`);
                    verseText = verseText.replace(/\\w /g, '', 1); // Attempt to limp on
                }
                ixW = verseText.indexOf('\\w ', ixW + 1); // Might be another one
            }
            // debugLog(`Got verse text2: '${verseText}'`);

            // Remove footnotes
            // NOTE: If there's two footnotes and no closer on the first one, this replace will swallow intervening text
            //  but this isn't the place to worry about bad USFM in the original languages
            //  so the quote match will possibly fail as a consequential error
            verseText = verseText.replace(/\\f (.+?)\\f\*/g, '');
            // Remove alternative versifications
            verseText = verseText.replace(/\\va (.+?)\\va\*/g, '');
            // debugLog(`Got verse text3: '${verseText}'`);

            // Final clean-up (shouldn’t be necessary, but just in case)
            verseText = verseText.replace(/ {2}/g, ' ');
            //parameterAssert(verseText.indexOf('\\w') === -1, `getOriginalPassage: Should be no \\w in ${bookID} ${C}:${V} '${verseText}'`);
            //parameterAssert(verseText.indexOf('\\k') === -1, `getOriginalPassage: Should be no \\k in ${bookID} ${C}:${V} '${verseText}'`);
            //parameterAssert(verseText.indexOf('x-') === -1, `getOriginalPassage: Should be no x- in ${bookID} ${C}:${V} '${verseText}'`);
            //parameterAssert(verseText.indexOf('\\f') === -1, `getOriginalPassage: Should be no \\f in ${bookID} ${C}:${V} '${verseText}'`);
            //parameterAssert(verseText.indexOf('\\x') === -1, `getOriginalPassage: Should be no \\x in ${bookID} ${C}:${V} '${verseText}'`);
        }

        // debugLog(`  getOriginalPassage(${bookID} ${C}:${V}) is returning '${verseText}'`);
        return verseText;
    }
    // end of getOriginalPassage function


    // /**
    //  *
    //  * @param {string} foundQuoteSegment -- an origQuote, or a segment of an origQuote, that exists in the verseText
    //  * @param {string} partDescription -- empty string if first parameter is the entire origQuote else a descriptive word (like "beginning")
    //  * @param {string} occurrenceString -- from the source file
    //  * @param {string} partialVerseText -- relevant section of origL verse text
    //  * @param {string} fullVerseText -- origL verse text
    //  * @param {Object} location
    //  * @description Checks that the segment (although found so we know it’s in the verse) actually starts and ends at word breaks
    //  */
    /* Seems that this is no longer needed since we only match by full words now !!!
    function checkTheFoundQuoteSegmentMore(foundQuoteSegment, partDescription, occurrenceString, partialVerseText, fullVerseText, location) {
        // if (partDescription) functionLog(`checkTheFoundQuoteSegmentMore(${foundQuoteSegment}, ${partDescription}, ${fullVerseText}, ${location}) ${C}:${V}…`);
        //parameterAssert(foundQuoteSegment !== undefined, "checkTheFoundQuoteSegmentMore: 'foundQuoteSegment' parameter should be defined");
        //parameterAssert(typeof foundQuoteSegment === 'string', `checkTheFoundQuoteSegmentMore: 'foundQuoteSegment' parameter should be a string not a '${typeof foundQuoteSegment}'`);
        //parameterAssert(foundQuoteSegment.indexOf(discontiguousDivider) === -1, `checkTheFoundQuoteSegmentMore: 'foundQuoteSegment' parameter should not contain '${discontiguousDivider}' divider: '${foundQuoteSegment}'`);
        //parameterAssert(partDescription !== undefined, "checkTheFoundQuoteSegmentMore: 'partDescription' parameter should be defined");
        //parameterAssert(typeof partDescription === 'string', `checkTheFoundQuoteSegmentMore: 'partDescription' parameter should be a string not a '${typeof partDescription}'`);
        //parameterAssert(occurrenceString !== undefined, "checkTheFoundQuoteSegmentMore: 'occurrenceString' parameter should be defined");
        //parameterAssert(typeof occurrenceString === 'string', `checkTheFoundQuoteSegmentMore: 'occurrenceString' parameter should be a string not a '${typeof occurrenceString}'`);
        //parameterAssert(partialVerseText !== undefined, "checkTheFoundQuoteSegmentMore: 'partialVerseText' parameter should be defined");
        //parameterAssert(typeof partialVerseText === 'string', `checkTheFoundQuoteSegmentMore: 'partialVerseText' parameter should be a string not a '${typeof partialVerseText}'`);
        //parameterAssert(fullVerseText !== undefined, "checkTheFoundQuoteSegmentMore: 'fullVerseText' parameter should be defined");
        //parameterAssert(typeof fullVerseText === 'string', `checkTheFoundQuoteSegmentMore: 'fullVerseText' parameter should be a string not a '${typeof fullVerseText}'`);
        //parameterAssert(fullVerseText.length >= partialVerseText.length, `checkTheFoundQuoteSegmentMore: 'partialVerseText' should not be longer`);
        //parameterAssert(location !== undefined, "checkTheFoundQuoteSegmentMore: 'location' parameter should be defined");
        //parameterAssert(typeof location === 'string', `checkTheFoundQuoteSegmentMore: 'location' parameter should be a string not a '${typeof location}'`);

        let details = `verse text ◗${fullVerseText}◖`;
        if (partDescription.length) details = `${partDescription} part of quote = "${foundQuoteSegment}" -- ${details}`;

        let remainingVerseBits = partialVerseText.split(foundQuoteSegment); // NOTE: can split (badly) on short strings (like δὲ or εἰ) mid-word
        if (remainingVerseBits.length > 2) // Join the extra bits back up
            remainingVerseBits = [remainingVerseBits[0], remainingVerseBits.slice(1).join(discontiguousDivider)];
        logicAssert(remainingVerseBits.length === 2, `checkTheFoundQuoteSegmentMore remaining bits are ${remainingVerseBits.length}`);

        // Note: There’s some Hebrew (RTL) characters at the beginning of the following regex
        // Note: Straight quotes aren’t included here (even though unwanted) as other code warns about them
        // Note: We don’t give errors for leading or trailing spaces here, coz that's done elsewhere
        const precedingChar = remainingVerseBits[0].slice(-1);
        // debugLog(`Previous char before ${C}:${V} '${foundQuoteSegment}' is '${precedingChar}'`);
        // const precedingRegex = new RegExp('[ ־*[("\'“‘]', 'g');
        // NOTE: This algorithm has to handle a single word inside another prior word, e.g., searching for δὲ in οὐδὲν δὲ συνκεκαλυμμένον ἐστὶν
        if (foundQuoteSegment.slice(0) !== ' ' && remainingVerseBits[0]
            && precedingChar && ' ־*[("\'“‘—'.indexOf(precedingChar) === -1 // handle punctuation expected before words
            && (foundQuoteSegment.indexOf(' ') !== -1 || partialVerseText.indexOf(` ${foundQuoteSegment}`) === -1) // it’s multiword, or there’s not another word that fits
        ) {
            let precederDescription;
            if (precedingChar === '\u2060') precederDescription = 'WordJoiner';
            else if (precedingChar === '\u200D') precederDescription = 'ZeroWidth-WordJoiner';
            else precederDescription = `${precedingChar}=D${precedingChar.charCodeAt(0)}/H${precedingChar.charCodeAt(0).toString(16).padStart(4, '0')}`;
            // debugLog(`Seems ${bookID} ${C}:${V} '${foundQuoteSegment}' might not start at the beginning of a word—it’s preceded by '${precederDescription}' in '${partialVerseText}' of '${fullVerseText}'`);
            const excerpt = `(${precederDescription})${foundQuoteSegment.substring(0, excerptLength - 3)}${(foundQuoteSegment.length > excerptLength - 3 ? '…' : '')}${occurrenceString.length && occurrenceString !== '1' ? ` occurrence=${occurrenceString}` : ''}`;
            // We greatly lower the priority if we're less sure that it’s a genuine error
            addNoticePartial({ priority: foundQuoteSegment.indexOf(' ') !== -1 || fullVerseText.search(` ${foundQuoteSegment}`) === -1 ? 909 : 389, message: "Seems original language quote might not start at the beginning of a word", details, characterIndex: 0, excerpt, location });
        }
        const followingChar = remainingVerseBits[1][0];
        // debugLog(`Next char after ${C}:${V} '${foundQuoteSegment}' is '${followingChar}'`);
        // Note: There’s some Hebrew (RTL) characters at the beginning of the following string used in regex
        const allowedWordEndChars = ' ׃־.,:;?!–—)…'; // Ellipsis occurs in UGNT, e.g., Rom 3:15, Rev 2:26, 18:7
        // We make up the RegEx on the fly but we need to escape special chars in foundQuoteSegment
        // debugLog(`checkTheFoundQuoteSegmentMore ${bookID} ${C}:${V} regex will be '${foundQuoteSegment}[${allowedWordEndChars}]'`);
        const escapedFoundQuoteSegment = foundQuoteSegment.replace(/\(/g, '\\(').replace(/\)/g, '\\)'); // Segments may have any one or more of these (not necessarily matched)
        // if (escapedFoundQuoteSegment !== foundQuoteSegment ) debugLog(`checkTheFoundQuoteSegmentMore ${bookID} ${C}:${V} from '${foundQuoteSegment}' regex will be '${escapedFoundQuoteSegment}[${allowedWordEndChars}]'`);
        const followingRegex = new RegExp(`${escapedFoundQuoteSegment}[${allowedWordEndChars}]`, 'g');
        if (foundQuoteSegment.slice(-1) !== ' ' && remainingVerseBits[1]
            && followingChar && allowedWordEndChars.indexOf(followingChar) === -1 // handle punctuation expected after words
            && (foundQuoteSegment.indexOf(' ') !== -1 || partialVerseText.search(followingRegex) === -1) // it’s multiword, or there’s not another word that fits
        ) {
            // No problems if quote is followed by expected terminator-type punctuation
            // const badCharString = `'${followingChar}'=D${followingChar.charCodeAt(0)}/H${followingChar.charCodeAt(0).toString(16).padStart(4, '0')}`;
            // debugLog(`Seems ${bookID} ${C}:${V} '${foundQuoteSegment}' might not finish at the end of a word—it’s followed by ${badCharString} in '${partialVerseText}' of '${fullVerseText}'`);
            const excerpt = `${(foundQuoteSegment.length > excerptLength - 3 ? '…' : '')}${foundQuoteSegment.substring(foundQuoteSegment.length - excerptLength + 3, foundQuoteSegment.length)}(${followingChar}=D${remainingVerseBits[1].charCodeAt(0)}/H${remainingVerseBits[1].charCodeAt(0).toString(16).padStart(4, '0')})${occurrenceString.length && occurrenceString !== '1' ? ` occurrence=${occurrenceString}` : ''}`;
            // We greatly lower the priority if we're less sure that it’s a genuine error
            addNoticePartial({ priority: foundQuoteSegment.indexOf(' ') !== -1 || fullVerseText.search(followingRegex) === -1 ? 908 : 388, message: "Seems original language quote might not finish at the end of a word", details, characterIndex: foundQuoteSegment.length, excerpt, location });
        }
    }
    // end of checkTheFoundQuoteSegmentMore function */


    /**
     *
     * @param {Array} origWordsList
     * @param {Array} searchWordsList
     * @param {number} occurrence
     * @param {number} startAt -- optionally start looking part-way thru origWords
     */
    function getWordsIndex(origWordsList, searchWordsList, givenOccurrenceNumber, startAt = 0) {
        // NOTE: This function is called separately for each part of a multi-part quote
        const debugStrings = [];
        debugStrings.push(`getWordsIndex((${origWordsList.length}) ${JSON.stringify(origWordsList)}, (${searchWordsList.length}) ${JSON.stringify(searchWordsList)}, ${givenOccurrenceNumber}, ${startAt}) for ${bookID} ${C}:${V}…`);
        // if (givenOccurrenceNumber !== 1)
        //     functionLog(`getWordsIndex((${origWordsList.length}) ${JSON.stringify(origWordsList)}, (${searchWordsList.length}) ${JSON.stringify(searchWordsList)}, ${givenOccurrenceNumber}, ${startAt}) for ${bookID} ${C}:${V}…`);
        parameterAssert(origWordsList !== undefined, "getWordsIndex: 'origWords' parameter should be defined");
        parameterAssert(typeof origWordsList === 'object', `getWordsIndex: 'origWords' parameter should be an Array not a '${typeof origWordsList}': ${origWordsList}`);
        parameterAssert(Array.isArray(origWordsList), `getWordsIndex: 'origWords' parameter should be an Array not a '${typeof origWordsList}': ${origWordsList}`);
        parameterAssert(searchWordsList !== undefined, "getWordsIndex: 'searchWords' parameter should be defined");
        parameterAssert(typeof searchWordsList === 'object', `getWordsIndex: 'searchWords' parameter should be an Array not a '${typeof searchWordsList}': ${searchWordsList}`);
        parameterAssert(Array.isArray(searchWordsList), `getWordsIndex: 'searchWords' parameter should be an Array not a '${typeof searchWordsList}': ${searchWordsList}`);
        parameterAssert(givenOccurrenceNumber !== undefined, "getWordsIndex: 'occurrence' parameter should be defined");
        parameterAssert(typeof givenOccurrenceNumber === 'number', `getWordsIndex: 'occurrence' parameter should be a number not a '${typeof givenOccurrenceNumber}': '${givenOccurrenceNumber}'`);
        parameterAssert(givenOccurrenceNumber >= 1 || givenOccurrenceNumber === -1, `getWordsIndex: 'occurrence' parameter should be one or greater or -1, not ${givenOccurrenceNumber}`);
        parameterAssert(startAt !== undefined, "getWordsIndex: 'startAt' parameter should be defined");
        parameterAssert(typeof startAt === 'number', `getWordsIndex: 'startAt' parameter should be a number not a '${typeof startAt}': '${startAt}'`);
        parameterAssert(startAt >= 0 && startAt < origWordsList.length, `getWordsIndex: 'startAt' parameter should be in range 0..${origWordsList.length - 1} inclusive, not ${startAt}`);

        let occurrenceNumber = givenOccurrenceNumber === -1 ? 2 : givenOccurrenceNumber; // Convert -1 to +2, i.e., if -1 is used, we'll expect at least two occurrences
        let tryCount = 0;
        let matchWordCount = 0; // index into searchWords
        let matchStartIndex = -1; // index into origWords
        let searchWord = searchWordsList[0];
        for (const origWord of origWordsList.slice(startAt)) {
            // if (givenOccurrenceNumber > 1 || searchWordsList.length > 3) debugLog(`getWordsIndex(${searchWord}, ${occurrenceNumber}/${givenOccurrenceNumber}) checking '${origWord}' with tryCount=${tryCount} matchWordCount=${matchWordCount} matchStartIndex=${matchStartIndex}`);
            debugStrings.push(`getWordsIndex: checking '${searchWord}' ${occurrenceNumber}/${givenOccurrenceNumber} against '${origWord}' with tryCount=${tryCount} matchWordCount=${matchWordCount} matchStartIndex=${matchStartIndex}`);
            logicAssert(searchWord.indexOf(' ') === -1, `getWordsIndex: searchWords shouldn’t have spaces in them: '${searchWord}'`);
            logicAssert(origWord.indexOf(' ') === -1, `getWordsIndex: origWords shouldn’t have spaces in them: '${origWord}'`);

            // Remove any leading punctuation if we haven't started matching words yet
            let adjustedOrigWord = origWord;
            if (matchWordCount === 0
                && (origWord[0] === '“' || origWord[0] === '‘' || origWord[0] === '(' || origWord[0] === '[')) {
                adjustedOrigWord = origWord.substring(1); // Remove leading punctuation for first potential word match
                // debugLog(`getWordsIndex: Adjusted '${origWord}' to '${adjustedOrigWord}'`);
                debugStrings.push(`getWordsIndex: Adjusted '${origWord}' to '${adjustedOrigWord}'`);
            }

            ++tryCount;
            if (searchWord === adjustedOrigWord || searchWord === origWord) { // We need both because sometimes the search string includes opening and closing quotes
                // || (bookID === 'OBS'
                //     && ((searchWord === origWord.substring(0, origWord.length - 1) && ',.'.indexOf(origWord.slice(-1)) !== -1)
                //         || (searchWord === origWord.substring(0, origWord.length - 2) && [',”', ',’', '.”', '.’', '!”'].indexOf(origWord.slice(-2)) !== -1)
                //     )
                // )
                if (matchWordCount === 0) matchStartIndex = startAt + tryCount - 1;
                if (++matchWordCount === searchWordsList.length) {
                    if (occurrenceNumber === 1) {
                        // debugLog(`  getWordsIndex returning1 ${matchStartIndex}`);
                        return matchStartIndex;
                    } else { // occurrence > 1
                        // debugLog(`  getWordsIndex found a preliminary occurrence of ${bookID} ${C}:${V} '${searchWord}' at ${matchStartIndex}`);
                        debugStrings.push(`  getWordsIndex found a preliminary occurrence of ${bookID} ${C}:${V} '${searchWord}' at ${matchStartIndex}`);
                        --occurrenceNumber; // not the right one yet
                        matchWordCount = 0; matchStartIndex = -1;// Back to square one
                    }
                }
            } else if (matchWordCount === searchWordsList.length - 1 &&
                (adjustedOrigWord.startsWith(searchWord) || origWord.startsWith(searchWord))) { // match last word without punctuation
                const lastWordRemainder = adjustedOrigWord.startsWith(searchWord) ? adjustedOrigWord.slice(searchWord.length) : origWord.slice(searchWord.length);
                // debugLog(`  getWordsIndex got lastWordRemainder=${lastWordRemainder}`);
                let remainderIsAllPunct = true;
                const regex = new RegExp('[,.?!”]?’?”?'); // Matches one, two, or three final punctuation characters
                const specialMatch = regex.test(lastWordRemainder);
                // if (specialMatch) debugLog(`  getWordsIndex checking special match on '${origWord}' lastWordRemainder=${lastWordRemainder} got ${specialMatch}`);
                if (!specialMatch)
                    for (const lastWordRemainderChar of lastWordRemainder) {
                        // debugLog(`  getWordsIndex checking lastWordRemainderChar=${lastWordRemainderChar} from '${origWord}'`);
                        debugStrings.push(`  getWordsIndex checking lastWordRemainderChar=${lastWordRemainderChar} from '${origWord}'`);
                        if (CLOSING_PUNCTUATION_CHARACTERS.indexOf(lastWordRemainderChar) === -1
                            && ('ספ'.indexOf(lastWordRemainderChar) === -1)) {
                            // debugLog(`  getWordsIndex failed at ${bookID} ${C}:${V} on '${origWord}' with lastWordRemainderChar=${lastWordRemainderChar}`);
                            // matchWordCount = 0; matchStartIndex = -1;// Back to square one
                            remainderIsAllPunct = false; break;
                        }
                    }
                if (remainderIsAllPunct && occurrenceNumber === 1) {
                    if (matchWordCount === 0) matchStartIndex = startAt + tryCount - 1;
                    // debugLog(`  getWordsIndex returning2 ${matchStartIndex}`);
                    return matchStartIndex;
                } else if (remainderIsAllPunct) { // occurrence > 1
                    // debugLog(`  getWordsIndex found a preliminary occurrence of ${bookID} ${C}:${V} '${searchWord}' at ${matchStartIndex} (with punctuation)`);
                    debugStrings.push(`  getWordsIndex found a preliminary occurrence of ${bookID} ${C}:${V} '${searchWord}' at ${matchStartIndex} (with punctuation)`);
                    --occurrenceNumber; // not the right one yet
                    matchWordCount = 0; matchStartIndex = -1;// Back to square one
                } else { // not remainderIsAllPunct so we don't have an acceptable match
                    // This happens if there's a word in the text that STARTS WITH the word being searched for
                    // Note that we were on the last search word here (but there might only be one)
                    if (matchWordCount > 0) debugStrings.push(`getWordsIndex for ${bookID} ${C}:${V} could potentially miss a second consecutive '${searchWordsList[0]}' word1 from (${origWordsList.length}) ${JSON.stringify(origWordsList)}, (${searchWordsList.length}) ${JSON.stringify(searchWordsList)}, givenOccurrenceNumber=${givenOccurrenceNumber}/${occurrenceNumber}, startAt=${startAt}`);
                    matchWordCount = 0; matchStartIndex = -1;// Back to square one
                }
            } else {// not a match to a whole word, or to the final word without punctuation
                if (matchWordCount > 0) {
                    logicAssert(searchWordsList.length > 1, `Only expected this to happen with more than one search word: (${searchWordsList.length}) ${searchWordsList}`);
                    debugStrings.push(`getWordsIndex for ${bookID} ${C}:${V} could potentially miss a second consecutive '${searchWordsList[0]}' word2 from (${origWordsList.length}) ${JSON.stringify(origWordsList)}, (${searchWordsList.length}) ${JSON.stringify(searchWordsList)}, givenOccurrenceNumber=${givenOccurrenceNumber}/${occurrenceNumber}, startAt=${startAt}`);
                }
                matchWordCount = 0; matchStartIndex = -1;// Back to square one
            }
            searchWord = searchWordsList[matchWordCount]; // Get the correct word to search for on the next loop
        }
        // Didn’t find it
        // for (const debugString of debugStrings) debugLog(debugString); // Display all the accumulated debug messages
        // debugLog(`getWordsIndex for ${bookID} ${C}:${V} returning -1 for (${origWordsList.length}) ${JSON.stringify(origWordsList)}, (${searchWordsList.length}) ${JSON.stringify(searchWordsList)}, givenOccurrenceNumber=${givenOccurrenceNumber}/${occurrenceNumber}, startAt=${startAt}`);
        return -1;
    }
    // end of getWordsIndex function


    /**
     *
     * @param {string} notFoundQuoteStringSegment -- an origQuote, or a segment of an origQuote, that exists in the verseText
     * @param {string} partDescriptionString -- empty string if first parameter is the entire origQuote else a descriptive word (like "beginning")
     * @param {string} fullVerseTextString -- origL verse text
     * @param {Object} warnLocationString
     * @description Checks the segment that was not found (so it’s not in the verse) for special characters when we create the warning
     */
    function warnForANotFoundQuoteSegment(notFoundQuoteStringSegment, partDescriptionString, occurrenceString, fullVerseTextString, warnLocationString) {
        // functionLog(`warnForNotFoundQuoteSegment('${notFoundQuoteStringSegment}', '${partDescriptionString}', '${occurrenceString}', '${fullVerseTextString}', ${warnLocationString}) ${C}:${V}…`);
        //parameterAssert(notFoundQuoteStringSegment !== undefined, "warnForNotFoundQuoteSegment: 'notFoundQuoteSegment' parameter should be defined");
        //parameterAssert(typeof notFoundQuoteStringSegment === 'string', `warnForNotFoundQuoteSegment: 'notFoundQuoteSegment' parameter should be a string not a '${typeof notFoundQuoteStringSegment}'`);
        //parameterAssert(notFoundQuoteStringSegment.indexOf(discontiguousDivider) === -1, `warnForNotFoundQuoteSegment: 'notFoundQuoteSegment' parameter should not contain '${discontiguousDivider}' divider: '${notFoundQuoteStringSegment}'`);
        //parameterAssert(partDescriptionString !== undefined, "warnForNotFoundQuoteSegment: 'partDescription' parameter should be defined");
        //parameterAssert(typeof partDescriptionString === 'string', `warnForNotFoundQuoteSegment: 'partDescription' parameter should be a string not a '${typeof partDescriptionString}'`);
        //parameterAssert(fullVerseTextString !== undefined, "warnForNotFoundQuoteSegment: 'fullVerseText' parameter should be defined");
        //parameterAssert(typeof fullVerseTextString === 'string', `warnForNotFoundQuoteSegment: 'fullVerseText' parameter should be a string not a '${typeof fullVerseTextString}'`);
        //parameterAssert(warnLocationString !== undefined, "warnForNotFoundQuoteSegment: 'location' parameter should be defined");
        //parameterAssert(typeof warnLocationString === 'string', `warnForNotFoundQuoteSegment: 'location' parameter should be a string not a '${typeof warnLocationString}'`);

        let excerpt = partDescriptionString ? `${partDescriptionString ? '(' + partDescriptionString + ' quote portion)' : ''} '${notFoundQuoteStringSegment}'` : notFoundQuoteStringSegment;
        if (occurrenceString && occurrenceString !== '1') excerpt = `'${excerpt}' (occurrence=${occurrenceString})`;
        if (occurrenceString === '-1') excerpt = `(looking for two or more instances) ${excerpt}`;

        const noBreakSpaceText = notFoundQuoteStringSegment.indexOf('\u00A0') >= 0 ? "quote which contains No-Break Space (u00A0) character shown as '⍽'" : "";
        if (noBreakSpaceText) notFoundQuoteStringSegment = notFoundQuoteStringSegment.replace(/\u00A0/g, '⍽');
        // debugLog(`722 fieldText='${fieldText}'${extraText}`);
        // debugLog(`722 verseText='${verseText}'`);

        let quoteIndex = fullVerseTextString.indexOf(notFoundQuoteStringSegment); // See if the quote string actually exists in the verse!!! (This will automatically fail if the quote contains a discontiguous divider)
        // if (occurrenceString === '1' && quoteIndex !== -1) {
        //     debugLog(`Found quote at ${quoteIndex}: (${notFoundQuoteStringSegment.length}) ${notFoundQuoteStringSegment}`);
        //     if (quoteIndex > 0) debugLog(`  Prev char='${fullVerseTextString.substring(quoteIndex - 1, quoteIndex)}'`);
        //     if (quoteIndex !== -1 && quoteIndex + notFoundQuoteStringSegment.length < fullVerseTextString.length - 1) debugLog(`  Next char='${fullVerseTextString.substring(quoteIndex + notFoundQuoteStringSegment.length, quoteIndex + notFoundQuoteStringSegment.length + 1)}'`);
        // }
        let possibleOffendingChar;
        if (notFoundQuoteStringSegment[0] === ' ') {
            if (!excerpt) excerpt = notFoundQuoteStringSegment.substring(0, excerptLength) + (notFoundQuoteStringSegment.length > excerptLength ? '…' : '');
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with a space" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: warnLocationString });
        } else if (notFoundQuoteStringSegment.endsWith(' ')) {
            if (!excerpt) excerpt = (notFoundQuoteStringSegment.length > excerptLength ? '…' : '') + notFoundQuoteStringSegment.substring(notFoundQuoteStringSegment.length - excerptLength, notFoundQuoteStringSegment.length);
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with a space" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: warnLocationString });
        } else if (notFoundQuoteStringSegment[0] === '\u2060') { // Word joiner
            if (!excerpt) excerpt = notFoundQuoteStringSegment.substring(0, excerptLength) + (notFoundQuoteStringSegment.length > excerptLength ? '…' : '');
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with word joiner (u2060) character'" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: warnLocationString });
        } else if (notFoundQuoteStringSegment.endsWith('\u2060')) { // Word joiner
            if (!excerpt) excerpt = (notFoundQuoteStringSegment.length > excerptLength ? '…' : '') + notFoundQuoteStringSegment.substring(notFoundQuoteStringSegment.length - excerptLength, notFoundQuoteStringSegment.length);
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with word joiner  (u2060) character" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: warnLocationString });
        } else if (notFoundQuoteStringSegment[0] === '\u200B') { // Zero-width space
            if (!excerpt) excerpt = notFoundQuoteStringSegment.substring(0, excerptLength) + (notFoundQuoteStringSegment.length > excerptLength ? '…' : '');
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with zero-width space (u200B) character" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: warnLocationString });
        } else if (notFoundQuoteStringSegment.endsWith('\u200B')) { // Zero-width space
            if (!excerpt) excerpt = (notFoundQuoteStringSegment.length > excerptLength ? '…' : '') + notFoundQuoteStringSegment.substring(notFoundQuoteStringSegment.length - excerptLength, notFoundQuoteStringSegment.length);
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with zero-width space (u200B) character" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: warnLocationString });
        } else if (notFoundQuoteStringSegment[0] === '\u200D') { // Zero-width joiner
            if (!excerpt) excerpt = notFoundQuoteStringSegment.substring(0, excerptLength) + (notFoundQuoteStringSegment.length > excerptLength ? '…' : '');
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which starts with zero-width joiner (u200D) character" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: warnLocationString });
        } else if (notFoundQuoteStringSegment.endsWith('\u200D')) { // Zero-width joiner
            if (!excerpt) excerpt = (notFoundQuoteStringSegment.length > excerptLength ? '…' : '') + notFoundQuoteStringSegment.substring(notFoundQuoteStringSegment.length - excerptLength, notFoundQuoteStringSegment.length);
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: "quote which ends with zero-width joiner (u200D) character" + (noBreakSpaceText ? ' ' + noBreakSpaceText : ''), excerpt, location: warnLocationString });
        } else if (occurrenceString === '1' && quoteIndex > 0 && ' “‘[('.indexOf(possibleOffendingChar = fullVerseTextString.substring(quoteIndex - 1, quoteIndex)) === -1) {
            // The problem with the contiguous quote must presumably be at the beginning of the quote
            addNoticePartial({ priority: 909, message: "Seems original language quote might not start at the beginning of a word", details: `It seems to follow '${possibleOffendingChar}' in verse text ◗${fullVerseTextString}◖`, characterIndex: 0, excerpt, location: warnLocationString });
        } else if (occurrenceString === '1' && quoteIndex !== -1 && quoteIndex + notFoundQuoteStringSegment.length < fullVerseTextString.length - 1 && ' .,?!;:”’])'.indexOf(possibleOffendingChar = fullVerseTextString.substring(quoteIndex + notFoundQuoteStringSegment.length, quoteIndex + notFoundQuoteStringSegment.length + 1)) === -1) {
            // The problem with the contiguous quote must presumably be at the end of the quote
            addNoticePartial({ priority: 908, message: "Seems original language quote might not finish at the end of a word", details: `It seems to precede '${possibleOffendingChar}' in verse text ◗${fullVerseTextString}◖`, characterIndex: 0, excerpt, location: warnLocationString });
        } else {
            if (!excerpt) excerpt = notFoundQuoteStringSegment.length <= excerptLength ? notFoundQuoteStringSegment : (notFoundQuoteStringSegment.substring(0, excerptHalfLength) + (notFoundQuoteStringSegment.length > 2 * excerptHalfLength ? '…' : '') + notFoundQuoteStringSegment.substring(notFoundQuoteStringSegment.length - excerptHalfLength, notFoundQuoteStringSegment.length));
            addNoticePartial({ priority: 916, message: "Unable to find original language quote in verse text", details: noBreakSpaceText ? noBreakSpaceText : `verse text ◗${fullVerseTextString}◖`, excerpt, location: warnLocationString });
        }
    }
    // end of warnForNotFoundQuoteSegment function


    // Main code for checkOriginalLanguageQuoteAndOccurrence
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
    try { occurrence = ourParseInt(occurrenceString); }
    catch { dataAssert(false, `NOTE: We got occurrence=${occurrence} from ${C}:${V} '${occurrenceString}'`); } // errors in this field are noted elsewhere

    /* Cantillation marks in OrigL quotes seem normal
    const match = HEBREW_CANTILLATION_REGEX.exec(fieldText);
    if (match) { // it’s null if no matches
        debugLog(`checkOriginalLanguageQuoteAndOccurrence: got cantillation match: ${typeof match} ${match.length} '${JSON.stringify(match)}'`);
        addNoticePartial({ priority: 904, message: "Unexpected Hebrew cantillation mark in original language field", details: `found ${match.length} '${match}'`, C, V, excerpt: fieldText, location: ourLocation });
    }
    */

    // if fieldText.lstrip() !== fieldText:
    //     addNotice({priority:0, message:`Unexpected whitespace at start of ${TNid} '${fieldText}'")
    // if fieldText.rstrip() !== fieldText:
    //     addNotice({priority:0, message:`Unexpected whitespace at end of ${TNid} '${fieldText}'")
    // fieldText = fieldText.strip() # so we don’t get consequential errors

    let characterIndex;
    if ((characterIndex = fieldText.indexOf(wrongDiscontiguousDivider)) !== -1) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 918, message: `Seems like the wrong divider for discontiguous quote segments`, details: `expected ◗${discontiguousDivider}◖`, characterIndex, excerpt, location: ourLocation });
    }

    if (discontiguousDivider === '…' && (characterIndex = fieldText.indexOf('...')) >= 0) {
        // debugLog(`Bad ellipse characters in '${fieldText}'`);
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 159, message: "Should use proper ellipse character (not periods)", characterIndex, excerpt, location: ourLocation });
    }

    // NOTE: The following code only looks for matching paired punctuation at the very beginning or end of the quote, i.e., it won't complain about a single ( or ] in the middle of a quote
    let opener_index, expected_closing_char;
    if (fieldText.length > 1 && (opener_index = PAIRED_PUNCTUATION_OPENERS.indexOf(fieldText[0])) !== -1
        && fieldText.indexOf(expected_closing_char = PAIRED_PUNCTUATION_CLOSERS[opener_index]) === -1) {
        const excerpt = fieldText.length <= excerptLength ? fieldText : `${fieldText.substring(0, excerptHalfLength)}…${fieldText.substring(fieldText.length - excerptHalfLength)}`;
        addNoticePartial({ priority: 859, message: `Unexpected unclosed paired punctuation at beginning of quote`, details: `Found '${fieldText[0]}' at start, but no matching '${expected_closing_char}'`, characterIndex: 0, excerpt, location: ourLocation });
    }
    let closer_index, expected_opening_char
    if (fieldText.length > 1 && (closer_index = PAIRED_PUNCTUATION_CLOSERS.indexOf(fieldText.slice(-1))) !== -1
        && ((whichTestament !== 'new' && whichTestament !== 'both') || fieldText.slice(-1) !== '’') // Allow final apostrophe for UGNT and OBS
        && fieldText.indexOf(expected_opening_char = PAIRED_PUNCTUATION_OPENERS[closer_index]) === -1) {
        const excerpt = fieldText.length <= excerptLength ? fieldText : `${fieldText.substring(0, excerptHalfLength)}…${fieldText.substring(fieldText.length - excerptHalfLength)}`;
        addNoticePartial({ priority: 858, message: `Unexpected unopened paired punctuation at end of quote`, details: `Found '${fieldText.slice(-1)}' at end, but no matching '${expected_opening_char}'`, characterIndex: fieldText.length - 1, excerpt, location: ourLocation });
    }

    const noDashFieldText = fieldText.replace(/[—־]/g, ' '); // em-dash and then maqaf
    let quoteBits;
    if (fieldText.indexOf(discontiguousDivider) >= 0) {
        quoteBits = noDashFieldText.split(discontiguousDivider);
        if ((characterIndex = fieldText.indexOf(` ${discontiguousDivider}`)) >= 0 || (characterIndex = fieldText.indexOf(`${discontiguousDivider} `)) >= 0) {
            // debugLog(`Unexpected space(s) beside ellipse in '${fieldText}'`);
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 158, message: `Unexpected space(s) beside divider ${discontiguousDivider}`, characterIndex, excerpt, location: ourLocation });
        }
        // } else if (fieldText.indexOf('↔') >= 0) {
        //     quoteBits = fieldText.split('↔');
        //     if ((characterIndex = fieldText.indexOf(' ↔')) >= 0 || (characterIndex = fieldText.indexOf('↔ ')) >= 0) {
        //         // debugLog(`Unexpected space(s) beside ellipse in '${fieldText}'`);
        //         const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        //         addNotice({ priority: 157, message: `Unexpected space(s) beside divider ${discontiguousDivider}`, characterIndex, excerpt, location: ourLocation });
        //     }
    } else if (discontiguousDivider === '…' && fieldText.indexOf('...') >= 0) { // Yes, we still actually allow this
        quoteBits = noDashFieldText.split('...');
        if ((characterIndex = fieldText.indexOf(' ...')) >= 0 || (characterIndex = fieldText.indexOf('... ')) >= 0) {
            // debugLog(`Unexpected space(s) beside ellipse characters in '${fieldText}'`);
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 156, message: "Unexpected space(s) beside ellipse characters", characterIndex, excerpt, location: ourLocation });
        }
    }
    // debugLog(`Got quoteBits=${quoteBits}`);

    // Find the verse text in the original language (HEB, GRK, or ENG for OBS)
    let verseText, noDashVerseText;
    try {
        verseText = checkingOptions?.originalLanguageVerseText;
    } catch (gcVTerror) { }
    if (!verseText) {// not supplied, so then we need to get it ourselves
        if (checkingOptions?.disableAllLinkFetchingFlag)
            return colqResult; // nothing else we can do here
        else {
            verseText = await getOriginalPassage(bookID, C, V, checkingOptions);
            if (!verseText) {
                addNoticePartial({ priority: 851, message: bookID === 'OBS' ? "Unable to load OBS story text" : "Unable to load original language verse text", location: ourLocation });
                return colqResult; // nothing else we can do here
            }
            noDashVerseText = verseText.replace(/[—־]/g, ' '); // em-dash and then maqaf
        }
    }

    /* Deficient code coz it’s only checking STRING matches, not WORD matches
    // Now check if the quote can be found in the verse text
    if (quoteBits) { // it had an ellipsis
        // //parameterAssert(occurrence === 1, `Oh -- can get '${fieldText}' with occurrence=${occurrence} in ${bookID} ${C}:${V}`);
        if (occurrence !== 1) {
            addNotice({ priority: 50, message: "Is this quote/occurrence correct???", details: `occurrence=${occurrence}`, excerpt: fieldText, location: ourLocation });
        }
        // TODO: Are we checking the correct occurrence below ???
        const numQuoteBits = quoteBits.length;
        if (numQuoteBits >= 2) {
            let quoteIndex = -1; // These parts have to be in order, i.e., found in the verse one AFTER the other
            for (let bitIndex = 0; bitIndex < numQuoteBits; bitIndex++) {
                // debugLog(`warnForNotFoundQuoteSegment: checking quote part ${bitIndex} '${quoteBits[bitIndex]}' from '${fieldText}' against '${verseText.substring(quoteIndex)}' from '${verseText}'`)
                let partDescription;
                if (numQuoteBits === 1) partDescription = '';
                else if (bitIndex === 0) partDescription = 'beginning';
                else if (bitIndex === numQuoteBits - 1) partDescription = 'end';
                else partDescription = `middle${numQuoteBits > 3 ? bitIndex : ''}`;
                if ((quoteIndex = verseText.indexOf(quoteBits[bitIndex], quoteIndex + 1)) < 0) { // this is what we really want to catch
                    // If the quote has multiple parts, create a description of the current part
                    const excerpt = `${partDescription ? '(' + partDescription + ' quote portion)' : ''} '${quoteBits[bitIndex]}'`;
                    if (verseText.indexOf(quoteBits[bitIndex]) >= 0) {
                        logicAssert(bitIndex > 0, "This shouldn’t happen for bitIndex of zero!");
                        // debugLog(`914, Unable to find '${fieldText}' ${numQuoteBits === 1 ? '' : `'${quoteBits[bitIndex]}' `}${partDescription ? '(' + partDescription + ') ' : ''}in '${verseText}'`);
                        addNotice({ priority: 914, message: "Unable to find original language quote portion in the right place in the verse text", details: `verse text ◗${verseText}◖`, excerpt, location: ourLocation });
                    } else {
                        // debugLog(`915, Unable to find '${fieldText}' ${numQuoteBits === 1 ? '' : `'${quoteBits[bitIndex]}' `}${partDescription ? '(' + partDescription + ') ' : ''}in '${verseText}'`);
                        warnForNotFoundQuoteSegment(fieldText, partDescription, occurrenceString, verseText, ourLocation);
                        // addNotice({ priority: 915, message: "Unable to find original language quote portion in verse text", details: `verse text ◗${verseText}◖`, excerpt, location: ourLocation });
                    }
                } else { // We found this bit
                    // debugLog(`Found ${C}:${V} origQuote portion ${bitIndex} '${quoteBits[bitIndex]}' at ${quoteIndex} (num text chars = ${verseText.length})`);
                    const verseTextBits = verseText.split(quoteBits[bitIndex]); // NOTE: can split (badly) on short strings (like δὲ or εἰ) mid-word
                    checkTheFoundQuoteSegmentMore(quoteBits[bitIndex], partDescription, occurrenceString, `${verseTextBits[occurrence - 1]}${quoteBits[bitIndex]}${verseTextBits[occurrence]}`, verseText, ourLocation);
                }
            }
        } else // < 2
            addNotice({ priority: 815, message: "Divider without surrounding snippet", location: ourLocation });
    } else { // Only a single quote (no discontiguousDivider)
        if (verseText.indexOf(fieldText) >= 0) {
            if (occurrence > 1) {
                // functionLog(`checkOriginalLanguageQuoteAndOccurrence is checking for ${occurrence} occurrences of ${fieldText}`);
                const verseTextBits = verseText.split(fieldText); // NOTE: can split (badly) on short strings (like δὲ or εἰ) mid-word
                const actualNumOccurrences = verseTextBits.length - 1;
                if (occurrence > actualNumOccurrences) { // There’s not enough of them
                    const actualOccurrencesText = actualNumOccurrences === 0 ? 'no' : `only ${actualNumOccurrences}`;
                    const excerpt = fieldText.substring(0, excerptHalfLength) + (fieldText.length > 2 * excerptHalfLength ? '…' : '') + fieldText.substring(fieldText.length - excerptHalfLength, fieldText.length);
                    addNotice({ priority: 917, message: "Unable to find duplicate original language quote in verse text", details: `occurrence=${occurrenceString} but ${actualOccurrencesText} occurrence${actualNumOccurrences === 1 ? '' : 's'} found, passage ◗${verseText}◖`, excerpt, location: ourLocation });
                } else {
                    checkTheFoundQuoteSegmentMore(fieldText, '', occurrenceString, `${verseTextBits[occurrence - 1]}${fieldText}${verseTextBits[occurrence]}`, verseText, ourLocation);
                }
            } else { // We only need to check for one occurrence
                // TODO: The error in the next line has been notified elsewhere, but should we try to handle it more intelligently here ???
                logicAssert(occurrence === 1 || occurrence === -1, `Expected ${C}:${V} occurrence to be 1 or -1 not ${occurrence} from '${occurrenceString}' for ${C}:${V} '${fieldText}'`);
                // Double check that it doesn’t start/stop in the middle of a word
                // debugLog(`Here with fieldText=${fieldText} and verseText=${verseText}`);
                // debugLog(`remainingBits=${JSON.stringify(remainingBits)}`);
                checkTheFoundQuoteSegmentMore(fieldText, '', occurrenceString, verseText, verseText, ourLocation);
            }
        } else { // can’t find the given text
            // debugLog(`916, Unable to find '${fieldText}' in '${verseText}'`);
            warnForNotFoundQuoteSegment(fieldText, '', occurrenceString, verseText, ourLocation);
        }
    } */

    // Continuing checkOriginalLanguageQuoteAndOccurrence() code...
    // Now check if the quote can be found in the verse text
    const verseWordsList = noDashVerseText.split(' ');
    // debugLog(`checkOriginalLanguageQuoteAndOccurrence got ${bookID} ${C}:${V} verseWords (${verseWords.length}) = ${verseWords}`);
    if (quoteBits) { // it had multiple discontiguous parts
        // //parameterAssert(occurrence === 1, `Oh -- can get '${fieldText}' with occurrence=${occurrence} in ${bookID} ${C}:${V}`);
        // if (occurrence !== 1) {
        //     addNoticePartial({ priority: 50, message: "Is this quote/occurrence correct???", details: `occurrence=${occurrence} verse text ◗${verseText}◖`, excerpt: fieldText, location: ourLocation });
        // }
        const numQuoteBits = quoteBits.length;
        if (numQuoteBits >= 2) {
            let quoteIndex = -1; // These parts have to be in order, i.e., found in the verse one AFTER the other
            for (let bitIndex = 0; bitIndex < numQuoteBits; bitIndex++) {
                // debugLog(`warnForNotFoundQuoteSegment: checking quote part ${bitIndex} '${quoteBits[bitIndex]}' from '${fieldText}' against '${verseText.substring(quoteIndex)}' from '${verseText}'`)
                let partDescription;
                if (numQuoteBits === 1) partDescription = '';
                else if (bitIndex === 0) partDescription = 'beginning';
                else if (bitIndex === numQuoteBits - 1) partDescription = 'end';
                else partDescription = `middle${numQuoteBits > 3 ? bitIndex : ''}`;
                if ((quoteIndex = getWordsIndex(verseWordsList, quoteBits[bitIndex].split(' '), bitIndex === 0 ? occurrence : 1, quoteIndex + 1)) < 0) { // this is what we really want to catch
                    // If the quote has multiple parts, create a description of the current part
                    const excerpt = `${partDescription ? '(' + partDescription + ' quote portion)' : ''} '${quoteBits[bitIndex]}'`;
                    if (verseWordsList.includes(quoteBits[bitIndex])) {
                        logicAssert(bitIndex > 0, "This shouldn’t happen for bitIndex of zero!");
                        // debugLog(`914, Unable to find '${fieldText}' ${numQuoteBits === 1 ? '' : `'${quoteBits[bitIndex]}' `}${partDescription ? '(' + partDescription + ') ' : ''}in '${verseText}'`);
                        addNoticePartial({ priority: 914, message: "Unable to find original language quote portion in the right place in the verse text", details: `verse text ◗${verseText}◖`, excerpt, location: ourLocation });
                    } else {
                        // debugLog(`915, Unable to find '${fieldText}' occurrence=${occurrenceString} ${numQuoteBits === 1 ? '' : `'${quoteBits[bitIndex]}' `}${partDescription ? '(' + partDescription + ') ' : ''}in '${verseText}'`);
                        warnForANotFoundQuoteSegment(fieldText, partDescription, occurrenceString, verseText, ourLocation);
                        // addNotice({ priority: 915, message: "Unable to find original language quote portion in verse text", details: `verse text ◗${verseText}◖`, excerpt, location: ourLocation });
                    }
                } else { // We found this bit
                    // debugLog(`Found ${C}:${V} origQuote portion ${bitIndex} '${quoteBits[bitIndex]}' at ${quoteIndex} (num text chars = ${verseText.length})`);
                    // const verseTextBits = verseText.split(quoteBits[bitIndex]); // NOTE: can split (badly) on short strings (like δὲ or εἰ) mid-word
                    // checkTheFoundQuoteSegmentMore(quoteBits[bitIndex], partDescription, occurrenceString, `${verseTextBits[occurrence - 1]}${quoteBits[bitIndex]}${verseTextBits[occurrence]}`, verseText, ourLocation);
                }
            }
        } else // < 2
            addNoticePartial({ priority: 815, message: "Divider without surrounding snippet", location: ourLocation });
    } else { // Only a single quote (no discontiguousDivider)
        if (repoCode === 'OBS-TN2' && (fieldText === "General Information" || fieldText === "Connecting Statement"))
            ; // Just ignore these fixed strings
        else if (getWordsIndex(verseWordsList, noDashFieldText.split(' '), occurrence) >= 0) {
            if (occurrence > 1) {
                // functionLog(`checkOriginalLanguageQuoteAndOccurrence is checking for ${occurrence} occurrences of ${fieldText}`);
                const verseTextBits = verseText.split(fieldText); // NOTE: can split (badly) on short strings (like δὲ or εἰ) mid-word
                const actualNumOccurrences = verseTextBits.length - 1;
                if (occurrence > actualNumOccurrences) { // There’s not enough of them
                    const actualOccurrencesText = actualNumOccurrences === 0 ? 'no' : `only ${actualNumOccurrences}`;
                    const excerpt = fieldText.substring(0, excerptHalfLength) + (fieldText.length > 2 * excerptHalfLength ? '…' : '') + fieldText.substring(fieldText.length - excerptHalfLength, fieldText.length);
                    addNoticePartial({ priority: 917, message: "Unable to find duplicate original language quote in verse text", details: `occurrence=${occurrenceString} but ${actualOccurrencesText} occurrence${actualNumOccurrences === 1 ? '' : 's'} found, passage ◗${verseText}◖`, excerpt, location: ourLocation });
                } else {
                    // checkTheFoundQuoteSegmentMore(fieldText, '', occurrenceString, `${verseTextBits[occurrence - 1]}${fieldText}${verseTextBits[occurrence]}`, verseText, ourLocation);
                }
            } else { // We only need to check for one occurrence
                // TODO: The error in the next line has been notified elsewhere, but should we try to handle it more intelligently here ???
                logicAssert(occurrence === 1 || occurrence === -1, `Expected ${C}:${V} occurrence to be 1 or -1 not ${occurrence} from '${occurrenceString}' for ${C}:${V} '${fieldText}'`);
                // Double check that it doesn’t start/stop in the middle of a word
                // debugLog(`Here with fieldText=${fieldText} and verseText=${verseText}`);
                // debugLog(`remainingBits=${JSON.stringify(remainingBits)}`);
                // checkTheFoundQuoteSegmentMore(fieldText, '', occurrenceString, verseText, verseText, ourLocation);
            }
        } else { // can’t find the given text
            // debugLog(`916, Unable to find '${fieldText}' occurrence=${occurrenceString} in '${verseText}'`);
            warnForANotFoundQuoteSegment(fieldText, '', occurrenceString, verseText, ourLocation);
        }
    }

    // functionLog(`checkOriginalLanguageQuoteAndOccurrence is returning ${ JSON.stringify(colqResult) }`);
    return colqResult;
}
// end of checkOriginalLanguageQuoteAndOccurrence function
