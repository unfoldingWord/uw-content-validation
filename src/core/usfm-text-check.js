import * as books from '../core';
import { isWhitespace, countOccurrences } from './text-handling-functions'
import doBasicTextChecks from './basic-text-check';
import doBasicFileChecks from './basic-file-check';
import { runUsfmJsCheck } from './usfm-js-check';
import { runBCSGrammarCheck } from './BCS-usfm-grammar-check';
import { ourParseInt, consoleLogObject } from './utilities';


const USFM_VALIDATOR_VERSION = '0.2.0';

const DEFAULT_EXTRACT_LENGTH = 10;


// See http://ubsicap.github.io/usfm/master/index.html
const INTRO_LINE_START_MARKERS = ['id', 'usfm', 'ide', 'h',
    'toc1','toc2','toc3',
    'mt','mt1','mt2',
    'mte','mte1','mte2',
    'imt','imt1','imt2',
    'is','is1','is2',
    'ip', 'ipi', 'im', 'imi', 'ipq', 'imq', 'ipr',
    'iq','iq1','iq2',
    'ili','ili1','ili2',
    'iot', 'io','io1','io2',
    'iex', 'imte','imte1','imte2'];
const CV_MARKERS = ['c','v', 'ca','va'];
const HEADING_TYPE_MARKERS = ['s','s1','s2','s3','s4', 'sr',
    'ms','ms1', 'mr',
    'r', 'd', 'rem', 'sp', 'qs', 'cl',
    'sd','sd1','sd2'];
const PARAGRAPH_MARKERS = ['p', 'q', 'q1', 'q2', 'q3', 'q4', 'm',
    'pi', 'pi1', 'pi2', 'pi3', 'pi4', 'li', 'li1', 'li2', 'li3', 'li4'];
const NOTE_MARKERS = ['f', 'x'];
const SPECIAL_MARKERS = ['w', 'zaln-s', 'k-s',
    'qt-s','qt1-s','qt2-s',
    'lit'];
const MILESTONE_MARKERS = ['ts-s', 'ts-e', 'ts\\*', 'k-e\\*']; // Is this a good way to handle it???
const MARKERS_WITHOUT_CONTENT = ['b', 'nb', 'ib', 'ie'].concat(MILESTONE_MARKERS);
const ALLOWED_LINE_START_MARKERS = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(CV_MARKERS).concat(PARAGRAPH_MARKERS)
    .concat(NOTE_MARKERS).concat(SPECIAL_MARKERS).concat(MARKERS_WITHOUT_CONTENT);
const DEPRECATED_MARKERS = ['h1', 'h2', 'h3', 'h4', 'pr',
    'ph', 'ph1', 'ph2', 'ph3', 'ph4', 'addpn', 'pro', 'fdc', 'xdc'];
const MARKERS_WITH_COMPULSORY_CONTENT = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(CV_MARKERS).concat(NOTE_MARKERS).concat(SPECIAL_MARKERS);
const CHARACTER_MARKERS = ['add', 'bk', 'dc', 'k', 'nd', 'ord', 'pn', 'png', 'addpn',
    'qt', 'sig', 'sls', 'tl', 'wj',
    'rq', 'ior', 'iqt',
    'em', 'bd', 'it', 'bdit', 'no', 'sc', 'sup',
    'fig', 'ndx', 'rb', 'pro', 'w', 'wg', 'wh', 'wa']; // NOTE that we have \w in TWO places
const FOOTNOTE_INTERNAL_MARKERS = ['fr', 'fq', 'fqa', 'fk', 'fl', 'fw', 'fp', 'fv', 'ft', 'fdc', 'fm', 'xt'];
const XREF_INTERNAL_MARKERS = ['xo', 'xk', 'xq', 'xt', 'xta', 'xop', 'xot', 'xnt', 'xdc', 'rq'];


function checkUSFMText(BBB, filename, givenText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

    filename parameter can be an empty string if we don't have one.

     Returns a result object containing a successList and a noticeList
     */
    // console.log("checkUSFMText(" + BBB + ", " + givenText.length.toLocaleString() + " chars, '" + location + "')…");
    let ourLocation = givenLocation;
    if (ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (filename) ourLocation = ` in ${filename}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (e) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
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


    function ourRunBCSGrammarCheck(fileText, fileLocation) {
        // Runs the BCS USFM Grammar checker
        //  which can be quite time-consuming on large, complex USFM files
        console.log("Running our BCS USFM grammar check (can take quite a while for a large book)…");

        const grammarCheckResult = runBCSGrammarCheck('strict', fileText);
        // NOTE: We haven't figured out how to get ERRORS out of this parser yet
        // console.log(`  Finished our BCS USFM grammar check with ${grammarCheckResult.isValidUSFM} and ${grammarCheckResult.warnings.length} warnings.`);
        addSuccessMessage(`Checked USFM Grammar (strict mode) ${grammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN'T validate)"}`);

        if (!grammarCheckResult.isValidUSFM)
            addNotice(944, `USFM3 Grammar Check (strict mode) doesn't pass`, -1, "", fileLocation);

        // console.log("  Warnings:", JSON.stringify(grammarCheckResult.warnings));
        // Display these warnings but with a lower priority
        for (let warningString of grammarCheckResult.warnings)
            if (!warningString.startsWith("Empty lines present") // we allow empty lines in our USFM
                && !warningString.startsWith("Trailing spaces present at line end") // we find these ourselves
            )
                addNotice(100, `USFMGrammar found: ${warningString}`, -1, "", fileLocation);
    }
    // end of ourRunBCSGrammarCheck function


    function CVCheck(BBB, filename, givenText, location) {
        /*
        This check uses the USFM-JS package to parse the USFM
            and then it checks the results to make sure all expected verses are there.

        This has the side advantage that it's using exactly the same code/package that's
            used by tCore and tC Create.

        Note that for verse bridges, USFM-JS returns the bridge, e.g., 24-25
            AS WELL AS an entry for the bridged verses, e.g., 24 and 25.

        Sadly this package doesn't return any errors or warnings from its parsing
            so that's handle other ways in other places.

        Note that this code below does NOT check for chapters and verses
            being in the correct order. That's done elsewhere.
        */
        console.log("Running CVCheck() using USFM-JS (can take quite a while for a large book)…");


        function hasText(verseObjects) {
            for (let someObject of verseObjects) {
                // console.log("someObject", JSON.stringify(someObject));
                if (someObject['type'] === 'text' && someObject['text'].length > 5)
                    return true;
                if (someObject['type'] === 'word' && someObject['text'].length > 2)
                    return true;
                if (someObject['type'] === 'milestone')
                    for (let someSubobject of someObject['children']) {
                        // console.log("someSubobject", JSON.stringify(someSubobject));
                        if (someSubobject['type'] === 'text' && someSubobject['text'].length > 5)
                            return true;
                        if (someSubobject['type'] === 'word' && someSubobject['text'].length > 2)
                            return true;
                    }
            }
            // console.log(`Returning false with ${typeof verseObjects} (${verseObjects.length}): ${JSON.stringify(verseObjects)}`);
            return false;
        }
        // end of hasText function


        // Main code for CVCheck function
        let bbb = BBB.toLowerCase();
        let expectedVersesPerChapterList = [];
        try {
            expectedVersesPerChapterList = books.chaptersInBook(bbb); // A list of integers -- numVerses for each chapter
            // console.log("Got chapterList", JSON.stringify(expectedVersesPerChapterList));
        }
        catch {}

        // Try doing this using USFM-JS via runUsfmJsCheck()
        const result1 = runUsfmJsCheck(givenText);
        // console.log("Got a JSON result", JSON.stringify(result1));
        // console.log("Got a JSON headers result", JSON.stringify(result1.returnedJSON.headers));
        // console.log("Got a JSON chapters result", JSON.stringify(result1.returnedJSON.chapters));
        for (let chapterNumberString in result1.returnedJSON.chapters) {
            // console.log("chapterNumberString", JSON.stringify(chapterNumberString));
            // console.log("chapter", JSON.stringify(result1.returnedJSON.chapters[chapterNumberString]));
            let chapterInt;
            try {
                chapterInt = ourParseInt(chapterNumberString);
            } catch (e) {
                console.log(`CVCheck couldn't convert ${BBB} chapter '${chapterNumberString}': ${e}`);
            }
            if (chapterInt < 1 || chapterInt > expectedVersesPerChapterList.length)
                addNotice(869, "Chapter number out of range", -1, `${BBB} ${chapterNumberString}`, location);
            else {
                let discoveredVerseList = [], discoveredVerseWithTextList = [];
                // console.log(`Chapter ${chapterNumberString} verses ${Object.keys(result1.returnedJSON.chapters[chapterNumberString])}`);
                for (let verseNumberString in result1.returnedJSON.chapters[chapterNumberString]) {
                    if (verseNumberString === 'front') continue; // skip the rest here
                    // console.log("verseNumberString", JSON.stringify(verseNumberString));
                    // console.log("verse", JSON.stringify(result1.returnedJSON.chapters[chapterNumberString][verseNumberString]));
                    const verseObjects = result1.returnedJSON.chapters[chapterNumberString][verseNumberString]['verseObjects'];
                    const verseHasText = hasText(verseObjects);
                    if (verseNumberString.indexOf('-') >= 0) { // It's a verse bridge
                        const bits = verseNumberString.split('-');
                        const firstVString = bits[0], secondVString = bits[1];
                        let intFirstV, intSecondV;
                        try {
                            intFirstV = ourParseInt(firstVString);
                            intSecondV = ourParseInt(secondVString);
                            for (let v = intFirstV; v <= intSecondV; v++) {
                                discoveredVerseList.push(v);
                                if (verseHasText)
                                    discoveredVerseWithTextList.push(v);
                            }
                        } catch (e) {
                            addNotice(762, "Unable to convert verse bridge numbers to integers", 3, verseNumberString, `${location} with ${e}`);
                        }
                    } else { // It's NOT a verse bridge
                        let verseInt;
                        try {
                            verseInt = ourParseInt(verseNumberString);
                            discoveredVerseList.push(verseInt);
                        } catch (e) {
                            console.log(`We couldn't convert ${BBB} ${chapterNumberString} verse '${verseNumberString}': ${e}`);
                        }

                        if (verseInt < 1 || verseInt > expectedVersesPerChapterList[chapterInt - 1])
                            addNotice(868, "Verse number out of range", -1, `${BBB} ${chapterNumberString}:${verseNumberString}`, location);

                        if (verseHasText)
                            discoveredVerseWithTextList.push(verseInt);
                    }
                }

                // Check that expected verses numbers were actually all there
                for (let v = 1; v <= expectedVersesPerChapterList[chapterInt - 1]; v++) {
                    if (discoveredVerseList.indexOf(v) < 0)
                        if (books.isOftenMissing(BBB, chapterInt, v))
                            addNotice(67, "Verse appears to be left out", -1, `${BBB} ${chapterNumberString}:${v}`, location);
                        else
                            addNotice(867, "Verse appears to be missing", -1, `${BBB} ${chapterNumberString}:${v}`, location);
                    // Check for existing verses but missing text
                    if (discoveredVerseWithTextList.indexOf(v) < 0) {
                        // const firstVerseObject = result1.returnedJSON.chapters[chapterNumberString][v]['verseObjects'][0];
                        // console.log("firstVerseObject", JSON.stringify(firstVerseObject));
                        addNotice(867, "Verse seems to have no text", -1, `${BBB} ${chapterNumberString}:${v}`, location);
                    }
                }
            }
        }
        addSuccessMessage(`Checked CV patterns for ${BBB}`);
    }
    // end of CVCheck function


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
                && !noticeEntry[1].startsWith("Mismatched “” characters")
                && (!noticeEntry[1].startsWith("Unexpected doubled , characters") || fieldText.indexOf('x-morph') < 0) // inside \w fields
                && (!noticeEntry[1].startsWith('Unexpected doubled " characters') || fieldText.indexOf('x-morph') < 0) // inside \w fields
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
            if (lCount !== rCount)
                addNotice(873, "Mismatched " + opener + closer + " fields", -1, "(left=" + lCount.toLocaleString() + ", right=" + rCount.toLocaleString() + ")", fileLocation);
        }
    }
    // end of checkUSFMCharacterFields function


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

        if (marker === 'c' && isNaN(rest))
            addNotice(822, "Expected \\c field to contain an integer", 3, '\\c ' + rest, lineLocation);
        if (marker === 'v') {
            let Vstr = (rest) ? rest.split(' ', 1)[0] : '?';
            if (isNaN(Vstr) && Vstr.indexOf('-') < 0)
                addNotice(822, "Expected \\v field to contain an integer", 3, '\\v ' + rest, lineLocation);
        }
        const allowedLinks = (marker === 'w' || marker === 'k-s' || marker === 'SPECIAL1')
            // (because we don't know what marker SPECIAL1 is, so default to "no false alarms")
            && rest.indexOf('x-tw') >= 0;
        if (rest) doOurBasicTextChecks('\\' + marker, rest, allowedLinks, ' field ' + lineLocation, optionalCheckingOptions);
    }
    // end of checkUSFMLineInternals function


    function checkUSFMLineContents(marker, rest, lineLocation) {
        // Looks at the marker and determines what content is allowed/expected on the rest of the line
        // 'SPECIAL1' is used internally here when a character other than a backslash starts a line
        if (ALLOWED_LINE_START_MARKERS.indexOf(marker) >= 0 || marker === 'SPECIAL1') {
            if (rest && MARKERS_WITHOUT_CONTENT.indexOf(marker) >= 0)
                if (isWhitespace(rest))
                    addNotice(301, `Unexpected whitespace after \\${marker} marker`, marker.length, rest, lineLocation);
                else
                    addNotice(401, `Unexpected content after \\${marker} marker`, marker.length, rest, lineLocation);
            else if (MARKERS_WITH_COMPULSORY_CONTENT.indexOf(marker) >= 0 && !rest)
                addNotice(711, "Expected compulsory content", marker.length, "", ` after \\${marker} marker${lineLocation}`);
        } else // it's not a recognised line marker
            // Lower priority of deprecated \s5 markers (compared to all other unknown markers)
            addNotice(marker === 's5' ? 111 : 811, `${marker === 's5' ? 'Deprecated' : 'Unexpected'} '\\${marker}' marker at start of line`, 1, "", lineLocation);
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
            addNotice(900, "Bad function call: should be given a valid book abbreviation", -1, BBB, " (not '" + BBB + "')" + location);
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
            let atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + location;
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
                // NOTE: Some unfoldingWord USFM Bibles commonly have this
                //          so it's not necessarily either an error or a warning
                if (`(‘`.indexOf(line[0]) < 0) { // These are the often expected characters
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
                    intC = ourParseInt(C);
                } catch (e) {
                    addNotice(724, "Unable to convert chapter number to integer", 3, rest.substring(0, 5), atString);
                    intC = -999; // Used to prevent consequential errors
                }
                if (C === lastC || (intC > 0 && intC !== lastIntC + 1))
                    addNotice(764, "Chapter number didn't increment correctly", 3, rest.substring(0, 5) + ' (' + (lastC ? lastC : '0') + ' → ' + C + ')', atString);
                lastC = C; lastV = '0';
                lastIntC = intC; lastIntV = 0;
            } else if (marker === 'v') {
                V = (rest) ? rest.split(' ', 1)[0] : '?';
                if (V.indexOf('-') < 0) { // no hyphen -> no verse bridge
                    try {
                        intV = ourParseInt(V);
                    } catch (e) {
                        addNotice(723, "Unable to convert verse number to integer", 3, rest.substring(0, 5), atString);
                        intV = -999; // Used to prevent consequential errors
                    }
                    if (V === lastV || (intV > 0 && intV !== lastIntV + 1))
                        addNotice(763, "Verse number didn't increment correctly", 3, rest.substring(0, 5) + ' (' + (lastV ? lastV : '0') + ' → ' + V + ')', atString);
                    lastV = V; lastIntV = intV;
                } else { // handle verse bridge
                    const bits = V.split('-');
                    const firstV = bits[0], secondV = bits[1];
                    let intFirstV, intSecondV;
                    try {
                        intFirstV = ourParseInt(firstV);
                        intSecondV = ourParseInt(secondV);
                    } catch (e) {
                        addNotice(762, "Unable to convert verse bridge numbers to integers", 3, rest.substring(0, Math.max(9, extractLength)), atString);
                        intFirstV = -999; intSecondV = -998; // Used to prevent consequential errors
                    }
                    if (intSecondV <= intFirstV)
                        addNotice(769, "Verse bridge numbers not in ascending order", 3, `${rest.substring(0, Math.max(9, extractLength))} (${firstV} → ${secondV})`, atString);
                    else if (firstV === lastV || (intFirstV > 0 && intFirstV !== lastIntV + 1))
                        addNotice(765, "Bridged verse numbers didn't increment correctly", 3, `${rest.substring(0, Math.max(9, extractLength))} (${lastV} → ${firstV})`, atString);
                    lastV = secondV; lastIntV = intSecondV;
                }
            }
            atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + location;

            if (marker === 'id' && !rest.startsWith(BBB))
                addNotice(987, "Expected \\id line to start with book code", 4, rest.substring(0, Math.max(4, extractLength)), atString);

            // Check the order of markers
            // In headers
            if (marker === 'toc2' && lastMarker !== 'toc1')
                addNotice(87, "Expected \\toc2 line to follow \\toc1", 1, "(not '" + lastMarker + "')", atString);
            else if (marker === 'toc3' && lastMarker !== 'toc2')
                addNotice(87, "Expected \\toc3 line to follow \\toc2", 1, "(not '" + lastMarker + "')", atString);
            // In chapters
            else if ((PARAGRAPH_MARKERS.indexOf(marker) >= 0 || marker === 's5' || marker === 'ts\\*')
                && PARAGRAPH_MARKERS.indexOf(lastMarker) >= 0
                && !lastRest)
                addNotice(399, "Useless paragraph marker", 1, "('" + lastMarker + "' before '" + marker + "')", atString);

            // Do general checks
            checkUSFMLineContents(marker, rest, atString);

            lastMarker = marker; lastRest = rest;
        }

        // Do overall global checks of the entire text
        checkUSFMFileContents(filename, givenText, location) // Do this last so the results are lower in the lists

        addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'} in '${location}'`)
    }

    /*function runSlowTask(which) {
        // Ideally these should be run in parallel using multiprocessing
        //  See https://hackernoon.com/multithreading-multiprocessing-and-the-nodejs-event-loop-5b2929bd450b
        console.log(`runSlowTask(${which})`)
        return (which === 1)
            ? mainUSFMCheck(BBB, filename, givenText, location)
            : runBCSGrammarCheck(filename, givenText, location);
    }
    // Main code for checkUSFMText()
    console.log("Starting USFM checking tasks…");
    const tasks = [1,2].map(runSlowTask);
    const allResults = await Promise.all(tasks);
    console.log(`  Finished all tasks with ${JSON.stringify(allResults)}.`);
    console.log("  Finished all tasks.");
    if (!allResults[1].isValidUSFM)
        addNotice(944, "USFM Grammar check fails", -1, "", location);
    console.log("  Warnings:", JSON.stringify(allResults[1].warnings));
    // Display these warnings but with a lower priority
    for (let warningString of allResults[1].warnings)
        addNotice(100, "USFMGrammar found: " + warningString.trim(), -1, "", location);
    */

    // NOTE: If we're careful about how/when we add their notices to our global list,
    //  we should be able to run these three slowish checks in parallel on different threads/processes
    let allResults = [];
    allResults.push(mainUSFMCheck(BBB, filename, givenText, givenLocation));
    allResults.push(CVCheck(BBB, filename, givenText, givenLocation));
    allResults.push(ourRunBCSGrammarCheck(givenText, givenLocation));
    // console.assert(allResults.length === 2);
    // console.log("allResults", JSON.stringify(allResults));
    // if (!allResults[1].isValidUSFM)
    //     addNotice(944, "USFM Grammar check fails", -1, "", location);
    // console.log("  Warnings:", JSON.stringify(allResults[1].warnings));
    // // Display these warnings but with a lower priority
    // for (let warningString of allResults[1].warnings)
    //     addNotice(100, "USFMGrammar found: " + warningString.trim(), -1, "", location);

    console.log(`  checkUSFMText returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log(`checkUSFMText result is ${JSON.stringify(result)}`);
    return result;
}
// end of checkUSFMText function


export default checkUSFMText;
