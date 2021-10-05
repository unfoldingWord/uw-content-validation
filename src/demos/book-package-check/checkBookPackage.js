import React from 'react';
// eslint-disable-next-line no-unused-vars
import { REPO_CODES_LIST, CATALOG_NEXT_ONLY_REPO_CODES_LIST } from '../../core/defaults';
import * as books from '../../core/books/books';
import { formRepoName, repositoryExistsOnDoor43, getFileListFromZip, cachedGetFile, cachedGetBookFilenameFromManifest, checkManifestText, checkMarkdownFileContents } from '../../core';
import { checkFileContents } from '../file-check/checkFileContents';
import { checkRepo } from '../repo-check/checkRepo';
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, parameterAssert, logicAssert, aboutToOverwrite } from '../../core/utilities';


// const BP_VALIDATOR_VERSION_STRING = '0.9.7';

const STANDARD_MANIFEST_FILENAME = 'manifest.yaml';


/*
    checkBookPackage
*/
/**
 *
 * @param {string} username, e.g., 'unfoldingWord'
 * @param {string} languageCode, e.g., 'en'
 * @param {string} bookID -- 3-character USFM book ID or 'OBS'
 * @param {Function} setResultValue function
 * @param {Object} checkingOptions -- can contain: getFile (function), originalLanguageRepoUsername, taRepoUsername, checkManifestFlag
 * @return {Object} - containing successList and noticeList
 */
export async function checkBookPackage(username, languageCode, bookID, setResultValue, checkingOptions) {
  /*
  Note: You may want to run clearCaches() and/or preloadReposIfNecessary() before running this function???

  Note that bookID here can also be the 'OBS' pseudo bookID.
  */
  // functionLog(`checkBookPackage(un='${username}', lC='${languageCode}', bk='${bookID}', (fn), ${JSON.stringify(checkingOptions)})…`)
  //parameterAssert(username !== undefined, "checkBookPackage: 'username' parameter should be defined");
  //parameterAssert(typeof username === 'string', `checkBookPackage: 'username' parameter should be a string not a '${typeof username}': ${username}`);
  //parameterAssert(languageCode !== undefined, "checkBookPackage: 'languageCode' parameter should be defined");
  //parameterAssert(typeof languageCode === 'string', `checkBookPackage: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  //parameterAssert(bookID !== undefined, "checkBookPackage: 'bookID' parameter should be defined");
  //parameterAssert(typeof bookID === 'string', `checkBookPackage: 'bookID' parameter should be a string not a '${typeof bookID}': ${bookID}`);
  //parameterAssert(bookID.length === 3, `checkBookPackage: 'bookID' parameter should be three characters long not ${bookID.length}`);
  //parameterAssert(bookID.toUpperCase() === bookID, `checkBookPackage: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
  //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkBookPackage: '${bookID}' is not a valid USFM book identifier`);

  let abortFlag = false;
  const startTime = new Date();
  bookID = bookID.toUpperCase(); // normalise to USFM standard

  let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0, checkedRepoNames = new Set();
  let checkBookPackageResult = { successList: [], noticeList: [] };

  let dataSet = checkingOptions?.dataSet; // Can be 'DEFAULT', 'OLD' (Markdown, etc.), 'NEW' (TSV only), or 'BOTH'
  if (!dataSet) dataSet = 'DEFAULT';

  const newCheckingOptions = checkingOptions ? { ...checkingOptions } : {}; // clone before modify
  const getFile_ = newCheckingOptions.getFile ? newCheckingOptions.getFile : cachedGetFile; // default to using caching of files
  newCheckingOptions.getFile = getFile_; // use same getFile_ when we call core functions
  if (!newCheckingOptions.originalLanguageRepoUsername) newCheckingOptions.originalLanguageRepoUsername = username;
  if (!newCheckingOptions.taRepoUsername) newCheckingOptions.taRepoUsername = username;
  if (!newCheckingOptions.twRepoUsername) newCheckingOptions.twRepoUsername = username;

  // No point in passing the branch through as a parameter
  //  coz if it’s not 'master', it’s unlikely to be common for all the repos
  let originalBranch = 'master';

  // If it’s a big book, drop this location string to reduce memory use in case of thousands of errors
  let generalLocation = bookID === 'OBS' ? ` in ${languageCode} ${bookID} from ${username} ${originalBranch} branch` :
    books.chaptersInBook(bookID) > 10 ? '' : ` in ${languageCode} ${bookID} book package from ${username} ${originalBranch} branch`;


  function addSuccessMessage(successString) {
    // functionLog(`checkBookPackage success: ${successString}`);
    checkBookPackageResult.successList.push(successString);
  }


  function addNoticePartial(incompleteNoticeObject) {
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // functionLog(`checkBookPackage addNoticePartial: (priority=${incompleteNoticeObject.priority}) ${incompleteNoticeObject.bookID} ${incompleteNoticeObject.C}:${incompleteNoticeObject.V} ${incompleteNoticeObject.message}${incompleteNoticeObject.characterIndex > 0 ? ` (at character ${incompleteNoticeObject.characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
    //parameterAssert(incompleteNoticeObject.priority !== undefined, "cBP addNoticePartial: 'priority' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `cBP addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}': ${incompleteNoticeObject.priority}`);
    //parameterAssert(incompleteNoticeObject.message !== undefined, "cBP addNoticePartial: 'message' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.message === 'string', `cBP addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}': ${incompleteNoticeObject.message}`);
    // parameterAssert(bookID !== undefined, "cBP addNoticePartial: 'bookID' parameter should be defined");
    if (incompleteNoticeObject.bookID) {
      //parameterAssert(typeof incompleteNoticeObject.bookID === 'string', `cBP addNoticePartial: 'bookID' parameter should be a string not a '${typeof incompleteNoticeObject.bookID}': ${incompleteNoticeObject.bookID}`);
      //parameterAssert(incompleteNoticeObject.bookID.length === 3, `cBP addNoticePartial: 'bookID' parameter should be three characters long not ${incompleteNoticeObject.bookID.length}`);
      //parameterAssert(bookID === 'OBS' || books.isValidBookID(incompleteNoticeObject.bookID), `cBP addNoticePartial: '${incompleteNoticeObject.bookID}' is not a valid USFM book identifier`);
    }
    // parameterAssert(C !== undefined, "cBP addNoticePartial: 'C' parameter should be defined");
    if (incompleteNoticeObject.C) {
      parameterAssert(typeof incompleteNoticeObject.C === 'string', `cBP addNoticePartial: 'C' parameter should be a string not a '${typeof incompleteNoticeObject.C}': ${incompleteNoticeObject.C}`);
    }
    // parameterAssert(V !== undefined, "cBP addNoticePartial: 'V' parameter should be defined");
    if (incompleteNoticeObject.V) {
      parameterAssert(typeof incompleteNoticeObject.V === 'string', `cBP addNoticePartial: 'V' parameter should be a string not a '${typeof incompleteNoticeObject.V}': ${incompleteNoticeObject.V}`);
    }
    // parameterAssert(characterIndex !== undefined, "cBP addNoticePartial: 'characterIndex' parameter should be defined");
    if (incompleteNoticeObject.characterIndex) {
      parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `cBP addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}': ${incompleteNoticeObject.characterIndex}`);
    }
    // parameterAssert(excerpt !== undefined, "cBP addNoticePartial: 'excerpt' parameter should be defined");
    if (incompleteNoticeObject.excerpt) {
      parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `cBP addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}': ${incompleteNoticeObject.excerpt}`);
    }
    //parameterAssert(incompleteNoticeObject.location !== undefined, "cBP addNoticePartial: 'location' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.location === 'string', `cBP addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}': ${incompleteNoticeObject.location}`);
    //parameterAssert(incompleteNoticeObject.extra !== undefined, "cBP addNoticePartial: 'extra' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.extra === 'string', `cBP addNoticePartial: 'extra' parameter should be a string not a '${typeof incompleteNoticeObject.extra}': ${incompleteNoticeObject.extra}`);
    if (incompleteNoticeObject.debugChain) incompleteNoticeObject.debugChain = `checkBookPackage ${incompleteNoticeObject.debugChain}`;
    aboutToOverwrite('checkBookPackage', ['bookID', 'username'], incompleteNoticeObject, { bookID, username });
    checkBookPackageResult.noticeList.push({ ...incompleteNoticeObject, bookID, username });
  }


  async function ourCheckBPFileContents(username, languageCode, repoCode, repoName, repoBranch, cfFilename, fileContent, fileLocation, checkingOptions) {
    // functionLog(`checkBookPackage ourCheckBPFileContents(rC='${repoCode}', rN='${repoName}', rBr='${repoBranch}', fn='${cfFilename}', ${fileContent.length}, ${fileLocation}, ${JSON.stringify(checkingOptions)})…`);

    // Updates the global list of notices
    //parameterAssert(repoCode !== undefined, "cBP ourCheckBPFileContents: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `cBP ourCheckBPFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `cBP ourCheckBPFileContents: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(repoName !== undefined, "cBP ourCheckBPFileContents: 'repoName' parameter should be defined");
    //parameterAssert(typeof repoName === 'string', `cBP ourCheckBPFileContents: 'repoName' parameter should be a string not a '${typeof repoName}': ${repoName}`);
    //parameterAssert(repoBranch !== undefined, "cBP ourCheckBPFileContents: 'repoBranch' parameter should be defined");
    //parameterAssert(typeof repoBranch === 'string', `cBP ourCheckBPFileContents: 'repoBranch' parameter should be a string not a '${typeof repoBranch}': ${repoBranch}`);
    //parameterAssert(cfFilename !== undefined, "cBP ourCheckBPFileContents: 'cfFilename' parameter should be defined");
    //parameterAssert(typeof cfFilename === 'string', `cBP ourCheckBPFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
    //parameterAssert(fileContent !== undefined, "cBP ourCheckBPFileContents: 'fileContent' parameter should be defined");
    //parameterAssert(typeof fileContent === 'string', `cBP ourCheckBPFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}'`);
    //parameterAssert(fileLocation !== undefined, "cBP ourCheckBPFileContents: 'fileLocation' parameter should be defined");
    //parameterAssert(typeof fileLocation === 'string', `cBP ourCheckBPFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "cBP ourCheckBPFileContents: 'checkingOptions' parameter should be defined");

    let adjustedLanguageCode = languageCode;
    // if (repoCode === 'UHB') adjustedLanguageCode = 'hbo'; // NO -- we need the languageCode of the BP being checked (so we can resolve TW links with * for language) !!!
    // else if (repoCode === 'UGNT') adjustedLanguageCode = 'el-x-koine';
    const cfcResultObject = await checkFileContents(username, adjustedLanguageCode, repoCode, repoBranch, cfFilename, fileContent, fileLocation, checkingOptions);
    // debugLog("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
    // for (const successEntry of cfResultObject.successList) debugLog("  ourCheckBPFileContents:", successEntry);
    // debugLog("cfcResultObject", JSON.stringify(cfcResultObject));

    // Process noticeList line by line,  appending the repoCode as an extra field as we go
    for (const cfcNoticeEntry of cfcResultObject.noticeList) // noticeEntry is an object
      if (cfcNoticeEntry.extra) // it must be an indirect check on a TA/TW article from a TN2 check or UHAL/UGL lexicon check
        checkBookPackageResult.noticeList.push(cfcNoticeEntry); // Just copy the complete notice as is
      else // For our direct checks, we add the repoCode as an extra value (unless it’s already there from a TA or TW check)
        addNoticePartial({ ...cfcNoticeEntry, repoCode, repoName, branch: repoBranch, filename: cfFilename, extra: cfcNoticeEntry.extra ? cfcNoticeEntry.extra : repoCode });

    // The following is needed coz we might be checking the linked TA/TW articles from TN2 TSV files or UHAL/UGL entries
    if (cfcResultObject.checkedFileCount && cfcResultObject.checkedFileCount > 0) {
      checkedFileCount += cfcResultObject.checkedFileCount;
      // TODO: How could we distinguish these different sources below???
      addSuccessMessage(`Checked ${cfcResultObject.checkedFileCount} linked TA/TW articles or HALx/GkLx entries`);
    }
    if (cfcResultObject.checkedFilesizes && cfcResultObject.checkedFilesizes > 0) totalCheckedSize += cfcResultObject.checkedFilesizes;
    if (cfcResultObject.checkedRepoNames && cfcResultObject.checkedRepoNames.length > 0)
      for (const checkedRepoName of cfcResultObject.checkedRepoNames)
        // try { if (checkedRepoNames.indexOf(checkedRepoName) < 0) checkedRepoNames.push(checkedRepoName); }
        // catch { checkedRepoNames = [checkedRepoName]; }
        checkedRepoNames.add(checkedRepoName);
    if (cfcResultObject.checkedFilenameExtensions && cfcResultObject.checkedFilenameExtensions.length > 0)
      for (const checkedFilenameExtension of cfcResultObject.checkedFilenameExtensions)
        checkedFilenameExtensions.add(checkedFilenameExtension);
  }
  // end of ourCheckBPFileContents function


  /**
   *
   * @param {string} repoCode, e.g., 'TA'
   * @param {string} repoName, e.g., 'en_ta'
   * @param {string} repoBranch, e.g., 'master'
   * @param {string} manifestLocation
   * @param {Object} checkingOptions
   */
  async function ourCheckManifestFile(username, repoCode, repoName, repoBranch, manifestLocation, checkingOptions) {
    // Updates the global list of notices
    // functionLog(`checkBookPackage ourCheckManifestFile(${repoCode}, ${repoName}, ${repoBranch}, ${manifestLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(repoCode !== undefined, "cBP ourCheckManifestFile: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `cBP ourCheckManifestFile: 'repoCode' parameter should be a string not a '${typeof repoCode}' : ${repoCode}`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `cBP ourCheckManifestFile: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(repoName !== undefined, "cBP ourCheckManifestFile: 'repoName' parameter should be defined");
    //parameterAssert(typeof repoName === 'string', `cBP ourCheckManifestFile: 'repoName' parameter should be a string not a '${typeof repoName}': ${repoName}`);
    //parameterAssert(repoBranch !== undefined, "cBP ourCheckManifestFile: 'repoBranch' parameter should be defined");
    //parameterAssert(typeof repoBranch === 'string', `cBP ourCheckManifestFile: 'repoBranch' parameter should be a string not a '${typeof repoBranch}': ${repoBranch}`);
    //parameterAssert(manifestLocation !== undefined, "cBP ourCheckManifestFile: 'manifestLocation' parameter should be defined");
    //parameterAssert(typeof manifestLocation === 'string', `cBP ourCheckManifestFile: 'manifestLocation' parameter should be a string not a '${typeof manifestLocation}'`);

    let manifestFileContent;
    try {
      // debugLog("checkBookPackage ourCheckManifestFile about to fetch manifest", username, repoName, repoBranch);
      manifestFileContent = await getFile_({ username, repository: repoName, path: STANDARD_MANIFEST_FILENAME, branch: repoBranch });
      // debugLog("checkBookPackage ourCheckManifestFile fetched content for manifest", username, repoName, repoBranch, typeof manifestFileContent, manifestFileContent.length);
      // debugLog(manifestFileContent);
    } catch (cBPgfError) { // NOTE: The error can depend on whether the zipped repo is cached or not
      console.error(`checkBookPackage ourCheckManifestFile(${username}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)}) failed to load manifest`, username, repoName, repoBranch, cBPgfError + '');
      if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
        checkBookPackageResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", username, repoCode, repoName, location: manifestLocation, extra: repoCode });
      else {
        const notice = { priority: 996, message: "Unable to load file", username, repoName, filename: STANDARD_MANIFEST_FILENAME, location: manifestLocation, extra: repoCode };
        // eslint-disable-next-line eqeqeq
        if (cBPgfError != 'TypeError: repoFileContent is null') notice.details = `error=${cBPgfError}`;
        addNoticePartial(notice);
      }
    }
    if (manifestFileContent) {
      const cmtResultObject = await checkManifestText(languageCode, repoCode, username, repoName, repoBranch, manifestFileContent, manifestLocation, checkingOptions);
      // debugLog(`ourCheckManifestFile checkManifestText(${repoName}) returned ${cmtResultObject.successList.length} success message(s) and ${cmtResultObject.noticeList.length} notice(s)`);
      // debugLog(`ourCheckManifestFile checkManifestText(${repoName}) returned ${JSON.stringify(cmtResultObject)}`);
      // NOTE: We ignore the returned success messages here
      // for (const successEntry of cfResultObject.successList) debugLog("  ourCheckBPFileContents:", successEntry);
      // debugLog("cfcResultObject", JSON.stringify(cfcResultObject));

      // Process noticeList line by line,  appending the repoCode as an extra field as we go
      for (const cfcNoticeEntry of cmtResultObject.noticeList) {
        // NOTE: We don’t use addNoticePartial, because it adds a misleading BookID
        // addNoticePartial({ ...cfcNoticeEntry, filename: STANDARD_MANIFEST_FILENAME, extra: `${repoCode} MANIFEST` });
        checkBookPackageResult.noticeList.push({ ...cfcNoticeEntry, username, repoCode, repoName, filename: STANDARD_MANIFEST_FILENAME, extra: `${repoCode} MANIFEST` });
      }
      return manifestFileContent.length;
    }
    // NOTE: We don’t use addNoticePartial, because it adds a misleading BookID
    // addNoticePartial({ priority: 956, message: "Got empty manifest file", repoName, filename: STANDARD_MANIFEST_FILENAME, location: manifestLocation, extra: `${repoCode} MANIFEST` });
    checkBookPackageResult.noticeList.push({ priority: 956, message: "Got empty manifest file", repoName, filename: STANDARD_MANIFEST_FILENAME, location: manifestLocation, extra: `${repoCode} MANIFEST` });
    return 0;
  }
  // end of ourCheckManifestFile function


  /**
     *
     * @param {string} repoCode, e.g., 'TA'
     * @param {string} repoName, e.g., 'en_ta'
     * @param {string} repoBranch, e.g., 'master'
     * @param {string} filename, e.g., 'README.md'
     * @param {string} markdownLocation
     * @param {Object} checkingOptions
     */
  async function ourCheckMarkdownFile(username, repoCode, repoName, repoBranch, filename, markdownLocation, checkingOptions) {
    // Updates the global list of notices
    // functionLog(`checkBookPackage ourCheckMarkdownFile(${repoCode}, ${repoName}, ${filename}, ${repoBranch}, ${markdownLocation}, ${JSON.stringify(checkingOptions)})…`);
    //parameterAssert(repoCode !== undefined, "cBP ourCheckMarkdownFile: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `cBP ourCheckMarkdownFile: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `cBP ourCheckMarkdownFile: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(repoName !== undefined, "cBP ourCheckMarkdownFile: 'repoName' parameter should be defined");
    //parameterAssert(typeof repoName === 'string', `cBP ourCheckMarkdownFile: 'repoName' parameter should be a string not a '${typeof repoName}'`);
    //parameterAssert(repoBranch !== undefined, "cBP ourCheckMarkdownFile: 'repoBranch' parameter should be defined");
    //parameterAssert(typeof repoBranch === 'string', `cBP ourCheckMarkdownFile: 'repoBranch' parameter should be a string not a '${typeof repoBranch}'`);
    //parameterAssert(filename !== undefined, "cBP ourCheckMarkdownFile: 'filename' parameter should be defined");
    //parameterAssert(typeof filename === 'string', `cBP ourCheckMarkdownFile: 'filename' parameter should be a string not a '${typeof filename}': ${filename}`);
    //parameterAssert(markdownLocation !== undefined, "cBP ourCheckMarkdownFile: 'markdownLocation' parameter should be defined");
    //parameterAssert(typeof markdownLocation === 'string', `cBP ourCheckMarkdownFile: 'markdownLocation' parameter should be a string not a '${typeof markdownLocation}'`);

    let markdownFileContent;
    try {
      // debugLog("checkBookPackage ourCheckMarkdownFile about to fetch markdown file", username, repoName, repoBranch, filename);
      markdownFileContent = await getFile_({ username, repository: repoName, path: filename, branch: repoBranch });
      // debugLog("checkBookPackage ourCheckMarkdownFile fetched markdown content", username, repoName, repoBranch, filename, typeof markdownFileContent, markdownFileContent.length);
      // debugLog(markdownFileContent);
    } catch (cBPgfError) { // NOTE: The error can depend on whether the zipped repo is cached or not
      console.error(`checkBookPackage ourCheckMarkdownFile(${username}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)}) failed to load markdown`, username, repoName, filename, originalBranch, cBPgfError + '');
      if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
        checkBookPackageResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", username, repoCode, repoName, location: markdownLocation, extra: repoCode });
      else {
        const notice = { priority: 996, message: "Unable to load file", username, repoName, filename, location: markdownLocation, extra: repoCode };
        // eslint-disable-next-line eqeqeq
        if (cBPgfError != 'TypeError: repoFileContent is null') notice.details = `error=${cBPgfError}`;
        addNoticePartial(notice);
      }
    }
    if (markdownFileContent) {
      const cmtResultObject = await checkMarkdownFileContents(languageCode, repoCode, filename.slice(0, filename.length - 3), markdownFileContent, markdownLocation, checkingOptions);
      // debugLog(`ourCheckMarkdownFile checkMarkdownFileContents(${repoName}) returned ${cmtResultObject.successList.length} success message(s) and ${cmtResultObject.noticeList.length} notice(s)`);
      // debugLog(`ourCheckMarkdownFile checkMarkdownFileContents(${repoName}) returned ${JSON.stringify(cmtResultObject)}`);
      // NOTE: We ignore the returned success messages here
      // for (const successEntry of cfResultObject.successList) debugLog("  ourCheckBPFileContents:", successEntry);
      // debugLog("cfcResultObject", JSON.stringify(cfcResultObject));

      // Process noticeList line by line,  appending the repoCode as an extra field as we go
      for (const cfcNoticeEntry of cmtResultObject.noticeList) {
        // NOTE: We don’t use addNoticePartial, because it adds a misleading BookID
        // addNoticePartial({ ...cfcNoticeEntry, filename, extra: `${repoCode} markdown` });
        checkBookPackageResult.noticeList.push({ ...cfcNoticeEntry, username, repoCode, repoName, filename, extra: repoCode });
      }

      if (filename === 'LICENSE.md') {
        const thisYear = (new Date()).getFullYear();
        const fullYearString = `${thisYear}`;
        // debugLog(`Year ${fullYearString} is ${typeof fullYearString}`);
        if (markdownFileContent.indexOf(fullYearString) === -1 && markdownFileContent.indexOf(`${thisYear - 1}`) === -1) // Can’t find this year or previous year in file
          // NOTE: We don’t use addNoticePartial, because it adds a misleading BookID
          checkBookPackageResult.noticeList.push({ priority: 256, message: "Possibly missing current copyright year", details: `possibly expecting '${fullYearString}'`, username, repoName, filename, location: markdownLocation, extra: repoCode });
      }

      return markdownFileContent.length;
    }
    // NOTE: We don’t use addNoticePartial, because it adds a misleading BookID
    // addNoticePartial({ priority: 956, message: "Got empty markdown file", repoName, filename, location: markdownLocation, extra: `${repoCode} markdown` });
    checkBookPackageResult.noticeList.push({ priority: 956, message: "Got empty markdown file", repoName, filename, location: markdownLocation, extra: repoCode });
    return 0;
  }
  // end of ourCheckMarkdownFile function


  // Main code for checkBookPackage()
  // NOTE: TN used here for the old resource formats, e.g., 9-column TSV TN2
  //        The TN2, TQ, SN, and if (linkBookCode.length) repoCodes refer to the new 7-column notes TSV formats.
  // debugLog("checkBookPackage() main code…");
  let repoCodeList;
  let bookNumberAndName, whichTestament;
  if (bookID === 'OBS') {
    // NOTE: No code below to handle OBS TN and TQ which are markdown repos
    if (dataSet === 'DEFAULT')
      repoCodeList = ['OBS', 'OBS-TWL', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'];
    else if (dataSet === 'OLD')
      repoCodeList = ['OBS', 'OBS-TN1', 'OBS-TQ1', 'OBS-SN1', 'OBS-SQ1'];
    else if (dataSet === 'NEW')
      repoCodeList = ['OBS', 'OBS-TWL', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'];
    else if (dataSet === 'BOTH')
      repoCodeList = ['OBS', 'OBS-TWL', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'];
  } else { // not OBS
    // We also need to know the number for USFM books
    try {
      bookNumberAndName = books.usfmNumberName(bookID);
      whichTestament = books.testament(bookID); // returns 'old' or 'new'
    } catch (bNNerror) {
      if (books.isValidBookID(bookID)) // must be in FRT, BAK, etc.
        whichTestament = 'other'
      else {
        addNoticePartial({ priority: 902, message: "Bad function call: should be given a valid book abbreviation", excerpt: bookID, location: ` (not '${bookID}')${generalLocation}` }); return checkBookPackageResult;
      }
    }
    // debugLog(`checkBookPackage: bookNumberAndName='${bookNumberAndName}' (${whichTestament} testament)`);

    // So now we want to work through checking this one specified Bible book in various repos
    const origLangRepoCode = whichTestament === 'old' ? 'UHB' : 'UGNT';
    if (dataSet === 'DEFAULT')
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'TWL', 'LT', 'ST', 'TN', 'TQ', 'SN', 'SQ'] : [origLangRepoCode, 'LT', 'ST', 'TN', 'TQ'];
    else if (dataSet === 'OLD')
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'TWL', 'LT', 'ST', 'TN', 'TQ1'] : [origLangRepoCode, 'LT', 'ST', 'TN', 'TQ1'];
    else if (dataSet === 'NEW')
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'TWL', 'LT', 'ST', 'TN2', 'TQ', 'SN', 'SQ'] : [origLangRepoCode, 'LT', 'ST', 'TN', 'TQ'];
    else if (dataSet === 'BOTH')
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'TWL', 'LT', 'ST', 'TN2', 'TN', 'TQ', 'SN', 'SQ'] : [origLangRepoCode, 'LT', 'ST', 'TN', 'TQ'];
  }


  // Main loop for checkBookPackage()
  const checkedManifestDetails = [];
  let numCheckedRepos = 0;
  for (const thisRepoCode of repoCodeList) {
    // debugLog(`checkBookPackage for ${bookID} got repoCode=${thisRepoCode} abortFlag=${abortFlag} from ${repoCodeList}`);
    // if (thisRepoCode !== 'UGNT') continue;
    if (abortFlag) break;

    let adjustedUsername = username, adjustedRepoCode = thisRepoCode, adjustedBranch = originalBranch;
    if (username === 'Door43-Catalog' && CATALOG_NEXT_ONLY_REPO_CODES_LIST.includes(thisRepoCode) && languageCode === 'en') {
      userLog(`checkBookPackage: switching ${thisRepoCode} username from 'Door43-Catalog' to 'unfoldingWord'`);
      adjustedUsername = 'unfoldingWord';
      // TODO: Ideally we should also make it get the latest release (rather than master)
    }
    if (adjustedRepoCode.endsWith('1')) {
      adjustedRepoCode = adjustedRepoCode.slice(0, adjustedRepoCode.length - 1); // Remove the '1' from the end
      // generalLocation = generalLocation.replace(originalBranch, adjustedBranch);
    } else if (adjustedRepoCode.endsWith('2')) {
      adjustedRepoCode = adjustedRepoCode.slice(0, adjustedRepoCode.length - 1); // Remove the '2' from the end
      adjustedBranch = 'newFormat';
      generalLocation = generalLocation.replace(originalBranch, adjustedBranch);
    }
    // } else // doesn’t end with 1 or 2
    //   generalLocation = generalLocation.replace(adjustedBranch, originalBranch);
    let repoName = formRepoName(languageCode, adjustedRepoCode);
    const repoLocation = ` in ${thisRepoCode}${generalLocation}`;
    if (adjustedRepoCode.startsWith('OBS-'))
      adjustedRepoCode = adjustedRepoCode.slice(4); // Remove the 'OBS-' from the beginning
    if ((adjustedRepoCode === 'UHB' || adjustedRepoCode === 'UGNT')
      && adjustedUsername !== 'Door43-Catalog' && adjustedUsername !== 'unfoldingWord') {
      userLog(`checkBookPackage: switching ${adjustedRepoCode} username from '${adjustedUsername}' to 'Door43-Catalog'`);
      adjustedUsername = 'Door43-Catalog';
    }
    // if (bookID === 'OBS' && dataSet === 'OLD' && repoCode !== 'OBS' && repoCode !== 'TWL' && repoName === `${languageCode}_${adjustedRepoCode.toLowerCase()}`)
    //   repoName = `${languageCode}_obs-${adjustedRepoCode.toLowerCase()}`;
    userLog(`checkBookPackage: check ${languageCode} ${bookID} in ${thisRepoCode} (${adjustedRepoCode}) from ${adjustedUsername} ${repoName} ${adjustedBranch}…`);

    // Update our "waiting" message
    setResultValue(<p style={{ color: 'magenta' }}>Checking <i>{adjustedUsername}</i> {languageCode} <b>{bookID}</b> book package in <b>{thisRepoCode}</b> (checked <b>{numCheckedRepos}</b>/{repoCodeList.length} repos)…</p>);

    let filename;
    if (thisRepoCode === 'UHB' || thisRepoCode === 'UGNT' || thisRepoCode === 'LT' || thisRepoCode === 'ST')
      // TODO: Might we need specific releases/tags for some of these (e.g., from the TN2 manifest)???
      // TODO: Do we need to hard-code where to find the UHB and UGNT???
      filename = `${bookNumberAndName}.usfm`;
    else if (adjustedRepoCode === 'TWL' || thisRepoCode.endsWith('TN2') || thisRepoCode.endsWith('TQ') || adjustedRepoCode === 'SN' || adjustedRepoCode === 'SQ' || thisRepoCode === 'OBS-TN')
      filename = `${adjustedRepoCode.toLowerCase()}_${bookID}.tsv`
    else if (adjustedRepoCode === 'TN' && !thisRepoCode.startsWith('OBS-')) {
      try {
        filename = await cachedGetBookFilenameFromManifest({ username: adjustedUsername, repository: repoName, branch: originalBranch, bookID: bookID.toLowerCase() });
        logicAssert(filename.startsWith(`${languageCode}_`), `Expected TN filename '${filename}' to start with the language code '${languageCode}_'`);
      } catch (e) {
        // console.error(`cachedGetBookFilenameFromManifest failed with: ${e}`);
        filename = `${languageCode}_tn_${bookNumberAndName}.tsv`; // Take a guess
      }
      logicAssert(filename.endsWith('.tsv'), `Expected TN filename '${filename}' to end with '.tsv'`);
    }

    if (thisRepoCode === 'OBS') {
      // debugLog("Calling OBS checkRepo()…");
      const crResultObject = await checkRepo(adjustedUsername, `${languageCode}_obs`, originalBranch, generalLocation, setResultValue, newCheckingOptions); // Adds the notices to checkBookPackageResult
      // debugLog(`checkRepo('OBS') returned ${crResultObject.successList.length} success message(s) and ${crResultObject.noticeList.length} notice(s)`);
      // debugLog(`crResultObject keys: ${JSON.stringify(Object.keys(crResultObject))}`);
      // debugLog(`crResultObject checkedRepoNames: ${crResultObject.checkedRepoNames}`);
      checkBookPackageResult.successList = checkBookPackageResult.successList.concat(crResultObject.successList);
      checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(crResultObject.noticeList);
      if (crResultObject.checkedFileCount > 0) {
        checkedFilenames = checkedFilenames.concat(crResultObject.checkedFilenames);
        checkedFilenameExtensions = new Set([...checkedFilenameExtensions, ...crResultObject.checkedFilenameExtensions]);
        checkedFileCount += crResultObject.checkedFileCount;
        totalCheckedSize += crResultObject.totalCheckedSize;
        checkedRepoNames.add(repoName);
      }
      addSuccessMessage(`Checked ${languageCode} OBS repo from ${adjustedUsername}`);
    } else if (thisRepoCode === 'TQ1'
      || thisRepoCode === 'OBS-TN1' || thisRepoCode === 'OBS-TQ1' || thisRepoCode === 'OBS-SN1' || thisRepoCode === 'OBS-SQ1') { // These are still markdown for now
      // This is the old markdown resource with hundreds/thousands of files
      const tqResultObject = await checkMarkdownBook(adjustedUsername, languageCode, thisRepoCode, repoName, originalBranch, bookID, newCheckingOptions);
      checkBookPackageResult.successList = checkBookPackageResult.successList.concat(tqResultObject.successList);
      checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(tqResultObject.noticeList);
      if (tqResultObject.checkedFileCount > 0) {
        checkedFilenames = checkedFilenames.concat(tqResultObject.checkedFilenames);
        checkedFilenameExtensions = new Set([...checkedFilenameExtensions, ...tqResultObject.checkedFilenameExtensions]);
        checkedFileCount += tqResultObject.checkedFileCount;
        totalCheckedSize += tqResultObject.totalCheckedSize;
        checkedRepoNames.add(repoName);
      }
    } else { // For repos other than OBS and TQ1, we only have one file to check
      logicAssert(filename?.length, `filename should be set by now for un=${adjustedUsername} rC=${thisRepoCode} aRC=${adjustedRepoCode} rN=${repoName} aBr=${adjustedBranch}`);
      let repoFileContent;
      try {
        // debugLog(`checkBookPackage about to fetch fileContent for aUN='${adjustedUsername}' rN='${repoName}' aB='${adjustedBranch}' fn='${filename}'`);
        repoFileContent = await getFile_({ username: adjustedUsername, repository: repoName, path: filename, branch: adjustedBranch });
        // debugLog(`checkBookPackage fetched fileContent for ${adjustedUsername}, ${repoName}, ${adjustedBranch}, ${filename}, ${typeof repoFileContent}, ${repoFileContent.length}`);
        checkedFilenames.push(filename);
        totalCheckedSize += repoFileContent.length;
        checkedRepoNames.add(repoName);
      } catch (cBPgfError) { // NOTE: The error can depend on whether the zipped repo is cached or not
        // debugLog(`checkBookPackage(${adjustedUsername}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)}) failed to load ${repoName}, ${filename}, ${adjustedBranch}, ${cBPgfError}`);
        // debugLog(`cBPgfError=${cBPgfError} or ${JSON.stringify(cBPgfError)} or2 ${cBPgfError === 'TypeError: repoFileContent is null'} or3 ${cBPgfError.message === 'TypeError: repoFileContent is null'} or4 ${cBPgfError.message === 'TypeError: repoFileContent is null'}`);
        // Next line has special code to handle book-package-check.test.js tests [so we don’t call repositoryExistsOnDoor43()]
        if ((cBPgfError + '').startsWith('Tests could not find') || ! await repositoryExistsOnDoor43({ username: adjustedUsername, repository: repoName }))
          checkBookPackageResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", username: adjustedUsername, repoCode: thisRepoCode, repoName, location: repoLocation, extra: thisRepoCode });
        else {
          const notice = { priority: thisRepoCode === 'SN' || thisRepoCode === 'SQ' ? 196 : 996, message: "Unable to load book package file", username: adjustedUsername, repoCode: thisRepoCode, repoName, filename, location: repoLocation, extra: thisRepoCode };
          // eslint-disable-next-line eqeqeq
          if (cBPgfError != 'TypeError: repoFileContent is null') notice.details = `error=${cBPgfError}`;
          addNoticePartial(notice);
        }
      }
      if (repoFileContent) {
        // debugLog(`checkBookPackage about to check ${repoFileContent.length} bytes for ${adjustedUsername}, ${repoName}, ${adjustedBranch}, ${filename}`);
        // We use the generalLocation here (does not include repo name) so that we can adjust the returned strings ourselves
        await ourCheckBPFileContents(adjustedUsername, languageCode, thisRepoCode, repoName, adjustedBranch, filename, repoFileContent, generalLocation, newCheckingOptions); // Adds the notices to checkBookPackageResult
        checkedFileCount += 1;
        checkedFilenameExtensions.add(filename.split('.').pop());
        addSuccessMessage(`Checked ${adjustedUsername !== username ? `${adjustedUsername} ` : ''}${thisRepoCode.toUpperCase()} file: ${filename}`);
      }
      else debugLog(`checkBookPackage: No fileContent to check for ${adjustedUsername}, ${repoName}, ${adjustedBranch}, ${filename}`);
    } // end of repo that's not OBS or TQ

    if (!newCheckingOptions?.disableAllLinkFetchingFlag) {
      // We also check the manifest file for each repo if requested
      //  because a faulty manifest might also stop a BP from working correctly in various programs
      if (!checkedManifestDetails.includes(repoName)) { // Don’t want to check more than once
        checkedManifestDetails.push(repoName); // Remember that we checked this one
        // debugLog(`Maybe checking MANIFEST etc. for ${repoName}`);

        if (newCheckingOptions?.checkManifestFlag) {
          // debugLog(`checkBookPackage: checking MANIFEST for ${adjustedUsername} ${repoName}`);
          const numCheckedCharacters = await ourCheckManifestFile(adjustedUsername, thisRepoCode, repoName, adjustedBranch, generalLocation, newCheckingOptions);
          if (numCheckedCharacters > 0) {
            checkedFileCount += 1;
            checkedFilenames.push('manifest.yaml');
            checkedFilenameExtensions.add('yaml');
            totalCheckedSize += numCheckedCharacters;
            addSuccessMessage(`Checked ${adjustedUsername !== username ? `${adjustedUsername} ` : ''}${repoName} manifest file`);
          }
        }
        // else debugLog(`NOT checking MANIFEST for ${repoName}`);

        // We can also check the README file for each repo if requested
        if (newCheckingOptions?.checkReadmeFlag) {
          // debugLog(`checkBookPackage: checking README for ${adjustedUsername} ${repoName}`);
          const filename = 'README.md';
          const numCheckedCharacters = await ourCheckMarkdownFile(adjustedUsername, thisRepoCode, repoName, adjustedBranch, filename, generalLocation, newCheckingOptions);
          if (numCheckedCharacters > 0) {
            checkedFileCount += 1;
            checkedFilenames.push(filename);
            checkedFilenameExtensions.add('md');
            totalCheckedSize += numCheckedCharacters;
            addSuccessMessage(`Checked ${adjustedUsername !== username ? `${adjustedUsername} ` : ''}${repoName} README file`);
          }
        }
        // else debugLog(`NOT checking README for ${repoName}`);

        // We can also check the LICENSE file for each repo if requested
        if (newCheckingOptions?.checkLicenseFlag) {
          // debugLog(`Checking LICENSE for ${adjustedUsername} ${repoName}`);
          const filename = 'LICENSE.md';
          const numCheckedCharacters = await ourCheckMarkdownFile(adjustedUsername, thisRepoCode, repoName, adjustedBranch, filename, generalLocation, newCheckingOptions);
          if (numCheckedCharacters > 0) {
            checkedFileCount += 1;
            checkedFilenames.push(filename);
            checkedFilenameExtensions.add('md');
            totalCheckedSize += numCheckedCharacters;
            addSuccessMessage(`Checked ${adjustedUsername !== username ? `${adjustedUsername} ` : ''}${repoName} LICENSE file`);
          }
        }
        // else debugLog(`NOT checking LICENSE for ${repoName}`);
      }
      // else debugLog(`ALREADY checked MANIFEST, etc. for ${repoName}`);
    } // end of linkFetching not disabled
    // else debugLog(`NOT fetching MANIFEST, etc. for ${repoName}`);

    numCheckedRepos += 1;
    // debugLog(`At end of loop having checked ${numCheckedRepos} repos`);
  } // end of repo loop


  // Add some extra fields to our checkFileResult object
  //  in case we need this information again later
  checkBookPackageResult.checkedFileCount = checkedFileCount;
  checkBookPackageResult.checkedFilenames = checkedFilenames;
  checkBookPackageResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
  checkBookPackageResult.checkedFilesizes = totalCheckedSize;
  checkBookPackageResult.checkedRepoNames = [...checkedRepoNames]; // convert Set to Array
  // checkBookPackageResult.checkedOptions = newCheckingOptions; // This is done at the caller level

  checkBookPackageResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
  // debugLog("checkBookPackageResult:", JSON.stringify(checkBookPackageResult));
  // debugLog(`checkBookPackageResult(${bookID}): elapsedSeconds = ${checkBookPackageResult.elapsedSeconds}, notices count = ${checkBookPackageResult.noticeList.length}`);
  return checkBookPackageResult;
};
// end of checkBookPackage()


/*
    checkMarkdownBook
*/
/**
 *
 * @param {string} username
 * @param {string} languageCode
 * @param {string} repoCode -- 'TQ' or 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'
 * @param {string} repoName
 * @param {string} branch
 * @param {string} bookID -- 3-character USFM book ID or 'OBS'
 * @param {Object} checkingOptions
 * @return {Object} - containing successList and noticeList
 */
async function checkMarkdownBook(username, languageCode, repoCode, repoName, branch, bookID, checkingOptions) {
  // functionLog(`checkBookPackage checkMarkdownBook(${username}, ${languageCode}, rC=${repoCode} rN=${repoName}, ${branch}, ${bookID}, ${JSON.stringify(checkingOptions)})…`)
  //parameterAssert(username !== undefined, "checkMarkdownBook: 'username' parameter should be defined");
  //parameterAssert(typeof username === 'string', `checkMarkdownBook: 'username' parameter should be a string not a '${typeof username}': '${username}'`);
  //parameterAssert(languageCode !== undefined, "checkMarkdownBook: 'languageCode' parameter should be defined");
  //parameterAssert(typeof languageCode === 'string', `checkMarkdownBook: 'languageCode' parameter should be a string not a '${typeof languageCode}': '${languageCode}'`);
  //parameterAssert(repoCode !== undefined, "checkMarkdownBook: 'repoCode' parameter should be defined");
  //parameterAssert(typeof repoCode === 'string', `checkMarkdownBook: 'repoCode' parameter should be a string not a '${typeof repoCode}': '${repoCode}'`);
  //parameterAssert(repoCode === 'TQ' || repoCode === 'OBS-TN' || repoCode === 'OBS-TQ' || repoCode === 'OBS-SN' || repoCode === 'OBS-SQ', `checkMarkdownBook: 'repoCode' parameter should be 'TQ' or 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ' not '${repoCode}'`);
  //parameterAssert(repoName !== undefined, "checkMarkdownBook: 'repoName' parameter should be defined");
  //parameterAssert(typeof repoName === 'string', `checkMarkdownBook: 'repoName' parameter should be a string not a '${typeof repoName}': ${repoName}`);
  //parameterAssert(branch !== undefined, "checkMarkdownBook: 'branch' parameter should be defined");
  //parameterAssert(typeof branch === 'string', `checkMarkdownBook: 'branch' parameter should be a string not a '${typeof branch}': '${branch}'`);
  //parameterAssert(bookID !== undefined, "checkMarkdownBook: 'bookID' parameter should be defined");
  //parameterAssert(typeof bookID === 'string', `checkMarkdownBook: 'bookID' parameter should be a string not a '${typeof bookID}': ${bookID}`);
  //parameterAssert(bookID.length === 3, `checkMarkdownBook: 'bookID' parameter should be three characters long not ${bookID.length}`);
  //parameterAssert(bookID.toUpperCase() === bookID, `checkMarkdownBook: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
  //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkMarkdownBook: '${bookID}' is not a valid USFM book identifier`);

  const generalLocation = ` in ${username} (${branch})`;

  const ctqResult = { successList: [], noticeList: [] };

  function addSuccessMessage(successString) {
    // functionLog(`checkBookPackage success: ${successString}`);
    ctqResult.successList.push(successString);
  }

  function addNoticePartial(incompleteNoticeObject) {
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // functionLog(`checkMarkdownBook addNoticePartial: ${incompleteNoticeObject.priority}:${incompleteNoticeObject.message} ${incompleteNoticeObject.bookID} ${incompleteNoticeObject.C}:${incompleteNoticeObject.V} ${incompleteNoticeObject.filename}:${incompleteNoticeObject.lineNumber} ${incompleteNoticeObject.characterIndex > 0 ? ` (at character ${incompleteNoticeObject.characterIndex})` : ""}${incompleteNoticeObject.excerpt ? ` ${incompleteNoticeObject.excerpt}` : ""}${incompleteNoticeObject.location}`);
    //parameterAssert(incompleteNoticeObject.priority !== undefined, "cTQ addNoticePartial: 'priority' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `cTQ addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}'`);
    //parameterAssert(incompleteNoticeObject.message !== undefined, "cTQ addNoticePartial: 'message' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.message === 'string', `cTQ addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}'`);
    //parameterAssert(incompleteNoticeObject.bookID !== undefined, "cTQ addNoticePartial: 'bookID' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.bookID === 'string', `cTQ addNoticePartial: 'bookID' parameter should be a string not a '${typeof incompleteNoticeObject.bookID}'`);
    //parameterAssert(incompleteNoticeObject.bookID.length === 3, `cTQ addNoticePartial: 'bookID' parameter should be three characters long not ${incompleteNoticeObject.bookID.length}`);
    //parameterAssert(incompleteNoticeObject.bookID === 'OBS' || books.isValidBookID(incompleteNoticeObject.bookID), `cTQ addNoticePartial: '${incompleteNoticeObject.bookID}' is not a valid USFM book identifier`);
    // parameterAssert(C !== undefined, "cTQ addNoticePartial: 'C' parameter should be defined");
    if (incompleteNoticeObject.C) {
      parameterAssert(typeof incompleteNoticeObject.C === 'string', `cTQ addNoticePartial: 'C' parameter should be a string not a '${typeof incompleteNoticeObject.C}'`);
    }
    // parameterAssert(V !== undefined, "cTQ addNoticePartial: 'V' parameter should be defined");
    if (incompleteNoticeObject.V) {
      parameterAssert(typeof incompleteNoticeObject.V === 'string', `cTQ addNoticePartial: 'V' parameter should be a string not a '${typeof incompleteNoticeObject.V}'`);
    }
    // parameterAssert(characterIndex !== undefined, "cTQ addNoticePartial: 'characterIndex' parameter should be defined");
    if (incompleteNoticeObject.characterIndex) {
      parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `cTQ addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}'`);
    }
    // parameterAssert(excerpt !== undefined, "cTQ addNoticePartial: 'excerpt' parameter should be defined");
    if (incompleteNoticeObject.excerpt) {
      parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `cTQ addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}'`);
    }
    //parameterAssert(incompleteNoticeObject.location !== undefined, "cTQ addNoticePartial: 'location' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.location === 'string', `cTQ addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}'`);
    //parameterAssert(incompleteNoticeObject.extra !== undefined, "cTQ addNoticePartial: 'extra' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.extra === 'string', `cTQ addNoticePartial: 'extra' parameter should be a string not a '${typeof incompleteNoticeObject.extra}'`);
    aboutToOverwrite('checkMarkdownBook', ['username', 'repoCode', 'repoName', 'bookID'], incompleteNoticeObject, { username, repoCode, repoName, bookID });
    ctqResult.noticeList.push({ ...incompleteNoticeObject, username, repoCode, repoName, bookID });
  }


  /**
   *
   * @param {string} repoCode
   * @param {string} bookID
   * @param {string} C
   * @param {string} V
   * @param {string} cfFilename
   * @param {string} fileContent
   * @param {string} fileLocation
   * @param {Object} checkingOptions
   */
  async function ourCheckFileContents(repoCode, bookID, C, V, cfFilename, fileContent, fileLocation, checkingOptions) {
    // functionLog(`checkBookPackage ourCheckFileContents(${repoCode}, ${bookID} ${C}:${V} ${cfFilename}…)…`);

    // Updates the global list of notices
    //parameterAssert(repoCode !== undefined, "cTQ ourCheckFileContents: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `cTQ ourCheckFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `cTQ ourCheckFileContents: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(cfFilename !== undefined, "cTQ ourCheckFileContents: 'cfFilename' parameter should be defined");
    //parameterAssert(typeof cfFilename === 'string', `cTQ ourCheckFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
    //parameterAssert(fileContent !== undefined, "cTQ ourCheckFileContents: 'fileContent' parameter should be defined");
    //parameterAssert(typeof fileContent === 'string', `cTQ ourCheckFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}'`);
    //parameterAssert(fileLocation !== undefined, "cTQ ourCheckFileContents: 'fileLocation' parameter should be defined");
    //parameterAssert(typeof fileLocation === 'string', `cTQ ourCheckFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);
    //parameterAssert(checkingOptions !== undefined, "cTQ ourCheckFileContents: 'checkingOptions' parameter should be defined");

    const cfResultObject = await checkFileContents(username, languageCode, repoCode, branch, cfFilename, fileContent, fileLocation, checkingOptions);
    // debugLog("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
    // for (const successEntry of cfResultObject.successList) debugLog("  ourCheckFileContents:", successEntry);

    // Process noticeList line by line,  appending the repoCode as an extra field as we go
    for (const noticeEntry of cfResultObject.noticeList) {
      // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=excerpt, 8=location
      // parameterAssert(Object.keys(noticeEntry).length === 5, `cTQ ourCheckFileContents notice length=${Object.keys(noticeEntry).length}`);
      // We add the repoCode as an extra value
      addNoticePartial({ ...noticeEntry, bookID, C, V, extra: repoCode });
    }
  }
  // end of ourCheckFileContents function


  // Main code for checkMarkdownBook
  // We need to find and check all the markdown folders/files for this book
  const getFileListFromZip_ = checkingOptions?.getFileListFromZip ? checkingOptions.getFileListFromZip : getFileListFromZip;
  let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
  const folderpath = bookID === 'OBS' ? 'content/' : `${bookID.toLowerCase()}/`;
  const pathList = await getFileListFromZip_({ username, repository: repoName, branchOrRelease: branch, optionalPrefix: folderpath });
  if (!Array.isArray(pathList) || !pathList.length) {
    // debugLog(`checkMarkdownBook for ${repoCode} failed to find ${username} ${repoName} ${branch} ${folderpath}`);
    const details = `folder=${folderpath}`;
    if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
      ctqResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", details, username, repoCode, repoName, location: generalLocation, extra: repoCode });
    else
      addNoticePartial({ priority: 996, message: "Unable to load file", details, bookID, location: generalLocation, extra: repoCode });
  } else {

    // debugLog(`  checkMarkdownBook: Got ${pathList.length} pathList entries`)
    for (const thisPath of pathList) {
      // debugLog(`checkMarkdownBook for ${repoCode}: Try to load ${username}, ${repoName}, ${thisPath}, ${branch}`);

      //parameterAssert(thisPath.endsWith('.md'), `Expected ${ thisPath } to end with .md`);
      // const filename = thisPath.split('/').pop();
      const pathParts = thisPath.slice(0, -3).split('/');
      const C = pathParts[pathParts.length - 2].replace(/^0+(?=\d)/, ''); // Remove leading zeroes
      const V = pathParts[pathParts.length - 1].replace(/^0+(?=\d)/, ''); // Remove leading zeroes

      const getFile_ = checkingOptions?.getFile ? checkingOptions.getFile : cachedGetFile;
      let tqFileContent;
      try {
        tqFileContent = await getFile_({ username, repository: repoName, path: thisPath, branch });
        // debugLog(`checkMarkdownBook for ${repoCode}: Fetched fileContent for ${repoName} ${thisPath} ${typeof tqFileContent} ${tqFileContent.length}`);
        checkedFilenames.push(thisPath);
        totalCheckedSize += tqFileContent.length;
      } catch (tQerror) { // NOTE: The error can depend on whether the zipped repo is cached or not
        console.error(`checkMarkdownBook failed to load ${username} ${repoName} ${branch} ${thisPath} ${tQerror + ''}`);
        if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
          ctqResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", username, repoCode, repoName, location: generalLocation, extra: repoCode });
        else {
          const notice = { priority: 996, message: "Unable to load file", username, bookID, C, V, filename: thisPath, location: `${generalLocation} ${thisPath} `, extra: repoCode };
          // eslint-disable-next-line eqeqeq
          if (tQerror != 'TypeError: repoFileContent is null') notice.details = `error = ${tQerror} `;
          addNoticePartial(notice);
        }
      }
      if (tqFileContent) {
        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        // NOTE: We pass thisPath here coz the actual filename by itself is useless (so many '01.md')
        await ourCheckFileContents(repoCode, bookID, C, V, thisPath, tqFileContent, generalLocation, checkingOptions); // Adds the notices to checkBookPackageResult
        checkedFileCount += 1;
        checkedFilenameExtensions.add('md');
        // addSuccessMessage(`Checked ${ repoCode.toUpperCase() } file: ${ thisPath }`);
      }
    }
    addSuccessMessage(`Checked ${checkedFileCount.toLocaleString()} ${repoCode.toUpperCase()} file${checkedFileCount === 1 ? '' : 's'}`);
  }

  ctqResult.checkedFileCount = checkedFileCount;
  ctqResult.checkedFilenames = checkedFilenames;
  ctqResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
  ctqResult.checkedFilesizes = totalCheckedSize;
  // debugLog(`  checkMarkdownBook returning ${ JSON.stringify(ctqResult) }`);
  return ctqResult;
}
// end of checkMarkdownBook function
