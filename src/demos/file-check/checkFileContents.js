import * as books from '../../core/books/books';
import { checkUSFMText, checkMarkdownText, checkPlainText, checkYAMLText, checkManifestText, checkTN_TSVText } from '../../core';


// const CHECK_FILE_CONTENTS_VERSION_STRING = '0.2.1';


/** */
export async function checkFileContents(languageCode, filename, fileContent, givenLocation, checkingOptions) {
  // Determine the file type from the filename extension
  //  and return the results of checking that kind of file text
  // console.log(`checkFileContents(${languageCode}, ${filename}, ${fileContent.length} chars, ${givenLocation}, ${JSON.stringify(checkingOptions)})…`);
  const startTime = new Date();

  let ourCFLocation = givenLocation;
  if (ourCFLocation[0] !== ' ') ourCFLocation = ' ' + ourCFLocation;

  let checkFileResult;
  if (filename.toLowerCase().endsWith('.tsv')) {
    const filenameMain = filename.substring(0, filename.length - 4); // drop .tsv
    // console.log(`Have TSV filenameMain=${filenameMain}`);
    const bookID = filenameMain.substring(filenameMain.length - 3);
    // console.log(`Have TSV bookcode=${bookID}`);
    console.assert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResult = await checkTN_TSVText(languageCode, bookID, filename, fileContent, ourCFLocation, checkingOptions);
  }
  else if (filename.toLowerCase().endsWith('.usfm')) {
    const filenameMain = filename.substring(0, filename.length - 5); // drop .usfm
    // console.log(`Have USFM filenameMain=${filenameMain}`);
    const bookID = filenameMain.substring(filenameMain.length - 3);
    // console.log(`Have USFM bookcode=${bookID}`);
    console.assert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResult = checkUSFMText(languageCode, bookID, filename, fileContent, ourCFLocation, checkingOptions);
  } else if (filename.toLowerCase().endsWith('.sfm')) {
    const filenameMain = filename.substring(0, filename.length - 4); // drop .sfm
    console.log(`Have SFM filenameMain=${filenameMain}`);
    const bookID = filenameMain.substring(2, 5);
    console.log(`Have SFM bookcode=${bookID}`);
    console.assert(books.isValidBookID(bookID), `checkFileContents: '${bookID}' is not a valid USFM book identifier`);
    checkFileResult = checkUSFMText(languageCode, bookID, filename, fileContent, ourCFLocation, checkingOptions);
  } else if (filename.toLowerCase().endsWith('.md'))
    checkFileResult = checkMarkdownText(filename, fileContent, ourCFLocation, checkingOptions);
  else if (filename.toLowerCase().endsWith('.txt'))
    checkFileResult = checkPlainText(filename, fileContent, ourCFLocation, checkingOptions);
  else if (filename.toLowerCase() === 'manifest.yaml')
    checkFileResult = checkManifestText('', fileContent, ourCFLocation, checkingOptions);
  else if (filename.toLowerCase().endsWith('.yaml'))
    checkFileResult = checkYAMLText('', fileContent, ourCFLocation, checkingOptions);
  else {
    checkFileResult = checkPlainText(filename, fileContent, ourCFLocation, checkingOptions);
    checkFileResult.noticeList.unshift({ priority: 995, message: "File extension is not recognized, so treated as plain text.", filename, location: filename });
  }
  // console.log(`checkFileContents got initial results with ${checkFileResult.successList.length} success message(s) and ${checkFileResult.noticeList.length} notice(s)`);

  // Make sure that we have the filename in all of our notices (in case other files are being checked as well)
  function addFilenameField(notice) { return { ...notice, filename }; }
  checkFileResult.noticeList = checkFileResult.noticeList.map(addFilenameField);

  // Add some extra fields to our checkFileResult object
  //  in case we need this information again later
  checkFileResult.checkedFileCount = 1;
  checkFileResult.checkedFilename = filename;
  checkFileResult.checkedFilesize = fileContent.length;
  checkFileResult.checkedOptions = checkingOptions;

  checkFileResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
  // console.log(`checkFileContents() returning ${JSON.stringify(checkFileResult)}`);
  return checkFileResult;
};
// end of checkFileContents()
