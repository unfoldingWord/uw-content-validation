import * as books from '../../core/books/books';
import { checkBookPackage } from '../book-package-check/checkBookPackage';
import { userLog, parameterAssert } from '../../core/utilities';
// import { consoleLogObject } from '../../core/utilities';

// const BPs_VALIDATOR_VERSION_STRING = '0.2.4';


export async function checkBookPackages(username, languageCode, bookIDList, setResultValue, checkingOptions) {
    //     userLog(`I'm here in checkBookPackages v${VALIDATOR_VERSION_STRING}
    //   with ${username}, ${languageCode}, ${bookIDList}, ${JSON.stringify(checkingOptions)}`);
    let abortFlag = false;
    const startTime = new Date();

    const checkBookPackagesResult = { successList: [], noticeList: [] };

    // function addSuccessMessage(successString) {
    //     // functionLog(`checkBookPackages success: ${successString}`);
    //     checkBookPackagesResult.successList.push(successString);
    // }

    function addNotice(noticeObject) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        userLog(`cBPs addNotice: (priority=${noticeObject.priority}) ${noticeObject.extra} ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? ` ${noticeObject.extract}` : ""}${noticeObject.location}`);
        parameterAssert(noticeObject.priority !== undefined, "cBPs addNotice: 'priority' parameter should be defined");
        parameterAssert(typeof noticeObject.priority === 'number', `cBPs addNotice: 'priority' parameter should be a number not a '${typeof noticeObject.priority}'`);
        parameterAssert(noticeObject.message !== undefined, "cBPs addNotice: 'message' parameter should be defined");
        parameterAssert(typeof noticeObject.message === 'string', `cBPs addNotice: 'message' parameter should be a string not a '${typeof noticeObject.message}'`);
        // parameterAssert(bookID !== undefined, "cBPs addNotice: 'bookID' parameter should be defined");
        if (noticeObject.bookID) {
            parameterAssert(typeof noticeObject.bookID === 'string', `cBPs addNotice: 'bookID' parameter should be a string not a '${typeof noticeObject.bookID}'`);
            parameterAssert(noticeObject.bookID.length === 3, `cBPs addNotice: 'bookID' parameter should be three characters long not ${noticeObject.bookID.length}`);
            parameterAssert(books.isValidBookID(noticeObject.bookID), `cBPs addNotice: '${noticeObject.bookID}' is not a valid USFM book identifier`);
        }
        // parameterAssert(C !== undefined, "cBPs addNotice: 'C' parameter should be defined");
        if (noticeObject.C) parameterAssert(typeof noticeObject.C === 'string', `cBPs addNotice: 'C' parameter should be a string not a '${typeof noticeObject.C}'`);
        // parameterAssert(V !== undefined, "cBPs addNotice: 'V' parameter should be defined");
        if (noticeObject.V) parameterAssert(typeof noticeObject.V === 'string', `cBPs addNotice: 'V' parameter should be a string not a '${typeof noticeObject.V}'`);
        // parameterAssert(characterIndex !== undefined, "cBPs addNotice: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) parameterAssert(typeof noticeObject.characterIndex === 'number', `cBPs addNotice: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}'`);
        // parameterAssert(extract !== undefined, "cBPs addNotice: 'extract' parameter should be defined");
        if (noticeObject.extract) parameterAssert(typeof noticeObject.extract === 'string', `cBPs addNotice: 'extract' parameter should be a string not a '${typeof noticeObject.extract}'`);
        parameterAssert(noticeObject.location !== undefined, "cBPs addNotice: 'location' parameter should be defined");
        parameterAssert(typeof noticeObject.location === 'string', `cBPs addNotice: 'location' parameter should be a string not a '${typeof noticeObject.location}'`);
        parameterAssert(noticeObject.extra !== undefined, "cBPs addNotice: 'extra' parameter should be defined");
        parameterAssert(typeof noticeObject.extra === 'string', `cBPs addNotice: 'extra' parameter should be a string not a '${typeof extra}'`);
        checkBookPackagesResult.noticeList.push(noticeObject);
    }


    // Main code for checkBookPackages()
    let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0, checkedRepoNames = new Set();
    let checkedBibleBPManifestFlag = false;
    for (const bookID of bookIDList) {
        // functionLog(`checkBookPackages bookID: ${bookID}`);
        if (abortFlag) break;

        // const generalLocation = ` ${languageCode} ${bookID} book packages from ${username}`;
        if (bookID !== 'OBS') {
            // eslint-disable-next-line no-unused-vars
            let bookNumberAndName;
            try {
                bookNumberAndName = books.usfmNumberName(bookID);
                // whichTestament = books.testament(bookID); // returns 'old' or 'new'
            } catch (CBPsError) {
                addNotice({ priority: 900, message: "Bad parameter: should be given a valid book abbreviation", extract: bookIDList, location: ` (not '${bookIDList}')` });
                return checkBookPackagesResult;
            }
            // debugLog(`bookNumberAndName='${bookNumberAndName}' (${whichTestament} testament)`);
        }

        // We only want to check the manifest files for ONE Bible BP AND for OBS
        let checkManifestFlag = false, checkReadmeFlag =false,    checkLicenseFlag = false;
;
        if (bookID === 'OBS') { checkManifestFlag = true; checkReadmeFlag =true; checkLicenseFlag = true; }
        else // it’s a Bible book
            if (!checkedBibleBPManifestFlag) {
                checkManifestFlag = true; checkReadmeFlag =true; checkLicenseFlag=true;
                checkedBibleBPManifestFlag = true; // so we only do it once for Bible books
            }
        checkingOptions.checkManifestFlag = checkManifestFlag;
        checkingOptions.checkReadmeFlag = checkReadmeFlag;
        checkingOptions.checkLicenseFlag = checkLicenseFlag;

        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        const cbpResultObject = await checkBookPackage(username, languageCode, bookID, setResultValue, checkingOptions);
        // functionLog(`checkBookPackage() returned ${cbpResultObject.successList.length} success message(s) and ${cbpResultObject.noticeList.length} notice(s)`);

        // Concat is faster if we don’t need to process each success message individually
        checkBookPackagesResult.successList = checkBookPackagesResult.successList.concat(cbpResultObject.successList);
        // Process noticeList line by line,  appending the repoCode/bookID as an extra field as we go
        // for (const successEntry of cbpResultObject.successList) {
        //     // debugLog("  ourCheckBookPackage:", successEntry);
        //     addSuccessMessage(successEntry);
        // }

        // Concat is faster if we don’t need to process each notice individually
        checkBookPackagesResult.noticeList = checkBookPackagesResult.noticeList.concat(cbpResultObject.noticeList);
        // for (const noticeEntry of cbpResultObject.noticeList)
        //     // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=extract, 8=location
        //     // The extra value from checkBookPackage is the repo name
        //     addNotice({noticeEntry.priority, noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7], noticeEntry[5]);

        checkedFileCount += cbpResultObject.checkedFileCount;
        checkedFilenames = [...checkedFilenames, ...cbpResultObject.checkedFilenames];
        checkedFilenameExtensions = new Set([...checkedFilenameExtensions, ...cbpResultObject.checkedFilenameExtensions]);
        totalCheckedSize += cbpResultObject.checkedFilesizes;
        checkedRepoNames = new Set([...checkedRepoNames, ...cbpResultObject.checkedRepoNames]);

        // addSuccessMessage(`${checkedFileCount.toLocaleString()}/ Checked ${bookID} book package`);
    }

    // Add some extra fields to our checkFileResult object
    //  in case we need this information again later
    checkBookPackagesResult.checkedFileCount = checkedFileCount;
    checkBookPackagesResult.checkedFilenames = checkedFilenames;
    checkBookPackagesResult.checkedFilenameExtensions = [...checkedFilenameExtensions]; // convert Set to Array
    checkBookPackagesResult.checkedFilesizes = totalCheckedSize;
    checkedRepoNames = [...checkedRepoNames]; // Convert set to Array
    const index = checkedRepoNames.indexOf(`${username}/${languageCode}_obs`);
    if (index !== -1) checkedRepoNames[index] = 'OBS'; // Looks tidier here
    checkBookPackagesResult.checkedRepoNames = checkedRepoNames;
    // checkBookPackagesResult.checkedOptions = checkingOptions; // This is done at the caller level

    // debugLog("checkBookPackages() is returning", checkBookPackagesResult.successList.length.toLocaleString(), "success message(s) and", checkBookPackagesResult.noticeList.length.toLocaleString(), "notice(s)");
    checkBookPackagesResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
    return checkBookPackagesResult;
};
// end of checkBookPackages()
