import { DEFAULT_EXTRACT_LENGTH } from './text-handling-functions'
import { checkMarkdownText } from './markdown-text-check';
import { checkTextfileContents } from './file-text-check';


const MARKDOWN_FILE_VALIDATOR_VERSION_STRING = '0.4.0';


/**
 *
 * @param {string} languageCode
 * @param {string} markdownFilename -- used for identification
 * @param {string} markdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} optionalCheckingOptions
 */
export function checkMarkdownFileContents(languageCode, markdownFilename, markdownText, givenLocation, optionalCheckingOptions) {
  /* This function is optimised for checking the entire markdown file, i.e., all lines.

  Note: This function does not check that any link targets in the markdown are valid links.

   Returns a result object containing a successList and a noticeList
   */
  // console.log(`checkMarkdownFileContents(${languageCode}, ${markdownFilename}, ${markdownText.length}, ${givenLocation})…`);
  console.assert(languageCode !== undefined, "checkMarkdownFileContents: 'languageCode' parameter should be defined");
  console.assert(typeof languageCode === 'string', `checkMarkdownFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  console.assert(markdownFilename !== undefined, "checkMarkdownFileContents: 'markdownFilename' parameter should be defined");
  console.assert(typeof markdownFilename === 'string', `checkMarkdownFileContents: 'markdownFilename' parameter should be a string not a '${typeof markdownFilename}': ${markdownFilename}`);
  console.assert(markdownText !== undefined, "checkMarkdownFileContents: 'markdownText' parameter should be defined");
  console.assert(typeof markdownText === 'string', `checkMarkdownFileContents: 'markdownText' parameter should be a string not a '${typeof markdownText}': ${markdownText}`);
  console.assert(givenLocation !== undefined, "checkMarkdownFileContents: 'givenLocation' parameter should be defined");
  console.assert(typeof givenLocation === 'string', `checkMarkdownFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
  console.assert(givenLocation.indexOf('true') === -1, `checkMarkdownFileContents: 'givenLocation' parameter should not be '${givenLocation}'`);
  if (optionalCheckingOptions !== undefined)
    console.assert(typeof optionalCheckingOptions === 'object', `checkMarkdownFileContents: 'optionalCheckingOptions' parameter should be an object not a '${typeof optionalCheckingOptions}': ${JSON.stringify(optionalCheckingOptions)}`);

  let ourLocation = givenLocation;
  if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

  let extractLength;
  try {
    extractLength = optionalCheckingOptions.extractLength;
  } catch (mdtcError) { }
  if (typeof extractLength !== 'number' || isNaN(extractLength)) {
    extractLength = DEFAULT_EXTRACT_LENGTH;
    // console.log("Using default extractLength=" + extractLength);
  }
  // else
  // console.log("Using supplied extractLength=" + extractLength, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
  // const halfLength = Math.floor(extractLength / 2); // rounded down
  // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
  // console.log("Using halfLength=" + halfLength, `halfLengthPlus=${halfLengthPlus}`);

  const result = { successList: [], noticeList: [] };

  function addSuccessMessage(successString) {
    // console.log("checkMarkdownFileContents success: " + successString);
    result.successList.push(successString);
  }
  function addNoticePartial(noticeObject) {
    // console.log(`checkMarkdownFileContents addNoticePartial: (priority=${noticeObject.priority}) ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? " " + extract : ""}${noticeObject.location}`);
    console.assert(noticeObject.priority !== undefined, "cMdT addNoticePartial: 'priority' parameter should be defined");
    console.assert(typeof noticeObject.priority === 'number', `cMdT addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
    console.assert(noticeObject.message !== undefined, "cMdT addNoticePartial: 'message' parameter should be defined");
    console.assert(typeof noticeObject.message === 'string', `cMdT addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
    // console.assert(characterIndex !== undefined, "cMdT addNoticePartial: 'characterIndex' parameter should be defined");
    if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cMdT addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
    // console.assert(extract !== undefined, "cMdT addNoticePartial: 'extract' parameter should be defined");
    if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cMdT addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
    console.assert(noticeObject.location !== undefined, "cMdT addNoticePartial: 'location' parameter should be defined");
    console.assert(typeof noticeObject.location === 'string', `cMdT addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

    if (noticeObject.debugChain) noticeObject.debugChain = `checkMarkdownFileContents ${noticeObject.debugChain}`;
    result.noticeList.push({ ...noticeObject, filename: markdownFilename });
  }
  // end of addNoticePartial function

  /**
  * @description - checks the given text field and processes the returned results
  * @param {String} markdownText - the actual text of the file being checked
  * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
  * @param {String} optionalFieldLocation - description of where the field is located
  * @param {Object} optionalCheckingOptions - parameters that might affect the check
  */
  async function ourCheckMarkdownText(markdownText, optionalFieldLocation, optionalCheckingOptions) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // We assume that checking for compulsory fields is done elsewhere

    // Updates the global list of notices
    // console.log(`cMdT ourCheckMarkdownText(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${optionalFieldLocation}, …)`);
    console.assert(markdownText !== undefined, "cMdFC ourCheckMarkdownText: 'markdownText' parameter should be defined");
    console.assert(typeof markdownText === 'string', `cMdFC ourCheckMarkdownText: 'markdownText' parameter should be a string not a '${typeof markdownText}'`);
    console.assert(optionalFieldLocation !== undefined, "cMdFC ourCheckMarkdownText: 'optionalFieldLocation' parameter should be defined");
    console.assert(typeof optionalFieldLocation === 'string', `cMdFC ourCheckMarkdownText: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

    const dbtcResultObject = await checkMarkdownText(languageCode, markdownFilename, markdownText, optionalFieldLocation, optionalCheckingOptions);

    // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
    //  process results line by line
    for (const noticeEntry of dbtcResultObject.noticeList)
      addNoticePartial(noticeEntry);
  }
  // end of ourCheckMarkdownText function


  /**
  * @description - checks the given text field and processes the returned results
  * @param {String} markdownText - the actual text of the file being checked
  * @param {String} optionalFieldLocation - description of where the field is located
  * @param {Object} optionalCheckingOptions - parameters that might affect the check
  */
  function ourFileTextCheck(markdownText, optionalFieldLocation, optionalCheckingOptions) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // We assume that checking for compulsory fields is done elsewhere

    // Updates the global list of notices
    // console.log(`cMdT ourFileTextCheck(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${optionalFieldLocation}, …)`);
    console.assert(markdownText !== undefined, "cMdFC ourFileTextCheck: 'markdownText' parameter should be defined");
    console.assert(typeof markdownText === 'string', `cMdFC ourFileTextCheck: 'markdownText' parameter should be a string not a '${typeof markdownText}'`);

    const dbtcResultObject = checkTextfileContents(languageCode, 'markdown', markdownFilename, markdownText, optionalFieldLocation, optionalCheckingOptions);

    // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
    //  process results line by line
    for (const noticeEntry of dbtcResultObject.noticeList)
      addNoticePartial(noticeEntry);
  }
  // end of ourFileTextCheck function


  // Main code for checkMarkdownFileContents function
  ourCheckMarkdownText(markdownText, givenLocation, optionalCheckingOptions);
  ourFileTextCheck(markdownText, givenLocation, optionalCheckingOptions);

  addSuccessMessage(`Checked markdown file: ${markdownFilename}`);
  if (result.noticeList)
    addSuccessMessage(`checkMarkdownFileContents v${MARKDOWN_FILE_VALIDATOR_VERSION_STRING} finished with ${result.noticeList.length ? result.noticeList.length.toLocaleString() : "zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
  else
    addSuccessMessage(`No errors or warnings found by checkMarkdownFileContents v${MARKDOWN_FILE_VALIDATOR_VERSION_STRING}`)
  // console.log(`  checkMarkdownFileContents returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
  if (markdownFilename.endsWith('walk.md'))
    console.log("checkMarkdownFileContents result is", JSON.stringify(result));
  return result;
}
// end of checkMarkdownFileContents function
