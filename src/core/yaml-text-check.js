import { DEFAULT_EXTRACT_LENGTH } from './text-handling-functions'
import yaml from 'yaml';
import { checkTextField } from './field-text-check';


const YAML_VALIDATOR_VERSION_STRING = '0.2.0';


export function checkYAMLText(textName, YAMLText, givenLocation, optionalCheckingOptions) {
    /* This function is optimised for checking the entire file, i.e., all lines.

     Returns a result object containing a successList and a noticeList,
        as well as the parsed YAML for further checking.

     */
    // console.log(`checkYAMLText(${textName}, ${YAMLText.length}, ${givenLocation})…`);
    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    if (textName) ourLocation = ` in ${textName}${ourLocation}`;

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
        cytResult.noticeList.push(noticeObject);
    }

    function ourCheckTextField(fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
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
        console.assert(fieldName !== undefined, "cYt ourCheckTextField: 'fieldName' parameter should be defined");
        console.assert(typeof fieldName === 'string', `cYt ourCheckTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}'`);
        console.assert(fieldText !== undefined, "cYt ourCheckTextField: 'fieldText' parameter should be defined");
        console.assert(typeof fieldText === 'string', `cYt ourCheckTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}'`);
        console.assert(allowedLinks === true || allowedLinks === false, "cYt ourCheckTextField: allowedLinks parameter must be either true or false");

        const resultObject = checkTextField('YAML', fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions);

        // Concat is faster if we don't need to process each notice individually
        cytResult.noticeList = cytResult.noticeList.concat(resultObject.noticeList);
        // // Process noticeList line by line
        // //  suppressing undesired errors
        // for (const noticeEntry of resultObject.noticeList) {
        //     // console.assert(Object.keys(noticeEntry).length === 5, `YAML ourCheckTextField notice length=${Object.keys(noticeEntry).length}`);
        //     if (noticeEntry.priority !== 191 // "Unexpected XXX character after space"
        //         && noticeEntry.message !== "Unexpected ' character after space"
        //         //   && noticeEntry.message !== "Unexpected space after ' character"
        //         && noticeEntry.message !== "Unexpected space after [ character"
        //         && (noticeEntry.message !== "Unexpected doubled - characters" || fieldText === '---')
        //     )
        //         addNotice(noticeEntry);
        // }
    }
    // end of ourCheckTextField function

    function checkYAMLLineContents(lineName, lineText, lineLocation) {

        // console.log(`checkYAMLLineContents for '${lineName} ${lineText}' at${lineLocation}`);
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
            ourCheckTextField(lineName, thisText, allowedLinksInLine, lineLocation, optionalCheckingOptions);
    }
    // end of checkYAMLLine function


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

        checkYAMLLineContents(`line ${n.toLocaleString()}`, line, ourLocation);
        // } else {
        //     // This is a blank line
        //     numLeadingSpaces = 0;
        // }

        // lastLineContents = line;
        // lastNumLeadingSpaces = numLeadingSpaces;
    }

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
