import { DEFAULT_EXCERPT_LENGTH } from './defaults'
import { checkMarkdownText } from './markdown-text-check';
import { checkTextfileContents } from './file-text-check';
import { checkStrongsField } from './strongs-field-check'; // and this may call checkLexiconFileContents()
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, logicAssert, parameterAssert } from './utilities';


const MARKDOWN_FILE_VALIDATOR_VERSION_STRING = '1.0.1';


/**
 *
 * @param {string} username
 * @param {string} languageCode
 * @param {string} repoCode -- e.g., 'TW', 'TA', 'TQ', or 'OBS', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ', etc.
 * @param {string} markdownFilename -- used for identification
 * @param {string} markdownText -- the actual text to be checked
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkMarkdownFileContents(username, languageCode, repoCode, markdownFilename, markdownText, givenLocation, checkingOptions) {
  /* This function is optimised for checking the entire markdown file, i.e., all lines.
      It should not be used for just checking a field within a file, e.g., a markdown field within a TSV file

  It uses checkMarkdownText() to actually check the markdown formatting.
  It also then uses checkTextfileContents() for general file check stuff.

   Returns a result object containing a successList and a noticeList
   */
  // functionLog(`checkMarkdownFileContents(${username}, lC=${languageCode}, rC=${repoCode}, fn=${markdownFilename}, (${markdownText.length}), gL='${givenLocation}')…`);
  //parameterAssert(languageCode !== undefined, "checkMarkdownFileContents: 'languageCode' parameter should be defined");
  //parameterAssert(typeof languageCode === 'string', `checkMarkdownFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  // TODO: Check if/why we have both forms below
  if (markdownFilename !== 'LICENSE.md' && markdownFilename !== 'README.md' && markdownFilename !== 'LICENSE' && markdownFilename !== 'README') {
    //parameterAssert(['TW', 'TA', 'TQ', 'UHAL', 'UGL', 'OBS', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'].indexOf(repoCode) !== -1, `checkMarkdownFileContents: 'repoCode' parameter with '${markdownFilename}' should be 'TW', 'TA', 'TQ', 'UHAL', 'UGL', 'OBS', or 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ' not '${repoCode}'`);
  }
  //parameterAssert(markdownFilename !== undefined, "checkMarkdownFileContents: 'markdownFilename' parameter should be defined");
  //parameterAssert(typeof markdownFilename === 'string', `checkMarkdownFileContents: 'markdownFilename' parameter should be a string not a '${typeof markdownFilename}': ${markdownFilename}`);
  //parameterAssert(markdownText !== undefined, "checkMarkdownFileContents: 'markdownText' parameter should be defined");
  //parameterAssert(typeof markdownText === 'string', `checkMarkdownFileContents: 'markdownText' parameter should be a string not a '${typeof markdownText}': ${markdownText}`);
  //parameterAssert(givenLocation !== undefined, "checkMarkdownFileContents: 'givenLocation' parameter should be defined");
  //parameterAssert(typeof givenLocation === 'string', `checkMarkdownFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
  //parameterAssert(givenLocation.indexOf('true') === -1, `checkMarkdownFileContents: 'givenLocation' parameter should not be '${givenLocation}'`);
  parameterAssert(givenLocation.indexOf(`${languageCode}_${repoCode}`) === -1, `checkMarkdownFileContents: repoName equivalent '${`${languageCode}_${repoCode}`}' shouldn't be in givenLocation '${givenLocation}'`)
  if (checkingOptions !== undefined) {
    //parameterAssert(typeof checkingOptions === 'object', `checkMarkdownFileContents: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
  }

  let ourLocation = givenLocation;
  if (ourLocation?.length && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

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
    // functionLog(`checkMarkdownFileContents addNoticePartial: (priority=${incompleteNoticeObject.priority}) ${incompleteNoticeObject.message}${incompleteNoticeObject.characterIndex > 0 ? ` (at character ${incompleteNoticeObject.characterIndex})` : ""}${incompleteNoticeObject.excerpt ? " " + incompleteNoticeObject.excerpt : ""}${incompleteNoticeObject.location}`);
    //parameterAssert(incompleteNoticeObject.priority !== undefined, "cMdT addNoticePartial: 'priority' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `cMdT addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}': ${incompleteNoticeObject.priority}`);
    //parameterAssert(incompleteNoticeObject.message !== undefined, "cMdT addNoticePartial: 'message' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.message === 'string', `cMdT addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}': ${incompleteNoticeObject.message}`);
    // parameterAssert(characterIndex !== undefined, "cMdT addNoticePartial: 'characterIndex' parameter should be defined");
    if (incompleteNoticeObject.characterIndex) {
      //parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `cMdT addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}': ${incompleteNoticeObject.characterIndex}`);
    }
    // parameterAssert(excerpt !== undefined, "cMdT addNoticePartial: 'excerpt' parameter should be defined");
    if (incompleteNoticeObject.excerpt) {
      //parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `cMdT addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}': ${incompleteNoticeObject.excerpt}`);
    }
    //parameterAssert(incompleteNoticeObject.location !== undefined, "cMdT addNoticePartial: 'location' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.location === 'string', `cMdT addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}': ${incompleteNoticeObject.location}`);

    if (!incompleteNoticeObject.repoCode) {
      // debugLog(`checkMarkdownFileContents addNoticePartial added rC=${repoCode} to ${JSON.stringify(incompleteNoticeObject)}`);
      incompleteNoticeObject.repoCode = repoCode;
    }
    // else if (repoCode !== incompleteNoticeObject.repoCode) debugLog(`checkMarkdownFileContents addNoticePartial DIDN'T ADD rC=${repoCode} to ${JSON.stringify(incompleteNoticeObject)}`);

    if (incompleteNoticeObject.debugChain) incompleteNoticeObject.debugChain = `checkMarkdownFileContents ${incompleteNoticeObject.debugChain}`; // Prepend our name
    // aboutToOverwrite('checkMarkdownFileContents', ['filename'], incompleteNoticeObject, { filename: markdownFilename });
    // Only put in our filename if we didn't already have (a linked) one
    if (!incompleteNoticeObject.filename) incompleteNoticeObject.filename = markdownFilename;
    mfccResult.noticeList.push(incompleteNoticeObject);
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

    const cmtResultObject = await checkMarkdownText(username, languageCode, repoCode, markdownFilename, markdownText, optionalFieldLocation, checkingOptions);
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

    const ctfcResultObject = checkTextfileContents(username, languageCode, repoCode, 'markdown', markdownFilename, markdownText, optionalFieldLocation, checkingOptions);
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
    //parameterAssert(fieldText !== undefined, "checkMarkdownFileContents ourCheckStrongsField: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldText === 'string', `checkMarkdownFileContents ourCheckStrongsField: 'fieldText' parameter should be a string not a '${typeof fieldText}': ${fieldText}`);
    //parameterAssert(checkingOptions !== undefined, "checkMarkdownFileContents ourCheckStrongsField: 'checkingOptions' parameter should be defined");
    if (checkingOptions !== undefined) {
      //parameterAssert(typeof checkingOptions === 'object', `checkMarkdownFileContents ourCheckStrongsField: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let adjustedLanguageCode = languageCode; // This is the language code of the resource with the link
    if (languageCode === 'hbo' || languageCode === 'el-x-koine') adjustedLanguageCode = 'en' // This is a guess (and won’t be needed for TWs when we switch to TWLs)
    const csfResultObject = await checkStrongsField(username, languageCode, repoCode, 'TWStrongs', fieldText, '', '', '', location, { ...checkingOptions, defaultLanguageCode: adjustedLanguageCode });
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
          const bits = line.slice(12).split(' ');
          for (let bit of bits) {
            // debugLog(`About to check this ${repoCode} ${markdownFilename} bit: ${bit}`);
            if (bit.length) { // ignore double-spaces -- they're caught elsewhere
              if (bit[0] === 'H' || bit[0] === 'G') {
                if (bit.slice(-1) === ',') bit = bit.slice(0, bit.length - 1); // Remove any trailing comma
                // Bit should now be a valid Strong's number
                await ourCheckStrongsField(n, bit, ourLocation, checkingOptions);
              } else // doesn't start with H or G
                addNoticePartial({ priority: 171, message: "Possible bad lexicon link in TW Strong's line", excerpt: bit, location: ourLocation });
            }
          }
        } else
          addNoticePartial({ priority: 70, message: "Possible unusual TW Strong's line", details: "expected line to start with '* Strong’s: '", excerpt: line.slice(0, excerptLength - 1), location: ourLocation });
      }
    }
  } else if (repoCode.endsWith('SN') && /\d\d\/\d\d.md/.test(markdownFilename) && markdownFilename.indexOf('00') === -1) { // SN or OBS-SN but not intro file
    // debugLog(`Need to check SN md structure ${repoCode} ${markdownFilename}: ${markdownText}`)
    // This code was adapted from the Python TSV converter code at https://github.com/unfoldingWord-dev/tools/blob/develop/tsv/OBS_SN_MD_to_TSV7.py#L55
    let haveBadStructure = false;
    let state = 'idle';
    let quote = null, note = null;
    const lines = markdownText.split('\n');
    for (let n = 1; n <= lines.length; n++) {
      const line = lines[n - 1].trimEnd(); // Remove trailing whitespace including nl char
      // debugLog(`  SN state=${state} quote=${quote} line=${line}`);
      if (!line) continue // Ignore blank lines
      if (line.startsWith('# ')) {
        if (state === 'idle') {
          logicAssert(!quote);
          logicAssert(!note);
          quote = line.slice(2);
          note = null;
          state = 1;
        } else {
          debugLog(`Something WRONG with SN structure check!`);
          haveBadStructure = true; break;
        }
      } else if (state === 1) {
        logicAssert(quote);
        logicAssert(!note);
        note = line;
        state = 'idle';
        // We've completed that one!
        quote = null; note = null;
      } else {
        // debugLog(`Losing SN ${state} ${markdownFilename} line ${n}: '${line}'`);
        haveBadStructure = true; break;
      }
    }
    if (haveBadStructure)
      addNoticePartial({ priority: 948, message: "Structure of markdown file seems wrong", location: ourLocation });
  } else if (repoCode.endsWith('TN') && /\d\d\/\d\d.md/.test(markdownFilename) && markdownFilename.indexOf('00') === -1) { // TN or OBS-TN but not intro file
    // debugLog(`Need to check TN md structure ${repoCode} ${markdownFilename}: ${markdownText}`)
    // This code was adapted from the Python TSV converter code at https://github.com/unfoldingWord-dev/tools/blob/develop/tsv/OBS_TN_MD_to_TSV7.py#L55
    let haveBadStructure = false;
    let state = 'idle';
    let quote = null, note = null;
    const lines = markdownText.split('\n');
    for (let n = 1; n <= lines.length; n++) {
      const line = lines[n - 1].trimEnd(); // Remove trailing whitespace including nl char
      // debugLog(`  TN state=${state} quote=${quote} line=${line}`);
      if (!line) continue // Ignore blank lines
      if (line.startsWith('# ')) {
        if (state === 'idle') {
          logicAssert(!quote);
          logicAssert(!note);
          quote = line.slice(2);
          note = null;
          state = 1
        } else {
          debugLog(`Something WRONG with TN structure check!`);
          haveBadStructure = true; break;
        }
      } else if (state === 'idle') {
        // debugLog(`Have continuation part ${markdownFilename} line ${n}: (${line.length})'${line}'`);
        logicAssert(!quote);
        note = line;
        // We've completed that one!
        note = null;
      } else if (state === 1) {
        logicAssert(quote);
        logicAssert(!note);
        note = line;
        state = 'idle';
        // We've completed that one!
        quote = null; note = null;
      } else {
        // debugLog(`Losing TN ${state} ${markdownFilename} line ${n}: '${line}'`);
        haveBadStructure = true; break;
      }
    }
    if (haveBadStructure)
      addNoticePartial({ priority: 948, message: "Structure of markdown file seems wrong", location: ourLocation });
  } else if (repoCode.endsWith('SQ') && /\d\d\/\d\d.md/.test(markdownFilename) && markdownFilename.indexOf('00') === -1) { // SQ or OBS-SQ but not intro file
    debugLog(`Need to check SQ md structure ${repoCode} ${markdownFilename}: ${markdownText}`)
    // This code was adapted from the Python TSV converter code at https://github.com/unfoldingWord-dev/tools/blob/develop/tsv/OBS_SQ_MD_to_TSV7.py#L55
    let haveBadStructure = false;
    let state = 'idle';
    let tag = null, question = null, response = null;
    const lines = markdownText.split('\n');
    for (let n = 1; n <= lines.length; n++) {
      const line = lines[n - 1].trimEnd(); // Remove trailing whitespace including nl char
      debugLog(`  SQ state=${state} tag=${tag} line=${line}`);
      if (!line) continue // Ignore blank lines
      if (line.startsWith('# ')) { // Ignore the story title
        if (state !== 'idle') {
          debugLog(`Oops, went badly wrong with state=${state}`);
          haveBadStructure = true; break;
        }
      } else if (line.startsWith('## ')) {
        logicAssert(!question);
        logicAssert(!response);
        tag = line.slice(3).trim();
        if (tag === 'Summary') {
          state = 'gettingSummary';
          response = '';
        } else
          state = 'gotTag';
      } else if (line.startsWith('1. ')) {
        logicAssert(state === 'gotTag');
        logicAssert(tag);
        logicAssert(!question);
        logicAssert(!response);
        question = line.slice(3).trim();
        response = null;
        state = 'gotQuestion';
      } else if (state === 'gotQuestion') {
        logicAssert(tag);
        logicAssert(question);
        logicAssert(!response);
        response = line.trim();
        state = 'gotTag';
        // We've completed that one!
        question = null; response = null;
      } else if (state === 'gettingSummary') {
        response += (response ? '(' : '') + line.trim();
      } else {
        debugLog(`Losing SQ ${state} ${markdownFilename} line ${n}: '${line}'`);
        haveBadStructure = true; break;
      }
      if (state !== 'idle') {
        debugLog(`Why did we finish with SQ state='{state}' tag='{tag}' q='{question}' r='{response}'`);
        haveBadStructure = true;
      }
    }
    if (haveBadStructure)
      addNoticePartial({ priority: 948, message: "Structure of markdown file seems wrong", location: ourLocation });
  } else if (repoCode.endsWith('TQ') && /\d\d\/\d\d.md/.test(markdownFilename) && markdownFilename.indexOf('00') === -1) { // TQ or OBS-TQ, but not intro file
    // debugLog(`Need to check TQ md structure ${repoCode} ${markdownFilename}: ${markdownText}`)
    // This code was adapted from the Python TSV converter code at https://github.com/unfoldingWord-dev/tools/blob/develop/tsv/OBS_TQ_MD_to_TSV7.py#L62
    let haveBadStructure = false;
    let state = 'idle';
    let question = null, response = null;
    const lines = markdownText.split('\n');
    for (let n = 1; n <= lines.length; n++) {
      const line = lines[n - 1].trimEnd(); // Remove trailing whitespace including nl char
      // debugLog(`  TQ state=${state} tag=${tag} line=${line}`);
      if (!line) continue; // Ignore blank lines
      if (line.startsWith('# ')) {
        if (state === 'idle') {
          logicAssert(!question);
          logicAssert(!response);
          question = line.slice(2);
          response = null;
          state = 1;
        } else {
          debugLog(`Something WRONG with TQ structure check!`);
          haveBadStructure = true; break;
        }
      } else if (state === 1) {
        logicAssert(question);
        logicAssert(!response);
        response = line;
        // We've completed that one!
        state = 'idle';
        question = null; response = null;
      } else {
        // debugLog(`Losing TQ state=${state} ${markdownFilename} line ${n}: '${line}'`);
        haveBadStructure = true; break;
      }
    }
    if (haveBadStructure)
      addNoticePartial({ priority: 948, message: "Structure of markdown file seems wrong", location: ourLocation });
  }
  // else debugLog(`Skipping checking ${repoCode} ${markdownFilename}`)


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
