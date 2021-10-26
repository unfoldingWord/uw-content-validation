/* eslint-env jest */

import { checkTN_TSV7Table, checkSN_TSV7Table, checkTQ_TSV7Table, checkSQ_TSV7Table, checkTWL_TSV6Table, checkTA_markdownArticle, checkTW_markdownArticle, checkDeprecatedTN_TSV9Table } from '../core/wrapper';
import Path from 'path';
import fs from 'fs-extra';

let testFiles = {};

const optionalCheckingOptions = {
  disableAllLinkFetchingFlag: true, // until we can solve localforage error: No available storage method found
  // disableLinkedTAArticlesCheckFlag: true,
  // disableLinkedTWArticlesCheckFlag: true,
  // disableLexiconLinkFetchingFlag: true,
  // disableLinkedLexiconEntriesCheckFlag: true,
  // dataSet: 'OLD', // We still have markdown TQ1 in our test files
  getFile: params => {
    const { username, repository, path } = params;
    // console.log(`book-package-check.test getFile(${username}, ${repository}, ${path})`)
    const filePath = Path.join('./src/__tests__/fixtures', username, repository, path);

    if (testFiles.hasOwnProperty(filePath)) { // see if we have a test file to use
      if (testFiles[filePath] !== null) {  // if file content not null, then return contents.  Otherwise will throw exception
        return testFiles[filePath];
      }
      // eslint-disable-next-line no-throw-literal
      throw `Simulated error - Could not find ${filePath}`;
    } else if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
    // eslint-disable-next-line no-throw-literal
    throw `Tests could not find ${filePath}`;
  },
  getFileListFromZip: params => {
    const { username, repository, optionalPrefix } = params;
    // console.log(`book-package-check.test getFileListFromZip(${username}, ${repository}, ${optionalPrefix})`)
    const filePath = Path.join('./src/__tests__/fixtures', username, repository);
    let files = getAllFiles(filePath);
    if (optionalPrefix) {
      files = files.filter(file => file.toLowerCase().startsWith(optionalPrefix)); // filter just for current book
    }
    return files;
  }
}

describe('checkTN_TSV7Table() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('TIT should fail on unsupported language', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'zzz';
    const bookID = 'TIT';
    const tableText = `Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote
1:3\tb22h\t\t\tκαιροῖς ἰδίοις\t1\t“at the proper time”
1:3\txy18\t\trc://*/ta/man/translate/figs-exclusive\tἡμῶν\t1\tThis includes Paul, Titus, and all Christians. (See: [[rc://*/ta/man/translate/figs-exclusive]])
`;
    const rawResults = await checkTN_TSV7Table(username, languageCode, bookID, tableText, optionalCheckingOptions);
    console.log(`TIT unsupported language BP test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 1000); // Allow 1 second

  /*
  it('TIT should fail on missing repo', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'TIT';
    testFiles = { // override these files
      'src/__tests__/fixtures/unfoldingWord/en_ult/57-TIT.usfm': null,
    };

    const rawResults = await checkTN_TSV7Table(username, languageCode, bookID, tableText, optionalCheckingOptions);
    console.log(`TIT missing repo BP test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 12000); // Allow 12 seconds

  it('TIT should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'TIT';
    const rawResults = await checkTN_TSV7Table(username, languageCode, bookID, tableText, optionalCheckingOptions);
    console.log(`TIT BP test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThanOrEqual(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 15000); // Allow 15 seconds

  it('RUT should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'RUT';
    const rawResults = await checkTN_TSV7Table(username, languageCode, bookID, tableText, optionalCheckingOptions);
    console.log(`RUT BP test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThanOrEqual(4);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 25000); // Allow 25 seconds
*/

})

//
// Helper functions
//

/**
 * recursively get a file list
 * @param {string} dirPath
 * @param {string} subPath
 * @param {Array} arrayOfFiles
 * @return {Array}
 */
const getAllFiles = function (dirPath, subPath, arrayOfFiles) {
  // console.log(`getAllFiles(${dirPath}, ${subPath}, ${arrayOfFiles}`);
  arrayOfFiles = arrayOfFiles || [];
  subPath = subPath || '.';
  const fullPath = Path.join(dirPath, subPath);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);

    files.forEach(function (file) {
      const fullSubPath_ = Path.join(fullPath, file);
      if (fs.statSync(fullSubPath_).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath, Path.join(subPath, file), arrayOfFiles);
      } else {
        arrayOfFiles.push(Path.join(subPath, file));
      }
    })
  }
  return arrayOfFiles
}
