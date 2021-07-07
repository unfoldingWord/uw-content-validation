import grammar from 'usfm-grammar';
import * as books from '../core/books/books';
import { DEFAULT_EXCERPT_LENGTH } from './defaults'
// eslint-disable-next-line no-unused-vars
import { userLog, debugLog, functionLog, parameterAssert, ourParseInt } from './utilities';


// const USFM_GRAMMAR_VALIDATOR_VERSION_STRING = '0.4.5';

const LINE_COLUMN_NUMBERS_REGEX = new RegExp('Line (\\d{1,6}), col (\\d{1,4}):'); // e.g., "Line 1538, col 4: 1537 ..."


/**
 *
 * @param {string} strictnessString -- 'strict' or 'relaxed'
 * @param {string} bookID -- 3-character book ID
 * @param {string} fileText -- the actual USFM text
 * @param {string} filename -- for error messages
 * @param {string} givenLocation -- for error messages
 * @param {Object} checkingOptions -- optional options
 * @returns {Object} including isValidUSFM flag
 */
export function runBCSGrammarCheck(strictnessString, bookID, fileText, filename, givenLocation, checkingOptions) {
    // Runs the BCS USFM Grammar checker
    //  which can be quite time-consuming on large, complex USFM files
    // userLog(`Running ${strictnessString} BCS USFM grammar check${givenLocation} (can take quite a while for a large book)…`);
    //parameterAssert(strictnessString === 'strict' || strictnessString === 'relaxed', `Unexpected strictnessString='${strictnessString}'`);

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (usfmELerror) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength} cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    // Now create the parser and run the check
    let parserToJSONResultObject, parseWarnings;
    try {
        // debugLog(`${new Date().getTime() / 1000} Setting-up the USFMGrammar checker…`);
        const ourUsfmParser = new grammar.USFMParser(fileText, strictnessString === 'relaxed' ? grammar.LEVEL.RELAXED : null);
        // Returns a Boolean indicating whether the input USFM text satisfies the grammar or not.
        // This method is available in both default and relaxed modes.
        // const parserResult = ourUsfmParser.validate();
        // debugLog(`${new Date().getTime() / 1000} Running the BCS USFMGrammar checker (may take several seconds)…`);
        // userLog(`Running the BCS USFMGrammar checker for ${bookID} (may take several seconds)…`);
        parserToJSONResultObject = ourUsfmParser.toJSON();
        // debugLog(`${new Date().getTime() / 1000} Got the BCS USFMGrammar checker toJSON result: ${Object.keys(parserToJSONResultObject)}`);
        // debugLog(`${new Date().getTime() / 1000} Got the BCS USFMGrammar checker toJSON _messages: ${Object.keys(parserToJSONResultObject._messages)}`);
        // debugLog(`${new Date().getTime() / 1000} Got the BCS USFMGrammar checker: ${Object.keys(ourUsfmParser)}`);
        parseWarnings = parserToJSONResultObject._warnings ? parserToJSONResultObject._warnings : ourUsfmParser.warnings;
        // debugLog(`${new Date().getTime() / 1000} Got warnings from the BCS USFMGrammar checker: (${parseWarnings.length}) ${parseWarnings}`);
    } catch (parserError) { // This is how the Parser returns USFM errors, i.e., it stops after the first error
        // debugLog(`${new Date().getTime() / 1000} Got an exception when using the BCS USFMGrammar checker: ${parserError}`);
        const ourErrorObject = {
            priority: 840, message: "USFMGrammar check failed",
            details: parserError,
            filename,
            location: givenLocation
        };
        try { // See if we can improve the result with line and column numbers
            // NOTE: The following code is quite fragile
            //  as it depends on the precise format of the error message returned from USFMParser
            const regexResultArray = LINE_COLUMN_NUMBERS_REGEX.exec(parserError);
            const [totalLink, lineNumberString, columnNumberString] = regexResultArray;
            ourErrorObject.lineNumber = ourParseInt(lineNumberString);
            ourErrorObject.characterIndex = ourParseInt(columnNumberString) - 1;
            const errorLineText = fileText.split('\n')[ourErrorObject.lineNumber - 1];
            ourErrorObject.excerpt = (ourErrorObject.characterIndex > excerptHalfLength ? '…' : '') + errorLineText.substring(ourErrorObject.characterIndex - excerptHalfLength, ourErrorObject.characterIndex + excerptHalfLengthPlus) + (ourErrorObject.characterIndex + excerptHalfLengthPlus < errorLineText.length ? '…' : '');
            // NOTE: Not 100% sure that it's more helpful to the user if we do this next line ???
            ourErrorObject.details = ourErrorObject.details.substring(totalLink.length); // Delete the line and column numbers that we found
        } catch (secondError) {
            debugLog(`USFMGrammar second error: ${secondError}`);
        }
        return { isValidUSFM: false, error: ourErrorObject, warnings: [] };
    }
    let parserMessages;
    parserMessages = parserToJSONResultObject._messages; // Throw away the JSON (if any)
    // debugLog(`  Finished BCS USFM grammar check with messages: ${JSON.stringify(parserResult)}\n and warnings: ${JSON.stringify(ourUsfmParser.warnings)}.`);

    // TODO: I think most of the following code is now obsolete and can be deleted
    let parseError;
    parseError = parserMessages._error;
    let ourErrorMessage, lineNumberString, characterIndex, excerpt;
    // NOTE: The following code is quite fragile
    //  as it depends on the precise format of the error message returned from USFMParser
    let ourErrorObject = {};
    if (parseError) {
        debugLog("Oh! This USFMGrammer check code IS still needed!!!");
        const contextRE = /(\d+?)\s\|\s(.+)/g;
        for (const errorLine of parseError.split('\n')) {
            // debugLog(`BCS errorLine=${errorLine}`);
            if (errorLine.startsWith('>')) {
                const regexResult = contextRE.exec(errorLine.substring(1).trim());
                // debugLog(`  regexResult: ${JSON.stringify(regexResult)}`);
                if (regexResult) {
                    lineNumberString = regexResult[1];
                    excerpt = regexResult[2];
                }
            }
            else if (errorLine.endsWith('^')) {
                characterIndex = errorLine.indexOf('^') - 8;
                if (characterIndex < 0) characterIndex = 0; // Just in case
                if (excerpt.length)
                    excerpt = (characterIndex > excerptHalfLength ? '…' : '') + excerpt.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < excerpt.length ? '…' : '')
            }
            else ourErrorMessage = errorLine; // We only want the last one
        }
        // debugLog(`  ourErrorMessage: '${ourErrorMessage}' lineNumberString=${lineNumberString} characterIndex=${characterIndex} excerpt='${excerpt}'`);

        // Some of these "errors" need to be degraded in priority

        let adjustedPriority = 594; // We don’t make these extra high coz the messages are hard for users to interpret
        if (excerpt === '\\s5' // Temporarily, even though \s5 fields are not valid USFM
            || ourErrorMessage.startsWith('Expected "f*", "+"') // Might neeed a OHM schema fix?
        )
            adjustedPriority = 294;

        ourErrorObject = {
            priority: adjustedPriority, message: `USFMGrammar: ${ourErrorMessage}`,
            filename,
            characterIndex, excerpt,
            location: givenLocation
        };

        // Save our line number
        if (lineNumberString && lineNumberString.length) {
            // ourErrorObject.lineNumber = Number(lineNumberString);
            //  but we need a temporary fix for the BCS bug which doesn’t include blank lines in the count
            let lineNumber = Number(lineNumberString)
            let notified = false;
            const lines = fileText.split('\n');
            for (let n = 1; n <= lines.length; n++) {
                if (n >= lineNumber) break; // Gone far enough
                if (!lines[n - 1]) {
                    lineNumber += 1; // Increment error line number for each blank line
                    if (!notified) {
                        userLog("Temporarily adjusting BCS grammar error line number to account for blank lines");
                        notified = true;
                    }
                }
            }
            ourErrorObject.lineNumber = lineNumber;
        }
    }

    // debugLog(`  Warnings: ${JSON.stringify(parseWarnings)}`);
    let ourWarnings = [];
    for (const warningString of parseWarnings) {
        // debugLog(`warningString: '${warningString}'`);
        // Clean up their warnings a little: Remove trailing spaces and periods
        let adjustedString = warningString.trim(); // Removes the trailing space
        if (adjustedString.endsWith('.')) adjustedString = adjustedString.substring(0, adjustedString.length - 1);
        ourWarnings.push(adjustedString);
    }

    return { isValidUSFM: !parseError, error: ourErrorObject, warnings: ourWarnings };
}
// end of runBCSGrammarCheck function


export function checkUSFMGrammar(bookID, strictnessString, filename, givenText, givenLocation, checkingOptions) {
    /*
    This function is only used for the demonstration pages -- not for the core!

    bookID is a three-character UPPERCASE USFM book identifier.

    filename parameter can be an empty string if we don’t have one.

     Returns a result object containing a successList and a noticeList
     */
    functionLog(`checkUSFMGrammar(${givenText.length.toLocaleString()} chars, '${givenLocation}')…`);
    //parameterAssert(strictnessString === 'strict' || strictnessString === 'relaxed', `Unexpected strictnessString='${strictnessString}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;


    const cugResult = { successList: [], noticeList: [] };

    /**
     *
     * @param {string} successString
     */
    function addSuccessMessage(successString) {
        // functionLog(`checkUSFMGrammar success: ${successString}`);
        cugResult.successList.push(successString);
    }
    /**
     *
     * @description - adds a new notice entry from the partial fields given -- adding bookID and filename to the given fields
     * @param {Object} noticeObject expected to contain priority, message, characterIndex, exerpt, location
     */
    function addNoticePartial(noticeObject) {
        // functionLog(`checkUSFMGrammar notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(noticeObject.priority !== undefined, "cUSFMgr addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `cUSFMgr addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "cUSFMgr addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `cUSFMgr addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "cUSFMgr addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cUSFMgr addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "cUSFMgr addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cUSFMgr addNoticePartial: 'excerpt' parameter should be a string not a '${typeof excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "cUSFMgr addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `cUSFMgr addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        cugResult.noticeList.push({ ...noticeObject, bookID, filename });
    }


    // Main code for checkUSFMGrammar function
    if (books.isExtraBookID(bookID)) // doesn’t work for these
        return cugResult;

    const grammarCheckResult = runBCSGrammarCheck(strictnessString, bookID, givenText, filename, ourLocation, checkingOptions);
    // debugLog(`grammarCheckResult=${JSON.stringify(grammarCheckResult)}`);

    if (!grammarCheckResult.isValidUSFM)
        addNoticePartial({ priority: 944, message: `USFM3 Grammar Check (${strictnessString} mode) doesn’t pass`, filename, location: ourLocation });

    // We only get one error if it fails
    if (grammarCheckResult.error && grammarCheckResult.priority)
        addNoticePartial(grammarCheckResult.error);

    // Display these warnings but with a lowish priority
    for (const warningString of grammarCheckResult.warnings)
        addNoticePartial({ priority: 101, message: `USFMGrammar: ${warningString}`, filename, location: ourLocation });

    addSuccessMessage(`Checked USFM Grammar (${strictnessString} mode) ${grammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN’T validate)"}`);
    // debugLog(`  checkUSFMGrammar returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // functionLog(`checkUSFMGrammar result is ${JSON.stringify(result)}`);
    return cugResult;
}
// end of checkUSFMGrammar function
