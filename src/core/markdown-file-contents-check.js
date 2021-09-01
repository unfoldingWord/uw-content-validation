import { DEFAULT_EXCERPT_LENGTH } from './defaults'
import { checkMarkdownText } from './markdown-text-check';
import { checkTextfileContents } from './file-text-check';
import { checkStrongsField } from './strongs-field-check'; // and this may call checkLexiconFileContents()
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, logicAssert, parameterAssert } from './utilities';


const MARKDOWN_FILE_VALIDATOR_VERSION_STRING = '0.5.1';


/**
 *
 * @param {string} languageCode
 * @param {string} repoCode -- e.g., 'TW', 'TA', 'TQ', or 'OBS', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ', etc.
 * @param {string} markdownFilename -- used for identification
 * @param {string} markdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkMarkdownFileContents(languageCode, repoCode, markdownFilename, markdownText, givenLocation, checkingOptions) {
  /* This function is optimised for checking the entire markdown file, i.e., all lines.
      It should not be used for just checking a field within a file, e.g., a markdown field within a TSV file

  It uses checkMarkdownText() to actually check the markdown formatting.
  It also then uses checkTextfileContents() for general file check stuff.

   Returns a result object containing a successList and a noticeList
   */
  // functionLog(`checkMarkdownFileContents(lC=${languageCode}, rC=${repoCode}, fn=${markdownFilename}, ${markdownText.length}, ${givenLocation})…`);
  //parameterAssert(languageCode !== undefined, "checkMarkdownFileContents: 'languageCode' parameter should be defined");
  //parameterAssert(typeof languageCode === 'string', `checkMarkdownFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  // TODO: Check if/why we have both forms below
  if (markdownFilename !== 'LICENSE.md' && markdownFilename !== 'README.md' && markdownFilename !== 'LICENSE' && markdownFilename !== 'README') {
    parameterAssert(['TW', 'TA', 'TQ', 'UHAL', 'UGL', 'OBS', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'].indexOf(repoCode) !== -1, `checkMarkdownFileContents: 'repoCode' parameter with '${markdownFilename}' should be 'TW', 'TA', 'TQ', 'UHAL', 'UGL', 'OBS', or 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ' not '${repoCode}'`);
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

  const mfccResult = { successList: [], noticeList: [] };

  function addSuccessMessage(successString) {
    // debugLog("checkMarkdownFileContents success: " + successString);
    mfccResult.successList.push(successString);
  }
  function addNoticePartial(incompleteNoticeObject) {
    // functionLog(`checkMarkdownFileContents addNoticePartial: (priority=${noticeObject.priority}) ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? " " + noticeObject.excerpt : ""}${noticeObject.location}`);
    //parameterAssert(noticeObject.priority !== undefined, "cMdT addNoticePartial: 'priority' parameter should be defined");
    //parameterAssert(typeof noticeObject.priority === 'number', `cMdT addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
    //parameterAssert(noticeObject.message !== undefined, "cMdT addNoticePartial: 'message' parameter should be defined");
    //parameterAssert(typeof noticeObject.message === 'string', `cMdT addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
    // //parameterAssert(characterIndex !== undefined, "cMdT addNoticePartial: 'characterIndex' parameter should be defined");
    if (incompleteNoticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `cMdT addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
    }
    // //parameterAssert(excerpt !== undefined, "cMdT addNoticePartial: 'excerpt' parameter should be defined");
    if (incompleteNoticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `cMdT addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
    }
    //parameterAssert(noticeObject.location !== undefined, "cMdT addNoticePartial: 'location' parameter should be defined");
    //parameterAssert(typeof noticeObject.location === 'string', `cMdT addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

    if (incompleteNoticeObject.debugChain) incompleteNoticeObject.debugChain = `checkMarkdownFileContents ${incompleteNoticeObject.debugChain}`; // Prepend our name
    mfccResult.noticeList.push({ ...incompleteNoticeObject, repoCode, filename: markdownFilename });
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


  async function ourCheckStrongsField(lineNumber, fieldText, location, checkingOptions) {
    // Checks that the Strongs number field is valid

    // Updates the global list of notices

    // functionLog(`checkMarkdownFileContents ourCheckStrongsField(${lineNumber}, ${C}:${V}, ${marker}, ${fieldName}, (${fieldText.length}) '${fieldText}', ${location}, ${JSON.stringify(checkingOptions)})`);
    // parameterAssert(marker !== undefined, "checkMarkdownFileContents ourCheckStrongsField: 'marker' parameter should be defined");
    // parameterAssert(typeof marker === 'string', `checkMarkdownFileContents ourCheckStrongsField: 'marker' parameter should be a string not a '${typeof marker}': ${marker}`);
    // parameterAssert(fieldName !== undefined, "checkMarkdownFileContents ourCheckStrongsField: 'fieldName' parameter should be defined");
    // parameterAssert(typeof fieldName === 'string', `checkMarkdownFileContents ourCheckStrongsField: 'fieldName' parameter should be a string not a '${typeof fieldName}': ${fieldName}`);
    parameterAssert(fieldText !== undefined, "checkMarkdownFileContents ourCheckStrongsField: 'fieldText' parameter should be defined");
    parameterAssert(typeof fieldText === 'string', `checkMarkdownFileContents ourCheckStrongsField: 'fieldText' parameter should be a string not a '${typeof fieldText}': ${fieldText}`);
    parameterAssert(checkingOptions !== undefined, "checkMarkdownFileContents ourCheckStrongsField: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined) {
      parameterAssert(typeof checkingOptions === 'object', `checkMarkdownFileContents ourCheckStrongsField: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let adjustedLanguageCode = languageCode; // This is the language code of the resource with the link
    if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won’t be needed for TWs when we switch to TWLs)
    const csfResultObject = await checkStrongsField(languageCode, repoCode, 'TWStrongs', fieldText, '', '', '', location, { ...checkingOptions, defaultLanguageCode: adjustedLanguageCode });
    // debugLog(`csfResultObject=${JSON.stringify(csfResultObject)}`);

    // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
    //  process results line by line
    for (const coqNoticeEntry of csfResultObject.noticeList) {
      // debugLog(`checkMarkdownFileContents ourCheckStrongsField got: ${JSON.stringify(coqNoticeEntry)}`);
      logicAssert(coqNoticeEntry.extra ? coqNoticeEntry.extra !== 'UGNT' : true, `Expected extra to be a lexicon from ${JSON.stringify(coqNoticeEntry)}`);
      if (coqNoticeEntry.extra) // it must be an indirect check on a UHAL or UGL article from a lexicon check
        mfccResult.noticeList.push(coqNoticeEntry); // Just copy the complete notice as is
      else // For our direct checks, we add the repoCode as an extra value
        addNoticePartial({ ...coqNoticeEntry, lineNumber, fieldName: 'TWStrongs' });
    }
    // The following is needed coz we might be checking the linked UHAL and/or UGL lexicon entries
    if (csfResultObject.checkedFileCount && csfResultObject.checkedFileCount > 0)
      if (typeof mfccResult.checkedFileCount === 'number') mfccResult.checkedFileCount += csfResultObject.checkedFileCount;
      else mfccResult.checkedFileCount = csfResultObject.checkedFileCount;
    if (csfResultObject.checkedFilesizes && csfResultObject.checkedFilesizes > 0)
      if (typeof mfccResult.checkedFilesizes === 'number') mfccResult.checkedFilesizes += csfResultObject.checkedFilesizes;
      else mfccResult.checkedFilesizes = csfResultObject.checkedFilesizes;
    if (csfResultObject.checkedRepoNames && csfResultObject.checkedRepoNames.length > 0)
      for (const checkedRepoName of csfResultObject.checkedRepoNames)
        try { if (mfccResult.checkedRepoNames.indexOf(checkedRepoName) < 0) mfccResult.checkedRepoNames.push(checkedRepoName); }
        catch { mfccResult.checkedRepoNames = [checkedRepoName]; }
    if (csfResultObject.checkedFilenameExtensions && csfResultObject.checkedFilenameExtensions.length > 0)
      for (const checkedFilenameExtension of csfResultObject.checkedFilenameExtensions)
        try { if (mfccResult.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) mfccResult.checkedFilenameExtensions.push(checkedFilenameExtension); }
        catch { mfccResult.checkedFilenameExtensions = [checkedFilenameExtension]; }
    // if (result.checkedFilenameExtensions) debugLog(`ourCheckStrongsField result: ${JSON.stringify(result)}`);
  }
  // end of ourCheckStrongsField function


  // Main code for checkMarkdownFileContents function
  await ourCheckMarkdownText(markdownText, givenLocation, checkingOptions);
  // TODO: Should the following line be inside the checkMarkdownText(), i.e., are those checks getting skipped for markdown fields ???
  ourFileTextCheck(markdownText, givenLocation, checkingOptions);


  if (repoCode === 'TW') { // then we need to check Strong's numbers in the articles
    const lines = markdownText.split('\n');
    for (let n = 1; n <= lines.length; n++) {
      const line = lines[n - 1];
      // debugLog(`Looking at line of ${repoCode} ${markdownFilename}: ${line}`);
      if (line.indexOf('Strong') !== -1) { // NOTE: This is intentionally a very broad catch
        // debugLog(`About to check this ${repoCode} ${markdownFilename} line: ${line}`);
        if (line.startsWith('* Strong’s: ')) { // 12 chars
          const bits = line.substring(12).split(' ');
          for (let bit of bits) {
            // debugLog(`About to check this ${repoCode} ${markdownFilename} bit: ${bit}`);
            if (bit.length) { // ignore double-spaces -- they're caught elsewhere
              if (bit[0] === 'H' || bit[0] === 'G') {
                if (bit.slice(-1) === ',') bit = bit.substring(0, bit.length - 1); // Remove any trailing comma
                // Bit should now be a valid Strong's number
                await ourCheckStrongsField(n, bit, ourLocation, checkingOptions);
              } else // doesn't start with H or G
                addNoticePartial({ priority: 171, message: "Possible bad lexicon link in TW Strong's line", excerpt: bit, location: ourLocation });
            }
          }
        } else
          addNoticePartial({ priority: 70, message: "Possible unusual TW Strong's line", details: "expected line to start with '* Strong’s: '", excerpt: line.substring(0, excerptLength - 1), location: ourLocation });
      }
    }
  }

  addSuccessMessage(`Checked markdown file: ${markdownFilename}`);
  if (mfccResult.noticeList.length)
    addSuccessMessage(`checkMarkdownFileContents v${MARKDOWN_FILE_VALIDATOR_VERSION_STRING} finished with ${mfccResult.noticeList.length ? mfccResult.noticeList.length.toLocaleString() : "zero"} notice${mfccResult.noticeList.length === 1 ? '' : 's'}`);
  else
    addSuccessMessage(`No errors or warnings found by checkMarkdownFileContents v${MARKDOWN_FILE_VALIDATOR_VERSION_STRING}`)
  // debugLog(`  checkMarkdownFileContents returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
  // userLog(`checkMarkdownFileContents result is ${JSON.stringify(result)}`);
  return mfccResult;
}
// end of checkMarkdownFileContents function
