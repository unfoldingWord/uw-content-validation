import * as books from '../core/books/books';
import { isWhitespace, countOccurrences, ourDeleteAll } from './text-handling-functions'
import { checkTextField } from './field-text-check';
import { checkTextfileContents } from './file-text-check';
import { runUsfmJsCheck } from './usfm-js-check';
import { runBCSGrammarCheck } from './BCS-usfm-grammar-check';
import { ourParseInt } from './utilities';


// const USFM_VALIDATOR_VERSION_STRING = '0.6.37';

const DEFAULT_EXTRACT_LENGTH = 10;


// See http://ubsicap.github.io/usfm/master/index.html
const COMPULSORY_MARKERS = ['id', 'ide'];
const EXPECTED_MARKERS = ['usfm', 'mt1'];
const EXPECTED_BIBLE_BOOK_MARKERS = ['h', 'toc1', 'toc2', 'toc3'];
const EXPECTED_PERIPHERAL_BOOK_MARKERS = ['periph'];

const INTRO_LINE_START_MARKERS = ['id', 'usfm', 'ide', 'h',
    'toc1', 'toc2', 'toc3',
    'mt', 'mt1', 'mt2',
    'mte', 'mte1', 'mte2',
    'imt', 'imt1', 'imt2',
    'is', 'is1', 'is2',
    'ip', 'ipi', 'im', 'imi', 'ipq', 'imq', 'ipr',
    'iq', 'iq1', 'iq2',
    'ili', 'ili1', 'ili2',
    'iot', 'io', 'io1', 'io2',
    'iex', 'imte', 'imte1', 'imte2'];
const CV_MARKERS = ['c', 'v', 'ca', 'va'];
const HEADING_TYPE_MARKERS = [ // expected to contain text on the same line
    's', 's1', 's2', 's3', 's4', 'sr',
    'ms', 'ms1', 'mr',
    'r', 'd', 'rem', 'sp', 'qs', 'cl',
    'sd', 'sd1', 'sd2',
    'pr', 'qa', 'qc', 'qd', 'qr',
    'cls', 'pmo', 'pmc', 'pmr', 'pc',
    'periph'];
const PARAGRAPH_MARKERS = ['p',
    'q', 'q1', 'q2', 'q3', 'q4',
    'qm', 'qm1', 'qm2', 'qm3', 'qm4',
    'm', 'mi',
    'pi', 'pi1', 'pi2', 'pi3', 'pi4',
    'li', 'li1', 'li2', 'li3', 'li4',
    'lim', 'lim1', 'lim2', 'lim3', 'lim4',
    'lh', 'lf',
    'po', 'pm',
    'ph', 'ph1', 'ph2', 'ph3', 'ph4',
    'tr'];
const NOTE_MARKERS = ['f', 'x'];
const SPECIAL_MARKERS = ['w', 'zaln-s', 'k-s',
    'qt-s', 'qt1-s', 'qt2-s',
    'lit'];
const MILESTONE_MARKERS = ['ts\\*', 'ts-s', 'ts-e', 'k-e\\*']; // Is this a good way to handle it???
const MARKERS_WITHOUT_CONTENT = ['b', 'nb', 'ib', 'ie'].concat(MILESTONE_MARKERS);
const ALLOWED_LINE_START_MARKERS = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(CV_MARKERS).concat(PARAGRAPH_MARKERS)
    .concat(NOTE_MARKERS).concat(SPECIAL_MARKERS).concat(MARKERS_WITHOUT_CONTENT)
    .concat(MILESTONE_MARKERS);
const DEPRECATED_MARKERS = [
    'h1', 'h2', 'h3', 'h4',
    'pr',
    'ph', 'ph1', 'ph2', 'ph3', 'ph4',
    'addpn', 'pro', 'fdc', 'xdc'];
const MARKERS_WITH_COMPULSORY_CONTENT = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(CV_MARKERS).concat(NOTE_MARKERS).concat(SPECIAL_MARKERS);
const FOOTNOTE_INTERNAL_MARKERS = ['fr', 'fq', 'fqa', 'fk', 'fl', 'fw', 'fp', 'fv', 'ft', 'fdc', 'fm', 'xt'];
const XREF_INTERNAL_MARKERS = ['xo', 'xk', 'xq', 'xt', 'xta', 'xop', 'xot', 'xnt', 'xdc', 'rq'];
const SIMPLE_CHARACTER_MARKERS = ['add', 'bk', 'dc', 'k', 'nd', 'ord', 'pn', 'png', 'addpn',
    'qt', 'sig', 'sls', 'tl', 'wj',
    'ior', 'iqt', // TODO: What/Why was 'rq' in here???
    'em', 'bd', 'it', 'bdit', 'no', 'sc', 'sup',
    'ndx', 'rb', 'pro', 'wg', 'wh', 'wa',
    'litl', 'lik',
    'liv', 'liv1', 'liv2', 'liv3', 'liv4'];
const CHARACTER_MARKERS = ['fig', 'w'].concat(SIMPLE_CHARACTER_MARKERS); // NOTE that we have \w in TWO places
const SIMPLE_INTERNAL_MARKERS = [SIMPLE_CHARACTER_MARKERS].concat().concat(FOOTNOTE_INTERNAL_MARKERS).concat(XREF_INTERNAL_MARKERS)
// eslint-disable-next-line no-unused-vars
const CANONICAL_TEXT_MARKERS = ['d'].concat(PARAGRAPH_MARKERS).concat(CHARACTER_MARKERS);
// eslint-disable-next-line no-unused-vars
const ANY_TEXT_MARKERS = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(PARAGRAPH_MARKERS).concat(CHARACTER_MARKERS)
    .concat(NOTE_MARKERS).concat(SPECIAL_MARKERS);
const MATCHED_CHARACTER_FORMATTING_PAIRS = [
    ['\\add ', '\\add*'], ['\\addpn ', '\\addpn*'],
    ['\\bd ', '\\bd*'], ['\\bdit ', '\\bdit*'],
    ['\\bk ', '\\bk*'],
    ['\\dc ', '\\dc*'],
    ['\\em ', '\\em*'],
    ['\\fig ', '\\fig*'],
    ['\\ior ', '\\ior*'],
    ['\\iqt ', '\\iqt*'],
    ['\\it ', '\\it*'],
    ['\\k ', '\\k*'],
    ['\\litl ', '\\litl*'],
    ['\\lik ', '\\lik*'],
    ['\\liv ', '\\liv*'], ['\\liv1 ', '\\liv1*'], ['\\liv2 ', '\\liv2*'], ['\\liv3 ', '\\liv3*'], ['\\liv4 ', '\\liv4*'],
    ['\\nd ', '\\nd*'], ['\\ndx ', '\\ndx*'],
    ['\\no ', '\\no*'],
    ['\\ord ', '\\ord*'],
    ['\\pn ', '\\pn*'], ['\\png ', '\\png*'],
    ['\\pro ', '\\pro*'],
    ['\\qt ', '\\qt*'],
    ['\\rb ', '\\rb*'],
    ['\\sc ', '\\sc*'],
    ['\\sig ', '\\sig*'],
    ['\\sls ', '\\sls*'],
    ['\\sup ', '\\sup*'],
    ['\\tl ', '\\tl*'],
    ['\\w ', '\\w*'],
    ['\\wa ', '\\wa*'], ['\\wg ', '\\wg*'], ['\\wh ', '\\wh*'],
    ['\\wj ', '\\wj*'],

    ['\\ca ', '\\ca*'], ['\\va ', '\\va*'],

    ['\\f ', '\\f*'], ['\\x ', '\\x*'],
];



export function checkUSFMText(languageCode, bookID, filename, givenText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

    bookID is a three-character UPPERCASE USFM book identifier.

    filename parameter can be an empty string if we don't have one.

     Returns a result object containing a successList and a noticeList
     */
    // console.log(`checkUSFMText(${languageCode}, ${bookID}, ${givenText.length.toLocaleString()} chars, '${givenLocation}', ${JSON.stringify(optionalCheckingOptions)})…`);
    console.assert(languageCode !== undefined, "checkUSFMText: 'languageCode' parameter should be defined");
    console.assert(typeof languageCode === 'string', `checkUSFMText: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    console.assert(bookID !== undefined, "checkUSFMText: 'bookID' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkUSFMText: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkUSFMText: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(bookID.toUpperCase() === bookID, `checkUSFMText: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    console.assert(bookID === 'OBS' || books.isValidBookID(bookID), `checkUSFMText: '${bookID}' is not a valid USFM book identifier`);
    console.assert(filename !== undefined, "checkUSFMText: 'line' parameter should be defined");
    console.assert(typeof filename === 'string', `checkUSFMText: 'line' parameter should be a string not a '${typeof filename}'`);
    console.assert(givenLocation !== undefined, "checkUSFMText: 'givenRowLocation' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkUSFMText: 'givenRowLocation' parameter should be a string not a '${typeof givenLocation}'`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

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

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkUSFMText success: ${successString}`);
        result.successList.push(successString);
    }
    function addNoticePartial(noticeObject) {
        // console.log("checkUSFMText addNoticePartial:", JSON.stringify(noticeObject));
        // console.log(`checkUSFMText addNoticePartial: (priority=${noticeObject.priority}) ${noticeObject.C}:${noticeObject.V} ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? ` ${noticeObject.extract}` : ""}${noticeObject.location}`);
        console.assert(noticeObject.priority !== undefined, "cUSFM addNoticePartial: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cUSFM addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cUSFM addNoticePartial: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cUSFM addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(C !== undefined, "cUSFM addNoticePartial: 'C' parameter should be defined");
        if (noticeObject.C) console.assert(typeof noticeObject.C === 'string', `cUSFM addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}': ${noticeObject.C}`);
        // console.assert(V !== undefined, "cUSFM addNoticePartial: 'V' parameter should be defined");
        if (noticeObject.V) console.assert(typeof noticeObject.V === 'string', `cUSFM addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}': ${noticeObject.V}`);
        // console.assert(characterIndex !== undefined, "cUSFM addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex !== undefined) console.assert(typeof noticeObject.characterIndex === 'number', `cUSFM addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "cUSFM addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cUSFM addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cUSFM addNoticePartial: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cUSFM addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        console.assert(noticeObject.message.indexOf('Mismatched {}') < 0, `checkUSFMText addNoticePartial: got bad notice: ${JSON.stringify(noticeObject)}`);
        result.noticeList.push({ ...noticeObject, bookID, filename });
    }


    function ourRunBCSGrammarCheck(filename, fileText, fileLocation) {
        // Runs the BCS USFM Grammar checker
        //  which can be quite time-consuming on large, complex USFM files
        // console.log("Running our BCS USFM grammar check (can take quite a while for a large book)…");

        const grammarCheckResult = runBCSGrammarCheck('strict', fileText, filename, fileLocation, optionalCheckingOptions);
        // NOTE: We haven't figured out how to get ERRORS out of this parser yet
        // console.log(`  Finished our BCS USFM grammar check with ${grammarCheckResult.isValidUSFM} and ${grammarCheckResult.warnings.length} warnings.`);
        addSuccessMessage(`Checked USFM Grammar (strict mode) ${grammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN'T validate)"}`);

        // if (!grammarCheckResult.isValidUSFM) // TEMP DEGRADE TO WARNING 994 -> 544 ................XXXXXXXXXXXXXXXXXXXXXX
        // Don't do this since we add the actual error message elsewhere now
        // addNoticePartial({priority:994, '', '', `USFM3 Grammar Check (strict mode) doesn't pass`, location:fileLocation});

        // We only get one error if it fails
        if (grammarCheckResult.error && grammarCheckResult.error.priority)
            // Prevent these false alarms (from Ohm schema issues, esp. empty lemma="" fields)
            if (!grammarCheckResult.error.extract
                // Note: checking the extract might not always be reliable if they choose a length < 10
                || (grammarCheckResult.error.extract.indexOf('mma="" ') < 0 // see https://github.com/Bridgeconn/usfm-grammar/issues/87
                    && grammarCheckResult.error.message.indexOf('Expected "c", "v", ') < 0 // forgotten what this prevents ???
                    && grammarCheckResult.error.message.indexOf('Expected "f*", "+", ') < 0 // see https://github.com/Bridgeconn/usfm-grammar/issues/86
                ))
                addNoticePartial(grammarCheckResult.error);

        // console.log("  Warnings:", JSON.stringify(grammarCheckResult.warnings));
        // Display these warnings but with a lower priority
        for (const warningString of grammarCheckResult.warnings)
            if (!warningString.startsWith("Empty lines present") // we allow empty lines in our USFM
                && !warningString.startsWith("Trailing spaces present at line end") // we find these ourselves
            )
                addNoticePartial({ priority: 102, message: `USFMGrammar: ${warningString}`, location: fileLocation });

        if (!grammarCheckResult.isValidUSFM) {
            const relaxedGrammarCheckResult = runBCSGrammarCheck('relaxed', fileText, filename, fileLocation);
            addSuccessMessage(`Checked USFM Grammar (relaxed mode) ${relaxedGrammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN'T validate)"}`);
            if (!relaxedGrammarCheckResult.isValidUSFM)
                addNoticePartial({ priority: 644, message: "USFM3 Grammar Check (relaxed mode) doesn't pass either", location: fileLocation });
        }
    }
    // end of ourRunBCSGrammarCheck function


    function CVCheck(bookID, givenText, CVlocation) {
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
        // console.log("Running CVCheck() using USFM-JS (can take quite a while for a large book)…");
        let chapterNumberString, verseNumberString;


        const MINIMUM_TEXT_WORDS = 4;
        const MINIMUM_WORD_LENGTH = 2;
        function hasText(verseObjects) {
            let gotDeep = false;
            for (const someObject of verseObjects) {
                // console.log("someObject", JSON.stringify(someObject));
                if (someObject['type'] === 'text' && someObject['text'].length > MINIMUM_TEXT_WORDS)
                    return true;
                if (someObject['type'] === 'word' && someObject['text'].length > MINIMUM_WORD_LENGTH)
                    return true;
                if (someObject['type'] === 'milestone')
                    for (const someSubobject of someObject['children']) {
                        // console.log("someSubobject", JSON.stringify(someSubobject));
                        if (someSubobject['type'] === 'text' && someSubobject['text'].length > MINIMUM_TEXT_WORDS)
                            return true;
                        if (someSubobject['type'] === 'word' && someSubobject['text'].length > MINIMUM_WORD_LENGTH)
                            return true;
                        if (someSubobject['type'] === 'milestone')
                            for (const someSub2object of someSubobject['children']) {
                                // console.log("someSub2object", JSON.stringify(someSub2object));
                                if (someSub2object['type'] === 'text' && someSub2object['text'].length > MINIMUM_TEXT_WORDS)
                                    return true;
                                if (someSub2object['type'] === 'word' && someSub2object['text'].length > MINIMUM_WORD_LENGTH)
                                    return true;
                                if (someSub2object['type'] === 'milestone')
                                    for (const someSub3object of someSub2object['children']) {
                                        // console.log("someSub3object", JSON.stringify(someSub3object));
                                        if (someSub3object['type'] === 'text' && someSub3object['text'].length > MINIMUM_TEXT_WORDS)
                                            return true;
                                        if (someSub3object['type'] === 'word' && someSub3object['text'].length > MINIMUM_WORD_LENGTH)
                                            return true;
                                        if (someSub3object['type'] === 'milestone')
                                            for (const someSub4object of someSub3object['children']) {
                                                // console.log("someSub4object", JSON.stringify(someSub4object));
                                                if (someSub4object['type'] === 'text' && someSub4object['text'].length > MINIMUM_TEXT_WORDS)
                                                    return true;
                                                if (someSub4object['type'] === 'word' && someSub4object['text'].length > MINIMUM_WORD_LENGTH)
                                                    return true;
                                                if (someSub4object['type'] === 'milestone')
                                                    for (const someSub5object of someSub4object['children']) {
                                                        // console.log("someSub5object", JSON.stringify(someSub5object));
                                                        if (someSub5object['type'] === 'text' && someSub5object['text'].length > MINIMUM_TEXT_WORDS)
                                                            return true;
                                                        if (someSub5object['type'] === 'word' && someSub5object['text'].length > MINIMUM_WORD_LENGTH)
                                                            return true;
                                                        if (someSub5object['type'] === 'milestone')
                                                            for (const someSub6object of someSub5object['children']) {
                                                                // console.log("someSub6object", bookID, CVlocation, JSON.stringify(someSub6object));
                                                                if (someSub6object['type'] === 'text' && someSub6object['text'].length > MINIMUM_TEXT_WORDS)
                                                                    return true;
                                                                if (someSub6object['type'] === 'word' && someSub6object['text'].length > MINIMUM_WORD_LENGTH)
                                                                    return true;
                                                                if (someSub6object['type'] === 'milestone')
                                                                    for (const someSub7object of someSub6object['children']) {
                                                                        // console.log("someSub7object", bookID, CVlocation, JSON.stringify(someSub7object));
                                                                        if (someSub7object['type'] === 'text' && someSub7object['text'].length > MINIMUM_TEXT_WORDS)
                                                                            return true;
                                                                        if (someSub7object['type'] === 'word' && someSub7object['text'].length > MINIMUM_WORD_LENGTH)
                                                                            return true;
                                                                        if (someSub7object['type'] === 'milestone')
                                                                            // UST Luke 15:3 has eight levels of nesting !!!
                                                                            for (const someSub8object of someSub7object['children']) {
                                                                                // console.log("someSub8object", bookID, CVlocation, JSON.stringify(someSub8object));
                                                                                if (someSub8object['type'] === 'text' && someSub8object['text'].length > MINIMUM_TEXT_WORDS)
                                                                                    return true;
                                                                                if (someSub8object['type'] === 'word' && someSub8object['text'].length > MINIMUM_WORD_LENGTH)
                                                                                    return true;
                                                                                if (someSub8object['type'] === 'milestone') gotDeep = true;
                                                                                // console.assert(someSub5object['type'] !== 'milestone', `We need to add more depth levels to hasText() for ${chapterNumberString}:${verseNumberString}`);
                                                                            }
                                                                    }
                                                            }
                                                    }
                                            }
                                    }
                            }
                    }
            }
            if (gotDeep) console.assert(false, `We need to add more depth levels to hasText() for ${bookID} ${chapterNumberString}:${verseNumberString}`);
            // console.log(`hasText() for ${chapterNumberString}:${verseNumberString} returning false with ${typeof verseObjects} (${verseObjects.length}): ${JSON.stringify(verseObjects)}`);
            return false;
        }
        // end of hasText function


        // Main code for CVCheck function
        let lowercaseBookID = bookID.toLowerCase();
        let expectedVersesPerChapterList = [];
        try {
            console.assert(lowercaseBookID !== 'obs', "Shouldn't happen in usfm-text-check1");
            expectedVersesPerChapterList = books.chaptersInBook(lowercaseBookID); // A list of integers -- numVerses for each chapter
            // console.log("Got chapterList", JSON.stringify(expectedVersesPerChapterList));
        }
        catch { }

        // Try doing this using USFM-JS via runUsfmJsCheck()
        const result1 = runUsfmJsCheck(givenText);
        // console.log("Got a JSON result", JSON.stringify(result1));
        // console.log("Got a JSON headers result", JSON.stringify(result1.returnedJSON.headers));
        // console.log("Got a JSON chapters result", JSON.stringify(result1.returnedJSON.chapters));
        for (chapterNumberString in result1.returnedJSON.chapters) {
            // console.log(`chapterNumberString=${chapterNumberString}`);
            // if (chapterNumberString === '3')
            //     console.log(`chapter ${chapterNumberString} ${JSON.stringify(result1.returnedJSON.chapters[chapterNumberString])}`);
            let chapterInt;
            try {
                chapterInt = ourParseInt(chapterNumberString);
            } catch (usfmCIerror) {
                console.log(`CVCheck couldn't convert ${bookID} chapter '${chapterNumberString}': ${usfmCIerror}`);
            }
            if (chapterInt < 1 || chapterInt > expectedVersesPerChapterList.length)
                addNoticePartial({ priority: 869, message: "Chapter number out of range", C: chapterNumberString, extract: `${bookID} ${chapterNumberString}`, location: CVlocation });
            else {
                let discoveredVerseList = [], discoveredVerseWithTextList = [];
                // console.log(`Chapter ${chapterNumberString} verses ${Object.keys(result1.returnedJSON.chapters[chapterNumberString])}`);
                for (verseNumberString in result1.returnedJSON.chapters[chapterNumberString]) {
                    if (verseNumberString === 'front') continue; // skip the rest here
                    // if (chapterNumberString === '3')
                    //     console.log(`verseNumberString=${verseNumberString}`);
                    // if (chapterNumberString === '3' && verseNumberString === '14')
                    //     console.log(`verse ${verseNumberString} ${JSON.stringify(result1.returnedJSON.chapters[chapterNumberString][verseNumberString])}`);
                    const verseObjects = result1.returnedJSON.chapters[chapterNumberString][verseNumberString]['verseObjects'];
                    // if (chapterNumberString === '3' && verseNumberString === '14')
                    //     console.log(`verseObjects=${verseObjects}`);
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
                        } catch (usfmVIerror) {
                            addNoticePartial({ priority: 762, message: "Unable to convert verse bridge numbers to integers", C: chapterNumberString, V: verseNumberString, characterIndex: 3, extract: verseNumberString, location: `${CVlocation} with ${usfmVIerror}` });
                        }
                    } else { // It's NOT a verse bridge
                        let verseInt;
                        try {
                            verseInt = ourParseInt(verseNumberString);
                            discoveredVerseList.push(verseInt);
                        } catch (usfmPIerror) {
                            console.log(`We couldn't convert ${bookID} ${chapterNumberString} verse '${verseNumberString}': ${usfmPIerror}`);
                        }

                        if (verseInt < 1 || verseInt > expectedVersesPerChapterList[chapterInt - 1])
                            addNoticePartial({ priority: 868, message: "Verse number out of range", C: chapterNumberString, V: verseNumberString, extract: `${bookID} ${chapterNumberString}:${verseNumberString}`, location: CVlocation });

                        if (verseHasText)
                            discoveredVerseWithTextList.push(verseInt);
                    }
                }

                // Check that expected verses numbers were actually all there
                // console.log("Doing missing verse check");
                for (let v = 1; v <= expectedVersesPerChapterList[chapterInt - 1]; v++) {
                    if (discoveredVerseList.indexOf(v) < 0)
                        if (books.isOftenMissing(bookID, chapterInt, v))
                            addNoticePartial({ priority: 67, C: chapterNumberString, V: `${v}`, message: "Verse appears to be left out", location: CVlocation });
                        else
                            addNoticePartial({ priority: 867, C: chapterNumberString, V: `${v}`, message: "Verse appears to be missing", location: CVlocation });
                    // Check for existing verses but missing text
                    if (discoveredVerseWithTextList.indexOf(v) < 0) {
                        // const firstVerseObject = result1.returnedJSON.chapters[chapterNumberString][v]['verseObjects'][0];
                        // console.log("firstVerseObject", JSON.stringify(firstVerseObject));
                        addNoticePartial({ priority: 866, C: chapterNumberString, V: `${v}`, message: "Verse seems to have no text", location: CVlocation });
                    }
                }
            }
        }
        addSuccessMessage(`Checked CV patterns for ${bookID}${CVlocation}`);
    }
    // end of CVCheck function


    /**
    * @description - checks the given text field and processes the returned results
    * @param {String} C - chapter number of the text being checked
    * @param {String} V - verse number of the text being checked
    * @param {String} fieldName - name of the field being checked
    * @param {String} fieldText - the actual text of the field being checked
    * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
    * @param {String} fieldLocation - description of where the field is located
    * @param {Object} optionalCheckingOptions - parameters that might affect the check
    */
    function ourCheckTextField(lineNumber, C, V, fieldName, fieldText, allowedLinks, fieldLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cUSFM ourCheckTextField(${lineNumber}, ${C}:${V}, ${fieldName}, (${fieldText.length} chars), ${allowedLinks}, ${fieldLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
        console.assert(lineNumber !== undefined, "cUSFM ourCheckTextField: 'lineNumber' parameter should be defined");
        console.assert(typeof lineNumber === 'number', `cUSFM ourCheckTextField: 'lineNumber' parameter should be a number not a '${typeof lineNumber}'`);
        console.assert(fieldName !== undefined, "cUSFM ourCheckTextField: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cUSFM ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cUSFM ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cUSFM ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cUSFM ourCheckTextField: allowedLinks parameter must be either true or false");

        const dbtcResultObject = checkTextField(fieldName, fieldText, allowedLinks, fieldLocation, optionalCheckingOptions);

        // Process results line by line to filter out potential false positives
        //  for this particular kind of text field
        for (const noticeEntry of dbtcResultObject.noticeList) {
            // console.log("Notice keys", JSON.stringify(Object.keys(noticeEntry)));
            console.assert(Object.keys(noticeEntry).length >= 4, `USFM ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
            if (!noticeEntry.message.startsWith("Mismatched () characters") // 663 Mismatched left/right chars -- suppress these misleading warnings coz open quote can occur in one verse and close in another
                && !noticeEntry.message.startsWith("Mismatched [] characters") // Start/end of questionable text can be on different lines
                && !noticeEntry.message.startsWith("Mismatched {} characters") // Start/end of implied text can be on different lines
                && !noticeEntry.message.startsWith("Mismatched “” characters")
                && !noticeEntry.message.startsWith("Mismatched «» characters")
                && (!noticeEntry.message.startsWith("Unexpected | character after space") || (fieldText.indexOf('x-lemma') < 0 && fieldText.indexOf('x-tw') < 0)) // 191 inside \zaln-s and \k-s fields
                && (!noticeEntry.message.startsWith("Unexpected doubled , characters") || fieldText.indexOf('x-morph') < 0) // inside \w fields
                && (!noticeEntry.message.startsWith('Unexpected doubled " characters') || fieldText.indexOf('x-morph') < 0) // inside \w fields
            ) {
                // const newNoticeObject = { priority:noticeEntry.priority, message:noticeEntry.message }
                // if (C !== undefined && C.length) newNoticeObject.C = C;
                // if (V !== undefined && V.length) newNoticeObject.V = V;
                // // if (filename !== undefined && filename.length) newNoticeObject.filename = filename;
                // if (noticeEntry.characterIndex !== undefined) newNoticeObject.characterIndex = noticeEntry.characterIndex;
                // if (noticeEntry.extract !== undefined && noticeEntry.extract.length) newNoticeObject.extract = noticeEntry.extract;
                // if (noticeEntry.location !== undefined && noticeEntry.location.length) newNoticeObject.location = noticeEntry.location;
                addNoticePartial({ ...noticeEntry, lineNumber, C, V });
            }
        }
    }
    // end of ourCheckTextField function


    function ourBasicFileChecks(filename, fileText, fileLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        console.assert(filename !== undefined, "cUSFM ourBasicFileChecks: 'filename' parameter should be defined");
        console.assert(typeof filename === 'string', `cUSFM ourBasicFileChecks: 'filename' parameter should be a string not a '${typeof filename}'`);
        console.assert(fileText !== undefined, "cUSFM ourBasicFileChecks: 'fileText' parameter should be defined");
        console.assert(typeof fileText === 'string', `cUSFM ourBasicFileChecks: 'fileText' parameter should be a string not a '${typeof fileText}'`);

        const resultObject = checkTextfileContents(languageCode, filename, fileText, fileLocation, optionalCheckingOptions);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length >= 5, `USFM ourBasicFileChecks notice length=${Object.keys(noticeEntry).length}`);
            if (!noticeEntry.message.startsWith("Mismatched () characters") // 663 Mismatched left/right chars -- suppress these misleading warnings coz open quote can occur in one verse and close in another
                && !noticeEntry.message.startsWith("Mismatched [] characters")
                && !noticeEntry.message.startsWith("Mismatched {} characters") // Start/end of implied text can be on different lines
                && !noticeEntry.message.startsWith("Mismatched “” characters")
                && !noticeEntry.message.startsWith("Mismatched «» characters")
                && (!noticeEntry.message.startsWith("Unexpected space after | character") || fileText.indexOf('zaln-s') < 0) // 192 inside \zaln-s fields
                && (!noticeEntry.message.startsWith("Unexpected | character after space") || (fileText.indexOf('x-lemma') < 0 && fileText.indexOf('x-tw') < 0)) // 191 inside \zaln-s and \k-s fields
                && (!noticeEntry.message.startsWith("Unexpected doubled , characters") || fileText.indexOf('x-morph') < 0) // inside \w fields
                && (!noticeEntry.message.startsWith('Unexpected doubled " characters') || fileText.indexOf('x-morph') < 0) // inside \w fields with empty lemma
                && (!noticeEntry.message.startsWith('Unexpected link') || fileText.indexOf('x-tw') < 0) // inside original language \w fields
            ) {
                // const newNoticeObject = { priority:noticeEntry.priority, message:noticeEntry.message }
                // if (C !== undefined && C.length) newNoticeObject.C = C;
                // if (V !== undefined && V.length) newNoticeObject.V = V;
                // // if (filename !== undefined && filename.length) newNoticeObject.filename = filename;
                // if (noticeEntry.characterIndex !== undefined) newNoticeObject.characterIndex = noticeEntry.characterIndex;
                // if (noticeEntry.extract !== undefined && noticeEntry.extract.length) newNoticeObject.extract = noticeEntry.extract;
                // if (noticeEntry.location !== undefined && noticeEntry.location.length) newNoticeObject.location = noticeEntry.location;
                addNoticePartial(noticeEntry);
            }
        }
    }
    // end of ourBasicFileChecks function


    function checkUSFMCharacterFields(filename, fileText, fileLocation) {
        // Check matched pairs
        for (const punctSet of MATCHED_CHARACTER_FORMATTING_PAIRS) {
            const opener = punctSet[0], closer = punctSet[1];
            const lCount = countOccurrences(fileText, opener);
            const rCount = countOccurrences(fileText, closer);
            if (lCount !== rCount)
                addNoticePartial({ priority: 873, message: `Mismatched ${opener}${closer} fields`, extract: `(left=${lCount.toLocaleString()}, right=${rCount.toLocaleString()})`, location: fileLocation });
        }
    }
    // end of checkUSFMCharacterFields function


    function checkUSFMFileContents(filename, fileText, markerSet, fileLocation) {
        // Does global checks on the file
        // Note: These run the risk of duplicating messages that are found within individual lines.
        //          However, it's common in USFM for parentheses to open '(' in one verse
        //                      and close ')' in another. So the USFM line check can't check that.
        //          Also, the USFM v3.0 spec seems to allow/require whitespace reduction,
        //              i.e., newLines can conceivably appear WITHIN a footnote for example.

        // Check markers like \add ... \add*, \f .. \f*
        checkUSFMCharacterFields(filename, fileText, fileLocation)

        // Now do the general global checks (e.g., for general punctuation)
        ourBasicFileChecks(filename, fileText, fileLocation);

        for (const compulsoryMarker of COMPULSORY_MARKERS)
            if (!markerSet.has(compulsoryMarker))
                addNoticePartial({ priority: 819, message: "Missing compulsory USFM line", extract: `missing \\${compulsoryMarker}`, location: fileLocation });
        for (const expectedMarker of EXPECTED_MARKERS)
            if (!markerSet.has(expectedMarker)
                && (!expectedMarker.endsWith('1') || !markerSet.has(expectedMarker.substring(0, expectedMarker.length - 1))))
                addNoticePartial({ priority: 519, message: "Missing expected USFM line", extract: `missing \\${expectedMarker}`, location: fileLocation });
        if (books.isExtraBookID(bookID))
            for (const expectedMarker of EXPECTED_PERIPHERAL_BOOK_MARKERS)
                if (!markerSet.has(expectedMarker))
                    addNoticePartial({ priority: 517, message: "Missing expected USFM line", extract: `missing \\${expectedMarker}`, location: fileLocation });
                else
                    for (const expectedMarker of EXPECTED_BIBLE_BOOK_MARKERS)
                        if (!markerSet.has(expectedMarker))
                            addNoticePartial({ priority: 518, message: "Missing expected USFM line", extract: `missing \\${expectedMarker}`, location: fileLocation });
        for (const deprecatedMarker of DEPRECATED_MARKERS)
            if (markerSet.has(deprecatedMarker))
                addNoticePartial({ priority: 218, message: "Using deprecated USFM marker", extract: `\\${deprecatedMarker}`, location: fileLocation });
    }
    // end of checkUSFMFileContents function


    function checkUSFMLineText(lineNumber, C, V, marker, rest, lineLocation, optionalCheckingOptions) {
        // Removes character formatting within the line contents and checks the remaining text
        // console.log(`checkUSFMLineText(${lineNumber}, ${C}:${V}, ${marker}='${rest}', ${lineLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
        // console.log(`checkUSFMLineText(${lineNumber}, ${C}:${V}, ${marker}=${rest.length} chars, ${lineLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);

        const details = `(line marker=\\${marker})`

        // Remove any self-closed milestones and internal \v markers
        // NOTE: replaceAll() is not generally available in browsers yet, so need to use RegExps
        let adjustedRest = rest.replace(/\\zaln-e\\\*/g, '').replace(/\\ts\\\*/g, '').replace(/\\k-e\\\*/g, '')
            .replace(/\\v /g, '')
            .replace(/\\k-s[^\\]+\\\*/g, ''); // This last one is a genuine RegExp because it includes the field contents

        // Remove any simple character markers
        // NOTE: replaceAll() is not generally available in browsers yet, so need to use RegExps
        for (const charMarker of SIMPLE_INTERNAL_MARKERS) {
            // oldTODO: Move the regEx creation so it's only done once -- not for every line!!!
            // const startRegex = new RegExp(`\\${charMarker} `, 'g');
            // // eslint-disable-next-line no-useless-escape
            // const endRegex = new RegExp(`\\${charMarker}\*`, 'g');
            // adjustedRest = adjustedRest.replace(startRegex, '').replace(endRegex, '');
            adjustedRest = ourDeleteAll(adjustedRest, `\\${charMarker} `);
            adjustedRest = ourDeleteAll(adjustedRest, `\\${charMarker}*`);
        }
        // if (adjustedRest !== rest) {console.log(`Still Got \n'${adjustedRest}' from \n'${rest}'`); return;}


        let ixEnd;
        if (marker === 'w') { // Handle first \w field (i.e., if marker==w) -- there may be more \w fields in rest
            const ixWordEnd = adjustedRest.indexOf('|');
            if (ixWordEnd < 0 && adjustedRest.indexOf('lemma="') >= 0) {
                const characterIndex = 5; // Presumably, a little bit into the word
                const extract = (characterIndex > halfLength ? '…' : '') + adjustedRest.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 912, message: 'Missing | character in \\w line', lineNumber, C, V, characterIndex, extract, location: lineLocation });
            }
            console.assert(ixWordEnd >= 1, `Why1 is w| = ${ixWordEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
            ixEnd = adjustedRest.indexOf('\\w*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.substring(0, ixWordEnd) + adjustedRest.substring(ixEnd + 3, adjustedRest.length);
            else console.assert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'zaln-s') { // Remove first \zaln-s milestone (if marker == zaln-s)
            ixEnd = adjustedRest.indexOf('\\*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.substring(ixEnd + 2, adjustedRest.length);
            else console.assert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'k-s') { // Remove first \k-s milestone (if marker == k-s)
            ixEnd = adjustedRest.indexOf('\\*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.substring(ixEnd + 2, adjustedRest.length);
            else console.assert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'f') { // Handle first footnote (if marker == f)
            ixEnd = adjustedRest.indexOf('\\f*');
            const startIndex = adjustedRest.startsWith('+ ') ? 2 : 0;
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.substring(startIndex, ixEnd) + adjustedRest.substring(ixEnd + 3, adjustedRest.length);
            else {
                // console.assert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
                addNoticePartial({ priority: 312, message: 'Possible unclosed footnote', details, lineNumber, C, V, location: lineLocation });
            }
            // console.log(`After removing f field: '${adjustedRest}' from '${rest}'`);
        }
        else if (marker === 'va')
            adjustedRest = adjustedRest.replace('\\va*', '');
        else if (marker === 'ca')
            adjustedRest = adjustedRest.replace('\\ca*', '');

        // Remove any other \zaln-s fields in the line
        // if (adjustedRest.indexOf('\\z') >= 0) console.log(`checkUSFMLineText here first at ${lineNumber} ${C}:${V} with ${marker}='${adjustedRest}'`);
        let nextZIndex;
        while ((nextZIndex = adjustedRest.indexOf('\\zaln-s ')) >= 0) {
            // console.log(`checkUSFMLineText here with ${marker}='${adjustedRest}'`);
            const ixZEnd = adjustedRest.indexOf('\\*');
            // console.log(`  ${nextZIndex} and ${ixZEnd}`);
            if (ixZEnd >= 0) {
                // console.assert(ixZEnd > nextZIndex, `Exected closure at ${ixZEnd} to be AFTER \\zaln-s (${nextZIndex})`);
                adjustedRest = adjustedRest.substring(0, nextZIndex) + adjustedRest.substring(ixZEnd + 2, adjustedRest.length);
                // console.log(`  Now '${adjustedRest}'`);
            } else {
                console.log(`\\zaln-s seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }
        // Remove any other \w fields in the line
        let nextWIndex;
        while ((nextWIndex = adjustedRest.indexOf('\\w ')) >= 0) {
            const ixWordEnd = adjustedRest.indexOf('|');
            if (ixWordEnd < 0 && adjustedRest.indexOf('lemma="') >= 0) {
                const characterIndex = nextWIndex + 5; // Presumably, a little bit into the word
                const extract = (characterIndex > halfLength ? '…' : '') + adjustedRest.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 911, message: 'Missing | character in \\w field', details, lineNumber, C, V, characterIndex, extract, location: lineLocation });
                adjustedRest = ''; // Avoid follow-on errors
                break;
            }
            console.assert(ixWordEnd > nextWIndex + 3, `Why2 is w| = ${ixWordEnd}? nextWIndex=${nextWIndex} ${languageCode} ${bookID} ${C}:${V} ${lineNumber}`);
            const ixWEnd = adjustedRest.indexOf('\\w*');
            if (ixWEnd >= 0) {
                console.assert(ixWEnd > nextWIndex, `Exected closure at ${ixWEnd} to be AFTER \\w (${nextWIndex})`);
                adjustedRest = adjustedRest.substring(0, nextWIndex) + adjustedRest.substring(nextWIndex + 3, ixWordEnd) + adjustedRest.substring(ixWEnd + 3, adjustedRest.length);
                // console.log(`After removing w field, got '${adjustedRest}'`);
            } else {
                console.log(`\\w seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }
        // Remove any other \f fields in the line
        let nextFIndex;
        while ((nextFIndex = adjustedRest.indexOf('\\f + ')) >= 0) {
            const ixFEnd = adjustedRest.indexOf('\\f*');
            if (ixFEnd >= 0) {
                console.assert(ixFEnd > nextWIndex, `Exected closure at ${ixFEnd} to be AFTER \\w (${nextFIndex})`);
                adjustedRest = adjustedRest.substring(0, nextFIndex) + adjustedRest.substring(nextFIndex + 5, ixFEnd) + adjustedRest.substring(ixFEnd + 3, adjustedRest.length);
                // console.log(`checkUSFMLineText(${lineNumber}, ${C}:${V}, ${marker}='${rest}', ${lineLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
                // console.log(`After removing footnote: '${adjustedRest}'`);
            } else {
                console.log(`\\f seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }

        if (adjustedRest) {
            let characterIndex;
            if ((characterIndex = adjustedRest.indexOf('"')) >= 0) {
                const extract = (characterIndex > halfLength ? '…' : '') + adjustedRest.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 776, message: 'Unexpected " straight quote character', details, lineNumber, C, V, extract, location: lineLocation });
                // console.log(`ERROR 776: in ${marker} '${adjustedRest}' from '${rest}'`);
            }
            if ((characterIndex = adjustedRest.indexOf("'")) >= 0) {
                const extract = (characterIndex > halfLength ? '…' : '') + adjustedRest.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 775, message: "Unexpected ' straight quote character", details, lineNumber, C, V, extract, location: lineLocation });
                // console.log(`ERROR 775: in ${marker} '${adjustedRest}' from '${rest}'`);
            }
            if (adjustedRest.indexOf('\\') >= 0 || adjustedRest.indexOf('|') >= 0) {
                // console.log(`checkUSFMLineText ${languageCode} ${filename} ${lineNumber} ${C}:${V} somehow ended up with ${marker}='${adjustedRest}'`);
                characterIndex = adjustedRest.indexOf('\\');
                if (characterIndex === -1) characterIndex = adjustedRest.indexOf('|');
                const extract = (characterIndex > halfLength ? '…' : '') + adjustedRest.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 875, message: "Unexpected USFM field", details, lineNumber, C, V, extract, location: lineLocation });
            }
            if (adjustedRest !== rest) // Only re-check if line has changed (because original is checked in checkUSFMLineInternals())
                // Note: false (below) is for allowedLinks flag
                ourCheckTextField(lineNumber, C, V, `from \\${marker}`, adjustedRest, false, lineLocation, optionalCheckingOptions);
        }
    }
    // end of checkUSFMLineText function


    function checkUSFMLineInternals(lineNumber, C, V, marker, rest, lineLocation, optionalCheckingOptions) {
        // Handles character formatting within the line contents
        // console.log(`checkUSFMLineInternals(${lineNumber}, ${C}:${V}, ${marker}='${rest}', ${lineLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);

        if (marker === 'c' && isNaN(rest))
            addNoticePartial({ priority: 822, message: "Expected \\c field to contain an integer", lineNumber, C, V, characterIndex: 3, extract: `\\c ${rest}`, location: lineLocation });
        if (marker === 'v') {
            let Vstr = (rest) ? rest.split(' ', 1)[0] : '?';
            if (isNaN(Vstr) && Vstr.indexOf('-') < 0)
                addNoticePartial({ priority: 822, C, V, message: "Expected \\v field to contain an integer", characterIndex: 3, extract: `\\v ${rest}`, location: lineLocation });
        }

        if (rest) checkUSFMLineText(lineNumber, C, V, marker, rest, lineLocation, optionalCheckingOptions);

        const allowedLinks = (marker === 'w' || marker === 'k-s' || marker === 'f' || marker === 'SPECIAL1')
            // (because we don't know what marker SPECIAL1 is, so default to "no false alarms")
            && rest.indexOf('x-tw') >= 0;
        if (rest) ourCheckTextField(lineNumber, C, V, `\\${marker}`, rest, allowedLinks, lineLocation, optionalCheckingOptions);
    }
    // end of checkUSFMLineInternals function


    function checkUSFMLineContents(lineNumber, C, V, marker, rest, lineLocation, optionalCheckingOptions) {
        // Looks at the marker and determines what content is allowed/expected on the rest of the line
        // 'SPECIAL1' is used internally here when a character other than a backslash starts a line
        if (ALLOWED_LINE_START_MARKERS.indexOf(marker) >= 0 || marker === 'SPECIAL1') {
            if (rest && MARKERS_WITHOUT_CONTENT.indexOf(marker) >= 0)
                if (isWhitespace(rest))
                    addNoticePartial({ priority: 301, message: `Unexpected whitespace after \\${marker} marker`, C, V, lineNumber, characterIndex: marker.length, extract: rest, location: lineLocation });
                else if (rest !== 'ס' && rest !== 'פ') // in UHB NEH 3:20 or EZR 3:18
                    addNoticePartial({ priority: 401, message: `Unexpected content after \\${marker} marker`, C, V, lineNumber, characterIndex: marker.length, extract: rest, location: lineLocation });
                else if (MARKERS_WITH_COMPULSORY_CONTENT.indexOf(marker) >= 0 && !rest)
                    addNoticePartial({ priority: 711, message: "Expected compulsory content", C, V, lineNumber, characterIndex: marker.length, location: ` after \\${marker} marker${lineLocation}` });
        } else // it's not a recognised line marker
            // Lower priority of deprecated \s5 markers (compared to all other unknown markers)
            addNoticePartial({ priority: marker === 's5' ? 111 : 809, message: `${marker === 's5' ? 'Deprecated' : 'Unexpected'} '\\${marker}' marker at start of line`, C, V, lineNumber, characterIndex: 1, location: lineLocation });
        if (rest) checkUSFMLineInternals(lineNumber, C, V, marker, rest, lineLocation, optionalCheckingOptions);
    }
    // end of checkUSFMLineContents function


    function mainUSFMCheck(bookID, filename, givenText, location) {
        // console.log("Running mainUSFMCheck() (can take quite a while for a large book)…");

        let ourLocation = location;
        if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

        let lowercaseBookID = bookID.toLowerCase();
        // eslint-disable-next-line no-unused-vars
        let numChaptersThisBook = 0;
        try {
            console.assert(lowercaseBookID !== 'obs', "Shouldn't happen in usfm-text-check2");
            numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
        }
        catch {
            if (!books.isValidBookID(bookID)) // must not be in FRT, BAK, etc.
                addNoticePartial({ priority: 903, message: "Bad function call: should be given a valid book abbreviation", extract: bookID, location: ` (not '${bookID}')${ourLocation}` });
        }

        function findStartMarker(C, V, lineNumber, USFMline) {
            // Returns the USFM marker at the start of the line
            //  (without the leading backslash but including full self-closing milestones)
            console.assert(USFMline && USFMline[0] === '\\', `Programming error in findStartMarker(${C}:${V}, ${lineNumber}, ${USFMline})`);
            let foundMarker = '';
            for (let characterIndex = 1; characterIndex < USFMline.length; characterIndex++) {
                const char = USFMline[characterIndex];
                if (char === ' ') break;
                // Cope with self-closing milestones like \k-s\*
                if (char === '\\' && (characterIndex === USFMline.length - 1 || USFMline[characterIndex + 1] !== '*')) {
                    const extract = USFMline.substring(0, extractLength) + (USFMline.length > extractLength ? '…' : '');
                    addNoticePartial({ priority: 603, message: "USFM marker doesn't end with space", C, V, lineNumber, characterIndex, extract, location: ourLocation });
                    break;
                }
                foundMarker += char;
                if (char === '*') break;
            }
            return foundMarker;
        }

        let lines = givenText.split('\n');
        // console.log(`  '${ourLocation}' has ${lines.length.toLocaleString()} total lines`);

        // let lastB = '';
        let lastC = '', lastV = '', C = '0', V = '0';
        let lastIntC = 0, lastIntV = 0;
        // let numVersesThisChapter = 0;
        let lastMarker = '', lastRest = '';
        const markerSet = new Set();
        for (let n = 1; n <= lines.length; n++) {
            let line = lines[n - 1];
            if (C === '0') V = n.toString();
            // console.log(`line '${line}'${atString}`);
            if (!line) {
                // addNoticePartial({priority:103, "Unexpected blank line", 0, '', location:ourLocation});
                continue;
            }
            let characterIndex;
            if ((characterIndex = line.indexOf('\r')) >= 0) {
                const iy = characterIndex + halfLength; // Want extract to focus more on what follows
                const extract = (iy > halfLength ? '…' : '') + line.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < line.length ? '…' : '')
                addNoticePartial({ priority: 703, C, V, message: "Unexpected CarriageReturn character", lineNumber: n, characterIndex, extract, location: ourLocation });
            }

            let marker, rest;
            if (line[0] === '\\') {
                marker = findStartMarker(C, V, n, line);
                rest = line.substring(marker.length + 2); // Skip backslash, marker, and space after marker
                // console.log(`Line ${n}: marker='\\${marker}' rest='${rest}'`);
            } else { // Line didn't start with a backslash
                // NOTE: Some unfoldingWord USFM Bibles commonly have this
                //          so it's not necessarily either an error or a warning
                rest = line;
                if (`([“‘`.indexOf(line[0]) < 0) { // These are the often expected characters
                    // Drop the priority if it's a "half-likely" character
                    addNoticePartial({ priority: `"`.indexOf(line[0]) < 0 ? 880 : 280, C, V, message: "Expected line to start with backslash", lineNumber: n, characterIndex: 0, extract: line[0], location: ourLocation });
                    if (line[1] === '\\') { // Let's drop the leading punctuation and try to check the rest of the line
                        marker = line.substring(2).split(' ', 1)[0];
                        rest = line.substring(marker.length + 2 + 1); // Skip leading character, backslash, marker, and space after marker
                        // console.log(`USFM after ${line[0]} got '\\${marker}': '${rest}'`);
                    }
                    else
                        marker = 'rem'; // to try to avoid consequential errors, but the rest of the line won't be checked
                } else { // How do we handle an allowed line that doesn't start with a backslash?
                    // Can't use 'rem' because we want the rest of the line checked
                    marker = 'SPECIAL1'; // Handle as a special case
                }
            }
            markerSet.add(marker); // Keep track of all line markers

            // Handle C/V numbers including verse bridges
            let intC, intV, vIndex;
            if (marker === 'c') {
                C = rest; V = '0';
                try {
                    intC = ourParseInt(C);
                } catch (usfmICerror) {
                    addNoticePartial({ priority: 724, C, V, message: "Unable to convert chapter number to integer", lineNumber: n, characterIndex: 3, extract: `${rest.substring(0, halfLength)}${rest.length > halfLength ? '…' : ''}`, location: ourLocation });
                    intC = -999; // Used to prevent consequential errors
                }
                if (C === lastC || (intC > 0 && intC !== lastIntC + 1))
                    addNoticePartial({ priority: 764, C, V, message: "Chapter number didn't increment correctly", lineNumber: n, characterIndex: 3, extract: `${rest.substring(0, halfLength)}${rest.length > halfLength ? '…' : ''} (${lastC ? lastC : '0'} → ${C})`, location: ourLocation });
                lastC = C; lastV = '0';
                lastIntC = intC; lastIntV = 0;
            } else if (marker === 'v') {
                V = (rest) ? rest.split(' ', 1)[0] : '?';
                if (V.indexOf('-') < 0) { // no hyphen -> no verse bridge
                    try {
                        intV = ourParseInt(V);
                    } catch (usfmIVerror) {
                        addNoticePartial({ priority: 723, C, V, message: "Unable to convert verse number to integer", lineNumber: n, characterIndex: 3, extract: `${rest.substring(0, halfLength)}${rest.length > halfLength ? '…' : ''}`, location: ourLocation });
                        intV = -999; // Used to prevent consequential errors
                    }
                    if (V === lastV || (intV > 0 && intV !== lastIntV + 1))
                        addNoticePartial({ priority: 763, C, V, message: "Verse number didn't increment correctly", lineNumber: n, characterIndex: 3, extract: `${rest.substring(0, halfLength)}${rest.length > halfLength ? '…' : ''} (${lastV ? lastV : '0'} → ${V})`, location: ourLocation });
                    lastV = V; lastIntV = intV;
                } else { // handle verse bridge
                    const bits = V.split('-');
                    const firstV = bits[0], secondV = bits[1];
                    let intFirstV, intSecondV;
                    try {
                        intFirstV = ourParseInt(firstV);
                        intSecondV = ourParseInt(secondV);
                    } catch (usfmV12error) {
                        addNoticePartial({ priority: 762, C, V, message: "Unable to convert verse bridge numbers to integers", lineNumber: n, characterIndex: 3, extract: `${rest.substring(0, Math.max(9, extractLength))}${rest.length > extractLength ? '…' : ''}`, location: ourLocation });
                        intFirstV = -999; intSecondV = -998; // Used to prevent consequential errors
                    }
                    if (intSecondV <= intFirstV)
                        addNoticePartial({ priority: 769, C, V, message: "Verse bridge numbers not in ascending order", lineNumber: n, characterIndex: 3, extract: `${rest.substring(0, Math.max(9, extractLength))}${rest.length > extractLength ? '…' : ''} (${firstV} → ${secondV})`, location: ourLocation });
                    else if (firstV === lastV || (intFirstV > 0 && intFirstV !== lastIntV + 1))
                        addNoticePartial({ priority: 766, C, V, message: "Bridged verse numbers didn't increment correctly", lineNumber: n, characterIndex: 3, extract: `${rest.substring(0, Math.max(9, extractLength))}${rest.length > extractLength ? '…' : ''} (${lastV} → ${firstV})`, location: ourLocation });
                    lastV = secondV; lastIntV = intSecondV;
                }
            } else if ((vIndex = rest.indexOf('\\v ')) >= 0) {
                // verse number marker follows another marker on the same line, so it's inside `rest`
                const restRest = rest.substring(vIndex + 3);
                // console.log(`Got restRest=${restRest}`);
                try {
                    intV = parseInt(restRest);
                    // console.log("Got", intV);
                } catch (usfmIIVerror) {
                    addNoticePartial({ priority: 720, C, V, message: "Unable to convert internal verse number to integer", lineNumber: n, characterIndex: 3, extract: `${restRest.substring(0, halfLength)}${restRest.length > halfLength ? '…' : ''}`, location: ourLocation });
                    intV = -999; // Used to prevent consequential errors
                }
                if (intV > 0 && intV !== lastIntV + 1)
                    addNoticePartial({ priority: 761, C, V, message: "Verse number didn't increment correctly", lineNumber: n, characterIndex: 3, extract: `${restRest.substring(0, halfLength)}${restRest.length > halfLength ? '…' : ''} (${lastV ? lastV : '0'} → ${V})`, location: ourLocation });
                lastV = intV.toString(); lastIntV = intV;
            }

            if (marker === 'id' && !rest.startsWith(bookID)) {
                const thisLength = Math.max(4, extractLength);
                const extract = `${rest.substring(0, thisLength)}${rest.length > thisLength ? '…' : ''}`;
                addNoticePartial({ priority: 987, C, V, message: "Expected \\id line to start with book identifier", lineNumber: n, characterIndex: 4, extract, location: ourLocation });
            }

            // Check the order of markers
            // In headers
            if (marker === 'toc2' && lastMarker !== 'toc1')
                addNoticePartial({ priority: 87, C, V, message: "Expected \\toc2 line to follow \\toc1", lineNumber: n, characterIndex: 1, details: `(not '\\${lastMarker}')`, location: ourLocation });
            else if (marker === 'toc3' && lastMarker !== 'toc2')
                addNoticePartial({ priority: 87, C, V, message: "Expected \\toc3 line to follow \\toc2", lineNumber: n, characterIndex: 1, details: `(not '\\${lastMarker}')`, location: ourLocation });
            // In chapters
            else if ((PARAGRAPH_MARKERS.indexOf(marker) >= 0 || marker === 's5' || marker === 'ts\\*')
                && PARAGRAPH_MARKERS.indexOf(lastMarker) >= 0
                && !lastRest)
                addNoticePartial({ priority: 399, C, V, message: "Useless paragraph marker", lineNumber: n, characterIndex: 1, details: `('\\${lastMarker}' before '\\${marker}')`, location: ourLocation });
            else if (['c', 'ca', 'cl'].indexOf(lastMarker) > 0 && marker === 'v')
                addNoticePartial({ priority: C === '1' ? 657 : 457, C, V, message: "Paragraph marker expected before first verse", lineNumber: n, characterIndex: 1, details: `('\\${marker}' after '\\${lastMarker}')`, location: ourLocation });

            // Do general checks
            checkUSFMLineContents(n, C, V, marker, rest, ourLocation, optionalCheckingOptions);

            lastMarker = marker; lastRest = rest;
        }

        // Do overall global checks of the entire text
        checkUSFMFileContents(filename, givenText, markerSet, ourLocation) // Do this last so the results are lower in the lists

        addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'} for ${bookID}${ourLocation}`)
    }

    /* function runSlowTask(which) {
        // Ideally these should be run in parallel using multiprocessing
        //  See https://hackernoon.com/multithreading-multiprocessing-and-the-nodejs-event-loop-5b2929bd450b
        console.log(`runSlowTask(${which})`)
        return (which === 1)
            ? mainUSFMCheck(bookID, filename, givenText, location)
            : runBCSGrammarCheck(filename, givenText, location);
    }
    // Main code for checkUSFMText()
    console.log("Starting USFM checking tasks…");
    const tasks = [1,2].map(runSlowTask);
    const allResults = await Promise.all(tasks);
    console.log(`  Finished all tasks with ${JSON.stringify(allResults)}.`);
    console.log("  Finished all tasks.");
    if (!allResults[1].isValidUSFM)
        addNoticePartial({priority: 942, "USFM Grammar check fails", location});
    console.log("  Warnings:", JSON.stringify(allResults[1].warnings));
    // Display these warnings but with a lower priority
    for (const warningString of allResults[1].warnings)
        addNoticePartial({priority:103, `USFMGrammar: ${warningString.trim()}`, location});
    */

    // NOTE: If we're careful about how/when we add their notices to our global list,
    //  we should be able to run these three slowish checks in parallel on different threads/processes
    let allResults = [];
    allResults.push(mainUSFMCheck(bookID, filename, givenText, ourLocation));
    allResults.push(CVCheck(bookID, givenText, ourLocation));
    if (!books.isExtraBookID(bookID))
        allResults.push(ourRunBCSGrammarCheck(filename, givenText, ourLocation));
    // console.assert(allResults.length === 2);
    // console.log("allResults", JSON.stringify(allResults));
    // if (!allResults[1].isValidUSFM)
    //     addNoticePartial({priority: 941, "USFM Grammar check fails", location});
    // console.log("  Warnings:", JSON.stringify(allResults[1].warnings));
    // // Display these warnings but with a lower priority
    // for (const warningString of allResults[1].warnings)
    // addNoticePartial({priority:103, `USFMGrammar: ${warningString.trim()}`, location});

    // console.log(`  checkUSFMText returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log(`checkUSFMText result is ${JSON.stringify(result)}`);
    return result;
}
// end of checkUSFMText function
