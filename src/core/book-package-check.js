import React from 'react';
import * as books from './books';
import checkUSFMText from './usfm-text-check';
import checkMarkdownText from './markdown-text-check';
import checkPlainText from './plain-text-check';
import checkYAMLText from './yaml-text-check';
import checkManifestText from './manifest-text-check';
import checkTN_TSVText from './tn-table-text-check';

import { fetchRepositoryZipFile, getFilelistFromZip, getFile } from './getApi';

/*
    checkRepo 
*/
const CHECK_REPO_VERSION_STRING = '0.4.1';
async function checkRepo(username, repoName, branch, givenLocation, setResultValue, checkingOptions) {
    /*
    checkRepo DOES NOT USE the Gitea React Toolkit to fetch the repo

    It returns an object containing:
        successList: an array of strings to tell the use exactly what has been checked
        noticeList: an array of 9 (i.e., with extra bookOrFileCode parameter at end) notice components
    */
    // console.log(`I'm here in checkRepo v${CHECK_REPO_VERSION_STRING}
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
    function addNotice10({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra}) {
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
        checkRepoResult.noticeList.push({ priority,message, bookID, C, V, lineNumber, characterIndex, extract, location, extra });
    }


    async function doOurCheckFile(bookOrFileCode, cfBookID, filename, file_content, fileLocation, optionalCheckingOptions) {
        // We assume that checking for compulsory fields is done elsewhere
        // console.log(`checkRepo doOurCheckFile(${filename})…`);

        // Updates the global list of notices
        console.assert(bookOrFileCode !== undefined, "doOurCheckFile: 'bookOrFileCode' parameter should be defined");
        console.assert(typeof bookOrFileCode === 'string', `doOurCheckFile: 'bookOrFileCode' parameter should be a string not a '${typeof bookOrFileCode}'`);
        console.assert(cfBookID !== undefined, "doOurCheckFile: 'cfBookID' parameter should be defined");
        console.assert(typeof cfBookID === 'string', `doOurCheckFile: 'cfBookID' parameter should be a string not a '${typeof cfBookID}'`);
        console.assert(filename !== undefined, "doOurCheckFile: 'filename' parameter should be defined");
        console.assert(typeof filename === 'string', `doOurCheckFile: 'filename' parameter should be a string not a '${typeof filename}'`);
        console.assert(file_content !== undefined, "doOurCheckFile: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', `doOurCheckFile: 'file_content' parameter should be a string not a '${typeof file_content}'`);
        console.assert(fileLocation !== undefined, "doOurCheckFile: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', `doOurCheckFile: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

        const resultObject = await checkFile(filename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFile() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");
        // for (const successEntry of resultObject.successList)
        //     console.log("  ", successEntry);

        // Process results line by line,  appending the bookOrFileCode as an extra field as we go
        for (const noticeEntry of resultObject.noticeList)
            // We add the bookOrFileCode as an extra value
            addNotice10({priority:noticeEntry.priority, message:noticeEntry.message,
                bookID:noticeEntry.bookID, C:noticeEntry.C, V:noticeEntry.V, lineNumber:noticeEntry.lineNumber,
                characterIndex:noticeEntry.characterIndex, extract:noticeEntry.extract,
                location:noticeEntry.location, extra:bookOrFileCode});
    }
    // end of doOurCheckFile function


    // Main code for checkRepo()
    // Put all this in a try/catch block coz otherwise it's difficult to debug/view errors
    try {
        let ourLocation = givenLocation;
        if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
        // if (ourLocation.indexOf(username) < 0)
        ourLocation = ` in ${username} ${repoName} ${givenLocation}`

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
            let repoFileContent;
            try {
                repoFileContent = await getFile({ username, repository: repoName, path: thisFilepath, branch });
                // console.log("Fetched file_content for", repoName, thisPath, typeof repoFileContent, repoFileContent.length);
            } catch (cRgfError) {
                console.log("Failed to load", username, repoName, thisFilepath, branch, `${cRgfError}`);
                addNotice10({priority:996, bookID:ourBookID, message:"Failed to load", location:`${generalLocation} ${thisFilepath}: ${cRgfError}`, repoCode});
                return;
            }
            if (repoFileContent) {
                // console.log(`checkRepo checking ${thisFilename}`);
                await doOurCheckFile(bookOrFileCode, ourBookID, thisFilename, repoFileContent, ourLocation, checkingOptions);
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
            addNotice10({priority:946, message:"Missing LICENSE.md", location:ourLocation, extra:'LICENSE'});
        if (checkedFilenames.indexOf('manifest.yaml') < 0)
            addNotice10({priority:947, message:"Missing manifest.yaml", location:ourLocation, extra:'MANIFEST'});

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
    checkRepoResult.elapsedTime = (new Date() - startTime) / 1000; // seconds
    return checkRepoResult;
};
// end of checkRepo()


/*
    checkFile
*/
const CHECK_FILE_VERSION_STRING = '0.1.5';
async function checkFile(filename, fileContent, givenLocation, checkingOptions) {
    // Determine the file type from the filename extension
    //  and return the results of checking that kind of file
    //     console.log(`I'm here in checkFile v${CHECK_FILE_VERSION_STRING}
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
        console.assert(books.isValidBookID(bookID), `checkFile: '${bookID}' is not a valid USFM book identifier`);
        checkFileResult = await checkTN_TSVText(bookID, fileContent, ourCFLocation, checkingOptions);
    }
    else if (filename.toLowerCase().endsWith('.usfm')) {
        const filenameMain = filename.substring(0, filename.length - 5); // drop .usfm
        // console.log(`Have USFM filenameMain=${filenameMain}`);
        const bookID = filenameMain.substring(filenameMain.length - 3);
        // console.log(`Have USFM bookcode=${bookID}`);
        console.assert(books.isValidBookID(bookID), `checkFile: '${bookID}' is not a valid USFM book identifier`);
        checkFileResult = checkUSFMText(bookID, filename, fileContent, ourCFLocation, checkingOptions);
    } else if (filename.toLowerCase().endsWith('.sfm')) {
        const filenameMain = filename.substring(0, filename.length - 4); // drop .sfm
        console.log(`Have SFM filenameMain=${filenameMain}`);
        const bookID = filenameMain.substring(2, 5);
        console.log(`Have SFM bookcode=${bookID}`);
        console.assert(books.isValidBookID(bookID), `checkFile: '${bookID}' is not a valid USFM book identifier`);
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
    // console.log(`checkFile got initial results with ${checkFileResult.successList.length} success message(s) and ${checkFileResult.noticeList.length} notice(s)`);

    // Add some extra fields to our checkFileResult object
    //  in case we need this information again later
    checkFileResult.checkedFileCount = 1;
    checkFileResult.checkedFilename = filename;
    checkFileResult.checkedFilesize = fileContent.length;
    checkFileResult.checkedOptions = checkingOptions;

    checkFileResult.elapsedTime = (new Date() - startTime) / 1000; // seconds
    return checkFileResult;
};
// end of checkFile()

/*
    checkTQbook
*/
const CHECKER_VERSION_STRING = '0.3.1';
async function checkTQbook(username, repoName, branch, bookID, checkingOptions) {
    const repoCode = 'TQ';
    const generalLocation = `in ${username} ${repoName} (${branch})`;

    const ctqResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkBookPackage success: ${successString}`);
        ctqResult.successList.push(successString);
    }

    function addNotice10({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra}) {
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
        ctqResult.noticeList.push({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra});
    }


    async function doOurCheckFile(repoCode, bookID, C, V, cfFilename, file_content, fileLocation, optionalCheckingOptions) {
        // console.log(`checkBookPackage doOurCheckFile(${cfFilename})`);

        // Updates the global list of notices
        console.assert(repoCode !== undefined, "cTQ doOurCheckFile: 'repoCode' parameter should be defined");
        console.assert(typeof repoCode === 'string', `cTQ doOurCheckFile: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
        console.assert(cfFilename !== undefined, "cTQ doOurCheckFile: 'cfFilename' parameter should be defined");
        console.assert(typeof cfFilename === 'string', `cTQ doOurCheckFile: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
        console.assert(file_content !== undefined, "cTQ doOurCheckFile: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', `cTQ doOurCheckFile: 'file_content' parameter should be a string not a '${typeof file_content}'`);
        console.assert(fileLocation !== undefined, "cTQ doOurCheckFile: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', `cTQ doOurCheckFile: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

        const cfResultObject = await checkFile(cfFilename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFile() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
        // for (const successEntry of cfResultObject.successList) console.log("  doOurCheckFile:", successEntry);

        // Process results line by line,  appending the repoCode as an extra field as we go
        for (const noticeEntry of cfResultObject.noticeList) {
            // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=extract, 8=location
            // console.assert(Object.keys(noticeEntry).length === 5, `cTQ doOurCheckFile notice length=${Object.keys(noticeEntry).length}`);
            // We add the repoCode as an extra value
            addNotice10({priority:noticeEntry.priority, message:noticeEntry.message,
                bookID, C, V, lineNumber:noticeEntry.lineNumber,
                characterIndex:noticeEntry.characterIndex, extract:noticeEntry.extract,
                location:noticeEntry.location, extra:repoCode});
        }
    }
    // end of doOurCheckFile function


    // Main code for checkTQbook
    // We need to find an check all the markdown folders/files for this book
    let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(['md']), totalCheckedSize = 0;
    const pathList = await getFilelistFromZip({ username, repository: repoName, branch, optionalPrefix: `${bookID.toLowerCase()}/` });
    // console.log(`  Got ${pathList.length} pathList entries`)
    for (const thisPath of pathList) {
        // console.log("checkTQbook: Try to load", username, repoName, thisPath, branch);

        console.assert(thisPath.endsWith('.md'), `Expected ${thisPath} to end with .md`);
        const pathParts = thisPath.slice(0,-3).split('/');
        const C = pathParts[pathParts.length-2].replace(/^0+(?=\d)/, '');
        const V = pathParts[pathParts.length-1].replace(/^0+(?=\d)/, '');

        let tqFileContent;
        try {
            tqFileContent = await getFile({ username, repository: repoName, path: thisPath, branch });
            // console.log("Fetched file_content for", repoName, thisPath, typeof tqFileContent, tqFileContent.length);
            checkedFilenames.push(thisPath);
            totalCheckedSize += tqFileContent.length;
        } catch (tQerror) {
            console.log("checkTQbook failed to load", username, repoName, thisPath, branch, tQerror + '');
            addNotice10({priority:996, bookID, C, V, message:"Failed to load", location:`${generalLocation} ${thisPath}: ${tQerror}`, extra:repoCode});
            continue;
        }

        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        await doOurCheckFile(repoCode, bookID, C, V, thisPath, tqFileContent, generalLocation, checkingOptions); // Adds the notices to checkBookPackageResult
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
export async function checkBookPackage(username, language_code, bookID, setResultValue, checkingOptions) {
    /*
    Note that bookID here can also be the 'OBS' pseudo bookID.
    */
    //     console.log(`I'm here in checkBookPackage v${CHECKER_VERSION_STRING}
    //   with ${username}, ${language_code}, ${bookID}, ${JSON.stringify(checkingOptions)}`);
    const startTime = new Date();

    let checkBookPackageResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkBookPackage success: ${successString}`);
        checkBookPackageResult.successList.push(successString);
    }

    function addNotice10({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra}) {
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
        checkBookPackageResult.noticeList.push({priority, message, bookID, C, V, lineNumber, characterIndex, extract, location, extra});
    }


    async function doOurCheckFile(repoCode, cfFilename, file_content, fileLocation, optionalCheckingOptions) {
        // console.log(`checkBookPackage doOurCheckFile(${cfFilename})`);

        // Updates the global list of notices
        console.assert(repoCode !== undefined, "cBP doOurCheckFile: 'repoCode' parameter should be defined");
        console.assert(typeof repoCode === 'string', `cBP doOurCheckFile: 'repoCode' parameter should be a string not a '${typeof repoCode}'`);
        console.assert(cfFilename !== undefined, "cBP doOurCheckFile: 'cfFilename' parameter should be defined");
        console.assert(typeof cfFilename === 'string', `cBP doOurCheckFile: 'cfFilename' parameter should be a string not a '${typeof cfFilename}'`);
        console.assert(file_content !== undefined, "cBP doOurCheckFile: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', `cBP doOurCheckFile: 'file_content' parameter should be a string not a '${typeof file_content}'`);
        console.assert(fileLocation !== undefined, "cBP doOurCheckFile: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', `cBP doOurCheckFile: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

        const cfResultObject = await checkFile(cfFilename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFile() returned", cfResultObject.successList.length, "success message(s) and", cfResultObject.noticeList.length, "notice(s)");
        // for (const successEntry of cfResultObject.successList) console.log("  doOurCheckFile:", successEntry);

        // Process results line by line,  appending the repoCode as an extra field as we go
        for (const noticeEntry of cfResultObject.noticeList)
            // noticeEntry is an object
            // We add the repoCode as an extra value
            addNotice10({priority:noticeEntry.priority, message:noticeEntry.message,
                bookID:noticeEntry.bookID, C:noticeEntry.C, V:noticeEntry.V, lineNumber:noticeEntry.lineNumber,
                characterIndex:noticeEntry.characterIndex, extract:noticeEntry.extract,
                location:noticeEntry.location, extra:repoCode});
    }
    // end of doOurCheckFile function

    // Main code for checkBookPackage()
    const generalLocation = ` ${language_code} ${bookID} book package from ${username}`;

    // No point in passing the branch through as a parameter
    //  coz if it's not 'master', it's unlikely to be common for all the repos
    const branch = 'master'

    if (bookID === 'OBS') {
        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        // console.log("Calling OBS checkRepo()…");
        checkBookPackageResult = await checkRepo(username, `${language_code}_obs`, branch, generalLocation, setResultValue, checkingOptions); // Adds the notices to checkBookPackageResult
        // console.log(`checkRepo() returned ${checkBookPackageResult.successList.length} success message(s) and ${checkBookPackageResult.noticeList.length} notice(s)`);
        // console.log("crResultObject keys", JSON.stringify(Object.keys(checkBookPackageResult)));

        // Concat is faster if we don't need to process each notice individually
        // checkBookPackageResult.successList = checkBookPackageResult.successList.concat(crResultObject.successList);
        // checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(crResultObject.noticeList);
        // checkedFileCount += crResultObject.fileCount;
        addSuccessMessage(`Checked ${language_code} OBS repo from ${username}`);
    } else {
        // We also need to know the number for USFM books
        let bookNumberAndName, whichTestament;
        try {
            bookNumberAndName = books.usfmNumberName(bookID);
            whichTestament = books.testament(bookID); // returns 'old' or 'new'
        } catch (bNNerror) {
            if (books.isValidBookID(bookID)) // must be in FRT, BAK, etc.
                whichTestament = 'other'
            else {
                addNotice10({priority:900, message:"Bad function call: should be given a valid book abbreviation", extract:bookID, location:` (not '${bookID}')${location}`});
                return checkBookPackageResult;
            }
        }
        // console.log(`bookNumberAndName='${bookNumberAndName}' (${whichTestament} testament)`);

        // So now we want to work through checking this one specified Bible book in various repos:
        //  UHB/UGNT, ULT, UST, TN, TQ
        let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0, checkedRepoNames = [];
        for (const repoCode of [(whichTestament === 'old' ? 'UHB' : 'UGNT'), 'ULT', 'UST', 'TN', 'TQ']) {
            // console.log(`Let's try ${repoCode} (${language_code} ${bookID} from ${username})`);
            const repoLocation = ` in ${repoCode.toUpperCase()}${generalLocation}`;

            let repo_language_code = language_code;
            if (repoCode === 'UHB') repo_language_code = 'hbo';
            else if (repoCode === 'UGNT') repo_language_code = 'el-x-koine';
            const repoName = `${repo_language_code}_${repoCode.toLowerCase()}`;

            const fullRepoName = username + '/' + repoName;
            // console.log("Let's try1", bookID, "from", fullRepoName);

            let filename;
            if (repoCode === 'UHB' || repoCode === 'UGNT' || repoCode === 'ULT' || repoCode === 'UST') {
                filename = `${bookNumberAndName}.usfm`;
                checkedFilenameExtensions.add('usfm');
            }
            else if (repoCode === 'TN') {
                filename = `${language_code}_tn_${bookNumberAndName}.tsv`;
                checkedFilenameExtensions.add('tsv');
            }

            if (repoCode === 'TQ') {
                // This resource might eventually be converted to TSV tables
                const tqResultObject = await checkTQbook(username, repoName, branch, bookID, checkingOptions);
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
                    repoFileContent = await getFile({ username, repository: repoName, path: filename, branch });
                    // console.log("Fetched file_content for", repoName, filename, typeof repoFileContent, repoFileContent.length);
                    checkedFilenames.push(filename);
                    totalCheckedSize += repoFileContent.length;
                    checkedRepoNames.push(repoCode);
                } catch (cBPgfError) {
                    console.log("ERROR: Failed to load", username, repoName, filename, branch, cBPgfError + '');
                    addNotice10({priority:996, message:"Failed to load", bookID, location:`${generalLocation} ${filename}: ${cBPgfError}`, extra:repoCode});
                    continue;
                }

                // We use the generalLocation here (does not include repo name)
                //  so that we can adjust the returned strings ourselves
                await doOurCheckFile(repoCode, filename, repoFileContent, generalLocation, checkingOptions); // Adds the notices to checkBookPackageResult
                checkedFileCount += 1;
                addSuccessMessage(`Checked ${repoCode.toUpperCase()} file: ${filename}`);
            }

            // Update our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for {username} {language_code} <b>{bookID}</b> book package: checked <b>{checkedRepoNames.length.toLocaleString()}</b>/5 repos…</p>);
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

    checkBookPackageResult.elapsedTime = (new Date() - startTime) / 1000; // seconds
    console.log("checkBookPackageResult:",checkBookPackageResult)
    return checkBookPackageResult;
};
// end of checkBookPackage()

