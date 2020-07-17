import React from 'react';
import { consoleLogObject } from "../../core/utilities";
import { fetchRepo, getBlobContent } from "./helpers"
import checkFile from "../file-check/checkFile";

const CHECKER_VERSION_STRING = '0.0.2';


async function checkRepo(repoObject, givenLocation, setResultValue, checkingOptions) {
    // console.log("I'm here in checkRepo v" + CHECKER_VERSION_STRING + "\n"
    //           + "  with " + repoObject.full_name + ", " + givenLocation + ", " + JSON.stringify(checkingOptions));

    // consoleLogObject("repoObject", repoObject);
    /* Has fields: id:number, owner:object, name, full_name, description,
        empty, private, fork, parent, mirror, size,
        html_url, ssh_url, clone_url, website,
        stars_count, forks_count, watchers_count, open_issues_count,
        default_branch, archived, created_at, updated_at, permissions:object,
        has_issues, has_wiki, has_pull_requests, ignore_whitespace_conflicts,
        allow_merge_commits, allow_rebase, allow_rebase_explicit, allow_squash_merge,
        avatar_url, branch, tree_url */
    // consoleLogObject("repoObject owner", repoObject.owner);

    let checkRepoResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // Adds the message to the result that we will later return
        // console.log("checkRepo success: " + successString);
        checkRepoResult.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location, extra) {
        // Adds the notices to the result that we will later return
        // console.log("checkRepo Notice: (priority=" + priority + ") " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(typeof priority === 'number', "cR addNotice: 'priority' parameter should be a number not a '" + (typeof priority) + "'");
        console.assert(priority !== undefined, "cR addNotice: 'priority' parameter should be defined");
        console.assert(typeof message === 'string', "cR addNotice: 'message' parameter should be a string not a '" + (typeof message) + "'");
        console.assert(message !== undefined, "cR addNotice: 'message' parameter should be defined");
        console.assert(typeof index === 'number', "cR addNotice: 'index' parameter should be a number not a '" + (typeof index) + "'");
        console.assert(index !== undefined, "cR addNotice: 'index' parameter should be defined");
        console.assert(typeof extract === 'string', "cR addNotice: 'extract' parameter should be a string not a '" + (typeof extract) + "'");
        console.assert(extract !== undefined, "cR addNotice: 'extract' parameter should be defined");
        console.assert(typeof location === 'string', "cR addNotice: 'location' parameter should be a string not a '" + (typeof location) + "'");
        console.assert(location !== undefined, "cR addNotice: 'location' parameter should be defined");
        console.assert(typeof extra === 'string', "cR addNotice: 'extra' parameter should be a string not a '" + (typeof extra) + "'");
        console.assert(extra !== undefined, "cR addNotice: 'extra' parameter should be defined");
        checkRepoResult.noticeList.push([priority, message, index, extract, location, extra]);
    }

    function doOurCheckFile(bookOrFileCode, filename, file_content, fileLocation, optionalCheckingOptions) {
        // We assume that checking for compulsory fields is done elsewhere
        console.log("checkRepo doOurCheckFile(" + filename + ")");

        // Updates the global list of notices
        console.assert(typeof bookOrFileCode === 'string', "doOurCheckFile: 'bookOrFileCode' parameter should be a string not a '" + (typeof bookOrFileCode) + "'");
        console.assert(bookOrFileCode !== undefined, "doOurCheckFile: 'bookOrFileCode' parameter should be defined");
        console.assert(typeof filename === 'string', "doOurCheckFile: 'filename' parameter should be a string not a '" + (typeof filename) + "'");
        console.assert(filename !== undefined, "doOurCheckFile: 'filename' parameter should be defined");
        console.assert(typeof file_content === 'string', "doOurCheckFile: 'file_content' parameter should be a string not a '" + (typeof file_content) + "'");
        console.assert(file_content !== undefined, "doOurCheckFile: 'file_content' parameter should be defined");
        console.assert(typeof fileLocation === 'string', "doOurCheckFile: 'fileLocation' parameter should be a string not a '" + (typeof fileLocation) + "'");
        console.assert(fileLocation !== undefined, "doOurCheckFile: 'fileLocation' parameter should be defined");

        const resultObject = checkFile(filename, file_content, fileLocation, optionalCheckingOptions);
        // console.log("checkFile() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");

        for (let successEntry of resultObject.successList)
            console.log("  ", successEntry);

        // Process results line by line,  appending the bookOrFileCode as an extra field as we go
        for (let noticeEntry of resultObject.noticeList)
            // noticeEntry is an array of five fields: 1=priority, 2=msg, 3=index, 4=extract, 5=location
            if (noticeEntry[0] != 663) // Mismatched left/right chars -- suppress these misleading warnings coz open quote can occur in one verse and close in another
                // We add the bookOrFileCode as an extra value
                addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], bookOrFileCode);
    }
    // end of doOurCheckFile function


    // Main code for checkRepo()
    let ourLocation = givenLocation;
    if (ourLocation[0] != ' ')
        ourLocation = ' ' + ourLocation;
    if (ourLocation.indexOf(repoObject.full_name)<0)
        ourLocation = " in " + repoObject.full_name + givenLocation

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
    console.log("deduced repoType="+repoType, "from", repoObject.name);

    // Now we need to fetch the list of files from the repo
    console.log("About to fetch", repoObject.html_url);
    const fetchedRepoTreemap = await fetchRepo({url: repoObject.html_url});
    console.log("fetchedRepoTreemap", fetchedRepoTreemap);
    consoleLogObject("fetchedRepoTreemap", fetchedRepoTreemap);

    // So now we want to work through checking all the files in this repo:
    let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0;
    for (const [thisFilename, detailObject] of fetchedRepoTreemap.entries()) {
        // console.log("Processing", thisFilename);
        // console.log("  thisFilename="+thisFilename, "detailObject="+detailObject);
        // consoleLogObject("detailObject", detailObject);
        // detailObject has fields: path, mode, type, size, sha, url

        const thisFilenameExtension = thisFilename.split('.').pop();

        let bookOrFileCode = thisFilename; // default to the filename
        if (thisFilename.endsWith('.usfm')) {
            const filenameMain = thisFilename.substring(0, thisFilename.length - 5); // drop .usfm
            // console.log("Have USFM filenameMain=" + filenameMain);
            const BBB = filenameMain.substring(filenameMain.length - 3);
            // console.log("Have USFM bookcode=" + BBB);
            bookOrFileCode = BBB;
            // if (checkedFileCount>3)
            //     continue; // Temp most skip USFM files for now TEMP TEMP ................ XXXXXXXXXXXXXXXXXXXXXXXXXXXX

        // Update our "waiting" message
        setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for <b>{repoObject.full_name}</b> repo: checked {checkedFileCount} file{checkedFileCount==1?'':'s'}…</p>);
        }

        // console.log("Fetching and checking", thisFilename);
        const file_content = await getBlobContent(thisFilename, detailObject);
        // console.log("Got", file_content.length, file_content.substring(0, 19));
        doOurCheckFile(bookOrFileCode, thisFilename, file_content, ourLocation, checkingOptions);
        addSuccessMessage("Checked " + bookOrFileCode.toUpperCase() + " file: " + thisFilename);
        checkedFileCount += 1;
        checkedFilenames.push(thisFilename);
        checkedFilenameExtensions.add(thisFilenameExtension);
        totalCheckedSize += file_content.length;
    }
    // Check for a license and a manifest
    if (checkedFilenames.indexOf('LICENSE.md')<0)
        addNotice(946, "Missing LICENSE.md", -1, "", ourLocation, 'LICENSE');
    if (checkedFilenames.indexOf('manifest.yaml')<0)
        addNotice(947, "Missing manifest.yaml", -1, "", ourLocation, 'MANIFEST');

    // Add some extra fields to our checkFileResult object
    //  in case we need this information again later
    checkRepoResult.checkedFileCount = checkedFileCount;
    checkRepoResult.checkedFilenames = checkedFilenames;
    checkRepoResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
    checkRepoResult.checkedFilesizes = totalCheckedSize;
    checkRepoResult.checkedRepoNames = [repoObject.full_name];
    // checkRepoResult.checkedOptions = checkingOptions; // This is done at the caller level

    console.log("checkRepo() is returning", checkRepoResult.successList.length.toLocaleString(), "success message(s) and", checkRepoResult.noticeList.length.toLocaleString(), "notice(s)");
    return checkRepoResult;
};
// end of checkRepo()

export default checkRepo;
