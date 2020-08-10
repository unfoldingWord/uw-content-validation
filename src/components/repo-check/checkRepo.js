import React from 'react';
import checkFile from '../file-check/checkFile';
// import { getFilelistFromFetchedTreemaps, getFilelistFromFetchedZip } from '../helpers';
// import { fetchRepo, getBlobContent } from './helpers'
import { fetchRepositoryZipFile, getFilelistFromZip, getFile } from '../../core/getApi';
// import { fetchTree, fetchRepositoryZipFile, getFile, cachedGetURL } from '../../core/getApi';
import { consoleLogObject } from '../../core/utilities';


const CHECKER_VERSION_STRING = '0.3.2';


async function checkRepo(username, repoName, branch, givenLocation, setResultValue, checkingOptions) {
    /*
    checkRepo DOES NOT USE the Gitea React Toolkit to fetch the repo

    It returns an object containing:
        successList: an array of strings to tell the use exactly what has been checked
        noticeList: an array of 9 (i.e., with extra bookOrFileCode parameter at end) notice components
    */
    console.log(`I'm here in checkRepo v${CHECKER_VERSION_STRING}
      with ${username}, ${repoName}, ${branch}, ${givenLocation}, ${JSON.stringify(checkingOptions)}`);
    const startTime = new Date();

    if (branch === undefined) branch = 'master'; // Ideally we should ask what the default branch is

    let checkRepoResult = {
        successList: [], noticeList: [],
        checkedFileCount:0, checkedFilenames: [], checkedFilenameExtensions: []
    };

    function addSuccessMessage(successString) {
        // Adds the message to the result that we will later return
        // console.log("checkRepo success: " + successString);
        checkRepoResult.successList.push(successString);
    }
    function addNotice9(priority, BBB, C, V, message, index, extract, location, extra) {
        // Adds the notices to the result that we will later return
        // Note that BBB,C,V might all be empty strings (as some repos don't have BCV)
        // console.log(`checkRepo addNotice9: (priority=${priority}) ${BBB} ${C}:${V} ${message}${index > 0 ? " (at character " + index + 1 + ")" : ""}${extract ? " " + extract : ""}${location}`);
        console.assert(priority !== undefined, "cR addNotice9: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "cR addNotice9: 'priority' parameter should be a number not a '" + (typeof priority) + "'");
        console.assert(BBB !== undefined, "cR addNotice9: 'BBB' parameter should be defined");
        console.assert(typeof BBB === 'string', "cR addNotice9: 'BBB' parameter should be a string not a '" + (typeof BBB) + "'");
        // console.assert(BBB.length === 3, `cR addNotice9: 'BBB' parameter should be three characters long not ${BBB.length}`);
        console.assert(C !== undefined, "cR addNotice9: 'C' parameter should be defined");
        console.assert(typeof C === 'string', "cR addNotice9: 'C' parameter should be a string not a '" + (typeof C) + "'");
        console.assert(V !== undefined, "cR addNotice9: 'V' parameter should be defined");
        console.assert(typeof V === 'string', "cR addNotice9: 'V' parameter should be a string not a '" + (typeof V) + "'");
        console.assert(message !== undefined, "cR addNotice9: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "cR addNotice9: 'message' parameter should be a string not a '" + (typeof message) + "'");
        console.assert(index !== undefined, "cR addNotice9: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "cR addNotice9: 'index' parameter should be a number not a '" + (typeof index) + "'");
        console.assert(extract !== undefined, "cR addNotice9: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "cR addNotice9: 'extract' parameter should be a string not a '" + (typeof extract) + "'");
        console.assert(location !== undefined, "cR addNotice9: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "cR addNotice9: 'location' parameter should be a string not a '" + (typeof location) + "'");
        console.assert(extra !== undefined, "cR addNotice9: 'extra' parameter should be defined");
        console.assert(typeof extra === 'string', "cR addNotice9: 'extra' parameter should be a string not a '" + (typeof extra) + "'");
        checkRepoResult.noticeList.push([priority, BBB, '', '', message, index, extract, location, extra]);
    }


    async function doOurCheckFile(bookOrFileCode, BBBid, filename, file_content, fileLocation, optionalCheckingOptions) {
        // We assume that checking for compulsory fields is done elsewhere
        // console.log(`checkRepo doOurCheckFile(${filename})…`);

        // Updates the global list of notices
        console.assert(bookOrFileCode !== undefined, "doOurCheckFile: 'bookOrFileCode' parameter should be defined");
        console.assert(typeof bookOrFileCode === 'string', "doOurCheckFile: 'bookOrFileCode' parameter should be a string not a '" + (typeof bookOrFileCode) + "'");
        console.assert(BBBid !== undefined, "doOurCheckFile: 'BBBid' parameter should be defined");
        console.assert(typeof BBBid === 'string', "doOurCheckFile: 'BBBid' parameter should be a string not a '" + (typeof BBBid) + "'");
        console.assert(filename !== undefined, "doOurCheckFile: 'filename' parameter should be defined");
        console.assert(typeof filename === 'string', "doOurCheckFile: 'filename' parameter should be a string not a '" + (typeof filename) + "'");
        console.assert(file_content !== undefined, "doOurCheckFile: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', "doOurCheckFile: 'file_content' parameter should be a string not a '" + (typeof file_content) + "'");
        console.assert(fileLocation !== undefined, "doOurCheckFile: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', "doOurCheckFile: 'fileLocation' parameter should be a string not a '" + (typeof fileLocation) + "'");

        const resultObject = await checkFile(filename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFile() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");
        // for (const successEntry of resultObject.successList)
        //     console.log("  ", successEntry);

        // Process results line by line,  appending the bookOrFileCode as an extra field as we go
        for (const noticeEntry of resultObject.noticeList) {
            // We add the bookOrFileCode as an extra value
            if (noticeEntry.length === 5)
                // noticeEntry is an array of five fields: 1=priority, 2=msg, 3=index, 4=extract, 5=location
            addNotice9(noticeEntry[0], BBBid, '', '', noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], bookOrFileCode);
            else if (noticeEntry.length === 8)
                // noticeEntry is an array of eight fields: 1=priority, 2=BBB, 3=C, 4=V, 5=msg, 6=index, 7=extract, 8=location
                addNotice9(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7], bookOrFileCode);
            else
                console.log(`ERROR: checkRepo doOurCheckFile got length ${noticeEntry.length}`);
        }
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
        const zipFetchSucceeded = await fetchRepositoryZipFile({ username: username, repository: repoName, sha: branch });
        if (!zipFetchSucceeded)
            console.log(`checkRepo: misfetched zip file for repo with ${zipFetchSucceeded}`);
        if (!zipFetchSucceeded) return checkRepoResult;
        // Note: We don't stop for failure coz the code below will still work (fetching each file individually)

        // Now we need to fetch the list of files from the repo
        setResultValue(<p style={{ color: 'magenta' }}>Preprocessing file list from <b>{username}/{repoName}</b> repository…</p>);
        // const pathList = await getFilelistFromFetchedTreemaps(username, repoName, branch);
        const pathList = await getFilelistFromZip({ username: username, repository: repoName, sha: branch });
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
            let BBBid = "";
            if (thisFilenameExtension === 'usfm') {
                // const filenameMain = thisFilename.substring(0, thisFilename.length - 5); // drop .usfm
                // console.log(`Have USFM filenameMain=${bookOrFileCode}`);
                const BBB = bookOrFileCode.substring(bookOrFileCode.length - 3);
                // console.log(`Have USFM bookcode=${BBB}`);
                bookOrFileCode = BBB;
                BBBid = BBB;
            }
            else if (thisFilenameExtension === 'tsv') {
                // const filenameMain = thisFilename.substring(0, thisFilename.length - 4); // drop .tsv
                // console.log(`Have TSV filenameMain=${bookOrFileCode}`);
                const BBB = bookOrFileCode.substring(bookOrFileCode.length - 3);
                // console.log(`Have TSV bookcode=${BBB}`);
                bookOrFileCode = BBB;
                BBBid = BBB;
            }

            // console.log("checkRepo: Try to load", username, repoName, thisFilepath, branch);
            let repoFileContent;
            try {
                repoFileContent = await getFile({ username, repository: repoName, path: thisFilepath, branch });
                // console.log("Fetched file_content for", repoName, thisPath, typeof repoFileContent, repoFileContent.length);
            } catch (cRgfError) {
                console.log("Failed to load", username, repoName, thisFilepath, branch, cRgfError + '');
                addNotice9(996, BBBid,'','', "Failed to load", -1, "", `${generalLocation} ${thisFilepath}: ${cRgfError}`, repoCode);
                return;
            }
            if (repoFileContent) {
                // console.log(`checkRepo checking ${thisFilename}`);
                await doOurCheckFile(bookOrFileCode, BBBid, thisFilename, repoFileContent, ourLocation, checkingOptions);
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
            addNotice9(946, BBBid,'','', "Missing LICENSE.md", -1, "", ourLocation, 'LICENSE');
        if (checkedFilenames.indexOf('manifest.yaml') < 0)
            addNotice9(947, BBBid,'','', "Missing manifest.yaml", -1, "", ourLocation, 'MANIFEST');

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
