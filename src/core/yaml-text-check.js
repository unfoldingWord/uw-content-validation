import { DEFAULT_EXTRACT_LENGTH } from './text-handling-functions'
import yaml from 'yaml';
import { checkTextField } from './field-text-check';
import { checkTextfileContents } from './file-text-check';

const YAML_VALIDATOR_VERSION_STRING = '0.4.0';


export function checkYAMLText(languageCode, textName, YAMLText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a noticeList,
        as well as the parsed YAML for further checking.

     */
    // console.log(`checkYAMLText(${textName}, ${YAMLText.length}, ${givenLocation})…`);
    console.assert(languageCode !== undefined, "checkYAMLText: 'languageCode' parameter should be defined");
    console.assert(typeof languageCode === 'string', `checkYAMLText: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    console.assert(textName !== undefined, "checkYAMLText: 'textName' parameter should be defined");
    console.assert(typeof textName === 'string', `checkYAMLText: 'textName' parameter should be a string not a '${typeof textName}': ${textName}`);
    console.assert(YAMLText !== undefined, "checkYAMLText: 'YAMLText' parameter should be defined");
    console.assert(typeof YAMLText === 'string', `checkYAMLText: 'YAMLText' parameter should be a string not a '${typeof YAMLText}': ${YAMLText}`);
    console.assert(givenLocation !== undefined, "checkYAMLText: 'optionalFieldLocation' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkYAMLText: 'optionalFieldLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
    console.assert(givenLocation.indexOf('true') === -1, `checkYAMLText: 'optionalFieldLocation' parameter should not be '${givenLocation}'`);
    if (optionalCheckingOptions !== undefined)
        console.assert(typeof optionalCheckingOptions === 'object', `checkYAMLText: 'optionalCheckingOptions' parameter should be an object not a '${typeof optionalCheckingOptions}': ${JSON.stringify(optionalCheckingOptions)}`);

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (textName) ourLocation = ` in ${textName}${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions.extractLength;
    } catch (ytcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
    // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength+1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    const cytResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkYAMLText success: ${successString}`);
        cytResult.successList.push(successString);
    }
    function addNotice(noticeObject) {
        // console.log(`checkYAMLText Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "cYt addNotice: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cManT addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "cYt addNotice: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cManT addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(characterIndex!==undefined, "cYt addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cManT addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract!==undefined, "cYt addNotice: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cManT addNotice: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "cYt addNotice: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cYt addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        if (noticeObject.debugChain) noticeObject.debugChain = `checkYAMLText ${noticeObject.debugChain}`;
        cytResult.noticeList.push(noticeObject);
    }

    function ourCheckTextField(lineNumber, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
        /**
        * @description - checks the given text field and processes the returned results
        * @param {String} fieldName - name of the field being checked
        * @param {String} fieldText - the actual text of the field being checked
        * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
        * @param {String} optionalFieldLocation - description of where the field is located
        * @param {Object} optionalCheckingOptions - parameters that might affect the check
        */
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        // console.log(`cYt ourCheckTextField(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${fieldLocation}, …)`);
        console.assert(fieldText !== undefined, "cYt ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cYt ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cYt ourCheckTextField: allowedLinks parameter must be either true or false");
        console.assert(optionalFieldLocation !== undefined, "cYt ourCheckTextField: 'optionalFieldLocation' parameter should be defined");
        console.assert(typeof optionalFieldLocation === 'string', `cYt ourCheckTextField: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

        const resultObject = checkTextField('YAML', '', fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // Concat is faster if we don't need to process each notice individually
        // cytResult.noticeList = cytResult.noticeList.concat(resultObject.noticeList);
        // // Process noticeList line by line
        // //  suppressing undesired errors
        for (const noticeEntry of resultObject.noticeList)
            addNotice({ ...noticeEntry, lineNumber });
    }
    // end of ourCheckTextField function

    function checkYAMLLineContents(lineNumber, lineText, lineLocation) {

        // console.log(`checkYAMLLineContents for '${lineNumber} ${lineText}' at${lineLocation}`);
        let thisText = lineText

        // Remove leading spaces
        thisText = thisText.replace(/^ +/g, '')
        // console.log(`After removing leading spaces have '${thisText}'`);

        // Remove leading hyphens
        thisText = thisText.replace(/^-/g, '')
        // console.log(`After removing hyphens have '${thisText}'`);

        // Remove leading spaces again now
        thisText = thisText.replace(/^ +/g, '')
        // console.log(`After removing more leading spaces have '${thisText}'`);

        const allowedLinksInLine = thisText.startsWith('url:') || thisText.startsWith('chapter_url:');
        if (thisText)
            ourCheckTextField(lineNumber, thisText, allowedLinksInLine, lineLocation, optionalCheckingOptions);
    }
    // end of checkYAMLLine function


    function ourBasicFileChecks(filename, fileText, fileLocation, optionalCheckingOptions) {
        // Does basic checks for small errors like leading/trailing spaces, etc.

        // We assume that checking for compulsory fields is done elsewhere

        // Updates the global list of notices
        console.assert(filename !== undefined, "cYT ourBasicFileChecks: 'filename' parameter should be defined");
        console.assert(typeof filename === 'string', `cYT ourBasicFileChecks: 'filename' parameter should be a string not a '${typeof filename}'`);
        console.assert(fileText !== undefined, "cYT ourBasicFileChecks: 'fileText' parameter should be defined");
        console.assert(typeof fileText === 'string', `cYT ourBasicFileChecks: 'fileText' parameter should be a string not a '${typeof fileText}'`);

        const resultObject = checkTextfileContents(languageCode, 'YAML', filename, fileText, fileLocation, optionalCheckingOptions);

        // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
        //  process results line by line
        for (const noticeEntry of resultObject.noticeList) {
            console.assert(Object.keys(noticeEntry).length >= 5, `USFM ourBasicFileChecks notice length=${Object.keys(noticeEntry).length}`);
            addNotice(noticeEntry);
        }
    }
    // end of ourBasicFileChecks function


    // Main code for checkYAMLText function
    const lines = YAMLText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines`);
    let formData;
    try {
        formData = yaml.parse(YAMLText);
        // console.log("yaml.parse(YAMLText) got formData", JSON.stringify(formData));
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
        // console.log(`Got numLeadingSpaces=${numLeadingSpaces} for ${line}${atString}`);
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
    ourBasicFileChecks(textName, YAMLText, givenLocation, optionalCheckingOptions);

    addSuccessMessage(`Checked all ${lines.length.toLocaleString()} line${lines.length === 1 ? '' : 's'}${ourLocation}.`);
    if (cytResult.noticeList)
        addSuccessMessage(`checkYAMLText v${YAML_VALIDATOR_VERSION_STRING} finished with ${cytResult.noticeList.length ? cytResult.noticeList.length.toLocaleString() : "zero"} notice${cytResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkYAMLText v${YAML_VALIDATOR_VERSION_STRING}`)
    // console.log(`  checkYAMLText returning with ${cytResult.successList.length.toLocaleString()} success(es), ${cytResult.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkYAMLText result is", JSON.stringify(result));
    return cytResult;
}
// end of checkYAMLText function
