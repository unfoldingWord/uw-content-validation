import React from 'react';
import { REPO_CODES_LIST } from '../../core/defaults';
// eslint-disable-next-line no-unused-vars
import * as books from '../../core/books/books';
import { checkFileContents } from '../file-check/checkFileContents';
import { repositoryExistsOnDoor43, getFileListFromZip, cachedGetFile, cachedGetRepositoryZipFile } from '../../core/getApi';
// eslint-disable-next-line no-unused-vars
import { userLog, functionLog, debugLog, logicAssert, parameterAssert } from '../../core/utilities';


// const REPO_VALIDATOR_VERSION_STRING = '0.6.6';


/**
 *
 * @param {string} username
 * @param {string} repoName
 * @param {string} repoBranch
 * @param {string} givenLocation
 * @param {Function} setResultValue
 * @param {Object} givenCheckingOptions
 */
export async function checkRepo(username, repoName, repoBranch, givenLocation, setResultValue, givenCheckingOptions) {
  /*
  It returns an object containing:
      successList: an array of strings to tell the use exactly what has been checked
      noticeList: an array of 9 (i.e., with extra bookOrFileCode parameter at end) notice components
  */
  // functionLog(`checkRepo(un='${username}', rN='${repoName}', rBr='${repoBranch}', ${givenLocation}, (fn), ${JSON.stringify(givenCheckingOptions)})…`);
  //parameterAssert(username !== undefined, "checkRepo: 'username' parameter should be defined");
  //parameterAssert(typeof username === 'string', `checkRepo: 'username' parameter should be a string not a '${typeof username}'`);
  //parameterAssert(repoName !== undefined, "checkRepo: 'repoName' parameter should be defined");
  //parameterAssert(typeof repoName === 'string', `checkRepo: 'repoName' parameter should be a string not a '${typeof repoName}'`);
  //parameterAssert(repoBranch !== undefined, "checkRepo: 'repoBranch' parameter should be defined");
  //parameterAssert(typeof repoBranch === 'string', `checkRepo: 'repoBranch' parameter should be a string not a '${typeof repoBranch}'`);
  //parameterAssert(givenLocation !== undefined, "checkRepo: 'givenRowLocation' parameter should be defined");
  //parameterAssert(typeof givenLocation === 'string', `checkRepo: 'givenRowLocation' parameter should be a string not a '${typeof givenLocation}'`);

  let abortFlag = false;
  const startTime = new Date();

  let [languageCode, repoCode] = repoName.split('_');
  repoCode = repoCode.toUpperCase();
  // debugLog(`checkRepo got languageCode='${languageCode}' repoCode='${repoCode}' repoBranch='${repoBranch}'`);
  if (repoCode === 'TN2') {
    repoCode = 'TN';
    if (repoBranch === undefined) repoBranch = 'newFormat';
  } else if (repoCode === 'OBS-TN2') {
    repoCode = 'OBS-TN';
    if (repoBranch === undefined) repoBranch = 'newFormat';
  } else if (repoCode === 'OBS-SN2') {
    repoCode = 'OBS-SN';
    if (repoBranch === undefined) repoBranch = 'newFormat';
  } else if (repoCode === 'OBS-SQ2') {
    repoCode = 'OBS-SQ';
    if (repoBranch === undefined) repoBranch = 'newFormat';
  } else if (repoCode.endsWith('LT')) repoCode = 'LT';
  else if (repoCode.endsWith('ST')) repoCode = 'ST';
  // debugLog(`checkRepo now has languageCode='${languageCode}' repoCode='${repoCode}' repoBranch='${repoBranch}'`);
  logicAssert(REPO_CODES_LIST.includes(repoCode), `checkRepo: 'repoCode' parameter should not be '${repoCode}'`);

  if (repoBranch === undefined) repoBranch = 'master'; // Ideally we should ask what the default branch is

  const newCheckingOptions = givenCheckingOptions ? { ...givenCheckingOptions } : {}; // clone before modify
  const getFile_ = newCheckingOptions.getFile ? newCheckingOptions.getFile : cachedGetFile; // default to using caching of files
  newCheckingOptions.getFile = getFile_; // use same getFile_ when we call core functions
  if (!newCheckingOptions.originalLanguageRepoUsername) newCheckingOptions.originalLanguageRepoUsername = username;
  if (!newCheckingOptions.taRepoUsername) newCheckingOptions.taRepoUsername = username;
  if (!newCheckingOptions.twRepoUsername) newCheckingOptions.twRepoUsername = username;

  let checkRepoResult = {
    successList: [], noticeList: [],
    checkedFileCount: 0, checkedFileSizes: 0,
    checkedFilenames: [], checkedFilenameExtensions: [], checkedRepoNames: [],
  };

  function addSuccessMessage(successString) {
    // Adds the message to the result that we will later return
    // functionLog(`checkRepo success: ${successString}`);
    checkRepoResult.successList.push(successString);
  }
  function addNoticePartial(incompleteNoticeObject) {
    // Adds the notices to the result that we will later return
    // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
    // Note that bookID,C,V might all be empty strings (as some repos don’t have BCV)
    // functionLog(`checkRepo addNoticePartial: ${incompleteNoticeObject.priority}:${incompleteNoticeObject.message} bookID=${incompleteNoticeObject.bookID} ${incompleteNoticeObject.C}:${incompleteNoticeObject.V} ${incompleteNoticeObject.filename}:${incompleteNoticeObject.lineNumber} ${incompleteNoticeObject.characterIndex > 0 ? ` (at character ${incompleteNoticeObject.characterIndex})` : ""}${incompleteNoticeObject.excerpt ? ` ${incompleteNoticeObject.excerpt}` : ""}${incompleteNoticeObject.location}`);
    //parameterAssert(incompleteNoticeObject.priority !== undefined, "cR addNoticePartial: 'priority' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.priority === 'number', `cR addNoticePartial: 'priority' parameter should be a number not a '${typeof incompleteNoticeObject.priority}'`);
    //parameterAssert(incompleteNoticeObject.message !== undefined, "cR addNoticePartial: 'message' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.message === 'string', `cR addNoticePartial: 'message' parameter should be a string not a '${typeof incompleteNoticeObject.message}'`);
    // parameterAssert(bookID !== undefined, "cR addNoticePartial: 'bookID' parameter should be defined");
    if (incompleteNoticeObject.bookID) {
      //parameterAssert(typeof incompleteNoticeObject.bookID === 'string', `cR addNoticePartial: 'bookID' parameter should be a string not a '${typeof incompleteNoticeObject.bookID}'`);
      //parameterAssert(incompleteNoticeObject.bookID.length === 3, `cR addNoticePartial: 'bookID' parameter should be three characters long not ${incompleteNoticeObject.bookID.length}`);
      //parameterAssert(incompleteNoticeObject.bookID === 'OBS' || books.isOptionalValidBookID(incompleteNoticeObject.bookID), `cR addNoticePartial: '${incompleteNoticeObject.bookID}' is not a valid USFM book identifier`);
    }
    // parameterAssert(C !== undefined, "cR addNoticePartial: 'C' parameter should be defined");
    if (incompleteNoticeObject.C) {
      //parameterAssert(typeof incompleteNoticeObject.C === 'string', `cR addNoticePartial: 'C' parameter should be a string not a '${typeof incompleteNoticeObject.C}'`);
    }
    // parameterAssert(V !== undefined, "cR addNoticePartial: 'V' parameter should be defined");
    if (incompleteNoticeObject.V) {
      //parameterAssert(typeof incompleteNoticeObject.V === 'string', `cR addNoticePartial: 'V' parameter should be a string not a '${typeof incompleteNoticeObject.V}'`);
    }
    // parameterAssert(characterIndex !== undefined, "cR addNoticePartial: 'characterIndex' parameter should be defined");
    if (incompleteNoticeObject.characterIndex) {
      //parameterAssert(typeof incompleteNoticeObject.characterIndex === 'number', `cR addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof incompleteNoticeObject.characterIndex}'`);
    }
    // parameterAssert(excerpt !== undefined, "cR addNoticePartial: 'excerpt' parameter should be defined");
    if (incompleteNoticeObject.excerpt) {
      //parameterAssert(typeof incompleteNoticeObject.excerpt === 'string', `cR addNoticePartial: 'excerpt' parameter should be a string not a '${typeof incompleteNoticeObject.excerpt}'`);
    }
    //parameterAssert(incompleteNoticeObject.location !== undefined, "cR addNoticePartial: 'location' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.location === 'string', `cR addNoticePartial: 'location' parameter should be a string not a '${typeof incompleteNoticeObject.location}'`);
    // parameterAssert(incompleteNoticeObject.extra !== undefined, "cR addNoticePartial: 'extra' parameter should be defined");
    //parameterAssert(typeof incompleteNoticeObject.extra === 'string', `cR addNoticePartial: 'extra' parameter should be a string not a '${typeof incompleteNoticeObject.extra}'`);
    if (incompleteNoticeObject.debugChain) incompleteNoticeObject.debugChain = `checkRepo ${incompleteNoticeObject.debugChain}`;
    // Add in the repoName from the outer scope
    checkRepoResult.noticeList.push({ ...incompleteNoticeObject, username, repoCode, repoName });
  }


  /**
   *
   * @param {string} cfBookOrFileCode
   * @param {string} cfBookID
   * @param {string} cfFilename
   * @param {string} cfFileContent
   * @param {string} cfFileLocation
   * @param {Object} cfCheckingOptions
   */
  async function ourCheckRepoFileContents(cfBookOrFileCode, cfBookID, cfFilename, cfFileContent, cfFileLocation, cfCheckingOptions) {
    // We assume that checking for compulsory fields is done elsewhere
    // functionLog(`checkRepo ourCheckRepoFileContents(bk/fC='${cfBookOrFileCode}', bk='${cfBookID}', fn='${cfFilename}', ${cfFileContent.length}, ${cfFileLocation}, ${JSON.stringify(cfCheckingOptions)})…`);

    // Updates the global list of notices
    //parameterAssert(cfBookOrFileCode !== undefined, "ourCheckRepoFileContents: 'cfBookOrFileCode' parameter should be defined");
    //parameterAssert(typeof cfBookOrFileCode === 'string', `ourCheckRepoFileContents: 'cfBookOrFileCode' parameter should be a string not a '${typeof cfBookOrFileCode}': '${cfBookOrFileCode}'`);
    //parameterAssert(cfBookID !== undefined, "ourCheckRepoFileContents: 'cfBookID' parameter should be defined");
    //parameterAssert(typeof cfBookID === 'string', `ourCheckRepoFileContents: 'cfBookID' parameter should be a string not a '${typeof cfBookID}'`);
    if (cfBookID) {
      //parameterAssert(cfBookID.length === 3, `ourCheckRepoFileContents: 'cfBookID' parameter should be three characters long not ${cfBookID.length}`);
      //parameterAssert(cfBookID.toUpperCase() === cfBookID, `ourCheckRepoFileContents: 'cfBookID' parameter should be UPPERCASE not '${cfBookID}'`);
      //parameterAssert(cfBookID === 'OBS' || books.isValidBookID(cfBookID), `ourCheckRepoFileContents: '${cfBookID}' is not a valid USFM book identifier`);
    }
    //parameterAssert(cfFilename !== undefined, "ourCheckRepoFileContents: 'cfFilename' parameter should be defined");
    //parameterAssert(typeof cfFilename === 'string', `ourCheckRepoFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
    //parameterAssert(cfFileContent !== undefined, "ourCheckRepoFileContents: 'cfFileContent' parameter should be defined");
    //parameterAssert(typeof cfFileContent === 'string', `ourCheckRepoFileContents: 'cfFileContent' parameter should be a string not a '${typeof cfFileContent}'`);
    //parameterAssert(cfFileLocation !== undefined, "ourCheckRepoFileContents: 'cfFileLocation' parameter should be defined");
    //parameterAssert(typeof cfFileLocation === 'string', `ourCheckRepoFileContents: 'cfFileLocation' parameter should be a string not a '${typeof cfFileLocation}'`);
    //parameterAssert(cfCheckingOptions !== undefined, "ourCheckRepoFileContents: 'cfCheckingOptions' parameter should be defined");

    let adjustedLanguageCode = languageCode;
    if (/*filename === 'manifest.yaml' || */cfFilename === 'LICENSE.md'
      || ((languageCode === 'el-x-koine' || languageCode === 'hbo') && cfFilename === 'README.md'))
      adjustedLanguageCode = 'en'; // Correct the language for these auxilliary files
    const cfcResultObject = await checkFileContents(username, adjustedLanguageCode, repoCode, repoBranch, cfFilename, cfFileContent, cfFileLocation, cfCheckingOptions);
    // debugLog("checkFileContents() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");
    // for (const successEntry of resultObject.successList)
    //     userLog("  ", successEntry);

    // Process noticeList line by line,  appending the bookOrFileCode as an extra field as we go
    for (const cfcNoticeEntry of cfcResultObject.noticeList)
      // We add the bookOrFileCode as an extra value (unless it’s already there from a TA or TW check)
      if (cfcNoticeEntry.extra)
        checkRepoResult.noticeList.push(cfcNoticeEntry); // Add this notice directly
      else { // no extra field yet
        // addNoticePartial({ ...cfcNoticeEntry, bookID: cfBookID, extra: bookOrFileCode.toUpperCase() });
        // const newNoticeObject = { ...cfcNoticeEntry, bookID: cfBookID };
        if (cfBookID.length) cfcNoticeEntry.bookID = cfBookID;
        if (/[0-5][0-9]/.test(cfBookOrFileCode)) {// Assume it's an OBS story number 01…50
          // debugLog(`ourCheckRepoFileContents adding integer extra: 'Story ${cfBookOrFileCode}'`);
          cfcNoticeEntry.extra = `Story ${cfBookOrFileCode}`;
        } else if (cfBookOrFileCode !== '01' // UGL (from content/G04230/01.md)
          && (cfBookOrFileCode[0] !== 'H' || cfBookOrFileCode.length !== 5)) {// UHAL, e.g., H0612 from content/H0612.md
          // debugLog(`ourCheckRepoFileContents adding UC extra: '${cfBookOrFileCode.toUpperCase()}'`);
          cfcNoticeEntry.extra = cfBookOrFileCode.toUpperCase();
        }
        addNoticePartial(cfcNoticeEntry);
      }
    /* Removing the following code as it’s unneeded
    //  as we don’t enable TA or TW checking per repo anyway
    // Anyway, not sure that the following code was working yet
    if (repoName.endsWith('_tn')) {
      // The following is needed coz we might be checking the linked TA and/or TW articles from TN2 TSV files
      userLog(`cfcResultObject JSON.stringify({ ...cfcResultObject, noticeList: "deleted" })`);
      if (cfcResultObject.checkedFileCount && cfcResultObject.checkedFileCount > 0) {
        checkRepoResult.checkedFileCount += cfcResultObject.checkedFileCount;
        addSuccessMessage(`Checked ${cfcResultObject.checkedFileCount} linked TA/TW articles`);
      }
      if (cfcResultObject.checkedFilesizes && cfcResultObject.checkedFilesizes > 0) checkRepoResult.totalCheckedSize += cfcResultObject.checkedFilesizes;
      if (cfcResultObject.checkedRepoNames && cfcResultObject.checkedRepoNames.length > 0)
        for (const checkedRepoName of cfcResultObject.checkedRepoNames)
          try { if (checkRepoResult.checkedRepoNames.indexOf(checkedRepoName) < 0) checkRepoResult.checkedRepoNames.push(checkedRepoName); }
          catch { checkRepoResult.checkedRepoNames = [checkedRepoName]; }
      if (cfcResultObject.checkedFilenameExtensions && cfcResultObject.checkedFilenameExtensions.length > 0)
        for (const checkedFilenameExtension of cfcResultObject.checkedFilenameExtensions)
          checkRepoResult.checkedFilenameExtensions.add(checkedFilenameExtension);
    }
    */
  }
  // end of ourCheckRepoFileContents function


  // Main code for checkRepo()
  if (! await repositoryExistsOnDoor43({ username, repository: repoName })) {
    setResultValue(<p style={{ color: 'red' }}>No such <b>{username}/{repoName}</b> repository!</p>);
    console.error(`checkRepo ${username}/${repoName} doesn’t seem to exist`);
    addNoticePartial({ priority: 986, message: "Repository doesn’t seem to exist", username, location: givenLocation, extra: repoName });
  } else {

    // Put all this in a try/catch block coz otherwise it’s difficult to debug/view errors
    try {
      let ourLocation = givenLocation;
      if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
      // if (ourLocation.indexOf(username) < 0)
      // ourLocation = ` in ${username} ${repoName} ${givenLocation}`

      // Update our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Fetching zipped files from <b>{username}/{repoName}</b> repository…</p>);

      // Let’s fetch the zipped repo since it should be much more efficient than individual fetches
      // functionLog(`checkRepo: fetch zip file for ${repoName}…`);
      const fetchRepositoryZipFile_ = givenCheckingOptions?.fetchRepositoryZipFile ? givenCheckingOptions.fetchRepositoryZipFile : cachedGetRepositoryZipFile;
      const zipFetchSucceeded = await fetchRepositoryZipFile_({ username, repository: repoName, branch: repoBranch, branchOrRelease: repoBranch });
      if (!zipFetchSucceeded) {
        console.error(`checkRepo: misfetched zip file for repo with ${zipFetchSucceeded}`);
        setResultValue(<p style={{ color: 'red' }}>Failed to fetching zipped files from <b>{username}/{repoName}</b> repository</p>);
        addNoticePartial({ priority: 989, message: "Unable to find/load repository", location: ourLocation });
        return checkRepoResult;
      }

      // Now we need to fetch the list of files from the repo
      setResultValue(<p style={{ color: 'magenta' }}>Preprocessing file list from <b>{username}/{repoName}</b> repository…</p>);
      // const pathList = await getFileListFromFetchedTreemaps(username, repoName, branch);
      const getFileListFromZip_ = givenCheckingOptions?.getFileListFromZip ? givenCheckingOptions.getFileListFromZip : getFileListFromZip;
      const pathList = await getFileListFromZip_({ username, repository: repoName, branchOrRelease: repoBranch });
      // debugLog(`Got pathlist (${pathList.length}) = ${pathList}`);


      // So now we want to work through checking all the files in this repo
      // Main loop for checkRepo()
      // const countString = `${pathList.length.toLocaleString()} file${pathList.length === 1 ? '' : 's'}`;
      let filesToCheckCount = pathList.length;
      let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
      for (const thisFilepath of pathList) {
        // debugLog(`checkRepo: at top of loop: thisFilepath='${thisFilepath}'`);
        // if (repoCode === 'UHAL' || repoCode === 'UGL') { // temp .........................XXXXXXXXXXXXXXXXXXX
        //   if (thisFilepath.startsWith('LXX_Mapping/')) continue; // skip
        //   if (checkedFileCount > 100) break;
        // }
        if (abortFlag) break;

        // Update our "waiting" message
        setResultValue(<p style={{ color: 'magenta' }}>Checking <b>{username}/{repoName}</b> repo: checked {checkedFileCount.toLocaleString()}/{filesToCheckCount.toLocaleString()} file{filesToCheckCount === 1 ? '' : 's'}…</p>);

        const thisFilename = thisFilepath.split('/').pop();
        // debugLog(`thisFilename=${thisFilename}`);
        const thisFilenameExtension = thisFilename.split('.').pop();
        // debugLog(`thisFilenameExtension=${thisFilenameExtension}`);

        // Default to the main filename without the extension
        let bookOrFileCode = thisFilename.slice(0, thisFilename.length - thisFilenameExtension.length - 1);
        let ourBookID = ''; // Stays blank for OBS files
        if (thisFilenameExtension === 'usfm') {
          // const filenameMain = thisFilename.slice(0, thisFilename.length - 5); // drop .usfm
          // debugLog(`Have USFM filenameMain=${bookOrFileCode}`);
          const bookID = bookOrFileCode.slice(bookOrFileCode.length - 3).toUpperCase();
          // debugLog(`Have USFM bookcode=${bookID}`);
          //parameterAssert(books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier (for USFM)`);
          bookOrFileCode = bookID;
          ourBookID = bookID;
        }
        else if (thisFilenameExtension === 'tsv') {
          // debugLog(`Have TSV thisFilename(${thisFilename.length})='${thisFilename}'`);
          // debugLog(`Have TSV bookOrFileCode(${bookOrFileCode.length})='${bookOrFileCode}'`);
          let bookID;
          // bookOrFileCode could be something like 'en_tn_09-1SA.tsv ' or 'tn_2CO' or 'twl_1CH'
          // bookID = (bookOrFileCode.length === 6 || bookOrFileCode.length === 7) ? bookOrFileCode.slice(0, 3) : bookOrFileCode.slice(-3).toUpperCase();
          bookID = bookOrFileCode.slice(-3).toUpperCase();
          logicAssert(bookID !== 'twl' && bookID !== 'TWL', `Should get a valid bookID here, not '${bookID}'`)
          // debugLog(`Have TSV bookcode(${bookID.length})='${bookID}'`);
          if (repoCode === 'TWL' || repoCode === 'SN' || repoCode === 'SQ' || repoCode === 'TN2' || repoCode === 'TQ') {// new repos allow `OBS`
            //parameterAssert(bookID === 'OBS' || books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier (for TSV)`);
          } else {
            //parameterAssert(bookID !== 'OBS' && books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier (for TSV)`);
          }
          bookOrFileCode = bookID;
          ourBookID = bookID;
        }
        else if (repoName.endsWith('_ta') && thisFilepath.indexOf('/') > 0)
          bookOrFileCode = thisFilepath.split('/')[1];
        else if (repoName.endsWith('_tq') && thisFilepath.indexOf('/') > 0)
          bookOrFileCode = thisFilepath.split('/')[0];

        let whichTestament = 'none'; // For non-book repos, e.g., TW, TA
        if (bookOrFileCode === 'OBS')
          whichTestament = 'both';
        else if (bookOrFileCode.length === 3) { // but not OBS
          try {
            whichTestament = books.testament(bookOrFileCode); // returns 'old' or 'new'
          } catch (bNNerror) {
            if (books.isValidBookID(bookOrFileCode)) // must be in FRT, BAK, etc.
              whichTestament = 'other';
          }
          // logicAssert(whichTestament === 'old' || whichTestament === 'new', `checkRepo() couldn’t find testament for '${bookOrFileCode}': got ${whichTestament}`);
        }
        // debugLog(`checkRepo: Found testament '${whichTestament}' for '${bookOrFileCode}'`);
        if ((givenCheckingOptions?.skipOTBooks && whichTestament === 'old')
          || (givenCheckingOptions?.skipNTBooks && whichTestament === 'new')) {
          // debugLog(`checkRepo skipping ${repoName} '${bookOrFileCode}' (${whichTestament}) because skipOTBooks=${givenCheckingOptions.skipOTBooks} and skipNTBooks=${givenCheckingOptions.skipNTBooks}`);
          --filesToCheckCount;
          continue;
        }

        // debugLog(`checkRepo: Try to load ${username} ${repoName} ${thisFilepath} ${repoBranch}`);
        // debugLog(`checkRepo:        bookOrFileCode='${bookOrFileCode}' ourBookID='${ourBookID}'`);
        const getFile_ = givenCheckingOptions?.getFile ? givenCheckingOptions.getFile : cachedGetFile;
        let repoFileContent;
        try {
          repoFileContent = await getFile_({ username, repository: repoName, path: thisFilepath, branch: repoBranch });
          // debugLog("Fetched fileContent for", repoName, thisPath, typeof repoFileContent, repoFileContent.length);
        } catch (cRgfError) { // NOTE: The error can depend on whether the zipped repo is cached or not
          console.error(`checkRepo(${username}, ${repoName}, ${repoBranch}, ${givenLocation}, (fn), ${JSON.stringify(givenCheckingOptions)})) failed to load`, thisFilepath, repoBranch, `${cRgfError}`);
          if (! await repositoryExistsOnDoor43({ username, repository: repoName }))
            checkRepoResult.noticeList.push({ priority: 997, message: "Repository doesn’t exist", username, repoCode, repoName, location: givenLocation, extra: repoCode });
          else {
            const notice = { priority: 996, message: "Unable to load file", username, bookID: ourBookID, filename: thisFilename, location: `${givenLocation} ${thisFilepath}`, extra: repoName };
            // eslint-disable-next-line eqeqeq
            if (cRgfError != 'TypeError: repoFileContent is null') notice.details = `error=${cRgfError}`;
            addNoticePartial(notice);
          }
          return;
        }
        if (repoFileContent) {
          if (pathList.length < 100) // assume they might be lots of very small files if >= 100
            userLog(`checkRepo for ${repoName} checking ${thisFilename}…`);
          await ourCheckRepoFileContents(bookOrFileCode, ourBookID,
            // OBS has many files with the same name, so we have to give some of the path as well
            // repoName.endsWith('_obs') ? thisFilepath.replace('content/', '') : thisFilename,
            thisFilenameExtension === 'md' ? thisFilepath.replace('content/', '').replace('bible/', '') : thisFilename,
            repoFileContent, ourLocation, newCheckingOptions);
          checkedFileCount += 1;
          checkedFilenames.push(thisFilename);
          checkedFilenameExtensions.add(thisFilenameExtension);
          totalCheckedSize += repoFileContent.length;
          // functionLog(`checkRepo checked ${thisFilename}`);
          if (thisFilenameExtension !== 'md') // There’s often far, far too many of these
            addSuccessMessage(`Checked ${repoName} ${bookOrFileCode.toUpperCase()} file: ${thisFilename.endsWith('.yaml') ? thisFilepath : thisFilename}`);
        }
      }

      // Check that we processed a license and a manifest
      if (checkedFilenames.indexOf('LICENSE.md') < 0)
        addNoticePartial({ priority: 946, message: "Missing LICENSE.md", location: ourLocation, extra: `${repoName} LICENSE` });
      if (checkedFilenames.indexOf('manifest.yaml') < 0)
        addNoticePartial({ priority: 947, message: "Missing manifest.yaml", location: ourLocation, extra: `${repoName} MANIFEST` });

      // Add some extra fields to our checkRepoResult object
      //  in case we need this information again later
      checkRepoResult.checkedFileCount += checkedFileCount;
      checkRepoResult.checkedFilenames = checkedFilenames;
      checkRepoResult.checkedFilenameExtensions = [...checkRepoResult.checkedFilenameExtensions, ...checkedFilenameExtensions]; // convert Set to Array
      checkRepoResult.checkedFilesizes += totalCheckedSize;
      checkRepoResult.checkedRepoNames.unshift(`${username}/${repoName}`);
      // checkRepoResult.checkedOptions = checkingOptions; // This is done at the caller level

      addSuccessMessage(`Checked ${username} repo: ${repoName}`);
      // functionLog(`checkRepo() is returning ${checkRepoResult.successList.length.toLocaleString()} success message(s) and ${checkRepoResult.noticeList.length.toLocaleString()} notice(s)`);
    } catch (cRerror) {
      console.error(`checkRepo main code block got error: ${cRerror.message}`);
      setResultValue(<>
        <p style={{ color: 'red' }}>checkRepo main code block got error: <b>{cRerror.message}</b> with {cRerror.trace}</p>
      </>);

    }
  }
  checkRepoResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
  // debugLog(`checkRepo() returning ${JSON.stringify(checkRepoResult)}`);
  return checkRepoResult;
};
// end of checkRepo()
