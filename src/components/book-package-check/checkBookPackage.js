import * as books from '../../core/books/books';
import checkFile from '../file-check/checkFile';
// import { displayObject } from '../../core/utilities';
import { getFile } from '../../core/getApi';

const CHECKER_VERSION_STRING = '0.0.2';


async function checkBookPackage(username, language_code, book_code, checkingOptions) {
    console.log("I'm here in checkBookPackage v" + CHECKER_VERSION_STRING);
    console.log("  with " + username + ", " + language_code + ", " + book_code + ", " + JSON.stringify(checkingOptions));

    let checkBookPackageResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        checkBookPackageResult.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location, extra) {
        // console.log("checkBookPackage Notice: (priority=" + priority + ") " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
        console.assert(typeof priority === 'number', "addNotice: 'priority' parameter should be a number not a '" + (typeof priority) + "'");
        console.assert(priority !== undefined, "addNotice: 'priority' parameter should be defined");
        console.assert(typeof message === 'string', "addNotice: 'message' parameter should be a string not a '" + (typeof message) + "'");
        console.assert(message !== undefined, "addNotice: 'message' parameter should be defined");
        console.assert(typeof index === 'number', "addNotice: 'index' parameter should be a number not a '" + (typeof index) + "'");
        console.assert(index !== undefined, "addNotice: 'index' parameter should be defined");
        console.assert(typeof extract === 'string', "addNotice: 'extract' parameter should be a string not a '" + (typeof extract) + "'");
        console.assert(extract !== undefined, "addNotice: 'extract' parameter should be defined");
        console.assert(typeof location === 'string', "addNotice: 'location' parameter should be a string not a '" + (typeof location) + "'");
        console.assert(location !== undefined, "addNotice: 'location' parameter should be defined");
        console.assert(typeof extra === 'string', "addNotice: 'extra' parameter should be a string not a '" + (typeof extra) + "'");
        console.assert(extra !== undefined, "addNotice: 'extra' parameter should be defined");
        checkBookPackageResult.noticeList.push([priority, message, index, extract, location, extra]);
    }

    function doOurCheckFile(repoCode, filename, file_content, fileLocation, optionalOptions) {
        // We assume that checking for compulsory fields is done elsewhere
        console.log("checkBookPackage doOurCheckFile(" + filename + ")");

        // Updates the global list of notices
        console.assert(typeof repoCode === 'string', "doOurCheckFile: 'repoCode' parameter should be a string not a '" + (typeof repoCode) + "'");
        console.assert(repoCode !== undefined, "doOurCheckFile: 'repoCode' parameter should be defined");
        console.assert(typeof filename === 'string', "doOurCheckFile: 'filename' parameter should be a string not a '" + (typeof filename) + "'");
        console.assert(filename !== undefined, "doOurCheckFile: 'filename' parameter should be defined");
        console.assert(typeof file_content === 'string', "doOurCheckFile: 'file_content' parameter should be a string not a '" + (typeof file_content) + "'");
        console.assert(file_content !== undefined, "doOurCheckFile: 'file_content' parameter should be defined");
        console.assert(typeof fileLocation === 'string', "doOurCheckFile: 'fileLocation' parameter should be a string not a '" + (typeof fileLocation) + "'");
        console.assert(fileLocation !== undefined, "doOurCheckFile: 'fileLocation' parameter should be defined");

        const resultObject = checkFile(filename, file_content, fileLocation, optionalOptions);
        console.log("checkFile() returned", resultObject.successList.length, "success message(s) and", resultObject.noticeList.length, "notice(s)");

        for (let successEntry of resultObject.successList)
            console.log("  ", successEntry);

        // Process results line by line,  appending the repoCode as an extra field as we go
        for (let noticeEntry of resultObject.noticeList)
            // noticeEntry is an array of five fields: 1=priority, 2=msg, 3=index, 4=extract, 5=location
            if (noticeEntry[0] != 663) // Suppress these misleading warnings coz open quote can occur in one verse and close in another
                // We add the repoCode as an extra value
                addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], repoCode);
    }
    // end of doOurCheckFile function


    // Main code for checkBookPackage()
    const generalLocation = " " + language_code + " " + book_code + " book package from " + username;
    let bookNumberAndName, whichTestament;
    try {
        bookNumberAndName = books.usfmNumberName(book_code);
        whichTestament = books.testament(book_code);
    } catch (e) {
        addNotice(900, "Bad function call: should be given a valid book abbreviation", -1, book_code, " (not '" + book_code + "')" + location);
        return checkBookPackageResult;
    }
    console.log("book_number_name='" + bookNumberAndName + "'", whichTestament);

    // No point in passing the branch through as a parameter
    //  coz if it's not 'master', it's unlikely to be common for all the repos
    const branch = 'master'

    // So now we want to work through checking this one specified Bible book in various repos:
    //  UHB/UGNT, ULT, UST, UTN, UTW, UTQ
    for (let repoCode of [(whichTestament == 'old' ? 'UHB' : 'UGNT'), 'ULT', 'UST', 'UTN', 'UTQ']) {
        if (repoCode != 'ULT') continue; // TEMP TEMP TEMP XXXXXXXXXX Only do one XXXXXXXXXXXXXXXXX...................
        console.log("Let's try", repoCode, "(", language_code, book_code, "from", username, ")");
        const repoLocation = " in " + repoCode.toUpperCase() + generalLocation;
        const repoName = language_code + '_' + repoCode.toLowerCase();
        const fullRepoName = username + '/' + repoName;
        console.log("Let's try1", book_code, "from", fullRepoName);
        let filename;
        if (repoCode == 'UHB' || repoCode == 'UGNT' || repoCode == 'ULT' || repoCode == 'UST')
            filename = bookNumberAndName + '.usfm';
        else if (repoCode == 'UTN')
            filename = language_code + '_tn_' + bookNumberAndName + '.tsv';
        else if (repoCode == 'UTQ')
            // How are we going to handle all these folders of .md files ???
            // This resource will eventually be converted to TSV tables
            filename = book_code.toLowerCase() + '/01/01.md';
        // console.log("Need to load", filename, "from", fullRepoName, generalLocation);

        console.log("Try to load", username, repoName, filename, branch);
        const fileContent = await getFile({ username, repository: repoName, path: filename, branch });
        console.log("Fetched file_content for", repoName, filename, typeof fileContent, fileContent.length);

        // We use the generalLocation here (does not include repo name)
        //  so that we can adjust the returned strings ourselves
        doOurCheckFile(repoCode, filename, fileContent, generalLocation, checkingOptions); // Adds the notices to checkBookPackageResult
        addSuccessMessage("Checked " + repoCode.toUpperCase() + " file: " + filename);
    }

    console.log("checkBookPackage() is returning", checkBookPackageResult.successList.length.toLocaleString(), "success message(s) and", checkBookPackageResult.noticeList.length.toLocaleString(), "notice(s)");
    return checkBookPackageResult;
};
// end of checkBookPackage()

export default checkBookPackage;
