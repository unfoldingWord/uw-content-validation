import { DEFAULT_EXTRACT_LENGTH } from './text-handling-functions'
import yaml from 'yaml';
import { checkTextField } from './field-text-check';
import { checkTextfileContents } from './file-text-check';
import { removeDisabledNotices } from './disabled-notices';
import { parameterAssert } from './utilities';


const YAML_VALIDATOR_VERSION_STRING = '0.4.2';


export function checkYAMLText(languageCode, textName, YAMLText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a noticeList,
        as well as the parsed YAML for further checking.

     */
    // debugLog(`checkYAMLText(${textName}, ${YAMLText.length}, ${givenLocation})…`);
    parameterAssert(languageCode !== undefined, "checkYAMLText: 'languageCode' parameter should be defined");
    parameterAssert(typeof languageCode === 'string', `checkYAMLText: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    parameterAssert(textName !== undefined, "checkYAMLText: 'textName' parameter should be defined");
    parameterAssert(typeof textName === 'string', `checkYAMLText: 'textName' parameter should be a string not a '${typeof textName}': ${textName}`);
    parameterAssert(YAMLText !== undefined, "checkYAMLText: 'YAMLText' parameter should be defined");
    parameterAssert(typeof YAMLText === 'string', `checkYAMLText: 'YAMLText' parameter should be a string not a '${typeof YAMLText}': ${YAMLText}`);
    parameterAssert(givenLocation !== undefined, "checkYAMLText: 'optionalFieldLocation' parameter should be defined");
    parameterAssert(typeof givenLocation === 'string', `checkYAMLText: 'optionalFieldLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
    parameterAssert(givenLocation.indexOf('true') === -1, `checkYAMLText: 'optionalFieldLocation' parameter should not be '${givenLocation}'`);
    parameterAssert(checkingOptions !== undefined, "checkYAMLText: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined)
        parameterAssert(typeof checkingOptions === 'object', `checkYAMLText: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let extractLength;
    try {
        extractLength = checkingOptions?.extractLength;
    } catch (ytcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // debugLog(`Using default extractLength=${extractLength}`);
    }
    // else
    // debugLog(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength+1) / 2); // rounded up
    // debugLog(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const cytResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // debugLog(`checkYAMLText success: ${successString}`);
        cytResult.successList.push(successString);
    }
    function addNotice(noticeObject) {
        // debugLog(`checkYAMLText Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        parameterAssert(noticeObject.priority !== undefined, "cYt addNotice: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `cManT addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        parameterAssert(noticeObject.message !== undefined, "cYt addNotice: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `cManT addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // parameterAssert(characterIndex!==undefined, "cYt addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cManT addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // parameterAssert(extract!==undefined, "cYt addNotice: 'extract' parameter should be defined");
        if (noticeObject.extract) parameterAssert(typeof noticeObject.extract === 'string', `cManT addNotice: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        parameterAssert(noticeObject.location !== undefined, "cYt addNotice: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `cYt addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        if (noticeObject.debugChain) noticeObject.debugChain = `checkYAMLText ${noticeObject.debugChain}`;
        cytResult.noticeList.push(noticeObject);
    }

    function ourCheckTextField(lineNumber, fieldText, allowedLinks, optionalFieldLocation, checkingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {String} fieldName - name of the field being checked
        * @param {String} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {String} optionalFieldLocation - description of where the field is located
        * @param {Object} checkingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // debugLog(`cYt ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        parameterAssert(fieldText !== undefined, "cYt ourCheckTextField: 'fieldText' parameter should be defined");
        parameterAssert(typeof fieldText === 'string', `cYt ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        parameterAssert(allowedLinks === true || allowedLinks === false, "cYt ourCheckTextField: allowedLinks parameter must be either true or false");
        parameterAssert(optionalFieldLocation !== undefined, "cYt ourCheckTextField: 'optionalFieldLocation' parameter should be defined");
        parameterAssert(typeof optionalFieldLocation === 'string', `cYt ourCheckTextField: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

        const resultObject = checkTextField('YAML', '', fieldText, allowedLinks, optionalFieldLocation, checkingOptions);

        // Concat is faster if we don’t need to process each notice individually
        // cytResult.noticeList = cytResult.noticeList.concat(resultObject.noticeList);
        // // Process noticeList line by line
        // //  suppressing undesired errors
        for (const noticeEntry of resultObject.noticeList)
            addNotice({ ...noticeEntry, lineNumber });
    }
    // end of ourCheckTextField function

    function checkYAMLLineContents(lineNumber, lineText, lineLocation) {

        // debugLog(`checkYAMLLineContents for '${lineNumber} ${lineText}' at${lineLocation}`);
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
        parameterAssert(filename !== undefined, "cYT ourBasicFileChecks: 'filename' parameter should be defined");
        parameterAssert(typeof filename === 'string', `cYT ourBasicFileChecks: 'filename' parameter should be a string not a '${typeof filename}'`);
        parameterAssert(fileText !== undefined, "cYT ourBasicFileChecks: 'fileText' parameter should be defined");
        parameterAssert(typeof fileText === 'string', `cYT ourBasicFileChecks: 'fileText' parameter should be a string not a '${typeof fileText}'`);
        parameterAssert(checkingOptions !== undefined, "cYT ourBasicFileChecks: 'checkingOptions' parameter should be defined");

        const resultObject = checkTextfileContents(languageCode, 'YAML', filename, fileText, fileLocation, checkingOptions);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList) {
            parameterAssert(Object.keys(noticeEntry).length >= 5, `USFM ourBasicFileChecks notice length=${Object.keys(noticeEntry).length}`);
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
        // debugLog(`checkYAMLText: calling removeDisabledNotices(${cytResult.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        cytResult.noticeList = removeDisabledNotices(cytResult.noticeList);
    }

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (cytResult.noticeList)
        addSuccessMessage(`checkYAMLText v${YAML_VALIDATOR_VERSION_STRING} finished with ${cytResult.noticeList.length ? cytResult.noticeList.length.toLocaleString() : "zero"} notice${cytResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkYAMLText v${YAML_VALIDATOR_VERSION_STRING}`)
    // debugLog(`  checkYAMLText returning with ${cytResult.successList.length.toLocaleString()} success(es), ${cytResult.noticeList.length.toLocaleString()} notice(s).`);
    // debugLog("checkYAMLText result is", JSON.stringify(result));
    return cytResult;
}
// end of checkYAMLText function
