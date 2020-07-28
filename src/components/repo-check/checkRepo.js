import React from 'react';
import checkFile from "../file-check/checkFile";
// import { fetchRepo, getBlobContent } from "./helpers"
import { fetchTree, fetchRepositoryZipFile, getFile, getURL } from '../../core/getApi';
import { consoleLogObject } from "../../core/utilities";

const CHECKER_VERSION_STRING = '0.1.1';


/*
async function checkRepoGRT(repoObject, givenLocation, setResultValue, checkingOptions) {
    /*
    checkRepoGRT uses the Gitea React Toolkit to fetch the repo

    It returns an object containing:
        successList: an array of strings to tell the use exactly what has been checked
        noticeList: an array of 6 (i.e., with extra bookOrFileCode parameter at end) notice components
    *//*
//     console.log(`I'm here in checkRepoGRT v${CHECKER_VERSION_STRING}
//   with ${repoObject.full_name}, ${givenLocation}, ${JSON.stringify(checkingOptions)}`);

// consoleLogObject("repoObject", repoObject);
/* Has fields: id:number, owner:object, name, full_name, description,
empty, private, fork, parent, mirror, size,
html_url, ssh_url, clone_url, website,
stars_count, forks_count, watchers_count, open_issues_count,
default_branch, archived, created_at, updated_at, permissions:object,
has_issues, has_wiki, has_pull_requests, ignore_whitespace_conflicts,
allow_merge_commits, allow_rebase, allow_rebase_explicit, allow_squash_merge,
avatar_url, branch, tree_url *//*
// consoleLogObject("repoObject owner", repoObject.owner);

let checkRepoResult = { successList: [], noticeList: [] };

function addSuccessMessage(successString) {
// Adds the message to the result that we will later return
// console.log("checkRepoGRT success: " + successString);
checkRepoResult.successList.push(successString);
}
function addNotice(priority, message, index, extract, location, extra) {
// Adds the notices to the result that we will later return
// console.log("checkRepoGRT Notice: (priority=" + priority + ") " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
console.assert(priority !== undefined, "cRgrt addNotice: 'priority' parameter should be defined");
console.assert(typeof priority === 'number', "cRgrt addNotice: 'priority' parameter should be a number not a '" + (typeof priority) + "'");
console.assert(message !== undefined, "cRgrt addNotice: 'message' parameter should be defined");
console.assert(typeof message === 'string', "cRgrt addNotice: 'message' parameter should be a string not a '" + (typeof message) + "'");
console.assert(index !== undefined, "cRgrt addNotice: 'index' parameter should be defined");
console.assert(typeof index === 'number', "cRgrt addNotice: 'index' parameter should be a number not a '" + (typeof index) + "'");
console.assert(extract !== undefined, "cRgrt addNotice: 'extract' parameter should be defined");
console.assert(typeof extract === 'string', "cRgrt addNotice: 'extract' parameter should be a string not a '" + (typeof extract) + "'");
console.assert(location !== undefined, "cRgrt addNotice: 'location' parameter should be defined");
console.assert(typeof location === 'string', "cRgrt addNotice: 'location' parameter should be a string not a '" + (typeof location) + "'");
console.assert(extra !== undefined, "cRgrt addNotice: 'extra' parameter should be defined");
console.assert(typeof extra === 'string', "cRgrt addNotice: 'extra' parameter should be a string not a '" + (typeof extra) + "'");
checkRepoResult.noticeList.push([priority, message, index, extract, location, extra]);
}

function doOurCheckFile(bookOrFileCode, filename, file_content, fileLocation, optionalCheckingOptions) {
// We assume that checking for compulsory fields is done elsewhere
console.log("checkRepoGRT doOurCheckFile(" + filename + ")");

// Updates the global list of notices
console.assert(bookOrFileCode !== undefined, "doOurCheckFile: 'bookOrFileCode' parameter should be defined");
console.assert(typeof bookOrFileCode === 'string', "doOurCheckFile: 'bookOrFileCode' parameter should be a string not a '" + (typeof bookOrFileCode) + "'");
console.assert(filename !== undefined, "doOurCheckFile: 'filename' parameter should be defined");
console.assert(typeof filename === 'string', "doOurCheckFile: 'filename' parameter should be a string not a '" + (typeof filename) + "'");
console.assert(file_content !== undefined, "doOurCheckFile: 'file_content' parameter should be defined");
console.assert(typeof file_content === 'string', "doOurCheckFile: 'file_content' parameter should be a string not a '" + (typeof file_content) + "'");
console.assert(fileLocation !== undefined, "doOurCheckFile: 'fileLocation' parameter should be defined");
console.assert(typeof fileLocation === 'string', "doOurCheckFile: 'fileLocation' parameter should be a string not a '" + (typeof fileLocation) + "'");

const resultObject = checkFile(filename, file_content, fileLocation, optionalCheckingOptions);
// console.log("checkFile() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");
// for (let successEntry of resultObject.successList)
//     console.log("  ", successEntry);

// Process results line by line,  appending the bookOrFileCode as an extra field as we go
for (let noticeEntry of resultObject.noticeList)
// noticeEntry is an array of five fields: 1=priority, 2=msg, 3=index, 4=extract, 5=location
// We add the bookOrFileCode as an extra value
addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], bookOrFileCode);
}
// end of doOurCheckFile function


// Main code for checkRepoGRT()
let ourLocation = givenLocation;
if (ourLocation[0] !== ' ')
ourLocation = ` ${ourLocation}`;
if (ourLocation.indexOf(repoObject.full_name) < 0)
ourLocation = ` in ${repoObject.full_name}${givenLocation}`

// Determine the repo type
//  Unfortunately the "subject" field is not in the repoObject
let repoType = 'unknown';
if (repoObject.name.endsWith('_uhb') || repoObject.name.endsWith('_ugnt')
|| repoObject.name.endsWith('_ult') || repoObject.name.endsWith('_glt')
|| repoObject.name.endsWith('_ust') || repoObject.name.endsWith('_gst')
|| repoObject.name.endsWith('_ulb') || repoObject.name.endsWith('_udb'))
repoType = 'Bible_text';
else if (repoObject.name.endsWith('_tn') || repoObject.name.endsWith('_utn'))
repoType = 'Bible_notes';
else if (repoObject.name.endsWith('_tq') || repoObject.name.endsWith('_utq'))
repoType = 'Bible_questions';
// console.log(`Deduced repoType=${repoType} from ${repoObject.name}`);

// Now we need to fetch the list of files from the repo
// console.log("checkRepoGRT about to fetch", repoObject.html_url);
const fetchedRepoTreemap = await fetchRepo({ url: repoObject.html_url });
// console.log("  fetchedRepoTreemap", JSON.stringify(fetchedRepoTreemap));
// consoleLogObject("  fetchedRepoTreemap", fetchedRepoTreemap);

// So now we want to work through checking all the files in this repo
let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
for (const [thisFilename, detailObject] of fetchedRepoTreemap.entries()) {
// console.log("Processing", thisFilename);
// console.log("  thisFilename="+thisFilename, "detailObject="+detailObject);
// consoleLogObject("detailObject", detailObject);
// detailObject has fields: path, mode, type, size, sha, url

const thisFilenameExtension = thisFilename.split('.').pop();

let bookOrFileCode = thisFilename; // default to the filename
if (thisFilenameExtension === 'usfm') {
const filenameMain = thisFilename.substring(0, thisFilename.length - 5); // drop .usfm
// console.log("Have USFM filenameMain=" + filenameMain);
const BBB = filenameMain.substring(filenameMain.length - 3);
// console.log("Have USFM bookcode=" + BBB);
bookOrFileCode = BBB;
} else
if (thisFilenameExtension === 'tsv') {
    const filenameMain = thisFilename.substring(0, thisFilename.length - 4); // drop .tsv
    // console.log("Have TSV filenameMain=" + filenameMain);
    const BBB = filenameMain.substring(filenameMain.length - 3);
    // console.log("Have TSV bookcode=" + BBB);
    bookOrFileCode = BBB;
}

// Update our "waiting" message
setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for <b>{repoObject.full_name}</b> repo: checked {checkedFileCount} file{checkedFileCount == 1 ? '' : 's'}…</p>);

console.log("checkRepoGRT fetching and checking", thisFilename);
const file_content = await getBlobContent(thisFilename, detailObject);
// console.log("Got", file_content.length, file_content.substring(0, 19));
doOurCheckFile(bookOrFileCode, thisFilename, file_content, ourLocation, checkingOptions);
addSuccessMessage("Checked " + bookOrFileCode.toUpperCase() + " file: " + thisFilename);
checkedFileCount += 1;
checkedFilenames.push(thisFilename);
checkedFilenameExtensions.add(thisFilenameExtension);
totalCheckedSize += file_content.length;
}
// Check that we processed a license and a manifest
if (checkedFilenames.indexOf('LICENSE.md') < 0)
addNotice(946, "Missing LICENSE.md", -1, "", ourLocation, 'LICENSE');
if (checkedFilenames.indexOf('manifest.yaml') < 0)
addNotice(947, "Missing manifest.yaml", -1, "", ourLocation, 'MANIFEST');

// Add some extra fields to our checkRepoResult object
//  in case we need this information again later
checkRepoResult.checkedFileCount = checkedFileCount;
checkRepoResult.checkedFilenames = checkedFilenames;
checkRepoResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
checkRepoResult.checkedFilesizes = totalCheckedSize;
checkRepoResult.checkedRepoNames = [repoObject.full_name];
// checkRepoResult.checkedOptions = checkingOptions; // This is done at the caller level

console.log(`checkRepoGRT() is returning ${checkRepoResult.successList.length.toLocaleString()} success message(s) and ${checkRepoResult.noticeList.length.toLocaleString()} notice(s)`);
return checkRepoResult;
};
// end of checkRepoGRT()
*/



async function checkRepo(username, repoName, branch, givenLocation, setResultValue, checkingOptions) {
    /*
    checkRepo DOES NOT USE the Gitea React Toolkit to fetch the repo

    It returns an object containing:
        successList: an array of strings to tell the use exactly what has been checked
        noticeList: an array of 6 (i.e., with extra bookOrFileCode parameter at end) notice components
    */
    console.log(`I'm here in checkRepo v${CHECKER_VERSION_STRING}
      with ${username}, ${repoName}, ${branch}, ${givenLocation}, ${JSON.stringify(checkingOptions)}`);

    if (branch === undefined) branch = 'master';

    let checkRepoResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // Adds the message to the result that we will later return
        // console.log("checkRepo success: " + successString);
        checkRepoResult.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location, extra) {
        // Adds the notices to the result that we will later return
        // console.log("checkRepo Notice: (priority=" + priority + ") " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(priority !== undefined, "cR addNotice: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', "cR addNotice: 'priority' parameter should be a number not a '" + (typeof priority) + "'");
        console.assert(message !== undefined, "cR addNotice: 'message' parameter should be defined");
        console.assert(typeof message === 'string', "cR addNotice: 'message' parameter should be a string not a '" + (typeof message) + "'");
        console.assert(index !== undefined, "cR addNotice: 'index' parameter should be defined");
        console.assert(typeof index === 'number', "cR addNotice: 'index' parameter should be a number not a '" + (typeof index) + "'");
        console.assert(extract !== undefined, "cR addNotice: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', "cR addNotice: 'extract' parameter should be a string not a '" + (typeof extract) + "'");
        console.assert(location !== undefined, "cR addNotice: 'location' parameter should be defined");
        console.assert(typeof location === 'string', "cR addNotice: 'location' parameter should be a string not a '" + (typeof location) + "'");
        console.assert(extra !== undefined, "cR addNotice: 'extra' parameter should be defined");
        console.assert(typeof extra === 'string', "cR addNotice: 'extra' parameter should be a string not a '" + (typeof extra) + "'");
        checkRepoResult.noticeList.push([priority, message, index, extract, location, extra]);
    }


    function doOurCheckFile(bookOrFileCode, filename, file_content, fileLocation, optionalCheckingOptions) {
        // We assume that checking for compulsory fields is done elsewhere
        // console.log(`checkRepo doOurCheckFile(${filename})…`);

        // Updates the global list of notices
        console.assert(bookOrFileCode !== undefined, "doOurCheckFile: 'bookOrFileCode' parameter should be defined");
        console.assert(typeof bookOrFileCode === 'string', "doOurCheckFile: 'bookOrFileCode' parameter should be a string not a '" + (typeof bookOrFileCode) + "'");
        console.assert(filename !== undefined, "doOurCheckFile: 'filename' parameter should be defined");
        console.assert(typeof filename === 'string', "doOurCheckFile: 'filename' parameter should be a string not a '" + (typeof filename) + "'");
        console.assert(file_content !== undefined, "doOurCheckFile: 'file_content' parameter should be defined");
        console.assert(typeof file_content === 'string', "doOurCheckFile: 'file_content' parameter should be a string not a '" + (typeof file_content) + "'");
        console.assert(fileLocation !== undefined, "doOurCheckFile: 'fileLocation' parameter should be defined");
        console.assert(typeof fileLocation === 'string', "doOurCheckFile: 'fileLocation' parameter should be a string not a '" + (typeof fileLocation) + "'");

        const resultObject = checkFile(filename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFile() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");
        // for (let successEntry of resultObject.successList)
        //     console.log("  ", successEntry);

        // Process results line by line,  appending the bookOrFileCode as an extra field as we go
        for (let noticeEntry of resultObject.noticeList)
            // noticeEntry is an array of five fields: 1=priority, 2=msg, 3=index, 4=extract, 5=location
            // We add the bookOrFileCode as an extra value
            addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], bookOrFileCode);
    }
    // end of doOurCheckFile function


    // Main code for checkRepo()
    let ourLocation = givenLocation;
    if (ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;
    // if (ourLocation.indexOf(username) < 0)
    ourLocation = ` in ${username} ${repoName} ${givenLocation}`

    /*
    // Determine the repo type
    //  Unfortunately we don't have the "subject" field
    let repoType = 'unknown';
    if (repoName.endsWith('_uhb') || repoName.endsWith('_ugnt')
        || repoName.endsWith('_ult') || repoName.endsWith('_glt')
        || repoName.endsWith('_ust') || repoName.endsWith('_gst')
        || repoName.endsWith('_ulb') || repoName.endsWith('_udb'))
        repoType = 'Bible_text';
    else if (repoName.endsWith('_tn') || repoName.endsWith('_utn'))
        repoType = 'Bible_notes';
    else if (repoName.endsWith('_tq') || repoName.endsWith('_utq'))
        repoType = 'Bible_questions';
    // console.log(`Deduced repoType=${repoType} from ${repoName}`);
    */

    // Update our "waiting" message
    setResultValue(<p style={{ color: 'magenta' }}>Fetching zipped files from <b>{username}/{repoName}</b> repository…</p>);

    // Let's fetch the zipped repo since it should be much more efficient than individual fetches
    console.log(`checkRepo: fetch zip file for ${repoName}…`);
    const zipFetchResult = await fetchRepositoryZipFile({ username: username, repository: repoName, sha: branch });
    console.log(`checkRepo: fetched zip file for repo with ${zipFetchResult}`);
    // Note: We don't stop for failure coz the code below will still work (fetching each file individually)

    // Now we need to fetch the list of files from the repo
    console.log("checkRepo about to fetch tree for", username, repoName, branch);
    const fetchedRepoTreemap = await fetchTree({ username: username, repository: repoName, sha: branch });
    // fetchedRepoTreemap = fetchedRepoTreemap.tree;
    // console.log("  fetchedRepoTreemap", JSON.stringify(fetchedRepoTreemap));
    // console.log("  fetchedRepoTreemap keys", JSON.stringify(Object.keys(fetchedRepoTreemap)));
    // consoleLogObject("  fetchedRepoTreemap", fetchedRepoTreemap);

    // Let's make a list of paths so we know how many there will be for a progress bar
    setResultValue(<p style={{ color: 'magenta' }}>Preprocessing file list from <b>{username}/{repoName}</b> repository…</p>);
    let pathList = [];

    async function walkTree(givenTree, pathPrefix) {
        /*
        Load all the filenames by means of the tree
            so this function is called recursively for subfolders
        */
        for (const [_number, detailObject] of givenTree.tree.entries()) {
            // console.log("checkRepo processing", thisFilename);
            // console.log("  thisFilename="+thisFilename, "detailObject="+detailObject);
            // consoleLogObject("detailObject", detailObject);
            // detailObject has fields: path, mode, type, size, sha, url

            const thisFilename = detailObject.path;
            // console.log(`thisFilename=${thisFilename}`);

            // Ignore standard git metadata and similar files/folders
            if (thisFilename === '.github'
                || thisFilename === '.gitattributes'
                || thisFilename === '.gitignore'
                || thisFilename === '.apps'
            ) {
                // console.log("  Ignoring", thisFilename)
                continue;
            }

            const thisType = detailObject.type;
            // console.log(`thisType=${thisType}`);
            if (thisType === 'blob') {
                // const thisPath = pathPrefix? `${pathPrefix}/${thisFilename}` : thisFilename;
                // console.log(`thisPath=${thisPath}`);
                pathList.push(pathPrefix ? `${pathPrefix}/${thisFilename}` : thisFilename);
            } else if (thisType === 'tree') {
                const treeURI = detailObject.url;
                // console.log(`treeURI=${treeURI}`);
                let fetchedSubRepoTreemap = await getURL({ uri: treeURI });
                // fetchedSubRepoTreemap = fetchedSubRepoTreemap.tree;
                // console.log("  fetchedSubRepoTreemap", JSON.stringify(fetchedSubRepoTreemap));
                // console.log("  fetchedSubRepoTreemap keys", JSON.stringify(Object.keys(fetchedSubRepoTreemap)));
                // consoleLogObject("  fetchedSubRepoTreemap", fetchedSubRepoTreemap);
                const newPath = pathPrefix ? `${pathPrefix}/${detailObject.path}` : detailObject.path;
                // console.log(`newPath=${newPath}`);
                await walkTree(fetchedSubRepoTreemap, newPath);
            } else
                console.log(`What is thisType=${thisType}`);
        }
    }
    await walkTree(fetchedRepoTreemap, '');


    // So now we want to work through checking all the files in this repo
    const countString = `${pathList.length.toLocaleString()} file${pathList.length == 1 ? '' : 's'}`;
    let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
    for (const thisFilepath of pathList) {
        // console.log(`thisFilepath=${thisFilepath}`);
        const thisFilename = thisFilepath.split('/').pop();
        // console.log(`thisFilename=${thisFilename}`);
        const thisFilenameExtension = thisFilename.split('.').pop();
        // console.log(`thisFilenameExtension=${thisFilenameExtension}`);

        // Default to the main filename without the extensions
        let bookOrFileCode = thisFilename.substring(0, thisFilename.length - thisFilenameExtension.length - 1);
        if (thisFilenameExtension === 'usfm') {
            // const filenameMain = thisFilename.substring(0, thisFilename.length - 5); // drop .usfm
            // console.log(`Have USFM filenameMain=${bookOrFileCode}`);
            const BBB = bookOrFileCode.substring(bookOrFileCode.length - 3);
            // console.log(`Have USFM bookcode=${BBB}`);
            bookOrFileCode = BBB;
        }
        else if (thisFilenameExtension === 'tsv') {
            // const filenameMain = thisFilename.substring(0, thisFilename.length - 4); // drop .tsv
            // console.log(`Have TSV filenameMain=${bookOrFileCode}`);
            const BBB = bookOrFileCode.substring(bookOrFileCode.length - 3);
            // console.log(`Have TSV bookcode=${BBB}`);
            bookOrFileCode = BBB;
        }

        // console.log("checkRepo: Try to load", username, repoName, thisPath, branch);
        let fileContent;
        try {
            fileContent = await getFile({ username, repository: repoName, path: thisFilepath, branch });
            // console.log("Fetched file_content for", repoName, thisPath, typeof fileContent, fileContent.length);
        } catch (e) {
            console.log("Failed to load", username, repoName, thisFilepath, branch, e + '');
            addNotice(996, "Failed to load", -1, "", `${generalLocation} ${thisFilepath}: ${e}`, repoCode);
            return;
        }
        // console.log("checkRepo fetching and checking", thisFilename);
        // const fileContent = await getBlobContent(thisFilename, detailObject);
        // console.log("Got", fileContent.length, file_content.substring(0, 19));
        if (fileContent) {
            await doOurCheckFile(bookOrFileCode, thisFilename, fileContent, ourLocation, checkingOptions);
            checkedFileCount += 1;
            checkedFilenames.push(thisFilename);
            checkedFilenameExtensions.add(thisFilenameExtension);
            totalCheckedSize += fileContent.length;
            if (thisFilenameExtension !== 'md') // There's often far, far too many of these
                addSuccessMessage(`Checked ${bookOrFileCode.toUpperCase()} file: ${thisFilename}`);
        }
        // Update our "waiting" message
        setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for <b>{username}/{repoName}</b> repo: checked {checkedFileCount.toLocaleString()}/{countString}…</p>);
    }
    // console.log("Finished checkRepo loop");

    // Check that we processed a license and a manifest
    if (checkedFilenames.indexOf('LICENSE.md') < 0)
        addNotice(946, "Missing LICENSE.md", -1, "", ourLocation, 'LICENSE');
    if (checkedFilenames.indexOf('manifest.yaml') < 0)
        addNotice(947, "Missing manifest.yaml", -1, "", ourLocation, 'MANIFEST');

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
    return checkRepoResult;
};
// end of checkRepo()


export default checkRepo;
