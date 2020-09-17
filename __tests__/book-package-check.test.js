/* eslint-env jest */

import { checkBookPackage } from '../src/core/book-package-check';
import Path from "path";
import fs from 'fs-extra';

let testFiles = {};

const optionalCheckingOptions = {
  getFile: params => {
    const { username, repository, path, branch } = params;
    const filePath = Path.join('./__tests__/fixtures', username, repository, path);

    if (testFiles.hasOwnProperty(filePath)) { // see if we have a test file to use
      return testFiles[filePath];
    }

    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
    throw `Could not find ${filePath}`;
  }
}

describe('checkBookPackage()', () => {

  it('tit should pass', async() => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'tit';
    const rawResults = await checkBookPackage(username, languageCode, bookID, () => {}, optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  });

  it('rut should pass', async() => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'rut';
    const rawResults = await checkBookPackage(username, languageCode, bookID, () => {}, optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(14);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  });

})
