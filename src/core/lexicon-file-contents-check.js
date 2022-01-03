// import { DEFAULT_EXCERPT_LENGTH } from './defaults'
import { checkMarkdownFileContents } from './markdown-file-contents-check';
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, parameterAssert, aboutToOverwrite } from './utilities';


const LEXICON_MARKDOWN_FILE_VALIDATOR_VERSION_STRING = '0.2.0';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode -- e.g., 'UHAL', or 'UGL', etc.
 * @param {string} lexiconFilename -- used for identification
 * @param {string} lexiconMarkdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkLexiconFileContents(username, languageCode, repoCode, lexiconFilename, lexiconMarkdownText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire markdown file, i.e., all lines.

     Returns a result object containing a successList and a noticeList
     */
    // functionLog(`checkLexiconFileContents(lC=${languageCode}, rC=${repoCode}, fn=${lexiconFilename}, ${lexiconMarkdownText.length}, ${givenLocation})…`);
    //parameterAssert(languageCode !== undefined, "checkLexiconFileContents: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkLexiconFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    //parameterAssert(repoCode === 'UHAL' || repoCode === 'UGL', `checkLexiconFileContents: 'repoCode' parameter should be 'UHAL' or 'UGL', not '${repoCode}'`);
    //parameterAssert(lexiconFilename !== undefined, "checkLexiconFileContents: 'lexiconFilename' parameter should be defined");
    //parameterAssert(typeof lexiconFilename === 'string', `checkLexiconFileContents: 'lexiconFilename' parameter should be a string not a '${typeof lexiconFilename}': ${lexiconFilename}`);
    //parameterAssert(lexiconMarkdownText !== undefined, "checkLexiconFileContents: 'lexiconMarkdownText' parameter should be defined");
    //parameterAssert(typeof lexiconMarkdownText === 'string', `checkLexiconFileContents: 'lexiconMarkdownText' parameter should be a string not a '${typeof lexiconMarkdownText}': ${lexiconMarkdownText}`);
    //parameterAssert(givenLocation !== undefined, "checkLexiconFileContents: 'givenLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkLexiconFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
    //parameterAssert(givenLocation.indexOf('true') === -1, `checkLexiconFileContents: 'givenLocation' parameter should not be '${givenLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "checkLexiconFileContents: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined) {
        //parameterAssert(typeof checkingOptions === 'object', `checkLexiconFileContents: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let ourLocation = givenLocation;
    if (ourLocation?.length && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    // let excerptLength;
    // try {
    //     excerptLength = checkingOptions?.excerptLength;
    // } catch (mdtcError) { }
    // if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
    //     excerptLength = DEFAULT_EXCERPT_LENGTH;
    //     // debugLog("Using default excerptLength=" + excerptLength);
    // }
    // else
    // debugLog("Using supplied excerptLength=" + excerptLength, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    // const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    // const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog("Using excerptHalfLength=" + excerptHalfLength, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const lexiconResultObject = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // debugLog("checkLexiconFileContents success: " + successString);
        lexiconResultObject.successList.push(successString);
    }
    function addNoticePartial(incompleteNoticeObject) {
        // functionLog(`checkLexiconFileContents addNoticePartial: (priority=${incompleteNoticeObject.priority}) ${incompleteNoticeObject.message}${incompleteNoticeObject.characterIndex > 0 ? ` (at character ${incompleteNoticeObject.characterIndex})` : ""}${incompleteNoticeObject.excerpt ? " " + incompleteNoticeObject.excerpt : ""}${incompleteNoticeObject.location}`);
        //parameterAssert(incompleteNoticeObject.priority !== undefined, "checkLexiconFileContents addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `checkLexiconFileContents addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}': ${incompleteNoticeObject.priority}`);
        //parameterAssert(incompleteNoticeObject.message !== undefined, "checkLexiconFileContents addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.message === 'string', `checkLexiconFileContents addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}': ${incompleteNoticeObject.message}`);
        // parameterAssert(characterIndex !== undefined, "checkLexiconFileContents addNoticePartial: 'characterIndex' parameter should be defined");
        if (incompleteNoticeObject.characterIndex) {
            //parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `checkLexiconFileContents addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}': ${incompleteNoticeObject.characterIndex}`);
        }
        // parameterAssert(excerpt !== undefined, "checkLexiconFileContents addNoticePartial: 'excerpt' parameter should be defined");
        if (incompleteNoticeObject.excerpt) {
            //parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `checkLexiconFileContents addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}': ${incompleteNoticeObject.excerpt}`);
        }
        //parameterAssert(incompleteNoticeObject.location !== undefined, "checkLexiconFileContents addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof incompleteNoticeObject.location === 'string', `checkLexiconFileContents addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}': ${incompleteNoticeObject.location}`);

        if (incompleteNoticeObject.debugChain) incompleteNoticeObject.debugChain = `checkLexiconFileContents ${incompleteNoticeObject.debugChain}`; // Prepend our name
        aboutToOverwrite('checkLexiconFileContents', ['filename'], incompleteNoticeObject, { filename: lexiconFilename });
        lexiconResultObject.noticeList.push({ ...incompleteNoticeObject, filename: lexiconFilename });
    }
    // end of addNoticePartial function

    /**
    * @description - checks the given text field and processes the returned results
    * @param {string} lexiconMarkdownText - the actual text of the file being checked
    * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
    * @param {string} optionalFieldLocation - description of where the field is located
    * @param {Object} checkingOptions - parameters that might affect the check
    */
    async function ourCheckMarkdownFileContents(lexiconMarkdownText, optionalFieldLocation, checkingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`checkLexiconFileContents ourCheckMarkdownFileContents(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${optionalFieldLocation}, …)`);
        //parameterAssert(lexiconMarkdownText !== undefined, "cMdFC ourCheckMarkdownFileContents: 'lexiconMarkdownText' parameter should be defined");
        //parameterAssert(typeof lexiconMarkdownText === 'string', `cMdFC ourCheckMarkdownFileContents: 'lexiconMarkdownText' parameter should be a string not a '${typeof lexiconMarkdownText}'`);
        //parameterAssert(optionalFieldLocation !== undefined, "cMdFC ourCheckMarkdownFileContents: 'optionalFieldLocation' parameter should be defined");
        //parameterAssert(typeof optionalFieldLocation === 'string', `cMdFC ourCheckMarkdownFileContents: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

        const cmtResultObject = await checkMarkdownFileContents(username, languageCode, repoCode, lexiconFilename, lexiconMarkdownText, optionalFieldLocation, checkingOptions);
        // debugLog(`cmtResultObject=${JSON.stringify(cmtResultObject)}`);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of cmtResultObject.noticeList)
            addNoticePartial(noticeEntry);
    }
    // end of ourCheckMarkdownFileContents function


    // Main code for checkLexiconFileContents function
    const lines = lexiconMarkdownText.split('\n');
    // debugLog(`  '${location}' has ${lines.length.toLocaleString()} total lines`);

    // Create the hierarchy of the headings
    let hierarchy = [], currentLevel;
    for (const line of lines) {
        if (line.startsWith('## ')) {
            currentLevel = line.slice(3);
            hierarchy.push({ level: currentLevel, sublevels: [] });
        }
        if (currentLevel && line.startsWith('* ')) {
            let adjustedLine = line.slice(2);
            const colonIndex = adjustedLine.indexOf(':');
            if (colonIndex !== -1) adjustedLine = adjustedLine.slice(0, colonIndex); // we don’t want the actual data
            hierarchy[hierarchy.length - 1].sublevels.push(adjustedLine);
        }
    }
    // debugLog(`checkLexiconFileContents hierarchy=${JSON.stringify(hierarchy)}`);

    let compulsoryFields = ['## Word data', '## Etymology', '## Senses'];
    if (repoCode === 'UHAL') {
    } else if (repoCode === 'UGL') {
    }

    // This next part is common for UHAL and UGL
    if (!lines[0].startsWith('# ') || lines[0].length < 4)
        addNoticePartial({ priority: 630, message: `Expected lexicon lemma on first line`, except: lines[0], location: ourLocation });
    if (!lines[2].startsWith('<!-- Status: '))
        addNoticePartial({ priority: 330, message: `Expected lexicon entry status on third line`, except: lines[2], location: ourLocation });

    for (const compulsoryField of compulsoryFields)
        if (!lines.find((field) => { return field.startsWith(compulsoryField) }))
            addNoticePartial({ priority: 620, message: `Expected lexicon lemma on first line`, except: lines[0], location: ourLocation });

    // Now do the standard markdown checks
    await ourCheckMarkdownFileContents(lexiconMarkdownText, givenLocation, checkingOptions);

    addSuccessMessage(`Checked lexicon file: ${lexiconFilename}`);
    if (lexiconResultObject.noticeList.length)
        addSuccessMessage(`checkLexiconFileContents v${LEXICON_MARKDOWN_FILE_VALIDATOR_VERSION_STRING} finished with ${lexiconResultObject.noticeList.length ? lexiconResultObject.noticeList.length.toLocaleString() : "zero"} notice${lexiconResultObject.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkLexiconFileContents v${LEXICON_MARKDOWN_FILE_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkLexiconFileContents returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // userLog(`checkLexiconFileContents result is ${JSON.stringify(result)}`);
    return lexiconResultObject;
}
// end of checkLexiconFileContents function
