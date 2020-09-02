import React from 'react';
import * as books from '../../core/books/books';
import checkFile from '../file-check/checkFile';
import checkRepo from '../repo-check/checkRepo';
import { getFilelistFromZip, getFile } from '../../core/getApi';
// import { consoleLogObject } from '../../core/utilities';


const CHECKER_VERSION_STRING = '0.2.4';


async function checkTQbook(username, repoName, branch, bookID, checkingOptions) {
    // console.log(`checkTQbook(${username}, ${repoName}, ${branch}, ${bookID}, …)…`);

    const repoCode = 'TQ';
    const generalLocation = `in ${username} ${repoName} (${branch})`;

    const ctqResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkBookPackage success: ${successString}`);
        ctqResult.successList.push(successString);
    }

    function addNotice9(priority, bookID, C, V, message, characterIndex, extract, location, extra) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // console.log(`checkTQbook addNotice9: (priority=${priority}) ${bookID} ${C}:${V} ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cTQ addNotice9: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cTQ addNotice9: 'priority' parameter should be a number not a '${typeof priority}'`);
        console.assert(bookID !== undefined, "cTQ addNotice9: 'bookID' parameter should be defined");
        console.assert(typeof bookID === 'string', `cTQ addNotice9: 'bookID' parameter should be a string not a '${typeof bookID}'`);
        console.assert(bookID.length === 3, `cTQ addNotice9: 'bookID' parameter should be three characters long not ${bookID.length}`);
        console.assert(books.isValidBookID(bookID), `cTQ addNotice9: '${bookID}' is not a valid USFM book identifier`);
        console.assert(C !== undefined, "cTQ addNotice9: 'C' parameter should be defined");
        console.assert(typeof C === 'string', `cTQ addNotice9: 'C' parameter should be a string not a '${typeof C}'`);
        console.assert(V !== undefined, "cTQ addNotice9: 'V' parameter should be defined");
        console.assert(typeof V === 'string', `cTQ addNotice9: 'V' parameter should be a string not a '${typeof V}'`);
        console.assert(message !== undefined, "cTQ addNotice9: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cTQ addNotice9: 'message' parameter should be a string not a '${typeof message}'`);
        console.assert(characterIndex !== undefined, "cTQ addNotice9: 'characterIndex' parameter should be defined");
        console.assert(typeof characterIndex === 'number', `cTQ addNotice9: 'characterIndex' parameter should be a number not a '${typeof characterIndex}'`);
        console.assert(extract !== undefined, "cTQ addNotice9: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `cTQ addNotice9: 'extract' parameter should be a string not a '${typeof extract}'`);
        console.assert(location !== undefined, "cTQ addNotice9: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cTQ addNotice9: 'location' parameter should be a string not a '${typeof location}'`);
        console.assert(extra !== undefined, "cTQ addNotice9: 'extra' parameter should be defined");
        console.assert(typeof extra === 'string', `cTQ addNotice9: 'extra' parameter should be a string not a '${typeof extra}'`);
        ctqResult.noticeList.push({priority, bookID, C, V, message, characterIndex, extract, location, extra});
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
            console.assert(Object.keys(noticeEntry).length === 5, `cTQ doOurCheckFile notice length=${Object.keys(noticeEntry).length}`);
            // We add the repoCode as an extra value
            addNotice9(noticeEntry.priority, bookID, C, V, noticeEntry.message, noticeEntry.characterIndex, noticeEntry.extract, noticeEntry.location, repoCode);
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
            addNotice9(996, bookID, C, V, "Failed to load", -1, "", `${generalLocation} ${thisPath}: ${tQerror}`, repoCode);
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


async function checkBookPackage(username, language_code, bookID, setResultValue, checkingOptions) {
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

    function addNotice9(priority, bookID, C, V, message, characterIndex, extract, location, extra) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        // console.log(`checkBookPackage addNotice9: (priority=${priority}) ${bookID} ${C}:${V} ${message}${characterIndex > 0 ? ` (at character ${characterIndex}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cBP addNotice9: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cBP addNotice9: 'priority' parameter should be a number not a '${typeof priority}'`);
        console.assert(bookID !== undefined, "cBP addNotice9: 'bookID' parameter should be defined");
        console.assert(typeof bookID === 'string', `cBP addNotice9: 'bookID' parameter should be a string not a '${typeof bookID}'`);
        console.assert(bookID.length === 3, `cBP addNotice9: 'bookID' parameter should be three characters long not ${bookID.length}`);
        console.assert(books.isValidBookID(bookID), `cBP addNotice9: '${bookID}' is not a valid USFM book identifier`);
        console.assert(C !== undefined, "cBP addNotice9: 'C' parameter should be defined");
        console.assert(typeof C === 'string', `cBP addNotice9: 'C' parameter should be a string not a '${typeof C}'`);
        console.assert(V !== undefined, "cBP addNotice9: 'V' parameter should be defined");
        console.assert(typeof V === 'string', `cBP addNotice9: 'V' parameter should be a string not a '${typeof V}'`);
        console.assert(message !== undefined, "cBP addNotice9: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cBP addNotice9: 'message' parameter should be a string not a '${typeof message}'`);
        console.assert(characterIndex !== undefined, "cBP addNotice9: 'characterIndex' parameter should be defined");
        console.assert(typeof characterIndex === 'number', `cBP addNotice9: 'characterIndex' parameter should be a number not a '${typeof characterIndex}'`);
        console.assert(extract !== undefined, "cBP addNotice9: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `cBP addNotice9: 'extract' parameter should be a string not a '${typeof extract}'`);
        console.assert(location !== undefined, "cBP addNotice9: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cBP addNotice9: 'location' parameter should be a string not a '${typeof location}'`);
        console.assert(extra !== undefined, "cBP addNotice9: 'extra' parameter should be defined");
        console.assert(typeof extra === 'string', `cBP addNotice9: 'extra' parameter should be a string not a '${typeof extra}'`);
        checkBookPackageResult.noticeList.push({priority, bookID, C, V, message, characterIndex, extract, location, extra});
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
        for (const noticeEntry of cfResultObject.noticeList) {
            // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=extract, 8=location
            // We add the repoCode as an extra value
            if (Object.keys(noticeEntry).length === 8)
                addNotice9(noticeEntry.priority, noticeEntry.bookID, noticeEntry.C, noticeEntry.V, noticeEntry.message, noticeEntry.characterIndex, noticeEntry.extract, noticeEntry.location, repoCode);
            else if (Object.keys(noticeEntry).length === 5)
                addNotice9(noticeEntry.priority, bookID,'','', noticeEntry.message, noticeEntry.characterIndex, noticeEntry.extract, noticeEntry.location, repoCode);
            else
                console.assert(Object.keys(noticeEntry).length === 8, `cBP doOurCheckFile notice length=${Object.keys(noticeEntry).length}`);
        }
    }
    // end of doOurCheckFile function


    /* async function doOurCheckRepo(username, repoName, branch, repoLocation, optionalCheckingOptions) {
        // console.log(`checkBookPackage doOurCheckRepo(${username}, ${repoName}, ${branch})…`);

        // Updates the global list of notices
        console.assert(username !== undefined, "cBP doOurCheckRepo: 'username' parameter should be defined");
        console.assert(typeof username === 'string', `cBP doOurCheckRepo: 'username' parameter should be a string not a '${typeof username}'`);
        console.assert(repoName !== undefined, "cBP doOurCheckRepo: 'repoName' parameter should be defined");
        console.assert(typeof repoName === 'string', `cBP doOurCheckRepo: 'repoName' parameter should be a string not a '${typeof repoName}'`);
        console.assert(repoLocation !== undefined, "cBP doOurCheckRepo: 'repoLocation' parameter should be defined");
        console.assert(typeof repoLocation === 'string', `cBP doOurCheckRepo: 'repoLocation' parameter should be a string not a '${typeof repoLocation}'`);

        const crResultObject = await checkRepo(username, repoName, branch, repoLocation, setResultValue, optionalCheckingOptions)
        console.log(`checkRepo() returned ${crResultObject.successList.length} success message(s) and ${crResultObject.noticeList.length} notice(s)`);
        console.log("crResultObject keys", JSON.stringify(Object.keys(crResultObject)));

        // Concat is faster if we don't need to process each notice individually
        checkBookPackageResult.successList = checkBookPackageResult.successList.concat(crResultObject.successList);
        checkBookPackageResult.noticeList = checkBookPackageResult.noticeList.concat(crResultObject.noticeList);
        // Process results line by line
        // for (const noticeEntry of crResultObject.noticeList)
        // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=extract, 8=location
        // We add the repoCode as an extra value
        // addNotice9(noticeEntry.priority, noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7]);
        // console.log(`doOurCheckRepo() finished.`)
        return crResultObject;
    }
    // end of doOurCheckRepo function */


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
                addNotice9(900, '', '', '', "Bad function call: should be given a valid book abbreviation", -1, bookID, ` (not '${bookID}')${location}`, '');
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
                    addNotice9(996, bookID, '', '', "Failed to load", -1, "", `${generalLocation} ${filename}: ${cBPgfError}`, repoCode);
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

    // console.log("checkBookPackage() is returning", checkBookPackageResult.successList.length.toLocaleString(), "success message(s) and", checkBookPackageResult.noticeList.length.toLocaleString(), "notice(s)");
    checkBookPackageResult.elapsedTime = (new Date() - startTime) / 1000; // seconds
    return checkBookPackageResult;
};
// end of checkBookPackage()

export default checkBookPackage;
