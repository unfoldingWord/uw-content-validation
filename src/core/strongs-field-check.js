// eslint-disable-next-line no-unused-vars
import { isValidBookID, testament } from './books/books'
// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults';
import { cachedGetFile } from './getApi';
import { alreadyChecked, markAsChecked, isFilepathInRepoTree } from './getApi';
import { checkLexiconFileContents } from './lexicon-file-contents-check';
// eslint-disable-next-line no-unused-vars
import { functionLog, debugLog, parameterAssert, logicAssert, dataAssert, ourParseInt, aboutToOverwrite } from './utilities';


// const STRONGS_FIELD_VALIDATOR_VERSION_STRING = '0.4.1';


/**
 *
 * @param {string} username
 * @param {string} languageCode
 * @param {string} repoCode
 * @param {string} fieldName
 * @param {string} fieldText
 * @param {string} bookID (if known / optional)
 * @param {string} C (if known / optional)
 * @param {string} V (if known / optional)
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkStrongsField(username, languageCode, repoCode, fieldName, fieldText, bookID, C, V, givenLocation, checkingOptions) {
    // Checks that the Strongs (number) field is a valid lexicon ID

    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

    // XXX Note that the original language verse text can be passed in as
    //      checkingOptions?.originalLanguageVerseText.
    // Alternatively, we can fetch it from Door43 -- you can control this with:
    //      checkingOptions?.originalLanguageRepoUsername
    //      (UHB or UGNT will be used for the repo name)
    //      checkingOptions?.originalLanguageRepoBranch (or tag)

    // functionLog(`checkStrongsField v${STRONGS_FIELD_VALIDATOR_VERSION_STRING} ${languageCode}, ${repoCode}, ${fieldName}, (${fieldText.length}) '${fieldText}', ${bookID} ${C}:${V} ${givenLocation}, …)…`);
    //parameterAssert(languageCode !== undefined, "checkStrongsField: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkStrongsField: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    //parameterAssert(repoCode !== undefined, "checkStrongsField: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkStrongsField: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkStrongsField: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(fieldName !== undefined, "checkStrongsField: 'fieldName' parameter should be defined");
    //parameterAssert(typeof fieldName === 'string', `checkStrongsField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
    //parameterAssert(fieldText !== undefined, "checkStrongsField: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldText === 'string', `checkStrongsField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
    //parameterAssert(fieldText.length >= 1, `checkStrongsField: 'fieldText' parameter should have text not ${fieldText.length} characters`);
    //parameterAssert(bookID !== undefined, "checkStrongsField: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkStrongsField: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    // parameterAssert(bookID.length === 3, `checkStrongsField: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //parameterAssert(bookID.toUpperCase() === bookID, `checkStrongsField: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //parameterAssert(bookID === '' || bookID === 'OBS' || isValidBookID(bookID), `checkStrongsField: '${bookID}' is not a valid USFM book identifier`);
    //parameterAssert(C !== undefined, "checkStrongsField: 'C' parameter should be defined");
    //parameterAssert(typeof C === 'string', `checkStrongsField: 'C' parameter should be a string not a '${typeof C}'`);
    //parameterAssert(V !== undefined, "checkStrongsField: 'V' parameter should be defined");
    //parameterAssert(typeof V === 'string', `checkStrongsField: 'V' parameter should be a string not a '${typeof V}'`);
    //parameterAssert(givenLocation !== undefined, "checkStrongsField: 'givenLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkStrongsField: 'givenLocation' parameter should be a string not a '${typeof givenLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "checkStrongsField: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined) {
        //parameterAssert(typeof checkingOptions === 'object', `checkLexiconFileContents: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let ourLocation = givenLocation;
    if (ourLocation?.length && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const csfResult = { noticeList: [], checkedFileCount: 0, checkedFilenames: [], checkedRepoNames: [], checkedFilenameExtensions: [] };


    function addNoticePartial(incompleteNoticeObject) {
        // functionLog(`checkStrongsField Notice: (priority=${noticeObject.priority}) ${noticeObject.message}${characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? ` ${noticeObject.excerpt}` : ""}${noticeObject.location}`);
        //parameterAssert(incompleteNoticeObject.priority !== undefined, "checkStrongsField addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `checkStrongsField addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}': ${incompleteNoticeObject.priority}`);
        //parameterAssert(incompleteNoticeObject.message !== undefined, "checkStrongsField addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.message === 'string', `checkStrongsField addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}': ${incompleteNoticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "checkStrongsField addNoticePartial: 'characterIndex' parameter should be defined");
        if (incompleteNoticeObject.characterIndex) {
            //parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `checkStrongsField addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}': ${incompleteNoticeObject.characterIndex}`);
        }
        // parameterAssert(excerpt !== undefined, "checkStrongsField addNoticePartial: 'excerpt' parameter should be defined");
        if (incompleteNoticeObject.excerpt) {
            //parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `checkStrongsField addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}': ${incompleteNoticeObject.excerpt} for ${incompleteNoticeObject.priority}`);
        }
        //parameterAssert(incompleteNoticeObject.location !== undefined, "checkStrongsField addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.location === 'string', `checkStrongsField addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}': ${incompleteNoticeObject.location}`);
        aboutToOverwrite('checkStrongsField', ['fieldName', 'repoCode'], incompleteNoticeObject, { fieldName, repoCode });
        const newObject = { ...incompleteNoticeObject, fieldName, repoCode };
        if (newObject.excerpt === undefined) newObject.excerpt = fieldText;
        if (bookID.length) newObject.bookID = bookID;
        if (C.length && V.length) { newObject.C = C; newObject.V = V; }
        csfResult.noticeList.push(newObject);
    }


    async function ourCheckLexiconFileContents(username, languageCode, lexiconRepoCode, repoName, repoBranch, lexiconFilename, lexiconMarkdownText, givenLocation, checkingOptions) {
        /* This function is optimised for checking the entire markdown file, i.e., all lines.

         Returns a result object containing a successList and a noticeList
         */
        // functionLog(`ourCheckLexiconFileContents(lC=${languageCode}, rC=${repoCode}, fn=${lexiconFilename}, ${lexiconMarkdownText.length}, ${givenLocation})…`);
        //parameterAssert(languageCode !== undefined, "checkStrongsField ourCheckLexiconFileContents: 'languageCode' parameter should be defined");
        //parameterAssert(typeof languageCode === 'string', `checkStrongsField ourCheckLexiconFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
        //parameterAssert(lexiconRepoCode === 'UHAL' || lexiconRepoCode === 'UGL', `checkStrongsField ourCheckLexiconFileContents: 'repoCode' parameter should be 'UHAL' or 'UGL', not '${lexiconRepoCode}'`);
        //parameterAssert(lexiconFilename !== undefined, "checkStrongsField ourCheckLexiconFileContents: 'lexiconFilename' parameter should be defined");
        //parameterAssert(typeof lexiconFilename === 'string', `checkStrongsField ourCheckLexiconFileContents: 'lexiconFilename' parameter should be a string not a '${typeof lexiconFilename}': ${lexiconFilename}`);
        //parameterAssert(lexiconMarkdownText !== undefined, "checkStrongsField ourCheckLexiconFileContents: 'lexiconMarkdownText' parameter should be defined");
        //parameterAssert(typeof lexiconMarkdownText === 'string', `checkStrongsField ourCheckLexiconFileContents: 'lexiconMarkdownText' parameter should be a string not a '${typeof lexiconMarkdownText}': ${lexiconMarkdownText}`);
        //parameterAssert(givenLocation !== undefined, "checkStrongsField ourCheckLexiconFileContents: 'givenLocation' parameter should be defined");
        //parameterAssert(typeof givenLocation === 'string', `checkStrongsField ourCheckLexiconFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
        //parameterAssert(givenLocation.indexOf('true') === -1, `checkStrongsField ourCheckLexiconFileContents: 'givenLocation' parameter should not be '${givenLocation}'`);
        //parameterAssert(checkingOptions !== undefined, "checkStrongsField ourCheckLexiconFileContents: 'checkingOptions' parameter should be defined");
        if (checkingOptions !== undefined) {
            //parameterAssert(typeof checkingOptions === 'object', `checkStrongsField ourCheckLexiconFileContents: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
        }

        let adjustedLanguageCode = languageCode; // This is the language code of the resource with the link
        if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won’t be needed for TWs when we switch to TWLs)
        const clfcResultObject = await checkLexiconFileContents(username, languageCode, lexiconRepoCode, lexiconFilename, lexiconMarkdownText, givenLocation, { ...checkingOptions, defaultLanguageCode: adjustedLanguageCode });
        // debugLog(`clfcResultObject=${JSON.stringify(clfcResultObject)}`);

        // Process results line by line
        for (const clfcNoticeEntry of clfcResultObject.noticeList) {
            // debugLog(`checkStrongsField ourCheckLexiconFileContents is processing ${JSON.stringify(clfcNoticeEntry)}`);
            const newObject = { ...clfcNoticeEntry, username, repoName, branch: repoBranch, fieldName, repoCode: lexiconRepoCode, bookID, C, V, extra: lexiconRepoCode === 'UHAL' ? 'HALx' : 'GkLx' };
            if (newObject.excerpt) {
                if (!newObject.fieldName) newObject.fieldName = `${fieldName} ${fieldText}`;
            } //else newObject.excerpt = fieldText;
            // debugLog(`ourCheckLexiconFileContents newObject=${JSON.stringify(newObject)}`);
            csfResult.noticeList.push(newObject);
            // addNoticePartial({...clfcNoticeEntry, repoCode: lexiconRepoCode}); // Don’t use this coz repoCode will get overwritten
        }
        // The following is needed coz we might be checking the linked UHAL and/or UGL articles
        if (clfcResultObject.checkedFileCount && clfcResultObject.checkedFileCount > 0)
            if (typeof csfResult.checkedFileCount === 'number') csfResult.checkedFileCount += clfcResultObject.checkedFileCount;
            else csfResult.checkedFileCount = clfcResultObject.checkedFileCount;
        if (clfcResultObject.checkedFilesizes && clfcResultObject.checkedFilesizes > 0)
            if (typeof csfResult.checkedFilesizes === 'number') csfResult.checkedFilesizes += clfcResultObject.checkedFilesizes;
            else csfResult.checkedFilesizes = clfcResultObject.checkedFilesizes;
        if (clfcResultObject.checkedRepoNames && clfcResultObject.checkedRepoNames.length > 0)
            for (const checkedRepoName of clfcResultObject.checkedRepoNames)
                try { if (csfResult.checkedRepoNames.indexOf(checkedRepoName) < 0) csfResult.checkedRepoNames.push(checkedRepoName); }
                catch { csfResult.checkedRepoNames = [checkedRepoName]; }
        if (clfcResultObject.checkedFilenameExtensions && clfcResultObject.checkedFilenameExtensions.length > 0)
            for (const checkedFilenameExtension of clfcResultObject.checkedFilenameExtensions)
                try { if (csfResult.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) csfResult.checkedFilenameExtensions.push(checkedFilenameExtension); }
                catch { csfResult.checkedFilenameExtensions = [checkedFilenameExtension]; }
        // debugLog(`ourCheckLexiconFileContents csfResult: ${JSON.stringify(csfResult)}`);
    }
    // end of ourCheckLexiconFileContents


    // Main code for checkStrongsField
    /*
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
    */

    // if fieldText.lstrip() !== fieldText:
    //     addNoticePartial({priority:0, message:`Unexpected whitespace at start of ${TNid} '${fieldText}'")
    // if fieldText.rstrip() !== fieldText:
    //     addNoticePartial({priority:0, message:`Unexpected whitespace at end of ${TNid} '${fieldText}'")
    // fieldText = fieldText.strip() # so we don’t get consequential errors

    let whichTestament;
    if (bookID.length) whichTestament = testament(bookID); // returns 'old' or 'new'
    else whichTestament = fieldText[0] === 'G' ? 'new' : 'old';
    let adjustedFieldText = fieldText;

    let haveError = false;
    if (!fieldText.length) {
        addNoticePartial({ priority: 842, message: "No text in Strongs field", location: ourLocation });
        haveError = true;
    } else {
        if (whichTestament === 'old') {
            while (adjustedFieldText.startsWith('b:') || adjustedFieldText.startsWith('c:') || adjustedFieldText.startsWith('d:') || adjustedFieldText.startsWith('i:') || adjustedFieldText.startsWith('k:') || adjustedFieldText.startsWith('l:') || adjustedFieldText.startsWith('m:') || adjustedFieldText.startsWith('s:'))
                adjustedFieldText = adjustedFieldText.slice(2); // Delete the prefix bit
            while (adjustedFieldText.length > 1 && 'abcdef'.indexOf(adjustedFieldText.slice(-1)) !== -1)
                adjustedFieldText = adjustedFieldText.slice(0, adjustedFieldText.length - 1); // Delete the suffix bit
            if (adjustedFieldText[0] !== 'H') {
                if (adjustedFieldText !== 'b' && adjustedFieldText !== 'i' && adjustedFieldText !== 'k' && adjustedFieldText !== 'k' && adjustedFieldText !== 'l' && adjustedFieldText !== 'm')
                    // Suppress the message in those cases, but still pretend it’s an error so don’t try to fetch lexicon article below
                    addNoticePartial({ priority: 841, message: "Strongs field must start with 'H'", location: ourLocation });
                haveError = true; // May not be an actual error -- see comment just above
            }
            else if (adjustedFieldText[0] === 'H' && adjustedFieldText.length !== 5) {
                addNoticePartial({ priority: 818, message: "Strongs field has wrong number of digits", details: `expected five digits`, location: ourLocation });
                haveError = true;
            }
        } else if (whichTestament === 'new') {
            if (fieldText[0] !== 'G') {
                addNoticePartial({ priority: 841, message: "Strongs field must start with 'G'", location: ourLocation });
                haveError = true;
            } else if (fieldText.length !== 6) {
                addNoticePartial({ priority: 818, message: "Strongs field has wrong number of digits", details: `expected six digits`, location: ourLocation });
                haveError = true;
            }
        } else debugLog(`checkStrongsField doesn’t have a testament for '${bookID}'!`);
    }
    if (!haveError) {
        if (checkingOptions?.disableAllLinkFetchingFlag !== true && checkingOptions?.disableLexiconLinkFetchingFlag !== true) {
            // debugLog(`checkStrongsField wants to fetch lexicon entry for ${fieldText}`);
            let adjustedLanguageCode = languageCode;
            if (languageCode === 'hbo' || languageCode === 'el-x-koine') // lexicons are in GLs
                adjustedLanguageCode = 'en'
            // let username;
            // try {
            //     username = checkingOptions?.originalLanguageRepoUsername;
            // } catch (qcoError) { }
            // if (!username) username = adjustedLanguageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog'; // ??? !!!
            let repoBranch;
            try {
                repoBranch = checkingOptions?.originalLanguageRepoBranch;
            } catch (qcunError) { }
            if (!repoBranch) repoBranch = 'master';
            let lexiconRepoCode, repoName, lexiconFilename, lexiconPathname;
            if (adjustedFieldText[0] === 'H') {
                lexiconRepoCode = 'UHAL';
                repoName = `${adjustedLanguageCode}_uhal`;
                lexiconFilename = `${adjustedFieldText}.md`;
                lexiconPathname = `content/${lexiconFilename}`;
            } else if (fieldText[0] === 'G') {
                lexiconRepoCode = 'UGL';
                repoName = `${adjustedLanguageCode}_ugl`;
                lexiconFilename = '01.md';
                lexiconPathname = `content/${fieldText}/${lexiconFilename}`;
            }
            const fetchLexiconFileParameters = { username, repository: repoName, path: lexiconPathname, branch: repoBranch };
            if (!await alreadyChecked(fetchLexiconFileParameters)) {
                const fetchLinkDescription = `${username} ${repoName} ${repoBranch} ${lexiconPathname}`;
                if (checkingOptions?.disableLinkedLexiconEntriesCheckFlag === true) {
                    // New code
                    // We don't need/want to check the actual article, so we don't need to fetch it
                    // However, we still want to know if the given link actually links to an article
                    //  so we'll check it against the tree listing from DCS
                    if (!await isFilepathInRepoTree(fetchLexiconFileParameters))
                        addNoticePartial({ priority: 850, message: "Unable to find lexicon entry", details: lexiconRepoCode, username, excerpt: fetchLinkDescription, location: ourLocation });
                }
                else {
                    // debugLog(`checkStrongsField(${adjustedLanguageCode}, ${repoCode}, ${fieldName}, ${fieldText}, ${bookID} ${C}:${V}, ${givenLocation}, ${JSON.stringify(checkingOptions)} got ${JSON.stringify(fetchLexiconFileParameters)}`);
                    // debugLog(`checkStrongsField wants to check lexicon entry for ${JSON.stringify(fetchLexiconFileParameters)}`);
                    const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;
                    let lexiconMarkdownTextContents;
                    try {
                        lexiconMarkdownTextContents = await getFile_(fetchLexiconFileParameters);
                        // const responseData = await cachedGetFileUsingFullURL({ uri: fetchLink });
                        // const manifestContents = await cachedGetFile({ username, repository, path: 'manifest.yaml', branch });
                        dataAssert(lexiconMarkdownTextContents.length > 10, `checkStrongsField expected ${fetchLinkDescription} lexicon file to be longer: ${lexiconMarkdownTextContents.length}`);
                        // debugLog(`checkStrongsField lexicon link fetch got text: ${lexiconMarkdownTextContents.length}`);
                    } catch (flError) { // NOTE: The error can depend on whether the zipped repo is cached or not
                        // console.error(`checkStrongsField lexicon link fetch had an error fetching ${fetchLinkDescription}: ${flError}`);
                        let details = `${lexiconRepoCode}`;
                        // eslint-disable-next-line eqeqeq
                        if (flError != 'TypeError: lexiconMarkdownTextContents is null') details += ` error=${flError}`;
                        addNoticePartial({ priority: 850, message: "Unable to find/load lexicon entry", details, username, excerpt: fetchLinkDescription, location: ourLocation });
                    }
                    if (lexiconMarkdownTextContents?.length) {
                        if (lexiconMarkdownTextContents.length < 10)
                            addNoticePartial({ priority: 878, message: `Lexicon entry seems empty`, details: `${username} ${repoName} ${repoBranch} ${lexiconPathname}`, excerpt: fieldText, location: ourLocation });
                        else if (checkingOptions?.disableLinkedLexiconEntriesCheckFlag !== true) {
                            await ourCheckLexiconFileContents(username, languageCode, lexiconRepoCode, repoName, repoBranch, lexiconPathname, lexiconMarkdownTextContents, givenLocation, checkingOptions);
                            csfResult.checkedFileCount += 1;
                            csfResult.checkedFilenames.push(adjustedFieldText[0] === 'H' ? lexiconFilename : `${adjustedFieldText}/${lexiconFilename}`);
                            csfResult.checkedRepoNames.push(repoName);
                            csfResult.checkedFilenameExtensions.push('md');
                        }
                    }
                }
                // Only mark this error once, even if the fetch failed
                markAsChecked(fetchLexiconFileParameters); // don’t bother waiting for the result of this async call
            }
        }
    }

    // functionLog(`checkStrongsField is returning ${ JSON.stringify(checkStrongsFieldResult) }`);
    return csfResult;
}
// end of checkStrongsField function
