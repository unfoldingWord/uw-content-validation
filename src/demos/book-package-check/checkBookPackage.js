import React from 'react';
import * as books from '../../core/books/books';
import { formRepoName, repositoryExistsOnDoor43, getFileListFromZip, cachedGetFile, cachedGetBookFilenameFromManifest, checkManifestText } from '../../core';
import { checkFileContents } from '../file-check/checkFileContents';
import { checkRepo } from '../repo-check/checkRepo';


//const BP_VALIDATOR_VERSION_STRING = '0.4.3';

const MANIFEST_FILENAME = 'manifest.yaml';


/*
    checkTQMarkdownBook
*/
/**
 *
 * @param {string} username
 * @param {string} languageCode
 * @param {string} repoName
 * @param {string} branch
 * @param {string} bookID -- 3-character USFM book ID or 'OBS'
 * @param {Object} checkingOptions
 * @return {Object} - containing successList and noticeList
 */
async function checkTQMarkdownBook(username, languageCode, repoName, branch, bookID, checkingOptions) {
  // console.log(`checkTQMarkdownBook(${username}, ${repoName}, ${branch}, ${bookID}, ${JSON.stringify(checkingOptions)})…`)
  const repoCode = 'TQ1';
  const generalLocation = ` in ${username} (${branch})`;

  const ctqResult = { successList: [], noticeList: [] };

  function addSuccessMessage(successString) {
    // console.log(`checkBookPackage success: ${successString}`);
    ctqResult.successList.push(successString);
  }

  function addNoticePartial(noticeObject) {
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // console.log(`checkTQMarkdownBook addNoticePartial: ${noticeObject.priority}:${noticeObject.message} ${noticeObject.bookID} ${noticeObject.C}:${noticeObject.V} ${noticeObject.filename}:${noticeObject.lineNumber} ${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? ` ${noticeObject.extract}` : ""}${noticeObject.location}`);
    console.assert(noticeObject.priority !== undefined, "cTQ addNoticePartial: 'priority' parameter should be defined");
    console.assert(typeof noticeObject.priority === 'number', `cTQ addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}'`);
    console.assert(noticeObject.message !== undefined, "cTQ addNoticePartial: 'message' parameter should be defined");
    console.assert(typeof noticeObject.message === 'string', `cTQ addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}'`);
    console.assert(noticeObject.bookID !== undefined, "cTQ addNoticePartial: 'bookID' parameter should be defined");
    console.assert(typeof noticeObject.bookID === 'string', `cTQ addNoticePartial: 'bookID' parameter should be a string not a '${typeof noticeObject.bookID}'`);
    console.assert(noticeObject.bookID.length === 3, `cTQ addNoticePartial: 'bookID' parameter should be three characters long not ${noticeObject.bookID.length}`);
    console.assert(books.isValidBookID(noticeObject.bookID), `cTQ addNoticePartial: '${noticeObject.bookID}' is not a valid USFM book identifier`);
    // console.assert(C !== undefined, "cTQ addNoticePartial: 'C' parameter should be defined");
    if (noticeObject.C) console.assert(typeof noticeObject.C === 'string', `cTQ addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}'`);
    // console.assert(V !== undefined, "cTQ addNoticePartial: 'V' parameter should be defined");
    if (noticeObject.V) console.assert(typeof noticeObject.V === 'string', `cTQ addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}'`);
    // console.assert(characterIndex !== undefined, "cTQ addNoticePartial: 'characterIndex' parameter should be defined");
    if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cTQ addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}'`);
    // console.assert(extract !== undefined, "cTQ addNoticePartial: 'extract' parameter should be defined");
    if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cTQ addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}'`);
    console.assert(noticeObject.location !== undefined, "cTQ addNoticePartial: 'location' parameter should be defined");
    console.assert(typeof noticeObject.location === 'string', `cTQ addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}'`);
    console.assert(noticeObject.extra !== undefined, "cTQ addNoticePartial: 'extra' parameter should be defined");
    console.assert(typeof noticeObject.extra === 'string', `cTQ addNoticePartial: 'extra' parameter should be a string not a '${typeof noticeObject.extra}'`);
    ctqResult.noticeList.push({ ...noticeObject, repoCode, repoName, bookID });
  }


  async function ourCheckTQFileContents(repoCode, bookID, C, V, cfFilename, fileContent, fileLocation, optionalCheckingOptions) {
    // console.log(`checkBookPackage ourCheckTQFileContents(${cfFilename})`);

    // Updates the global list of notices
    console.assert(repoCode !== undefined, "cTQ ourCheckTQFileContents: 'repoCode' parameter should be defined");
    console.assert(typeof repoCode === 'string', `cTQ ourCheckTQFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    console.assert(cfFilename !== undefined, "cTQ ourCheckTQFileContents: 'cfFilename' parameter should be defined");
    console.assert(typeof cfFilename === 'string', `cTQ ourCheckTQFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
    console.assert(fileContent !== undefined, "cTQ ourCheckTQFileContents: 'fileContent' parameter should be defined");
    console.assert(typeof fileContent === 'string', `cTQ ourCheckTQFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}'`);
    console.assert(fileLocation !== undefined, "cTQ ourCheckTQFileContents: 'fileLocation' parameter should be defined");
    console.assert(typeof fileLocation === 'string', `cTQ ourCheckTQFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

    const cfResultObject = await checkFileContents(languageCode, cfFilename, fileContent, fileLocation, optionalCheckingOptions);
    // console.log("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
    // for (const successEntry of cfResultObject.successList) console.log("  ourCheckTQFileContents:", successEntry);

    // Process noticeList line by line,  appending the repoCode as an extra field as we go
    for (const noticeEntry of cfResultObject.noticeList) {
      // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=extract, 8=location
      // console.assert(Object.keys(noticeEntry).length === 5, `cTQ ourCheckTQFileContents notice length=${Object.keys(noticeEntry).length}`);
      // We add the repoCode as an extra value
      addNoticePartial({ ...noticeEntry, bookID, C, V, extra: repoCode });
    }
  }
  // end of ourCheckTQFileContents function


  // Main code for checkTQMarkdownBook
  // We need to find and check all the markdown folders/files for this book
  const getFileListFromZip_ = checkingOptions && checkingOptions.getFileListFromZip ? checkingOptions.getFileListFromZip : getFileListFromZip;
  let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
  const pathList = await getFileListFromZip_({ username, repository: repoName, branch, optionalPrefix: `${bookID.toLowerCase()}/` });
  if (!Array.isArray(pathList) || !pathList.length) {
    console.error("checkTQrepo failed to load", username, repoName, branch);
    const details = `username=${username}`;
    if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
      ctqResult.noticeList.push({ priority: 997, message: "Repository doesn't exist", details, username, repoCode, repoName, location: generalLocation, extra: repoCode });
    else
      addNoticePartial({ priority: 996, message: "Unable to load", details, bookID, location: generalLocation, extra: repoCode });
  } else {

    // console.log(`  Got ${pathList.length} pathList entries`)
    for (const thisPath of pathList) {
      // console.log("checkTQMarkdownBook: Try to load", username, repoName, thisPath, branch);

      console.assert(thisPath.endsWith('.md'), `Expected ${thisPath} to end with .md`);
      // const filename = thisPath.split('/').pop();
      const pathParts = thisPath.slice(0, -3).split('/');
      const C = pathParts[pathParts.length - 2].replace(/^0+(?=\d)/, ''); // Remove leading zeroes
      const V = pathParts[pathParts.length - 1].replace(/^0+(?=\d)/, ''); // Remove leading zeroes

      const getFile_ = (checkingOptions && checkingOptions.getFile) ? checkingOptions.getFile : cachedGetFile;
      let tqFileContent;
      try {
        tqFileContent = await getFile_({ username, repository: repoName, path: thisPath, branch });
        // console.log("Fetched fileContent for", repoName, thisPath, typeof tqFileContent, tqFileContent.length);
        checkedFilenames.push(thisPath);
        totalCheckedSize += tqFileContent.length;
      } catch (tQerror) {
        console.error("checkTQMarkdownBook failed to load", username, repoName, thisPath, branch, tQerror + '');
        let details = `username=${username}`;
        if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
          ctqResult.noticeList.push({ priority: 997, message: "Repository doesn't exist", details, username, repoCode, repoName, location: generalLocation, extra: repoCode });
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
  // console.log(`  checkTQMarkdownBook returning ${JSON.stringify(ctqResult)}`);
  return ctqResult;
}
// end of checkTQMarkdownBook function


/*
    checkBookPackage
*/
/**
 *
 * @param {string} username
 * @param {string} languageCode
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
  // console.log(`checkBookPackage(${username}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)})…`)
  let abortFlag = false;
  const startTime = new Date();
  bookID = bookID.toUpperCase(); // normalise to USFM standard

  let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0, checkedRepoNames = new Set();
  let checkBookPackageResult = { successList: [], noticeList: [] };

  let dataSet = checkingOptions.dataSet; // Can be 'OLD' (Markdown, etc.), 'NEW' (TSV only), or 'BOTH'
  if (!dataSet) dataSet = 'OLD';

  const newCheckingOptions = checkingOptions ? { ...checkingOptions } : {}; // clone before modify
  const getFile_ = newCheckingOptions.getFile ? newCheckingOptions.getFile : cachedGetFile; // default to using caching of files
  newCheckingOptions.getFile = getFile_; // use same getFile_ when we call core functions
  if (!newCheckingOptions.originalLanguageRepoUsername) newCheckingOptions.originalLanguageRepoUsername = username;
  if (!newCheckingOptions.taRepoUsername) newCheckingOptions.taRepoUsername = username;

  // No point in passing the branch through as a parameter
  //  coz if it's not 'master', it's unlikely to be common for all the repos
  const branch = 'master';

  const generalLocation = ` in ${languageCode} ${bookID} book package from ${username} ${branch} branch`;


  function addSuccessMessage(successString) {
    // console.log(`checkBookPackage success: ${successString}`);
    checkBookPackageResult.successList.push(successString);
  }


  function addNoticePartial(noticeObject) {
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // console.log(`checkBookPackage addNoticePartial: (priority=${noticeObject.priority}) ${noticeObject.bookID} ${noticeObject.C}:${noticeObject.V} ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
    console.assert(noticeObject.priority !== undefined, "cBP addNoticePartial: 'priority' parameter should be defined");
    console.assert(typeof noticeObject.priority === 'number', `cBP addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}'`);
    console.assert(noticeObject.message !== undefined, "cBP addNoticePartial: 'message' parameter should be defined");
    console.assert(typeof noticeObject.message === 'string', `cBP addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}'`);
    // console.assert(bookID !== undefined, "cBP addNoticePartial: 'bookID' parameter should be defined");
    if (noticeObject.bookID) {
      console.assert(typeof noticeObject.bookID === 'string', `cBP addNoticePartial: 'bookID' parameter should be a string not a '${typeof noticeObject.bookID}'`);
      console.assert(noticeObject.bookID.length === 3, `cBP addNoticePartial: 'bookID' parameter should be three characters long not ${noticeObject.bookID.length}`);
      console.assert(bookID === 'OBS' || books.isValidBookID(noticeObject.bookID), `cBP addNoticePartial: '${noticeObject.bookID}' is not a valid USFM book identifier`);
    }
    // console.assert(C !== undefined, "cBP addNoticePartial: 'C' parameter should be defined");
    if (noticeObject.C) console.assert(typeof noticeObject.C === 'string', `cBP addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}'`);
    // console.assert(V !== undefined, "cBP addNoticePartial: 'V' parameter should be defined");
    if (noticeObject.V) console.assert(typeof noticeObject.V === 'string', `cBP addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}'`);
    // console.assert(characterIndex !== undefined, "cBP addNoticePartial: 'characterIndex' parameter should be defined");
    if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cBP addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}'`);
    // console.assert(extract !== undefined, "cBP addNoticePartial: 'extract' parameter should be defined");
    if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cBP addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}'`);
    console.assert(noticeObject.location !== undefined, "cBP addNoticePartial: 'location' parameter should be defined");
    console.assert(typeof noticeObject.location === 'string', `cBP addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}'`);
    console.assert(noticeObject.extra !== undefined, "cBP addNoticePartial: 'extra' parameter should be defined");
    console.assert(typeof noticeObject.extra === 'string', `cBP addNoticePartial: 'extra' parameter should be a string not a '${typeof noticeObject.extra}'`);
    checkBookPackageResult.noticeList.push({ ...noticeObject, bookID, username });
  }


  async function ourCheckBPFileContents(repoCode, repoName, cfFilename, fileContent, fileLocation, optionalCheckingOptions) {
    // console.log(`checkBookPackage ourCheckBPFileContents(${repoCode}, ${cfFilename}, ${fileContent.length}, ${fileLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);

    // Updates the global list of notices
    console.assert(repoCode !== undefined, "cBP ourCheckBPFileContents: 'repoCode' parameter should be defined");
    console.assert(typeof repoCode === 'string', `cBP ourCheckBPFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    console.assert(cfFilename !== undefined, "cBP ourCheckBPFileContents: 'cfFilename' parameter should be defined");
    console.assert(typeof cfFilename === 'string', `cBP ourCheckBPFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
    console.assert(fileContent !== undefined, "cBP ourCheckBPFileContents: 'fileContent' parameter should be defined");
    console.assert(typeof fileContent === 'string', `cBP ourCheckBPFileContents: 'fileContent' parameter should be a string not a '${typeof fileContent}'`);
    console.assert(fileLocation !== undefined, "cBP ourCheckBPFileContents: 'fileLocation' parameter should be defined");
    console.assert(typeof fileLocation === 'string', `cBP ourCheckBPFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

    const cfcResultObject = await checkFileContents(languageCode, cfFilename, fileContent, fileLocation, optionalCheckingOptions);
    // console.log("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
    // for (const successEntry of cfResultObject.successList) console.log("  ourCheckBPFileContents:", successEntry);
    // console.log("cfcResultObject", JSON.stringify(cfcResultObject));

    // Process noticeList line by line,  appending the repoCode as an extra field as we go
    for (const cfcNoticeEntry of cfcResultObject.noticeList) // noticeEntry is an object
      if (cfcNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN check
        checkBookPackageResult.noticeList.push(cfcNoticeEntry); // Just copy the complete notice as is
      else // For our direct checks, we add the repoCode as an extra value (unless it's already there from a TA or TW check)
        addNoticePartial({ ...cfcNoticeEntry, repoCode, repoName, filename: cfFilename, extra: cfcNoticeEntry.extra ? cfcNoticeEntry.extra : repoCode });
    // The following is needed coz we might be checking the linked TA and/or TW articles from TN TSV files
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
   * @param {string} repoCode, e.g., TA
   * @param {string} repoName, e.g., en_ta
   * @param {string} manifestLocation
   * @param {Object} optionalCheckingOptions
   */
  async function ourCheckManifest(repoCode, repoName, manifestLocation, optionalCheckingOptions) {
    // Updates the global list of notices
    // console.log(`checkBookPackage ourCheckManifest(${repoCode}, ${repoName}, ${manifestLocation}, ${JSON.stringify(optionalCheckingOptions)})…`);
    console.assert(repoCode !== undefined, "cBP ourCheckManifest: 'repoCode' parameter should be defined");
    console.assert(typeof repoCode === 'string', `cBP ourCheckManifest: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
    console.assert(manifestLocation !== undefined, "cBP ourCheckManifest: 'manifestLocation' parameter should be defined");
    console.assert(typeof manifestLocation === 'string', `cBP ourCheckManifest: 'manifestLocation' parameter should be a string not a '${typeof manifestLocation}'`);

    let manifestFileContent;
    try {
      // console.log("checkBookPackage ourCheckManifest about to fetch manifest", username, repoName, branch);
      manifestFileContent = await getFile_({ username, repository: repoName, path: MANIFEST_FILENAME, branch });
      // console.log("checkBookPackage ourCheckManifest fetched content for manifest", username, repoName, branch, typeof manifestFileContent, manifestFileContent.length);
      // console.log(manifestFileContent);
    } catch (cBPgfError) {
      console.error(`checkBookPackage ourCheckManifest(${username}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)}) failed to load manifest`, username, repoName, branch, cBPgfError + '');
      let details = `username=${username}`;
      if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
        checkBookPackageResult.noticeList.push({ priority: 997, message: "Repository doesn't exist", details, username, repoCode, repoName, location: manifestLocation, extra: repoCode });
      else {
        // eslint-disable-next-line eqeqeq
        if (cBPgfError != 'TypeError: repoFileContent is null') details += ` error=${cBPgfError}`;
        addNoticePartial({ priority: 996, message: "Unable to load", details: `username=${username} error=${cBPgfError}`, repoName, filename: MANIFEST_FILENAME, location: manifestLocation, extra: repoCode });
      }
    }
    if (manifestFileContent) {
      const cmtResultObject = checkManifestText('Manifest', manifestFileContent, manifestLocation, optionalCheckingOptions);
      // console.log(`ourCheckManifest checkManifestText(${repoName}) returned ${cmtResultObject.successList.length} success message(s) and ${cmtResultObject.noticeList.length} notice(s)`);
      // console.log(`ourCheckManifest checkManifestText(${repoName}) returned ${JSON.stringify(cmtResultObject)}`);
      // NOTE: We ignore the returned success messages here
      // for (const successEntry of cfResultObject.successList) console.log("  ourCheckBPFileContents:", successEntry);
      // console.log("cfcResultObject", JSON.stringify(cfcResultObject));

      // Process noticeList line by line,  appending the repoCode as an extra field as we go
      for (const cfcNoticeEntry of cmtResultObject.noticeList) {
        // NOTE: We don't use addNoticePartial, because it adds a misleading BookID
        // addNoticePartial({ ...cfcNoticeEntry, filename: MANIFEST_FILENAME, extra: `${repoCode} MANIFEST` });
        checkBookPackageResult.noticeList.push({ ...cfcNoticeEntry, username, repoCode, repoName, filename: MANIFEST_FILENAME, extra: `${repoCode} MANIFEST` });
      }
      return manifestFileContent.length;
    }
    // NOTE: We don't use addNoticePartial, because it adds a misleading BookID
    // addNoticePartial({ priority: 956, message: "Got empty manifest file", repoName, filename: MANIFEST_FILENAME, location: manifestLocation, extra: `${repoCode} MANIFEST` });
    checkBookPackageResult.noticeList.push({ priority: 956, message: "Got empty manifest file", repoName, filename: MANIFEST_FILENAME, location: manifestLocation, extra: `${repoCode} MANIFEST` });
    return 0;
  }
  // end of ourCheckManifest function


  // Main code for checkBookPackage()
  // NOTE: TN1 and TQ1 are used here for the old resource formats, e.g., 9-column TSV TN and markdown TQ
  //        The TN, TQ, SN, and SQ repoCodes refer to the new 7-column annotation TSV format.
  // console.log("checkBookPackage() main code…");
  let repoCodeList;
  let bookNumberAndName, whichTestament;
  if (bookID === 'OBS') {
    // NOTE: No code below to handle OBS TN1 and TQ1 which are markdown repos
    repoCodeList = ['TWL', 'OBS', 'TN', 'TQ', 'SN', 'SQ'];
  } else { // not OBS
    // We also need to know the number for USFM books
    try {
      bookNumberAndName = books.usfmNumberName(bookID);
      whichTestament = books.testament(bookID); // returns 'old' or 'new'
    } catch (bNNerror) {
      if (books.isValidBookID(bookID)) // must be in FRT, BAK, etc.
        whichTestament = 'other'
      else {
        addNoticePartial({ priority: 902, message: "Bad function call: should be given a valid book abbreviation", extract: bookID, location: ` (not '${bookID}')${generalLocation}` }); return checkBookPackageResult;
      }
    }
    // console.log(`checkBookPackage: bookNumberAndName='${bookNumberAndName}' (${whichTestament} testament)`);

    // So now we want to work through checking this one specified Bible book in various repos
    const origLangRepoCode = whichTestament === 'old' ? 'UHB' : 'UGNT';
    if (dataSet === 'OLD')
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'LT', 'ST', 'TN1', 'TQ1'] : [origLangRepoCode, 'LT', 'ST', 'TN1', 'TQ1'];
    else if (dataSet === 'NEW')
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'TWL', 'LT', 'ST', 'TN', 'TQ', 'SN', 'SQ'] : [origLangRepoCode, 'LT', 'ST', 'TN1', 'TQ1'];
    else // assume BOTH
      repoCodeList = languageCode === 'en' ? [origLangRepoCode, 'TWL', 'LT', 'ST', 'TN', 'TN1', 'TQ', 'TQ1', 'SN', 'SQ'] : [origLangRepoCode, 'LT', 'ST', 'TN1', 'TQ1'];
  }


  // Main loop for checkBookPackage()
  const checkedManifestDetails = [];
  let numCheckedRepos = 0;
  for (const repoCode of repoCodeList) {
    if (abortFlag) break;
    const repoLocation = ` in ${repoCode}${generalLocation}`;
    let repoName = formRepoName(languageCode, repoCode);
    const adjustedRepoCode = (repoCode.endsWith('1') ? repoCode.substring(0, repoCode.length - 1) : repoCode).toLowerCase();
    if (bookID === 'OBS' && repoCode !== 'OBS' && repoName === `${languageCode}_${adjustedRepoCode}`)
      repoName = `${languageCode}_obs-${adjustedRepoCode}`;
    console.log(`checkBookPackage: check ${bookID} in ${repoCode} (${languageCode} ${bookID} from ${username} ${repoName})`);

    // Update our "waiting" message
    setResultValue(<p style={{ color: 'magenta' }}>Checking {username} {languageCode} <b>{bookID}</b> book package in <b>{repoCode}</b> (checked <b>{numCheckedRepos}</b>/{repoCodeList.length} repos)…</p>);

    let filename;
    if (repoCode === 'UHB' || repoCode === 'UGNT' || repoCode === 'LT' || repoCode === 'ST') {
      // TODO: Might we need specific releases/tags for some of these (e.g., from the TN manifest)???
      // TODO: Do we need to hard-code where to find the UHB and UGNT???
      filename = `${bookNumberAndName}.usfm`;
    }
    else if (repoCode === 'TWL' || repoCode === 'TN' || repoCode === 'TQ') { // in translation-annotations repo
      filename = `${bookID}_${repoCode.toLowerCase()}.tsv`
    }
    else if (repoCode === 'SN' || repoCode === 'SQ') { // in study-annotations repo
      filename = `${bookID}_${repoCode.toLowerCase()}.tsv`
    }
    else if (repoCode === 'TN1') {
      try {
        filename = await cachedGetBookFilenameFromManifest({ username, repository: repoName, branch, bookID: bookID.toLowerCase() });
        console.assert(filename.startsWith(`${languageCode}_`), `Expected TN filename '${filename}' to start with the language code '${languageCode}_'`);
      } catch (e) {
        console.error(`cachedGetBookFilenameFromManifest failed with: ${e}`);
        filename = `${languageCode}_tn_${bookNumberAndName}.tsv`;
      }
      console.assert(filename.endsWith('.tsv'), `Expected TN filename '${filename}' to end with '.tsv'`);
    }

    if (repoCode === 'OBS') {
      // console.log("Calling OBS checkRepo()…");
      checkBookPackageResult = await checkRepo(username, `${languageCode}_obs`, branch, generalLocation, setResultValue, newCheckingOptions); // Adds the notices to checkBookPackageResult
      // console.log(`checkRepo() returned ${checkBookPackageResult.successList.length} success message(s) and ${checkBookPackageResult.noticeList.length} notice(s)`);
      // console.log("crResultObject keys", JSON.stringify(Object.keys(checkBookPackageResult)));
      addSuccessMessage(`Checked ${languageCode} OBS repo from ${username}`);
    } else if (repoCode === 'TQ1') {
      // This is the old markdown resource with hundreds/thousands of files
      const tqResultObject = await checkTQMarkdownBook(username, languageCode, repoName, branch, bookID, newCheckingOptions);
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
      let repoFileContent;
      try {
        const path = repoName.endsWith('-annotations') ? `${bookID}/${filename}` : filename;
        // console.log("checkBookPackage about to fetch fileContent for", username, repoName, branch, path);
        repoFileContent = await getFile_({ username, repository: repoName, path, branch });
        // console.log("checkBookPackage fetched fileContent for", username, repoName, branch, filename, typeof repoFileContent, repoFileContent.length);
        checkedFilenames.push(filename);
        totalCheckedSize += repoFileContent.length;
        checkedRepoNames.add(repoName);
      } catch (cBPgfError) {
        console.error(`checkBookPackage(${username}, ${languageCode}, ${bookID}, (fn), ${JSON.stringify(checkingOptions)}) failed to load`, username, repoName, filename, branch, cBPgfError + '');
        // console.log(`cBPgfError=${cBPgfError} or ${JSON.stringify(cBPgfError)} or2 ${cBPgfError == 'TypeError: repoFileContent is null'} or3 ${cBPgfError.message == 'TypeError: repoFileContent is null'} or4 ${cBPgfError.message === 'TypeError: repoFileContent is null'}`);
        let details = `username=${username}`;
        if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
          checkBookPackageResult.noticeList.push({ priority: 997, message: "Repository doesn't exist", details, username, repoCode, repoName, location: repoLocation, extra: repoCode });
        else {
          // eslint-disable-next-line eqeqeq
          if (cBPgfError != 'TypeError: repoFileContent is null') details += ` error=${cBPgfError}`;
          addNoticePartial({ priority: 996, message: "Unable to load", details, repoCode, repoName, filename, location: repoLocation, extra: repoCode });
        }
      }
      if (repoFileContent) {
        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        await ourCheckBPFileContents(repoCode, repoName, filename, repoFileContent, generalLocation, newCheckingOptions); // Adds the notices to checkBookPackageResult
        checkedFileCount += 1;
        checkedFilenameExtensions.add(filename.split('.').pop());
        addSuccessMessage(`Checked ${repoCode.toUpperCase()} file: ${filename}`);
      }

      // We also check the manifest file for each repo if requested
      //  because a faulty manifest might also stop a BP from working correctly in various programs
      if (checkingOptions.checkManifestFlag) {
        if (!checkedManifestDetails.includes(repoName)) { // Don't want to check more than once, esp. for annotations repos
          checkedManifestDetails.push(repoName); // Remember that we checked this one
          // console.log("BEFORE", checkBookPackageResult.noticeList.length);
          const numCheckedCharacters = await ourCheckManifest(repoCode, repoName, generalLocation, newCheckingOptions);
          // console.log("AFTER", checkBookPackageResult.noticeList.length);
          if (numCheckedCharacters > 0) {
            checkedFileCount += 1;
            checkedFilenames.push('manifest.yaml');
            checkedFilenameExtensions.add('yaml');
            totalCheckedSize += numCheckedCharacters;
            addSuccessMessage(`Checked ${repoName} manifest file`);
          }
        }
      }
    }
    numCheckedRepos += 1;
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
  // console.log("checkBookPackageResult:", JSON.stringify(checkBookPackageResult));
  // console.log(`checkBookPackageResult(${bookID}): elapsedSeconds = ${checkBookPackageResult.elapsedSeconds}, notices count = ${checkBookPackageResult.noticeList.length}`);
  return checkBookPackageResult;
};
// end of checkBookPackage()
