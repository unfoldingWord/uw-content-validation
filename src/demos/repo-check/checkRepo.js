import React from 'react';
import * as books from '../../core/books/books';
import checkFile from '../file-check/checkFile';
// import { getFilelistFromFetchedTreemaps, getFilelistFromFetchedZip } from '../helpers';
// import { fetchRepo, getBlobContent } from './helpers'
import { fetchRepositoryZipFile, getFilelistFromZip, getFile } from '../../core/getApi';
// import { fetchTree, fetchRepositoryZipFile, getFile, cachedGetURL } from '../../core/getApi';
import { consoleLogObject } from '../../core/utilities';


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


    async function ourCheckFile(bookOrFileCode, cfBookID, filename, file_content, fileLocation, optionalCheckingOptions) {
        // We assume that checking for compulsory fields is done elsewhere
        // console.log(`checkRepo ourCheckFile(${filename})…`);

        // Updates the global list of notices
        console.assert(bookOrFileCode !== undefined, "ourCheckFile: 'bookOrFileCode' parameter should be defined");
        console.assert(typeof bookOrFileCode === 'string', `ourCheckFile: 'bookOrFileCode' parameter should be a string not a '${typeof bookOrFileCode}'`);
        console.assert(cfBookID !== undefined, "ourCheckFile: 'cfBookID' parameter should be defined");
        console.assert(typeof cfBookID === 'string', `ourCheckFile: 'cfBookID' parameter should be a string not a '${typeof cfBookID}'`);
        console.assert(filename !== undefined, "ourCheckFile: 'filename' parameter should be defined");
        console.assert(typeof filename === 'string', `ourCheckFile: 'filename' parameter should be a string not a '${typeof filename}'`);
        console.assert(file_content !== undefined, "ourCheckFile: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', `ourCheckFile: 'file_content' parameter should be a string not a '${typeof file_content}'`);
        console.assert(fileLocation !== undefined, "ourCheckFile: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', `ourCheckFile: 'fileLocation' parameter should be a string not a '${typeof fileLocation}'`);

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
    // end of ourCheckFile function


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
                await ourCheckFile(bookOrFileCode, ourBookID, thisFilename, repoFileContent, ourLocation, checkingOptions);
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


export default checkRepo;
