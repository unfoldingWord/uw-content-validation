// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { isWhitespace, countOccurrences, ourDeleteAll } from './text-handling-functions'
import * as books from '../core/books/books';
import { checkTextField } from './field-text-check';
import { checkTextfileContents } from './file-text-check';
import { runUsfmJsCheck } from './usfm-js-check';
import { runBCSGrammarCheck } from './BCS-usfm-grammar-check';
import { checkNotesLinksToOutside } from './notes-links-check';
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, parameterAssert, logicAssert, dataAssert, ourParseInt } from './utilities';
import { removeDisabledNotices } from './disabled-notices';


// const USFM_VALIDATOR_VERSION_STRING = '0.8.15';


const VALID_LINE_START_CHARACTERS = `([“‘—`; // Last one is em-dash — '{' gets added later for STs

// See http://ubsicap.github.io/usfm/master/index.html
// const COMPULSORY_MARKERS = ['id', 'ide']; // These are specifically checked for by the code near the start of mainUSFMCheck()
const EXPECTED_MARKERS = ['usfm', 'mt1']; // The check also allows for removal of the final '1'
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
    'r', 'd', 'rem', 'sp', 'cl',
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
const MAIN_NOTE_MARKERS = ['f', 'x'];
const SPECIAL_MARKERS = ['w', 'zaln-s', 'k-s',
    'qt-s', 'qt1-s', 'qt2-s',
    'lit'];
const MILESTONE_MARKERS = ['ts\\*', 'ts-s', 'ts-e', 'k-e\\*']; // Is this a good way to handle it???
const MARKERS_WITHOUT_CONTENT = ['b', 'nb', 'ib', 'ie'].concat(MILESTONE_MARKERS);
const ALLOWED_LINE_START_MARKERS = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(CV_MARKERS).concat(PARAGRAPH_MARKERS)
    .concat(MAIN_NOTE_MARKERS).concat(SPECIAL_MARKERS).concat(MARKERS_WITHOUT_CONTENT)
    .concat(MILESTONE_MARKERS).concat(['qs']);
const DEPRECATED_MARKERS = [
    'h1', 'h2', 'h3', 'h4',
    'pr',
    'ph', 'ph1', 'ph2', 'ph3', 'ph4',
    'addpn', 'pro', 'fdc', 'xdc'];
const MARKERS_WITH_COMPULSORY_CONTENT = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_TYPE_MARKERS)
    .concat(CV_MARKERS).concat(MAIN_NOTE_MARKERS).concat(SPECIAL_MARKERS);
const FOOTNOTE_INTERNAL_MARKERS = ['fr', 'fq', 'fqa', 'fk', 'fl', 'fw', 'fp', 'fv', 'ft', 'fdc', 'fm', 'xt'];
const XREF_INTERNAL_MARKERS = ['xo', 'xk', 'xq', 'xt', 'xta', 'xop', 'xot', 'xnt', 'xdc', 'rq'];
const SIMPLE_CHARACTER_MARKERS = ['add', 'bk', 'dc', 'k', 'nd', 'ord', 'pn', 'png', 'addpn',
    'qs', 'qt', 'sig', 'sls', 'tl', 'wj',
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
    .concat(MAIN_NOTE_MARKERS).concat(SPECIAL_MARKERS);
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
    ['\\w ', '\\w*'], // Note that we also have \+w and \+w* in our files
    ['\\wa ', '\\wa*'], ['\\wg ', '\\wg*'], ['\\wh ', '\\wh*'],
    ['\\wj ', '\\wj*'],

    ['\\ca ', '\\ca*'], ['\\va ', '\\va*'],

    ['\\f ', '\\f*'], ['\\x ', '\\x*'],
];

const W_REGEX = new RegExp('\\\\\\+?w ([^\\\\]+?)\\\\\\+?w\\*', 'g'); // \w ...\w* or \+w ...\+w*
const ZALNS_REGEX = new RegExp('\\\\zaln-s (.+?)\\\\\\*', 'g');
const KS_REGEX = new RegExp('\\\\k-s (.+?)\\\\\\*', 'g');
const ATTRIBUTE_REGEX = new RegExp('[ |]([^ |]+?)="([^"]*?)"', 'g');
const HEBREW_CANTILLATION_REGEX = new RegExp('[֑֖֛֢֣֤֥֦֧֪֚֭֮֒֓֔֕֗֘֙֜֝֞֟֠֡֨֩֫֬֯]', 'g'); // There's 31 accent marks in there

const BAD_HEBREW_VOWEL_DAGESH_REGEX = new RegExp('[\\u05b4\\u05b5\\u05b6\\u05b7\\u05b8\\u05b9\\u05ba\\05bb]\\u05bc', 'g');


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode -- e.g., 'UHB', 'UGNT', 'LT' or 'ST'
 * @param {string} bookID
 * @param {string} filename
 * @param {string} givenText
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkUSFMText(languageCode, repoCode, bookID, filename, givenText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

    bookID is a three-character UPPERCASE USFM book identifier.

    filename parameter can be an empty string if we don’t have one.

     Returns a result object containing a successList and a noticeList
     */
    // functionLog(`checkUSFMText(${languageCode}, ${repoCode}, ${bookID}, ${filename}, ${givenText.length.toLocaleString()} chars, '${givenLocation}', ${JSON.stringify(checkingOptions)})…`);
    // const match = HEBREW_CANTILLATION_REGEX.exec('\\f + \\ft Q \\+w הִנֵּ֤ה|lemma="הִנֵּ֤ה" strong="H2009" x-morph="He,Tm"\\+w*\\f*');
    // console.log(`Got test cantillation match: ${typeof match} ${match.length} '${JSON.stringify(match)}'`);

    //parameterAssert(languageCode !== undefined, "checkUSFMText: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkUSFMText: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    //parameterAssert(repoCode !== undefined, "checkUSFMText: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkUSFMText: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkUSFMText: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(bookID !== undefined, "checkUSFMText: 'bookID' parameter should be defined");
    //parameterAssert(typeof bookID === 'string', `checkUSFMText: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    //parameterAssert(bookID.length === 3, `checkUSFMText: 'bookID' parameter should be three characters long not ${bookID.length}`);
    //parameterAssert(bookID.toUpperCase() === bookID, `checkUSFMText: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkUSFMText: '${bookID}' is not a valid USFM book identifier`);
    //parameterAssert(filename !== undefined, "checkUSFMText: 'filename' parameter should be defined");
    //parameterAssert(typeof filename === 'string', `checkUSFMText: 'filename' parameter should be a string not a '${typeof filename}'`);
    //parameterAssert(givenLocation !== undefined, "checkUSFMText: 'givenRowLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkUSFMText: 'givenRowLocation' parameter should be a string not a '${typeof givenLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "checkUSFMText: 'checkingOptions' parameter should be defined");

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

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

    const lowercaseBookID = bookID.toLowerCase();

    let validLineStartCharacters = VALID_LINE_START_CHARACTERS;
    if (repoCode === 'ST') validLineStartCharacters += '{';

    const result = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // functionLog(`checkUSFMText success: ${successString}`);
        result.successList.push(successString);
    }
    function addNoticePartial(noticeObject) {
        // debugLog("checkUSFMText addNoticePartial:", JSON.stringify(noticeObject));
        // functionLog(`checkUSFMText addNoticePartial: (priority=${noticeObject.priority}) ${noticeObject.C}:${noticeObject.V} ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? ` ${noticeObject.excerpt}` : ""}${noticeObject.location}`);
        //parameterAssert(noticeObject.priority !== undefined, "cUSFM addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `cUSFM addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "cUSFM addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `cUSFM addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(C !== undefined, "cUSFM addNoticePartial: 'C' parameter should be defined");
        if (noticeObject.C) { //parameterAssert(typeof noticeObject.C === 'string', `cUSFM addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}': ${noticeObject.C}`);
        }
        // //parameterAssert(V !== undefined, "cUSFM addNoticePartial: 'V' parameter should be defined");
        if (noticeObject.V) { //parameterAssert(typeof noticeObject.V === 'string', `cUSFM addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}': ${noticeObject.V}`);
        }
        // //parameterAssert(characterIndex !== undefined, "cUSFM addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex !== undefined) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cUSFM addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "cUSFM addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cUSFM addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "cUSFM addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `cUSFM addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // Doublecheck -- we don’t want "Mismatched {}" per line, only per file
        // eslint-disable-next-line no-unused-vars
        const noticeObjectString = JSON.stringify(noticeObject);
        //parameterAssert(noticeObject.message.indexOf("Mismatched {}") === -1 || noticeObject.lineNumber === undefined, `checkUSFMText addNoticePartial: got bad notice: ${noticeObjectString}`);
        //parameterAssert(noticeObjectString.indexOf('NONE') === -1 && noticeObjectString.indexOf('SPECIAL') === -1, `checkUSFMText addNoticePartial: 'NONE' & 'SPECIAL' shouldn't make it thru to end user: ${noticeObjectString}`)
        if (noticeObject.debugChain) noticeObject.debugChain = `checkUSFMText ${noticeObject.debugChain}`;
        result.noticeList.push({ ...noticeObject, bookID, filename });
    }


    function ourRunBCSGrammarCheck(filename, fileText, fileLocation) {
        // Runs the BCS USFM Grammar checker
        //  which can be quite time-consuming on large, complex USFM files
        // functionLog("Running our BCS USFM grammar check (can take quite a while for a large book)…");

        const grammarCheckResult = runBCSGrammarCheck('strict', bookID, fileText, filename, fileLocation, checkingOptions);
        // NOTE: We haven’t figured out how to get ERRORS out of this parser yet
        // debugLog(`  Finished our BCS USFM grammar check with ${grammarCheckResult.isValidUSFM} and ${grammarCheckResult.warnings.length} warnings.`);
        addSuccessMessage(`Checked USFM Grammar (strict mode) ${grammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN’T validate)"}`);

        // if (!grammarCheckResult.isValidUSFM) // TEMP DEGRADE TO WARNING 994 -> 544 ................XXXXXXXXXXXXXXXXXXXXXX
        // Don’t do this since we add the actual error message elsewhere now
        // addNoticePartial({priority:994, '', '', `USFM3 Grammar Check (strict mode) doesn’t pass`, location:fileLocation});

        // We only get one error if it fails
        if (grammarCheckResult.error && grammarCheckResult.error.priority)
            // Prevent these false alarms (from Ohm schema issues, esp. empty lemma="" fields)
            if (!grammarCheckResult.error.excerpt
                // Note: checking the excerpt might not always be reliable if they choose a length < 10
                || (grammarCheckResult.error.excerpt.indexOf('mma="" ') < 0 // see https://github.com/Bridgeconn/usfm-grammar/issues/87
                    && grammarCheckResult.error.message.indexOf('Expected "c", "v", ') < 0 // forgotten what this prevents ???
                    && grammarCheckResult.error.message.indexOf('Expected "f*", "+", ') < 0 // see https://github.com/Bridgeconn/usfm-grammar/issues/86
                ))
                addNoticePartial(grammarCheckResult.error);

        // debugLog("  Warnings:", JSON.stringify(grammarCheckResult.warnings));
        // Display these warnings but with a lower priority
        for (const warningString of grammarCheckResult.warnings)
            if (!warningString.startsWith("Empty lines present") // we allow empty lines in our USFM
                && !warningString.startsWith("Trailing spaces present at line end") // we find these ourselves
            )
                addNoticePartial({ priority: 102, message: `USFMGrammar: ${warningString}`, location: fileLocation });

        if (!grammarCheckResult.isValidUSFM) {
            const relaxedGrammarCheckResult = runBCSGrammarCheck('relaxed', bookID, fileText, filename, fileLocation);
            addSuccessMessage(`Checked USFM Grammar (relaxed mode) ${relaxedGrammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN’T validate)"}`);
            if (!relaxedGrammarCheckResult.isValidUSFM)
                addNoticePartial({ priority: 644, message: "USFM3 Grammar Check (relaxed mode) doesn’t pass either", location: fileLocation });
        }
    }
    // end of ourRunBCSGrammarCheck function


    function CVCheck(bookID, givenText, CVlocation) {
        /*
        This check uses the USFM-JS package to parse the USFM
            and then it checks the results to make sure all expected verses are there.

        This has the side advantage that it’s using exactly the same code/package that’s
            used by tCore and tC Create.

        Note that for verse bridges, USFM-JS returns the bridge, e.g., 24-25
            AS WELL AS an entry for the bridged verses, e.g., 24 and 25.

        Sadly this package doesn’t return any errors or warnings from its parsing
            so that’s handle other ways in other places.

        Note that this code below does NOT check for chapters and verses
            being in the correct order. That’s done elsewhere.
        */
        // functionLog(`Running CVCheck(${bookID}, ${givenText.length}, ${CVlocation}) using USFM-JS (can take quite a while for a large book)…`);

        let chapterNumberString, verseNumberString;

        const MINIMUM_TEXT_WORDS = 4;
        const MINIMUM_WORD_LENGTH = 2;
        function hasText(verseObjects) {
            let gotDeep = false;
            for (const someObject of verseObjects) {
                // debugLog("someObject", JSON.stringify(someObject));
                if (someObject['type'] === 'text' && someObject['text'].length > MINIMUM_TEXT_WORDS)
                    return true;
                if (someObject['type'] === 'word' && someObject['text'].length > MINIMUM_WORD_LENGTH)
                    return true;
                if (someObject['type'] === 'milestone')
                    for (const someSubobject of someObject['children']) {
                        // debugLog("someSubobject", JSON.stringify(someSubobject));
                        if (someSubobject['type'] === 'text' && someSubobject['text'].length > MINIMUM_TEXT_WORDS)
                            return true;
                        if (someSubobject['type'] === 'word' && someSubobject['text'].length > MINIMUM_WORD_LENGTH)
                            return true;
                        if (someSubobject['type'] === 'milestone')
                            for (const someSub2object of someSubobject['children']) {
                                // debugLog("someSub2object", JSON.stringify(someSub2object));
                                if (someSub2object['type'] === 'text' && someSub2object['text'].length > MINIMUM_TEXT_WORDS)
                                    return true;
                                if (someSub2object['type'] === 'word' && someSub2object['text'].length > MINIMUM_WORD_LENGTH)
                                    return true;
                                if (someSub2object['type'] === 'milestone')
                                    for (const someSub3object of someSub2object['children']) {
                                        // debugLog("someSub3object", JSON.stringify(someSub3object));
                                        if (someSub3object['type'] === 'text' && someSub3object['text'].length > MINIMUM_TEXT_WORDS)
                                            return true;
                                        if (someSub3object['type'] === 'word' && someSub3object['text'].length > MINIMUM_WORD_LENGTH)
                                            return true;
                                        if (someSub3object['type'] === 'milestone')
                                            for (const someSub4object of someSub3object['children']) {
                                                // debugLog("someSub4object", JSON.stringify(someSub4object));
                                                if (someSub4object['type'] === 'text' && someSub4object['text'].length > MINIMUM_TEXT_WORDS)
                                                    return true;
                                                if (someSub4object['type'] === 'word' && someSub4object['text'].length > MINIMUM_WORD_LENGTH)
                                                    return true;
                                                if (someSub4object['type'] === 'milestone')
                                                    for (const someSub5object of someSub4object['children']) {
                                                        // debugLog("someSub5object", JSON.stringify(someSub5object));
                                                        if (someSub5object['type'] === 'text' && someSub5object['text'].length > MINIMUM_TEXT_WORDS)
                                                            return true;
                                                        if (someSub5object['type'] === 'word' && someSub5object['text'].length > MINIMUM_WORD_LENGTH)
                                                            return true;
                                                        if (someSub5object['type'] === 'milestone')
                                                            for (const someSub6object of someSub5object['children']) {
                                                                // debugLog("someSub6object", bookID, CVlocation, JSON.stringify(someSub6object));
                                                                if (someSub6object['type'] === 'text' && someSub6object['text'].length > MINIMUM_TEXT_WORDS)
                                                                    return true;
                                                                if (someSub6object['type'] === 'word' && someSub6object['text'].length > MINIMUM_WORD_LENGTH)
                                                                    return true;
                                                                if (someSub6object['type'] === 'milestone')
                                                                    for (const someSub7object of someSub6object['children']) {
                                                                        // debugLog("someSub7object", bookID, CVlocation, JSON.stringify(someSub7object));
                                                                        if (someSub7object['type'] === 'text' && someSub7object['text'].length > MINIMUM_TEXT_WORDS)
                                                                            return true;
                                                                        if (someSub7object['type'] === 'word' && someSub7object['text'].length > MINIMUM_WORD_LENGTH)
                                                                            return true;
                                                                        if (someSub7object['type'] === 'milestone')
                                                                            // UST Luke 15:3 has eight levels of nesting !!!
                                                                            for (const someSub8object of someSub7object['children']) {
                                                                                // debugLog("someSub8object", bookID, CVlocation, JSON.stringify(someSub8object));
                                                                                if (someSub8object['type'] === 'text' && someSub8object['text'].length > MINIMUM_TEXT_WORDS)
                                                                                    return true;
                                                                                if (someSub8object['type'] === 'word' && someSub8object['text'].length > MINIMUM_WORD_LENGTH)
                                                                                    return true;
                                                                                if (someSub8object['type'] === 'milestone')
                                                                                    for (const someSub9object of someSub8object['children']) {
                                                                                        // debugLog("someSub9object", bookID, CVlocation, JSON.stringify(someSub9object));
                                                                                        if (someSub9object['type'] === 'text' && someSub9object['text'].length > MINIMUM_TEXT_WORDS)
                                                                                            return true;
                                                                                        if (someSub9object['type'] === 'word' && someSub9object['text'].length > MINIMUM_WORD_LENGTH)
                                                                                            return true;
                                                                                        if (someSub9object['type'] === 'milestone')
                                                                                            for (const someSub10object of someSub9object['children']) {
                                                                                                // debugLog("someSub10object", bookID, CVlocation, JSON.stringify(someSub10object));
                                                                                                if (someSub10object['type'] === 'text' && someSub10object['text'].length > MINIMUM_TEXT_WORDS)
                                                                                                    return true;
                                                                                                if (someSub10object['type'] === 'word' && someSub10object['text'].length > MINIMUM_WORD_LENGTH)
                                                                                                    return true;
                                                                                                if (someSub10object['type'] === 'milestone')
                                                                                                    // UST Obadiah 1:8 has eleven levels of nesting !!!
                                                                                                    for (const someSub11object of someSub10object['children']) {
                                                                                                        // debugLog("someSub11object", bookID, CVlocation, JSON.stringify(someSub11object));
                                                                                                        if (someSub11object['type'] === 'text' && someSub11object['text'].length > MINIMUM_TEXT_WORDS)
                                                                                                            return true;
                                                                                                        if (someSub11object['type'] === 'word' && someSub11object['text'].length > MINIMUM_WORD_LENGTH)
                                                                                                            return true;
                                                                                                        if (someSub11object['type'] === 'milestone')
                                                                                                            gotDeep = true;
                                                                                                    }
                                                                                            }
                                                                                    }
                                                                            }
                                                                    }
                                                            }
                                                    }
                                            }
                                    }
                            }
                    }
            }
            if (gotDeep) logicAssert(false, `We need to add more depth levels to hasText() for ${bookID} ${chapterNumberString}:${verseNumberString}`);
            // debugLog(`hasText() for ${chapterNumberString}:${verseNumberString} returning false with ${typeof verseObjects} (${verseObjects.length}): ${JSON.stringify(verseObjects)}`);
            return false;
        }
        // end of hasText function


        // Main code for CVCheck function
        // const lowercaseBookID = bookID.toLowerCase();
        let expectedVersesPerChapterList = [];
        try {
            logicAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in usfm-text-check1");
            expectedVersesPerChapterList = books.expectedVersesPerChapterList(bookID); // A list of integers -- numVerses for each chapter
            // debugLog("Got chapterList", JSON.stringify(expectedVersesPerChapterList));
        }
        catch { }

        // Try doing this using USFM-JS via runUsfmJsCheck()
        const result1 = runUsfmJsCheck(givenText);
        // debugLog("Got a JSON result", JSON.stringify(result1));
        // debugLog("Got a JSON headers result", JSON.stringify(result1.returnedJSON.headers));
        // debugLog("Got a JSON chapters result", JSON.stringify(result1.returnedJSON.chapters));
        for (chapterNumberString in result1.returnedJSON.chapters) {
            // debugLog(`chapterNumberString=${chapterNumberString}`);
            // if (chapterNumberString === '3')
            //     userLog(`chapter ${chapterNumberString} ${JSON.stringify(result1.returnedJSON.chapters[chapterNumberString])}`);
            let chapterInt;
            try {
                chapterInt = ourParseInt(chapterNumberString);
            } catch (usfmCIerror) {
                userLog(`CVCheck couldn’t convert ${bookID} chapter '${chapterNumberString}': ${usfmCIerror}`);
            }
            if (chapterInt < 1 || chapterInt > expectedVersesPerChapterList.length)
                addNoticePartial({ priority: 869, message: "Chapter number out of range", C: chapterNumberString, excerpt: `${bookID} ${chapterNumberString}`, location: CVlocation });
            else {
                let discoveredVerseList = [], discoveredVerseWithTextList = [];
                // debugLog(`Chapter ${chapterNumberString} verses ${Object.keys(result1.returnedJSON.chapters[chapterNumberString])}`);
                for (verseNumberString in result1.returnedJSON.chapters[chapterNumberString]) {
                    if (verseNumberString === 'front') continue; // skip the rest here
                    // if (chapterNumberString === '3')
                    //     userLog(`verseNumberString=${verseNumberString}`);
                    // if (chapterNumberString === '3' && verseNumberString === '14')
                    //     userLog(`verse ${verseNumberString} ${JSON.stringify(result1.returnedJSON.chapters[chapterNumberString][verseNumberString])}`);
                    const verseObjects = result1.returnedJSON.chapters[chapterNumberString][verseNumberString]['verseObjects'];
                    // if (chapterNumberString === '3' && verseNumberString === '14')
                    //     userLog(`verseObjects=${verseObjects}`);
                    const verseHasText = hasText(verseObjects);
                    if (verseNumberString.indexOf('-') >= 0) { // It’s a verse bridge
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
                            addNoticePartial({ priority: 762, message: "Unable to convert verse bridge numbers to integers", C: chapterNumberString, V: verseNumberString, characterIndex: 3, excerpt: verseNumberString, location: `${CVlocation} with ${usfmVIerror}` });
                        }
                    } else { // It’s NOT a verse bridge
                        let verseInt;
                        try {
                            verseInt = ourParseInt(verseNumberString);
                            discoveredVerseList.push(verseInt);
                        } catch (usfmPIerror) {
                            userLog(`We couldn’t convert ${bookID} ${chapterNumberString} verse '${verseNumberString}': ${usfmPIerror}`);
                        }

                        if (verseInt < 1 || verseInt > expectedVersesPerChapterList[chapterInt - 1])
                            addNoticePartial({ priority: 868, message: "Verse number out of range", C: chapterNumberString, V: verseNumberString, excerpt: `${bookID} ${chapterNumberString}:${verseNumberString}`, location: CVlocation });

                        if (verseHasText)
                            discoveredVerseWithTextList.push(verseInt);
                    }
                }

                // Check that expected verses numbers were actually all there
                // debugLog("Doing missing verse check");
                for (let v = 1; v <= expectedVersesPerChapterList[chapterInt - 1]; v++) {
                    if (!discoveredVerseList.includes(v))
                        if (books.isOftenMissing(bookID, chapterInt, v))
                            addNoticePartial({ priority: 67, C: chapterNumberString, V: `${v}`, message: "Verse appears to be left out", location: CVlocation });
                        else
                            addNoticePartial({ priority: 867, C: chapterNumberString, V: `${v}`, message: "Verse appears to be missing", location: CVlocation });
                    // Check for existing verses but missing text
                    if (!discoveredVerseWithTextList.includes(v)) {
                        // const firstVerseObject = result1.returnedJSON.chapters[chapterNumberString][v]['verseObjects'][0];
                        // debugLog("firstVerseObject", JSON.stringify(firstVerseObject));
                        addNoticePartial({ priority: 866, C: chapterNumberString, V: `${v}`, message: "Verse seems to have no text", location: CVlocation });
                    }
                }
            }
        }
        addSuccessMessage(`Checked C:V patterns for ${bookID}${CVlocation}`);
    }
    // end of CVCheck function


    /**
    * @description - checks the given text field and processes the returned results
    * @param {number} lineNumber -- 1-based integer
    * @param {string} C - chapter number of the text being checked
    * @param {string} V - verse number of the text being checked
    * @param {string} fieldType - If 'USFM', fieldName will be the line marker, and fieldText will be the line text; If 'raw', fieldName will be 'from {marker}' and fieldText will have internal USFM markers removed
    * @param {string} fieldName - name of the field being checked
    * @param {string} fieldText - the actual text of the field being checked
    * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
    * @param {string} fieldLocation - description of where the field is located
    * @param {Object} checkingOptions - parameters that might affect the check
    */
    function ourCheckTextField(lineNumber, C, V, fieldType, fieldName, fieldText, allowedLinks, fieldLocation, checkingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`cUSFM ourCheckTextField(${lineNumber}, ${C}:${V}, ${fieldName}, (${fieldText.length} chars), ${allowedLinks}, ${fieldLocation}, ${JSON.stringify(checkingOptions)})…`);
        //parameterAssert(lineNumber !== undefined, "cUSFM ourCheckTextField: 'lineNumber' parameter should be defined");
        //parameterAssert(typeof lineNumber === 'number', `cUSFM ourCheckTextField: 'lineNumber' parameter should be a number not a '${typeof lineNumber}'`);
        //parameterAssert(C !== undefined, "cUSFM ourCheckTextField: 'C' parameter should be defined");
        //parameterAssert(typeof C === 'string', `cUSFM ourCheckTextField: 'C' parameter should be a string not a '${typeof C}'`);
        //parameterAssert(V !== undefined, "cUSFM ourCheckTextField: 'V' parameter should be defined");
        //parameterAssert(typeof V === 'string', `cUSFM ourCheckTextField: 'V' parameter should be a string not a '${typeof V}'`);
        //parameterAssert(fieldType !== undefined, "cUSFM ourCheckTextField: 'fieldType' parameter should be defined");
        //parameterAssert(typeof fieldType === 'string', `cUSFM ourCheckTextField: 'fieldType' parameter should be a string not a '${typeof fieldType}'`);
        //parameterAssert(fieldType === 'USFM' || fieldType === 'raw', `cUSFM ourCheckTextField: Unrecognized 'fieldType' parameter: ${fieldType}`);
        //parameterAssert(fieldName !== undefined, "cUSFM ourCheckTextField: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `cUSFM ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldName !== '', `cUSFM ourCheckTextField: ${fieldType} 'fieldName' parameter should be not be an empty string`);
        //parameterAssert(fieldText !== undefined, "cUSFM ourCheckTextField: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `cUSFM ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "cUSFM ourCheckTextField: allowedLinks parameter must be either true or false");
        //parameterAssert(fieldLocation !== undefined, "cUSFM ourCheckTextField: 'fieldLocation' parameter should be defined");
        //parameterAssert(typeof fieldLocation === 'string', `cUSFM ourCheckTextField: 'fieldLocation' parameter should be a string not a '${typeof fieldLocation}'`);

        const dbtcResultObject = checkTextField(languageCode, repoCode, fieldType, fieldName, fieldText, allowedLinks, fieldLocation, checkingOptions);

        // Process noticeList line by line to filter out potential false positives
        //  for this particular kind of text field
        for (const noticeEntry of dbtcResultObject.noticeList) {
            // debugLog("Notice keys", JSON.stringify(Object.keys(noticeEntry)));
            logicAssert(Object.keys(noticeEntry).length >= 4, `USFM ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial({ ...noticeEntry, lineNumber, C, V });
            // }
        }
    }
    // end of ourCheckTextField function


    function ourBasicFileChecks(filename, fileText, fileLocation, checkingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        //parameterAssert(filename !== undefined, "cUSFM ourBasicFileChecks: 'filename' parameter should be defined");
        //parameterAssert(typeof filename === 'string', `cUSFM ourBasicFileChecks: 'filename' parameter should be a string not a '${typeof filename}'`);
        //parameterAssert(fileText !== undefined, "cUSFM ourBasicFileChecks: 'fileText' parameter should be defined");
        //parameterAssert(typeof fileText === 'string', `cUSFM ourBasicFileChecks: 'fileText' parameter should be a string not a '${typeof fileText}'`);
        //parameterAssert(checkingOptions !== undefined, "cUSFM ourBasicFileChecks: 'checkingOptions' parameter should be defined");

        const resultObject = checkTextfileContents(languageCode, repoCode, 'USFM', filename, fileText, fileLocation, checkingOptions);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList) {
            logicAssert(Object.keys(noticeEntry).length >= 5, `USFM ourBasicFileChecks notice length=${Object.keys(noticeEntry).length}`);
            addNoticePartial(noticeEntry);
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
                addNoticePartial({ priority: 873, message: `Mismatched ${opener}${closer} fields`, excerpt: `(left=${lCount.toLocaleString()}, right=${rCount.toLocaleString()})`, location: fileLocation });
        }
    }
    // end of checkUSFMCharacterFields function


    /**
     *
     * @param {string} filename
     * @param {string} fileText
     * @param {*} markerSet
     * @param {string} fileLocation
     * @param {Object} checkingOptions
     */
    function checkUSFMFileContents(filename, fileText, markerSet, fileLocation, checkingOptions) {
        // Does global checks on the file
        // Note: These run the risk of duplicating messages that are found within individual lines.
        //          However, it’s common in USFM for parentheses to open '(' in one verse
        //                      and close ')' in another. So the USFM line check can’t check that.
        //          Also, the USFM v3.0 spec seems to allow/require whitespace reduction,
        //              i.e., newLines can conceivably appear WITHIN a footnote for example.
        // functionLog(`checkUSFMFileContents(${filename}, ${fileText.length}, ${markerSet}, ${fileLocation}, ${JSON.stringify(checkingOptions)})…`);

        // Check markers like \add ... \add*, \f .. \f*
        checkUSFMCharacterFields(filename, fileText, fileLocation)

        // Now do the general global checks (e.g., for general punctuation)
        ourBasicFileChecks(filename, fileText, fileLocation, checkingOptions);

        // Handled elsewhere
        // for (const compulsoryMarker of COMPULSORY_MARKERS)
        //     if (!markerSet.has(compulsoryMarker))
        //         addNoticePartial({ priority: 819, message: "Missing compulsory USFM line", excerpt: `missing \\${compulsoryMarker}`, location: fileLocation });
        for (const expectedMarker of EXPECTED_MARKERS)
            if (!markerSet.has(expectedMarker)
                && (!expectedMarker.endsWith('1') || !markerSet.has(expectedMarker.substring(0, expectedMarker.length - 1))))
                // NOTE: \mt(1) is required by Proskomma so increased this priority
                addNoticePartial({ priority: expectedMarker === 'mt1' ? 921 : 519, message: "Missing expected USFM line", excerpt: `missing \\${expectedMarker}`, location: fileLocation });
        if (books.isExtraBookID(bookID))
            for (const expectedMarker of EXPECTED_PERIPHERAL_BOOK_MARKERS)
                if (!markerSet.has(expectedMarker))
                    addNoticePartial({ priority: 517, message: "Missing expected USFM line", excerpt: `missing \\${expectedMarker}`, location: fileLocation });
                else
                    for (const expectedMarker of EXPECTED_BIBLE_BOOK_MARKERS)
                        if (!markerSet.has(expectedMarker))
                            addNoticePartial({ priority: 518, message: "Missing expected USFM line", excerpt: `missing \\${expectedMarker}`, location: fileLocation });
        for (const deprecatedMarker of DEPRECATED_MARKERS)
            if (markerSet.has(deprecatedMarker))
                addNoticePartial({ priority: 218, message: "Using deprecated USFM marker", excerpt: `\\${deprecatedMarker}`, location: fileLocation });
    }
    // end of checkUSFMFileContents function


    /**
     *
     * @param {number} lineNumber
     * @param {string} C
     * @param {string} V
     * @param {string} marker
     * @param {string} rest
     * @param {string} lineLocation
     * @param {Object} checkingOptions
     */
    function checkUSFMLineText(lineNumber, C, V, marker, rest, lineLocation, checkingOptions) {
        // Removes character formatting within the line contents and checks the remaining text
        // functionLog(`checkUSFMLineText(${lineNumber}, ${C}:${V}, ${marker}='${rest}', ${lineLocation}, ${JSON.stringify(checkingOptions)})…`);
        // functionLog(`checkUSFMLineText(${lineNumber}, ${C}:${V}, ${marker}=${rest.length} chars, ${lineLocation}, ${JSON.stringify(checkingOptions)})…`);

        const details = `line marker='\\${marker}'`

        // Check for invalid character combinations
        if (languageCode === 'hbo') {
            // TODO: How should we check other potential bad combinations
            const match = BAD_HEBREW_VOWEL_DAGESH_REGEX.exec(rest);
            if (match) { // it's null if no matches
                // debugLog(`Got bad dagesh after vowel character order match: ${typeof match} ${match.length} '${JSON.stringify(match)}'`);
                const characterIndex = rest.indexOf(match[0][0]);
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 805, message: "Unexpected Hebrew dagesh after vowel", details: `Found ${match.length} '${match}'`, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }

        }

        // Check that no \w markers touch, i.e., shouldn't have '\w*\w' in file
        let characterIndex;
        if ((characterIndex = rest.indexOf('\\w*\\w')) !== -1) {
            // NOTE: There's one example of this in ULT 1 Kings 6:1 "480th"
            //  \w 480|x-occurrence="1" x-occurrences="1"\w*\w th|x-occurrence="1" x-occurrences="1"\w*
            // Also UST Ezra 6:19 "14th" and Ezra 10:9 "20th"
            const badCount = countOccurrences(rest, '\\w*\\w');
            if (badCount > 1 || rest.indexOf('\\w*\\w th|') === -1) { // there's multiple cases or it's not an ordinal
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 444, message: "Shouldn’t have consecutive word fields without a space", details: badCount > 1 ? details + `${badCount} occurrences found in line` : details, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
        }

        // Check that no \f or \x markers follow a space
        if ((characterIndex = rest.indexOf(' \\f ')) !== -1) {
            const badCount = countOccurrences(rest, ' \\f ');
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
            addNoticePartial({ priority: 443, message: "Shouldn’t have a footnote after a space", details: badCount > 1 ? details + `${badCount} occurrences found in line` : details, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
        }
        if ((characterIndex = rest.indexOf(' \\x ')) !== -1) {
            const badCount = countOccurrences(rest, ' \\x ');
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
            addNoticePartial({ priority: 442, message: "Shouldn’t have a cross-reference after a space", details: badCount > 1 ? details + `${badCount} occurrences found in line` : details, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
        }

        // Remove any self-closed milestones and internal \v markers
        // NOTE: replaceAll() is not generally available in browsers yet, so need to use RegExps
        let adjustedRest = rest.replace(/\\zaln-e\\\*/g, '').replace(/\\ts\\\*/g, '').replace(/\\k-e\\\*/g, '')
            .replace(/\\v /g, '')
            .replace(/\\k-s[^\\]+\\\*/g, ''); // This last one is a genuine RegExp because it includes the field contents

        // Remove any simple character markers
        // NOTE: replaceAll() is not generally available in browsers yet, so need to use RegExps
        for (const charMarker of SIMPLE_INTERNAL_MARKERS) {
            // oldTODO: Move the regEx creation so it’s only done once -- not for every line!!!
            // const startRegex = new RegExp(`\\${charMarker} `, 'g');
            // // eslint-disable-next-line no-useless-escape
            // const endRegex = new RegExp(`\\${charMarker}\*`, 'g');
            // adjustedRest = adjustedRest.replace(startRegex, '').replace(endRegex, '');
            adjustedRest = ourDeleteAll(adjustedRest, `\\${charMarker} `);
            adjustedRest = ourDeleteAll(adjustedRest, `\\${charMarker}*`);
        }
        // if (adjustedRest !== rest) {userLog(`Still Got \n'${adjustedRest}' from \n'${rest}'`); return;}


        let ixEnd;
        if (marker === 'w') { // Handle first \w field (i.e., if marker==w) -- there may be more \w fields in rest
            const ixWordEnd = adjustedRest.indexOf('|');
            if (ixWordEnd < 0 && adjustedRest.indexOf('lemma="') >= 0) {
                const characterIndex = 5; // Presumably, a little bit into the word
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 912, message: 'Missing | character in \\w line', lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
            dataAssert(ixWordEnd >= 1, `Why1 is w| = ${ixWordEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
            ixEnd = adjustedRest.indexOf('\\w*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.substring(0, ixWordEnd) + adjustedRest.substring(ixEnd + 3, adjustedRest.length);
            else dataAssert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'zaln-s') { // Remove first \zaln-s milestone (if marker == zaln-s)
            ixEnd = adjustedRest.indexOf('\\*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.substring(ixEnd + 2, adjustedRest.length);
            else dataAssert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'k-s') { // Remove first \k-s milestone (if marker == k-s)
            ixEnd = adjustedRest.indexOf('\\*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.substring(ixEnd + 2, adjustedRest.length);
            else dataAssert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'f') { // Handle first footnote (if marker == f)
            ixEnd = adjustedRest.indexOf('\\f*');
            const startIndex = adjustedRest.startsWith('+ ') ? 2 : 0;
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.substring(startIndex, ixEnd) + adjustedRest.substring(ixEnd + 3, adjustedRest.length);
            else {
                // dataAssert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
                addNoticePartial({ priority: 312, message: 'Possible unclosed footnote', details, lineNumber, C, V, location: lineLocation });
            }
            // debugLog(`After removing f field: '${adjustedRest}' from '${rest}'`);
        }
        else if (marker === 'va')
            adjustedRest = adjustedRest.replace('\\va*', '');
        else if (marker === 'ca')
            adjustedRest = adjustedRest.replace('\\ca*', '');

        // Remove any other \zaln-s fields in the line
        // if (adjustedRest.indexOf('\\z') >= 0) userLog(`checkUSFMLineText here first at ${lineNumber} ${C}:${V} with ${marker}='${adjustedRest}'`);
        let nextZIndex;
        while ((nextZIndex = adjustedRest.indexOf('\\zaln-s ')) >= 0) {
            // functionLog(`checkUSFMLineText here with ${marker}='${adjustedRest}'`);
            const ixZEnd = adjustedRest.indexOf('\\*');
            // debugLog(`  ${nextZIndex} and ${ixZEnd}`);
            if (ixZEnd >= 0) {
                // dataAssert(ixZEnd > nextZIndex, `Expected closure at ${ixZEnd} to be AFTER \\zaln-s (${nextZIndex})`);
                adjustedRest = adjustedRest.substring(0, nextZIndex) + adjustedRest.substring(ixZEnd + 2, adjustedRest.length);
                // debugLog(`  Now '${adjustedRest}'`);
            } else {
                userLog(`\\zaln-s seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }
        // Remove any other \w fields in the line
        let nextWIndex;
        while ((nextWIndex = adjustedRest.indexOf('\\w ')) >= 0) {
            const ixWordEnd = adjustedRest.indexOf('|');
            if (ixWordEnd < 0 && adjustedRest.indexOf('lemma="') >= 0) {
                const characterIndex = nextWIndex + 5; // Presumably, a little bit into the word
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 911, message: 'Missing | character in \\w field', details, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
                adjustedRest = ''; // Avoid follow-on errors
                break;
            }
            dataAssert(ixWordEnd > nextWIndex + 3, `Why2 is w| = ${ixWordEnd}? nextWIndex=${nextWIndex} ${languageCode} ${bookID} ${C}:${V} ${lineNumber}`);
            const ixWEnd = adjustedRest.indexOf('\\w*');
            if (ixWEnd >= 0) {
                dataAssert(ixWEnd > nextWIndex, `Expected closure at ${ixWEnd} to be AFTER \\w (${nextWIndex})`);
                adjustedRest = adjustedRest.substring(0, nextWIndex) + adjustedRest.substring(nextWIndex + 3, ixWordEnd) + adjustedRest.substring(ixWEnd + 3, adjustedRest.length);
                // debugLog(`After removing w field, got '${adjustedRest}'`);
            } else {
                userLog(`\\w seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }
        // Remove any other \+w fields in the line
        while ((nextWIndex = adjustedRest.indexOf('\\+w ')) >= 0) {
            const ixWordEnd = adjustedRest.indexOf('|');
            if (ixWordEnd < 0 && adjustedRest.indexOf('lemma="') >= 0) {
                const characterIndex = nextWIndex + 6; // Presumably, a little bit into the word
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 911, message: 'Missing | character in \\+w field', details, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
                adjustedRest = ''; // Avoid follow-on errors
                break;
            }
            dataAssert(ixWordEnd > nextWIndex + 4, `Why2 is +w| = ${ixWordEnd}? nextWIndex=${nextWIndex} ${languageCode} ${bookID} ${C}:${V} ${lineNumber}`);
            const ixWEnd = adjustedRest.indexOf('\\+w*');
            if (ixWEnd >= 0) {
                dataAssert(ixWEnd > nextWIndex, `Expected closure at ${ixWEnd} to be AFTER \\+w (${nextWIndex})`);
                adjustedRest = adjustedRest.substring(0, nextWIndex) + adjustedRest.substring(nextWIndex + 4, ixWordEnd) + adjustedRest.substring(ixWEnd + 4, adjustedRest.length);
                // debugLog(`After removing w field, got '${adjustedRest}'`);
            } else {
                userLog(`\\+w seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }
        // Remove any other \f fields in the line
        let nextFIndex;
        while ((nextFIndex = adjustedRest.indexOf('\\f + ')) >= 0) {
            const ixFEnd = adjustedRest.indexOf('\\f*');
            if (ixFEnd >= 0) {
                dataAssert(ixFEnd > nextWIndex, `Expected closure at ${ixFEnd} to be AFTER \\w (${nextFIndex})`);
                adjustedRest = adjustedRest.substring(0, nextFIndex) + adjustedRest.substring(nextFIndex + 5, ixFEnd) + adjustedRest.substring(ixFEnd + 3, adjustedRest.length);
                // functionLog(`checkUSFMLineText(${lineNumber}, ${C}:${V}, ${marker}='${rest}', ${lineLocation}, ${JSON.stringify(checkingOptions)})…`);
                // debugLog(`After removing footnote: '${adjustedRest}'`);
            } else {
                userLog(`\\f seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }

        if (adjustedRest) {
            let characterIndex;
            if ((characterIndex = adjustedRest.indexOf('"')) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 776, message: 'Unexpected " straight quote character', details, lineNumber, C, V, excerpt, location: lineLocation });
                // debugLog(`ERROR 776: in ${marker} '${adjustedRest}' from '${rest}'`);
            }
            if ((characterIndex = adjustedRest.indexOf("'")) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 775, message: "Unexpected ' straight quote character", details, lineNumber, C, V, excerpt, location: lineLocation });
                // debugLog(`ERROR 775: in ${marker} '${adjustedRest}' from '${rest}'`);
            }
            if (adjustedRest.indexOf('\\') >= 0 || adjustedRest.indexOf('|') >= 0) {
                // functionLog(`checkUSFMLineText ${languageCode} ${filename} ${lineNumber} ${C}:${V} somehow ended up with ${marker}='${adjustedRest}'`);
                characterIndex = adjustedRest.indexOf('\\');
                if (characterIndex === -1) characterIndex = adjustedRest.indexOf('|');
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 875, message: "Unexpected USFM field", details, lineNumber, C, V, excerpt, location: lineLocation });
            }
            if (adjustedRest !== rest) // Only re-check if line has changed (because original is checked in checkUSFMLineInternals())
                // Note: false (below) is for allowedLinks flag
                ourCheckTextField(lineNumber, C, V, 'raw', `from \\${marker}`, adjustedRest, false, lineLocation, checkingOptions);
        }
    }
    // end of checkUSFMLineText function


    /**
     *
     * @param {number} lineNumber
     * @param {string} C
     * @param {string} V
     * @param {string} marker
     * @param {string} rest
     * @param {string} lineLocation
     * @param {Object} checkingOptions
     */
    async function checkUSFMLineAttributes(lineNumber, C, V, marker, rest, lineLocation, checkingOptions) {
        // Looks for USFM fields with attributes, e.g., \w, \zaln-s, \k-s
        // functionLog(`checkUSFMLineAttributes(${lineNumber}, ${C}:${V}, ${marker}='${rest}', ${lineLocation}, ${JSON.stringify(checkingOptions)})…`);
        // functionLog(`checkUSFMLineAttributes(${lineNumber}, ${C}:${V}, ${marker}=${rest.length} chars, ${lineLocation}, ${JSON.stringify(checkingOptions)})…`);

        const details = `line marker='\\${marker}'`

        // Put marker inside string so easy to do RegExp searches
        const adjustedRest = `\\${marker} ${rest}`;
        if (adjustedRest.indexOf('="') !== -1)
            dataAssert(adjustedRest.indexOf('\\w ') !== -1 || adjustedRest.indexOf('\\+w ') !== -1 || adjustedRest.indexOf('\\zaln-s ') !== -1 || adjustedRest.indexOf('\\k-s ') !== -1,
                `Something wrong in USFM line ${lineNumber} ${C}:${V}'${adjustedRest}' \\w=${adjustedRest.indexOf('\\w ')} \\+w=${adjustedRest.indexOf('\\+w ')} \\zaln-s=${adjustedRest.indexOf('\\zaln-s ')} \\k-s=${adjustedRest.indexOf('\\k-s ')}`);
        dataAssert(countOccurrences(adjustedRest, '\\w ') === countOccurrences(adjustedRest, '\\w*'), `checkUSFMLineAttributes expected all \\w fields to be closed in ${adjustedRest}`);
        dataAssert(countOccurrences(adjustedRest, '\\+w ') === countOccurrences(adjustedRest, '\\+w*'), `checkUSFMLineAttributes expected all \\+w fields to be closed in ${adjustedRest}`);
        // dataAssert(countOccurrences(adjustedRest, '\\zaln-s ') === countOccurrences(adjustedRest, '\\zaln-s*'), `checkUSFMLineAttributes expected all \\zaln-s fields to be closed in ${adjustedRest}`);
        // dataAssert(countOccurrences(adjustedRest, '\\k-s ') === countOccurrences(adjustedRest, '\\k-s*'), `checkUSFMLineAttributes expected all \\k-s fields to be closed in ${adjustedRest}`);

        /**
         *
         * @param {string} wContents
         */
        async function checkWAttributes(wContents) {
            // functionLog(`checkWAttributes(${wContents})…`);
            let regexResultArray, attributeCounter = 0;
            while ((regexResultArray = ATTRIBUTE_REGEX.exec(wContents))) {
                attributeCounter += 1;
                // debugLog(`  Got attribute Regex in \\w: ${attributeCounter} '${JSON.stringify(regexResultArray2)}`);
                const attributeName = regexResultArray[1], attributeValue = regexResultArray[2];
                if (repoCode === 'UHB' || repoCode === 'UGNT') {
                    if (attributeCounter === 1) {
                        if (attributeName !== 'lemma')
                            addNoticePartial({ priority: 857, message: "Unexpected first original \\w attribute", details: "expected 'lemma'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    } else if (attributeCounter === 2) {
                        if (attributeName !== 'strong')
                            addNoticePartial({ priority: 856, message: "Unexpected second original \\w attribute", details: "expected 'strong'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    } else if (attributeCounter === 3) {
                        if (attributeName !== 'x-morph')
                            addNoticePartial({ priority: 855, message: "Unexpected third original \\w attribute", details: "expected 'x-morph'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    } else if (attributeCounter === 4) {
                        if (attributeName !== 'x-tw') // we can have TWO of these -- THREE EVEN in EXO 15:23 and 1KI 21:9!!!
                            addNoticePartial({ priority: 854, message: "Unexpected fourth original \\w attribute", details: "expected 'x-tw'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    } else if (attributeCounter === 5) {
                        if (attributeName !== 'x-tw')
                            addNoticePartial({ priority: 854, message: "Unexpected fifth original \\w attribute", details: "expected second 'x-tw'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    } else if (attributeCounter === 6) {
                        if (attributeName !== 'x-tw')
                            addNoticePartial({ priority: 854, message: "Unexpected sixth original \\w attribute", details: "expected third 'x-tw'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    } else // #7 or more
                        addNoticePartial({ priority: 853, message: "Unexpected extra original \\w attribute", details, lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    if (attributeName === 'lemma' && repoCode === 'UHB') {
                        const match = HEBREW_CANTILLATION_REGEX.exec(attributeValue);
                        if (match) { // it's null if no matches
                            // debugLog(`Got cantillation match: ${typeof match} ${match.length} '${JSON.stringify(match)}'`);
                            addNoticePartial({ priority: 905, message: "Unexpected Hebrew cantillation mark in lemma field", details: `Found ${match.length} '${match}'`, lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                        }
                    } else if (attributeName === 'x-morph'
                        && ((repoCode === 'UHB' && !attributeValue.startsWith('He,') && !attributeValue.startsWith('Ar,'))
                            || (repoCode === 'UGNT' && !attributeValue.startsWith('Gr,'))))
                        addNoticePartial({ priority: 852, message: "Unexpected original \\w x-morph language prefix", details: "Expected 'He,' 'Ar,' or 'Gr,'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    else if (attributeName === 'x-tw')
                        await ourCheckNotesLinksToOutside(lineNumber, C, V, marker, attributeValue, lineLocation, checkingOptions);
                } else { // a translation -- not UHB or UGNT
                    if (attributeCounter === 1) {
                        if (attributeName !== 'x-occurrence')
                            addNoticePartial({ priority: 848, message: "Unexpected first translation \\w attribute", details: "expected 'x-occurrence'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    } else if (attributeCounter === 2) {
                        if (attributeName !== 'x-occurrences')
                            addNoticePartial({ priority: 847, message: "Unexpected second translation \\w attribute", details: "expected 'x-occurrences'", lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                    } else // #3 or more
                        addNoticePartial({ priority: 846, message: "Unexpected extra translation \\w attribute", details, lineNumber, C, V, excerpt: regexResultArray[0], location: lineLocation });
                }
            }
            if (repoCode === 'UHB' || repoCode === 'UGNT') {
                if (attributeCounter < 3)
                    addNoticePartial({ priority: 837, message: "Seems too few original \\w attributes", details: `Expected 3-4 attributes but only found ${attributeCounter}`, lineNumber, C, V, excerpt: regexResultArray1[0], location: lineLocation });
            } else if (attributeCounter < 2)
                addNoticePartial({ priority: 836, message: "Seems too few translation \\w attributes", details: `Expected two attributes but only found ${attributeCounter}`, lineNumber, C, V, excerpt: regexResultArray1[0], location: lineLocation });
        }
        // end of checkWAttributes function

        let regexResultArray1;
        while ((regexResultArray1 = W_REGEX.exec(adjustedRest))) {
            // debugLog(`Got ${repoCode} \\w Regex in ${C}:${V} line: '${JSON.stringify(regexResultArray1)}`);
            await checkWAttributes(regexResultArray1[1]);
        }
        let regexResultArray2;
        while ((regexResultArray1 = KS_REGEX.exec(adjustedRest))) {
            // debugLog(`Got ${repoCode} \\k-s Regex in ${C}:${V} line: '${JSON.stringify(regexResultArray1)}`);
            dataAssert(repoCode === 'UHB' || repoCode === 'UGNT', `checkUSFMLineAttributes expected an original language repo not '${repoCode}'`);
            let attributeCounter = 0;
            while ((regexResultArray2 = ATTRIBUTE_REGEX.exec(regexResultArray1[1]))) {
                attributeCounter += 1;
                // debugLog(`  Got attribute Regex in \\k-s: ${attributeCounter} '${JSON.stringify(regexResultArray2)}`);
                const attributeName = regexResultArray2[1]; //, attributeValue = regexResultArray2[2];
                if (attributeCounter === 1) {
                    if (attributeName !== 'x-tw')
                        addNoticePartial({ priority: 839, message: "Unexpected first \\k-s attribute", details: "expected 'x-tw'", lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
                } else // #2 or more
                    addNoticePartial({ priority: 838, message: "Unexpected extra \\k-s attribute", details, lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
            }
            if (attributeCounter < 1)
                addNoticePartial({ priority: 835, message: "Seems too few original \\k-s attributes", details: `Expected one attribute but only found ${attributeCounter}`, lineNumber, C, V, excerpt: regexResultArray1[0], location: lineLocation });
        }
        while ((regexResultArray1 = ZALNS_REGEX.exec(adjustedRest))) {
            // debugLog(`Got ${repoCode} \\zaln-s Regex in ${C}:${V} line: '${JSON.stringify(regexResultArray1)}`);
            dataAssert(repoCode !== 'UHB' && repoCode !== 'UGNT', `checkUSFMLineAttributes eExpected not an original language repo not '${repoCode}'`);
            let attributeCounter = 0;
            while ((regexResultArray2 = ATTRIBUTE_REGEX.exec(regexResultArray1[1]))) {
                attributeCounter += 1;
                // debugLog(`  Got attribute Regex in \\zaln-s: ${attributeCounter} '${JSON.stringify(regexResultArray2)}`);
                const attributeName = regexResultArray2[1]; //, attributeValue = regexResultArray2[2];
                if (attributeCounter === 1) {
                    if (attributeName !== 'x-strong')
                        addNoticePartial({ priority: 830, message: "Unexpected first \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
                } else if (attributeCounter === 2) {
                    if (attributeName !== 'x-lemma')
                        addNoticePartial({ priority: 829, message: "Unexpected second \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
                } else if (attributeCounter === 3) {
                    if (attributeName !== 'x-morph')
                        addNoticePartial({ priority: 828, message: "Unexpected third \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
                } else if (attributeCounter === 4) {
                    if (attributeName !== 'x-occurrence')
                        addNoticePartial({ priority: 827, message: "Unexpected fourth \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
                } else if (attributeCounter === 5) {
                    if (attributeName !== 'x-occurrences')
                        addNoticePartial({ priority: 826, message: "Unexpected fifth \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
                } else if (attributeCounter === 6) {
                    if (attributeName !== 'x-content')
                        addNoticePartial({ priority: 825, message: "Unexpected sixth \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
                } else // #7 or more
                    addNoticePartial({ priority: 833, message: "Unexpected extra \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexResultArray2[0], location: lineLocation });
            }
            if (attributeCounter < 6)
                addNoticePartial({ priority: 834, message: "Seems too few translation \\zaln-s attributes", details: `Expected six attributes but only found ${attributeCounter}`, lineNumber, C, V, excerpt: regexResultArray1[0], location: lineLocation });
        }
    }
    // end of checkUSFMLineAttributes function


    /**
     *
     * @param {number} lineNumber
     * @param {string} C
     * @param {string} V
     * @param {string} marker
     * @param {string} rest
     * @param {string} lineLocation
     * @param {Object} checkingOptions
     */
    async function checkUSFMLineContents(lineNumber, C, V, marker, rest, lineLocation, checkingOptions) {
        // Looks at the marker and determines what content is allowed/expected on the rest of the line
        // 'SPECIAL' is used internally here when a character other than a backslash starts a line

        async function checkUSFMLineInternals(lineNumber, C, V, marker, rest, lineLocation, checkingOptions) {
            // Handles character formatting within the line contents
            // functionLog(`checkUSFMLineInternals(${lineNumber}, ${C}:${V}, ${marker}='${rest}', ${lineLocation}, ${JSON.stringify(checkingOptions)})…`);

            if (marker === 'c' && isNaN(rest))
                addNoticePartial({ priority: 822, message: "Expected field to contain an integer", lineNumber, characterIndex: 3, excerpt: `\\c ${rest}`, C, V, location: lineLocation });
            if (marker === 'v') {
                let Vstr = (rest) ? rest.split(' ', 1)[0] : '?';
                if (isNaN(Vstr) && Vstr.indexOf('-') < 0)
                    addNoticePartial({ priority: 822, message: "Expected field to contain an integer", characterIndex: 3, excerpt: `\\v ${rest}`, C, V, location: lineLocation });
            }
            else if (marker === 'h' || marker === 'toc1' || marker === 'toc2' || marker === 'toc3')
                if (rest.toLowerCase() === rest || rest.toUpperCase() === rest)
                    addNoticePartial({ priority: languageCode === 'en' || languageCode === 'fr' ? 490 : 190, message: "Expected header field to contain a mixed-case string", fieldName: `\\${marker}`, excerpt: rest, C, V, location: lineLocation });

            if (rest) {
                checkUSFMLineText(lineNumber, C, V, marker, rest, lineLocation, checkingOptions);

                if (rest.indexOf('=') >= 0 || rest.indexOf('"') >= 0)
                    await checkUSFMLineAttributes(lineNumber, C, V, marker, rest, lineLocation, checkingOptions);

                const allowedLinks = (marker === 'w' || marker === 'k-s' || marker === 'f' || marker === 'SPECIAL')
                    // (because we don’t know what marker SPECIAL is, so default to "no false alarms")
                    && rest.indexOf('x-tw') >= 0;
                ourCheckTextField(lineNumber, C, V, 'USFM', `\\${marker}`, rest, allowedLinks, lineLocation, checkingOptions);
            }
        }
        // end of checkUSFMLineInternals function


        // Main code for checkUSFMLineContents()
        if (ALLOWED_LINE_START_MARKERS.indexOf(marker) >= 0 || marker === 'SPECIAL' || marker === 'NONE') {
            if (rest && MARKERS_WITHOUT_CONTENT.indexOf(marker) >= 0)
                if (isWhitespace(rest))
                    addNoticePartial({ priority: 301, message: `Unexpected whitespace after \\${marker} marker`, C, V, lineNumber, characterIndex: marker.length, excerpt: rest, location: lineLocation });
                else if (rest !== 'ס' && rest !== 'פ') // in UHB NEH 3:20 or EZR 3:18
                    addNoticePartial({ priority: 401, message: `Unexpected content after \\${marker} marker`, C, V, lineNumber, characterIndex: marker.length, excerpt: rest, location: lineLocation });
                else if (MARKERS_WITH_COMPULSORY_CONTENT.indexOf(marker) >= 0 && !rest)
                    addNoticePartial({ priority: 711, message: "Expected compulsory content", C, V, lineNumber, characterIndex: marker.length, location: ` after \\${marker} marker${lineLocation}` });
        } else // it’s not a recognised line marker
            // Lower priority of deprecated \s5 markers (compared to all other unknown markers)
            addNoticePartial({ priority: marker === 's5' ? 111 : 809, message: `${marker === 's5' ? 'Deprecated' : 'Unexpected'} '\\${marker}' marker at start of line`, C, V, lineNumber, characterIndex: 1, location: lineLocation });
        if (rest) await checkUSFMLineInternals(lineNumber, C, V, marker, rest, lineLocation, checkingOptions);
    }
    // end of checkUSFMLineContents function


    async function ourCheckNotesLinksToOutside(lineNumber, C, V, marker, twLinkText, location, checkingOptions) {
        // Checks that the TA/TW/Bible reference can be found

        // Updates the global list of notices

        // functionLog(`checkUSFMText ourCheckNotesLinksToOutside(${lineNumber}, ${C}:${V}, ${marker}, (${twLinkText.length}) '${twLinkText}', ${location}, ${JSON.stringify(checkingOptions)})`);
        //parameterAssert(marker !== undefined, "checkUSFMText ourCheckNotesLinksToOutside: 'marker' parameter should be defined");
        //parameterAssert(typeof marker === 'string', `checkUSFMText ourCheckNotesLinksToOutside: 'marker' parameter should be a string not a '${typeof marker}': ${marker}`);
        //parameterAssert(twLinkText !== undefined, "checkUSFMText ourCheckNotesLinksToOutside: 'twLinkText' parameter should be defined");
        //parameterAssert(typeof twLinkText === 'string', `checkUSFMText ourCheckNotesLinksToOutside: 'twLinkText' parameter should be a string not a '${typeof twLinkText}': ${twLinkText}`);

        let adjustedLanguageCode = languageCode; // This is the language code of the resource with the link
        if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won't be needed for TWs when we switch to TWLs)
        const coTNlResultObject = await checkNotesLinksToOutside(languageCode, repoCode, bookID, C, V, 'TWLink', twLinkText, location, { ...checkingOptions, defaultLanguageCode: adjustedLanguageCode });
        // debugLog(`coTNlResultObject=${JSON.stringify(coTNlResultObject)}`);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const coqNoticeEntry of coTNlResultObject.noticeList) {
            if (coqNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN2 check
                result.noticeList.push(coqNoticeEntry); // Just copy the complete notice as is
            else // For our direct checks, we add the repoCode as an extra value
                addNoticePartial({ ...coqNoticeEntry, lineNumber, C, V, fieldName: marker });
        }
        // The following is needed coz we might be checking the linked TA and/or TW articles
        if (coTNlResultObject.checkedFileCount && coTNlResultObject.checkedFileCount > 0)
            if (typeof result.checkedFileCount === 'number') result.checkedFileCount += coTNlResultObject.checkedFileCount;
            else result.checkedFileCount = coTNlResultObject.checkedFileCount;
        if (coTNlResultObject.checkedFilesizes && coTNlResultObject.checkedFilesizes > 0)
            if (typeof result.checkedFilesizes === 'number') result.checkedFilesizes += coTNlResultObject.checkedFilesizes;
            else result.checkedFilesizes = coTNlResultObject.checkedFilesizes;
        if (coTNlResultObject.checkedRepoNames && coTNlResultObject.checkedRepoNames.length > 0)
            for (const checkedRepoName of coTNlResultObject.checkedRepoNames)
                try { if (result.checkedRepoNames.indexOf(checkedRepoName) < 0) result.checkedRepoNames.push(checkedRepoName); }
                catch { result.checkedRepoNames = [checkedRepoName]; }
        if (coTNlResultObject.checkedFilenameExtensions && coTNlResultObject.checkedFilenameExtensions.length > 0)
            for (const checkedFilenameExtension of coTNlResultObject.checkedFilenameExtensions)
                try { if (result.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) result.checkedFilenameExtensions.push(checkedFilenameExtension); }
                catch { result.checkedFilenameExtensions = [checkedFilenameExtension]; }
        // if (result.checkedFilenameExtensions) userLog("result", JSON.stringify(result));
    }
    // end of ourCheckNotesLinksToOutside function


    /**
     *
     * @param {string} bookID
     * @param {string} filename
     * @param {string} givenText -- text of the USFM file
     * @param {string} location -- optional
     */
    async function mainUSFMCheck(bookID, filename, givenText, location) {
        // functionLog(`checkUSFMText mainUSFMCheck(${bookID}, ${filename}, ${givenText.length}, ${location}) (can take quite a while for a large book)…`);

        let ourLocation = location;
        if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

        // const lowercaseBookID = bookID.toLowerCase();
        // eslint-disable-next-line no-unused-vars
        let numChaptersThisBook = 0;
        try {
            logicAssert(lowercaseBookID !== 'obs', "Shouldn’t happen in usfm-text-check2");
            numChaptersThisBook = books.chaptersInBook(bookID);
        }
        catch {
            if (!books.isValidBookID(bookID)) // must not be in FRT, BAK, etc.
                addNoticePartial({ priority: 903, message: "Bad function call: should be given a valid book abbreviation", excerpt: bookID, location: ourLocation });
        }

        function findStartMarker(C, V, lineNumber, USFMline) {
            // Returns the USFM marker at the start of the line
            //  (without the leading backslash but including full self-closing milestones)
            logicAssert(USFMline && USFMline[0] === '\\', `Programming error in findStartMarker(${C}:${V}, ${lineNumber}, ${USFMline})`);
            let foundMarker = '';
            for (let characterIndex = 1; characterIndex < USFMline.length; characterIndex++) {
                const char = USFMline[characterIndex];
                if (char === ' ') break;
                // Cope with self-closing milestones like \k-s\*
                if (char === '\\' && (characterIndex === USFMline.length - 1 || USFMline[characterIndex + 1] !== '*')) {
                    const excerpt = USFMline.substring(0, excerptLength) + (USFMline.length > excerptLength ? '…' : '');
                    addNoticePartial({ priority: 603, message: "USFM marker doesn’t end with space", C, V, lineNumber, characterIndex, excerpt, location: ourLocation });
                    break;
                }
                foundMarker += char;
                if (char === '*') break;
            }
            return foundMarker;
        }

        let lines = givenText.split('\n');
        // debugLog(`  '${ourLocation}' has ${lines.length.toLocaleString()} total lines`);

        if (lines.length === 0 || !lines[0].startsWith('\\id ') || lines[0].length < 7 || !books.isValidBookID(lines[0].slice(4, 7)))
            addNoticePartial({ priority: 994, message: "USFM file must start with a valid \\id line", lineNumber: 1, location: ourLocation });
        const haveUSFM3Line = lines.length > 1 && lines[1] === '\\usfm 3.0';
        const ideIndex = haveUSFM3Line ? 2 : 1;
        if (lines.length < ideIndex || !lines[ideIndex].startsWith('\\ide ') || lines[ideIndex].length < 7)
            addNoticePartial({ priority: 719, message: "USFM file is recommended to have \\ide line", lineNumber: ideIndex + 1, location: ourLocation });
        else if (!lines[ideIndex].endsWith(' UTF-8'))
            addNoticePartial({ priority: 619, message: "USFM \\ide field is recommended to be set to 'UTF-8'", lineNumber: ideIndex + 1, characterIndex: 5, excerpt: lines[ideIndex], location: ourLocation });


        // let lastB = '';
        let lastC = '', lastV = '', C = '0', V = '0';
        let lastIntC = 0, lastIntV = 0;
        // let numVersesThisChapter = 0;
        let lastMarker = '', lastRest = '';
        const markerSet = new Set();
        for (let n = 1; n <= lines.length; n++) {
            let line = lines[n - 1];
            if (C === '0') V = n.toString();
            // debugLog(`line '${line}'${atString}`);
            if (!line) {
                // addNoticePartial({priority:103, "Unexpected blank line", 0, '', location:ourLocation});
                continue;
            }
            let characterIndex;
            if ((characterIndex = line.indexOf('\r')) >= 0) {
                const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
                const excerpt = (iy > excerptHalfLength ? '…' : '') + line.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < line.length ? '…' : '')
                addNoticePartial({ priority: 703, C, V, message: "Unexpected CarriageReturn character", lineNumber: n, characterIndex, excerpt, location: ourLocation });
            }

            let marker, rest;
            if (line[0] === '\\') {
                marker = findStartMarker(C, V, n, line);
                rest = line.substring(marker.length + 2); // Skip backslash, marker, and space after marker
                // debugLog(`Line ${n}: marker='\\${marker}' rest='${rest}'`);
            } else { // Line didn’t start with a backslash
                // NOTE: Some unfoldingWord USFM Bibles commonly have this
                //          so it’s not necessarily either an error or a warning
                rest = line;
                if (validLineStartCharacters.indexOf(line[0]) === -1) { // These are the often expected characters
                    // Drop the priority if it’s a "half-likely" character
                    addNoticePartial({ priority: line[0] === ' ' || line[0] === '"' ? 180 : 880, C, V, message: "Expected line to start with backslash", lineNumber: n, characterIndex: 0, excerpt: line[0], location: ourLocation });
                    if (line[1] === '\\') { // Let’s drop the leading punctuation and try to check the rest of the line
                        marker = line.substring(2).split(' ', 1)[0];
                        rest = line.substring(marker.length + 2 + 1); // Skip leading character, backslash, marker, and space after marker
                        // debugLog(`USFM after ${line[0]} got '\\${marker}': '${rest}'`);
                    }
                    else
                        marker = 'NONE'; // to try to avoid consequential errors, but the rest of the line won’t be checked
                } else { // How do we handle an allowed line that doesn’t start with a backslash?
                    // Can’t use 'NONE' because we want the rest of the line checked
                    marker = 'SPECIAL'; // Handle as a special case
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
                    addNoticePartial({ priority: 724, C, V, message: "Unable to convert chapter number to integer", lineNumber: n, characterIndex: 3, excerpt: `${rest.substring(0, excerptHalfLength)}${rest.length > excerptHalfLength ? '…' : ''}`, location: ourLocation });
                    intC = -999; // Used to prevent consequential errors
                }
                if (C === lastC || (intC > 0 && intC !== lastIntC + 1))
                    addNoticePartial({ priority: 764, C, V, message: "Chapter number didn’t increment correctly", lineNumber: n, characterIndex: 3, excerpt: `${rest.substring(0, excerptHalfLength)}${rest.length > excerptHalfLength ? '…' : ''} (${lastC ? lastC : '0'} → ${C})`, location: ourLocation });
                lastC = C; lastV = '0';
                lastIntC = intC; lastIntV = 0;
            } else if (marker === 'v') {
                V = (rest) ? rest.split(' ', 1)[0] : '?';
                if (V.indexOf('-') < 0) { // no hyphen -> no verse bridge
                    try {
                        intV = ourParseInt(V);
                    } catch (usfmIVerror) {
                        addNoticePartial({ priority: 723, C, V, message: "Unable to convert verse number to integer", lineNumber: n, characterIndex: 3, excerpt: `${rest.substring(0, excerptHalfLength)}${rest.length > excerptHalfLength ? '…' : ''}`, location: ourLocation });
                        intV = -999; // Used to prevent consequential errors
                    }
                    if (V === lastV || (intV > 0 && intV !== lastIntV + 1))
                        addNoticePartial({ priority: 763, C, V, message: "Verse number didn’t increment correctly", lineNumber: n, characterIndex: 3, excerpt: `${rest.substring(0, excerptHalfLength)}${rest.length > excerptHalfLength ? '…' : ''} (${lastV ? lastV : '0'} → ${V})`, location: ourLocation });
                    lastV = V; lastIntV = intV;
                } else { // handle verse bridge
                    const bits = V.split('-');
                    const firstV = bits[0], secondV = bits[1];
                    let intFirstV, intSecondV;
                    try {
                        intFirstV = ourParseInt(firstV);
                        intSecondV = ourParseInt(secondV);
                    } catch (usfmV12error) {
                        addNoticePartial({ priority: 762, C, V, message: "Unable to convert verse bridge numbers to integers", lineNumber: n, characterIndex: 3, excerpt: `${rest.substring(0, Math.max(9, excerptLength))}${rest.length > excerptLength ? '…' : ''}`, location: ourLocation });
                        intFirstV = -999; intSecondV = -998; // Used to prevent consequential errors
                    }
                    if (intSecondV <= intFirstV)
                        addNoticePartial({ priority: 769, C, V, message: "Verse bridge numbers not in ascending order", lineNumber: n, characterIndex: 3, excerpt: `${rest.substring(0, Math.max(9, excerptLength))}${rest.length > excerptLength ? '…' : ''} (${firstV} → ${secondV})`, location: ourLocation });
                    else if (firstV === lastV || (intFirstV > 0 && intFirstV !== lastIntV + 1))
                        addNoticePartial({ priority: 766, C, V, message: "Bridged verse numbers didn’t increment correctly", lineNumber: n, characterIndex: 3, excerpt: `${rest.substring(0, Math.max(9, excerptLength))}${rest.length > excerptLength ? '…' : ''} (${lastV} → ${firstV})`, location: ourLocation });
                    lastV = secondV; lastIntV = intSecondV;
                }
            } else if ((vIndex = rest.indexOf('\\v ')) >= 0) {
                // verse number marker follows another marker on the same line, so it’s inside `rest`
                const restRest = rest.substring(vIndex + 3);
                // debugLog(`Got restRest=${restRest}`);
                try {
                    intV = parseInt(restRest);
                    // debugLog("Got", intV);
                } catch (usfmIIVerror) {
                    addNoticePartial({ priority: 720, C, V, message: "Unable to convert internal verse number to integer", lineNumber: n, characterIndex: 3, excerpt: `${restRest.substring(0, excerptHalfLength)}${restRest.length > excerptHalfLength ? '…' : ''}`, location: ourLocation });
                    intV = -999; // Used to prevent consequential errors
                }
                if (intV > 0 && intV !== lastIntV + 1)
                    addNoticePartial({ priority: 761, C, V, message: "Verse number didn’t increment correctly", lineNumber: n, characterIndex: 3, excerpt: `${restRest.substring(0, excerptHalfLength)}${restRest.length > excerptHalfLength ? '…' : ''} (${lastV ? lastV : '0'} → ${V})`, location: ourLocation });
                lastV = intV.toString(); lastIntV = intV;
            }

            if (marker === 'id' && !rest.startsWith(bookID)) {
                const thisLength = Math.max(4, excerptLength);
                const excerpt = `${rest.substring(0, thisLength)}${rest.length > thisLength ? '…' : ''}`;
                addNoticePartial({ priority: 987, C, V, message: "Expected \\id line to start with book identifier", lineNumber: n, characterIndex: 4, excerpt, location: ourLocation });
            }

            // Check the order of markers
            // In headers
            if (marker === 'toc2' && lastMarker !== 'toc1')
                addNoticePartial({ priority: 87, C, V, message: "Expected \\toc2 line to follow \\toc1", lineNumber: n, characterIndex: 1, details: `not '\\${lastMarker}'`, location: ourLocation });
            else if (marker === 'toc3' && lastMarker !== 'toc2')
                addNoticePartial({ priority: 87, C, V, message: "Expected \\toc3 line to follow \\toc2", lineNumber: n, characterIndex: 1, details: `not '\\${lastMarker}'`, location: ourLocation });
            // In chapters
            else if ((PARAGRAPH_MARKERS.indexOf(marker) >= 0 || marker === 's5' || marker === 'ts\\*')
                && PARAGRAPH_MARKERS.indexOf(lastMarker) >= 0
                && !lastRest)
                addNoticePartial({ priority: 399, C, V, message: "Useless paragraph marker", lineNumber: n, characterIndex: 1, details: `'\\${lastMarker}' before '\\${marker}'`, location: ourLocation });
            else if (['c', 'ca', 'cl'].indexOf(lastMarker) > 0 && marker === 'v'
                && (rest === '1' || rest.startsWith('1 ')))
                addNoticePartial({ priority: C === '1' ? 657 : 457, C, V, message: "Paragraph marker expected before first verse", lineNumber: n, characterIndex: 1, details: `'\\${marker}' after '\\${lastMarker}'`, location: ourLocation });

            // Do general checks
            await checkUSFMLineContents(n, C, V, marker, rest, ourLocation, checkingOptions);

            lastMarker = marker; lastRest = rest;
        }

        // Do overall global checks of the entire text
        checkUSFMFileContents(filename, givenText, markerSet, ourLocation, checkingOptions) // Do this last so the results are lower in the lists

        addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'} for ${bookID}${ourLocation}`)
    }
    // end of mainUSFMCheck function


    /* function runSlowTask(which) {
        // Ideally these should be run in parallel using multiprocessing
        //  See https://hackernoon.com/multithreading-multiprocessing-and-the-nodejs-event-loop-5b2929bd450b
        userLog(`runSlowTask(${which})`)
        return (which === 1)
            ? mainUSFMCheck(bookID, filename, givenText, location)
            : runBCSGrammarCheck(filename, givenText, location);
    } */


    // Main code for checkUSFMText()
    // debugLog("Starting USFM checking tasks…");

    // const tasks = [1,2].map(runSlowTask);
    // const allResults = await Promise.all(tasks);
    // userLog(`  Finished all tasks with ${JSON.stringify(allResults)}.`);
    // userLog("  Finished all tasks.");
    // if (!allResults[1].isValidUSFM)
    //     addNoticePartial({priority: 942, "USFM Grammar check fails", location});
    // userLog("  Warnings:", JSON.stringify(allResults[1].warnings));
    // // Display these warnings but with a lower priority
    // for (const warningString of allResults[1].warnings)
    //     addNoticePartial({priority:103, `USFMGrammar: ${warningString.trim()}`, location});

    // NOTE: If we're careful about how/when we add their notices to our global list,
    //  we should be able to run these three slowish checks in parallel on different threads/processes
    let allResults = [];
    allResults.push(await mainUSFMCheck(bookID, filename, givenText, ourLocation));
    allResults.push(CVCheck(bookID, givenText, ourLocation));
    if (!books.isExtraBookID(bookID)) {
        const numChapters = books.chaptersInBook(bookID);
        const kB = Math.trunc(givenText.length / 1024);
        if (numChapters < 20 || kB < 2048) { // 2MB -- large files can run the grammar checker out of memory
            userLog(`Running the BCS USFMGrammar checker for ${repoCode} ${bookID} (${kB.toLocaleString()} KB) -- may take several ${kB > 1200 ? 'minutes' : 'seconds'}…`);
            allResults.push(ourRunBCSGrammarCheck(filename, givenText, ourLocation));
        } else {
            userLog(`Skipped running BCS USFMGrammar checker for ${repoCode} ${bookID} (${kB.toLocaleString()} KB with ${numChapters} chapters)`);
            // Success message seems not to be displayed in the demos
            addSuccessMessage(`Skipped running BCS USFMGrammar checker for ${repoCode} ${bookID} (${kB.toLocaleString()} KB with ${numChapters} chapters)`);
            addNoticePartial({ priority: 25, message: "Note: skipped running BCS USFMGrammar checker for large book", details: `${numChapters} chapters (${kB.toLocaleString()} KB)`, location: ourLocation });
        }
    }
    // logicAssert(allResults.length === 2);
    // debugLog("allResults", JSON.stringify(allResults));
    // if (!allResults[1].isValidUSFM)
    //     addNoticePartial({priority: 941, "USFM Grammar check fails", location});
    // debugLog("  Warnings:", JSON.stringify(allResults[1].warnings));
    // // Display these warnings but with a lower priority
    // for (const warningString of allResults[1].warnings)
    // addNoticePartial({priority:103, `USFMGrammar: ${warningString.trim()}`, location});

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // functionLog(`checkUSFMText: calling removeDisabledNotices(${result.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        result.noticeList = removeDisabledNotices(result.noticeList);
    }

    // debugLog(`  checkUSFMText returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // functionLog(`checkUSFMText result is ${JSON.stringify(result)}`);
    return result;
}
// end of checkUSFMText function
