// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { isWhitespace, countOccurrencesInString, ourDeleteAll, HEBREW_CANTILLATION_REGEX, HEBREW_ALL_CONSONANTS } from './text-handling-functions'
import * as books from './books/books';
import { cachedGetFile, cacheSegment, fetchSegmentIfCached } from './getApi';
import { checkTextField } from './field-text-check';
import { checkTextfileContents } from './file-text-check';
import { checkStrongsField } from './strongs-field-check'; // and this may call checkLexiconFileContents()
import { runUsfmJsCheck } from './usfm-js-check';
import { runBCSGrammarCheck } from './BCS-usfm-grammar-check';
import { checkNotesLinksToOutside } from './notes-links-check';
import { extractTextFromComplexUSFM } from './usfm-helpers';
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, parameterAssert, logicAssert, dataAssert, ourParseInt, aboutToOverwrite } from './utilities';
import { removeDisabledNotices } from './disabled-notices';


// const USFM_VALIDATOR_VERSION_STRING = '1.2.5';


const VALID_LINE_START_CHARACTERS = `([“‘—`; // Last one is em-dash — '{' gets added later for LTs and STs

// See http://ubsicap.github.io/usfm/master/index.html
// const COMPULSORY_MARKERS = ['id', 'ide']; // These are specifically checked for by the code near the start of mainUSFMCheck()
const EXPECTED_MARKERS_LIST = ['usfm', 'mt1']; // The check also allows for removal of the final '1'
const EXPECTED_BIBLE_BOOK_MARKERS_LIST = ['h', 'toc1', 'toc2', 'toc3'];
const EXPECTED_PERIPHERAL_BOOK_MARKER_LIST = ['periph'];

const INTRO_LINE_START_MARKER_LIST = ['id', 'usfm', 'ide', 'h',
    'toc1', 'toc2', 'toc3',
    'mt', 'mt1', 'mt2',
    'mte', 'mte1', 'mte2',
    'imt', 'imt1', 'imt2',
    'is', 'is1', 'is2',
    'ip', 'ipi', 'im', 'imi', 'ipq', 'imq', 'ipr',
    'iq', 'iq1', 'iq2',
    'ili', 'ili1', 'ili2',
    'iot', 'io', 'io1', 'io2',
    'iex',
    'imte', 'imte1', 'imte2'];
const CV_MARKERS_LIST = ['c', 'v', 'ca', 'va'];
const HEADING_TYPE_MARKERS_LIST = [ // expected to contain text on the same line
    's', 's1', 's2', 's3', 's4', 'sr',
    'ms', 'ms1', 'mr',
    'r', 'd', 'rem', 'sp', 'cl',
    'sd', 'sd1', 'sd2',
    'pr', 'qa', 'qc', 'qd', 'qr',
    'cls', 'pmo', 'pmc', 'pmr', 'pc',
    'periph'];
const PARAGRAPH_MARKERS_LIST = ['p',
    'q', 'q1', 'q2', 'q3', 'q4',
    'qm', 'qm1', 'qm2', 'qm3', 'qm4',
    'm', 'mi',
    'nb', // well, it has text sort of like a paragraph marker
    'pi', 'pi1', 'pi2', 'pi3', 'pi4',
    'li', 'li1', 'li2', 'li3', 'li4',
    'lim', 'lim1', 'lim2', 'lim3', 'lim4',
    'lh', 'lf',
    'po', 'pm',
    'ph', 'ph1', 'ph2', 'ph3', 'ph4',
    'tr'];
const MAIN_NOTE_MARKERS_LIST = ['f', 'x'];
const SPECIAL_MARKERS_LIST = ['w', 'zaln-s', 'k-s', // NOTE that we have \w in TWO places
    'qt-s', 'qt1-s', 'qt2-s',
    'lit'];
const MILESTONE_MARKERS_LIST = ['ts\\*', 'ts-s', 'ts-e', 'k-e\\*']; // Is this a good way to handle it???
const TEXT_MARKERS_WITHOUT_CONTENT_LIST = ['b', 'ib', 'ie'];
const MARKERS_WITHOUT_CONTENT_LIST = [].concat(TEXT_MARKERS_WITHOUT_CONTENT_LIST).concat(MILESTONE_MARKERS_LIST);
const ALLOWED_LINE_START_MARKERS_LIST = [].concat(INTRO_LINE_START_MARKER_LIST).concat(HEADING_TYPE_MARKERS_LIST)
    .concat(CV_MARKERS_LIST).concat(PARAGRAPH_MARKERS_LIST)
    .concat(MAIN_NOTE_MARKERS_LIST).concat(SPECIAL_MARKERS_LIST).concat(MARKERS_WITHOUT_CONTENT_LIST)
    .concat(MILESTONE_MARKERS_LIST).concat(['qs']);
const OPTIONALLY_NUMBERED_MARKERS_LIST = ['mt', 'mte', 'imt', 'imte', 'is', 'iq', 'io', 'ili', 's', 'ms', 'sd', 'q', 'qm', 'pi', 'li', 'lim', 'ph', 'qt-s'];
const DEPRECATED_MARKERS_LIST = [
    'h1', 'h2', 'h3', 'h4',
    'pr',
    'ph', 'ph1', 'ph2', 'ph3', 'ph4',
    'addpn', 'pro', 'fdc', 'xdc'];
const MARKERS_WITH_COMPULSORY_CONTENT_LIST = [].concat(INTRO_LINE_START_MARKER_LIST).concat(HEADING_TYPE_MARKERS_LIST)
    .concat(CV_MARKERS_LIST).concat(MAIN_NOTE_MARKERS_LIST).concat(SPECIAL_MARKERS_LIST);
const FOOTNOTE_INTERNAL_MARKERS_LIST = ['fr', 'fq', 'fqa', 'fk', 'fl', 'fw', 'fp', 'fv', 'ft', 'fdc', 'fm', 'xt'];
const XREF_INTERNAL_MARKERS_LIST = ['xo', 'xk', 'xq', 'xt', 'xta', 'xop', 'xot', 'xnt', 'xdc', 'rq'];
const SIMPLE_CHARACTER_MARKERS_LIST = ['add', 'bk', 'dc', 'k', 'nd', 'ord', 'pn', 'png', 'addpn',
    'qs', 'qt', 'sig', 'sls', 'tl', 'wj',
    'ior', 'iqt', // TODO: What/Why was 'rq' in here???
    'em', 'bd', 'it', 'bdit', 'no', 'sc', 'sup',
    'ndx', 'rb', 'pro', 'wg', 'wh', 'wa',
    'litl', 'lik',
    'liv', 'liv1', 'liv2', 'liv3', 'liv4'];
const CHARACTER_MARKERS_LIST = ['fig', 'w'].concat(SIMPLE_CHARACTER_MARKERS_LIST); // NOTE that we have \w in TWO places
const SIMPLE_INTERNAL_MARKERS_LIST = [SIMPLE_CHARACTER_MARKERS_LIST].concat().concat(FOOTNOTE_INTERNAL_MARKERS_LIST).concat(XREF_INTERNAL_MARKERS_LIST)
// eslint-disable-next-line no-unused-vars
const CANONICAL_TEXT_MARKERS_LIST = ['d'].concat(PARAGRAPH_MARKERS_LIST).concat(CHARACTER_MARKERS_LIST);
// eslint-disable-next-line no-unused-vars
const ANY_TEXT_MARKERS_LIST = [].concat(INTRO_LINE_START_MARKER_LIST).concat(HEADING_TYPE_MARKERS_LIST)
    .concat(PARAGRAPH_MARKERS_LIST).concat(CHARACTER_MARKERS_LIST)
    .concat(MAIN_NOTE_MARKERS_LIST).concat(SPECIAL_MARKERS_LIST);
const MATCHED_CHARACTER_FORMATTING_LINE_PAIRS_LIST = [ // These ones would normally be on the same line in uW USFM files
    ['add', 'add*'], ['addpn', 'addpn*'],
    ['bd', 'bd*'], ['bdit', 'bdit*'],
    ['bk', 'bk*'],
    ['dc', 'dc*'],
    ['em', 'em*'],
    ['fig', 'fig*'],
    ['ior', 'ior*'],
    ['iqt', 'iqt*'],
    ['it', 'it*'],
    ['k', 'k*'],
    ['litl', 'litl*'],
    ['lik', 'lik*'],
    ['liv', 'liv*'], ['liv1', 'liv1*'], ['liv2', 'liv2*'], ['liv3', 'liv3*'], ['liv4', 'liv4*'],
    ['nd', 'nd*'], ['ndx', 'ndx*'],
    ['no', 'no*'],
    ['ord', 'ord*'],
    ['pn', 'pn*'], ['png', 'png*'],
    ['pro', 'pro*'],
    ['qt', 'qt*'],
    ['rb', 'rb*'],
    ['sc', 'sc*'],
    ['sig', 'sig*'],
    ['sls', 'sls*'],
    ['sup', 'sup*'],
    ['tl', 'tl*'],
    ['w', 'w*'], // Note that we also have \+w and \+w* in our files
    ['wa', 'wa*'], ['wg', 'wg*'], ['wh', 'wh*'],
    ['wj', 'wj*'],

    ['ca', 'ca*'], ['va', 'va*'],

    ['f', 'f*'], ['x', 'x*'],
];
const MATCHED_CHARACTER_FORMATTING_FILE_PAIRS_LIST =  // These ones would not necessarily be on the same line
    MATCHED_CHARACTER_FORMATTING_LINE_PAIRS_LIST;
/*    [
        ['add', 'add*'], ['addpn', 'addpn*'],
        ['bd', 'bd*'], ['bdit', 'bdit*'],
        ['bk', 'bk*'],
        ['dc', 'dc*'],
        ['em', 'em*'],
        ['fig', 'fig*'],
        ['ior', 'ior*'],
        ['iqt', 'iqt*'],
        ['it', 'it*'],
        ['k', 'k*'],
        ['litl', 'litl*'],
        ['lik', 'lik*'],
        ['liv', 'liv*'], ['liv1', 'liv1*'], ['liv2', 'liv2*'], ['liv3', 'liv3*'], ['liv4', 'liv4*'],
        ['nd', 'nd*'], ['ndx', 'ndx*'],
        ['no', 'no*'],
        ['ord', 'ord*'],
        ['pn', 'pn*'], ['png', 'png*'],
        ['pro', 'pro*'],
        ['qt', 'qt*'],
        ['rb', 'rb*'],
        ['sc', 'sc*'],
        ['sig', 'sig*'],
        ['sls', 'sls*'],
        ['sup', 'sup*'],
        ['tl', 'tl*'],
        ['w', 'w*'], // Note that we also have \+w and \+w* in our files
        ['wa', 'wa*'], ['wg', 'wg*'], ['wh', 'wh*'],
        ['wj', 'wj*'],

        ['ca', 'ca*'], ['va', 'va*'],

        ['f', 'f*'], ['x', 'x*'],
    ];*/

const W_REGEX = new RegExp('\\\\\\+?w ([^\\\\]+?)\\\\\\+?w\\*', 'g'); // \w ...\w* or \+w ...\+w*
// Note: lemma field can be blank in UHB
const W_FIELDS_REGEX = new RegExp('\\\\\\+?w ([^|]+?)\\|lemma="([^"]*?)" strong="([^"]+?)" x-morph="([^"]+?)"', 'g'); // in \w or \+w
const ZALN_S_REGEX = new RegExp('\\\\zaln-s (.+?)\\\\\\*', 'g');
const KS_REGEX = new RegExp('\\\\k-s (.+?)\\\\\\*', 'g');
const ATTRIBUTE_REGEX = new RegExp('[ |]([^ |]+?)="([^"]*?)"', 'g');

// NOTE: We only have these checks for USFM, not for other files which OrigLQuotes
//          however, maybe that's ok coz they'll get mismatch errors if encoding doesn't match
// TODO: Are one or two of these checks superfluous ???
// See https://codepoints.net/hebrew for a list of the Unicode chars in this block
// Only shin/sin consonant should come before a sin/shin dot
const BAD_HEBREW_SIN_SHIN_DOT_REGEX = new RegExp('[^\\u05E9][\\u05C1\\u05C2]', 'g');
// Should have a sin/shin dot after the shin/sin consonant
const MISSING_HEBREW_SIN_SHIN_DOT_REGEX = new RegExp('[\\u05E9][^\\u05C1\\u05C2]', 'g');
// Only certain consonants should come before a dagesh dot -- Unicode char is also used for mapiq
const BAD_HEBREW_DAGESH_MAPIQ_REGEX = new RegExp('[^\\u05C1\\u05C2אבגדהוזחטיכךלמנספףצקרת]\\u05BC', 'g'); // includes shin/sin dots and some final consonants
// Hebrew vowels should never come before a dagesh
const BAD_HEBREW_VOWEL_DAGESH_REGEX = new RegExp('[\\u05B4-\\u05BB]\\u05BC', 'g');
// Hebrew cantillation marks should never come before a dagesh
const BAD_HEBREW_CANTILLATION_DAGESH_REGEX = new RegExp('[\\u0591-\\u05AF]\\u05BC', 'g');
// Hebrew cantillation marks should never come before a vowel
const BAD_HEBREW_CANTILLATION_VOWEL_REGEX = new RegExp('[\\u0591-\\u05AF][\\u05B4-\\u05BB]', 'g');
// Hebrew final consonants should only come near the end of the word
const BAD_HEBREW_FINAL_CONSONANT_REGEX = new RegExp('[ךםןףץ][^ |"־\\u0592\\u0599\\u05A9\\u05AE\\u05B0\\u05B8\\u05BC]', 'g'); // Includes maqaf, sheva, dagesh, and just a few vowels and accents

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
export async function checkUSFMText(username, languageCode, repoCode, bookID, filename, givenText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

    bookID is a three-character UPPERCASE USFM book identifier.

    filename parameter can be an empty string if we don’t have one.

     Returns a result object containing a successList and a noticeList
     */
    // functionLog(`checkUSFMText(uN=${username} lC=${languageCode} rC=${repoCode}, bkID=${bookID} fN=${filename}, ${givenText.length.toLocaleString()} chars, '${givenLocation}', ${JSON.stringify(checkingOptions)})…`);
    // const regexMatchObject = HEBREW_CANTILLATION_REGEX.exec('\\f + \\ft Q \\+w הִנֵּ֤ה|lemma="הִנֵּ֤ה" strong="H2009" x-morph="He,Tm"\\+w*\\f*');
    // console.log(`Got test cantillation regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);

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
    if (checkingOptions !== undefined) {
        //parameterAssert(typeof checkingOptions === 'object', `checkUSFMText: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let ourLocation = givenLocation;
    if (ourLocation?.length && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (usfmELerror) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    if (languageCode === 'hbo') { // Hebrew vowels don't take up much horizontal space
        // const previousExcerptLength = excerptLength;
        excerptLength = Math.floor(excerptLength * 1.3);
        // debugLog(`checkUSFMText adjusted ${languageCode} excerptLength from ${previousExcerptLength} to ${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength} cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const lowercaseBookID = bookID.toLowerCase();

    let validLineStartCharacters = VALID_LINE_START_CHARACTERS;
    if (repoCode === 'LT' || repoCode === 'ST') validLineStartCharacters += '{';

    const usfmResultObject = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // functionLog(`checkUSFMText success: ${successString}`);
        usfmResultObject.successList.push(successString);
    }
    function addNoticePartial(incompleteNoticeObject) {
        // debugLog("checkUSFMText addNoticePartial:", JSON.stringify(incompleteNoticeObject));
        // functionLog(`checkUSFMText addNoticePartial: (priority=${incompleteNoticeObject.priority}) ${incompleteNoticeObject.C}:${incompleteNoticeObject.V} ${incompleteNoticeObject.message}${incompleteNoticeObject.characterIndex > 0 ? ` (at character ${incompleteNoticeObject.characterIndex})` : ""}${incompleteNoticeObject.excerpt ? ` ${incompleteNoticeObject.excerpt}` : ""}${incompleteNoticeObject.location}`);
        //parameterAssert(incompleteNoticeObject.priority !== undefined, "cUSFM addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `cUSFM addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}': ${incompleteNoticeObject.priority}`);
        //parameterAssert(incompleteNoticeObject.message !== undefined, "cUSFM addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.message === 'string', `cUSFM addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}': ${incompleteNoticeObject.message}`);
        // parameterAssert(C !== undefined, "cUSFM addNoticePartial: 'C' parameter should be defined");
        if (incompleteNoticeObject.C) {
            //parameterAssert(typeof incompleteNoticeObject.C === 'string', `cUSFM addNoticePartial: 'C' parameter should be a string not a '${typeof incompleteNoticeObject.C}': ${incompleteNoticeObject.C}`);
        }
        // parameterAssert(V !== undefined, "cUSFM addNoticePartial: 'V' parameter should be defined");
        if (incompleteNoticeObject.V) {
            //parameterAssert(typeof incompleteNoticeObject.V === 'string', `cUSFM addNoticePartial: 'V' parameter should be a string not a '${typeof incompleteNoticeObject.V}': ${incompleteNoticeObject.V}`);
        }
        // parameterAssert(characterIndex !== undefined, "cUSFM addNoticePartial: 'characterIndex' parameter should be defined");
        if (incompleteNoticeObject.characterIndex !== undefined) {
            //parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `cUSFM addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}': ${incompleteNoticeObject.characterIndex}`);
        }
        // parameterAssert(excerpt !== undefined, "cUSFM addNoticePartial: 'excerpt' parameter should be defined");
        if (incompleteNoticeObject.excerpt) {
            //parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `cUSFM addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}': ${incompleteNoticeObject.excerpt}`);
        }
        //parameterAssert(incompleteNoticeObject.location !== undefined, "cUSFM addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.location === 'string', `cUSFM addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}': ${incompleteNoticeObject.location}`);

        // Doublecheck -- we don’t want "Mismatched {}" per line, only per file
        // eslint-disable-next-line no-unused-vars
        const noticeObjectString = JSON.stringify(incompleteNoticeObject);
        //parameterAssert(incompleteNoticeObject.message.indexOf("Mismatched {}") === -1 || incompleteNoticeObject.lineNumber === undefined, `checkUSFMText addNoticePartial: got bad notice: ${noticeObjectString}`);
        //parameterAssert(noticeObjectString.indexOf('NONE') === -1 && noticeObjectString.indexOf('SPECIAL') === -1, `checkUSFMText addNoticePartial: 'NONE' & 'SPECIAL' shouldn’t make it thru to end user: ${noticeObjectString}`)
        if (incompleteNoticeObject.debugChain) incompleteNoticeObject.debugChain = `checkUSFMText ${incompleteNoticeObject.debugChain}`;
        aboutToOverwrite('checkUSFMText', ['bookID'], incompleteNoticeObject, { bookID });
        if (incompleteNoticeObject.filename === undefined) incompleteNoticeObject.filename = filename; // Don't want to override "text extracted from..." filenames
        usfmResultObject.noticeList.push({ ...incompleteNoticeObject, bookID });
    }


    function ourRunBCSGrammarCheck(filename, fileText, fileLocation) {
        // Runs the BCS USFM Grammar checker
        //  which can be quite time-consuming on large, complex USFM files
        // functionLog("Running our BCS USFM grammar check (can take quite a while for a large book)…");

        let grammarCheckResult;
        try {
            grammarCheckResult = runBCSGrammarCheck('strict', bookID, fileText, filename, fileLocation, checkingOptions);
            // NOTE: We haven’t figured out how to get ERRORS out of this parser yet
            // debugLog(`  Finished our BCS USFM grammar check with ${grammarCheckResult.isValidUSFM} and ${grammarCheckResult.warnings.length} warnings.`);
            addSuccessMessage(`Checked USFM Grammar (strict mode) ${grammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN’T validate)"}`);
        } catch (e) {
            userLog(`ourRunBCSGrammarCheck got error: ${e}`);
            addNoticePartial({ priority: 400, message: "USFMGrammar failed to run", details: `for ${bookID} got ${e}`, location: fileLocation });
            return;
        }
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

        /* Disable this extra check -- no real advantage gained I think
        if (!grammarCheckResult.isValidUSFM) {
            userLog(`  Now running the BCS USFMGrammar RELAXED checker for ${repoCode} ${bookID}…`);
            const relaxedGrammarCheckResult = runBCSGrammarCheck('relaxed', bookID, fileText, filename, fileLocation);
            addSuccessMessage(`Checked USFM Grammar (relaxed mode) ${relaxedGrammarCheckResult.isValidUSFM ? "without errors" : " (but the USFM DIDN’T validate)"}`);
            if (!relaxedGrammarCheckResult.isValidUSFM)
                addNoticePartial({ priority: 644, message: "USFM3 Grammar Check (relaxed mode) doesn’t pass either", location: fileLocation });
        }
        */
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
                // debugLog(`CVCheck someObject=${JSON.stringify(someObject)}``);
                if (someObject['type'] === 'text' && someObject['text'].length >= MINIMUM_TEXT_WORDS)
                    return true;
                if (someObject['type'] === 'word' && someObject['text'].length >= MINIMUM_WORD_LENGTH)
                    return true;
                if (someObject['type'] === 'milestone')
                    for (const someSubobject of someObject['children']) {
                        // debugLog("someSubobject", JSON.stringify(someSubobject));
                        if (someSubobject['type'] === 'text' && someSubobject['text'].length >= MINIMUM_TEXT_WORDS)
                            return true;
                        if (someSubobject['type'] === 'word' && someSubobject['text'].length >= MINIMUM_WORD_LENGTH)
                            return true;
                        if (someSubobject['type'] === 'milestone')
                            for (const someSub2object of someSubobject['children']) {
                                // debugLog("someSub2object", JSON.stringify(someSub2object));
                                if (someSub2object['type'] === 'text' && someSub2object['text'].length >= MINIMUM_TEXT_WORDS)
                                    return true;
                                if (someSub2object['type'] === 'word' && someSub2object['text'].length >= MINIMUM_WORD_LENGTH)
                                    return true;
                                if (someSub2object['type'] === 'milestone')
                                    for (const someSub3object of someSub2object['children']) {
                                        // debugLog("someSub3object", JSON.stringify(someSub3object));
                                        if (someSub3object['type'] === 'text' && someSub3object['text'].length >= MINIMUM_TEXT_WORDS)
                                            return true;
                                        if (someSub3object['type'] === 'word' && someSub3object['text'].length >= MINIMUM_WORD_LENGTH)
                                            return true;
                                        if (someSub3object['type'] === 'milestone')
                                            for (const someSub4object of someSub3object['children']) {
                                                // debugLog("someSub4object", JSON.stringify(someSub4object));
                                                if (someSub4object['type'] === 'text' && someSub4object['text'].length >= MINIMUM_TEXT_WORDS)
                                                    return true;
                                                if (someSub4object['type'] === 'word' && someSub4object['text'].length >= MINIMUM_WORD_LENGTH)
                                                    return true;
                                                if (someSub4object['type'] === 'milestone')
                                                    for (const someSub5object of someSub4object['children']) {
                                                        // debugLog("someSub5object", JSON.stringify(someSub5object));
                                                        if (someSub5object['type'] === 'text' && someSub5object['text'].length >= MINIMUM_TEXT_WORDS)
                                                            return true;
                                                        if (someSub5object['type'] === 'word' && someSub5object['text'].length >= MINIMUM_WORD_LENGTH)
                                                            return true;
                                                        if (someSub5object['type'] === 'milestone')
                                                            for (const someSub6object of someSub5object['children']) {
                                                                // debugLog("someSub6object", bookID, CVlocation, JSON.stringify(someSub6object));
                                                                if (someSub6object['type'] === 'text' && someSub6object['text'].length >= MINIMUM_TEXT_WORDS)
                                                                    return true;
                                                                if (someSub6object['type'] === 'word' && someSub6object['text'].length >= MINIMUM_WORD_LENGTH)
                                                                    return true;
                                                                if (someSub6object['type'] === 'milestone')
                                                                    for (const someSub7object of someSub6object['children']) {
                                                                        // debugLog("someSub7object", bookID, CVlocation, JSON.stringify(someSub7object));
                                                                        if (someSub7object['type'] === 'text' && someSub7object['text'].length >= MINIMUM_TEXT_WORDS)
                                                                            return true;
                                                                        if (someSub7object['type'] === 'word' && someSub7object['text'].length >= MINIMUM_WORD_LENGTH)
                                                                            return true;
                                                                        if (someSub7object['type'] === 'milestone')
                                                                            // UST Luke 15:3 has eight levels of nesting !!!
                                                                            for (const someSub8object of someSub7object['children']) {
                                                                                // debugLog("someSub8object", bookID, CVlocation, JSON.stringify(someSub8object));
                                                                                if (someSub8object['type'] === 'text' && someSub8object['text'].length >= MINIMUM_TEXT_WORDS)
                                                                                    return true;
                                                                                if (someSub8object['type'] === 'word' && someSub8object['text'].length >= MINIMUM_WORD_LENGTH)
                                                                                    return true;
                                                                                if (someSub8object['type'] === 'milestone')
                                                                                    for (const someSub9object of someSub8object['children']) {
                                                                                        // debugLog("someSub9object", bookID, CVlocation, JSON.stringify(someSub9object));
                                                                                        if (someSub9object['type'] === 'text' && someSub9object['text'].length >= MINIMUM_TEXT_WORDS)
                                                                                            return true;
                                                                                        if (someSub9object['type'] === 'word' && someSub9object['text'].length >= MINIMUM_WORD_LENGTH)
                                                                                            return true;
                                                                                        if (someSub9object['type'] === 'milestone')
                                                                                            for (const someSub10object of someSub9object['children']) {
                                                                                                // debugLog("someSub10object", bookID, CVlocation, JSON.stringify(someSub10object));
                                                                                                if (someSub10object['type'] === 'text' && someSub10object['text'].length >= MINIMUM_TEXT_WORDS)
                                                                                                    return true;
                                                                                                if (someSub10object['type'] === 'word' && someSub10object['text'].length >= MINIMUM_WORD_LENGTH)
                                                                                                    return true;
                                                                                                if (someSub10object['type'] === 'milestone')
                                                                                                    // UST Obadiah 1:8 has eleven levels of nesting !!!
                                                                                                    for (const someSub11object of someSub10object['children']) {
                                                                                                        // debugLog("someSub11object", bookID, CVlocation, JSON.stringify(someSub11object));
                                                                                                        if (someSub11object['type'] === 'text' && someSub11object['text'].length >= MINIMUM_TEXT_WORDS)
                                                                                                            return true;
                                                                                                        if (someSub11object['type'] === 'word' && someSub11object['text'].length >= MINIMUM_WORD_LENGTH)
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
                    if (verseNumberString.indexOf('-') !== -1) { // It’s a verse bridge
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
        // debugLog(`cUSFM ourCheckTextField(${lineNumber} ${C}:${V} fN=${fieldName}, (${fieldText.length} chars) aL=${allowedLinks}, ${fieldLocation}, ${JSON.stringify(checkingOptions)})…`);
        // if (fieldText.indexOf('| ') !== -1)
        //     debugLog(`cUSFM ourCheckTextField(${lineNumber} ${C}:${V} fN=${fieldName}, '${fieldText}' aL=${allowedLinks}, ${fieldLocation}, ${JSON.stringify(checkingOptions)}) for ${repoCode}…`);
        //parameterAssert(lineNumber !== undefined, "cUSFM ourCheckTextField: 'lineNumber' parameter should be defined");
        //parameterAssert(typeof lineNumber === 'number', `cUSFM ourCheckTextField: 'lineNumber' parameter should be a number not a '${typeof lineNumber}'`);
        //parameterAssert(C !== undefined, "cUSFM ourCheckTextField: 'C' parameter should be defined");
        //parameterAssert(typeof C === 'string', `cUSFM ourCheckTextField: 'C' parameter should be a string not a '${typeof C}'`);
        //parameterAssert(V !== undefined, "cUSFM ourCheckTextField: 'V' parameter should be defined");
        //parameterAssert(typeof V === 'string', `cUSFM ourCheckTextField: 'V' parameter should be a string not a '${typeof V}'`);
        //parameterAssert(fieldType !== undefined, "cUSFM ourCheckTextField: 'fieldType' parameter should be defined");
        //parameterAssert(typeof fieldType === 'string', `cUSFM ourCheckTextField: 'fieldType' parameter should be a string not a '${typeof fieldType}'`);
        //parameterAssert(fieldType === 'USFM line' || fieldType === 'raw USFM line', `cUSFM ourCheckTextField: Unrecognized 'fieldType' parameter: ${fieldType}`);
        //parameterAssert(fieldName !== undefined, "cUSFM ourCheckTextField: 'fieldName' parameter should be defined");
        //parameterAssert(typeof fieldName === 'string', `cUSFM ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        //parameterAssert(fieldName !== '', `cUSFM ourCheckTextField: ${fieldType} 'fieldName' parameter should be not be an empty string`);
        //parameterAssert(fieldText !== undefined, "cUSFM ourCheckTextField: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `cUSFM ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "cUSFM ourCheckTextField: allowedLinks parameter must be either true or false");
        //parameterAssert(fieldLocation !== undefined, "cUSFM ourCheckTextField: 'fieldLocation' parameter should be defined");
        //parameterAssert(typeof fieldLocation === 'string', `cUSFM ourCheckTextField: 'fieldLocation' parameter should be a string not a '${typeof fieldLocation}'`);

        const dbtcResultObject = checkTextField(username, languageCode, repoCode, fieldType, fieldName, fieldText, allowedLinks, fieldLocation, checkingOptions);

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

        const resultObject = checkTextfileContents(username, languageCode, repoCode, 'USFM', filename, fileText, fileLocation, checkingOptions);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList) {
            logicAssert(Object.keys(noticeEntry).length >= 5, `USFM ourBasicFileChecks notice length=${Object.keys(noticeEntry).length}`);
            if (filename.startsWith('text extracted from')) {
                // The line number, etc. will be useless/misleading
                delete noticeEntry.lineNumber;
                delete noticeEntry.characterIndex;
            }
            addNoticePartial(noticeEntry);
        }
    }
    // end of ourBasicFileChecks function


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

        // NOTE: Better to do this for each line for most uW USFM files
        // Check matched pairs of markers like \add ... \add*, \f .. \f*
        if (!['en', 'hbo', 'el-x-koine'].includes(languageCode))
            for (const punctSet of MATCHED_CHARACTER_FORMATTING_FILE_PAIRS_LIST) {
                const opener = `\\${punctSet[0]} `, closer = `\\${punctSet[1]}`;
                const lCount = countOccurrencesInString(fileText, opener);
                const rCount = countOccurrencesInString(fileText, closer);
                if (lCount !== rCount)
                    addNoticePartial({ priority: 873, message: `Mismatched ${opener}${closer} fields`, details: `(opening=${lCount.toLocaleString()}, closing=${rCount.toLocaleString()})`, location: fileLocation });
            }

        // We recommend mt1 and s1 and q1, etc. instead of mt, s, and q
        const foundOptionalMarkersList = [];
        for (const optionallyNumberedMarker of OPTIONALLY_NUMBERED_MARKERS_LIST) {
            if (fileText.indexOf(`\\${optionallyNumberedMarker} `) !== -1)
                foundOptionalMarkersList.push(optionallyNumberedMarker);
        }
        if (foundOptionalMarkersList.length)
            addNoticePartial({ priority: 260, message: `It’s recommended to use the explicitly-numbered USFM markers`, details: `found ${foundOptionalMarkersList}`, location: fileLocation });

        // Now do the general global checks (e.g., for general punctuation) -- this is the raw USFM code
        // debugLog(`checkUSFMFileContents doing basic file checks on ${repoCode} (${fileText.length}) ${fileText}`);
        ourBasicFileChecks(filename, fileText, fileLocation, checkingOptions);

        for (const expectedMarker of EXPECTED_MARKERS_LIST)
            if (!markerSet.has(expectedMarker)
                && (!expectedMarker.endsWith('1') || !markerSet.has(expectedMarker.slice(0, expectedMarker.length - 1))))
                // NOTE: \mt(1) is required by Proskomma so increased this priority
                addNoticePartial({ priority: expectedMarker === 'mt1' ? 921 : 519, message: "Missing expected USFM line", excerpt: `missing \\${expectedMarker}`, location: fileLocation });
        if (books.isExtraBookID(bookID))
            for (const expectedMarker of EXPECTED_PERIPHERAL_BOOK_MARKER_LIST)
                if (!markerSet.has(expectedMarker))
                    addNoticePartial({ priority: 517, message: "Missing expected USFM line", excerpt: `missing \\${expectedMarker}`, location: fileLocation });
                else
                    for (const expectedMarker of EXPECTED_BIBLE_BOOK_MARKERS_LIST)
                        if (!markerSet.has(expectedMarker))
                            addNoticePartial({ priority: 518, message: "Missing expected USFM line", excerpt: `missing \\${expectedMarker}`, location: fileLocation });
        for (const deprecatedMarker of DEPRECATED_MARKERS_LIST)
            if (markerSet.has(deprecatedMarker))
                addNoticePartial({ priority: 218, message: "Using deprecated USFM marker", excerpt: `\\${deprecatedMarker}`, location: fileLocation });

        // Now check how the text looks overall
        //  but not worried about double spaces, etc, here -- more on word/punctuation stuff
        let cleanishText = extractTextFromComplexUSFM(fileText);
        // debugLog(`checkUSFMFileContents got ${repoCode} cleanishText (${cleanishText.length}) ${cleanishText}`);
        if (!cleanishText.endsWith('\n')) cleanishText += '\n'; // Don't want duplicated "file ends without newline" warnings
        // debugLog(`checkUSFMFileContents doing basic file checks on ${repoCode} (${fileText.length}) ${cleanishText}`);
        // NOTE: This could conceivably get some notice double-ups, but it's a quite different text being checked than in the above call
        // NOTE: The exact wording below much match RenderFileDetails() in RenderProcessedResults.js
        ourBasicFileChecks(`text extracted from ${filename}`, cleanishText, fileLocation, checkingOptions);
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
        //if (C !== '0' && C !== '1') { parameterAssert(bookID !== '2JN' && bookID !== '3JN' && bookID !== 'JUD', `checkUSFMLineText() can’t have ${C}:${V} for ${bookID}`); }

        const details = `line marker='\\${marker}'`

        // Check for invalid character combinations
        // debugLog(`Here with ${repoCode} ${languageCode} ${filename}`)
        if (languageCode === 'hbo') {
            // debugLog(`Checking Hebrew encoding for ${filename}…`)
            let regexMatchObject;
            // NOTE: Use else statements so we only get ONE of these types of errors
            // NOTE: We have no while loops, so only get one error per line, even if there's multiple errors!!!
            if ((regexMatchObject = BAD_HEBREW_SIN_SHIN_DOT_REGEX.exec(rest))) { // it’s null if no matches
                // debugLog(`checkUSFMLineText 865: ${bookID} ${C}:${V} line ${lineNumber} got BAD character before shin/sin dot regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);
                const characterIndex = regexMatchObject.index;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 865, message: "Unexpected Hebrew character before shin/sin dot", details: `found ${regexMatchObject.length} ‘${regexMatchObject}’`, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
            else if ((regexMatchObject = MISSING_HEBREW_SIN_SHIN_DOT_REGEX.exec(rest))) { // it’s null if no matches
                // debugLog(`checkUSFMLineText 871: ${bookID} ${C}:${V} line ${lineNumber} got BAD character after shin/sin consonant regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);
                const characterIndex = regexMatchObject.index;
                const nextChar = rest.slice(characterIndex + 1, characterIndex + 2);
                // u2060 is word joiner
                const priority = nextChar !== ' ' && nextChar !== '|' && nextChar !== '\u2060' && HEBREW_ALL_CONSONANTS.indexOf(nextChar) === -1 ? 871 : 105; // Lower the priority for Hebrew consonants (qere is unpointed)
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                // if (priority === 871) debugLog(`Git 871 with ${nextChar} for ${excerpt} from ${rest}`);
                addNoticePartial({ priority, message: "Hebrew shin consonant is not followed by a shin/sin dot", details: `found ${regexMatchObject.length} ‘${regexMatchObject}’`, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
            else if ((regexMatchObject = BAD_HEBREW_VOWEL_DAGESH_REGEX.exec(rest))) { // it’s null if no matches
                // debugLog(`checkUSFMLineText 864: ${bookID} ${C}:${V} line ${lineNumber} got BAD dagesh after vowel character order regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);
                const characterIndex = regexMatchObject.index;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 864, message: "Unexpected Hebrew dagesh after vowel", details: `found ${regexMatchObject.length} ‘${regexMatchObject}’`, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
            else if ((regexMatchObject = BAD_HEBREW_DAGESH_MAPIQ_REGEX.exec(rest))) { // it’s null if no matches
                // debugLog(`checkUSFMLineText 863: ${bookID} ${C}:${V} line ${lineNumber} got BAD character before dagesh regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);
                const characterIndex = regexMatchObject.index;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 863, message: "Unexpected Hebrew character before dagesh or mappiq", details: `found ${regexMatchObject.length} ‘${regexMatchObject}’`, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
            else if ((regexMatchObject = BAD_HEBREW_CANTILLATION_DAGESH_REGEX.exec(rest))) { // it’s null if no matches
                // debugLog(`checkUSFMLineText 862: ${bookID} ${C}:${V} line ${lineNumber} got BAD cantillation mark character before dagesh regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);
                const characterIndex = regexMatchObject.index;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 862, message: "Unexpected Hebrew cantillation mark before dagesh", details: `found ${regexMatchObject.length} ‘${regexMatchObject}’`, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
            else if ((regexMatchObject = BAD_HEBREW_CANTILLATION_VOWEL_REGEX.exec(rest)) // it’s null if no matches
                // These are the actual accents that occur before the hiriq vowel (5B4) -- others could conceivable occur also
                && ((regexMatchObject[0] !== '\u0591\u05B4' && regexMatchObject[0] !== '\u0596\u05B4' && regexMatchObject[0] !== '\u059B\u05B4' && regexMatchObject[0] !== '\u05A3\u05B4' && regexMatchObject[0] !== '\u05A5\u05B4' && regexMatchObject[0] !== '\u05A7\u05B4' && regexMatchObject[0] !== '\u05AB\u05B4')
                    || rest.indexOf('וּשָׁל') === -1)) { // Yerushalayim has an exception -- a vowel after a cantillation mark
                // debugLog(`checkUSFMLineText 861 regexMatchObject: ${typeof regexMatchObject} (${regexMatchObject.length}) '${regexMatchObject}' ${JSON.stringify(regexMatchObject)}`);
                // debugLog(`checkUSFMLineText 861 regexMatchObject: ${typeof regexMatchObject} ${Object.keys(regexMatchObject)}`); // object with keys: 0,index,input,groups
                // debugLog(`checkUSFMLineText 861 regexMatchObject: ${typeof regexMatchObject[0]} (${regexMatchObject[0].length}) '${regexMatchObject[0]}'  ${typeof regexMatchObject[0][0]} (${regexMatchObject[0][0].length}) '${regexMatchObject[0][0]}'`);
                // debugLog(`checkUSFMLineText 861 regexMatchObject: ${regexMatchObject[0] !== '\u0591\u05B4'} ${regexMatchObject[0] !== '\u0596\u05B4'} ${rest.indexOf('וּשָׁל') === -1} => ${(regexMatchObject[0] !== '\u0591\u05B4' && regexMatchObject[0] !== '\u0596\u05B4') || rest.indexOf('וּשָׁל') === -1} '${rest}'`);
                // debugLog(`checkUSFMLineText 861: ${bookID} ${C}:${V} line ${lineNumber} got BAD vowel after cantillation mark character order regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);
                const characterIndex = regexMatchObject.index;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 861, message: "Unexpected Hebrew vowel after cantillation mark", details: `found ${regexMatchObject.length} ‘${regexMatchObject}’`, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
            else if ((regexMatchObject = BAD_HEBREW_FINAL_CONSONANT_REGEX.exec(rest))) { // it’s null if no matches
                // debugLog(`checkUSFMLineText 860 regexMatchObject: ${typeof regexMatchObject} (${regexMatchObject.length}) '${regexMatchObject}' ${JSON.stringify(regexMatchObject)}`);
                // debugLog(`checkUSFMLineText 860 regexMatchObject: ${typeof regexMatchObject} ${Object.keys(regexMatchObject)}`); // object with keys: 0,index,input,groups
                // debugLog(`checkUSFMLineText 860 regexMatchObject: ${typeof regexMatchObject[0]} (${regexMatchObject[0].length}) '${regexMatchObject[0]}'  ${typeof regexMatchObject[0][0]} (${regexMatchObject[0][0].length}) '${regexMatchObject[0][0]}'`);
                // debugLog(`checkUSFMLineText 860: ${bookID} ${C}:${V} line ${lineNumber} got BAD final consonant regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);
                const characterIndex = regexMatchObject.index;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                if (excerpt.indexOf('ןׄ') === -1) // Allow this one exception for ְׄ⁠אַׄהֲׄרֹ֛ׄןׄ in Num 3:39
                    addNoticePartial({ priority: 860, message: "Unexpected Hebrew final consonant not at word end", details: `found ${regexMatchObject.length} ‘${regexMatchObject}’`, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
        }

        // Check that no \w markers touch, i.e., shouldn’t have '\w*\w' in file
        let characterIndex;
        if ((characterIndex = rest.indexOf('\\w*\\w')) !== -1) {
            // NOTE: There’s one example of this in ULT 1 Kings 6:1 "480th"
            //  \w 480|x-occurrence="1" x-occurrences="1"\w*\w th|x-occurrence="1" x-occurrences="1"\w*
            // Also UST Ezra 6:19 "14th" and Ezra 10:9 "20th"
            const badCount = countOccurrencesInString(rest, '\\w*\\w');
            if (badCount > 1
                || ((rest.indexOf('\\w*\\w th|') === -1 && rest.indexOf('\\w*\\w st|') === -1 && rest.indexOf('\\w*\\w nd|') === -1 && rest.indexOf('\\w*\\w rd|') === -1))
            ) { // there’s multiple cases or it’s not an ordinal like 1st, 2nd, 3rd, 4th
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 444, message: "Shouldn’t have consecutive word fields without a space", details: badCount > 1 ? details + `${badCount} occurrences found in line` : details, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
        }

        // Check that no \f or \x markers follow a space
        if ((characterIndex = rest.indexOf(' \\f ')) !== -1) {
            const badCount = countOccurrencesInString(rest, ' \\f ');
            if (badCount > 1 || marker !== 'v' || characterIndex > 3) { // Accept it if it seems to be after the space after a verse number
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 443, message: "Shouldn’t have a footnote after a space", details: badCount > 1 ? details + `${badCount} occurrences found in line` : details, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
        }
        if ((characterIndex = rest.indexOf(' \\x ')) !== -1) {
            const badCount = countOccurrencesInString(rest, ' \\x ');
            if (badCount > 1 || marker !== 'v' || characterIndex > 3) { // Accept it if it seems to be after the space after a verse number
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + rest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < rest.length ? '…' : '')
                addNoticePartial({ priority: 442, message: "Shouldn’t have a cross-reference after a space", details: badCount > 1 ? details + `${badCount} occurrences found in line` : details, lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
        }

        // Remove any self-closed milestones and internal \v markers
        // NOTE: replaceAll() is not generally available in browsers yet, so need to use RegExps
        let adjustedRest = rest.replace(/\\zaln-e\\\*/g, '').replace(/\\ts\\\*/g, '').replace(/\\k-e\\\*/g, '')
            .replace(/\\v /g, '')
            .replace(/\\k-s[^\\]+\\\*/g, ''); // This last one is a genuine RegExp because it includes the field contents

        // Remove any simple character markers
        // NOTE: replaceAll() is not generally available in browsers yet, so need to use RegExps
        for (const charMarker of SIMPLE_INTERNAL_MARKERS_LIST) {
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
            if (ixWordEnd < 0 && adjustedRest.indexOf('lemma="') !== -1) {
                const characterIndex = 5; // Presumably, a little bit into the word
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 912, message: 'Missing | character in \\w line', lineNumber, C, V, characterIndex, excerpt, location: lineLocation });
            }
            dataAssert(ixWordEnd >= 1, `Why1 is w| = ${ixWordEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
            ixEnd = adjustedRest.indexOf('\\w*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.slice(0, ixWordEnd) + adjustedRest.slice(ixEnd + 3, adjustedRest.length);
            else dataAssert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'zaln-s') { // Remove first \zaln-s milestone (if marker == zaln-s)
            ixEnd = adjustedRest.indexOf('\\*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.slice(ixEnd + 2, adjustedRest.length);
            else dataAssert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'k-s') { // Remove first \k-s milestone (if marker == k-s)
            ixEnd = adjustedRest.indexOf('\\*');
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.slice(ixEnd + 2, adjustedRest.length);
            else dataAssert(false, `Why is ixEnd = ${ixEnd}? ${languageCode} ${bookID} ${C}:${V} ${lineNumber} '\\${marker}'`);
        } else if (marker === 'f') { // Handle first footnote (if marker == f)
            ixEnd = adjustedRest.indexOf('\\f*');
            const startIndex = adjustedRest.startsWith('+ ') ? 2 : 0;
            if (ixEnd >= 0)
                adjustedRest = adjustedRest.slice(startIndex, ixEnd) + adjustedRest.slice(ixEnd + 3, adjustedRest.length);
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
        else if (marker === 'qs')
            adjustedRest = adjustedRest.replace('\\qs*', '');

        // Remove any other \zaln-s fields in the line
        // if (adjustedRest.indexOf('\\z') !== -1) userLog(`checkUSFMLineText here first at ${lineNumber} ${C}:${V} with ${marker}='${adjustedRest}'`);
        let nextZIndex;
        while ((nextZIndex = adjustedRest.indexOf('\\zaln-s ')) !== -1) {
            // functionLog(`checkUSFMLineText here with ${marker}='${adjustedRest}'`);
            const ixZEnd = adjustedRest.indexOf('\\*');
            // debugLog(`  ${nextZIndex} and ${ixZEnd}`);
            if (ixZEnd >= 0) {
                // dataAssert(ixZEnd > nextZIndex, `Expected closure at ${ixZEnd} to be AFTER \\zaln-s (${nextZIndex})`);
                adjustedRest = adjustedRest.slice(0, nextZIndex) + adjustedRest.slice(ixZEnd + 2, adjustedRest.length);
                // debugLog(`  Now '${adjustedRest}'`);
            } else {
                userLog(`\\zaln-s seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }
        // Remove any other \w fields in the line
        let nextWIndex;
        while ((nextWIndex = adjustedRest.indexOf('\\w ')) !== -1) {
            const ixWordEnd = adjustedRest.indexOf('|');
            if (ixWordEnd < 0 && adjustedRest.indexOf('lemma="') !== -1) {
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
                adjustedRest = adjustedRest.slice(0, nextWIndex) + adjustedRest.slice(nextWIndex + 3, ixWordEnd) + adjustedRest.slice(ixWEnd + 3, adjustedRest.length);
                // debugLog(`After removing w field, got '${adjustedRest}'`);
            } else {
                userLog(`\\w seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }
        // Remove any other \+w fields in the line
        while ((nextWIndex = adjustedRest.indexOf('\\+w ')) !== -1) {
            const ixWordEnd = adjustedRest.indexOf('|');
            if (ixWordEnd < 0 && adjustedRest.indexOf('lemma="') !== -1) {
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
                adjustedRest = adjustedRest.slice(0, nextWIndex) + adjustedRest.slice(nextWIndex + 4, ixWordEnd) + adjustedRest.slice(ixWEnd + 4, adjustedRest.length);
                // debugLog(`After removing w field, got '${adjustedRest}'`);
            } else {
                userLog(`\\+w seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }
        // Remove any other \f fields in the line
        let nextFIndex;
        while ((nextFIndex = adjustedRest.indexOf('\\f + ')) !== -1) {
            const ixFEnd = adjustedRest.indexOf('\\f*');
            if (ixFEnd >= 0) {
                dataAssert(ixFEnd > nextWIndex, `Expected closure at ${ixFEnd} to be AFTER \\w (${nextFIndex})`);
                adjustedRest = `${adjustedRest.slice(0, nextFIndex)} ${adjustedRest.slice(nextFIndex + 5, ixFEnd)}${adjustedRest.slice(ixFEnd + 3, adjustedRest.length)}`;
                // functionLog(`checkUSFMLineText(${lineNumber}, ${C}:${V}, ${marker}='${rest}', ${lineLocation}, ${JSON.stringify(checkingOptions)})…`);
                // debugLog(`After removing footnote: '${adjustedRest}'`);
            } else {
                userLog(`\\f seems unclosed: 'adjustedRest' from '${rest}'`);
                break;
            }
        }

        if (adjustedRest) {
            let characterIndex;
            if ((characterIndex = adjustedRest.indexOf('"')) !== -1) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 776, message: 'Unexpected " straight quote character', details, lineNumber, C, V, excerpt, location: lineLocation });
                // debugLog(`ERROR 776: in ${marker} '${adjustedRest}' from '${rest}'`);
            }
            if ((characterIndex = adjustedRest.indexOf("'")) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 775, message: "Unexpected ' straight quote character", details, lineNumber, C, V, excerpt, location: lineLocation });
                // debugLog(`ERROR 775: in ${marker} '${adjustedRest}' from '${rest}'`);
            }
            if ((characterIndex = adjustedRest.indexOf('\\')) !== -1 || adjustedRest.indexOf('|') !== -1) {
                // functionLog(`checkUSFMLineText ${languageCode} ${filename} ${lineNumber} ${C}:${V} somehow ended up with ${marker}='${adjustedRest}'`);
                if (characterIndex === -1) characterIndex = adjustedRest.indexOf('|');
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + adjustedRest.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < adjustedRest.length ? '…' : '')
                addNoticePartial({ priority: 875, message: "Unexpected USFM field", details, lineNumber, C, V, excerpt, location: lineLocation });
            }
            if (adjustedRest !== rest) // Only re-check if line has changed (because original is checked in checkUSFMLineInternals())
                // Note: false (below) is for allowedLinks flag
                ourCheckTextField(lineNumber, C, V, 'raw USFM line', `adjusted text from \\${marker}`, adjustedRest, false, lineLocation, checkingOptions);
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
        dataAssert(countOccurrencesInString(adjustedRest, '\\w ') === countOccurrencesInString(adjustedRest, '\\w*'), `checkUSFMLineAttributes expected all \\w fields to be closed in ${adjustedRest}`);
        dataAssert(countOccurrencesInString(adjustedRest, '\\+w ') === countOccurrencesInString(adjustedRest, '\\+w*'), `checkUSFMLineAttributes expected all \\+w fields to be closed in ${adjustedRest}`);
        // dataAssert(countOccurrencesInString(adjustedRest, '\\zaln-s ') === countOccurrencesInString(adjustedRest, '\\zaln-s*'), `checkUSFMLineAttributes expected all \\zaln-s fields to be closed in ${adjustedRest}`);
        // dataAssert(countOccurrencesInString(adjustedRest, '\\k-s ') === countOccurrencesInString(adjustedRest, '\\k-s*'), `checkUSFMLineAttributes expected all \\k-s fields to be closed in ${adjustedRest}`);

        async function ourCheckStrongsField(lineNumber, C, V, marker, fieldName, fieldText, location, checkingOptions) {
            // Checks that the Strongs number field is valid

            // Updates the global list of notices

            // functionLog(`checkUSFMText ourCheckStrongsField(${lineNumber}, ${C}:${V}, ${marker}, ${fieldName}, (${fieldText.length}) '${fieldText}', ${location}, ${JSON.stringify(checkingOptions)})`);
            //parameterAssert(marker !== undefined, "checkUSFMText ourCheckStrongsField: 'marker' parameter should be defined");
            //parameterAssert(typeof marker === 'string', `checkUSFMText ourCheckStrongsField: 'marker' parameter should be a string not a '${typeof marker}': ${marker}`);
            //parameterAssert(fieldName !== undefined, "checkUSFMText ourCheckStrongsField: 'fieldName' parameter should be defined");
            //parameterAssert(typeof fieldName === 'string', `checkUSFMText ourCheckStrongsField: 'fieldName' parameter should be a string not a '${typeof fieldName}': ${fieldName}`);
            //parameterAssert(fieldText !== undefined, "checkUSFMText ourCheckStrongsField: 'fieldText' parameter should be defined");
            //parameterAssert(typeof fieldText === 'string', `checkUSFMText ourCheckStrongsField: 'fieldText' parameter should be a string not a '${typeof fieldText}': ${fieldText}`);
            //parameterAssert(checkingOptions !== undefined, "checkUSFMText ourCheckStrongsField: 'checkingOptions' parameter should be defined");
            if (checkingOptions !== undefined) {
                //parameterAssert(typeof checkingOptions === 'object', `checkUSFMText ourCheckStrongsField: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
            }

            let adjustedLanguageCode = languageCode; // This is the language code of the resource with the link
            if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won’t be needed for TWs when we switch to TWLs)
            const csfResultObject = await checkStrongsField(username, languageCode, repoCode, fieldName, fieldText, bookID, C, V, location, { ...checkingOptions, defaultLanguageCode: adjustedLanguageCode });
            // debugLog(`csfResultObject=${JSON.stringify(csfResultObject)}`);

            // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
            //  process results line by line
            for (const coqNoticeEntry of csfResultObject.noticeList) {
                // debugLog(`checkUSFMText ourCheckStrongsField got: ${JSON.stringify(coqNoticeEntry)}`);
                logicAssert(coqNoticeEntry.extra ? coqNoticeEntry.extra !== 'UGNT' : true, `Expected extra to be a lexicon from ${JSON.stringify(coqNoticeEntry)}`);
                if (coqNoticeEntry.extra) // it must be an indirect check on a UHAL or UGL article from a lexicon check
                    usfmResultObject.noticeList.push(coqNoticeEntry); // Just copy the complete notice as is
                else // For our direct checks, we add the repoCode as an extra value
                    addNoticePartial({ ...coqNoticeEntry, lineNumber, C, V, fieldName: marker });
            }
            // The following is needed coz we might be checking the linked UHAL and/or UGL lexicon entries
            if (csfResultObject.checkedFileCount && csfResultObject.checkedFileCount > 0)
                if (typeof usfmResultObject.checkedFileCount === 'number') usfmResultObject.checkedFileCount += csfResultObject.checkedFileCount;
                else usfmResultObject.checkedFileCount = csfResultObject.checkedFileCount;
            if (csfResultObject.checkedFilesizes && csfResultObject.checkedFilesizes > 0)
                if (typeof usfmResultObject.checkedFilesizes === 'number') usfmResultObject.checkedFilesizes += csfResultObject.checkedFilesizes;
                else usfmResultObject.checkedFilesizes = csfResultObject.checkedFilesizes;
            if (csfResultObject.checkedRepoNames && csfResultObject.checkedRepoNames.length > 0)
                for (const checkedRepoName of csfResultObject.checkedRepoNames)
                    try { if (usfmResultObject.checkedRepoNames.indexOf(checkedRepoName) < 0) usfmResultObject.checkedRepoNames.push(checkedRepoName); }
                    catch { usfmResultObject.checkedRepoNames = [checkedRepoName]; }
            if (csfResultObject.checkedFilenameExtensions && csfResultObject.checkedFilenameExtensions.length > 0)
                for (const checkedFilenameExtension of csfResultObject.checkedFilenameExtensions)
                    try { if (usfmResultObject.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) usfmResultObject.checkedFilenameExtensions.push(checkedFilenameExtension); }
                    catch { usfmResultObject.checkedFilenameExtensions = [checkedFilenameExtension]; }
            // if (result.checkedFilenameExtensions) debugLog(`ourCheckStrongsField result: ${JSON.stringify(result)}`);
        }
        // end of ourCheckStrongsField function

        /**
         *
         * @description Check USFM \w fields (which are quite different in UHB/UGNT vs translations)
         * @param {string} wContents
         */
        async function checkWAttributes(wContents) {
            // functionLog(`checkWAttributes(${wContents})…`);
            let regexMatchObject, attributeCounter = 0;
            while ((regexMatchObject = ATTRIBUTE_REGEX.exec(wContents))) {
                attributeCounter += 1;
                // debugLog(`  Got attribute Regex in \\w: ${attributeCounter} '${JSON.stringify(regexMatchObject2)}`);
                const attributeName = regexMatchObject[1], attributeValue = regexMatchObject[2];
                if (repoCode === 'UHB' || repoCode === 'UGNT') {
                    if (attributeCounter === 1) {
                        if (attributeName !== 'lemma')
                            addNoticePartial({ priority: 857, message: "Unexpected first original \\w attribute", details: "expected 'lemma'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    } else if (attributeCounter === 2) {
                        if (attributeName !== 'strong')
                            addNoticePartial({ priority: 856, message: "Unexpected second original \\w attribute", details: "expected 'strong'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    } else if (attributeCounter === 3) {
                        if (attributeName !== 'x-morph')
                            addNoticePartial({ priority: 855, message: "Unexpected third original \\w attribute", details: "expected 'x-morph'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    } else if (attributeCounter === 4) {
                        if (attributeName !== 'x-tw') // we can have TWO of these -- THREE EVEN in EXO 15:23 and 1KI 21:9!!!
                            addNoticePartial({ priority: 854, message: "Unexpected fourth original \\w attribute", details: "expected 'x-tw'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    } else if (attributeCounter === 5) {
                        if (attributeName !== 'x-tw')
                            addNoticePartial({ priority: 854, message: "Unexpected fifth original \\w attribute", details: "expected second 'x-tw'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    } else if (attributeCounter === 6) {
                        if (attributeName !== 'x-tw')
                            addNoticePartial({ priority: 854, message: "Unexpected sixth original \\w attribute", details: "expected third 'x-tw'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    } else // #7 or more
                        addNoticePartial({ priority: 853, message: "Unexpected extra original \\w attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    if (attributeName === 'lemma' && repoCode === 'UHB') {
                        const regexMatchObject = HEBREW_CANTILLATION_REGEX.exec(attributeValue);
                        if (regexMatchObject) { // it’s null if no matches
                            // debugLog(`Got cantillation regexMatchObject: (${regexMatchObject.length}) ${JSON.stringify(regexMatchObject)}`);
                            addNoticePartial({ priority: 905, message: "Unexpected Hebrew cantillation mark in lemma field", details: `found ${regexMatchObject.length} ‘${regexMatchObject}’`, lineNumber, C, V, excerpt: attributeValue, location: lineLocation });
                        }
                    } else if (attributeName === 'x-morph'
                        && ((repoCode === 'UHB' && !attributeValue.startsWith('He,') && !attributeValue.startsWith('Ar,'))
                            || (repoCode === 'UGNT' && !attributeValue.startsWith('Gr,'))))
                        addNoticePartial({ priority: 852, message: "Unexpected original \\w x-morph language prefix", details: "Expected 'He,' 'Ar,' or 'Gr,'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    else if (attributeName === 'x-tw')
                        await ourCheckNotesLinksToOutside(lineNumber, C, V, marker, attributeValue, lineLocation, checkingOptions);
                } else { // a translation -- perhaps LT or ST, but not UHB or UGNT
                    if (attributeCounter === 1) {
                        if (attributeName !== 'x-occurrence')
                            addNoticePartial({ priority: 848, message: "Unexpected first translation \\w attribute", details: "expected 'x-occurrence'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    } else if (attributeCounter === 2) {
                        if (attributeName !== 'x-occurrences')
                            addNoticePartial({ priority: 847, message: "Unexpected second translation \\w attribute", details: "expected 'x-occurrences'", lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                    } else // #3 or more
                        addNoticePartial({ priority: 846, message: "Unexpected extra translation \\w attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                }
                if (attributeName === 'strong' || attributeName === 'x-strong') // UHB/UGNT have strong, ULT/UST have x-strong
                    await ourCheckStrongsField(lineNumber, C, V, marker, attributeName, attributeValue, lineLocation, checkingOptions);
            }
            if (repoCode === 'UHB' || repoCode === 'UGNT') {
                if (attributeCounter < 3)
                    addNoticePartial({ priority: 837, message: "Seems too few original \\w attributes", details: `expected 3-4 attributes but only found ${attributeCounter}`, lineNumber, C, V, excerpt: regexMatchObject1[0], location: lineLocation });
            } else if (attributeCounter < 2)
                addNoticePartial({ priority: 836, message: "Seems too few translation \\w attributes", details: `expected two attributes but only found ${attributeCounter}`, lineNumber, C, V, excerpt: regexMatchObject1[0], location: lineLocation });
        }
        // end of checkWAttributes function

        /**
         *
         * @param {string} bookID -- USFM book ID or 'OBS'
         * @param {string} C -- chapter or story number
         * @param {string} V -- verse or frame number
         * @param {Object} checkingOptions
         */
        async function getOriginalWordLists(bookID, C, V, checkingOptions) {
            // functionLog(`getOriginalWordLists(${bookID}, ${C}:${V}, )…`);

            // TODO: Why not calculate and cache all of these at once
            let originalLanguageRepoUsername;
            try {
                originalLanguageRepoUsername = checkingOptions?.originalLanguageRepoUsername;
            } catch (qcoError) { }
            if (!originalLanguageRepoUsername) originalLanguageRepoUsername = languageCode === 'en' ? 'unfoldingWord' : 'Door43-Catalog'; // ??? !!!
            let branch;
            try {
                branch = checkingOptions?.originalLanguageRepoBranch;
            } catch (qcunError) { }
            if (!branch) branch = 'master';
            const getFile_ = (checkingOptions && checkingOptions?.getFile) ? checkingOptions?.getFile : cachedGetFile;

            const uniqueCacheID = `${originalLanguageRepoUsername}_${languageCode}_${repoCode}_${branch}-${bookID}_${C}:${V}`;
            const cachedWordLists = await fetchSegmentIfCached(uniqueCacheID);
            if (cachedWordLists !== null) return cachedWordLists;

            const originalLanguageVerseWordList = [], originalLanguageVerseWordObjectList = [];
            const bookNumberAndName = books.usfmNumberName(bookID);
            let whichTestament;
            try {
                whichTestament = books.testament(bookID); // returns 'old' or 'new'
            } catch (bNNerror) {
                if (books.isValidBookID(bookID)) // must be in FRT, BAK, etc.
                    whichTestament = 'other';
            }
            logicAssert(whichTestament === 'old' || whichTestament === 'new', `getOriginalPassage() couldn’t find testament for '${bookID}'`);
            const originalLanguageRepoLanguageCode = whichTestament === 'old' ? 'hbo' : 'el-x-koine';
            const originalLanguageRepoCode = whichTestament === 'old' ? 'UHB' : 'UGNT';
            const originalLanguageRepoName = `${originalLanguageRepoLanguageCode}_${originalLanguageRepoCode.toLowerCase()}`;
            const filename = `${bookNumberAndName}.usfm`;

            let originalUSFM;
            // debugLog(`Need to check against ${originalLanguageRepoCode}`);
            if (originalLanguageRepoCode === 'UHB') {
                try {
                    originalUSFM = await getFile_({ username: originalLanguageRepoUsername, repository: originalLanguageRepoName, path: filename, branch });
                    // debugLog("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
                } catch (gcUHBerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                    console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UHB`, originalLanguageRepoUsername, originalLanguageRepoCode, filename, branch, gcUHBerror.message);
                    addNoticePartial({ priority: 601, message: "Unable to load file", details: `error=${gcUHBerror}`, username: originalLanguageRepoUsername, filename, location: ourLocation, extra: originalLanguageRepoName });
                }
            } else if (originalLanguageRepoCode === 'UGNT') {
                try {
                    originalUSFM = await getFile_({ username: originalLanguageRepoUsername, repository: originalLanguageRepoName, path: filename, branch });
                    // debugLog("Fetched fileContent for", repoName, filename, typeof originalUSFM, originalUSFM.length);
                } catch (gcUGNTerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
                    console.error(`getOriginalPassage(${bookID}, ${C}:${V}, ${JSON.stringify(checkingOptions)}) failed to load UGNT`, originalLanguageRepoUsername, originalLanguageRepoCode, filename, branch, gcUGNTerror.message);
                    addNoticePartial({ priority: 601, message: "Unable to load file", details: `error=${gcUGNTerror}`, username: originalLanguageRepoUsername, filename, location: ourLocation, extra: originalLanguageRepoName });
                }
            }
            if (!originalUSFM) {
                debugLog(`Oops: getOriginalWordLists(${bookID}, ${C}:${V}, ) didn’t find a file from ${originalLanguageRepoUsername} ${originalLanguageRepoName} ${filename} ${branch}!!!`);
                const wordLists = { originalLanguageRepoCode, originalLanguageVerseWordList, originalLanguageVerseWordObjectList };
                cacheSegment(wordLists, uniqueCacheID); // Don't bother (a)waiting
                return wordLists;
            }

            // Ok, we now have the USFM for the entire book
            const V1 = V.split('-')[0]; // Usually identical to V
            let V2, intV2;
            if (V1 !== V) {
                V2 = V.split('-')[1];
                intV2 = Number(V2);
                // debugLog(`getOriginalWordLists got verse range ${V1} and ${V2} (${intV2})`)
                // Since we have a verse bridge, save some extra pointers so we can separate the verses later
                originalLanguageVerseWordList.push(`v=${V1}`);
                originalLanguageVerseWordObjectList.push(`v=${V1}`);
            }

            // Now find the desired C:V
            let foundChapter = false, foundVerse = false;
            // let wLinesVerseText = '';
            for (let bookLine of originalUSFM.split('\n')) {
                // debugLog("bookLine", bookLine);
                if (!foundChapter && bookLine === `\\c ${C}`) {
                    foundChapter = true;
                    continue;
                }
                if (foundChapter && !foundVerse && bookLine.startsWith(`\\v ${V1}`)) {
                    foundVerse = true;
                    bookLine = bookLine.slice(3 + V1.length); // Delete verse number so below bit doesn’t fail
                }
                if (foundVerse) {
                    if (bookLine.startsWith('\\c ')) break; // Don't go into the next chapter
                    if (bookLine.startsWith('\\v '))
                        if (!V2) // no range requested
                            break; // Don’t go into the next verse or chapter
                        else { // there is a range requested
                            const thisV = bookLine.slice(3);
                            const intV = Number(thisV);
                            // debugLog(`getOriginalWordLists got verse number ${intV} for range ${V1} and ${V2} (${intV2})`)
                            if (intV > intV2) break; // we're past the bit we want
                            // Since we have a verse bridge, save some extra pointers so we can separate the verses later
                            originalLanguageVerseWordList.push(`v=${thisV}`);
                            originalLanguageVerseWordObjectList.push(`v=${thisV}`);
                        }
                    if (bookLine.indexOf('\\w ') !== -1 || bookLine.indexOf('\\+w ') !== -1) {
                        // Get each \w field out
                        let regexMatchObject1;
                        while ((regexMatchObject1 = W_FIELDS_REGEX.exec(bookLine))) {
                            // debugLog(`Got ${repoCode} wFields Regex in ${bookID} ${C}:${V}: (${regexMatchObject1.length}) ${JSON.stringify(regexMatchObject1)}`);
                            // eslint-disable-next-line no-unused-vars
                            const [_totalLink, word, lemma, strongs, morph] = regexMatchObject1;
                            originalLanguageVerseWordList.push(word);
                            originalLanguageVerseWordObjectList.push({ lemma, strongs, morph });
                        }
                        // wLinesVerseText += bookLine;
                    }
                }
            }
            // debugLog(`getOriginalWordLists: Got verse words: '${wLinesVerseText}'`);

            // debugLog(`  getOriginalWordLists(${bookID} ${C}:${V}) is returning (${verseWordList.length}) ${verseWordList} (${verseWordObjectList.length}) ${JSON.stringify(verseWordObjectList)}`);
            const wordLists = { originalLanguageRepoCode, originalLanguageVerseWordList, originalLanguageVerseWordObjectList };
            cacheSegment(wordLists, uniqueCacheID); // Don't bother (a)waiting
            return wordLists;
        }
        // end of getOriginalWordLists function


        /**
         *
         * @description Check USFM \zaln-s fields (only found in translations)
         * @param {string} zalnContents
         */
        async function checkZALNAttributes(zalnContents) {
            // functionLog(`checkWAttributes(${zalnContents})…`);
            // zaln fields are custom USFM fields with word/phrase alignment information
            //  i.e., they occur in aligned translations (not in the UHB or UGNT)
            // The parameter normally starts with a |
            dataAssert(repoCode !== 'UHB' && repoCode !== 'UGNT', `checkZALNAttributes did not expect an original language repo: '${repoCode}'`);
            let zalnSuggestion, regexMatchObject, attributeCounter = 0;
            const zalnAttributes = {};
            while ((regexMatchObject = ATTRIBUTE_REGEX.exec(zalnContents))) {
                attributeCounter += 1;
                // debugLog(`  Got attribute Regex in \\zaln-s: ${attributeCounter} '${JSON.stringify(regexMatchObject2)}`);
                const attributeName = regexMatchObject[1], attributeValue = regexMatchObject[2];
                zalnAttributes[attributeName] = attributeValue;
                if (attributeCounter === 1) {
                    if (attributeName !== 'x-strong')
                        addNoticePartial({ priority: 830, message: "Unexpected first \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                } else if (attributeCounter === 2) {
                    if (attributeName !== 'x-lemma')
                        addNoticePartial({ priority: 829, message: "Unexpected second \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                } else if (attributeCounter === 3) {
                    if (attributeName !== 'x-morph')
                        addNoticePartial({ priority: 828, message: "Unexpected third \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                } else if (attributeCounter === 4) {
                    if (attributeName !== 'x-occurrence')
                        addNoticePartial({ priority: 827, message: "Unexpected fourth \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                } else if (attributeCounter === 5) {
                    if (attributeName !== 'x-occurrences')
                        addNoticePartial({ priority: 826, message: "Unexpected fifth \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                } else if (attributeCounter === 6) {
                    if (attributeName !== 'x-content')
                        addNoticePartial({ priority: 825, message: "Unexpected sixth \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                } else if (attributeCounter === 7) {
                    if (attributeName !== 'x-ref') // For aligning of bridged verses
                        addNoticePartial({ priority: 819, message: "Unexpected seventh \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
                } else // #8 or more
                    addNoticePartial({ priority: 833, message: "Unexpected extra \\zaln-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject[0], location: lineLocation });
            }
            if (attributeCounter < 6)
                addNoticePartial({ priority: 834, message: "Seems too few translation \\zaln-s attributes", details: `expected 6-7 attributes but only found ${attributeCounter}`, lineNumber, C, V, excerpt: regexMatchObject1[0], location: lineLocation });
            // debugLog(`checkZALNAttributes has ${bookID} ${C}:${V} attributes: ${JSON.stringify(attributes)}`);

            // The Strongs, lemma and morph fields are copied from the original UHB/UGNT files
            //  into the translation USFM during alignment by tC
            //  so we need to check them as it’s possible for them to get out of sync
            if (checkingOptions?.disableAllLinkFetchingFlag !== true) {
                const { originalLanguageRepoCode, originalLanguageVerseWordList, originalLanguageVerseWordObjectList } = await getOriginalWordLists(bookID, C, V, checkingOptions);
                // if (V.indexOf('-') !== -1)
                //     debugLog(`checkZALNAttributes has '${originalLanguageRepoCode}' ${bookID} ${C}:${V} ${originalLanguageVerseWordList} ${JSON.stringify(originalLanguageVerseWordObjectList)}`);

                let oWord, oOccurrence, oOccurrences, oStrong, oLemma, oMorph, oRef, oC, oV;
                try { // Could fail here if any of those attributes were missing (already notified, so don’t worry here)
                    oWord = zalnAttributes['x-content'];
                    oOccurrence = zalnAttributes['x-occurrence']; oOccurrences = zalnAttributes['x-occurrences'];
                    oStrong = zalnAttributes['x-strong']; oLemma = zalnAttributes['x-lemma']; oMorph = zalnAttributes['x-morph'];
                    oRef = zalnAttributes['x-ref']; // usually undefined
                    if (oRef) {
                        if (oRef.indexOf(':') === -1)
                            addNoticePartial({ priority: 807, message: "Aligned x-ref should contain C:V", lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                        [oC, oV] = oRef.split(':');
                        if (oC !== C) // This theoretically is not a problem -- just that we haven't written the code for it here yet!
                            addNoticePartial({ priority: 795, message: "Aligned x-ref expected to be in the same chapter", details: `found x-ref="${oRef}" but C=${C}`, lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                    }
                    // debugLog(`checkZALNAttributes has ${bookID} ${C}:${V} '${oWord}' ${oOccurrence}/${oOccurrences} ${oStrong} '${oLemma}' ${oMorph} ${oRef}`);
                    const oOccurrenceInt = parseInt(oOccurrence), oOccurrencesInt = parseInt(oOccurrences);
                    // debugLog(`checkZALNAttributes has ${bookID} ${C}:${V} ${oOccurrenceInt}/${oOccurrencesInt}`);
                    if (oOccurrenceInt > oOccurrencesInt)
                        addNoticePartial({ priority: 801, message: "Aligned x-occurrence for original word is higher than Occurrences", details: `${oOccurrence} > ${oOccurrences}`, lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                    /* Now checked below
                    const oWordCount = countOccurrencesInList(verseWordList, oWord);
                    if (oWordCount < oOccurrenceInt)
                        addNoticePartial({ priority: 802, message: "AAA Aligned x-occurrence for original word is too high", details: `only found ${oWordCount} occurrences of '${oWord}' instead of ${oOccurrence}`, lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                    */

                    // Find the index of the correct occurrence of the word (index into the original language verse words list)
                    let originalLanguageWordIndex, gotCount = 0, wordTotalCount = 0;
                    let listV;
                    for (let ix = 0; ix < originalLanguageVerseWordList.length; ix++) {
                        const thisWord = originalLanguageVerseWordList[ix];
                        if (thisWord.startsWith('v='))
                            listV = thisWord.slice(2);
                        else if ((oV === undefined || listV === oV)
                            && thisWord === oWord) {
                            ++wordTotalCount;
                            if (originalLanguageWordIndex === undefined && ++gotCount === oOccurrenceInt)
                                originalLanguageWordIndex = ix;
                        }
                    }
                    // if (oV)
                    //     debugLog(`checkZALNAttributes has ${bookID} oRef='${oRef}' oC=${oC} oV=${oV} oWord='${oWord}' oOccurrence=${oOccurrence} gotCount=${gotCount} originalLanguageWordIndex=${originalLanguageWordIndex} oOccurrences=${oOccurrences} wordTotalCount=${wordTotalCount}`);
                    // First, check that the given number of occurrences really are there
                    if (wordTotalCount !== oOccurrencesInt)
                        addNoticePartial({ priority: 602, message: "Aligned word occurrences in original text is wrong", details: V.indexOf('-') === -1 || oRef ? `found ${wordTotalCount} occurrences of '${oWord}' instead of ${oOccurrences} from ${originalLanguageVerseWordList.join(', ')}` : "THIS TEXT NEEDS RE-ALIGNING", lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                    // Now, check that the given occurrence is correct
                    if (gotCount !== oOccurrenceInt) // Can’t do checks below coz ix is invalid
                        if (gotCount === 0)
                            addNoticePartial({ priority: 803, message: "Aligned word can’t be found in original text", details: `found NO occurrences of word '${oWord}' instead of ${oOccurrence} from ${originalLanguageVerseWordList.join(', ')}`, lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                        else
                            addNoticePartial({ priority: 802, message: "Aligned x-occurrence for original word is too high", details: `only found ${gotCount} occurrence${gotCount === 1 ? '' : 's'} of word '${oWord}' instead of ${oOccurrence} from ${originalLanguageVerseWordList.join(', ')}`, lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                    else {
                        const vwolStrongs = originalLanguageVerseWordObjectList[originalLanguageWordIndex]?.strongs;
                        if (vwolStrongs !== oStrong) {
                            addNoticePartial({ priority: 805, message: "Aligned x-strong number doesn’t match original", details: `${originalLanguageRepoCode} had ‘${vwolStrongs}’`, lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                            zalnSuggestion = zalnContents.replace(`"${oStrong}"`, `"${vwolStrongs}"`);
                        }
                        const vwolLemma = originalLanguageVerseWordObjectList[originalLanguageWordIndex]?.lemma;
                        if (vwolLemma !== oLemma) {
                            addNoticePartial({ priority: 806, message: "Aligned x-lemma doesn’t match original", details: `${originalLanguageRepoCode} had ‘${vwolLemma}’`, lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                            zalnSuggestion = zalnContents.replace(`"${oLemma}"`, `"${vwolLemma}"`);
                        }
                        const vwolMorph = originalLanguageVerseWordObjectList[originalLanguageWordIndex]?.morph;
                        if (vwolMorph !== oMorph) {
                            addNoticePartial({ priority: 804, message: "Aligned x-morph doesn’t match original", details: `${originalLanguageRepoCode} had ‘${vwolMorph}’`, lineNumber, C, V, excerpt: zalnContents, location: lineLocation });
                            zalnSuggestion = zalnContents.replace(`"${oMorph}"`, `"${vwolMorph}"`);
                        }
                    }
                } catch (e) {
                    debugLog(`checkZALNAttributes1: why couldn’t we get word attributes out of ${JSON.stringify(zalnAttributes)}: ${e.message}`);
                }
            }
            return zalnSuggestion;
        }
        // end of checkZALNAttributes function

        let suggestion, regexMatchObject1;
        while ((regexMatchObject1 = W_REGEX.exec(adjustedRest))) {
            // debugLog(`Got ${ repoCode } \\w Regex in ${ C }: ${ V } line: '${JSON.stringify(regexMatchObject1)}`);
            await checkWAttributes(regexMatchObject1[1]); // The only call of this function
        }
        let regexMatchObject2;
        while ((regexMatchObject1 = KS_REGEX.exec(adjustedRest))) {
            // debugLog(`Got ${repoCode} \\k-s Regex in ${C}:${V} line: '${JSON.stringify(regexMatchObject1)}`);
            dataAssert(repoCode === 'UHB' || repoCode === 'UGNT', `checkUSFMLineAttributes expected an original language repo not '${repoCode}'`);
            let attributeCounter = 0;
            while ((regexMatchObject2 = ATTRIBUTE_REGEX.exec(regexMatchObject1[1]))) {
                attributeCounter += 1;
                // debugLog(`  Got attribute Regex in \\k-s: ${attributeCounter} '${JSON.stringify(regexMatchObject2)}`);
                const attributeName = regexMatchObject2[1]; //, attributeValue = regexMatchObject2[2];
                if (attributeCounter === 1) {
                    if (attributeName !== 'x-tw')
                        addNoticePartial({ priority: 839, message: "Unexpected first \\k-s attribute", details: "expected 'x-tw'", lineNumber, C, V, excerpt: regexMatchObject2[0], location: lineLocation });
                } else // #2 or more
                    addNoticePartial({ priority: 838, message: "Unexpected extra \\k-s attribute", details, lineNumber, C, V, excerpt: regexMatchObject2[0], location: lineLocation });
            }
            if (attributeCounter < 1)
                addNoticePartial({ priority: 835, message: "Seems too few original \\k-s attributes", details: `expected one attribute but only found ${attributeCounter}`, lineNumber, C, V, excerpt: regexMatchObject1[0], location: lineLocation });
        }
        while ((regexMatchObject1 = ZALN_S_REGEX.exec(adjustedRest))) {
            // debugLog(`Got ${repoCode} \\zaln-s Regex in ${C}:${V} line: '${JSON.stringify(regexMatchObject1)}`);
            // The found string normally starts with a |
            const zalnSuggestion = await checkZALNAttributes(regexMatchObject1[1]); // The only call of this function
            if (zalnSuggestion) suggestion = rest.replace(regexMatchObject1[1], zalnSuggestion);
        }
        return suggestion;
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
                addNoticePartial({ priority: 822, message: "Expected field to contain an integer", characterIndex: 3, excerpt: `\\c ${rest}`, lineNumber, C, V, location: lineLocation });
            if (marker === 'v') {
                let Vstr = (rest) ? rest.split(' ', 1)[0] : '?';
                if (isNaN(Vstr) && Vstr.indexOf('-') < 0)
                    addNoticePartial({ priority: 822, message: "Expected field to contain an integer", characterIndex: 3, excerpt: `\\v ${rest}`, lineNumber, C, V, location: lineLocation });
            }
            else if (marker === 'h' || marker === 'toc1' || marker === 'toc2' || marker === 'toc3')
                if (rest.toLowerCase() === rest || rest.toUpperCase() === rest)
                    addNoticePartial({ priority: languageCode === 'en' || languageCode === 'fr' ? 490 : 190, message: "Expected header field to contain a mixed-case string", fieldName: `\\${marker}`, excerpt: rest, lineNumber, C, V, location: lineLocation });

            // Check matched pairs that should all be inside a single line
            if (['en', 'hbo', 'el-x-koine'].includes(languageCode))
                for (const punctSet of MATCHED_CHARACTER_FORMATTING_LINE_PAIRS_LIST) {
                    const opener = `\\${punctSet[0]} `, closer = `\\${punctSet[1]}`;
                    const lCount = countOccurrencesInString(rest, opener) + (marker === punctSet[0] ? 1 : 0);
                    const rCount = countOccurrencesInString(rest, closer);
                    if (lCount !== rCount)
                        addNoticePartial({ priority: 973, message: `Mismatched ${opener}${closer} fields`, details: `(opening=${lCount.toLocaleString()}, closing=${rCount.toLocaleString()})`, excerpt: rest, lineNumber, C, V, location: lineLocation });
                }

            if (rest) {
                checkUSFMLineText(lineNumber, C, V, marker, rest, lineLocation, checkingOptions);

                if (rest.indexOf('=') !== -1 || rest.indexOf('"') !== -1)
                    await checkUSFMLineAttributes(lineNumber, C, V, marker, rest, lineLocation, checkingOptions);

                const allowedLinks = (marker === 'w' || marker === 'k-s' || marker === 'f' || marker === 'SPECIAL')
                    // (because we don’t know what marker SPECIAL is, so default to "no false alarms")
                    && rest.indexOf('x-tw') !== -1;
                ourCheckTextField(lineNumber, C, V, 'USFM line', `\\${marker}`, rest, allowedLinks, lineLocation, checkingOptions);
            }
        }
        // end of checkUSFMLineInternals function


        // Main code for checkUSFMLineContents()
        if (ALLOWED_LINE_START_MARKERS_LIST.includes(marker) || marker === 'SPECIAL' || marker === 'NONE') {
            if (rest && MARKERS_WITHOUT_CONTENT_LIST.includes(marker))
                if (isWhitespace(rest))
                    addNoticePartial({ priority: 301, message: `Unexpected whitespace after \\${marker} marker`, C, V, lineNumber, characterIndex: marker.length, excerpt: rest, location: lineLocation });
                else if (rest !== 'ס' && rest !== 'פ') // in UHB NEH 3:20 or EZR 3:18
                    addNoticePartial({ priority: 401, message: `Unexpected content after \\${marker} marker`, C, V, lineNumber, characterIndex: marker.length, excerpt: rest, location: lineLocation });
                else if (MARKERS_WITH_COMPULSORY_CONTENT_LIST.includes(marker) && !rest)
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
        if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won’t be needed for TWs when we switch to TWLs)
        const coTNlResultObject = await checkNotesLinksToOutside(username, languageCode, repoCode, bookID, C, V, 'TWLink', twLinkText, location, { ...checkingOptions, defaultLanguageCode: adjustedLanguageCode });
        // debugLog(`coTNlResultObject=${JSON.stringify(coTNlResultObject)}`);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const coqNoticeEntry of coTNlResultObject.noticeList) {
            if (coqNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN2 check
                usfmResultObject.noticeList.push(coqNoticeEntry); // Just copy the complete notice as is
            else // For our direct checks, we add the repoCode as an extra value
                addNoticePartial({ ...coqNoticeEntry, lineNumber, C, V, fieldName: marker });
        }
        // The following is needed coz we might be checking the linked TA and/or TW articles
        if (coTNlResultObject.checkedFileCount && coTNlResultObject.checkedFileCount > 0)
            if (typeof usfmResultObject.checkedFileCount === 'number') usfmResultObject.checkedFileCount += coTNlResultObject.checkedFileCount;
            else usfmResultObject.checkedFileCount = coTNlResultObject.checkedFileCount;
        if (coTNlResultObject.checkedFilesizes && coTNlResultObject.checkedFilesizes > 0)
            if (typeof usfmResultObject.checkedFilesizes === 'number') usfmResultObject.checkedFilesizes += coTNlResultObject.checkedFilesizes;
            else usfmResultObject.checkedFilesizes = coTNlResultObject.checkedFilesizes;
        if (coTNlResultObject.checkedRepoNames && coTNlResultObject.checkedRepoNames.length > 0)
            for (const checkedRepoName of coTNlResultObject.checkedRepoNames)
                try { if (usfmResultObject.checkedRepoNames.indexOf(checkedRepoName) < 0) usfmResultObject.checkedRepoNames.push(checkedRepoName); }
                catch { usfmResultObject.checkedRepoNames = [checkedRepoName]; }
        if (coTNlResultObject.checkedFilenameExtensions && coTNlResultObject.checkedFilenameExtensions.length > 0)
            for (const checkedFilenameExtension of coTNlResultObject.checkedFilenameExtensions)
                try { if (usfmResultObject.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) usfmResultObject.checkedFilenameExtensions.push(checkedFilenameExtension); }
                catch { usfmResultObject.checkedFilenameExtensions = [checkedFilenameExtension]; }
        // if (result.checkedFilenameExtensions) debugLog("result", JSON.stringify(result));
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
        if (ourLocation?.length && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

        // const lowercaseBookID = bookID.toLowerCase();
        // eslint-disable-next-line no-unused-vars
        let numChaptersThisBook = 0;
        try {
            logicAssert(lowercaseBookID !== 'obs', "OBS shouldn't get as far as mainUSFMCheck");
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
                    const excerpt = USFMline.slice(0, excerptLength) + (USFMline.length > excerptLength ? '…' : '');
                    addNoticePartial({ priority: 603, message: "USFM marker doesn’t end with space", C, V, lineNumber, characterIndex, excerpt, location: ourLocation });
                    break;
                }
                foundMarker += char;
                if (char === '*') break;
            }
            return foundMarker;
        }

        let lines = givenText.split('\n');
        // debugLog(`  '${ourLocation}' has ${lines.length.toLocaleString()} total USFM lines`);

        if (lines.length === 0 || !lines[0].startsWith('\\id ') || lines[0].length < 7 || !books.isValidBookID(lines[0].slice(4, 7)))
            addNoticePartial({ priority: 994, message: "USFM file must start with a valid \\id line", lineNumber: 1, location: ourLocation });
        const haveUSFM3Line = lines.length > 1 && lines[1] === '\\usfm 3.0';
        const ideIndex = haveUSFM3Line ? 2 : 1;
        if (lines.length <= ideIndex || !lines[ideIndex].startsWith('\\ide ') || lines[ideIndex].length < 7)
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
            if ((characterIndex = line.indexOf('\r')) !== -1) {
                const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
                const excerpt = (iy > excerptHalfLength ? '…' : '') + line.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < line.length ? '…' : '')
                addNoticePartial({ priority: 703, C, V, message: "Unexpected CarriageReturn character", lineNumber: n, characterIndex, excerpt, location: ourLocation });
            }

            let marker, rest;
            if (line[0] === '\\') {
                marker = findStartMarker(C, V, n, line);
                rest = line.slice(marker.length + 2); // Skip backslash, marker, and space after marker
                // debugLog(`Line ${n}: marker='\\${marker}' rest='${rest}'`);
            } else { // Line didn’t start with a backslash
                // NOTE: Some unfoldingWord USFM Bibles commonly have this
                //          so it’s not necessarily either an error or a warning
                rest = line;
                if (validLineStartCharacters.indexOf(line[0]) === -1) { // These are the often expected characters
                    // Drop the priority if it’s a "half-likely" character
                    addNoticePartial({ priority: line[0] === ' ' || line[0] === '"' ? 180 : 880, C, V, message: "Expected line to start with backslash", lineNumber: n, characterIndex: 0, excerpt: line[0], location: ourLocation });
                    if (line[1] === '\\') { // Let’s drop the leading punctuation and try to check the rest of the line
                        marker = line.slice(2).split(' ', 1)[0];
                        rest = line.slice(marker.length + 2 + 1); // Skip leading character, backslash, marker, and space after marker
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
                    addNoticePartial({ priority: 724, C, V, message: "Unable to convert chapter number to integer", lineNumber: n, characterIndex: 3, excerpt: `${rest.slice(0, excerptHalfLength)}${rest.length > excerptHalfLength ? '…' : ''}`, location: ourLocation });
                    intC = -999; // Used to prevent consequential errors
                }
                if (C === lastC || (intC > 0 && intC !== lastIntC + 1))
                    addNoticePartial({ priority: 764, C, V, message: "Chapter number didn’t increment correctly", lineNumber: n, characterIndex: 3, excerpt: `${rest.slice(0, excerptHalfLength)}${rest.length > excerptHalfLength ? '…' : ''} (${lastC ? lastC : '0'} → ${C})`, location: ourLocation });
                lastC = C; lastV = '0';
                lastIntC = intC; lastIntV = 0;
            } else if (marker === 'v') {
                V = (rest) ? rest.split(' ', 1)[0] : '?';
                console.log(C, V);
                if (V.indexOf('-') < 0) { // no hyphen -> no verse bridge
                    try {
                        intV = ourParseInt(V);
                    } catch (usfmIVerror) {
                        addNoticePartial({ priority: 723, C, V, message: "Unable to convert verse number to integer", lineNumber: n, characterIndex: 3, excerpt: `${rest.slice(0, excerptHalfLength)}${rest.length > excerptHalfLength ? '…' : ''}`, location: ourLocation });
                        intV = -999; // Used to prevent consequential errors
                    }
                    if (V === lastV || (intV > 0 && intV !== lastIntV + 1))
                        addNoticePartial({ priority: 763, C, V, message: "Verse number didn’t increment correctly", lineNumber: n, characterIndex: 3, excerpt: `${rest.slice(0, excerptHalfLength)}${rest.length > excerptHalfLength ? '…' : ''} (${lastV ? lastV : '0'} → ${V})`, location: ourLocation });
                    lastV = V; lastIntV = intV;
                } else { // handle verse bridge
                    const bits = V.split('-');
                    const firstV = bits[0], secondV = bits[1];
                    let intFirstV, intSecondV;
                    try {
                        intFirstV = ourParseInt(firstV);
                        intSecondV = ourParseInt(secondV);
                    } catch (usfmV12error) {
                        addNoticePartial({ priority: 762, C, V, message: "Unable to convert verse bridge numbers to integers", lineNumber: n, characterIndex: 3, excerpt: `${rest.slice(0, Math.max(9, excerptLength))}${rest.length > excerptLength ? '…' : ''}`, location: ourLocation });
                        intFirstV = -999; intSecondV = -998; // Used to prevent consequential errors
                    }
                    if (intSecondV <= intFirstV)
                        addNoticePartial({ priority: 769, C, V, message: "Verse bridge numbers not in ascending order", lineNumber: n, characterIndex: 3, excerpt: `${rest.slice(0, Math.max(9, excerptLength))}${rest.length > excerptLength ? '…' : ''} (${firstV} → ${secondV})`, location: ourLocation });
                    else if (firstV === lastV || (intFirstV > 0 && intFirstV !== lastIntV + 1))
                        addNoticePartial({ priority: 766, C, V, message: "Bridged verse numbers didn’t increment correctly", lineNumber: n, characterIndex: 3, excerpt: `${rest.slice(0, Math.max(9, excerptLength))}${rest.length > excerptLength ? '…' : ''} (${lastV} → ${firstV})`, location: ourLocation });
                    lastV = secondV; lastIntV = intSecondV;
                }
            } else if ((vIndex = rest.indexOf('\\v ')) !== -1) {
                // verse number marker follows another marker on the same line, so it’s inside `rest`
                const restRest = rest.slice(vIndex + 3);
                // debugLog(`mainUSFMCheck at ${bookID} ${C}:${V} ${n} \\${marker} got restRest='${restRest}'`);
                try {
                    intV = parseInt(restRest); // Parses the first integer that it finds
                    // debugLog(`mainUSFMCheck  got intV=${intV}`);
                    V = intV.toString();
                } catch (usfmIIVerror) {
                    addNoticePartial({ priority: 720, C, V, message: "Unable to convert internal verse number to integer", lineNumber: n, characterIndex: 3, excerpt: `${restRest.slice(0, excerptHalfLength)}${restRest.length > excerptHalfLength ? '…' : ''}`, location: ourLocation });
                    intV = -999; // Used to prevent consequential errors
                }
                if (intV > 0 && intV !== lastIntV + 1)
                    addNoticePartial({ priority: 761, C, V, message: "Verse number didn’t increment correctly", lineNumber: n, characterIndex: 3, excerpt: `${restRest.slice(0, excerptHalfLength)}${restRest.length > excerptHalfLength ? '…' : ''} (${lastV ? lastV : '0'} → ${V})`, location: ourLocation });
                lastV = intV.toString(); lastIntV = intV;
            }

            if (marker === 'id' && !rest.startsWith(bookID)) {
                const thisLength = Math.max(4, excerptLength);
                const excerpt = `${rest.slice(0, thisLength)}${rest.length > thisLength ? '…' : ''}`;
                addNoticePartial({ priority: 987, C, V, message: "Expected USFM \\id line to start with book identifier", details: `expected bookID='${bookID}'`, lineNumber: n, characterIndex: 4, excerpt, location: ourLocation });
            }

            // Check the order of markers
            // In headers
            if (marker === 'toc2' && lastMarker !== 'toc1')
                addNoticePartial({ priority: 87, C, V, message: "Expected USFM \\toc2 line to follow \\toc1", lineNumber: n, characterIndex: 1, details: `not '\\${lastMarker}’`, location: ourLocation });
            else if (marker === 'toc3' && lastMarker !== 'toc2')
                addNoticePartial({ priority: 87, C, V, message: "Expected USFM \\toc3 line to follow \\toc2", lineNumber: n, characterIndex: 1, details: `not '\\${lastMarker}’`, location: ourLocation });
            // In chapters
            else if ((PARAGRAPH_MARKERS_LIST.includes(marker) || marker === 's5' || marker === 'ts\\*')
                && PARAGRAPH_MARKERS_LIST.includes(lastMarker)
                && !lastRest)
                addNoticePartial({ priority: 399, C, V, message: "Useless USFM paragraph marker", lineNumber: n, characterIndex: 1, details: `'\\${lastMarker}' before '\\${marker}’`, location: ourLocation });
            else if (['c', 'ca', 'cl'].includes(lastMarker) && marker === 'v'
                && (rest === '1' || rest.startsWith('1 ')))
                addNoticePartial({ priority: C === '1' ? 657 : 457, C, V, message: "Paragraph marker expected before first verse", lineNumber: n, characterIndex: 1, details: `'\\${marker}' after '\\${lastMarker}’`, location: ourLocation });
            else if (TEXT_MARKERS_WITHOUT_CONTENT_LIST.includes(lastMarker) && ['w', 'v', 'zaln-s', 'k-s'].includes(marker))
                addNoticePartial({ priority: 899, C, V, message: "Have USFM text not in a paragraph", lineNumber: n, characterIndex: 1, details: `'\\${lastMarker}' before '\\${marker}’`, location: ourLocation });

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
        usfmResultObject.noticeList = removeDisabledNotices(usfmResultObject.noticeList);
    }

    // debugLog(`  checkUSFMText returning with ${result.successList.length.toLocaleString()} success(es) and ${result.noticeList.length.toLocaleString()} notice(s).`);
    // functionLog(`checkUSFMText result is ${JSON.stringify(result)}`);
    return usfmResultObject;
}
// end of checkUSFMText function
