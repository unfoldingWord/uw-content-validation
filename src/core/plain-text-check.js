// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { OPEN_CLOSE_PUNCTUATION_PAIRS, PAIRED_PUNCTUATION_OPENERS, PAIRED_PUNCTUATION_CLOSERS, isWhitespace, countOccurrences } from './text-handling-functions'
import { checkTextField } from './field-text-check';
import { removeDisabledNotices } from './disabled-notices';
// eslint-disable-next-line no-unused-vars
import { parameterAssert } from './utilities';


const PLAIN_TEXT_VALIDATOR_VERSION_STRING = '0.4.0';


/**
 *
 * @param {string} textType 'markdown', 'USFM', 'YAML', 'text', or 'raw'
 * @param {string} repoCode -- e.g., 'TN' or 'TQ2', etc.
 * @param {string} textName
 * @param {string} plainText -- text to be checked
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export function checkPlainText(languageCode, repoCode, textType, textName, plainText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire text, i.e., all lines.
        It is used in checkFileContents() in book-package-check.js

    TODO: Should languageCode also be a parameter here? (affects other programs using the API)

     Returns a result object containing a successList and a noticeList
     */
    // functionLog(`checkPlainText(${textName}, (${plainText.length} chars), ${givenLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(languageCode !== undefined, "checkPlainText: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkPlainText: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    //parameterAssert(languageCode !== 'markdown' && languageCode !== 'USFM' && languageCode !== 'YAML' && languageCode !== 'text' && languageCode !== 'raw' && languageCode !== 'unfoldingWord', `checkPlainText: 'languageCode' ${languageCode} parameter should be not be '${languageCode}'`);
    //parameterAssert(repoCode !== undefined, "checkPlainText: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkPlainText: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkPlainText: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(textType !== undefined, "checkPlainText: 'textType' parameter should be defined");
    //parameterAssert(typeof textType === 'string', `checkPlainText: 'textType' parameter should be a string not a '${typeof textType}': ${textType}`);
    //parameterAssert(textType === 'markdown' || textType === 'USFM' || textType === 'YAML' || textType === 'text' || textType === 'raw', `checkPlainText: unrecognised 'textType' parameter: '${textType}'`);
    //parameterAssert(textName !== undefined, "checkPlainText: 'textName' parameter should be defined");
    //parameterAssert(typeof textName === 'string', `checkPlainText: 'textName' parameter should be a string not a '${typeof textName}': ${textName}`);
    //parameterAssert(plainText !== undefined, "checkPlainText: 'plainText' parameter should be defined");
    //parameterAssert(typeof plainText === 'string', `checkPlainText: 'plainText' parameter should be a string not a '${typeof plainText}': ${plainText}`);
    //parameterAssert(checkingOptions !== undefined, "checkPlainText: 'checkingOptions' parameter should be defined");

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (ptcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const cptResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // functionLog(`checkPlainText success: ${successString}`);
        cptResult.successList.push(successString);
    }
    function addNotice(noticeObject) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // functionLog(`checkPlainText notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(noticeObject.priority !== undefined, "cPT addNotice: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `cPT addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "cPT addNotice: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `cPT addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cPT addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt!==undefined, "cPT addNotice: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cPT addNotice: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "cPT addNotice: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `cPT addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // noticeObject.debugChain = noticeObject.debugChain ? `checkPlainText(${textType}, ${textName}) ${noticeObject.debugChain}` : `checkPlainText(${textType}, ${textName})`;
        cptResult.noticeList.push(noticeObject);
    }

    function ourCheckTextField(lineNumber, fieldText, allowedLinks, optionalFieldLocation, checkingOptions) {
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
        // debugLog(`cPT ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        //parameterAssert(lineNumber !== undefined, "cPT ourCheckTextField: 'lineNumber' parameter should be defined");
        //parameterAssert(typeof lineNumber === 'number', `cPT ourCheckTextField: 'fieldName' parameter should be a number not a '${typeof lineNumber}'`);
        //parameterAssert(fieldText !== undefined, "cPT ourCheckTextField: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `cPT ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "cPT ourCheckTextField: allowedLinks parameter must be either true or false");
        //parameterAssert(optionalFieldLocation !== undefined, "cPT ourCheckTextField: 'optionalFieldLocation' parameter should be defined");
        //parameterAssert(typeof optionalFieldLocation === 'string', `cPT ourCheckTextField: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

        const resultObject = checkTextField(languageCode, repoCode, textType, '', fieldText, allowedLinks, optionalFieldLocation, checkingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        // cptResult.noticeList = cptResult.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList)
            addNotice({ ...noticeEntry, lineNumber });
    }
    // end of ourCheckTextField function

    function checkPlainLineContents(lineNumber, lineText, lineLocation) {

        // functionLog(`checkPlainLineContents for '${lineName}', '${lineText}' at${lineLocation}`);
        let thisText = lineText.trimStart(); // So we don’t get "leading space" AND "doubled spaces" errors

        if (thisText)
            // Allow links as that’s more general
            ourCheckTextField(lineNumber, thisText, true, lineLocation, checkingOptions);
    }
    // end of checkPlainLineContents function


    // Main code for checkPlainText function
    if (isWhitespace(plainText)) {
        addNotice({ priority: 638, message: "Only found whitespace", location: ourLocation });
        return cptResult;
    }

    let characterIndex;
    if ((characterIndex = plainText.indexOf('<<<<<<<')) >= 0) {
        const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
        const excerpt = (iy > excerptHalfLength ? '…' : '') + plainText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < plainText.length ? '…' : '')
        addNotice({ priority: 993, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
    } else if ((characterIndex = plainText.indexOf('=======')) >= 0) {
        const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
        const excerpt = (iy > excerptHalfLength ? '…' : '') + plainText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < plainText.length ? '…' : '')
        addNotice({ priority: 992, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
    } else if ((characterIndex = plainText.indexOf('>>>>>>>>')) >= 0) {
        const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
        const excerpt = (iy > excerptHalfLength ? '…' : '') + plainText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < plainText.length ? '…' : '')
        addNotice({ priority: 991, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
    }

    if (plainText[0] === '\n') {
        characterIndex = 0;
        const excerpt = (plainText.length > excerptLength ? '…' : '') + plainText.slice(-excerptLength).replace(/ /g, '␣').replace(/\n/g, '\\n')
        addNotice({ priority: 539, message: "File starts with empty line", characterIndex, excerpt, location: ourLocation });
    }
    if (!plainText.endsWith('\n') && !textName.endsWith('title.md')) {
        characterIndex = plainText.length - 1;
        const excerpt = (plainText.length > excerptLength ? '…' : '') + plainText.slice(-excerptLength).replace(/ /g, '␣').replace(/\n/g, '\\n')
        addNotice({ priority: 538, message: "File ends without newline character", characterIndex, excerpt, location: ourLocation });
    }
    else if (plainText.endsWith('\n\n')) {
        characterIndex = plainText.length - 2;
        const excerpt = (plainText.length > excerptLength ? '…' : '') + plainText.slice(-excerptLength).replace(/ /g, '␣').replace(/\n/g, '\\n')
        addNotice({ priority: 138, message: "File ends with additional blank line(s)", characterIndex, excerpt, location: ourLocation });
    }

    const lines = plainText.split('\n');
    // debugLog(`  '${location}' has ${lines.length.toLocaleString()} total lines`);
    //  checking nested markers (so that we can give the line number in the notice)
    // let headerLevel = 0;
    // let lastNumLeadingSpaces = 0;
    // let lastLineContents;
    // While checking individual lines,
    const openMarkers = [];
    for (let n = 1; n <= lines.length; n++) {

        const line = lines[n - 1];
        if (line) {
            if (textType === 'text' || textType === 'raw') // other file-types do these checks themselves
                checkPlainLineContents(n, line, ourLocation);

            // Check for nested brackets and quotes, etc.
            for (let characterIndex = 0; characterIndex < line.length; characterIndex++) {
                const char = line[characterIndex];
                let closeCharacterIndex;
                if (PAIRED_PUNCTUATION_OPENERS.indexOf(char) >= 0) {
                    // debugLog(`Saving ${openMarkers.length} '${char}' ${n} ${x}`);
                    openMarkers.push({ char, n, x: characterIndex });
                } else if ((closeCharacterIndex = PAIRED_PUNCTUATION_CLOSERS.indexOf(char)) >= 0) {
                    // debugLog(`Found '${char}' ${n} ${x}`);
                    // debugLog(`Which: ${which} '${openers.charAt(which)}'`)
                    if (openMarkers.length) {
                        const [lastEntry] = openMarkers.slice(-1);
                        // debugLog(`  Recovered lastEntry=${JSON.stringify(lastEntry)}`);
                        // debugLog(`  Comparing found '${char}' with (${which}) '${openers.charAt(which)}' from '${lastEntry.char}'`);
                        if (lastEntry.char === PAIRED_PUNCTUATION_OPENERS.charAt(closeCharacterIndex)) {
                            // debugLog(`  Matched '${char}' with  '${openers.charAt(which)}' ${n} ${x}`);
                            openMarkers.pop();
                        } else // something is still open and this isn’t a match -- might just be consequential error
                            if (char !== '’' // Closing single quote is also used as apostrophe in English
                                && (textType !== 'markdown' || char !== '>' || characterIndex > 4)) { // Markdown uses > or >> or > > or > > > for block indents so ignore these -- might just be consequential error
                                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + line.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < line.length ? '…' : '')
                                const details = `'${lastEntry.char}' opened on line ${lastEntry.n} character ${lastEntry.x + 1}`;
                                addNotice({ priority: 777, message: `Bad punctuation nesting: ${char} closing character doesn’t match`, details, lineNumber: n, characterIndex, excerpt, location: ourLocation });
                                // debugLog(`  ERROR 777: mismatched characters: ${details}`);
                            }
                    } else // Closed something unexpectedly without an opener
                        if (char !== '’' // Closing single quote is also used as apostrophe in English
                            && (textType !== 'markdown' || char !== '>')) { // Markdown uses > for block indents so ignore these
                            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + line.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < line.length ? '…' : '')
                            addNotice({ priority: 774, message: `Unexpected ${char} closing character (no matching opener)`, lineNumber: n, characterIndex, excerpt, location: ourLocation });
                            // debugLog(`  ERROR 774: closed with nothing open: ${char}`);
                        }
                }

            }
        } else {
            // This is a blank line
        }

        // lastLineContents = line;
    }
    //  At the end of the text -- check for left-over opening characters (unclosed)
    if (openMarkers.length) {
        const [{ char, n, x }] = openMarkers.slice(-1);
        const line = lines[n - 1];
        const excerpt = (x > excerptHalfLength ? '…' : '') + line.substring(x - excerptHalfLength, x + excerptHalfLengthPlus).replace(/ /g, '␣') + (x + excerptHalfLengthPlus < line.length ? '…' : '')
        const details = openMarkers.length > 1 ? `${openMarkers.length} unclosed set${openMarkers.length === 1 ? '' : 's'}` : null;
        addNotice({ priority: 768, message: `At end of text with unclosed ${char} opening character`, details, lineNumber: n, characterIndex: x, excerpt, location: ourLocation });
    }

    // TODO: Is this a duplicate of the above section about nesting?
    // Check matched pairs in the entire file
    for (const punctSet of OPEN_CLOSE_PUNCTUATION_PAIRS) {
        // Can’t check '‘’' coz they might be used as apostrophe
        const leftChar = punctSet[0], rightChar = punctSet[1];
        const leftCount = countOccurrences(plainText, leftChar),
            rightCount = countOccurrences(plainText, rightChar);
        if (leftCount !== rightCount
            && (rightChar !== '’' || leftCount > rightCount) // Closing single quote is also used as apostrophe in English
            && (textType !== 'markdown' || rightChar !== '>')) // markdown uses > as a block quote character
            // NOTE: These are lower priority than similar checks in a field
            //          since they occur only within the entire file
            addNotice({ priority: leftChar === '“' ? 162 : 462, message: `Mismatched ${leftChar}${rightChar} characters`, details: `left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });
    }

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // functionLog(`checkPlainText: calling removeDisabledNotices(${cptResult.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        cptResult.noticeList = removeDisabledNotices(cptResult.noticeList);
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (cptResult.noticeList.length)
        addSuccessMessage(`checkPlainText v${PLAIN_TEXT_VALIDATOR_VERSION_STRING} finished with ${cptResult.noticeList.length ? cptResult.noticeList.length.toLocaleString() : "zero"} notice${cptResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkPlainText v${PLAIN_TEXT_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkPlainText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkPlainText result is", JSON.stringify(result));
    return cptResult;
}
// end of checkPlainText function
