import checkUSFMText from '../../core/usfm-text-check.js';
import checkMarkdownText from '../../core/markdown-text-check.js';
import checkPlainText from '../../core/plain-text-check.js';
// import checkManifestText from '../../core/manifest-text-check.js';
import checkTN_TSVText from '../../core/table-text-check.js';
// import { display_object } from '../../core/utilities.js';


const CHECKER_VERSION_STRING = '0.0.1';

function checkFile(filename, fileContent, givenLocation, checkingOptions) {
    console.log("I'm here in checkFile v" + CHECKER_VERSION_STRING);
    console.log("  with "+filename+", "+fileContent.length+", " + givenLocation+", "+JSON.stringify(checkingOptions));

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
    else if (filename.toLowerCase().startsWith('manifest.'))
        checkFileResult = checkManifestText(filename, fileContent, ourLocation, checkingOptions);
    else {
        // msg_html += "<p style=\"color:#538b01\">'<span style=\"font-style:italic\">" + filename + "</span>' is not recognized, so ignored.</p>";
        msgLines += "Warning: '" + filename + "' is not recognized, so treated as plain text.\n";
        checkFileResult = checkPlainText(filename, fileContent, ourLocation, checkingOptions);
    }
    console.log("checkFile got initial results with " + checkFileResult.successList.length + " success message(s) and " + checkFileResult.noticeList.length + " notice(s)");

    // Add some extra fields to our checkFileResult object in case we need this information again later
    checkFileResult.checkedFileCount = 1;
    checkFileResult.checkedName = filename;
    checkFileResult.checkedSize = fileContent.length;
    checkFileResult.checkingOptions = checkingOptions;

    return checkFileResult;
};
// end of checkFile()

export default checkFile;
