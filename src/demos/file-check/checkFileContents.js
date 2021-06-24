// eslint-disable-next-line no-unused-vars
import * as books from '../../core/books/books';
import {
  // eslint-disable-next-line no-unused-vars
  REPO_CODES_LIST,
  formRepoName,
  checkUSFMText, checkMarkdownFileContents, checkPlainText, checkYAMLText, checkManifestText,
  checkTN_TSV9Table, checkNotesTSV7Table, checkQuestionsTSV7Table, checkTWL_TSV6Table,
} from '../../core';
// eslint-disable-next-line no-unused-vars
import { userLog, debugLog, functionLog, parameterAssert, logicAssert } from '../../core';


// const CHECK_FILE_CONTENTS_VERSION_STRING = '0.4.4';


/**
 *
 * @param {string} username for Door43.org
 * @param {string} languageCode, e.g., 'en'
 * @param {string} repoCode, e.g., 'LT', 'TN', 'TN2', 'TQ', 'TWL', etc.
 * @param {string} branch, e.g., 'master'
 * @param {string} filename
 * @param {string} fileContent
 * @param {string} givenLocation
 * @param {Object} checkingOptions
 */
export async function checkFileContents(username, languageCode, repoCode, branch, filename, fileContent, givenLocation, checkingOptions) {
  // Determine the file type from the filename extension
  //  and return the results of checking that kind of file text
  // functionLog(`checkFileContents(un='${username}', lC='${languageCode}', rC='${repoCode}', rBr='${branch}', fn='${filename}', ${fileContent.length} chars, ${givenLocation}, ${JSON.stringify(checkingOptions)})…`);
  //parameterAssert(username !== undefined, "checkFileContents: 'username' parameter should be defined");
  //parameterAssert(typeof username === 'string', `checkFileContents: 'username' parameter should be a string not a '${typeof username}': ${username}`);
  //parameterAssert(languageCode !== undefined, "checkFileContents: 'languageCode' parameter should be defined");
  //parameterAssert(typeof languageCode === 'string', `checkFileContents: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  //parameterAssert(repoCode !== undefined, "checkFileContents: 'repoCode' parameter should be defined");
  //parameterAssert(typeof repoCode === 'string', `checkFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
  //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkFileContents: 'repoCode' parameter should not be '${repoCode}'`);
  //parameterAssert(branch !== undefined, "checkFileContents: 'branch' parameter should be defined");
  //parameterAssert(typeof branch === 'string', `checkFileContents: 'branch' parameter should be a string not a '${typeof branch}': ${branch}`);
  //parameterAssert(filename !== undefined, "checkFileContents: 'filename' parameter should be defined");
  //parameterAssert(typeof filename === 'string', `checkFileContents: 'filename' parameter should be a string not a '${typeof filename}': ${filename}`);
  //parameterAssert(fileContent !== undefined, "checkFileContents: 'fileContent' parameter should be defined");
  //parameterAssert(typeof fileContent === 'string', `checkFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}': ${fileContent.length}`);
  //parameterAssert(givenLocation !== undefined, "checkFileContents: 'givenLocation' parameter should be defined");
  //parameterAssert(typeof givenLocation === 'string', `checkFileContents: 'givenLocation' parameter should be a string not a '${typeof givenLocation}': ${givenLocation}`);
  //parameterAssert(checkingOptions !== undefined, "checkFileContents: 'checkingOptions' parameter should be defined");

  const startTime = new Date();

  let ourCFLocation = givenLocation;
  if (ourCFLocation[0] !== ' ') ourCFLocation = ' ' + ourCFLocation;

  const filenameLower = filename.toLowerCase();
  const repoName = formRepoName(languageCode, repoCode);

  let checkFileResult = { checkedFileCount: 0 };
  if (filenameLower.endsWith('.tsv')) {
    const filenameMain = filename.substring(0, filename.length - 4); // drop .tsv
    // functionLog(`checkFileContents have TSV filenameMain=${filenameMain}`);
    const bookID = filenameMain.startsWith(`${languageCode}_`) || filenameMain.startsWith('en_') ? filenameMain.substring(filenameMain.length - 3) : filenameMain.substring(filenameMain.length - 3, filenameMain.length).toUpperCase();
    // functionLog(`checkFileContents have TSV bookID=${bookID}`);
    //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    if (filename.startsWith(`${languageCode}_`) || filenameMain.startsWith('en_')) {
      logicAssert(repoCode === 'TN', `These filenames ${filenameMain} are only for TN ${repoCode}`);
      checkFileResult = await checkTN_TSV9Table(languageCode, repoCode, bookID, filename, fileContent, ourCFLocation, checkingOptions);
    } else {
      let adjustedRepoCode = repoCode;
      if (adjustedRepoCode.startsWith('OBS-'))
        adjustedRepoCode = adjustedRepoCode.substring(4); // Remove the 'OBS-' from the beginning
      logicAssert(adjustedRepoCode !== 'TN', `This code with ${filenameMain} is not for TN`);
      let checkFunction = {
        TN2: checkNotesTSV7Table, SN: checkNotesTSV7Table,
        TQ2: checkQuestionsTSV7Table, SQ: checkQuestionsTSV7Table,
        TWL: checkTWL_TSV6Table,
      }[adjustedRepoCode];
      checkFileResult = await checkFunction(languageCode, repoCode, bookID, filename, fileContent, ourCFLocation, checkingOptions);
    }
  }
  else if (filenameLower.endsWith('.usfm')) {
    const filenameMain = filename.substring(0, filename.length - 5); // drop .usfm
    // debugLog(`Have USFM filenameMain=${filenameMain}`);
    const bookID = filenameMain.substring(filenameMain.length - 3);
    // debugLog(`Have USFM bookcode=${bookID}`);
    //parameterAssert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResult = await checkUSFMText(languageCode, repoCode, bookID, filename, fileContent, ourCFLocation, checkingOptions);
  } else if (filenameLower.endsWith('.sfm')) {
    const filenameMain = filename.substring(0, filename.length - 4); // drop .sfm
    userLog(`checkFileContents have SFM filenameMain=${filenameMain}`);
    const bookID = filenameMain.substring(2, 5);
    userLog(`checkFileContents have SFM bookcode=${bookID}`);
    //parameterAssert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResult = await checkUSFMText(languageCode, repoCode, bookID, filename, fileContent, ourCFLocation, checkingOptions);
  } else if (filenameLower.endsWith('.md'))
    checkFileResult = await checkMarkdownFileContents(languageCode, repoCode, filename, fileContent, ourCFLocation, checkingOptions);
  else if (filenameLower.endsWith('.txt'))
    checkFileResult = checkPlainText(languageCode, repoCode, 'text', filename, fileContent, ourCFLocation, checkingOptions);
  else if (filenameLower === 'manifest.yaml')
    checkFileResult = await checkManifestText(languageCode, repoCode, username, repoName, branch, fileContent, ourCFLocation, checkingOptions); // don’t know username or branch
  else if (filenameLower.endsWith('.yaml'))
    checkFileResult = checkYAMLText(languageCode, repoCode, filename, fileContent, ourCFLocation, checkingOptions);
  else {
    checkFileResult = checkPlainText(languageCode, repoCode, 'raw', filename, fileContent, ourCFLocation, checkingOptions);
    checkFileResult.noticeList.unshift({ priority: 995, message: "File extension is not recognized, so treated as plain text.", filename, location: filename });
  }
  // debugLog(`checkFileContents got initial results: ${JSON.stringify(checkFileResult)}`);
  // debugLog(`checkFileContents got initial results with ${checkFileResult.successList.length} success message(s) and ${checkFileResult.noticeList.length} notice(s)`);

  // Make sure that we have the filename in all of our notices (in case other files are being checked as well)
  function addFilenameField(noticeObject) {
    if (noticeObject.debugChain) noticeObject.debugChain = `checkFileContents ${noticeObject.debugChain}`;
    if (noticeObject.fieldName === filename) delete noticeObject.fieldName;
    // TODO: Might we need to add username, repoName, or branch here ???
    return noticeObject.extra ? noticeObject : { ...noticeObject, filename }; // NOTE: might be an indirect check on a TA or TW article
  }
  checkFileResult.noticeList = checkFileResult.noticeList.map(addFilenameField);

  // Add some extra fields to our checkFileResult object
  //  in case we need this information again later
  checkFileResult.checkedFileCount += 1;
  checkFileResult.checkedFilename = filename;
  checkFileResult.checkedFilesize = fileContent.length;
  checkFileResult.checkedOptions = checkingOptions;

  checkFileResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
  // debugLog(`checkFileContents() returning ${JSON.stringify(checkFileResult)}`);
  return checkFileResult;
};
// end of checkFileContents()
