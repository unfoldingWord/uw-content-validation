import React from 'react';
import { REPO_CODES_LIST } from '../../core/defaults';
import * as books from '../../core/books/books';
import { formRepoName, repositoryExistsOnDoor43, getFileListFromZip, cachedGetFile, cachedGetBookFilenameFromManifest, checkManifestText, checkMarkdownText } from '../../core';
import { checkFileContents } from '../file-check/checkFileContents';
import { checkRepo } from '../repo-check/checkRepo';
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, parameterAssert, logicAssert } from '../../core/utilities';


// const BP_VALIDATOR_VERSION_STRING = '0.7.3';

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
  parameterAssert(username !== undefined, "checkBookPackage: 'username' parameter should be defined");
  parameterAssert(typeof username === 'string', `checkBookPackage: 'username' parameter should be a string not a '${typeof username}': ${username}`);
  parameterAssert(languageCode !== undefined, "checkBookPackage: 'languageCode' parameter should be defined");
  parameterAssert(typeof languageCode === 'string', `checkBookPackage: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
  parameterAssert(bookID !== undefined, "checkBookPackage: 'bookID' parameter should be defined");
  parameterAssert(typeof bookID === 'string', `checkBookPackage: 'bookID' parameter should be a string not a '${typeof bookID}': ${bookID}`);
  parameterAssert(bookID.length === 3, `checkBookPackage: 'bookID' parameter should be three characters long not ${bookID.length}`);
  parameterAssert(bookID.toUpperCase() === bookID, `checkBookPackage: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
  parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkBookPackage: '${bookID}' is not a valid USFM book identifier`);

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

  const generalLocation = ` in ${languageCode} ${bookID} book package from ${username} ${originalBranch} branch`;


  function addSuccessMessage(successString) {
    // functionLog(`checkBookPackage success: ${successString}`);
    checkBookPackageResult.successList.push(successString);
  }


  function addNoticePartial(noticeObject) {
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // functionLog(`checkBookPackage addNoticePartial: (priority=${noticeObject.priority}) ${noticeObject.bookID} ${noticeObject.C}:${noticeObject.V} ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
    parameterAssert(noticeObject.priority !== undefined, "cBP addNoticePartial: 'priority' parameter should be defined");
    parameterAssert(typeof noticeObject.priority === 'number', `cBP addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
    parameterAssert(noticeObject.message !== undefined, "cBP addNoticePartial: 'message' parameter should be defined");
    parameterAssert(typeof noticeObject.message === 'string', `cBP addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
    // parameterAssert(bookID !== undefined, "cBP addNoticePartial: 'bookID' parameter should be defined");
    if (noticeObject.bookID) {
      parameterAssert(typeof noticeObject.bookID === 'string', `cBP addNoticePartial: 'bookID' parameter should be a string not a '${typeof noticeObject.bookID}': ${noticeObject.bookID}`);
      parameterAssert(noticeObject.bookID.length === 3, `cBP addNoticePartial: 'bookID' parameter should be three characters long not ${noticeObject.bookID.length}`);
      parameterAssert(bookID === 'OBS' || books.isValidBookID(noticeObject.bookID), `cBP addNoticePartial: '${noticeObject.bookID}' is not a valid USFM book identifier`);
    }
    // parameterAssert(C !== undefined, "cBP addNoticePartial: 'C' parameter should be defined");
    if (noticeObject.C) parameterAssert(typeof noticeObject.C === 'string', `cBP addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}': ${noticeObject.C}`);
    // parameterAssert(V !== undefined, "cBP addNoticePartial: 'V' parameter should be defined");
    if (noticeObject.V) parameterAssert(typeof noticeObject.V === 'string', `cBP addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}': ${noticeObject.V}`);
    // parameterAssert(characterIndex !== undefined, "cBP addNoticePartial: 'characterIndex' parameter should be defined");
    if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cBP addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
    // parameterAssert(excerpt !== undefined, "cBP addNoticePartial: 'excerpt' parameter should be defined");
    if (noticeObject.excerpt) parameterAssert(typeof noticeObject.excerpt === 'string', `cBP addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
    parameterAssert(noticeObject.location !== undefined, "cBP addNoticePartial: 'location' parameter should be defined");
    parameterAssert(typeof noticeObject.location === 'string', `cBP addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
    parameterAssert(noticeObject.extra !== undefined, "cBP addNoticePartial: 'extra' parameter should be defined");
    parameterAssert(typeof noticeObject.extra === 'string', `cBP addNoticePartial: 'extra' parameter should be a string not a '${typeof noticeObject.extra}': ${noticeObject.extra}`);
    if (noticeObject.debugChain) noticeObject.debugChain = `checkBookPackage ${noticeObject.debugChain}`;
    checkBookPackageResult.noticeList.push({ ...noticeObject, bookID, username });
  }


  async function ourCheckBPFileContents(repoCode, repoName, repoBranch, cfFilename, fileContent, fileLocation, checkingOptions) {
    // functionLog(`checkBookPackage ourCheckBPFileContents(rC='${repoCode}', rN='${repoName}', rBr='${repoBranch}', fn='${cfFilename}', ${fileContent.length}, ${fileLocation}, ${JSON.stringify(checkingOptions)})…`);

    // Updates the global list of notices
    parameterAssert(repoCode !== undefined, "cBP ourCheckBPFileContents: 'repoCode' parameter should be defined");
    parameterAssert(typeof repoCode === 'string', `cBP ourCheckBPFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    parameterAssert(REPO_CODES_LIST.includes(repoCode), `cBP ourCheckBPFileContents: 'repoCode' parameter should not be '${repoCode}'`);
    parameterAssert(repoName !== undefined, "cBP ourCheckBPFileContents: 'repoName' parameter should be defined");
    parameterAssert(typeof repoName === 'string', `cBP ourCheckBPFileContents: 'repoName' parameter should be a string not a '${typeof repoName}': ${repoName}`);
    parameterAssert(repoBranch !== undefined, "cBP ourCheckBPFileContents: 'repoBranch' parameter should be defined");
    parameterAssert(typeof repoBranch === 'string', `cBP ourCheckBPFileContents: 'repoBranch' parameter should be a string not a '${typeof repoBranch}': ${repoBranch}`);
    parameterAssert(cfFilename !== undefined, "cBP ourCheckBPFileContents: 'cfFilename' parameter should be defined");
    parameterAssert(typeof cfFilename === 'string', `cBP ourCheckBPFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
    parameterAssert(fileContent !== undefined, "cBP ourCheckBPFileContents: 'fileContent' parameter should be defined");
    parameterAssert(typeof fileContent === 'string', `cBP ourCheckBPFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}'`);
    parameterAssert(fileLocation !== undefined, "cBP ourCheckBPFileContents: 'fileLocation' parameter should be defined");
    parameterAssert(typeof fileLocation === 'string', `cBP ourCheckBPFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);
    parameterAssert(checkingOptions !== undefined, "cBP ourCheckBPFileContents: 'checkingOptions' parameter should be defined");

    let adjustedLanguageCode = languageCode;
    // if (repoCode === 'UHB') adjustedLanguageCode = 'hbo'; // NO -- we need the languageCode of the BP being checked (so we can resolve TW links with * for language) !!!
    // else if (repoCode === 'UGNT') adjustedLanguageCode = 'el-x-koine';
    const cfcResultObject = await checkFileContents(username, adjustedLanguageCode, repoCode, repoBranch, cfFilename, fileContent, fileLocation, checkingOptions);
    // debugLog("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
    // for (const successEntry of cfResultObject.successList) userLog("  ourCheckBPFileContents:", successEntry);
    // debugLog("cfcResultObject", JSON.stringify(cfcResultObject));

    // Process noticeList line by line,  appending the repoCode as an extra field as we go
    for (const cfcNoticeEntry of cfcResultObject.noticeList) // noticeEntry is an object
      if (cfcNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN2 check
        checkBookPackageResult.noticeList.push(cfcNoticeEntry); // Just copy the complete notice as is
      else // For our direct checks, we add the repoCode as an extra value (unless it’s already there from a TA or TW check)
        addNoticePartial({ ...cfcNoticeEntry, repoCode, repoName, branch: repoBranch, filename: cfFilename, extra: cfcNoticeEntry.extra ? cfcNoticeEntry.extra : repoCode });
    // The following is needed coz we might be checking the linked TA and/or TW articles from TN2 TSV files
    if (cfcResultObject.checkedFileCount && cfcResultObject.checkedFileCount > 0) {
      checkedFileCount += cfcResultObject.checkedFileCount;
      addSuccessMessage(`Checked ${cfcResultObject.checkedFileCount} linked TA/TW articles`);
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
  async function ourCheckManifestFile(repoCode, repoName, repoBranch, manifestLocation, checkingOptions) {
    // Updates the global list of notices
    // functionLog(`checkBookPackage ourCheckManifestFile(${repoCode}, ${repoName}, ${repoBranch}, ${manifestLocation}, ${JSON.stringify(checkingOptions)})…`);
    parameterAssert(repoCode !== undefined, "cBP ourCheckManifestFile: 'repoCode' parameter should be defined");
    parameterAssert(typeof repoCode === 'string', `cBP ourCheckManifestFile: 'repoCode' parameter should be a string not a '${typeof repoCode}' : ${repoCode}`);
    parameterAssert(REPO_CODES_LIST.includes(repoCode), `cBP ourCheckManifestFile: 'repoCode' parameter should not be '${repoCode}'`);
    parameterAssert(repoName !== undefined, "cBP ourCheckManifestFile: 'repoName' parameter should be defined");
    parameterAssert(typeof repoName === 'string', `cBP ourCheckManifestFile: 'repoName' parameter should be a string not a '${typeof repoName}': ${repoName}`);
    parameterAssert(repoBranch !== undefined, "cBP ourCheckManifestFile: 'repoBranch' parameter should be defined");
    parameterAssert(typeof repoBranch === 'string', `cBP ourCheckManifestFile: 'repoBranch' parameter should be a string not a '${typeof repoBranch}': ${repoBranch}`);
    parameterAssert(manifestLocation !== undefined, "cBP ourCheckManifestFile: 'manifestLocation' parameter should be defined");
    parameterAssert(typeof manifestLocation === 'string', `cBP ourCheckManifestFile: 'manifestLocation' parameter should be a string not a '${typeof manifestLocation}'`);

    let manifestFileContent;
    try {
      // debugLog("checkBookPackage ourCheckManifestFile about to fetch manifest", username, repoName, repoBranch);
      manifestFileContent = await getFile_({ username, repository: repoName, path: STANDARD_MANIFEST_FILENAME, branch: repoBranch });
      // debugLog("checkBookPackage ourCheckManifestFile fetched content for manifest", username, repoName, repoBranch, typeof manifestFileContent, manifestFileContent.length);
      // debugLog(manifestFileContent);
    } catch (cBPgfError) {
      console.error(`checkBookPackage ourCheckManifestFile(${username}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)}) failed to load manifest`, username, repoName, repoBranch, cBPgfError + '');
      let details = `username=${username}`;
      if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
        checkBookPackageResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", details, username, repoCode, repoName, location: manifestLocation, extra: repoCode });
      else {
        // eslint-disable-next-line eqeqeq
        if (cBPgfError != 'TypeError: repoFileContent is null') details += ` error=${cBPgfError}`;
        addNoticePartial({ priority: 996, message: "Unable to load", details: `username=${username} error=${cBPgfError}`, repoName, filename: STANDARD_MANIFEST_FILENAME, location: manifestLocation, extra: repoCode });
      }
    }
    if (manifestFileContent) {
      const cmtResultObject = await checkManifestText(languageCode, repoCode, username, repoName, repoBranch, manifestFileContent, manifestLocation, checkingOptions);
      // debugLog(`ourCheckManifestFile checkManifestText(${repoName}) returned ${cmtResultObject.successList.length} success message(s) and ${cmtResultObject.noticeList.length} notice(s)`);
      // debugLog(`ourCheckManifestFile checkManifestText(${repoName}) returned ${JSON.stringify(cmtResultObject)}`);
      // NOTE: We ignore the returned success messages here
      // for (const successEntry of cfResultObject.successList) userLog("  ourCheckBPFileContents:", successEntry);
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
  async function ourCheckMarkdownFile(repoCode, repoName, repoBranch, filename, markdownLocation, checkingOptions) {
    // Updates the global list of notices
    // functionLog(`checkBookPackage ourCheckMarkdownFile(${repoCode}, ${repoName}, ${filename}, ${repoBranch}, ${markdownLocation}, ${JSON.stringify(checkingOptions)})…`);
    parameterAssert(repoCode !== undefined, "cBP ourCheckMarkdownFile: 'repoCode' parameter should be defined");
    parameterAssert(typeof repoCode === 'string', `cBP ourCheckMarkdownFile: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    parameterAssert(REPO_CODES_LIST.includes(repoCode), `cBP ourCheckMarkdownFile: 'repoCode' parameter should not be '${repoCode}'`);
    parameterAssert(repoName !== undefined, "cBP ourCheckMarkdownFile: 'repoName' parameter should be defined");
    parameterAssert(typeof repoName === 'string', `cBP ourCheckMarkdownFile: 'repoName' parameter should be a string not a '${typeof repoName}'`);
    parameterAssert(repoBranch !== undefined, "cBP ourCheckMarkdownFile: 'repoBranch' parameter should be defined");
    parameterAssert(typeof repoBranch === 'string', `cBP ourCheckMarkdownFile: 'repoBranch' parameter should be a string not a '${typeof repoBranch}'`);
    parameterAssert(filename !== undefined, "cBP ourCheckMarkdownFile: 'filename' parameter should be defined");
    parameterAssert(typeof filename === 'string', `cBP ourCheckMarkdownFile: 'filename' parameter should be a string not a '${typeof filename}': ${filename}`);
    parameterAssert(markdownLocation !== undefined, "cBP ourCheckMarkdownFile: 'markdownLocation' parameter should be defined");
    parameterAssert(typeof markdownLocation === 'string', `cBP ourCheckMarkdownFile: 'markdownLocation' parameter should be a string not a '${typeof markdownLocation}'`);

    let markdownFileContent;
    try {
      // debugLog("checkBookPackage ourCheckMarkdownFile about to fetch markdown file", username, repoName, repoBranch, filename);
      markdownFileContent = await getFile_({ username, repository: repoName, path: filename, branch: repoBranch });
      // debugLog("checkBookPackage ourCheckMarkdownFile fetched markdown content", username, repoName, repoBranch, filename, typeof markdownFileContent, markdownFileContent.length);
      // debugLog(markdownFileContent);
    } catch (cBPgfError) {
      console.error(`checkBookPackage ourCheckMarkdownFile(${username}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)}) failed to load markdown`, username, repoName, filename, originalBranch, cBPgfError + '');
      let details = `username=${username}`;
      if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
        checkBookPackageResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", details, username, repoCode, repoName, location: markdownLocation, extra: repoCode });
      else {
        // eslint-disable-next-line eqeqeq
        if (cBPgfError != 'TypeError: repoFileContent is null') details += ` error=${cBPgfError}`;
        addNoticePartial({ priority: 996, message: "Unable to load", details: `username=${username} error=${cBPgfError}`, username, repoName, filename, location: markdownLocation, extra: repoCode });
      }
    }
    if (markdownFileContent) {
      const cmtResultObject = await checkMarkdownText(languageCode, repoCode, repoName, markdownFileContent, markdownLocation, checkingOptions);
      // debugLog(`ourCheckMarkdownFile checkMarkdownText(${repoName}) returned ${cmtResultObject.successList.length} success message(s) and ${cmtResultObject.noticeList.length} notice(s)`);
      // debugLog(`ourCheckMarkdownFile checkMarkdownText(${repoName}) returned ${JSON.stringify(cmtResultObject)}`);
      // NOTE: We ignore the returned success messages here
      // for (const successEntry of cfResultObject.successList) userLog("  ourCheckBPFileContents:", successEntry);
      // debugLog("cfcResultObject", JSON.stringify(cfcResultObject));

      // Process noticeList line by line,  appending the repoCode as an extra field as we go
      for (const cfcNoticeEntry of cmtResultObject.noticeList) {
        // NOTE: We don’t use addNoticePartial, because it adds a misleading BookID
        // addNoticePartial({ ...cfcNoticeEntry, filename, extra: `${repoCode} markdown` });
        checkBookPackageResult.noticeList.push({ ...cfcNoticeEntry, username, repoCode, repoName, filename, extra: repoCode });
      }

      if (filename === 'LICENSE.md') {
        const fullYearString = `${(new Date()).getFullYear()}`;
        // debugLog(`Year ${fullYearString} is ${typeof fullYearString}`);
        if (markdownFileContent.indexOf(fullYearString) === -1) // Can't find this year string in file
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
  // NOTE: TN and TQ are used here for the old resource formats, e.g., 9-column TSV TN2 and markdown TQ2
  //        The TN2, TQ2, SN, and if (linkBookCode.length) repoCodes refer to the new 7-column notes TSV format.
  // debugLog("checkBookPackage() main code…");
  let repoCodeList;
  let bookNumberAndName, whichTestament;
  if (bookID === 'OBS') {
    // NOTE: No code below to handle OBS TN and TQ which are markdown repos
    if (dataSet === 'DEFAULT')
      repoCodeList = ['OBS', 'OBS-TWL', 'OBS-TN2', 'OBS-TQ2', 'OBS-SN', 'OBS-SQ'];
    else if (dataSet === 'OLD')
      repoCodeList = ['OBS', 'OBS-TN', 'OBS-TQ', 'OBS-SN', 'OBS-SQ'];
    else if (dataSet === 'NEW')
      repoCodeList = ['OBS', 'OBS-TWL', 'OBS-TN2', 'OBS-TQ2', 'OBS-SN', 'OBS-SQ'];
    else if (dataSet === 'BOTH')
      repoCodeList = ['OBS', 'OBS-TWL', 'OBS-TN', 'OBS-TN2', 'OBS-TQ', 'OBS-TQ2', 'OBS-SN', 'OBS-SQ'];
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
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'LT', 'ST', 'TN', 'TQ'] : [origLangRepoCode, 'LT', 'ST', 'TN', 'TQ'];
    else if (dataSet === 'NEW')
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'TWL', 'LT', 'ST', 'TN2', 'TQ2', 'SN', 'SQ'] : [origLangRepoCode, 'LT', 'ST', 'TN', 'TQ'];
    else if (dataSet === 'BOTH')
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'TWL', 'LT', 'ST', 'TN2', 'TN', 'TQ2', 'TQ', 'SN', 'SQ'] : [origLangRepoCode, 'LT', 'ST', 'TN', 'TQ'];
  }


  // Main loop for checkBookPackage()
  const checkedManifestDetails = [];
  let numCheckedRepos = 0;
  for (const repoCode of repoCodeList) {
    // debugLog(`checkBookPackage for ${bookID} got repoCode=${repoCode} abortFlag=${abortFlag} from ${repoCodeList}`);
    if (abortFlag) break;
    const repoLocation = ` in ${repoCode}${generalLocation}`;
    let adjustedRepoCode = repoCode, adjustedBranch = originalBranch;
    if (adjustedRepoCode.endsWith('2')) {
      adjustedRepoCode = adjustedRepoCode.substring(0, adjustedRepoCode.length - 1); // Remove the '2' from the end
      adjustedBranch = 'newFormat';
    }
    let repoName = formRepoName(languageCode, adjustedRepoCode);
    if (adjustedRepoCode.startsWith('OBS-'))
      adjustedRepoCode = adjustedRepoCode.substring(4); // Remove the 'OBS-' from the beginning
    // if (bookID === 'OBS' && dataSet === 'OLD' && repoCode !== 'OBS' && repoCode !== 'TWL' && repoName === `${languageCode}_${adjustedRepoCode.toLowerCase()}`)
    //   repoName = `${languageCode}_obs-${adjustedRepoCode.toLowerCase()}`;
    userLog(`checkBookPackage: check ${languageCode} ${bookID} in ${repoCode} (${adjustedRepoCode}) from ${username} ${repoName} ${adjustedBranch}…`);

    // Update our "waiting" message
    setResultValue(<p style={{ color: 'magenta' }}>Checking <i>{username}</i> {languageCode} <b>{bookID}</b> book package in <b>{repoCode}</b> (checked <b>{numCheckedRepos}</b>/{repoCodeList.length} repos)…</p>);

    let filename;
    if (repoCode === 'UHB' || repoCode === 'UGNT' || repoCode === 'LT' || repoCode === 'ST')
      // TODO: Might we need specific releases/tags for some of these (e.g., from the TN2 manifest)???
      // TODO: Do we need to hard-code where to find the UHB and UGNT???
      filename = `${bookNumberAndName}.usfm`;
    else if (adjustedRepoCode === 'TWL' || repoCode.endsWith('TN2') || repoCode.endsWith('TQ2'))
      filename = `${adjustedRepoCode.toLowerCase()}_${bookID}.tsv`
    else if (adjustedRepoCode === 'SN' || adjustedRepoCode === 'SQ')
      filename = `${adjustedRepoCode.toLowerCase()}_${bookID}.tsv`
    else if (adjustedRepoCode === 'TN' && !repoCode.startsWith('OBS-')) {
      try {
        filename = await cachedGetBookFilenameFromManifest({ username, repository: repoName, branch: originalBranch, bookID: bookID.toLowerCase() });
        logicAssert(filename.startsWith(`${languageCode}_`), `Expected TN filename '${filename}' to start with the language code '${languageCode}_'`);
      } catch (e) {
        // console.error(`cachedGetBookFilenameFromManifest failed with: ${e}`);
        filename = `${languageCode}_tn_${bookNumberAndName}.tsv`; // Take a guess
      }
      logicAssert(filename.endsWith('.tsv'), `Expected TN filename '${filename}' to end with '.tsv'`);
    }

    if (repoCode === 'OBS') {
      // debugLog("Calling OBS checkRepo()…");
      checkBookPackageResult = await checkRepo(username, `${languageCode}_obs`, originalBranch, generalLocation, setResultValue, newCheckingOptions); // Adds the notices to checkBookPackageResult
      // functionLog(`checkRepo() returned ${checkBookPackageResult.successList.length} success message(s) and ${checkBookPackageResult.noticeList.length} notice(s)`);
      // debugLog("crResultObject keys", JSON.stringify(Object.keys(checkBookPackageResult)));
      addSuccessMessage(`Checked ${languageCode} OBS repo from ${username}`);
    } else if (adjustedRepoCode === 'TQ' || repoCode === 'OBS-TN') { // OBS-TN is markdown also for now
      // This is the old markdown resource with hundreds/thousands of files
      const tqResultObject = await checkTQMarkdownBook(username, languageCode, repoCode, repoName, originalBranch, bookID, newCheckingOptions);
      checkBookPackageResult.successList = checkBookPackageResult.successList.concat(tqResultObject.successList);
      checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(tqResultObject.noticeList);
      if (tqResultObject.checkedFileCount > 0) {
        checkedFilenames = checkedFilenames.concat(tqResultObject.checkedFilenames);
        checkedFilenameExtensions = new Set([...checkedFilenameExtensions, ...tqResultObject.checkedFilenameExtensions]);
        checkedFileCount += tqResultObject.checkedFileCount;
        totalCheckedSize += tqResultObject.totalCheckedSize;
        checkedRepoNames.add(repoName);
      }
    } else { // For repos other than OBS and TQ, we only have one file to check
      logicAssert(filename?.length, `filename should be set by now for un=${username} rC=${repoCode} aRC=${adjustedRepoCode} rN=${repoName} aBr=${adjustedBranch}`);
      let repoFileContent;
      try {
        // debugLog(`checkBookPackage about to fetch fileContent for ${username}, ${repoName}, ${adjustedBranch}, ${filename}`);
        repoFileContent = await getFile_({ username, repository: repoName, path: filename, branch: adjustedBranch });
        // debugLog(`checkBookPackage fetched fileContent for ${username}, ${repoName}, ${adjustedBranch}, ${filename}, ${typeof repoFileContent}, ${repoFileContent.length}`);
        checkedFilenames.push(filename);
        totalCheckedSize += repoFileContent.length;
        checkedRepoNames.add(repoName);
      } catch (cBPgfError) {
        // debugLog(`checkBookPackage(${username}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)}) failed to load ${repoName}, ${filename}, ${adjustedBranch}, ${cBPgfError}`);
        // debugLog(`cBPgfError=${cBPgfError} or ${JSON.stringify(cBPgfError)} or2 ${cBPgfError === 'TypeError: repoFileContent is null'} or3 ${cBPgfError.message === 'TypeError: repoFileContent is null'} or4 ${cBPgfError.message === 'TypeError: repoFileContent is null'}`);
        let details = `username=${username}`;
        // Next line has special code to handle book-package-check.test.js tests [so we don't call repositoryExistsOnDoor43()]
        if ((cBPgfError + '').startsWith('Tests could not find') || ! await repositoryExistsOnDoor43({ username, repository: repoName }))
          checkBookPackageResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", details, username, repoCode, repoName, location: repoLocation, extra: repoCode });
        else {
          // eslint-disable-next-line eqeqeq
          if (cBPgfError != 'TypeError: repoFileContent is null') details += ` error=${cBPgfError}`;
          addNoticePartial({ priority: 996, message: "Unable to load", details, repoCode, repoName, filename, location: repoLocation, extra: repoCode });
        }
      }
      if (repoFileContent) {
        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        await ourCheckBPFileContents(repoCode, repoName, adjustedBranch, filename, repoFileContent, generalLocation, newCheckingOptions); // Adds the notices to checkBookPackageResult
        checkedFileCount += 1;
        checkedFilenameExtensions.add(filename.split('.').pop());
        addSuccessMessage(`Checked ${repoCode.toUpperCase()} file: ${filename}`);
      }
    } // end of repo that's not OBS or TQ

    if (!newCheckingOptions?.disableAllLinkFetchingFlag) {
      // We also check the manifest file for each repo if requested
      //  because a faulty manifest might also stop a BP from working correctly in various programs
      if (!checkedManifestDetails.includes(repoName)) { // Don’t want to check more than once
        checkedManifestDetails.push(repoName); // Remember that we checked this one
        // debugLog(`Maybe checking MANIFEST etc. for ${repoName}`);

        if (newCheckingOptions?.checkManifestFlag) {
          // debugLog(`checkBookPackage: checking MANIFEST for ${repoName}`);
          const numCheckedCharacters = await ourCheckManifestFile(repoCode, repoName, adjustedBranch, generalLocation, newCheckingOptions);
          if (numCheckedCharacters > 0) {
            checkedFileCount += 1;
            checkedFilenames.push('manifest.yaml');
            checkedFilenameExtensions.add('yaml');
            totalCheckedSize += numCheckedCharacters;
            addSuccessMessage(`Checked ${repoName} manifest file`);
          }
        }
        // else debugLog(`NOT checking MANIFEST for ${repoName}`);

        // We can also check the README file for each repo if requested
        if (newCheckingOptions?.checkReadmeFlag) {
          // debugLog(`checkBookPackage: checking README for ${repoName}`);
          const filename = 'README.md';
          const numCheckedCharacters = await ourCheckMarkdownFile(repoCode, repoName, adjustedBranch, filename, generalLocation, newCheckingOptions);
          if (numCheckedCharacters > 0) {
            checkedFileCount += 1;
            checkedFilenames.push(filename);
            checkedFilenameExtensions.add('md');
            totalCheckedSize += numCheckedCharacters;
            addSuccessMessage(`Checked ${repoName} README file`);
          }
        }
        // else debugLog(`NOT checking README for ${repoName}`);

        // We can also check the LICENSE file for each repo if requested
        if (newCheckingOptions?.checkLicenseFlag) {
          // debugLog(`Checking LICENSE for ${repoName}`);
          const filename = 'LICENSE.md';
          const numCheckedCharacters = await ourCheckMarkdownFile(repoCode, repoName, adjustedBranch, filename, generalLocation, newCheckingOptions);
          if (numCheckedCharacters > 0) {
            checkedFileCount += 1;
            checkedFilenames.push(filename);
            checkedFilenameExtensions.add('md');
            totalCheckedSize += numCheckedCharacters;
            addSuccessMessage(`Checked ${repoName} LICENSE file`);
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
  // functionLog(`checkBookPackageResult(${bookID}): elapsedSeconds = ${checkBookPackageResult.elapsedSeconds}, notices count = ${checkBookPackageResult.noticeList.length}`);
  return checkBookPackageResult;
};
// end of checkBookPackage()


/*
    checkTQMarkdownBook
*/
/**
 *
 * @param {string} username
 * @param {string} languageCode
 * @param {string} repoCode -- 'TQ' or 'OBS-TQ'
 * @param {string} repoName
 * @param {string} branch
 * @param {string} bookID -- 3-character USFM book ID or 'OBS'
 * @param {Object} checkingOptions
 * @return {Object} - containing successList and noticeList
 */
async function checkTQMarkdownBook(username, languageCode, repoCode, repoName, branch, bookID, checkingOptions) {
  // functionLog(`checkBookPackage checkTQMarkdownBook(${username}, ${languageCode}, ${repoCode} ${repoName}, ${branch}, ${bookID}, ${JSON.stringify(checkingOptions)})…`)
  parameterAssert(username !== undefined, "checkTQMarkdownBook: 'username' parameter should be defined");
  parameterAssert(typeof username === 'string', `checkTQMarkdownBook: 'username' parameter should be a string not a '${typeof username}': '${username}'`);
  parameterAssert(languageCode !== undefined, "checkTQMarkdownBook: 'languageCode' parameter should be defined");
  parameterAssert(typeof languageCode === 'string', `checkTQMarkdownBook: 'languageCode' parameter should be a string not a '${typeof languageCode}': '${languageCode}'`);
  parameterAssert(repoCode !== undefined, "checkTQMarkdownBook: 'repoCode' parameter should be defined");
  parameterAssert(typeof repoCode === 'string', `checkTQMarkdownBook: 'repoCode' parameter should be a string not a '${typeof repoCode}': '${repoCode}'`);
  parameterAssert(repoCode === 'TQ' || repoCode === 'OBS-TQ', `checkTQMarkdownBook: 'repoCode' parameter should be 'TQ' or 'OBS-TQ' not '${repoCode}'`);
  parameterAssert(repoName !== undefined, "checkTQMarkdownBook: 'repoName' parameter should be defined");
  parameterAssert(typeof repoName === 'string', `checkTQMarkdownBook: 'repoName' parameter should be a string not a '${typeof repoName}': ${repoName}`);
  parameterAssert(branch !== undefined, "checkTQMarkdownBook: 'branch' parameter should be defined");
  parameterAssert(typeof branch === 'string', `checkTQMarkdownBook: 'branch' parameter should be a string not a '${typeof branch}': '${branch}'`);
  parameterAssert(bookID !== undefined, "checkTQMarkdownBook: 'bookID' parameter should be defined");
  parameterAssert(typeof bookID === 'string', `checkTQMarkdownBook: 'bookID' parameter should be a string not a '${typeof bookID}': ${bookID}`);
  parameterAssert(bookID.length === 3, `checkTQMarkdownBook: 'bookID' parameter should be three characters long not ${bookID.length}`);
  parameterAssert(bookID.toUpperCase() === bookID, `checkTQMarkdownBook: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
  parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkTQMarkdownBook: '${bookID}' is not a valid USFM book identifier`);

  const generalLocation = ` in ${username} (${branch})`;

  const ctqResult = { successList: [], noticeList: [] };

  function addSuccessMessage(successString) {
    // functionLog(`checkBookPackage success: ${successString}`);
    ctqResult.successList.push(successString);
  }

  function addNoticePartial(noticeObject) {
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // functionLog(`checkTQMarkdownBook addNoticePartial: ${noticeObject.priority}:${noticeObject.message} ${noticeObject.bookID} ${noticeObject.C}:${noticeObject.V} ${noticeObject.filename}:${noticeObject.lineNumber} ${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.excerpt ? ` ${noticeObject.excerpt}` : ""}${noticeObject.location}`);
    parameterAssert(noticeObject.priority !== undefined, "cTQ addNoticePartial: 'priority' parameter should be defined");
    parameterAssert(typeof noticeObject.priority === 'number', `cTQ addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}'`);
    parameterAssert(noticeObject.message !== undefined, "cTQ addNoticePartial: 'message' parameter should be defined");
    parameterAssert(typeof noticeObject.message === 'string', `cTQ addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}'`);
    parameterAssert(noticeObject.bookID !== undefined, "cTQ addNoticePartial: 'bookID' parameter should be defined");
    parameterAssert(typeof noticeObject.bookID === 'string', `cTQ addNoticePartial: 'bookID' parameter should be a string not a '${typeof noticeObject.bookID}'`);
    parameterAssert(noticeObject.bookID.length === 3, `cTQ addNoticePartial: 'bookID' parameter should be three characters long not ${noticeObject.bookID.length}`);
    parameterAssert(noticeObject.bookID === 'OBS' || books.isValidBookID(noticeObject.bookID), `cTQ addNoticePartial: '${noticeObject.bookID}' is not a valid USFM book identifier`);
    // parameterAssert(C !== undefined, "cTQ addNoticePartial: 'C' parameter should be defined");
    if (noticeObject.C) parameterAssert(typeof noticeObject.C === 'string', `cTQ addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}'`);
    // parameterAssert(V !== undefined, "cTQ addNoticePartial: 'V' parameter should be defined");
    if (noticeObject.V) parameterAssert(typeof noticeObject.V === 'string', `cTQ addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}'`);
    // parameterAssert(characterIndex !== undefined, "cTQ addNoticePartial: 'characterIndex' parameter should be defined");
    if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cTQ addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}'`);
    // parameterAssert(excerpt !== undefined, "cTQ addNoticePartial: 'excerpt' parameter should be defined");
    if (noticeObject.excerpt) parameterAssert(typeof noticeObject.excerpt === 'string', `cTQ addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}'`);
    parameterAssert(noticeObject.location !== undefined, "cTQ addNoticePartial: 'location' parameter should be defined");
    parameterAssert(typeof noticeObject.location === 'string', `cTQ addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}'`);
    parameterAssert(noticeObject.extra !== undefined, "cTQ addNoticePartial: 'extra' parameter should be defined");
    parameterAssert(typeof noticeObject.extra === 'string', `cTQ addNoticePartial: 'extra' parameter should be a string not a '${typeof noticeObject.extra}'`);
    ctqResult.noticeList.push({ ...noticeObject, username, repoCode, repoName, bookID });
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
  async function ourCheckTQFileContents(repoCode, bookID, C, V, cfFilename, fileContent, fileLocation, checkingOptions) {
    // functionLog(`checkBookPackage ourCheckTQFileContents(${repoCode}, ${bookID} ${C}:${V} ${cfFilename}…)…`);

    // Updates the global list of notices
    parameterAssert(repoCode !== undefined, "cTQ ourCheckTQFileContents: 'repoCode' parameter should be defined");
    parameterAssert(typeof repoCode === 'string', `cTQ ourCheckTQFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    parameterAssert(REPO_CODES_LIST.includes(repoCode), `cTQ ourCheckTQFileContents: 'repoCode' parameter should not be '${repoCode}'`);
    parameterAssert(cfFilename !== undefined, "cTQ ourCheckTQFileContents: 'cfFilename' parameter should be defined");
    parameterAssert(typeof cfFilename === 'string', `cTQ ourCheckTQFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
    parameterAssert(fileContent !== undefined, "cTQ ourCheckTQFileContents: 'fileContent' parameter should be defined");
    parameterAssert(typeof fileContent === 'string', `cTQ ourCheckTQFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}'`);
    parameterAssert(fileLocation !== undefined, "cTQ ourCheckTQFileContents: 'fileLocation' parameter should be defined");
    parameterAssert(typeof fileLocation === 'string', `cTQ ourCheckTQFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);
    parameterAssert(checkingOptions !== undefined, "cTQ ourCheckTQFileContents: 'checkingOptions' parameter should be defined");

    const cfResultObject = await checkFileContents(username, languageCode, repoCode, branch, cfFilename, fileContent, fileLocation, checkingOptions);
    // debugLog("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
    // for (const successEntry of cfResultObject.successList) userLog("  ourCheckTQFileContents:", successEntry);

    // Process noticeList line by line,  appending the repoCode as an extra field as we go
    for (const noticeEntry of cfResultObject.noticeList) {
      // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=excerpt, 8=location
      // parameterAssert(Object.keys(noticeEntry).length === 5, `cTQ ourCheckTQFileContents notice length=${Object.keys(noticeEntry).length}`);
      // We add the repoCode as an extra value
      addNoticePartial({ ...noticeEntry, bookID, C, V, extra: repoCode });
    }
  }
  // end of ourCheckTQFileContents function


  // Main code for checkTQMarkdownBook
  // We need to find and check all the markdown folders/files for this book
  const getFileListFromZip_ = checkingOptions && checkingOptions.getFileListFromZip ? checkingOptions.getFileListFromZip : getFileListFromZip;
  let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
  const pathList = await getFileListFromZip_({ username, repository: repoName, branchOrRelease: branch, optionalPrefix: `${bookID.toLowerCase()}/` });
  if (!Array.isArray(pathList) || !pathList.length) {
    // console.error("checkTQrepo failed to load", username, repoName, branch);
    const details = `username=${username}`;
    if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
      ctqResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", details, username, repoCode, repoName, location: generalLocation, extra: repoCode });
    else
      addNoticePartial({ priority: 996, message: "Unable to load", details, bookID, location: generalLocation, extra: repoCode });
  } else {

    // debugLog(`  Got ${pathList.length} pathList entries`)
    for (const thisPath of pathList) {
      // debugLog("checkTQMarkdownBook: Try to load", username, repoName, thisPath, branch);

      parameterAssert(thisPath.endsWith('.md'), `Expected ${thisPath} to end with .md`);
      // const filename = thisPath.split('/').pop();
      const pathParts = thisPath.slice(0, -3).split('/');
      const C = pathParts[pathParts.length - 2].replace(/^0+(?=\d)/, ''); // Remove leading zeroes
      const V = pathParts[pathParts.length - 1].replace(/^0+(?=\d)/, ''); // Remove leading zeroes

      const getFile_ = (checkingOptions && checkingOptions.getFile) ? checkingOptions.getFile : cachedGetFile;
      let tqFileContent;
      try {
        tqFileContent = await getFile_({ username, repository: repoName, path: thisPath, branch });
        // debugLog("Fetched fileContent for", repoName, thisPath, typeof tqFileContent, tqFileContent.length);
        checkedFilenames.push(thisPath);
        totalCheckedSize += tqFileContent.length;
      } catch (tQerror) {
        console.error("checkTQMarkdownBook failed to load", username, repoName, thisPath, branch, tQerror + '');
        let details = `username=${username}`;
        if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
          ctqResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", details, username, repoCode, repoName, location: generalLocation, extra: repoCode });
        else {
          // eslint-disable-next-line eqeqeq
          if (tQerror != 'TypeError: repoFileContent is null') details += ` error=${tQerror}`;
          addNoticePartial({ priority: 996, message: "Unable to load", details, bookID, C, V, filename: thisPath, location: `${generalLocation} ${thisPath}`, extra: repoCode });
        }
      }
      if (tqFileContent) {
        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        // NOTE: We pass thisPath here coz the actual filename by itself is useless (so many '01.md')
        await ourCheckTQFileContents(repoCode, bookID, C, V, thisPath, tqFileContent, generalLocation, checkingOptions); // Adds the notices to checkBookPackageResult
        checkedFileCount += 1;
        checkedFilenameExtensions.add('md');
        // addSuccessMessage(`Checked ${repoCode.toUpperCase()} file: ${thisPath}`);
      }
    }
    addSuccessMessage(`Checked ${checkedFileCount.toLocaleString()} ${repoCode.toUpperCase()} file${checkedFileCount === 1 ? '' : 's'}`);
  }

  ctqResult.checkedFileCount = checkedFileCount;
  ctqResult.checkedFilenames = checkedFilenames;
  ctqResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
  ctqResult.checkedFilesizes = totalCheckedSize;
  // debugLog(`  checkTQMarkdownBook returning ${JSON.stringify(ctqResult)}`);
  return ctqResult;
}
// end of checkTQMarkdownBook function
