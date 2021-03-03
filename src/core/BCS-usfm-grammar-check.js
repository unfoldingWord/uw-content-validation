import grammar from 'usfm-grammar';
import * as books from '../core/books/books';
import { DEFAULT_EXCERPT_LENGTH } from './text-handling-functions'
import { userLog, parameterAssert } from './utilities';


// const USFM_GRAMMAR_VALIDATOR_VERSION_STRING = '0.3.3';


export function runBCSGrammarCheck(strictnessString, fileText, filename, givenLocation, checkingOptions) {
    // Runs the BCS USFM Grammar checker
    //  which can be quite time-consuming on large, complex USFM files
    // debugLog(`Running ${strictnessString} BCS USFM grammar check${givenLocation} (can take quite a while for a large book)…`);
    parameterAssert(strictnessString === 'strict' || strictnessString === 'relaxed', `Unexpected strictnessString='${strictnessString}'`);

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
    const ourUsfmParser = new grammar.USFMParser(fileText,
        strictnessString === 'relaxed' ? grammar.LEVEL.RELAXED : null);
    // Returns a Boolean indicating whether the input USFM text satisfies the grammar or not.
    // This method is available in both default and relaxed modes.
    // const parserResult = ourUsfmParser.validate();
    const parserResult = ourUsfmParser.toJSON()
    let parserMessages;
    parserMessages = parserResult._messages; // Throw away the JSON (if any)
    // debugLog(`  Finished BCS USFM grammar check with messages: ${JSON.stringify(parserResult)}\n and warnings: ${JSON.stringify(ourUsfmParser.warnings)}.`);
    let parseError;
    parseError = parserMessages._error;
    // debugLog(`  parseError: ${parseError}`);
    let ourErrorMessage, lineNumberString, characterIndex, excerpt;
    // NOTE: The following code is quite fragile
    //  as it depends on the precise format of the error message return from USFMParser
    let ourErrorObject = {};
    if (parseError) {
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

    const parseWarnings = parserResult._warnings ? parserResult._warnings : ourUsfmParser.warnings;
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
    userLog(`checkUSFMGrammar(${givenText.length.toLocaleString()} chars, '${givenLocation}')…`);
    parameterAssert(strictnessString === 'strict' || strictnessString === 'relaxed', `Unexpected strictnessString='${strictnessString}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;


    const cugResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // functionLog(`checkUSFMGrammar success: ${successString}`);
        cugResult.successList.push(successString);
    }
    function addNotice6to7(noticeObject) {
        /**
        * @description - adds a new notice entry, adding bookID,C,V to the given fields
        * @param {Number} priority - notice priority from 1 (lowest) to 999 (highest)
        * @param {string} message - the text of the notice message
        * @param {Number} characterIndex - where the issue occurs in the line
        * @param {string} excerpt - short excerpt from the line centred on the problem (if available)
        * @param {string} location - description of where the issue is located
        */
        // functionLog(`checkUSFMGrammar notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        parameterAssert(noticeObject.priority !== undefined, "cUSFMgr addNotice6to7: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `cUSFMgr addNotice6to7: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "cUSFMgr addNotice6to7: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `cUSFMgr addNotice6to7: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "cUSFMgr addNotice6to7: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cUSFMgr addNotice6to7: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(excerpt !== undefined, "cUSFMgr addNotice6to7: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) parameterAssert(typeof noticeObject.excerpt === 'string', `cUSFMgr addNotice6to7: 'excerpt' parameter should be a string not a '${typeof excerpt}': ${noticeObject.excerpt}`);
        parameterAssert(noticeObject.location !== undefined, "cUSFMgr addNotice6to7: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `cUSFMgr addNotice6to7: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        cugResult.noticeList.push({ ...noticeObject, bookID, filename });
    }


    // Main code for checkUSFMGrammar function
    if (books.isExtraBookID(bookID)) // doesn’t work for these
        return cugResult;

    const grammarCheckResult = runBCSGrammarCheck(strictnessString, givenText, filename, ourLocation, checkingOptions);
    // debugLog(`grammarCheckResult=${JSON.stringify(grammarCheckResult)}`);

    if (!grammarCheckResult.isValidUSFM)
        addNotice6to7({ priority: 944, message: `USFM3 Grammar Check (${strictnessString} mode) doesn’t pass`, filename, location: ourLocation });

    // We only get one error if it fails
    if (grammarCheckResult.error && grammarCheckResult.priority)
        addNotice6to7(grammarCheckResult.error);

    // Display these warnings but with a lowish priority
    for (const warningString of grammarCheckResult.warnings)
        addNotice6to7({ priority: 101, message: `USFMGrammar: ${warningString}`, filename, location: ourLocation });

    addSuccessMessage(`Checked USFM Grammar (${strictnessString} mode) ${grammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN’T validate)"}`);
    // debugLog(`  checkUSFMGrammar returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // functionLog(`checkUSFMGrammar result is ${JSON.stringify(result)}`);
    return cugResult;
}
// end of checkUSFMGrammar function
