import grammar from 'usfm-grammar';
import * as books from '../core/books/books';


const USFM_GRAMMAR_VALIDATOR_VERSION = '0.3.1';

const DEFAULT_EXTRACT_LENGTH = 10;


export function runBCSGrammarCheck(strictnessString, fileText, givenLocation, optionalCheckingOptions) {
    // Runs the BCS USFM Grammar checker
    //  which can be quite time-consuming on large, complex USFM files
    // console.log(`Running ${strictnessString} BCS USFM grammar check${givenLocation} (can take quite a while for a large book)…`);
    console.assert(strictnessString === 'strict' || strictnessString === 'relaxed', `Unexpected strictnessString='${strictnessString}'`);

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (usfmELerror) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
    // console.log(`Using supplied extractLength=${extractLength} cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    // Now create the parser and run the check
    const ourUsfmParser = new grammar.USFMParser(fileText,
        strictnessString === 'relaxed' ? grammar.LEVEL.RELAXED : null);
    // Returns a Boolean indicating whether the input USFM text satisfies the grammar or not.
    // This method is available in both default and relaxed modes.
    // const parserResult = ourUsfmParser.validate();
    const parserResult = ourUsfmParser.toJSON()
    let parserMessages;
    parserMessages = parserResult._messages; // Throw away the JSON (if any)
    // console.log(`  Finished BCS USFM grammar check with messages: ${JSON.stringify(parserResult)}\n and warnings: ${JSON.stringify(ourUsfmParser.warnings)}.`);
    let parseError;
    parseError = parserMessages._error;
    // console.log(`  parseError: ${parseError}`);
    let ourErrorMessage, lineNumberString, characterIndex, extract;
    // NOTE: The following code is quite fragile
    //  as it depends on the precise format of the error message return from USFMParser
    let ourErrorObject = {};
    if (parseError) {
        const contextRE = /(\d+?)\s\|\s(.+)/g;
        for (const errorLine of parseError.split('\n')) {
            // console.log(`BCS errorLine=${errorLine}`);
            if (errorLine.startsWith('>')) {
                const regexResult = contextRE.exec(errorLine.substring(1).trim());
                // console.log(`  regexResult: ${JSON.stringify(regexResult)}`);
                if (regexResult) {
                    lineNumberString = regexResult[1];
                    extract = regexResult[2];
                }
            }
            else if (errorLine.endsWith('^')) {
                characterIndex = errorLine.indexOf('^') - 8;
                if (characterIndex < 0) characterIndex = 0; // Just in case
                if (extract.length)
                    extract = (characterIndex > halfLength ? '…' : '') + extract.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < extract.length ? '…' : '')
            }
            else ourErrorMessage = errorLine; // We only want the last one
        }
        // console.log(`  ourErrorMessage: '${ourErrorMessage}' lineNumberString=${lineNumberString} characterIndex=${characterIndex} extract='${extract}'`);
        // NOTE: \s5 fields are not valid USFM but we degrade the priority of those warnings
        ourErrorObject = {priority:extract==='\\s5'? 294:994, message:`USFMGrammar: ${ourErrorMessage}`, characterIndex, extract, location:`in line ${lineNumberString}${givenLocation}`};
    }

    const parseWarnings = parserResult._warnings ? parserResult._warnings : ourUsfmParser.warnings;
    // console.log(`  Warnings: ${JSON.stringify(parseWarnings)}`);
    let ourWarnings = [];
    for (const warningString of parseWarnings) {
        // console.log(`warningString: '${warningString}'`);
        // Clean up their warnings a little: Remove trailing spaces and periods
        let adjustedString = warningString.trim(); // Removes the trailing space
        if (adjustedString.endsWith('.')) adjustedString = adjustedString.substring(0, adjustedString.length - 1);
        ourWarnings.push(adjustedString);
    }

    return { isValidUSFM: !parseError, error: ourErrorObject, warnings: ourWarnings };
}
// end of runBCSGrammarCheck function


export function checkUSFMGrammar(bookID, strictnessString, filename, givenText, givenLocation, optionalCheckingOptions) {
    /*
    This function is only used for the demonstration pages -- not for the core!

    bookID is a three-character UPPERCASE USFM book identifier.

    filename parameter can be an empty string if we don't have one.

     Returns a result object containing a successList and a noticeList
     */
    console.log(`checkUSFMGrammar(${givenText.length.toLocaleString()} chars, '${location}')…`);
    console.assert(strictnessString === 'strict' || strictnessString === 'relaxed', `Unexpected strictnessString='${strictnessString}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (filename) ourLocation = ` in ${filename}${ourLocation}`;


    const cugResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkUSFMGrammar success: ${successString}`);
        cugResult.successList.push(successString);
    }
    function addNotice6to7({priority, message, lineNumber, characterIndex, extract, location}) {
        /**
        * @description - adds a new notice entry, adding bookID,C,V to the given fields
        * @param {Number} priority - notice priority from 1 (lowest) to 999 (highest)
        * @param {String} message - the text of the notice message
        * @param {Number} characterIndex - where the issue occurs in the line
        * @param {String} extract - short extract from the line centred on the problem (if available)
        * @param {String} location - description of where the issue is located
        */
        // console.log(`checkUSFMGrammar notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cUSFMgr addNotice6to7: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cUSFMgr addNotice6to7: 'priority' parameter should be a number not a '${typeof priority}': ${priority}`);
        console.assert(message !== undefined, "cUSFMgr addNotice6to7: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cUSFMgr addNotice6to7: 'message' parameter should be a string not a '${typeof message}': ${message}`);
        // console.assert(characterIndex !== undefined, "cUSFMgr addNotice6to7: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `cUSFMgr addNotice6to7: 'characterIndex' parameter should be a number not a '${typeof characterIndex}': ${characterIndex}`);
        // console.assert(extract !== undefined, "cUSFMgr addNotice6to7: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `cUSFMgr addNotice6to7: 'extract' parameter should be a string not a '${typeof extract}': ${extract}`);
        console.assert(location !== undefined, "cUSFMgr addNotice6to7: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cUSFMgr addNotice6to7: 'location' parameter should be a string not a '${typeof location}': ${location}`);
        cugResult.noticeList.push({priority,message, bookID,lineNumber, characterIndex,extract, location});
    }


    // Main code for checkUSFMGrammar function
    if (books.isExtraBookID(bookID)) // doesn't work for these
        return cugResult;

    const grammarCheckResult = runBCSGrammarCheck(strictnessString, givenText, ourLocation, optionalCheckingOptions);
    // console.log(`grammarCheckResult=${JSON.stringify(grammarCheckResult)}`);

    if (!grammarCheckResult.isValidUSFM)
        addNotice6to7({priority:944, message:`USFM3 Grammar Check (${strictnessString} mode) doesn't pass`, location:ourLocation});

    // We only get one error if it fails
    if (grammarCheckResult.error && grammarCheckResult.error[0])
        addNotice6to7({priority:grammarCheckResult.error.priority, message:grammarCheckResult.error.message,
            characterIndex:grammarCheckResult.error.characterIndex, extract:grammarCheckResult.error.extract,
            location:grammarCheckResult.error.location});

    // Display these warnings but with a lowish priority
    for (const warningString of grammarCheckResult.warnings)
        addNotice6to7({priority:101, message:`USFMGrammar: ${warningString}`, location:ourLocation});

    addSuccessMessage(`Checked USFM Grammar (${strictnessString} mode) ${grammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN'T validate)"}`);
    // console.log(`  checkUSFMGrammar returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log(`checkUSFMGrammar result is ${JSON.stringify(result)}`);
    return cugResult;
}
// end of checkUSFMGrammar function


export default checkUSFMGrammar;
