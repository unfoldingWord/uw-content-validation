// const grammar = require('usfm-grammar');
import grammar from 'usfm-grammar';

import * as books from '../core';
import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';
import doBasicFileChecks from './basic-file-check';


const USFM_VALIDATOR_VERSION = '0.1.0';

const DEFAULT_EXTRACT_LENGTH = 10;

const INTRO_LINE_START_MARKERS = ['id', 'usfm', 'ide', 'h',
    'toc1', 'toc2', 'toc3', 'mt', 'mt1', 'mt2'];
const CV_MARKERS = ['c', 'v'];
const HEADING_TYPE_MARKERS = ['s', 's1', 's2', 's3', 's4', 'r', 'd', 'rem', 'sp', 'qs'];
const PARAGRAPH_MARKERS = ['p', 'q', 'q1', 'q2', 'q3', 'q4', 'm',
    'pi', 'pi1', 'pi2', 'pi3', 'pi4', 'li', 'li1', 'li2', 'li3', 'li4'];
const NOTE_MARKERS = ['f', 'x'];
const SPECIAL_MARKERS = ['w', 'zaln-s', 'k-s'];
const MILESTONE_MARKERS = ['ts-s', 'ts-e', 'ts\\*', 'k-e\\*']; // Is this a good way to handle it???
const ALLOWED_LINE_START_MARKERS = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(CV_MARKERS).concat(PARAGRAPH_MARKERS)
    .concat(NOTE_MARKERS).concat(SPECIAL_MARKERS).concat(MILESTONE_MARKERS);
const DEPRECATED_MARKERS = ['h1', 'h2', 'h3', 'h4', 'pr',
    'ph', 'ph1', 'ph2', 'ph3', 'ph4', 'addpn', 'pro', 'fdc', 'xdc'];
const MARKERS_WITHOUT_CONTENT = ['b'].concat(MILESTONE_MARKERS);
const MARKERS_WITH_COMPULSORY_CONTENT = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(CV_MARKERS).concat(NOTE_MARKERS).concat(SPECIAL_MARKERS);


function checkUSFMText(BBB, filename, givenText, location, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

    filename parameter can be an empty string if we don't have one.

     Returns a result object containing a successList and a warningList
     */
    // console.log("checkUSFMText(" + BBB + ", " + givenText.length.toLocaleString() + " chars, '" + location + "')…");
    let ourLocation = location;
    if (ourLocation[0] != ' ') ourLocation = ' ' + ourLocation;
    if (filename) ourLocation = ` in ${filename}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (e) { }
    if (typeof extractLength != 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log("Using default extractLength=" + extractLength);
    }
    // else
    //     console.log("Using supplied extractLength=" + extractLength, "cf. default="+DEFAULT_EXTRACT_LENGTH);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log("Using halfLength=" + halfLength, "halfLengthPlus="+halfLengthPlus);

    let result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log("checkUSFMText success: " + successString);
        result.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        // console.log("checkUSFMText notice: (priority="+priority+") "+message+(index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority !== undefined, "cUSFM addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "cUSFM addNotice: 'priority' parameter should be a number not a '" + (typeof priority) + "': " + priority);
        console.assert(message !== undefined, "cUSFM addNotice: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "cUSFM addNotice: 'message' parameter should be a string not a '" + (typeof message) + "': " + message);
        console.assert(index !== undefined, "cUSFM addNotice: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "cUSFM addNotice: 'index' parameter should be a number not a '" + (typeof index) + "': " + index);
        console.assert(extract !== undefined, "cUSFM addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "cUSFM addNotice: 'extract' parameter should be a string not a '" + (typeof extract) + "': " + extract);
        console.assert(location !== undefined, "cUSFM addNotice: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "cUSFM addNotice: 'location' parameter should be a string not a '" + (typeof location) + "': " + location);
        result.noticeList.push([priority, message, index, extract, location]);
    }


    function doOurBasicTextChecks(fieldName, fieldText, allowedLinks, fieldLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cUSFM doOurBasicTextChecks(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(fieldName !== undefined, "cUSFM doOurBasicTextChecks: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', "cUSFM doOurBasicTextChecks: 'fieldName' parameter should be a string not a '" + (typeof fieldName) + "'");
        console.assert(fieldText !== undefined, "cUSFM doOurBasicTextChecks: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', "cUSFM doOurBasicTextChecks: 'fieldText' parameter should be a string not a '" + (typeof fieldText) + "'");
        console.assert(allowedLinks === true || allowedLinks === false, "cUSFM doOurBasicTextChecks: allowedLinks parameter must be either true or false");

        const resultObject = doBasicTextChecks(fieldName, fieldText, allowedLinks, fieldLocation, optionalCheckingOptions);

        // Process results line by line to filter out potential false positives
        //  for this particular kind of text field
        for (let noticeEntry of resultObject.noticeList)
            if (!noticeEntry[1].startsWith("Mismatched () characters") // 663 Mismatched left/right chars -- suppress these misleading warnings coz open quote can occur in one verse and close in another
                && !noticeEntry[1].startsWith("Mismatched [] characters")
                && (!noticeEntry[1].startsWith("Unexpected doubled , characters") || fieldText.indexOf('x-morph') < 0)
            )
                addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
    }
    // end of doOurBasicTextChecks function


    function doOurBasicFileChecks(filename, fileText, fileLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        console.assert(filename !== undefined, "cUSFM doOurBasicFileChecks: 'filename' parameter should be defined");
        console.assert(typeof filename === 'string', "cUSFM doOurBasicFileChecks: 'filename' parameter should be a string not a '" + (typeof filename) + "'");
        console.assert(fileText !== undefined, "cUSFM doOurBasicFileChecks: 'fileText' parameter should be defined");
        console.assert(typeof fileText === 'string', "cUSFM doOurBasicFileChecks: 'fileText' parameter should be a string not a '" + (typeof fileText) + "'");

        const resultObject = doBasicFileChecks(filename, fileText, fileLocation, optionalCheckingOptions);

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        result.noticeList = result.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging or filtering
        //  process results line by line
        // for (let noticeEntry of resultObject.noticeList)
        //     addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
    }
    // end of doOurBasicFileChecks function


    function checkUSFMCharacterFields(filename, fileText, fileLocation) {
        // Check matched pairs
        for (let punctSet of [
            // Character formatting
            ['\\add ', '\\add*'], ['\\addpn ', '\\addpn*'],
            ['\\bd ', '\\bd*'], ['\\bdit ', '\\bdit*'],
            ['\\bk ', '\\bk*'],
            ['\\dc ', '\\dc*'],
            ['\\em ', '\\em*'],
            ['\\fig ', '\\fig*'],
            ['\\it ', '\\it*'],
            ['\\k ', '\\k*'],
            ['\\nd ', '\\nd*'], ['\\ndx ', '\\ndx*'],
            ['\\no ', '\\no*'],
            ['\\ord ', '\\ord*'],
            ['\\pn ', '\\pn*'],
            ['\\pro ', '\\pro*'],
            ['\\qt ', '\\qt*'],
            ['\\sc ', '\\sc*'],
            ['\\sig ', '\\sig*'],
            ['\\sls ', '\\sls*'],
            ['\\tl ', '\\tl*'],
            ['\\w ', '\\w*'],
            ['\\wg ', '\\wg*'], ['\\wh ', '\\wh*'],
            ['\\wj ', '\\wj*'],

            ['\\ca ', '\\ca*'], ['\\va ', '\\va*'],

            ['\\f ', '\\f*'], ['\\x ', '\\x*'],
        ]) {
            const opener = punctSet[0], closer = punctSet[1];
            const lCount = countOccurrences(fileText, opener);
            const rCount = countOccurrences(fileText, closer);
            if (lCount != rCount)
                addNotice(873, "Mismatched " + opener + closer + " fields", -1, "(left=" + lCount.toLocaleString() + ", right=" + rCount.toLocaleString() + ")", fileLocation);
        }
    }


    function runBCSGrammarCheck(filename, fileText, fileLocation) {
        // Runs the BCS USFM Grammar checker
        //  which can be quite time-consuming on large, complex USFM files
        console.log("Running BCS USFM grammar check (can take quite a while for a large book)…");
        const ourUsfmParser = new grammar.USFMParser(fileText); // Optional 2nd parameter is grammar.LEVEL.RELAXED
        // Returns a Boolean indicating whether the input USFM text satisfies the grammar or not.
        // This method is available in both default and relaxed modes.
        const isValidUSFM = ourUsfmParser.validate();
        console.log(`  Finished BCS USFM grammar check with ${isValidUSFM} and ${ourUsfmParser.warnings.length} warnings.`);
        if (!isValidUSFM)
            addNotice(944, "USFM3 Grammar Check doesn't pass", -1, "", fileLocation);
        console.log("  Warnings:", JSON.stringify(ourUsfmParser.warnings));
        // Display these warnings but with a lower priority
        for (let warningString of ourUsfmParser.warnings)
            if (!warningString.startsWith("Empty lines present") // we allow empty lines in our USFM
                && !warningString.startsWith("Trailing spaces present at line end") // we find these ourselves
            ) {
                let adjustedString = warningString.trim()
                addNotice(50, "USFMGrammar found: " + adjustedString, -1, "", fileLocation);
            }
        // return { isValidUSFM: isValidUSFM, warnings: [...ourUsfmParser.warnings] };
    }


    function checkUSFMFileContents(filename, fileText, fileLocation) {
        // Does global checks on the file
        // Note: These run the risk of duplicating messages that are found within individual lines.
        //          However, it's common in USFM for parentheses to open '(' in one verse
        //                      and close ')' in another. So the USFM line check can't check that.
        //          Also, the USFM v3.0 spec seems to allow/require whitespace reduction,
        //              i.e., newLines can conceivably appear WITHIN a footnote for example.

        // Check markers like \add ... \add*, \f .. \f*
        checkUSFMCharacterFields(filename, fileText, fileLocation)

        // Now do the general global checks (e.g., for general punctuation)
        doOurBasicFileChecks(filename, fileText, fileLocation);
    }
    // end of checkUSFMFileContents function


    function checkUSFMLineInternals(marker, rest, lineLocation, optionalCheckingOptions) {
        // Handles character formatting within the line contents
        let adjustedRest = rest;

        if (marker == 'c' && isNaN(rest))
            addNotice(822, "Expected \\c field to contain an integer", 3, '\\c ' + rest, lineLocation);
        if (marker == 'v') {
            let Vstr = (rest) ? rest.split(' ', 1)[0] : '?';
            if (isNaN(Vstr) && Vstr.indexOf('-') < 0)
                addNotice(822, "Expected \\v field to contain an integer", 3, '\\v ' + rest, lineLocation);
        }
        const allowedLinks = (marker == 'w' || marker == 'k-s' || marker == 'SPECIAL1')
            // (because we don't know what marker SPECIAL1 is, so default to "no false alarms")
            && rest.indexOf('x-tw') >= 0;
        if (rest) doOurBasicTextChecks('\\' + marker, rest, allowedLinks, ' field ' + lineLocation, optionalCheckingOptions);
    }
    // end of checkUSFMLineInternals function


    function checkUSFMLineContents(marker, rest, lineLocation) {
        // Looks at the marker and determines what content is allowed/expected on the rest of the line
        // 'SPECIAL1' is used internally here when a character other than a backslash starts a line
        if (ALLOWED_LINE_START_MARKERS.indexOf(marker) >= 0 || marker == 'SPECIAL1') {
            if (rest && MARKERS_WITHOUT_CONTENT.indexOf(marker) >= 0)
                if (isWhitespace(rest))
                    addNotice(301, `Unexpected whitespace '${rest}'`, 1, "", ` after \\${marker} marker${lineLocation}`);
                else
                    addNotice(401, `Unexpected content '${rest}'`, ` after \\${marker} marker${lineLocation}`);
            else if (MARKERS_WITH_COMPULSORY_CONTENT.indexOf(marker) >= 0 && !rest)
                addNotice(711, "Expected compulsory content", marker.length, "", ` after \\${marker} marker${lineLocation}`);
        } else // it's not a recognised line marker
            // Lower priority of deprecated \s5 markers (compared to all other unknown markers)
            addNotice(marker == 's5' ? 611 : 811, `Unexpected '\\${marker}' marker at start of line`, 1, "", lineLocation);
        if (rest) checkUSFMLineInternals(marker, rest, lineLocation);
    }
    // end of checkUSFMLineContents function


    function mainUSFMCheck(BBB, filename, givenText, location) {
        console.log("Running mainUSFMCheck() (can take quite a while for a large book)…");
        let bbb = BBB.toLowerCase();
        let numChaptersThisBook = 0;
        try {
            numChaptersThisBook = books.chaptersInBook(bbb).length;
        }
        catch {
            addNotice(900, "Bad function call: should be given a valid book abbreviation", -1, BBB, " (not '" + BBB + "')" + ourLocation);
        }

        let lines = givenText.split('\n');
        // console.log("  '" + location + "' has " + lines.length.toLocaleString() + " total lines");

        let lastB = '', lastC = '', lastV = '', C = '0', V = '0';
        let lastIntC = 0, lastIntV = 0;
        let numVersesThisChapter = 0;
        let lastMarker = '', lastRest = '';
        for (let n = 1; n <= lines.length; n++) {
            let line = lines[n - 1];
            if (C === '0') V = n.toString();
            let atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + ourLocation;
            // console.log("line '"+line+"'"+ atString);
            if (!line) {
                // addNotice(100, "Unexpected blank line", 0, '', atString);
                continue;
            }
            if (line.indexOf('\r') >= 0)
                addNotice(703, "Unexpected carriageReturn character", atString);

            let marker, rest;
            if (line[0] === '\\') {
                marker = line.substring(1).split(' ', 1)[0];
                rest = line.substring(marker.length + 2); // Skip backslash, marker, and space after marker
                // console.log("Line " + n + ": marker='" + marker + "' rest='" + rest + "'");
            } else { // Line didn't start with a backslash
                if (location.indexOf('ugnt') < 0) {
                    // NOTE: Some USFM Bibles commonly have this
                    //          so it's not necessarily either an error or a warning
                    addNotice(980, "Expected line to start with backslash", 0, line[0], atString);
                    marker = 'rem'; // to try to avoid consequential errors, but the rest of the line won't be checked
                } else { // How do we handle an allowed line that doesn't start with a backslash?
                    // Can't use 'rem' because we want the rest of the line checked
                    marker = 'SPECIAL1'; // Handle as a special case
                }
                rest = line;
            }

            // Handle C/V numbers including verse bridges
            let intC, intV;
            if (marker === 'c') {
                C = rest; V = '0';
                try {
                    intC = parseInt(C);
                } catch (e) {
                    addNotice(724, "Unable to convert chapter number to integer", 3, rest.substring(0, 5), atString);
                    intC = -999; // Used to prevent consequential errors
                }
                if (C == lastC || (intC > 0 && intC != lastIntC + 1))
                    addNotice(764, "Chapter number didn't increment correctly", 3, rest.substring(0, 5) + ' (' + (lastC ? lastC : '0') + ' → ' + C + ')', atString);
                lastC = C; lastV = '0';
                lastIntC = intC; lastIntV = 0;
            } else if (marker === 'v') {
                // if (rest.length < 8)
                //     addNotice(664, "Verse line seems too short", rest.length-1, rest, atString);
                V = (rest) ? rest.split(' ', 1)[0] : '?';
                if (V.indexOf('-') < 0) { // no hyphen -> no verse bridge
                    try {
                        intV = parseInt(V);
                    } catch (e) {
                        addNotice(723, "Unable to convert verse number to integer", 3, rest.substring(0, 5), atString);
                        intV = -999; // Used to prevent consequential errors
                    }
                    if (V == lastV || (intV > 0 && intV != lastIntV + 1))
                        addNotice(763, "Verse number didn't increment correctly", 3, rest.substring(0, 5) + ' (' + (lastV ? lastV : '0') + ' → ' + V + ')', atString);
                    lastV = V; lastIntV = intV;
                } else { // handle verse bridge
                    const bits = V.split('-');
                    const firstV = bits[0], secondV = bits[1];
                    let intFirstV, intSecondV;
                    try {
                        intFirstV = parseInt(firstV);
                        intSecondV = parseInt(secondV);
                    } catch (e) {
                        addNotice(762, "Unable to convert verse bridge numbers to integers", 3, rest.substring(0, Math.max(9, extractLength)), atString);
                        intFirstV = -999; intSecondV = -998; // Used to prevent consequential errors
                    }
                    if (intSecondV <= intFirstV)
                        addNotice(769, "Verse bridge numbers not in ascending order", 3, rest.substring(0, Math.max(9, extractLength)) + ' (' + firstV + ' → ' + secondV + ')', atString);
                    else if (firstV == lastV || (intFirstV > 0 && intFirstV != lastIntV + 1))
                        addNotice(765, "Bridged verse numbers didn't increment correctly", 3, rest.substring(0, Math.max(9, extractLength)) + ' (' + lastV + ' → ' + firstV + ')', atString);
                    lastV = secondV; lastIntV = intSecondV;
                }
            }
            atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + ourLocation;
            // console.log("Now"+atString);

            if (marker === 'id' && !rest.startsWith(BBB))
                addNotice(987, "Expected \\id line to start with book code", 4, rest.substring(0, Math.max(4, extractLength)), atString);

            // Check the order of markers
            // In headers
            if (marker == 'toc2' && lastMarker != 'toc1')
                addNotice(87, "Expected \\toc2 line to follow \\toc1", 1, "(not '" + lastMarker + "')", atString);
            else if (marker == 'toc3' && lastMarker != 'toc2')
                addNotice(87, "Expected \\toc3 line to follow \\toc2", 1, "(not '" + lastMarker + "')", atString);
            // In chapters
            else if ((PARAGRAPH_MARKERS.indexOf(marker) >= 0 || marker == 's5' || marker == 'ts\\*')
                && PARAGRAPH_MARKERS.indexOf(lastMarker) >= 0
                && !lastRest)
                addNotice(399, "Useless paragraph marker", 1, "('" + lastMarker + "' before '" + marker + "')", atString);

            // Do general checks
            checkUSFMLineContents(marker, rest, atString);

            lastMarker = marker; lastRest = rest;
        }

        // Do overall global checks of the entire text
        checkUSFMFileContents(filename, givenText, ourLocation) // Do this last so the results are lower in the lists

        addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line(s) in '${ourLocation}'`)
        if (result.noticeList.length)
            addSuccessMessage(`checkUSFMText v${USFM_VALIDATOR_VERSION} finished with ${result.noticeList.length.toLocaleString()} notice(s)`)
        else
            addSuccessMessage("No errors or warnings found by checkUSFMText v" + USFM_VALIDATOR_VERSION)
    }

    /*function runSlowTask(which) {
        // Ideally these should be run in parallel using multiprocessing
        //  See https://hackernoon.com/multithreading-multiprocessing-and-the-nodejs-event-loop-5b2929bd450b
        console.log(`runSlowTask(${which})`)
        return (which == 1)
            ? mainUSFMCheck(BBB, filename, givenText, location)
            : runBCSGrammarCheck(filename, givenText, location);
    }
    // Main code for checkUSFMText()
    console.log("Starting USFM checking tasks…");
    const tasks = [1].map(runSlowTask);
    const allResults = await Promise.all(tasks);
    console.log(`  Finished all tasks with ${JSON.stringify(allResults)}.`);
    console.log("  Finished all tasks.");
    if (!allResults[1].isValidUSFM)
        addNotice(944, "USFM Grammar check fails", -1, "", location);
    console.log("  Warnings:", JSON.stringify(allResults[1].warnings));
    // Display these warnings but with a lower priority
    for (let warningString of allResults[1].warnings)
        addNotice(50, "USFMGrammar found: " + warningString.trim(), -1, "", location);
    */
    let allResults = [];
    allResults.push(mainUSFMCheck(BBB, filename, givenText, location));
    allResults.push(runBCSGrammarCheck(filename, givenText, location));
    console.assert(allResults.length === 2);
    // console.log("allResults", JSON.stringify(allResults));
    // if (!allResults[1].isValidUSFM)
    //     addNotice(944, "USFM Grammar check fails", -1, "", location);
    // console.log("  Warnings:", JSON.stringify(allResults[1].warnings));
    // // Display these warnings but with a lower priority
    // for (let warningString of allResults[1].warnings)
    //     addNotice(50, "USFMGrammar found: " + warningString.trim(), -1, "", location);

    console.log(`  checkUSFMText returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log(`checkUSFMText result is ${JSON.stringify(result)}`);
    return result;
}
// end of checkUSFMText function


export default checkUSFMText;
