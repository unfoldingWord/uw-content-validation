import { DEFAULT_EXCERPT_LENGTH } from './defaults'
import { checkMarkdownText } from './markdown-text-check';
import { checkTextfileContents } from './file-text-check';
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, parameterAssert } from './utilities';


const MARKDOWN_FILE_VALIDATOR_VERSION_STRING = '0.4.4';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode -- e.g., 'TW', 'TA', 'TQ', or 'OBS', etc.
 * @param {string} markdownFilename -- used for identification
 * @param {string} markdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkMarkdownFileContents(languageCode, repoCode, markdownFilename, markdownText, givenLocation, checkingOptions) {
  /* This function is optimised for checking the entire markdown file, i.e., all lines.

   Returns a result object containing a successList and a noticeList
   */
  // functionLog(`checkMarkdownFileContents(lC=${languageCode}, rC=${repoCode}, fn=${markdownFilename}, ${markdownText.length}, ${givenLocation})…`);
  //parameterAssert(languageCode !== undefined, "checkMarkdownFileContents: 'languageCode' parameter should be defined");
  //parameterAssert(typeof languageCode === 'string', `checkMarkdownFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  if (markdownFilename !== 'LICENSE.md' && markdownFilename !== 'README.md') {    //parameterAssert(repoCode === 'TW' || repoCode === 'TA' || repoCode === 'TQ' || repoCode === 'OBS' || repoCode === 'OBS-TQ', `checkMarkdownFileContents: 'repoCode' parameter should be 'TW', 'TA', 'TQ', 'OBS', or 'OBS-TQ' not '${repoCode}'`);
  }
  //parameterAssert(markdownFilename !== undefined, "checkMarkdownFileContents: 'markdownFilename' parameter should be defined");
  //parameterAssert(typeof markdownFilename === 'string', `checkMarkdownFileContents: 'markdownFilename' parameter should be a string not a '${typeof markdownFilename}': ${markdownFilename}`);
  //parameterAssert(markdownText !== undefined, "checkMarkdownFileContents: 'markdownText' parameter should be defined");
  //parameterAssert(typeof markdownText === 'string', `checkMarkdownFileContents: 'markdownText' parameter should be a string not a '${typeof markdownText}': ${markdownText}`);
  //parameterAssert(givenLocation !== undefined, "checkMarkdownFileContents: 'givenLocation' parameter should be defined");
  //parameterAssert(typeof givenLocation === 'string', `checkMarkdownFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
  //parameterAssert(givenLocation.indexOf('true') === -1, `checkMarkdownFileContents: 'givenLocation' parameter should not be '${givenLocation}'`);
  if (checkingOptions !== undefined) { //parameterAssert(typeof checkingOptions === 'object', `checkMarkdownFileContents: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
  }

  let ourLocation = givenLocation;
  if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

  let excerptLength;
  try {
    excerptLength = checkingOptions?.excerptLength;
  } catch (mdtcError) { }
  if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
    excerptLength = DEFAULT_EXCERPT_LENGTH;
    // debugLog("Using default excerptLength=" + excerptLength);
  }
  // else
  // debugLog("Using supplied excerptLength=" + excerptLength, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
  // const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
  // const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
  // debugLog("Using excerptHalfLength=" + excerptHalfLength, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

  const result = { successList: [], noticeList: [] };

  function addSuccessMessage(successString) {
    // debugLog("checkMarkdownFileContents success: " + successString);
    result.successList.push(successString);
  }
  function addNoticePartial(noticeObject) {
    // functionLog(`checkMarkdownFileContents addNoticePartial: (priority=${noticeObject.priority}) ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? " " + noticeObject.excerpt : ""}${noticeObject.location}`);
    //parameterAssert(noticeObject.priority !== undefined, "cMdT addNoticePartial: 'priority' parameter should be defined");
    //parameterAssert(typeof noticeObject.priority === 'number', `cMdT addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
    //parameterAssert(noticeObject.message !== undefined, "cMdT addNoticePartial: 'message' parameter should be defined");
    //parameterAssert(typeof noticeObject.message === 'string', `cMdT addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
    // //parameterAssert(characterIndex !== undefined, "cMdT addNoticePartial: 'characterIndex' parameter should be defined");
    if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cMdT addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
    }
    // //parameterAssert(excerpt !== undefined, "cMdT addNoticePartial: 'excerpt' parameter should be defined");
    if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cMdT addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
    }
    //parameterAssert(noticeObject.location !== undefined, "cMdT addNoticePartial: 'location' parameter should be defined");
    //parameterAssert(typeof noticeObject.location === 'string', `cMdT addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

    if (noticeObject.debugChain) noticeObject.debugChain = `checkMarkdownFileContents ${noticeObject.debugChain}`; // Prepend our name
    result.noticeList.push({ ...noticeObject, filename: markdownFilename });
  }
  // end of addNoticePartial function

  /**
  * @description - checks the given text field and processes the returned results
  * @param {string} markdownText - the actual text of the file being checked
  * @param {boolean} allowedLinks - true if links are allowed in the field, otherwise false
  * @param {string} optionalFieldLocation - description of where the field is located
  * @param {Object} checkingOptions - parameters that might affect the check
  */
  async function ourCheckMarkdownText(markdownText, optionalFieldLocation, checkingOptions) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // We assume that checking for compulsory fields is done elsewhere

    // Updates the global list of notices
    // debugLog(`cMdT ourCheckMarkdownText(${fieldName}, (${fieldText.length}), ${allowedLinks}, ${optionalFieldLocation}, …)`);
    //parameterAssert(markdownText !== undefined, "cMdFC ourCheckMarkdownText: 'markdownText' parameter should be defined");
    //parameterAssert(typeof markdownText === 'string', `cMdFC ourCheckMarkdownText: 'markdownText' parameter should be a string not a '${typeof markdownText}'`);
    //parameterAssert(optionalFieldLocation !== undefined, "cMdFC ourCheckMarkdownText: 'optionalFieldLocation' parameter should be defined");
    //parameterAssert(typeof optionalFieldLocation === 'string', `cMdFC ourCheckMarkdownText: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}'`);

    const cmtResultObject = await checkMarkdownText(languageCode, repoCode, markdownFilename, markdownText, optionalFieldLocation, checkingOptions);
    // debugLog(`cmtResultObject=${JSON.stringify(cmtResultObject)}`);

    // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
    //  process results line by line
    for (const noticeEntry of cmtResultObject.noticeList)
      addNoticePartial(noticeEntry);
  }
  // end of ourCheckMarkdownText function


  /**
  * @description - checks the given text field and processes the returned results
  * @param {string} markdownText - the actual text of the file being checked
  * @param {string} optionalFieldLocation - description of where the field is located
  * @param {Object} checkingOptions - parameters that might affect the check
  */
  function ourFileTextCheck(markdownText, optionalFieldLocation, checkingOptions) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // We assume that checking for compulsory fields is done elsewhere

    // Updates the global list of notices
    // debugLog(`cMdFC ourFileTextCheck(${markdownText}, (${markdownText.length}), ${optionalFieldLocation}, ${JSON.stringify(checkingOptions)})`);
    //parameterAssert(markdownText !== undefined, "cMdFC ourFileTextCheck: 'markdownText' parameter should be defined");
    //parameterAssert(typeof markdownText === 'string', `cMdFC ourFileTextCheck: 'markdownText' parameter should be a string not a '${typeof markdownText}'`);
    //parameterAssert(checkingOptions !== undefined, "cMdFC ourFileTextCheck: 'checkingOptions' parameter should be defined");

    const ctfcResultObject = checkTextfileContents(languageCode, repoCode, 'markdown', markdownFilename, markdownText, optionalFieldLocation, checkingOptions);
    // debugLog(`ctfcResultObject=${JSON.stringify(ctfcResultObject)}`);

    // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
    //  process results line by line
    for (const noticeEntry of ctfcResultObject.noticeList)
      addNoticePartial(noticeEntry);
  }
  // end of ourFileTextCheck function


  // Main code for checkMarkdownFileContents function
  await ourCheckMarkdownText(markdownText, givenLocation, checkingOptions);
  ourFileTextCheck(markdownText, givenLocation, checkingOptions);


  addSuccessMessage(`Checked markdown file: ${markdownFilename}`);
  if (result.noticeList.length)
    addSuccessMessage(`checkMarkdownFileContents v${MARKDOWN_FILE_VALIDATOR_VERSION_STRING} finished with ${result.noticeList.length ? result.noticeList.length.toLocaleString() : "zero"} notice${result.noticeList.length === 1 ? '' : 's'}`);
  else
    addSuccessMessage(`No errors or warnings found by checkMarkdownFileContents v${MARKDOWN_FILE_VALIDATOR_VERSION_STRING}`)
  // debugLog(`  checkMarkdownFileContents returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
  // userLog(`checkMarkdownFileContents result is ${JSON.stringify(result)}`);
  return result;
}
// end of checkMarkdownFileContents function
