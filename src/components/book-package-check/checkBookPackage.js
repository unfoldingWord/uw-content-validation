import * as books from '../../core/books/books.js';
import checkFile from '../file-check/checkFile.js';
import { getBlob } from './helpers';
const CHECKER_VERSION_STRING = '0.0.1';


async function checkBookPackage(username, language_code, book_code, checkingOptions) {
    console.log("I'm here in checkBookPackage v" + CHECKER_VERSION_STRING);
    console.log("  with " + username + ", " + language_code + ", " + book_code + ", " + JSON.stringify(checkingOptions));

    let checkBookPackageResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        console.log("Success: " + successString);
        checkBookPackageResult.successList.push(successString);
    }
    function addNotice(priority, message, index, extract, location) {
        console.log("checkBookPackage Notice: (priority=" + priority + ") " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
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
        checkBookPackageResult.noticeList.push([priority, message, index, extract, location]);
    }

    function doOurCheckFile(filename, file_content, fileLocation, optionalOptions) {
      // We assume that checking for compulsory fields is done elsewhere
      console.log("checkBookPackage doOurCheckFile("+filename+")");

      // Updates the global list of notices
      console.assert(typeof filename==='string', "doOurCheckFile: 'filename' parameter should be a string not a '"+(typeof filename)+"'");
      console.assert(filename!==undefined, "doOurCheckFile: 'filename' parameter should be defined");
      console.assert(typeof file_content==='string', "doOurCheckFile: 'file_content' parameter should be a string not a '"+(typeof file_content)+"'");
      console.assert(file_content!==undefined, "doOurCheckFile: 'file_content' parameter should be defined");
      console.assert(typeof fileLocation==='string', "doOurCheckFile: 'fileLocation' parameter should be a string not a '"+(typeof fileLocation)+"'");
      console.assert(fileLocation!==undefined, "doOurCheckFile: 'fileLocation' parameter should be defined");

      const resultObject = checkFile('', file_content, fileLocation, optionalOptions);

      // Choose only ONE of the following
      // This is the fast way of append the results from this field
      //result.noticeList = result.noticeList.concat(resultObject.noticeList);
      // If we need to put everything through addNotice, e.g., for debugging
      //  process results line by line
      for (let noticeEntry of resultObject.noticeList)
          if (noticeEntry[0] != 663) // Suppress these misleading warnings coz open quote can occur in one verse and close in another
              addNotice(noticeEntry[0], noticeEntry[1], noticeEntry[2], noticeEntry[3], noticeEntry[4]);
  }
  // end of doOurCheckFile function



    const fileLocation = "in " + book_code + " from " + username + " " + language_code + " book package";
    let book_number_name;
    try {
        book_number_name = books.usfmNumberName(book_code);
    } catch (e) {
        addNotice(900, "Bad function call: should be given a valid book abbreviation", -1, book_code, " (not '" + book_code + "')" + location);
        return checkBookPackageResult;
    }
    console.log("book_number_name='" + book_number_name + "'");


    // So now we want to work through checking this one specified Bible book in various repos:
    //  UHB/UGNT, ULT, UST, UTN, UTW

    // Let's just start with trying to get ULT working
    const repo_code = 'ult'
    // console.log("Let's try", repo_code.toUpperCase(), "(", language_code, book_code, "from", username, ")");
    const repo_name = language_code + '_' + repo_code;
    const full_name = username + '/' + repo_name;
    // console.log("Let's try1", book_code, "from", full_name);
    let filename;
    if (repo_code == 'ult' || repo_code == 'ust')
        filename = book_number_name + '.usfm';
    // console.log("Let's try", filename, "from", full_name, fileLocation);

    const branch = 'master'
    // console.log("Need to load", filename, "from", full_name, fileLocation);
    const url = 'https://git.door43.org/'+full_name+'/raw/branch/'+branch+'/'+filename;
    console.log("Try to load", repo_code.toUpperCase(), book_code, "from", url);
    const file_content = await getBlob(url);

    if (typeof file_content == 'string') {
      const checkFileResult = doOurCheckFile(filename, file_content, fileLocation, checkingOptions);
      addSuccessMessage("Checked "+repo_code.toUpperCase()+" file: "+filename);
    }

    return checkBookPackageResult;
};
// end of checkBookPackage()

export default checkBookPackage;
