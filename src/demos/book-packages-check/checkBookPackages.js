import * as books  from '../../core/books/books';
import { checkBookPackage } from '../book-package-check/checkBookPackage';
// import { consoleLogObject } from '../../core/utilities';

//const BPs_VALIDATOR_VERSION_STRING = '0.2.3';


export async function checkBookPackages(username, languageCode, bookIDList, setResultValue, checkingOptions) {
    //     console.log(`I'm here in checkBookPackages v${VALIDATOR_VERSION_STRING}
    //   with ${username}, ${languageCode}, ${bookIDList}, ${JSON.stringify(checkingOptions)}`);
    let abortFlag = false;
    const startTime = new Date();

    const checkBookPackagesResult = { successList: [], noticeList: [] };

    // function addSuccessMessage(successString) {
    //     // console.log(`checkBookPackages success: ${successString}`);
    //     checkBookPackagesResult.successList.push(successString);
    // }

    function addNotice10(noticeObject) {
        // bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.
        console.log(`cBPs addNotice10: (priority=${noticeObject.priority}) ${noticeObject.extra} ${noticeObject.message}${noticeObject.characterIndex > 0 ? ` (at character ${noticeObject.characterIndex})` : ""}${noticeObject.extract ? ` ${noticeObject.extract}` : ""}${noticeObject.location}`);
        console.assert(noticeObject.priority !== undefined, "cBPs addNotice10: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `cBPs addNotice10: 'priority' parameter should be a number not a '${typeof noticeObject.priority}'`);
        console.assert(noticeObject.message !== undefined, "cBPs addNotice10: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `cBPs addNotice10: 'message' parameter should be a string not a '${typeof noticeObject.message}'`);
        // console.assert(bookID !== undefined, "cBPs addNotice10: 'bookID' parameter should be defined");
        if (noticeObject.bookID) {
            console.assert(typeof noticeObject.bookID === 'string', `cBPs addNotice10: 'bookID' parameter should be a string not a '${typeof noticeObject.bookID}'`);
            console.assert(noticeObject.bookID.length === 3, `cBPs addNotice10: 'bookID' parameter should be three characters long not ${noticeObject.bookID.length}`);
            console.assert(books.isValidBookID(noticeObject.bookID), `cBPs addNotice10: '${noticeObject.bookID}' is not a valid USFM book identifier`);
        }
        // console.assert(C !== undefined, "cBPs addNotice10: 'C' parameter should be defined");
        if (noticeObject.C) console.assert(typeof noticeObject.C === 'string', `cBPs addNotice10: 'C' parameter should be a string not a '${typeof noticeObject.C}'`);
        // console.assert(V !== undefined, "cBPs addNotice10: 'V' parameter should be defined");
        if (noticeObject.V) console.assert(typeof noticeObject.V === 'string', `cBPs addNotice10: 'V' parameter should be a string not a '${typeof noticeObject.V}'`);
        // console.assert(characterIndex !== undefined, "cBPs addNotice10: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `cBPs addNotice10: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}'`);
        // console.assert(extract !== undefined, "cBPs addNotice10: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `cBPs addNotice10: 'extract' parameter should be a string not a '${typeof noticeObject.extract}'`);
        console.assert(noticeObject.location !== undefined, "cBPs addNotice10: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `cBPs addNotice10: 'location' parameter should be a string not a '${typeof noticeObject.location}'`);
        console.assert(noticeObject.extra !== undefined, "cBPs addNotice10: 'extra' parameter should be defined");
        console.assert(typeof noticeObject.extra === 'string', `cBPs addNotice10: 'extra' parameter should be a string not a '${typeof extra}'`);
        checkBookPackagesResult.noticeList.push(noticeObject);
    }


    // Main code for checkBookPackages()
    let checkedFileCount = 0, checkedFilenames = [], checkedFilenameExtensions = new Set(), totalCheckedSize = 0, checkedRepoNames = new Set();
    let checkedBibleBPManifestFlag = false;
    for (const bookID of bookIDList) {
        // console.log(`checkBookPackages bookID: ${bookID}`);
        if (abortFlag) break;

        // const generalLocation = ` ${languageCode} ${bookID} book packages from ${username}`;
        if (bookID !== 'OBS') {
          // eslint-disable-next-line no-unused-vars
            let bookNumberAndName; //, whichTestament;
            try {
                bookNumberAndName = books.usfmNumberName(bookID);
                // whichTestament = books.testament(bookID); // returns 'old' or 'new'
            } catch (CBPsError) {
                addNotice10({priority:900, message:"Bad parameter: should be given a valid book abbreviation",
                                extract:bookIDList, location:` (not '${bookIDList}')`});
                return checkBookPackagesResult;
            }
            // console.log(`bookNumberAndName='${bookNumberAndName}' (${whichTestament} testament)`);
        }

        // We only want to check the manifest files for ONE Bible BP AND for OBS
        let checkManifestFlag = false;
        if (bookID === 'OBS') checkManifestFlag = true;
        else // it's a Bible book
            if (!checkedBibleBPManifestFlag) {
                checkManifestFlag = true;
                checkedBibleBPManifestFlag = true; // so we only do it once for Bible books
            }
        checkingOptions.checkManifestFlag = checkManifestFlag;

        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        const cbpResultObject = await checkBookPackage(username, languageCode, bookID, setResultValue, checkingOptions);
        // console.log(`checkBookPackage() returned ${cbpResultObject.successList.length} success message(s) and ${cbpResultObject.noticeList.length} notice(s)`);

        // Concat is faster if we don't need to process each success message individually
        checkBookPackagesResult.successList = checkBookPackagesResult.successList.concat(cbpResultObject.successList);
        // Process noticeList line by line,  appending the repoCode/bookID as an extra field as we go
        // for (const successEntry of cbpResultObject.successList) {
        //     // console.log("  ourCheckBookPackage:", successEntry);
        //     addSuccessMessage(successEntry);
        // }

        // Concat is faster if we don't need to process each notice individually
        checkBookPackagesResult.noticeList = checkBookPackagesResult.noticeList.concat(cbpResultObject.noticeList);
        // for (const noticeEntry of cbpResultObject.noticeList)
        //     // noticeEntry is an array of eight fields: 1=priority, 2=bookID, 3=C, 4=V, 5=msg, 6=characterIndex, 7=extract, 8=location
        //     // The extra value from checkBookPackage is the repo name
        //     addNotice10({noticeEntry.priority, noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], noticeEntry[5], noticeEntry[6], noticeEntry[7], noticeEntry[5]);

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

    // console.log("checkBookPackages() is returning", checkBookPackagesResult.successList.length.toLocaleString(), "success message(s) and", checkBookPackagesResult.noticeList.length.toLocaleString(), "notice(s)");
    checkBookPackagesResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
    return checkBookPackagesResult;
};
// end of checkBookPackages()
