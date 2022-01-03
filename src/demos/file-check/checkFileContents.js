// eslint-disable-next-line no-unused-vars
import * as books from '../../core/books/books';
import {
  // eslint-disable-next-line no-unused-vars
  REPO_CODES_LIST,
  checkUSFMText, checkMarkdownFileContents, checkLexiconFileContents, checkPlainText, checkYAMLText, checkManifestText,
  internalCheckTN_TSV9Table, checkNotesTSV7Table, checkQuestionsTSV7Table, internalCheckTWL_TSV6Table,
} from '../../core';
// eslint-disable-next-line no-unused-vars
import { userLog, debugLog, functionLog, parameterAssert, logicAssert, aboutToOverwrite } from '../../core';


// const CHECK_FILE_CONTENTS_VERSION_STRING = '1.1.2';


/**
 *
 * @param {string} username for Door43.org
 * @param {string} BPLanguageCode, e.g., 'en'
 * @param {string} repoCode, e.g., 'LT', 'TN', 'TN2', 'TQ', 'TWL', etc.
 * @param {string} repoName, e.g., 'en_ult', 'ru_gst', etc.
 * @param {string} branch, e.g., 'master'
 * @param {string} filepath -- often just a filename
 * @param {string} fileContent
 * @param {string} givenLocation
 * @param {Object} givenCheckingOptions
 */
export async function checkFileContents(username, BPLanguageCode, repoCode, repoName, branch, filepath, fileContent, givenLocation, givenCheckingOptions) {
  // Determine the file type from the filename extension
  //  and return the results of checking that kind of file text
  // functionLog(`checkFileContents(un='${username}', lC='${BPLanguageCode}', rC='${repoCode}', rBr='${branch}', fp='${filepath}', ${fileContent.length} chars, gL='${givenLocation}', ${JSON.stringify(givenCheckingOptions)})…`);
  //parameterAssert(username !== undefined, "checkFileContents: 'username' parameter should be defined");
  //parameterAssert(typeof username === 'string', `checkFileContents: 'username' parameter should be a string not a '${typeof username}': ${username}`);
  //parameterAssert(languageCode !== undefined, "checkFileContents: 'languageCode' parameter should be defined");
  //parameterAssert(typeof languageCode === 'string', `checkFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  //parameterAssert(repoCode !== undefined, "checkFileContents: 'repoCode' parameter should be defined");
  //parameterAssert(typeof repoCode === 'string', `checkFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
  //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkFileContents: 'repoCode' parameter should not be '${repoCode}'`);
  //parameterAssert(branch !== undefined, "checkFileContents: 'branch' parameter should be defined");
  //parameterAssert(typeof branch === 'string', `checkFileContents: 'branch' parameter should be a string not a '${typeof branch}': ${branch}`);
  //parameterAssert(filepath !== undefined, "checkFileContents: 'filepath' parameter should be defined");
  //parameterAssert(typeof filepath === 'string', `checkFileContents: 'filepath' parameter should be a string not a '${typeof filepath}': ${filepath}`);
  //parameterAssert(fileContent !== undefined, "checkFileContents: 'fileContent' parameter should be defined");
  //parameterAssert(typeof fileContent === 'string', `checkFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}': ${fileContent.length}`);
  //parameterAssert(givenLocation !== undefined, "checkFileContents: 'givenLocation' parameter should be defined");
  //parameterAssert(typeof givenLocation === 'string', `checkFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
  //parameterAssert(givenCheckingOptions !== undefined, "checkFileContents: 'givenCheckingOptions' parameter should be defined");
  parameterAssert(givenLocation.indexOf(repoName) === -1, `checkFileContents: repoName '${repoName}' shouldn't be in givenLocation '${givenLocation}'`)

  const startTime = new Date();

  let ourCFLocation = givenLocation;
  if (ourCFLocation.length && ourCFLocation[0] !== ' ') ourCFLocation = ' ' + ourCFLocation;

  let adjustedLanguageCode = BPLanguageCode;
  if (repoCode === 'UHB') adjustedLanguageCode = 'hbo';
  else if (repoCode === 'UGNT') adjustedLanguageCode = 'el-x-koine';

  const filebits = filepath.split('/');
  const filename = filebits[filebits.length - 1];
  // debugLog(`checkFileContents from filepath='${filepath}' got (${filebits.length}) ${filebits} and then '${filename}'`);
  const filenameLower = filename.toLowerCase();

  const newCheckingOptions = givenCheckingOptions ? { ...givenCheckingOptions } : {}; // clone before modify
  // if (!newCheckingOptions.originalLanguageRepoUsername) newCheckingOptions.originalLanguageRepoUsername = username;
  if (!newCheckingOptions.taRepoUsername) newCheckingOptions.taRepoUsername = username;
  if (!newCheckingOptions.twRepoUsername) newCheckingOptions.twRepoUsername = username;

  let checkFileResultObject = { checkedFileCount: 0 };
  if (filenameLower.endsWith('.tsv')) {
    const filenameMain = filepath.slice(0, filepath.length - 4); // drop .tsv
    // functionLog(`checkFileContents have TSV filenameMain=${filenameMain}`);
    const bookID = filenameMain.startsWith(`${BPLanguageCode}_`) || filenameMain.startsWith('en_') ? filenameMain.slice(filenameMain.length - 3) : filenameMain.slice(filenameMain.length - 3, filenameMain.length).toUpperCase();
    // functionLog(`checkFileContents have TSV bookID=${bookID}`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    if (filepath.startsWith(`${BPLanguageCode}_`) || filenameMain.startsWith('en_')) {
      logicAssert(repoCode === 'TN', `These filenames ${filenameMain} are only for TN ${repoCode}`);
      checkFileResultObject = await internalCheckTN_TSV9Table(username, BPLanguageCode, repoCode, bookID, filepath, fileContent, ourCFLocation, newCheckingOptions);
    } else {
      // let adjustedRepoCode = repoCode;
      // if (adjustedRepoCode.startsWith('OBS-'))
      //   adjustedRepoCode = adjustedRepoCode.slice(4); // Remove the 'OBS-' from the beginning
      logicAssert(repoCode !== 'TN' && repoCode !== 'TQ1' && repoCode !== 'OBS-TN' && repoCode !== 'OBS-TQ1' && repoCode !== 'OBS_SN' && repoCode !== 'OBS-SQ', `This checkFileContents code with ${filenameMain} is not for ${repoCode}`);
      const checkFunction = {
        'TWL': internalCheckTWL_TSV6Table, 'OBS-TWL': internalCheckTWL_TSV6Table,
        'TN2': checkNotesTSV7Table, 'OBS-TN': checkNotesTSV7Table,
        'TQ': checkQuestionsTSV7Table, 'OBS-TQ': checkQuestionsTSV7Table,
        'SN': checkNotesTSV7Table, 'OBS-SN': checkNotesTSV7Table,
        'SQ': checkQuestionsTSV7Table, 'OBS-SQ': checkQuestionsTSV7Table,
      }[repoCode];
      // debugLog(`checkFileContents() got ${checkFunction} function for ${repoCode}`);
      checkFileResultObject = await checkFunction(username, BPLanguageCode, repoCode, bookID, filepath, fileContent, ourCFLocation, newCheckingOptions);
    }
  }
  else if (filenameLower.endsWith('.usfm')) {
    const filenameMain = filepath.slice(0, filepath.length - 5); // drop .usfm
    // debugLog(`Have USFM filenameMain=${filenameMain}`);
    const bookID = filenameMain.endsWith('_book') ? filenameMain.slice(filenameMain.length - 8, filenameMain.length - 5).toUpperCase() : filenameMain.slice(filenameMain.length - 3);
    // debugLog(`Have USFM bookcode=${bookID}`);
    //parameterAssert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResultObject = await checkUSFMText(username, adjustedLanguageCode, repoCode, bookID, filepath, fileContent, ourCFLocation, newCheckingOptions);
  } else if (filenameLower.endsWith('.sfm')) {
    const filenameMain = filepath.slice(0, filepath.length - 4); // drop .sfm
    userLog(`checkFileContents have SFM filenameMain=${filenameMain}`);
    const bookID = filenameMain.slice(2, 5);
    userLog(`checkFileContents have SFM bookcode=${bookID}`);
    //parameterAssert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResultObject = await checkUSFMText(username, adjustedLanguageCode, repoCode, bookID, filepath, fileContent, ourCFLocation, newCheckingOptions);
  } else if (filenameLower.endsWith('.md'))
    if ((repoCode === 'UHAL' && filename[0] === 'H' && filename.length === 8)
      || (repoCode === 'UGL' && filename === '01.md'))
      checkFileResultObject = await checkLexiconFileContents(username, BPLanguageCode, repoCode, filepath, fileContent, ourCFLocation, newCheckingOptions);
    else
      checkFileResultObject = await checkMarkdownFileContents(username, BPLanguageCode, repoCode, filepath, fileContent, ourCFLocation, newCheckingOptions);
  else if (filenameLower.endsWith('.txt'))
    checkFileResultObject = checkPlainText(username, BPLanguageCode, repoCode, 'text', filepath, fileContent, ourCFLocation, newCheckingOptions);
  else if (filenameLower === 'manifest.yaml')
    checkFileResultObject = await checkManifestText(username, BPLanguageCode, repoCode, repoName, branch, fileContent, ourCFLocation, newCheckingOptions); // don’t know username or branch
  else if (filenameLower.endsWith('.yaml'))
    checkFileResultObject = checkYAMLText(username, BPLanguageCode, repoCode, filepath, fileContent, ourCFLocation, newCheckingOptions);
  else if (filenameLower.startsWith('license')) {
    checkFileResultObject = await checkMarkdownFileContents(username, BPLanguageCode, repoCode, filepath, fileContent, ourCFLocation, newCheckingOptions);
    checkFileResultObject.noticeList.unshift({ priority: 982, message: "File extension is not recognized, so treated as markdown.", filename: filepath, location: ourCFLocation });
  } else {
    checkFileResultObject = checkPlainText(username, BPLanguageCode, repoCode, 'raw', filepath, fileContent, ourCFLocation, newCheckingOptions);
    checkFileResultObject.noticeList.unshift({ priority: 995, message: "File extension is not recognized, so treated as plain text.", filename: filepath, location: ourCFLocation });
  }
  // debugLog(`checkFileContents got initial results: ${JSON.stringify(checkFileResult)}`);
  // debugLog(`checkFileContents got initial results with ${checkFileResult.successList.length} success message(s) and ${checkFileResult.noticeList.length} notice(s)`);

  // Check for Unicode normalisation
  if (fileContent.normalize() !== fileContent) {
    let priority = 270;
    if (repoCode === 'UHB') priority = 170;
    else if (repoCode === 'UGNT') priority = 870;
    checkFileResultObject.noticeList.push({ priority, message: "File is not Unicode normalized", filename: filepath, location: givenLocation });
  }

  // Make sure that we have the filename in all of our notices (in case other files are being checked as well)
  /*
  function addFilenameField(noticeObjectParameter) {
    if (noticeObjectParameter.debugChain) noticeObjectParameter.debugChain = `checkFileContents ${noticeObjectParameter.debugChain}`;
    if (noticeObjectParameter.fieldName === filepath) delete noticeObjectParameter.fieldName;
    // aboutToOverwrite('checkFileContents', ['filename'], noticeObjectParameter, { filename: filepath });
    // TODO: Might we need to add username, repoName, or branch here ???
    return noticeObjectParameter.extra ? noticeObjectParameter : { ...noticeObjectParameter, filename: filepath }; // NOTE: might be an indirect check on a TA/TW article or UHAL/UGL entry
  }
  checkFileResultObject.noticeList = checkFileResultObject.noticeList.map(addFilenameField);
  */
  for (const noticeObject of checkFileResultObject.noticeList) {
    if (noticeObject.filename === undefined) noticeObject.filename = filepath;
  }

  // Add some extra fields to our checkFileResult object
  //  in case we need this information again later
  checkFileResultObject.checkedFileCount += 1;
  checkFileResultObject.checkedFilename = filepath;
  checkFileResultObject.checkedFilesize = fileContent.length;
  checkFileResultObject.checkedOptions = newCheckingOptions;

  checkFileResultObject.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
  // debugLog(`checkFileContents() returning ${JSON.stringify(checkFileResult)}`);
  return checkFileResultObject;
};
// end of checkFileContents()
