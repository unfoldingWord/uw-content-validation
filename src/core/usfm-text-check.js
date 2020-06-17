import * as books from '../core';
import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const checkerVersionString = '0.0.5';
const MAX_SIMILAR_MESSAGES = 3;


const INTRO_LINE_START_MARKERS = ['id', 'usfm', 'ide', 'h',
    'toc1', 'toc22', 'toc3', 'mt', 'mt1', 'mt2'];
const CV_MARKERS = ['c', 'v'];
const HEADING_MARKERS = ['s', 's1', 's2', 's3', 's4', 'r', 'd', 'rem'];
const PARAGRAPH_MARKERS = ['p', 'q', 'q1', 'q2', 'q3', 'q4', 'm',
    'pi', 'pi1', 'pi2', 'pi3', 'pi4', 'li', 'li1', 'li2', 'li3', 'li4'];
const NOTE_MARKERS = ['f', 'x'];
const SPECIAL_MARKERS = ['w', 'zaln-s', 'k-s'];
const MILESTONE_MARKERS = ['ts-s', 'ts-e', 'ts\\*', 'k-e\\*']; // Is this a good way to handle it???
const ALLOWED_LINE_START_MARKERS = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_MARKERS)
    .concat(CV_MARKERS).concat(PARAGRAPH_MARKERS)
    .concat(NOTE_MARKERS).concat(SPECIAL_MARKERS).concat(MILESTONE_MARKERS);
const DEPRECATED_MARKERS = ['h1', 'h2', 'h3', 'h4', 'pr',
    'ph', 'ph1', 'ph2', 'ph3', 'ph4', 'addpn', 'pro', 'fdc', 'xdc'];
const MARKERS_WITHOUT_CONTENT = ['b'].concat(MILESTONE_MARKERS);
const MARKERS_WITH_COMPULSORY_CONTENT = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_MARKERS)
    .concat(CV_MARKERS).concat(NOTE_MARKERS).concat(SPECIAL_MARKERS);


function checkUSFMText(BBB, tableText, location) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList, errorList, warningList
     */
    console.log("checkUSFMText(" + BBB + ", " + tableText.length.toLocaleString() + " chars, '" + location + "')…");
    if (location[0] != ' ') location = ' ' + location;

    let result = { successList: [], errorList: [], warningList: [] };
    let suppressedErrorCount = 0, suppressedWarningCount = 0;

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        result.successList.push(successString);
    }
    function addError(message, index, extract, location) {
        // console.log("USFM ERROR: " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
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
        // console.log("USFM Warning: " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        let similarCount = 0;
        result.warningList.forEach((warningMsg) => { if (warningMsg[0].startsWith(message)) similarCount += 1 });
        if (similarCount < MAX_SIMILAR_MESSAGES)
            // result.warningList.push(message + (index > 0 ? " (at character " + index+1 + ")" : "") + (extract ? " " + extract : "") + location);
            result.warningList.push([message, index, extract, location]);
        else if (similarCount == MAX_SIMILAR_MESSAGES)
            result.warningList.push([`${message}  ◄ MORE SIMILAR WARNINGS SUPPRESSED`, -1, "", ""]);
        else suppressedWarningCount += 1;
    }


    function doOurBasicTextChecks(fieldName, fieldText, linkTypes, fieldLocation) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global error and warning lists

        const resultObject = doBasicTextChecks(fieldName, fieldText, linkTypes, fieldLocation)
        for (let errorEntry of resultObject.errorList)
            addError(errorEntry[0], errorEntry[1], errorEntry[2], errorEntry[3]);
        for (let warningEntry of resultObject.warningList)
            addWarning(warningEntry[0], warningEntry[1], warningEntry[2], warningEntry[3]);
    }
    // end of doOurBasicTextChecks function


    function checkUSFMLineInternals(marker, rest, lineLocation) {
        // Handles character formatting within the line contents
        let adjustedRest = rest;

        if (rest) doOurBasicTextChecks('\\' + marker, rest, [], ' field ' + lineLocation);
        }
    // end of checkUSFMLineInternals function


    function checkUSFMLineContents(marker, rest, lineLocation) {
        // Looks at the marker and determines where content is allowed/expected on the line
        if (ALLOWED_LINE_START_MARKERS.indexOf(marker) >= 0) {
            if (rest && MARKERS_WITHOUT_CONTENT.indexOf(marker) >= 0)
                if (isWhitespace(rest))
                    addWarning(`Unexpected whitespace '${rest}'`, 1, "", ` after \\${marker} marker${lineLocation}`);
                else
                    addError(`Unexpected content '${rest}'`, ` after \\${marker} marker${lineLocation}`);
            else if (MARKERS_WITH_COMPULSORY_CONTENT.indexOf(marker) >= 0 && !rest)
                addError("Expected compulsory content", marker.length, "", ` after \\${marker} marker${lineLocation}`);
        } else
            addError(`Unexpected \\'${marker}' marker at start of line`, marker.length, "", lineLocation);
        if (rest) checkUSFMLineInternals(marker, rest, lineLocation);
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
    let lastIntC = 0, lastIntV = 0;
    let numVersesThisChapter = 0;
    for (let n = 1; n <= lines.length; n++) {
        let line = lines[n - 1];
        if (C == '0') V = n.toString();
        let atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + location;
        // console.log("line '"+line+"'"+ atString);
        if (!line) {
            // addWarning("Unexpected blank line", 0, '', atString);
            continue;
        }
        if (line.indexOf('\r') >= 0)
            addError("Unexpected carriageReturn character", atString);

        let marker, rest;
        if (line[0] == '\\') {
            marker = line.substring(1).split(' ', 1)[0];
            rest = line.substring(marker.length + 2); // Skip backslash, marker, and space after marker
            // console.log("Line " + n + ": marker='" + marker + "' rest='" + rest + "'");
        } else { // Line didn't start with a backslash
            // NOTE: Some USFM Bibles commonly have this
            //          so it's not necessarily either an error or a warning
            addError("Expected line to start with backslash", 0, line[0], atString);
            marker = 'rem'; // to try to avoid consequential errors
            rest = line;
        }

        // Handle C/V numbers including verse bridges
        let intC, intV;
        if (marker == 'c') {
            C = rest; V = '0';
            try {
                intC = parseInt(C);
            } catch (e) {
                addError("Unable to convert chapter number to integer", 3, rest.substring(0, 5), atString);
                intC = -999; // Used to prevent consequential errors
            }
            if (C == lastC || (intC > 0 && intC != lastIntC + 1))
                addError("Chapter number didn't increment correctly", 3, rest.substring(0, 5) + ' (' + lastC + ' → ' + C + ')', atString);
            lastC = C; lastV = '0';
            lastIntC = intC; lastIntV = 0;
        } else if (marker == 'v') {
            V = (rest) ? rest.split(' ', 1)[0] : '?';
            if (V.indexOf('-') < 0) { // no hyphen -> no verse bridge
                try {
                    intV = parseInt(V);
                } catch (e) {
                    addError("Unable to convert verse number to integer", 3, rest.substring(0, 5), atString);
                    intV = -999; // Used to prevent consequential errors
                }
                if (V == lastV || (intV > 0 && intV != lastIntV + 1))
                    addError("Verse number didn't increment correctly", 3, rest.substring(0, 5) + ' (' + lastV + ' → ' + V + ')', atString);
                lastV = V; lastIntV = intV;
            } else { // handle verse bridge
                const bits = V.split('-');
                const firstV = bits[0], secondV = bits[1];
                let intFirstV, intSecondV;
                try {
                    intFirstV = parseInt(firstV);
                    intSecondV = parseInt(secondV);
                } catch (e) {
                    addError("Unable to convert verse bridge numbers to integers", 3, rest.substring(0, 9), atString);
                    intFirstV = -999; intSecondV = -998; // Used to prevent consequential errors
                }
                if (intSecondV <= intFirstV)
                    addError("Verse bridge numbers not in ascending order", 3, rest.substring(0, 9) + ' (' + firstV + ' → ' + secondV + ')', atString);
                else if (firstV == lastV || (intFirstV > 0 && intFirstV != lastIntV + 1))
                    addError("Bridged verse numbers didn't increment correctly", 3, rest.substring(0, 9) + ' (' + lastV + ' → ' + firstV + ')', atString);
                lastV = secondV; lastIntV = intSecondV;
            }
        }
        atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + location;
        // console.log("Now"+atString);

        if (marker == 'id' && !rest.startsWith(BBB))
            addError("Expected \\id line to start with book code", 4, rest.substring(0, 4), atString);

        // if (marker=='toc1'||marker=='toc2'||marker=='toc3')
        // Do general checks
        checkUSFMLineContents(marker, rest, atString);
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} lines in '${location}'`)
    if (result.errorList.length || result.warningList.length)
        addSuccessMessage(`checkUSFMText v${checkerVersionString} finished with ${result.errorList.length.toLocaleString()} errors and ${result.warningList.length.toLocaleString()} warnings`)
    else
        addSuccessMessage("No errors or warnings found by checkUSFMText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} successes, ${result.errorList.length.toLocaleString()} errors, ${result.warningList.length.toLocaleString()} warnings.`);
    // console.log("checkUSFMText result is", JSON.stringify(result));
    return result;
}
// end of checkUSFMText function


export default checkUSFMText;
