import checkUSFMText from '../../core/usfm-text-check.js';
import checkMarkdownText from '../../core/markdown-text-check.js';
import checkPlainText from '../../core/plain-text-check.js';
// import checkManifestText from '../../core/manifest-text-check.js';
import checkTN_TSVText from '../../core/table-text-check.js';
// import { consoleLogObject } from '../../core/utilities.js';


const CHECKER_VERSION_STRING = '0.0.2';

function checkFile(filename, fileContent, givenLocation, checkingOptions) {
    // Determine the file type from the filename extension
    //  and return the results of checking that kind of file
    console.log("I'm here in checkFile v" + CHECKER_VERSION_STRING);
    console.log("  with " + filename + ", " + fileContent.length + " chars, " + givenLocation + ", " + JSON.stringify(checkingOptions));

    const ourLocation = ' in ' + filename + givenLocation;

    let checkFileResult;
    if (filename.toLowerCase().endsWith('.tsv')) {
        const filenameMain = filename.substring(0, filename.length - 4); // drop .tsv
        // console.log("Have TSV filenameMain=" + filenameMain);
        const BBB = filenameMain.substring(filenameMain.length - 3);
        console.log("Have TSV bookcode=" + BBB);
        checkFileResult = checkTN_TSVText(BBB, fileContent, ourLocation, checkingOptions);
    }
    else if (filename.toLowerCase().endsWith('.usfm')) {
        const filenameMain = filename.substring(0, filename.length - 5); // drop .usfm
        // console.log("Have USFM filenameMain=" + filenameMain);
        const BBB = filenameMain.substring(filenameMain.length - 3);
        console.log("Have USFM bookcode=" + BBB);
        checkFileResult = checkUSFMText(BBB, fileContent, ourLocation, checkingOptions);
    } else if (filename.toLowerCase().endsWith('.md'))
        checkFileResult = checkMarkdownText(filename, fileContent, ourLocation, checkingOptions);
    else if (filename.toLowerCase().endsWith('.txt'))
        checkFileResult = checkPlainText(filename, fileContent, ourLocation, checkingOptions);
    else if (filename.toLowerCase().startsWith('manifest.'))
        checkFileResult = checkManifestText(filename, fileContent, ourLocation, checkingOptions);
    else {
        checkFileResult = checkPlainText(filename, fileContent, ourLocation, checkingOptions);
        checkFileResult.noticeList.unshift([995, "File extension is not recognized, so treated as plain text.", -1, '', filename]);
    }
    console.log("checkFile got initial results with " + checkFileResult.successList.length + " success message(s) and " + checkFileResult.noticeList.length + " notice(s)");

    // Add some extra fields to our checkFileResult object
    //  in case we need this information again later
    checkFileResult.checkedFileCount = 1;
    checkFileResult.checkedFilename = filename;
    checkFileResult.checkedFilesize = fileContent.length;
    checkFileResult.checkedOptions = checkingOptions;

    return checkFileResult;
};
// end of checkFile()

export default checkFile;
