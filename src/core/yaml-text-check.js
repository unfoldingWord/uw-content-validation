import yaml from 'yaml';
// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { checkTextField } from './field-text-check';
import { checkTextfileContents } from './file-text-check';
import { removeDisabledNotices } from './disabled-notices';
// eslint-disable-next-line no-unused-vars
import { parameterAssert } from './utilities';


const YAML_VALIDATOR_VERSION_STRING = '0.4.3';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode -- e.g., 'TN' or 'TQ2', etc.
 * @param {string} textName
 * @param {string} YAMLText
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export function checkYAMLText(languageCode, repoCode, textName, YAMLText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a noticeList,
        as well as the parsed YAML for further checking.

     */
    // functionLog(`checkYAMLText(${textName}, ${YAMLText.length}, ${givenLocation})…`);
    //parameterAssert(languageCode !== undefined, "checkYAMLText: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkYAMLText: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    //parameterAssert(repoCode !== undefined, "checkYAMLText: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkYAMLText: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkYAMLText: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(textName !== undefined, "checkYAMLText: 'textName' parameter should be defined");
    //parameterAssert(typeof textName === 'string', `checkYAMLText: 'textName' parameter should be a string not a '${typeof textName}': ${textName}`);
    //parameterAssert(YAMLText !== undefined, "checkYAMLText: 'YAMLText' parameter should be defined");
    //parameterAssert(typeof YAMLText === 'string', `checkYAMLText: 'YAMLText' parameter should be a string not a '${typeof YAMLText}': ${YAMLText}`);
    //parameterAssert(givenLocation !== undefined, "checkYAMLText: 'optionalFieldLocation' parameter should be defined");
    //parameterAssert(typeof givenLocation === 'string', `checkYAMLText: 'optionalFieldLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
    //parameterAssert(givenLocation.indexOf('true') === -1, `checkYAMLText: 'optionalFieldLocation' parameter should not be '${givenLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "checkYAMLText: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined) { //parameterAssert(typeof checkingOptions === 'object', `checkYAMLText: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (ytcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    // const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    // const excerptHalfLengthPlus = Math.floor((excerptLength+1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    const cytResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // functionLog(`checkYAMLText success: ${successString}`);
        cytResult.successList.push(successString);
    }
    function addNotice(noticeObject) {
        // functionLog(`checkYAMLText Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(noticeObject.priority !== undefined, "cYt addNotice: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `cManT addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "cYt addNotice: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `cManT addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex!==undefined, "cYt addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cManT addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt!==undefined, "cYt addNotice: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cManT addNotice: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "cYt addNotice: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `cYt addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        if (noticeObject.debugChain) noticeObject.debugChain = `checkYAMLText ${noticeObject.debugChain}`;
        cytResult.noticeList.push(noticeObject);
    }

    function ourCheckTextField(lineNumber, fieldText, allowedLinks, optionalFieldLocation, checkingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {string} fieldName - name of the field being checked
        * @param {string} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {string} optionalFieldLocation - description of where the field is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`cYt ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        //parameterAssert(fieldText !== undefined, "cYt ourCheckTextField: 'fieldText' parameter should be defined");
        //parameterAssert(typeof fieldText === 'string', `cYt ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        //parameterAssert(allowedLinks === true || allowedLinks === false, "cYt ourCheckTextField: allowedLinks parameter must be either true or false");
        //parameterAssert(optionalFieldLocation !== undefined, "cYt ourCheckTextField: 'optionalFieldLocation' parameter should be defined");
        //parameterAssert(typeof optionalFieldLocation === 'string', `cYt ourCheckTextField: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

        const resultObject = checkTextField(languageCode, repoCode, 'YAML', '', fieldText, allowedLinks, optionalFieldLocation, checkingOptions);

        // Concat is faster if we don’t need to process each notice individually
        // cytResult.noticeList = cytResult.noticeList.concat(resultObject.noticeList);
        // // Process noticeList line by line
        // //  suppressing undesired errors
        for (const noticeEntry of resultObject.noticeList)
            addNotice({ ...noticeEntry, lineNumber });
    }
    // end of ourCheckTextField function

    function checkYAMLLineContents(lineNumber, lineText, lineLocation) {

        // functionLog(`checkYAMLLineContents for '${lineNumber} ${lineText}' at${lineLocation}`);
        let thisText = lineText

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g, '')
        // debugLog(`After removing leading spaces have '${thisText}'`);

        // Remove leading hyphens
        thisText = thisText.replace(/^-/g, '')
        // debugLog(`After removing hyphens have '${thisText}'`);

        // Remove leading spaces again now
        thisText = thisText.replace(/^ +/g, '')
        // debugLog(`After removing more leading spaces have '${thisText}'`);

        const allowedLinksInLine = thisText.startsWith('url:') || thisText.startsWith('chapter_url:') || thisText.startsWith('rc:');
        if (thisText)
            ourCheckTextField(lineNumber, thisText, allowedLinksInLine, lineLocation, checkingOptions);
    }
    // end of checkYAMLLine function


    function ourBasicFileChecks(filename, fileText, fileLocation, checkingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        //parameterAssert(filename !== undefined, "cYT ourBasicFileChecks: 'filename' parameter should be defined");
        //parameterAssert(typeof filename === 'string', `cYT ourBasicFileChecks: 'filename' parameter should be a string not a '${typeof filename}'`);
        //parameterAssert(fileText !== undefined, "cYT ourBasicFileChecks: 'fileText' parameter should be defined");
        //parameterAssert(typeof fileText === 'string', `cYT ourBasicFileChecks: 'fileText' parameter should be a string not a '${typeof fileText}'`);
        //parameterAssert(checkingOptions !== undefined, "cYT ourBasicFileChecks: 'checkingOptions' parameter should be defined");

        const resultObject = checkTextfileContents(languageCode, repoCode, 'YAML', filename, fileText, fileLocation, checkingOptions);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList) {
            //parameterAssert(Object.keys(noticeEntry).length >= 5, `USFM ourBasicFileChecks notice length=${Object.keys(noticeEntry).length}`);
            addNotice(noticeEntry);
        }
    }
    // end of ourBasicFileChecks function


    // Main code for checkYAMLText function
    const lines = YAMLText.split('\n');
    // debugLog(`  '${location}' has ${lines.length.toLocaleString()} total lines`);
    let formData;
    try {
        formData = yaml.parse(YAMLText);
        // debugLog("yaml.parse(YAMLText) got formData", JSON.stringify(formData));
    }
    catch (yamlError) {
        // console.error(`yaml parse error: ${yamlError.message}`);
        addNotice({ priority: 920, message: yamlError.message, location: ourLocation })
    }
    // Add the parsed YAML to our result
    cytResult.formData = formData;

    // let lastNumLeadingSpaces = 0;
    // let lastLineContents;
    for (let n = 1; n <= lines.length; n++) {

        const line = lines[n - 1];
        // let numLeadingSpaces;
        // if (line) {
        //     numLeadingSpaces = line.match(/^ */)[0].length;
        // debugLog(`Got numLeadingSpaces=${numLeadingSpaces} for ${line}${atString}`);
        //     if (numLeadingSpaces && lastNumLeadingSpaces && numLeadingSpaces!=lastNumLeadingSpaces)
        //         addNotice({472, "Nesting seems confused", 0, '', atString);

        checkYAMLLineContents(n, line, ourLocation);
        // } else {
        //     // This is a blank line
        //     numLeadingSpaces = 0;
        // }

        // lastLineContents = line;
        // lastNumLeadingSpaces = numLeadingSpaces;
    }

    // Do basic file checks
    ourBasicFileChecks(textName, YAMLText, givenLocation, checkingOptions);

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // functionLog(`checkYAMLText: calling removeDisabledNotices(${cytResult.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        cytResult.noticeList = removeDisabledNotices(cytResult.noticeList);
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (cytResult.noticeList.length)
        addSuccessMessage(`checkYAMLText v${YAML_VALIDATOR_VERSION_STRING} finished with ${cytResult.noticeList.length ? cytResult.noticeList.length.toLocaleString() : "zero"} notice${cytResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkYAMLText v${YAML_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkYAMLText returning with ${cytResult.successList.length.toLocaleString()} success(es), ${cytResult.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkYAMLText result is", JSON.stringify(result));
    return cytResult;
}
// end of checkYAMLText function
