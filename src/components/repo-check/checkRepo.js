import { consoleLogObject } from "../../core/utilities";
import checkFile from "../file-check/checkFile";

const CHECKER_VERSION_STRING = '0.0.1';

async function checkRepo(repoObject, givenLocation, checkingOptions) {
    console.log("I'm here in checkRepo v" + CHECKER_VERSION_STRING);
    console.log("  with " + repoObject.full_name + ", " + givenLocation + ", " + JSON.stringify(checkingOptions));

    consoleLogObject("repoObject", repoObject);
    /* Has fields: id:number, owner:object, name, full_name, description,
        empty, private, fork, parent, mirror, size,
        html_url, ssh_url, clone_url, website,
        stars_count, forks_count, watchers_count, open_issues_count,
        default_branch, archived, created_at, updated_at, permissions:object,
        has_issues, has_wiki, has_pull_requests, ignore_whitespace_conflicts,
        allow_merge_commits, allow_rebase, allow_rebase_explicit, allow_squash_merge,
        avatar_url, branch, tree_url */
    consoleLogObject("repoObject owner", repoObject.owner);

    let checkRepoResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        checkRepoResult.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location, extra) {
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
        console.log("checkFile() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");

        for (let successEntry of resultObject.successList)
            console.log("  ", successEntry);

        // Process results line by line,  appending the bookOrFileCode as an extra field as we go
        for (let noticeEntry of resultObject.noticeList)
            // noticeEntry is an array of five fields: 1=priority, 2=msg, 3=index, 4=extract, 5=location
            if (noticeEntry[0] != 663) // Suppress these misleading warnings coz open quote can occur in one verse and close in another
                // We add the bookOrFileCode as an extra value
                addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], bookOrFileCode);
    }
    // end of doOurCheckFile function


    // Main code for checkRepo()
    const ourLocation = ' in ' + repoObject.full_name + givenLocation;

    // First we need to fetch the files

    // So now we want to work through checking all the files in this repo:
    let checkedFileCount = 0, checkedFilenames = [], totalCheckedSize = 0, checkedRepoNames = [];
    for (let bookOrFileCode of ['ULT', 'UST', 'TN', 'TQ']) {
        const filename = bookOrFileCode+'.txt';
        const file_content = "hello there\nThis is a file\n";
        doOurCheckFile(bookOrFileCode, filename, file_content, ourLocation, checkingOptions);
    addSuccessMessage(checkedFileCount + "/ Checked " + bookOrFileCode.toUpperCase() + " file: " + filename);
    }

    // Add some extra fields to our checkFileResult object
    //  in case we need this information again later
    checkRepoResult.checkedFileCount = checkedFileCount;
    checkRepoResult.checkedFilenames = checkedFilenames;
    checkRepoResult.checkedFilesizes = totalCheckedSize;
    checkRepoResult.checkedRepoNames = checkedRepoNames;
    // checkRepoResult.checkedOptions = checkingOptions; // This is done at the caller level

    console.log("checkRepo() is returning", checkRepoResult.successList.length.toLocaleString(), "success message(s) and", checkRepoResult.noticeList.length.toLocaleString(), "notice(s)");
    return checkRepoResult;
};
// end of checkRepo()

export default checkRepo;
