// import { useState, useEffect, useContext } from 'react';
// import { RepositoryContextProvider, RepositoryContext, FileContextProvider, FileContext } from 'gitea-react-toolkit';
import * as books from '../../core/books/books.js';
import checkFile from '../file-check/checkFile.js';
import { getBlob } from './helpers';

const CHECKER_VERSION_STRING = '0.0.2';


async function checkBookPackage(username, language_code, book_code, checkingOptions) {
    console.log("I'm here in checkBookPackage v" + CHECKER_VERSION_STRING);
    console.log("  with " + username + ", " + language_code + ", " + book_code + ", " + JSON.stringify(checkingOptions));

    // const { state: repository, component: setRepository } = useState(RepositoryContext);

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

        // Choose only ONE of the following
        // This is the fast way of append the results from this field
        //result.noticeList = result.noticeList.concat(resultObject.noticeList);
        // If we need to put everything through addNotice, e.g., for debugging
        //  process results line by line
        for (let noticeEntry of resultObject.noticeList)
            // noticeEntry is an array of five fields: 1=priority, 2=msg, 3=index, 4=extract, 5=location
            if (noticeEntry[0] != 663) // Suppress these misleading warnings coz open quote can occur in one verse and close in another
                // We add the repoCode as an extra value
                addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4], repoCode);
    }
    // end of doOurCheckFile function



    const generalLocation = " "+ language_code+" "  + book_code + " book package from " + username;
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
    //  UHB/UGNT, ULT, UST, UTN, UTW
    for (let repoCode of [(whichTestament=='old'?'UHB':'UGNT'), 'ULT', 'UST', 'UTN']) {
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
        // console.log("Need to load", filename, "from", full_name, fileLocation);
        const url = 'https://git.door43.org/' + fullRepoName + '/raw/branch/' + branch + '/' + filename;
        console.log("Try to load", repoCode, book_code, "from", url);
        // const fileContent = "\\id HBB\n\\c 3Hello\n\\v q2 everybody\n" // TEMP XXXX .................................
// WHY WHY WHY doesn't this fetch the correct file ???
        const fileContent = await getBlob(url); // Seems to get back a DCS intro page instead of the requested file!!!
        console.log("file_content", typeof fileContent, fileContent.length);
        if (typeof fileContent == 'string') {
            // We use the general location here (does not include repo name)
            //  so that we can adjust the returned strings ourselves
            doOurCheckFile(repoCode, filename, fileContent, generalLocation, checkingOptions); // Adds the notices to checkBookPackageResult
            addSuccessMessage("Checked " + repoCode.toUpperCase() + " file: " + filename);
        } else
            console.log("ERROR: file_content is not a string!! Is", typeof fileContent);
    }

    console.log("checkBookPackage() is returning", checkBookPackageResult.successList.length.toLocaleString(), "success message(s) and", checkBookPackageResult.noticeList.length.toLocaleString(), "notice(s)");
    return checkBookPackageResult;
};
// end of checkBookPackage()

export default checkBookPackage;
