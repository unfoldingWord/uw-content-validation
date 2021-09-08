// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { checkTextField } from './field-text-check';
import { checkNotesLinksToOutside } from './notes-links-check';
// import { cachedGetFileUsingFullURL } from './getApi';
import { removeDisabledNotices } from './disabled-notices';
// eslint-disable-next-line no-unused-vars
import { parameterAssert, dataAssert, debugLog, functionLog } from './utilities';


const MARKDOWN_TEXT_VALIDATOR_VERSION_STRING = '0.8.1';


/**
 *
 * @param {string} languageCode, e.g., 'en'
 * @param {string} repoCode -- e.g., 'TN' or 'TQ2', etc.
 * @param {string} textOrFileName -- used for identification
 * @param {string} markdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkMarkdownText(languageCode, repoCode, textOrFileName, markdownText, givenLocation, checkingOptions) {
    /* This function is optimised for doing general markdown format checks of the entire markdown text, i.e., all lines.
        It should not be called directly for checking an entire file -- use checkMarkdownFileContents() for that

    This text may not necessarily be from a file -- it may be from a (multiline) field within a file

     Returns a result object containing a successList and a noticeList
     */
    // functionLog(`checkMarkdownText(${languageCode}, ${repoCode}, ${textOrFileName}, (${markdownText.length}), ${givenLocation}, …)…`);
    //parameterAssert(languageCode !== undefined, "checkMarkdownText: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkMarkdownText: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    //parameterAssert(languageCode !== 'unfoldingWord', `checkMarkdownText: 'languageCode' ${languageCode} parameter should be not be 'unfoldingWord'`);
    //parameterAssert(repoCode !== undefined, "checkMarkdownText: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkMarkdownText: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
    parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkMarkdownText: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(textOrFileName !== undefined, "checkMarkdownText: 'textOrFileName' parameter should be defined");
    //parameterAssert(typeof textOrFileName === 'string', `checkMarkdownText: 'textOrFileName' parameter should be a string not a '${typeof textOrFileName}': ${textOrFileName}`);
    //parameterAssert(textOrFileName !== `${languageCode}_${repoCode.toLowerCase()}`, `checkMarkdownText: 'textOrFileName' parameter should not be the repoName: '${textOrFileName}'`);
    if (textOrFileName === `${languageCode}_${repoCode.toLowerCase()}`) { console.trace('checkMarkdownText()'); }
    //parameterAssert(markdownText !== undefined, "checkMarkdownText: 'markdownText' parameter should be defined");
    //parameterAssert(typeof markdownText === 'string', `checkMarkdownText: 'markdownText' parameter should be a string not a '${typeof markdownText}': ${markdownText}`);
    //parameterAssert(givenLocation !== undefined, "checkMarkdownText: 'optionalFieldLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkMarkdownText: 'optionalFieldLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
    //parameterAssert(givenLocation.indexOf('true') === -1, `checkMarkdownText: 'optionalFieldLocation' parameter should not be '${givenLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "checkMarkdownText: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined) { //parameterAssert(typeof checkingOptions === 'object', `checkMarkdownText: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (mdtcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog("Using default excerptLength=" + excerptLength);
    }
    // else
    // debugLog("Using supplied excerptLength=" + excerptLength, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog("Using excerptHalfLength=" + excerptHalfLength, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // debugLog("checkMarkdownText success: " + successString);
        result.successList.push(successString);
    }
    function addNoticePartial(incompleteNoticeObject) {
        // functionLog(`checkMarkdownText addNoticePartial: (priority=${incompleteNoticeObject.priority}) ${incompleteNoticeObject.message}${incompleteNoticeObject.characterIndex > 0 ? ` (at character ${incompleteNoticeObject.characterIndex})` : ""}${incompleteNoticeObject.excerpt ? " " + excerpt : ""}${incompleteNoticeObject.location}`);
        //parameterAssert(incompleteNoticeObject.priority !== undefined, "cMdT addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `cMdT addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}': ${incompleteNoticeObject.priority}`);
        //parameterAssert(incompleteNoticeObject.message !== undefined, "cMdT addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.message === 'string', `cMdT addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}': ${incompleteNoticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "cMdT addNoticePartial: 'characterIndex' parameter should be defined");
        if (incompleteNoticeObject.characterIndex) { //parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `cMdT addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}': ${incompleteNoticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "cMdT addNoticePartial: 'excerpt' parameter should be defined");
        if (incompleteNoticeObject.excerpt) { //parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `cMdT addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}': ${incompleteNoticeObject.excerpt}`);
        }
        //parameterAssert(incompleteNoticeObject.location !== undefined, "cMdT addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.location === 'string', `cMdT addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}': ${incompleteNoticeObject.location}`);

        // incompleteNoticeObject.debugChain = incompleteNoticeObject.debugChain ? `checkMarkdownText(${languageCode}, ${textOrFileName}) ${incompleteNoticeObject.debugChain}` : `checkMarkdownText(${languageCode}, ${textOrFileName})`;
        if (incompleteNoticeObject.repoCode === undefined) {
            // debugLog(`checkMarkdownText addNoticePartial added rC=${repoCode} to ${JSON.stringify(incompleteNoticeObject)}`);
            incompleteNoticeObject.repoCode = repoCode;
        }
        // else if (repoCode !== incompleteNoticeObject.repoCode) debugLog(`checkMarkdownText addNoticePartial DIDN'T ADD rC=${repoCode} to ${JSON.stringify(incompleteNoticeObject)}`);

        result.noticeList.push(incompleteNoticeObject); // Used to have filename: textName, but that isn’t always a filename !!!
    }
    // end of addNoticePartial function

    function ourCheckTextField(fieldName, lineNumber, fieldText, allowedLinks, optionalFieldLocation, checkingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {string} fieldName - name of the field being checked
        * @param {string} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {string} optionalFieldLocation - description of where the field is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // functionLog(`cMdT ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${optionalFieldLocation}, …)`);
        //parameterAssert(fieldName !== undefined, "cMdT ourCheckTextField: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `cMdT ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(lineNumber !== undefined, "cMdT ourCheckTextField: 'lineNumber' parameter should be defined");
        //parameterAssert(typeof lineNumber === 'number', `cMdT ourCheckTextField: 'lineNumber' parameter should be a number not a '${typeof lineNumber}'`);
        //parameterAssert(fieldText !== undefined, "cMdT ourCheckTextField: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `cMdT ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "cMdT ourCheckTextField: allowedLinks parameter must be either true or false");
        //parameterAssert(optionalFieldLocation !== undefined, "cMdT ourCheckTextField: 'optionalFieldLocation' parameter should be defined");
        //parameterAssert(typeof optionalFieldLocation === 'string', `cMdT ourCheckTextField: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

        const dbtcResultObject = checkTextField(languageCode, repoCode, 'markdown', fieldName, fieldText, allowedLinks, optionalFieldLocation, checkingOptions);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of dbtcResultObject.noticeList)
            addNoticePartial({ ...noticeEntry, lineNumber });
        return dbtcResultObject.suggestion; // There may or may not be one!
    }
    // end of ourCheckTextField function


    async function ourCheckNotesLinksToOutside(lineNumber, lineText, location, checkingOptions) {
        // Checks that the TA/TW/Bible reference can be found

        // Updates the global list of notices

        // functionLog(`checkUSFMText ourCheckNotesLinksToOutside(${lineNumber}, ${C}:${V}, ${marker}, (${twLinkText.length}) '${twLinkText}', ${location}, ${JSON.stringify(checkingOptions)})`);
        //parameterAssert(lineNumber !== undefined, "checkUSFMText ourCheckNotesLinksToOutside: 'lineNumber' parameter should be defined");
        //parameterAssert(typeof lineNumber === 'number', `checkUSFMText ourCheckNotesLinksToOutside: 'lineNumber' parameter should be a number not a '${typeof lineNumber}': ${lineNumber}`);
        //parameterAssert(lineText !== undefined, "checkUSFMText ourCheckNotesLinksToOutside: 'lineText' parameter should be defined");
        //parameterAssert(typeof lineText === 'string', `checkUSFMText ourCheckNotesLinksToOutside: 'lineText' parameter should be a string not a '${typeof lineText}': ${lineText}`);
        //parameterAssert(location !== undefined, "checkUSFMText ourCheckNotesLinksToOutside: 'location' parameter should be defined");
        //parameterAssert(typeof location === 'string', `checkUSFMText ourCheckNotesLinksToOutside: 'location' parameter should be a string not a '${typeof location}': ${location}`);

        // Empty fields on the next line are bookID, C, V (as we don’t have that information here)
        let adjustedTextOrFileName = textOrFileName;
        if (textOrFileName === 'README.md' || textOrFileName === 'LICENSE.md') adjustedTextOrFileName = textOrFileName.substring(0, textOrFileName.length - 3);
        let adjustedLanguageCode = languageCode; // This is the language code of the resource with the link
        if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won’t be needed for TWs when we switch to TWLs)
        const coTNlResultObject = await checkNotesLinksToOutside(languageCode, repoCode, '', '', '', adjustedTextOrFileName, lineText, location, { ...checkingOptions, defaultLanguageCode: adjustedLanguageCode });
        // debugLog(`coTNlResultObject=${JSON.stringify(coTNlResultObject)}`);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // result.noticeList = result.noticeList.concat(coTNlResultObject.noticeList);
        // If we need to put everything through addNoticePartialPartial, e.g., for debugging or filtering
        //  process results line by line
        for (const coqNoticeEntry of coTNlResultObject.noticeList) {
            if (coqNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN2 check
                result.noticeList.push(coqNoticeEntry); // Just copy the complete notice as is -- would be confusing to have this lineNumber
            else // For our direct checks, we add the repoCode as an extra value
                addNoticePartial({ ...coqNoticeEntry, lineNumber });
        }
        // The following is needed coz we might be checking the linked TA and/or TW articles
        if (coTNlResultObject.checkedFileCount && coTNlResultObject.checkedFileCount > 0)
            if (typeof result.checkedFileCount === 'number') result.checkedFileCount += coTNlResultObject.checkedFileCount;
            else result.checkedFileCount = coTNlResultObject.checkedFileCount;
        if (coTNlResultObject.checkedFilesizes && coTNlResultObject.checkedFilesizes > 0)
            if (typeof result.checkedFilesizes === 'number') result.checkedFilesizes += coTNlResultObject.checkedFilesizes;
            else result.checkedFilesizes = coTNlResultObject.checkedFilesizes;
        if (coTNlResultObject.checkedRepoNames && coTNlResultObject.checkedRepoNames.length > 0)
            for (const checkedRepoName of coTNlResultObject.checkedRepoNames)
                try { if (result.checkedRepoNames.indexOf(checkedRepoName) < 0) result.checkedRepoNames.push(checkedRepoName); }
                catch { result.checkedRepoNames = [checkedRepoName]; }
        if (coTNlResultObject.checkedFilenameExtensions && coTNlResultObject.checkedFilenameExtensions.length > 0)
            for (const checkedFilenameExtension of coTNlResultObject.checkedFilenameExtensions)
                try { if (result.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) result.checkedFilenameExtensions.push(checkedFilenameExtension); }
                catch { result.checkedFilenameExtensions = [checkedFilenameExtension]; }
        // if (result.checkedFilenameExtensions) debugLog("result", JSON.stringify(result));
    }
    // end of ourCheckNotesLinksToOutside function


    /**
     *
     * @param {string} lineNumber
     * @param {string} lineText -- text to be checked
     * @param {string} lineLocation
     * @returns {string} suggestion (may be undefined) -- suggested fixed replacement field
     */
    async function checkMarkdownLineContents(lineNumber, lineText, lineLocation) {

        // functionLog(`checkMarkdownLineContents for ${lineNumber} '${lineText}' at${lineLocation}`);

        // // Check for image links
        // let regexMatchObject;
        // while ((regexMatchObject = SIMPLE_IMAGE_REGEX.exec(lineText))) {
        //     // debugLog(`Got markdown image in line ${lineNumber}:`, JSON.stringify(regexMatchObject));
        //     const [totalLink, altText, fetchLink] = regexMatchObject;
        //     // if (altText !== 'OBS Image') userLog("This code was only checked for 'OBS Image' links");
        //     if (!altText)
        //         addNoticePartial({ priority: 199, message: "Markdown image link has no alternative text", lineNumber, excerpt: totalLink, location: lineLocation });
        //     if (!fetchLink.startsWith('https://'))
        //         addNoticePartial({ priority: 749, message: "Markdown image link seems faulty", lineNumber, excerpt: fetchLink, location: lineLocation });
        //     else if (checkingOptions?.disableAllLinkFetchingFlag !== true) {
        //         // debugLog(`Need to check existence of ${fetchLink}`);
        //         try {
        //             const responseData = await cachedGetFileUsingFullURL({ uri: fetchLink });
        //             dataAssert(responseData.length > 10, `Expected ${fetchLink} image file to be longer: ${responseData.length}`);
        //             // debugLog("Markdown link fetch got response: ", responseData.length);
        //         } catch (flError) {
        //             console.error(`Markdown image link fetch had an error fetching '${fetchLink}': ${flError}`);
        //             addNoticePartial({ priority: 748, message: "Error fetching markdown image link", lineNumber, excerpt: fetchLink, location: lineLocation });
        //         }
        //     }
        // }
        // while ((regexMatchObject = TITLED_IMAGE_REGEX.exec(lineText))) {
        //     // debugLog(`Got markdown image in line ${lineNumber}:`, JSON.stringify(regexMatchObject));
        //     const [totalLink, alt, fetchLink, title] = regexMatchObject;
        //     if (!alt)
        //         addNoticePartial({ priority: 199, message: "Markdown image link has no alternative text", lineNumber, excerpt: totalLink, location: lineLocation });
        //     if (!title)
        //         addNoticePartial({ priority: 348, message: "Markdown image link has no title text", lineNumber, excerpt: totalLink, location: lineLocation });
        //     if (!fetchLink.startsWith('https://'))
        //         addNoticePartial({ priority: 749, message: "Markdown image link seems faulty", lineNumber, excerpt: fetchLink, location: lineLocation });
        //     else if (checkingOptions?.disableAllLinkFetchingFlag !== true) {
        //         // debugLog(`Need to check existence of ${fetchLink}`);
        //         try {
        //             const responseData = await cachedGetFileUsingFullURL({ uri: fetchLink });
        //             dataAssert(responseData.length > 10, `Expected ${fetchLink} image file to be longer: ${responseData.length}`);
        //             // debugLog("Markdown link fetch got response: ", responseData.length);
        //         } catch (flError) {
        //             console.error(`Markdown image link fetch had an error fetching '${fetchLink}': ${flError}`);
        //             addNoticePartial({ priority: 748, message: "Error fetching markdown image link", lineNumber, excerpt: fetchLink, location: lineLocation });
        //         }
        //     }
        // }

        if (lineText.indexOf('[') >= 0) // Check for markdown links like [[xx]] or [xx](yy) etc.
            await ourCheckNotesLinksToOutside(lineNumber, lineText, givenLocation, checkingOptions)

        let thisText = lineText; // so we can adjust it

        // Remove leading and trailing hash signs #
        thisText = thisText.replace(/^#+|#+$/g, '');
        // debugLog(`After removing hashes have '${thisText}'`);

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g, '');

        // Remove leading block text markers >
        while (thisText.startsWith('>'))
            thisText = thisText.replace(/^>+ */g, '');
        // if (thisText.indexOf('>') >= 0) userLog(`After removing leading block text markers from '${lineText}' still have '${thisText}'`);

        // Remove leading spaces again
        // thisText = thisText.replace(/^ +/g, '');
        // debugLog(`After removing leading spaces have '${thisText}'`);

        // // Remove leading asterisks
        // thisText = thisText.replace(/^\*/g,'')
        // debugLog(`After removing asterisks have '${thisText}'`);

        // // Remove leading spaces again now
        // thisText = thisText.replace(/^ +/g,'')
        // debugLog(`After removing more leading spaces have '${thisText}'`);

        let suggestion;
        if (thisText && lineText[0] !== '|') // Doesn’t really make sense to check table line entries
            suggestion = ourCheckTextField(`${textOrFileName} line`, lineNumber, thisText, true, lineLocation, checkingOptions);

        if (thisText === lineText) // i.e., we didn’t premodify the field being checked (otherwise suggestion could be wrong)
            return suggestion;
    }
    // end of checkMarkdownLineContents function


    // Main code for checkMarkdownText function
    const lines = markdownText.split('\n');
    // debugLog(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    let currentHeaderLevel = 0;
    let lastLine;
    let indentLevels = [];
    const suggestedLines = [];
    let notifiedBlankLines = false;
    for (let n = 1; n <= lines.length; n++) {

        const line = lines[n - 1];
        const nextLine = (n < lines.length - 1) ? lines[n] : undefined;

        // Markdown headers should be preceded and followed by a blank line
        if (line.startsWith('#')) {
            if (n > 1 && lastLine.length !== 0) {
                const notice = { priority: 252, message: "Markdown headers should be preceded by a blank line", lineNumber: n, location: ourLocation };
                if (textOrFileName === 'Note' || textOrFileName === 'OccurrenceNote')
                    notice.details = `markdown line ${n}`;
                addNoticePartial(notice);
            }
            if (nextLine?.length !== 0) {
                const notice = { priority: 251, message: "Markdown headers should be followed by a blank line", lineNumber: n, location: ourLocation };
                if (textOrFileName === 'Note' || textOrFileName === 'OccurrenceNote')
                    notice.details = `markdown line ${n}`;
                addNoticePartial(notice);
            }
        }

        let numLeadingSpaces;
        if (line) {
            const thisHeaderLevel = line.match(/^#*/)[0].length;
            // if (thisHeaderLevel) debugLog(`checkMarkdownText: Got1 thisHeaderLevel=${thisHeaderLevel} after ${currentHeaderLevel} for line ${n}: ${line}`);
            if (thisHeaderLevel > currentHeaderLevel + 1
                && !textOrFileName.startsWith('TA ')) { // Suppress this notice for translationAcademy subsections
                // debugLog(`checkMarkdownText: Got2 thisHeaderLevel=${thisHeaderLevel} after ${currentHeaderLevel} for line ${n}: ${line}`);
                const excerpt = line.substring(0, excerptLength) + (line.length > excerptLength ? '…' : '');
                const notice = { priority: 172, message: "Header levels should only increment by one", details: `Going from level ${currentHeaderLevel} to level ${thisHeaderLevel}`, lineNumber: n, characterIndex: 0, excerpt, location: ourLocation };
                if (textOrFileName === 'Note' || textOrFileName === 'OccurrenceNote')
                    notice.details = `markdown line ${n}`;
                addNoticePartial(notice);
            }
            if (thisHeaderLevel > 0) {
                currentHeaderLevel = thisHeaderLevel;
                indentLevels = []; // reset
            }

            numLeadingSpaces = line.match(/^ */)[0].length;
            // debugLog(`Got numLeadingSpaces=${numLeadingSpaces} with indentLevels=${JSON.stringify(indentLevels)} for ${line}${ourLocation}`);
            const previousIndentLevel = (indentLevels.length > 0) ? indentLevels[indentLevels.length - 1] : 0;
            if ((numLeadingSpaces > previousIndentLevel) // We have an indent level increase
                || (numLeadingSpaces === 0 && line.length > 0 && indentLevels.length === 0)) // we have our first zero-level indent
                indentLevels.push(numLeadingSpaces);
            else if (numLeadingSpaces < previousIndentLevel) { // We have an indent level decrease
                if (indentLevels.length > 1 && indentLevels[indentLevels.length - 2] === numLeadingSpaces)
                    // We went back to the previous level
                    indentLevels.pop();
                else { // seems we didn’t go back to the previous level ???
                    let foundPreviousLevel = false;
                    for (let z = indentLevels.length - 1; z >= 0; z--) {
                        if (indentLevels[z] === numLeadingSpaces) {
                            // debugLog(`After finding ${numLeadingSpaces} spaces, reducing length of ${JSON.stringify(indentLevels)} to ${z+1}`);
                            indentLevels.length = z + 1;
                            foundPreviousLevel = true;
                            break;
                        }
                    }
                    if (!foundPreviousLevel) {
                        const notice = { priority: 282, message: "Nesting of header levels seems confused", details: `recent indent levels=${JSON.stringify(indentLevels)} but now ${numLeadingSpaces}`, lineNumber: n, characterIndex: 0, location: ourLocation };
                        if (textOrFileName === 'Note' || textOrFileName === 'OccurrenceNote')
                            notice.details = `markdown line ${n}`;
                        addNoticePartial(notice);
                    }
                }
            }

            const suggestedLine = await checkMarkdownLineContents(n, line, ourLocation);
            suggestedLines.push(suggestedLine === undefined ? line : suggestedLine);
        } else {
            // This is a blank line
            numLeadingSpaces = 0;
            suggestedLines.push('');

            // Should only ever have single blank lines in markdown
            if (n > 1 && lastLine.length === 0 && nextLine?.length === 0 && !notifiedBlankLines) {
                const notice = { priority: 250, message: "Multiple blank lines are not expected in markdown", lineNumber: n, location: ourLocation };
                if (textOrFileName === 'Note' || textOrFileName === 'OccurrenceNote')
                    notice.details = `markdown line ${n}`;
                addNoticePartial(notice);
                notifiedBlankLines = true;
            }
        }

        lastLine = line;
        // lastNumLeadingSpaces = numLeadingSpaces;
    }


    // Check for an uneven number of sets of symmetrical (i.e., opener == closer) multicharacter markdown formatting sequences
    for (const thisSet of [ // Put longest ones first
        // Seems that the fancy ones (commented out) don’t find occurrences at the start (or end?) of the text
        ['___', /___/g],
        // ['___', r'[^_]___[^_]'], // three underlines
        ['***', /\*\*\*/g],
        // ['***', r'[^\*]\*\*\*[^\*]'], // three asterisks
        ['__', /__/g],
        // ['__', r'[^_]__[^_]'], // two underlines
        ['**', /\*\*/g],
        // ['**', r'[^\*]\*\*[^\*]'], // two asterisks
    ]) {
        const thisField = thisSet[0], thisRegex = thisSet[1];
        const count = ((markdownText || '').match(thisRegex) || []).length; // Finds only NON-OVERLAPPING matches hopefully
        if (count && (count % 2) !== 0) {
            const characterIndex = markdownText.indexOf(thisField);
            const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
            const excerpt = /*(iy > excerptHalfLength ? '…' : '') +*/ markdownText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus) + (iy + excerptHalfLengthPlus < markdownText.length ? '…' : '')
            addNoticePartial({ priority: 378, message: `Possible mismatched '${thisField}' markdown formatting pairs`, details: `${count.toLocaleString()} total occurrence${count === 1 ? '' : 's'}`, characterIndex, excerpt, location: ourLocation });
            break; // Only want one warning per text
        }
    }

    const suggestion = suggestedLines.join('\n');
    if (suggestion !== markdownText) {
        // debugLog(`Had markdown ${markdownText}`);
        // debugLog(`Sug markdown ${suggestion}`);
        result.suggestion = suggestion;
    }

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // functionLog(`checkMarkdownText: calling removeDisabledNotices(${result.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        result.noticeList = removeDisabledNotices(result.noticeList);
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}`);
    if (result.noticeList.length)
        addSuccessMessage(`checkMarkdownText v${MARKDOWN_TEXT_VALIDATOR_VERSION_STRING} finished with ${result.noticeList.length ? result.noticeList.length.toLocaleString() : "zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkMarkdownText v${MARKDOWN_TEXT_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkMarkdownText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    return result;
}
// end of checkMarkdownText function
