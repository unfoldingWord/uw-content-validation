import * as books from '../core';
import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';


const checkerVersionString = '0.0.5';


const INTRO_LINE_START_MARKERS = ['id', 'usfm', 'ide', 'h',
    'toc1', 'toc2', 'toc3', 'mt', 'mt1', 'mt2'];
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


function checkUSFMText(BBB, tableText, location, optionalOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a warningList
     */
    console.log("checkUSFMText(" + BBB + ", " + tableText.length.toLocaleString() + " chars, '" + location + "')…");
    if (location[0] != ' ') location = ' ' + location;

    let result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        // console.log("USFM Notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        result.noticeList.push([priority, message, index, extract, location]);
    }


    function doOurBasicTextChecks(fieldName, fieldText, linkTypes, fieldLocation, optionalOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices

        const resultObject = doBasicTextChecks(fieldName, fieldText, linkTypes, fieldLocation, optionalOptions);
        for (let noticeEntry of resultObject.noticeList)
            addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
    }
    // end of doOurBasicTextChecks function


    function checkUSFMLineInternals(marker, rest, lineLocation, optionalOptions) {
        // Handles character formatting within the line contents
        let adjustedRest = rest;

        if (rest) doOurBasicTextChecks('\\' + marker, rest, [], ' field ' + lineLocation, optionalOptions);
        }
    // end of checkUSFMLineInternals function


    function checkUSFMLineContents(marker, rest, lineLocation) {
        // Looks at the marker and determines where content is allowed/expected on the line
        if (ALLOWED_LINE_START_MARKERS.indexOf(marker) >= 0) {
            if (rest && MARKERS_WITHOUT_CONTENT.indexOf(marker) >= 0)
                if (isWhitespace(rest))
                    addNotice(301, `Unexpected whitespace '${rest}'`, 1, "", ` after \\${marker} marker${lineLocation}`);
                else
                    addNotice(401, `Unexpected content '${rest}'`, ` after \\${marker} marker${lineLocation}`);
            else if (MARKERS_WITH_COMPULSORY_CONTENT.indexOf(marker) >= 0 && !rest)
                addNotice(711, "Expected compulsory content", marker.length, "", ` after \\${marker} marker${lineLocation}`);
        } else
            addNotice(marker=='s5'?611:811, `Unexpected \\'${marker}' marker at start of line`, marker.length, "", lineLocation);
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
        addNotice(900, "Bad function call: should be given a valid book abbreviation", -1, BBB, " (not '" + BBB + "')" + location);
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
            // addNotice(100, "Unexpected blank line", 0, '', atString);
            continue;
        }
        if (line.indexOf('\r') >= 0)
            addNotice(703, "Unexpected carriageReturn character", atString);

        let marker, rest;
        if (line[0] == '\\') {
            marker = line.substring(1).split(' ', 1)[0];
            rest = line.substring(marker.length + 2); // Skip backslash, marker, and space after marker
            // console.log("Line " + n + ": marker='" + marker + "' rest='" + rest + "'");
        } else { // Line didn't start with a backslash
            // NOTE: Some USFM Bibles commonly have this
            //          so it's not necessarily either an error or a warning
            addNotice(980, "Expected line to start with backslash", 0, line[0], atString);
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
                addNotice(724, "Unable to convert chapter number to integer", 3, rest.substring(0, 5), atString);
                intC = -999; // Used to prevent consequential errors
            }
            if (C == lastC || (intC > 0 && intC != lastIntC + 1))
                addNotice(764, "Chapter number didn't increment correctly", 3, rest.substring(0, 5) + ' (' + lastC + ' → ' + C + ')', atString);
            lastC = C; lastV = '0';
            lastIntC = intC; lastIntV = 0;
        } else if (marker == 'v') {
            V = (rest) ? rest.split(' ', 1)[0] : '?';
            if (V.indexOf('-') < 0) { // no hyphen -> no verse bridge
                try {
                    intV = parseInt(V);
                } catch (e) {
                    addNotice(723, "Unable to convert verse number to integer", 3, rest.substring(0, 5), atString);
                    intV = -999; // Used to prevent consequential errors
                }
                if (V == lastV || (intV > 0 && intV != lastIntV + 1))
                    addNotice(763, "Verse number didn't increment correctly", 3, rest.substring(0, 5) + ' (' + lastV + ' → ' + V + ')', atString);
                lastV = V; lastIntV = intV;
            } else { // handle verse bridge
                const bits = V.split('-');
                const firstV = bits[0], secondV = bits[1];
                let intFirstV, intSecondV;
                try {
                    intFirstV = parseInt(firstV);
                    intSecondV = parseInt(secondV);
                } catch (e) {
                    addNotice(762, "Unable to convert verse bridge numbers to integers", 3, rest.substring(0, 9), atString);
                    intFirstV = -999; intSecondV = -998; // Used to prevent consequential errors
                }
                if (intSecondV <= intFirstV)
                    addNotice(769, "Verse bridge numbers not in ascending order", 3, rest.substring(0, 9) + ' (' + firstV + ' → ' + secondV + ')', atString);
                else if (firstV == lastV || (intFirstV > 0 && intFirstV != lastIntV + 1))
                    addNotice(765, "Bridged verse numbers didn't increment correctly", 3, rest.substring(0, 9) + ' (' + lastV + ' → ' + firstV + ')', atString);
                lastV = secondV; lastIntV = intSecondV;
            }
        }
        atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + location;
        // console.log("Now"+atString);

        if (marker == 'id' && !rest.startsWith(BBB))
            addNotice(987, "Expected \\id line to start with book code", 4, rest.substring(0, 4), atString);

        // if (marker=='toc1'||marker=='toc2'||marker=='toc3')
        // Do general checks
        checkUSFMLineContents(marker, rest, atString);
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} lines in '${location}'`)
    if (result.noticeList.length)
        addSuccessMessage(`checkUSFMText v${checkerVersionString} finished with ${result.noticeList.length.toLocaleString()} notices`)
    else
        addSuccessMessage("No errors or warnings found by checkUSFMText v" + checkerVersionString)
    console.log(`  Returning with ${result.successList.length.toLocaleString()} successes and ${result.noticeList.length.toLocaleString()} notices.`);
    // console.log("checkUSFMText result is", JSON.stringify(result));
    return result;
}
// end of checkUSFMText function


export default checkUSFMText;
