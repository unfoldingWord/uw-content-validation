import React from 'react';
import * as books from './books';
import { getRepoName } from './utilities';
import { getFilelistFromZip, getFile, getFileCached, fetchRepositoryZipFile, clearCaches } from './getApi';
import checkUSFMText from './usfm-text-check';
import checkMarkdownText from './markdown-text-check';
import checkPlainText from './plain-text-check';
import checkYAMLText from './yaml-text-check';
import checkManifestText from './manifest-text-check';
import checkTN_TSVText from './tn-table-text-check';


/**
 * clears the caches of stale data and preloads repo zips, before running book package checks
 * @param {string} username
 * @param {string} languageCode
 * @param {Array} bookIDList - one or more books that will be checked
 * @param {string} branch - optional, defaults to master
 * @return {Promise<Boolean>} resolves to true if file loads are successful
 */
export async function initBookPackageCheck(username, languageCode, bookIDList, branch = 'master') {
  clearCaches(); // clear existing cached files so we know we have the latest
  let success = true;
  const repos = ['TA', 'TW'];

  if (bookIDList && Array.isArray(bookIDList)) {
    // make sure we have the original languages needed
    for (const bookID of bookIDList) {
      const whichTestament = books.testament(bookID); // returns 'old' or 'new'
      const origLang = whichTestament === 'old' ? 'UHB' : 'UGNT';
      if (!repos.includes( origLang)) {
        repos.unshift(origLang);
      }
    }
  }

  // load all the repos need
  for (const repoCode of repos) {
    const repoName = getRepoName(languageCode, repoCode);
    console.log(`Preloading zip file for ${repoName}…`);
    const zipFetchSucceeded = await fetchRepositoryZipFile({username, repository: repoName, branch});
    if (!zipFetchSucceeded) {
      console.log(`checkRepo: misfetched zip file for repo with ${zipFetchSucceeded}`);
      success = false;
    }
  }

  return success;
}

/*
    checkRepo
*/
export async function checkRepo(username, repoName, branch, givenLocation, setResultValue, checkingOptions) {
    /*
    checkRepo DOES NOT USE the Gitea React Toolkit to fetch the repo

    It returns an object containing:
        successList: an array of strings to tell the use exactly what has been checked
        noticeList: an array of 9 (i.e., with extra bookOrFileCode parameter at end) notice components
    */
    // console.log(`I'm here in checkRepo
    //   with ${username}, ${repoName}, ${branch}, ${givenLocation}, ${JSON.stringify(checkingOptions)}`);
    const startTime = new Date();

    if (branch === undefined) branch = 'master'; // Ideally we should ask what the default branch is

    let checkRepoResult = {
        successList: [], noticeList: [],
        checkedFileCount: 0, checkedFilenames: [], checkedFilenameExtensions: []
    };

    function addSuccessMessage(successString) {
        // Adds the message to the result that we will later return
        // console.log(`checkRepo success: ${successString}`);
        checkRepoResult.successList.push(successString);
    }
    function addNotice10({ priority, message, filename, bookID, C, V, lineNumber, characterIndex, extract, location, extra }) {
        // Adds the notices to the result that we will later return
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // Note that bookID,C,V might all be empty strings (as some repos don't have BCV)
        // console.log(`checkRepo addNotice10: (priority=${priority}) ${bookID} ${C}:${V} ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cR addNotice10: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cR addNotice10: 'priority' parameter should be a number not a '${typeof priority}'`);
        console.assert(message !== undefined, "cR addNotice10: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cR addNotice10: 'message' parameter should be a string not a '${typeof message}'`);
        // console.assert(bookID !== undefined, "cR addNotice10: 'bookID' parameter should be defined");
        if (bookID) {
            console.assert(typeof bookID === 'string', `cR addNotice10: 'bookID' parameter should be a string not a '${typeof bookID}'`);
            console.assert(bookID.length === 3, `cR addNotice10: 'bookID' parameter should be three characters long not ${bookID.length}`);
            console.assert(books.isOptionalValidBookID(bookID), `cR addNotice10: '${bookID}' is not a valid USFM book identifier`);
        }
        // console.assert(C !== undefined, "cR addNotice10: 'C' parameter should be defined");
        if (C) console.assert(typeof C === 'string', `cR addNotice10: 'C' parameter should be a string not a '${typeof C}'`);
        // console.assert(V !== undefined, "cR addNotice10: 'V' parameter should be defined");
        if (V) console.assert(typeof V === 'string', `cR addNotice10: 'V' parameter should be a string not a '${typeof V}'`);
        // console.assert(characterIndex !== undefined, "cR addNotice10: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `cR addNotice10: 'characterIndex' parameter should be a number not a '${typeof characterIndex}'`);
        // console.assert(extract !== undefined, "cR addNotice10: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `cR addNotice10: 'extract' parameter should be a string not a '${typeof extract}'`);
        console.assert(location !== undefined, "cR addNotice10: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cR addNotice10: 'location' parameter should be a string not a '${typeof location}'`);
        console.assert(extra !== undefined, "cR addNotice10: 'extra' parameter should be defined");
        console.assert(typeof extra === 'string', `cR addNotice10: 'extra' parameter should be a string not a '${typeof extra}'`);
        checkRepoResult.noticeList.push({ priority, message, bookID, C, V, repoName, filename, lineNumber, characterIndex, extract, location, extra });
    }


    async function ourCheckFileContents(bookOrFileCode, cfBookID, filename, file_content, fileLocation, optionalCheckingOptions) {
        // We assume that checking for compulsory fields is done elsewhere
        // console.log(`checkRepo ourCheckFileContents(${filename})…`);

        // Updates the global list of notices
        console.assert(bookOrFileCode !== undefined, "ourCheckFileContents: 'bookOrFileCode' parameter should be defined");
        console.assert(typeof bookOrFileCode === 'string', `ourCheckFileContents: 'bookOrFileCode' parameter should be a string not a '${typeof bookOrFileCode}'`);
        console.assert(cfBookID !== undefined, "ourCheckFileContents: 'cfBookID' parameter should be defined");
        console.assert(typeof cfBookID === 'string', `ourCheckFileContents: 'cfBookID' parameter should be a string not a '${typeof cfBookID}'`);
        console.assert(filename !== undefined, "ourCheckFileContents: 'filename' parameter should be defined");
        console.assert(typeof filename === 'string', `ourCheckFileContents: 'filename' parameter should be a string not a '${typeof filename}'`);
        console.assert(file_content !== undefined, "ourCheckFileContents: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', `ourCheckFileContents: 'file_content' parameter should be a string not a '${typeof file_content}'`);
        console.assert(fileLocation !== undefined, "ourCheckFileContents: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', `ourCheckFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

        const resultObject = await checkFileContents(filename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFileContents() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");
        // for (const successEntry of resultObject.successList)
        //     console.log("  ", successEntry);

        // Process results line by line,  appending the bookOrFileCode as an extra field as we go
        for (const noticeEntry of resultObject.noticeList)
            // We add the bookOrFileCode as an extra value
            addNotice10({ ...noticeEntry, bookID:cfBookID, extra:bookOrFileCode });
    }
    // end of ourCheckFileContents function


    // Main code for checkRepo()
    // Put all this in a try/catch block coz otherwise it's difficult to debug/view errors
    try {
        let ourLocation = givenLocation;
        if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
        // if (ourLocation.indexOf(username) < 0)
        // ourLocation = ` in ${username} ${repoName} ${givenLocation}`

        // Update our "waiting" message
        setResultValue(<p style={{ color: 'magenta' }}>Fetching zipped files from <b>{username}/{repoName}</b> repository…</p>);

        // Let's fetch the zipped repo since it should be much more efficient than individual fetches
        // console.log(`checkRepo: fetch zip file for ${repoName}…`);
        const zipFetchSucceeded = await fetchRepositoryZipFile({ username, repository: repoName, branch });
        if (!zipFetchSucceeded)
            console.log(`checkRepo: misfetched zip file for repo with ${zipFetchSucceeded}`);
        if (!zipFetchSucceeded) return checkRepoResult;
        // Note: We don't stop for failure coz the code below will still work (fetching each file individually)

        // Now we need to fetch the list of files from the repo
        setResultValue(<p style={{ color: 'magenta' }}>Preprocessing file list from <b>{username}/{repoName}</b> repository…</p>);
        // const pathList = await getFilelistFromFetchedTreemaps(username, repoName, branch);
        const pathList = await getFilelistFromZip({ username, repository: repoName, branch });
        // console.log(`Got pathlist (${pathList.length}) = ${pathList}`);

        // So now we want to work through checking all the files in this repo
        const countString = `${pathList.length.toLocaleString()} file${pathList.length === 1 ? '' : 's'}`;
        let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
        for (const thisFilepath of pathList) {
            // console.log(`At top of loop: thisFilepath='${thisFilepath}'`);

            // Update our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for <b>{username}/{repoName}</b> repo: checked {checkedFileCount.toLocaleString()}/{countString}…</p>);

            const thisFilename = thisFilepath.split('/').pop();
            // console.log(`thisFilename=${thisFilename}`);
            const thisFilenameExtension = thisFilename.split('.').pop();
            // console.log(`thisFilenameExtension=${thisFilenameExtension}`);

            // Default to the main filename without the extensions
            let bookOrFileCode = thisFilename.substring(0, thisFilename.length - thisFilenameExtension.length - 1);
            let ourBookID = "";
            if (thisFilenameExtension === 'usfm') {
                // const filenameMain = thisFilename.substring(0, thisFilename.length - 5); // drop .usfm
                // console.log(`Have USFM filenameMain=${bookOrFileCode}`);
                const bookID = bookOrFileCode.substring(bookOrFileCode.length - 3);
                // console.log(`Have USFM bookcode=${bookID}`);
                console.assert(books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier`);
                bookOrFileCode = bookID;
                ourBookID = bookID;
            }
            else if (thisFilenameExtension === 'tsv') {
                // const filenameMain = thisFilename.substring(0, thisFilename.length - 4); // drop .tsv
                // console.log(`Have TSV filenameMain=${bookOrFileCode}`);
                const bookID = bookOrFileCode.substring(bookOrFileCode.length - 3);
                // console.log(`Have TSV bookcode=${bookID}`);
                console.assert(books.isValidBookID(bookID), `checkRepo: '${bookID}' is not a valid USFM book identifier`);
                bookOrFileCode = bookID;
                ourBookID = bookID;
            }

            // console.log("checkRepo: Try to load", username, repoName, thisFilepath, branch);
            const getFile_ = (checkingOptions && checkingOptions.getFile) ? checkingOptions.getFile : getFile;
            let repoFileContent;
            try {
                repoFileContent = await getFile_({ username, repository: repoName, path: thisFilepath, branch });
                // console.log("Fetched file_content for", repoName, thisPath, typeof repoFileContent, repoFileContent.length);
            } catch (cRgfError) {
                console.log("Failed to load", username, repoName, thisFilepath, branch, `${cRgfError}`);
                addNotice10({ priority: 996, message: "Failed to load", bookID: ourBookID, filename: thisFilename, location: `${givenLocation} ${thisFilepath}: ${cRgfError}`, extra: repoName });
                return;
            }
            if (repoFileContent) {
                // console.log(`checkRepo checking ${thisFilename}`);
                await ourCheckFileContents(bookOrFileCode, ourBookID, thisFilename, repoFileContent, ourLocation, checkingOptions);
                checkedFileCount += 1;
                checkedFilenames.push(thisFilename);
                checkedFilenameExtensions.add(thisFilenameExtension);
                totalCheckedSize += repoFileContent.length;
                // console.log(`checkRepo checked ${thisFilename}`);
                if (thisFilenameExtension !== 'md') // There's often far, far too many of these
                    addSuccessMessage(`Checked ${bookOrFileCode.toUpperCase()} file: ${thisFilename}`);
            }
        }

        // Check that we processed a license and a manifest
        if (checkedFilenames.indexOf('LICENSE.md') < 0)
            addNotice10({ priority: 946, message: "Missing LICENSE.md", location: ourLocation, extra: 'LICENSE' });
        if (checkedFilenames.indexOf('manifest.yaml') < 0)
            addNotice10({ priority: 947, message: "Missing manifest.yaml", location: ourLocation, extra: 'MANIFEST' });

        // Add some extra fields to our checkRepoResult object
        //  in case we need this information again later
        checkRepoResult.checkedFileCount = checkedFileCount;
        checkRepoResult.checkedFilenames = checkedFilenames;
        checkRepoResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
        checkRepoResult.checkedFilesizes = totalCheckedSize;
        checkRepoResult.checkedRepoNames = [`${username}/${repoName}`];
        // checkRepoResult.checkedOptions = checkingOptions; // This is done at the caller level

        addSuccessMessage(`Checked ${username} repo: ${repoName}`);
        // console.log(`checkRepo() is returning ${checkRepoResult.successList.length.toLocaleString()} success message(s) and ${checkRepoResult.noticeList.length.toLocaleString()} notice(s)`);
    } catch (cRerror) {
        console.log(`checkRepo main code block got error: ${cRerror.message}`);
        setResultValue(<>
            <p style={{ color: 'Red' }}>checkRepo main code block got error: <b>{cRerror.message}</b></p>
        </>);

    }
    checkRepoResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
    return checkRepoResult;
};
// end of checkRepo()


/*
    checkFileContents
*/
export async function checkFileContents(filename, fileContent, givenLocation, checkingOptions) {
    // Determine the file type from the filename extension
    //  and return the results of checking that kind of file text
    // console.log(`I'm here in checkFileContents
    //   with ${filename}, ${fileContent.length} chars, ${givenLocation}, ${JSON.stringify(checkingOptions)}`);
    const startTime = new Date();

    let ourCFLocation = givenLocation;
    if (ourCFLocation[0] !== ' ') ourCFLocation = ' ' + ourCFLocation;

    let checkFileResult;
    if (filename.toLowerCase().endsWith('.tsv')) {
        const filenameMain = filename.substring(0, filename.length - 4); // drop .tsv
        // console.log(`Have TSV filenameMain=${filenameMain}`);
        const bookID = filenameMain.substring(filenameMain.length - 3);
        // console.log(`Have TSV bookcode=${bookID}`);
        console.assert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
        checkFileResult = await checkTN_TSVText(bookID, filename, fileContent, ourCFLocation, checkingOptions);
    }
    else if (filename.toLowerCase().endsWith('.usfm')) {
        const filenameMain = filename.substring(0, filename.length - 5); // drop .usfm
        // console.log(`Have USFM filenameMain=${filenameMain}`);
        const bookID = filenameMain.substring(filenameMain.length - 3);
        // console.log(`Have USFM bookcode=${bookID}`);
        console.assert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
        checkFileResult = checkUSFMText(bookID, filename, fileContent, ourCFLocation, checkingOptions);
    } else if (filename.toLowerCase().endsWith('.sfm')) {
        const filenameMain = filename.substring(0, filename.length - 4); // drop .sfm
        console.log(`Have SFM filenameMain=${filenameMain}`);
        const bookID = filenameMain.substring(2, 5);
        console.log(`Have SFM bookcode=${bookID}`);
        console.assert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
        checkFileResult = checkUSFMText(bookID, filename, fileContent, ourCFLocation, checkingOptions);
    } else if (filename.toLowerCase().endsWith('.md'))
        checkFileResult = checkMarkdownText(filename, fileContent, ourCFLocation, checkingOptions);
    else if (filename.toLowerCase().endsWith('.txt'))
        checkFileResult = checkPlainText(filename, fileContent, ourCFLocation, checkingOptions);
    else if (filename.toLowerCase() === 'manifest.yaml')
        checkFileResult = checkManifestText(filename, fileContent, ourCFLocation, checkingOptions);
    else if (filename.toLowerCase().endsWith('.yaml'))
        checkFileResult = checkYAMLText(filename, fileContent, ourCFLocation, checkingOptions);
    else {
        checkFileResult = checkPlainText(filename, fileContent, ourCFLocation, checkingOptions);
        checkFileResult.noticeList.unshift([995, "File extension is not recognized, so treated as plain text.", -1, '', filename]);
    }
    // console.log(`checkFileContents got initial results with ${checkFileResult.successList.length} success message(s) and ${checkFileResult.noticeList.length} notice(s)`);

    // Add some extra fields to our checkFileResult object
    //  in case we need this information again later
    checkFileResult.checkedFileCount = 1;
    checkFileResult.checkedFilename = filename;
    checkFileResult.checkedFilesize = fileContent.length;
    checkFileResult.checkedOptions = checkingOptions;

    checkFileResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
    // console.log(`checkFileResult: ${JSON.stringify(checkFileResult)}`);
    return checkFileResult;
};
// end of checkFileContents()


/*
    checkTQbook
*/
export async function checkTQbook(username, repoName, branch, bookID, checkingOptions) {
    // console.log(`checkTQbook(${username}, ${repoName}, ${branch}, ${bookID}, ${JSON.stringify(checkingOptions)})…`)
    const repoCode = 'TQ';
    const generalLocation = `in ${username} ${repoName} (${branch})`;

    const ctqResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkBookPackage success: ${successString}`);
        ctqResult.successList.push(successString);
    }

    function addNotice10({ priority, message, bookID, C, V, filename, lineNumber, characterIndex, extract, location, extra }) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // console.log(`checkTQbook addNotice10: (priority=${priority}) ${bookID} ${C}:${V} ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cTQ addNotice10: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cTQ addNotice10: 'priority' parameter should be a number not a '${typeof priority}'`);
        console.assert(message !== undefined, "cTQ addNotice10: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cTQ addNotice10: 'message' parameter should be a string not a '${typeof message}'`);
        console.assert(bookID !== undefined, "cTQ addNotice10: 'bookID' parameter should be defined");
        console.assert(typeof bookID === 'string', `cTQ addNotice10: 'bookID' parameter should be a string not a '${typeof bookID}'`);
        console.assert(bookID.length === 3, `cTQ addNotice10: 'bookID' parameter should be three characters long not ${bookID.length}`);
        console.assert(books.isValidBookID(bookID), `cTQ addNotice10: '${bookID}' is not a valid USFM book identifier`);
        // console.assert(C !== undefined, "cTQ addNotice10: 'C' parameter should be defined");
        if (C) console.assert(typeof C === 'string', `cTQ addNotice10: 'C' parameter should be a string not a '${typeof C}'`);
        // console.assert(V !== undefined, "cTQ addNotice10: 'V' parameter should be defined");
        if (V) console.assert(typeof V === 'string', `cTQ addNotice10: 'V' parameter should be a string not a '${typeof V}'`);
        // console.assert(characterIndex !== undefined, "cTQ addNotice10: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `cTQ addNotice10: 'characterIndex' parameter should be a number not a '${typeof characterIndex}'`);
        // console.assert(extract !== undefined, "cTQ addNotice10: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `cTQ addNotice10: 'extract' parameter should be a string not a '${typeof extract}'`);
        console.assert(location !== undefined, "cTQ addNotice10: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cTQ addNotice10: 'location' parameter should be a string not a '${typeof location}'`);
        console.assert(extra !== undefined, "cTQ addNotice10: 'extra' parameter should be defined");
        console.assert(typeof extra === 'string', `cTQ addNotice10: 'extra' parameter should be a string not a '${typeof extra}'`);
        ctqResult.noticeList.push({ priority, message, bookID, C, V, filename, lineNumber, characterIndex, extract, location, extra });
    }


    async function ourCheckFileContents(repoCode, bookID, C, V, cfFilename, file_content, fileLocation, optionalCheckingOptions) {
        // console.log(`checkBookPackage ourCheckFileContents(${cfFilename})`);

        // Updates the global list of notices
        console.assert(repoCode !== undefined, "cTQ ourCheckFileContents: 'repoCode' parameter should be defined");
        console.assert(typeof repoCode === 'string', `cTQ ourCheckFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
        console.assert(cfFilename !== undefined, "cTQ ourCheckFileContents: 'cfFilename' parameter should be defined");
        console.assert(typeof cfFilename === 'string', `cTQ ourCheckFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
        console.assert(file_content !== undefined, "cTQ ourCheckFileContents: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', `cTQ ourCheckFileContents: 'file_content' parameter should be a string not a '${typeof file_content}'`);
        console.assert(fileLocation !== undefined, "cTQ ourCheckFileContents: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', `cTQ ourCheckFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

        const cfResultObject = await checkFileContents(cfFilename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
        // for (const successEntry of cfResultObject.successList) console.log("  ourCheckFileContents:", successEntry);

        // Process results line by line,  appending the repoCode as an extra field as we go
        for (const noticeEntry of cfResultObject.noticeList) {
            // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=extract, 8=location
            // console.assert(Object.keys(noticeEntry).length === 5, `cTQ ourCheckFileContents notice length=${Object.keys(noticeEntry).length}`);
            // We add the repoCode as an extra value
            addNotice10({ ...noticeEntry, bookID, C,V, extra:repoCode });
        }
    }
    // end of ourCheckFileContents function


    // Main code for checkTQbook
    // We need to find an check all the markdown folders/files for this book
    let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(['md']), totalCheckedSize = 0;
    const pathList = await getFilelistFromZip({ username, repository: repoName, branch, optionalPrefix: `${bookID.toLowerCase()}/` });
    // console.log(`  Got ${pathList.length} pathList entries`)
    for (const thisPath of pathList) {
        // console.log("checkTQbook: Try to load", username, repoName, thisPath, branch);

        console.assert(thisPath.endsWith('.md'), `Expected ${thisPath} to end with .md`);
        const pathParts = thisPath.slice(0, -3).split('/');
        const C = pathParts[pathParts.length - 2].replace(/^0+(?=\d)/, '');
        const V = pathParts[pathParts.length - 1].replace(/^0+(?=\d)/, '');

        const getFile_ = (checkingOptions && checkingOptions.getFile) ? checkingOptions.getFile : getFile;
        let tqFileContent;
        try {
            tqFileContent = await getFile_({ username, repository: repoName, path: thisPath, branch });
            // console.log("Fetched file_content for", repoName, thisPath, typeof tqFileContent, tqFileContent.length);
            checkedFilenames.push(thisPath);
            totalCheckedSize += tqFileContent.length;
        } catch (tQerror) {
            console.log("checkTQbook failed to load", username, repoName, thisPath, branch, tQerror + '');
            addNotice10({ priority: 996, bookID, C, V, message: "Failed to load", location: `${generalLocation} ${thisPath}: ${tQerror}`, extra: repoCode });
            continue;
        }

        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        await ourCheckFileContents(repoCode, bookID, C, V, thisPath, tqFileContent, generalLocation, checkingOptions); // Adds the notices to checkBookPackageResult
        checkedFileCount += 1;
        // addSuccessMessage(`Checked ${repoCode.toUpperCase()} file: ${thisPath}`);
    }
    addSuccessMessage(`Checked ${checkedFileCount.toLocaleString()} ${repoCode.toUpperCase()} file${checkedFileCount === 1 ? '' : 's'}`);

    ctqResult.checkedFileCount = checkedFileCount;
    ctqResult.checkedFilenames = checkedFilenames;
    ctqResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
    ctqResult.checkedFilesizes = totalCheckedSize;
    // console.log(`  checkTQbook returning ${JSON.stringify(ctqResult)}`);
    return ctqResult;
}
// end of checkTQbook function


/*
    checkBookPackage
*/
export async function checkBookPackage(username, languageCode, bookID, setResultValue, checkingOptions) {
    /*
    Note: You may want to run clearCaches() before running this function???

    Note that bookID here can also be the 'OBS' pseudo bookID.
    */
    // console.log(`checkBookPackage(${username}, ${languageCode}, ${bookID}, …)…`)
    const startTime = new Date();

    let checkBookPackageResult = { successList: [], noticeList: [] };

    const newCheckingOptions = checkingOptions ? { ...checkingOptions } : {}; // clone before modify
    const getFile_ = newCheckingOptions.getFile ? newCheckingOptions.getFile : getFileCached; // default to using caching of files
    newCheckingOptions.getFile = getFile_; // use same getFile_ when we call core functions

    function addSuccessMessage(successString) {
        // console.log(`checkBookPackage success: ${successString}`);
        checkBookPackageResult.successList.push(successString);
    }

    function addNotice10({ priority, message, bookID, C, V, rowID, repoName, filename, lineNumber, fieldName, characterIndex, extract, location, extra }) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // console.log(`checkBookPackage addNotice10: (priority=${priority}) ${bookID} ${C}:${V} ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cBP addNotice10: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cBP addNotice10: 'priority' parameter should be a number not a '${typeof priority}'`);
        console.assert(message !== undefined, "cBP addNotice10: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cBP addNotice10: 'message' parameter should be a string not a '${typeof message}'`);
        // console.assert(bookID !== undefined, "cBP addNotice10: 'bookID' parameter should be defined");
        if (bookID) {
            console.assert(typeof bookID === 'string', `cBP addNotice10: 'bookID' parameter should be a string not a '${typeof bookID}'`);
            console.assert(bookID.length === 3, `cBP addNotice10: 'bookID' parameter should be three characters long not ${bookID.length}`);
            console.assert(books.isValidBookID(bookID), `cBP addNotice10: '${bookID}' is not a valid USFM book identifier`);
        }
        // console.assert(C !== undefined, "cBP addNotice10: 'C' parameter should be defined");
        if (C) console.assert(typeof C === 'string', `cBP addNotice10: 'C' parameter should be a string not a '${typeof C}'`);
        // console.assert(V !== undefined, "cBP addNotice10: 'V' parameter should be defined");
        if (V) console.assert(typeof V === 'string', `cBP addNotice10: 'V' parameter should be a string not a '${typeof V}'`);
        // console.assert(characterIndex !== undefined, "cBP addNotice10: 'characterIndex' parameter should be defined");
        if (characterIndex) console.assert(typeof characterIndex === 'number', `cBP addNotice10: 'characterIndex' parameter should be a number not a '${typeof characterIndex}'`);
        // console.assert(extract !== undefined, "cBP addNotice10: 'extract' parameter should be defined");
        if (extract) console.assert(typeof extract === 'string', `cBP addNotice10: 'extract' parameter should be a string not a '${typeof extract}'`);
        console.assert(location !== undefined, "cBP addNotice10: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cBP addNotice10: 'location' parameter should be a string not a '${typeof location}'`);
        console.assert(extra !== undefined, "cBP addNotice10: 'extra' parameter should be defined");
        console.assert(typeof extra === 'string', `cBP addNotice10: 'extra' parameter should be a string not a '${typeof extra}'`);
        checkBookPackageResult.noticeList.push({ priority, message, bookID, C, V, rowID, repoName, filename, lineNumber, fieldName, characterIndex, extract, location, extra });
    }


    async function ourCheckFileContents(repoCode, cfFilename, file_content, fileLocation, optionalCheckingOptions) {
        // console.log(`checkBookPackage ourCheckFileContents(${cfFilename})`);

        // Updates the global list of notices
        console.assert(repoCode !== undefined, "cBP ourCheckFileContents: 'repoCode' parameter should be defined");
        console.assert(typeof repoCode === 'string', `cBP ourCheckFileContents: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
        console.assert(cfFilename !== undefined, "cBP ourCheckFileContents: 'cfFilename' parameter should be defined");
        console.assert(typeof cfFilename === 'string', `cBP ourCheckFileContents: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
        console.assert(file_content !== undefined, "cBP ourCheckFileContents: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', `cBP ourCheckFileContents: 'file_content' parameter should be a string not a '${typeof file_content}'`);
        console.assert(fileLocation !== undefined, "cBP ourCheckFileContents: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', `cBP ourCheckFileContents: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

        const cfResultObject = await checkFileContents(cfFilename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFileContents() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
        // for (const successEntry of cfResultObject.successList) console.log("  ourCheckFileContents:", successEntry);

        // Process results line by line,  appending the repoCode as an extra field as we go
        for (const noticeEntry of cfResultObject.noticeList)
            // noticeEntry is an object
            // We add the repoCode as an extra value
            addNotice10({ ...noticeEntry, extra:repoCode });
    }
    // end of ourCheckFileContents function

    // Main code for checkBookPackage()
    const generalLocation = ` in ${languageCode} ${bookID} book package from ${username}`;

    // No point in passing the branch through as a parameter
    //  coz if it's not 'master', it's unlikely to be common for all the repos
    const branch = 'master'

    if (bookID === 'OBS') {
        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        // console.log("Calling OBS checkRepo()…");
        checkBookPackageResult = await checkRepo(username, `${languageCode}_obs`, branch, generalLocation, setResultValue, newCheckingOptions); // Adds the notices to checkBookPackageResult
        // console.log(`checkRepo() returned ${checkBookPackageResult.successList.length} success message(s) and ${checkBookPackageResult.noticeList.length} notice(s)`);
        // console.log("crResultObject keys", JSON.stringify(Object.keys(checkBookPackageResult)));

        // Concat is faster if we don't need to process each notice individually
        // checkBookPackageResult.successList = checkBookPackageResult.successList.concat(crResultObject.successList);
        // checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(crResultObject.noticeList);
        // checkedFileCount += crResultObject.fileCount;
        addSuccessMessage(`Checked ${languageCode} OBS repo from ${username}`);
    } else { // not OBS
        // We also need to know the number for USFM books
        let bookNumberAndName, whichTestament;
        try {
            bookNumberAndName = books.usfmNumberName(bookID);
            whichTestament = books.testament(bookID); // returns 'old' or 'new'
        } catch (bNNerror) {
            if (books.isValidBookID(bookID)) // must be in FRT, BAK, etc.
                whichTestament = 'other'
            else {
                addNotice10({
                    priority: 902, message: "Bad function call: should be given a valid book abbreviation",
                    bookID,
                    extract: bookID, location: ` (not '${bookID}')${generalLocation}`
                });
                return checkBookPackageResult;
            }
        }
        // console.log(`bookNumberAndName='${bookNumberAndName}' (${whichTestament} testament)`);

        // So now we want to work through checking this one specified Bible book in various repos:
        //  UHB/UGNT, ULT, UST, TN, TQ
        const getFile_ = (checkingOptions && checkingOptions.getFile) ? checkingOptions.getFile : getFile;
        let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0, checkedRepoNames = [];
        const origLang = whichTestament === 'old' ? 'UHB' : 'UGNT';

         for (const repoCode of [origLang, 'ULT', 'UST', 'TN', 'TQ']) {
            console.log(`Check ${bookID} in ${repoCode} (${languageCode} ${bookID} from ${username})`);
            const repoLocation = ` in ${repoCode.toUpperCase()}${generalLocation}`;
            const repoName = getRepoName(languageCode, repoCode);

            // Update our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Checking {username} {languageCode} <b>{bookID}</b> book package in <b>{repoCode}</b> (checked <b>{checkedRepoNames.length.toLocaleString()}</b>/5 repos)…</p>);

            let filename;
            if (repoCode === 'UHB' || repoCode === 'UGNT' || repoCode === 'ULT' || repoCode === 'UST') {
                filename = `${bookNumberAndName}.usfm`;
                checkedFilenameExtensions.add('usfm');
            }
            else if (repoCode === 'TN') {
                filename = `${languageCode}_tn_${bookNumberAndName}.tsv`;
                checkedFilenameExtensions.add('tsv');
            }

            if (repoCode === 'TQ') {
                // This resource might eventually be converted to TSV tables
                const tqResultObject = await checkTQbook(username, repoName, branch, bookID, newCheckingOptions);
                checkBookPackageResult.successList = checkBookPackageResult.successList.concat(tqResultObject.successList);
                checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(tqResultObject.noticeList);
                checkedFilenames = checkedFilenames.concat(tqResultObject.checkedFilenames);
                checkedFilenameExtensions = new Set([...checkedFilenameExtensions, ...tqResultObject.checkedFilenameExtensions]);
                checkedFileCount += tqResultObject.checkedFileCount;
                totalCheckedSize += tqResultObject.totalCheckedSize;
                checkedRepoNames.push(repoCode);
            } else { // For repos other than TQ, we only have one file to check
                // console.log("Try to load", username, repoName, filename, branch);
                let repoFileContent;
                try {
                    repoFileContent = await getFile_({ username, repository: repoName, path: filename, branch });
                    // console.log("Fetched file_content for", repoName, filename, typeof repoFileContent, repoFileContent.length);
                    checkedFilenames.push(filename);
                    totalCheckedSize += repoFileContent.length;
                    checkedRepoNames.push(repoCode);
                } catch (cBPgfError) {
                    console.log("ERROR: Failed to load", username, repoName, filename, branch, cBPgfError + '');
                    addNotice10({ priority: 996, message: "Failed to load", bookID, repoName, filename, location: `${repoLocation} ${filename}: ${cBPgfError}`, extra: repoCode });
                    continue;
                }

                // We use the generalLocation here (does not include repo name)
                //  so that we can adjust the returned strings ourselves
                await ourCheckFileContents(repoCode, filename, repoFileContent, generalLocation, newCheckingOptions); // Adds the notices to checkBookPackageResult
                checkedFileCount += 1;
                addSuccessMessage(`Checked ${repoCode.toUpperCase()} file: ${filename}`);
            }

            // Update our "waiting" message
            // setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for {username} {languageCode} <b>{bookID}</b> book package: checked <b>{checkedRepoNames.length.toLocaleString()}</b>/5 repos…</p>);
        }

        // Add some extra fields to our checkFileResult object
        //  in case we need this information again later
        checkBookPackageResult.checkedFileCount = checkedFileCount;
        checkBookPackageResult.checkedFilenames = checkedFilenames;
        checkBookPackageResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
        checkBookPackageResult.checkedFilesizes = totalCheckedSize;
        checkBookPackageResult.checkedRepoNames = checkedRepoNames;
        // checkBookPackageResult.checkedOptions = checkingOptions; // This is done at the caller level
    }

    checkBookPackageResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
    // console.log("checkBookPackageResult:", JSON.stringify(checkBookPackageResult));
    return checkBookPackageResult;
};
// end of checkBookPackage()
