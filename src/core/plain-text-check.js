import checkTextField from './field-text-check';
import { isWhitespace, countOccurrences } from './text-handling-functions'


const PLAIN_TEXT_VALIDATOR_VERSION_STRING = '0.2.1';

const DEFAULT_EXTRACT_LENGTH = 10;


function checkPlainText(textName, plainText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire text, i.e., all lines.
        It is used in checkFileContents() in book-package-check.js

     Returns a result object containing a successList and a noticeList
     */
    // console.log(`checkPlainText(${textName}, (${plainText.length} chars), ${givenLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (ptcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
    // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const cptResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkPlainText success: ${successString}`);
        cptResult.successList.push(successString);
    }
    function addNotice(noticeObject) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // console.log(`checkPlainText notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "cPT addNotice: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cPT addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cPT addNotice: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cPT addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cPT addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract!==undefined, "cPT addNotice: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cPT addNotice: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cPT addNotice: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cPT addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        cptResult.noticeList.push(noticeObject);
    }

    function ourCheckTextField(lineNumber, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {String} fieldName - name of the field being checked
        * @param {String} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {String} optionalFieldLocation - description of where the field is located
        * @param {Object} optionalCheckingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cPT ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(lineNumber !== undefined, "cPT ourCheckTextField: 'lineNumber' parameter should be defined");
        console.assert(typeof lineNumber === 'number', `cPT ourCheckTextField: 'fieldName' parameter should be a number not a '${typeof lineNumber}'`);
        console.assert(fieldText !== undefined, "cPT ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cPT ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cPT ourCheckTextField: allowedLinks parameter must be either true or false");

        const resultObject = checkTextField('', fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

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

        // console.log(`checkPlainLineContents for '${lineName}', '${lineText}' at${lineLocation}`);
        let thisText = lineText.trimStart(); // So we don't get "leading space" and "doubled spaces" errors

        if (thisText)
            ourCheckTextField(lineNumber, thisText, false, lineLocation, optionalCheckingOptions);
    }
    // end of checkPlainLine function


    // Main code for checkPlainText function
    if (isWhitespace(plainText)) {
        addNotice({ priority: 638, message: "Only found whitespace", location: ourLocation });
        return cptResult;
    }

    const lines = plainText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    // let headerLevel = 0;
    // let lastNumLeadingSpaces = 0;
    // let lastLineContents;
    // While checking individual lines,
    //  checking nested markers (so that we can give the line number in the notice)
    const openers = '[({<⟨“‹«';
    const closers = '])}>⟩”›»';
    const openMarkers = [];
    for (let n = 1; n <= lines.length; n++) {

        const line = lines[n - 1];
        if (line) {
            checkPlainLineContents(n, line, ourLocation);

            // Check for nested brackets and quotes, etc.
            for (let x = 0; x < line.length; x++) {
                const char = line[x];
                let which;
                if (openers.indexOf(char) >= 0) {
                    // console.log(`Saving ${openMarkers.length} '${char}' ${n} ${x}`);
                    openMarkers.push({ char, n, x });
                } else if ((which = closers.indexOf(char)) >= 0) {
                    // console.log(`Found '${char}' ${n} ${x}`);
                    // console.log(`Which: ${which} '${openers.charAt(which)}'`)
                    const [lastEntry] = openMarkers.slice(-1);
                    // console.log(`  Recovered lastEntry=${JSON.stringify(lastEntry)}`);
                    // console.log(`  Comparing found '${char}' with (${which}) '${openers.charAt(which)}' from '${lastEntry.char}'`);
                    if (lastEntry.char === openers.charAt(which)) {
                        // console.log(`  Matched '${char}' with  '${openers.charAt(which)}' ${n} ${x}`);
                        openMarkers.pop();
                    } else {
                        const extract = (x > halfLength ? '…' : '') + line.substring(x - halfLength, x + halfLengthPlus).replace(/ /g, '␣') + (x + halfLengthPlus < line.length ? '…' : '')
                        const details = `'${openMarkers[which]}' opened on line ${lastEntry.n} character ${lastEntry.x + 1}`;
                        addNotice({ priority: 777, message: "Mismatched characters", details, lineNumber: n, characterIndex: x, extract, location: ourLocation });
                        console.log(`  ERROR: mismatched characters: ${details}`);
                    }
                }

            }
        } else {
            // This is a blank line
        }

        // lastLineContents = line;
    }

    let characterIndex;
    if ((characterIndex = plainText.indexOf('<<<<<<<')) >= 0) {
        const iy = characterIndex + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + plainText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < plainText.length ? '…' : '')
        addNotice({ priority: 993, message: "Unresolved GIT conflict", characterIndex, extract, location: ourLocation });
    } else if ((characterIndex = plainText.indexOf('=======')) >= 0) {
        const iy = characterIndex + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + plainText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < plainText.length ? '…' : '')
        addNotice({ priority: 992, message: "Unresolved GIT conflict", characterIndex, extract, location: ourLocation });
    } else if ((characterIndex = plainText.indexOf('>>>>>>>>')) >= 0) {
        const iy = characterIndex + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + plainText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < plainText.length ? '…' : '')
        addNotice({ priority: 991, message: "Unresolved GIT conflict", characterIndex, extract, location: ourLocation });
    }

    // Check matched pairs in the entire file
    for (const punctSet of [['[', ']'], ['(', ')'], ['{', '}'],
    ['<', '>'], ['⟨', '⟩'], ['“', '”'],
    ['‹', '›'], ['«', '»'], ['**_', '_**']]) {
        // Can't check '‘’' coz they might be used as apostrophe
        const leftChar = punctSet[0], rightChar = punctSet[1];
        const leftCount = countOccurrences(plainText, leftChar);
        const rightCount = countOccurrences(plainText, rightChar);
        if (leftCount !== rightCount)
            // NOTE: These are lower priority than similar checks in a field
            //          since they occur only within the entire file
            addNotice({ priority: leftChar === '“' ? 162 : 462, message: `Mismatched ${leftChar}${rightChar} characters`, details: `(left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()})`, location: ourLocation });
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (cptResult.noticeList)
        addSuccessMessage(`checkPlainText v${PLAIN_TEXT_VALIDATOR_VERSION_STRING} finished with ${cptResult.noticeList.length ? cptResult.noticeList.length.toLocaleString() : "zero"} notice${cptResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkPlainText v${PLAIN_TEXT_VALIDATOR_VERSION_STRING}`)
    // console.log(`  checkPlainText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkPlainText result is", JSON.stringify(result));
    return cptResult;
}
// end of checkPlainText function


export default checkPlainText;
