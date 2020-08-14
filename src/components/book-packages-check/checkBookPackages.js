import React from 'react';
import * as books from '../../core/books/books';
import checkBookPackage from '../book-package-check/checkBookPackage';
import { getFile } from '../../core/getApi';
// import { consoleLogObject } from '../../core/utilities';

const CHECKER_VERSION_STRING = '0.1.0';


async function checkBookPackages(username, language_code, bookCodeList, setResultValue, checkingOptions) {
    //     console.log(`I'm here in checkBookPackages v${CHECKER_VERSION_STRING}
    //   with ${username}, ${language_code}, ${bookCodeList}, ${JSON.stringify(checkingOptions)}`);
    const startTime = new Date();

    const checkBookPackagesResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkBookPackages success: ${successString}`);
        checkBookPackagesResult.successList.push(successString);
    }

    function addNotice9(priority, BBB,C,V, message, index, extract, location, extra) {
        // console.log(`checkBookPackages Notice: (priority=${priority}) ${extra} ${message}${index > 0 ? ` (at character ${index}${1})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(priority !== undefined, "cBPs addNotice9: 'priority' parameter should be defined");
        console.assert(typeof priority === 'number', `cBPs addNotice9: 'priority' parameter should be a number not a '${typeof priority}'`);
        console.assert(BBB !== undefined, "cBPs addNotice9: 'BBB' parameter should be defined");
        console.assert(typeof BBB === 'string', `cBPs addNotice9: 'BBB' parameter should be a string not a '${typeof BBB}'`);
        console.assert(BBB.length === 3, `cBPs addNotice9: 'BBB' parameter should be three characters long not ${BBB.length}`);
        console.assert(books.isValidBookCode(BBB), `cBPs addNotice9: '${BBB}' is not a valid USFM book code`);
        console.assert(C !== undefined, "cBPs addNotice9: 'C' parameter should be defined");
        console.assert(typeof C === 'string', `cBPs addNotice9: 'C' parameter should be a string not a '${typeof C}'`);
        console.assert(V !== undefined, "cBPs addNotice9: 'V' parameter should be defined");
        console.assert(typeof V === 'string', `cBPs addNotice9: 'V' parameter should be a string not a '${typeof V}'`);
        console.assert(message !== undefined, "cBPs addNotice9: 'message' parameter should be defined");
        console.assert(typeof message === 'string', `cBPs addNotice9: 'message' parameter should be a string not a '${typeof message}'`);
        console.assert(index !== undefined, "cBPs addNotice9: 'index' parameter should be defined");
        console.assert(typeof index === 'number', `cBPs addNotice9: 'index' parameter should be a number not a '${typeof index}'`);
        console.assert(extract !== undefined, "cBPs addNotice9: 'extract' parameter should be defined");
        console.assert(typeof extract === 'string', `cBPs addNotice9: 'extract' parameter should be a string not a '${typeof extract}'`);
        console.assert(location !== undefined, "cBPs addNotice9: 'location' parameter should be defined");
        console.assert(typeof location === 'string', `cBPs addNotice9: 'location' parameter should be a string not a '${typeof location}'`);
        console.assert(extra !== undefined, "cBPs addNotice9: 'extra' parameter should be defined");
        console.assert(typeof extra === 'string', `cBPs addNotice9: 'extra' parameter should be a string not a '${typeof extra}'`);
        checkBookPackagesResult.noticeList.push([priority, BBB,C,V, message, index, extract, location, extra]);
    }


    // Main code for checkBookPackages()
    let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0, checkedRepoNames = new Set();
    for (const bookCode of bookCodeList) {
        // console.log(`checkBookPackages bookCode: ${bookCode}`);

        // const generalLocation = ` ${language_code} ${bookCode} book packages from ${username}`;
        if (bookCode !== 'OBS') {
            let bookNumberAndName; //, whichTestament;
            try {
                bookNumberAndName = books.usfmNumberName(bookCode);
                // whichTestament = books.testament(bookCode); // returns 'old' or 'new'
            } catch (CBPsError) {
                addNotice9(900, '','','', "Bad parameter: should be given a valid book abbreviation", -1,bookCodeList, ` (not '${bookCodeList}')${location}`);
                return checkBookPackagesResult;
            }
            // console.log(`bookNumberAndName='${bookNumberAndName}' (${whichTestament} testament)`);
        }

        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        const cbpResultObject = await checkBookPackage(username, language_code, bookCode, setResultValue, checkingOptions);
        // console.log(`checkBookPackage() returned ${cbpResultObject.successList.length} success message(s) and ${cbpResultObject.noticeList.length} notice(s)`);

        // Concat is faster if we don't need to process each success message individually
        checkBookPackagesResult.successList = checkBookPackagesResult.successList.concat(cbpResultObject.successList);
        // Process results line by line,  appending the repoCode/bookCode as an extra field as we go
        // for (const successEntry of cbpResultObject.successList) {
        //     // console.log("  doOurCheckBookPackage:", successEntry);
        //     addSuccessMessage(successEntry);
        // }

        // Concat is faster if we don't need to process each notice individually
        checkBookPackagesResult.noticeList = checkBookPackagesResult.noticeList.concat(cbpResultObject.noticeList);
        // for (const noticeEntry of cbpResultObject.noticeList)
        //     // noticeEntry is an array of eight fields: 1=priority, 2=BBB, 3=C, 4=V, 5=msg, 6=index, 7=extract, 8=location
        //     // The extra value from checkBookPackage is the repo name
        //     addNotice9(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7], noticeEntry[5]);

        checkedFileCount += cbpResultObject.checkedFileCount;
        checkedFilenames = [...checkedFilenames, ...cbpResultObject.checkedFilenames];
        checkedFilenameExtensions = new Set([...checkedFilenameExtensions, ...cbpResultObject.checkedFilenameExtensions]);
        totalCheckedSize += cbpResultObject.checkedFilesizes;
        checkedRepoNames = new Set([...checkedRepoNames, ...cbpResultObject.checkedRepoNames]);

        // addSuccessMessage(`${checkedFileCount.toLocaleString()}/ Checked ${bookCode} book package`);

        // Update our "waiting" message {checkedFileCount==1?'':'s'}
        // setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for {username} {language_code} <b>{bookCodeList}</b> book package: checked <b>{checkedFileCount.toLocaleString()}</b>/5 repos…</p>);
    }

    // Add some extra fields to our checkFileResult object
    //  in case we need this information again later
    checkBookPackagesResult.checkedFileCount = checkedFileCount;
    checkBookPackagesResult.checkedFilenames = checkedFilenames;
    checkBookPackagesResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
    checkBookPackagesResult.checkedFilesizes = totalCheckedSize;
    checkedRepoNames = [...checkedRepoNames]; // Convert set to Array
    const index = checkedRepoNames.indexOf(`${username}/${language_code}_obs`);
    if (index !== -1) checkedRepoNames[index] = 'OBS'; // Looks tidier here
    checkBookPackagesResult.checkedRepoNames = checkedRepoNames;
    // checkBookPackagesResult.checkedOptions = checkingOptions; // This is done at the caller level

    // console.log("checkBookPackages() is returning", checkBookPackagesResult.successList.length.toLocaleString(), "success message(s) and", checkBookPackagesResult.noticeList.length.toLocaleString(), "notice(s)");
    checkBookPackagesResult.elapsedTime = (new Date() - startTime) / 1000; // seconds
    return checkBookPackagesResult;
};
// end of checkBookPackages()

export default checkBookPackages;
