import * as books from '../core';
import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const checkerVersionString = '0.0.5';
const MAX_SIMILAR_MESSAGES = 3;


const INTRO_LINE_START_MARKERS = ['id', 'usfm', 'ide', 'h', 'toc1', 'toc2', 'toc3', 'mt', 'mt1', 'mt2'];
const CV_MARKERS = ['c', 'v'];
const HEADING_MARKERS = ['s', 's1', 's2', 's3', 's4', 'r', 'd'];
const PARAGRAPH_MARKERS = ['p', 'q', 'q1', 'q2', 'q3', 'q4', 'm', 'pi', 'pi1'];
const NOTE_MARKERS = ['f', 'x'];
const SPECIAL_MARKERS = ['w', 'zaln-s', 'k-s'];
const MILESTONE_MARKERS = ['ts-s','ts-e','ts\\*', 'k-e\\*']; // Is this a good way to handle it???
const ALLOWED_LINE_START_MARKERS = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_MARKERS)
    .concat(CV_MARKERS).concat(PARAGRAPH_MARKERS)
    .concat(NOTE_MARKERS).concat(SPECIAL_MARKERS).concat(MILESTONE_MARKERS);
const DEPRECATED_MARKERS = ['h1', 'h2', 'h3', 'h4', 'pr', 'ph', 'ph1', 'ph2', 'ph3', 'ph4', 'addpn', 'pro', 'fdc', 'xdc'];
const MARKERS_WITHOUT_CONTENT = ['b'].concat(MILESTONE_MARKERS);
const MARKERS_WITH_COMPULSORY_CONTENT = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_MARKERS)
    .concat(CV_MARKERS).concat(NOTE_MARKERS).concat(SPECIAL_MARKERS);


function checkUSFMText(BBB, tableText, location) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList, errorList, warningList
     */
    console.log("checkUSFMText(" + BBB + ", " + tableText.length + ", " + location + ")…");
    if (location[0] != ' ') location = ' ' + location;

    let result = { successList: [], errorList: [], warningList: [] };
    let suppressedErrorCount = 0, suppressedWarningCount = 0;

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        result.successList.push(successString);
    }
    function addError(message, index, extract, location) {
        console.log("tfc ERROR: " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        let similarCount = 0;
        result.errorList.forEach((errMsg) => { if (errMsg[0].startsWith(message)) similarCount += 1 });
        if (similarCount < MAX_SIMILAR_MESSAGES)
            // result.errorList.push(message + (index > 0 ? " (at character " + index+1 + ")" : "") + (extract ? " " + extract : "") + location);
            result.errorList.push([message, index, extract, location]);
        else if (similarCount == MAX_SIMILAR_MESSAGES)
            result.errorList.push([`${message}  ◄ MORE SIMILAR ERRORS SUPPRESSED`, -1, "", ""]);
        else suppressedErrorCount += 1;
    }
    function addWarning(message, index, extract, location) {
        console.log("tfc Warning: " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        let similarCount = 0;
        result.warningList.forEach((warningMsg) => { if (warningMsg[0].startsWith(message)) similarCount += 1 });
        if (similarCount < MAX_SIMILAR_MESSAGES)
            // result.warningList.push(message + (index > 0 ? " (at character " + index+1 + ")" : "") + (extract ? " " + extract : "") + location);
            result.warningList.push([message, index, extract, location]);
        else if (similarCount == MAX_SIMILAR_MESSAGES)
            result.warningList.push([`${message}  ◄ MORE SIMILAR WARNINGS SUPPRESSED`, -1, "", ""]);
        else suppressedWarningCount += 1;
    }

    function doOurBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global error and warning lists

        const resultObject = doBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation)
        for (let errorEntry of resultObject.errorList)
            addError(errorEntry[0], errorEntry[1], errorEntry[2], errorEntry[3]);
        for (let warningEntry of resultObject.warningList)
            addWarning(warningEntry[0], warningEntry[1], warningEntry[2], warningEntry[3]);
    }
    // end of doOurBasicTextChecks function

    function checkUSFMLineContents(marker, rest, lineLocation) {

        if (ALLOWED_LINE_START_MARKERS.indexOf(marker) >= 0) {
            if (rest) {
                if (MARKERS_WITHOUT_CONTENT.indexOf(marker) >= 0)
                    if (isWhitespace(rest))
                        addWarning(`Unexpected whitespace '${rest}'`, 1, "", ` after \\${marker} marker${lineLocation}`);
                    else
                        addError(`Unexpected content '${rest}'`, ` after \\${marker} marker${lineLocation}`);
                else if (rest[0] == ' ') {
                    let extract = rest.substring(0, 10).replace(/ /g, '␣');
                    if (rest.length > 10) extract += '…';
                    if (isWhitespace(rest))
                        addWarning(`Found only whitespace with \\${marker}`, marker.length, "", ` being '${extract}'${lineLocation}`);
                    else
                        addWarning(`Unexpected leading space(s) for \\${marker}`, marker.length, "", ` with '${extract}'${lineLocation}`);
                }
                doOurBasicTextChecks(marker, rest, [], lineLocation);
            } else { // nothing following the marker
                if (MARKERS_WITH_COMPULSORY_CONTENT.indexOf(marker) >= 0)
                    addError("Expected compulsory content", marker.length, "", ` after \\${marker} marker${lineLocation}`);
            }
        } else {
            addError(`Unexpected '${marker}' marker at start of line`, marker.length, "", lineLocation);
            if (rest) doOurBasicTextChecks(marker, rest, [], lineLocation);
        }
    }
    // end of checkUSFMLine function


    // if (ALLOWED_BBBs.indexOf(BBB) == -1)
    let bbb = BBB.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    }
    catch {
        addError("Bad function call: should be given a valid book abbreviation", -1, BBB, " (not '" + BBB + "')" + location);
    }

    let lines = tableText.split('\n');
    console.log("  '" + location + "' has " + lines.length.toLocaleString() + " total lines");

    let lastB = '', lastC = '', lastV = '', C = '0', V = '0';
    let numVersesThisChapter = 0;
    for (let n = 1; n <= lines.length; n++) {
        let line = lines[n - 1];
        if (C == '0') V = n.toString();
        let atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + location;
        // console.log("line '"+ line+"'"+ atString);
        if (!line) {
            // addWarning("Unexpected blank line" + atString);
            continue;
        }
        if (line.indexOf('\r') >= 0)
            addError("Unexpected carriageReturn character", atString);
        if (line[0] != '\\')
            addError("Expected line to start with backslash not '" + line[0] + "'", atString);

        let marker = line.substring(1).split(' ', 1)[0];
        let rest = line.substring(marker.length + 2)
        // console.log("Line " + n + ": marker='" + marker + "' rest='" + rest + "'");

        if (marker == 'c') {
            C = rest; V = '0';
            try {
                let intC = C.tiI
            } catch (e) {

            }
        } else if (marker == 'v') {
            V = (rest) ? rest.split(' ', 1)[0] : '?';
        }
        atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + location;

        if (marker == 'id' && !rest.startsWith(BBB))
            addError("Expected \\id line to start with book code", 4, rest.substring(0, 4), atString);

        // Do general checks
        checkUSFMLineContents(marker, rest, atString);
        lastC = C; lastV = V;
    }

    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data lines in '${location}'.`)
    if (result.errorList || result.warningList)
        addSuccessMessage(`checkTN_TSVText v${checkerVersionString} finished with ${result.errorList.length.toLocaleString()} errors and ${result.warningList.length.toLocaleString()} warnings`)
    else
        addSuccessMessage("No errors or warnings found by checkTN_TSVText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} successes, ${result.errorList.length.toLocaleString()} errors, ${result.warningList.length.toLocaleString()} warnings.`);
    console.log("checkTN_TSVText result is", JSON.stringify(result));
    return result;
}
// end of checkUSFMText function


export default checkUSFMText;
