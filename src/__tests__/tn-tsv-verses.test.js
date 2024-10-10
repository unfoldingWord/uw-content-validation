import { checkNotesTSV7DataRow } from "../core";
import Path from "path";
import fs from "fs";

const optionalCheckingOptions = {
  originalLanguageRepoUsername: 'unfoldingWord',
  taRepoUsername: 'unfoldingWord',
  disableAllLinkFetchingFlag: true, // until we can solve localforage error: No available storage method found
  // The following flags have no meaning if the above is set to true
  disableLinkedTAArticlesCheckFlag: true,
  disableLinkedTWArticlesCheckFlag: true,
  disableLexiconLinkFetchingFlag: true,
  disableLinkedLexiconEntriesCheckFlag: true,
  getFile: params => {
    const { username, repository, path } = params;
    // console.log(`tn-tsv7-table-row-check.test getFile(${username}, ${repository}, ${path})`)
    const filePath = Path.join('./src/__tests__/fixtures', username, repository, path);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
    // eslint-disable-next-line no-throw-literal
    throw `tn-table-row-check.test getFile(): Could not find ${filePath}`;
  }
}


const username = 'unfoldingWord';
  const languageCode = 'en';
const repoCode = 'TN2';
  
it('should find mismatched chapter verse', async () => {
    const chosenLine = "2:3\ts7qw\t\tfigs-imperative\t\t0\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
    const rawResults = await checkNotesTSV7DataRow(username, languageCode, repoCode, chosenLine, 'GEN', '22', '33', 'from test line', optionalCheckingOptions);
    console.log(`rawResults=${JSON.stringify(rawResults)}`);
    expect(rawResults.noticeList.length).toEqual(3);
    expect(rawResults).toMatchSnapshot();
});
  
it('should not report verse ranges', async () => {
    const chosenLine = "2:3-8\ts7qw\t\t\t\t0\tnote";
    const rawResults = await checkNotesTSV7DataRow(username, languageCode, repoCode, chosenLine, 'GEN', '2', '3-8', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(0);
    expect(rawResults).toMatchSnapshot();
});

it('should report unordered verse range', async () => {
    const chosenLine = "2:11-8\ts7qw\t\t\t\t0\tnote";
    const rawResults = await checkNotesTSV7DataRow(username, languageCode, repoCode, chosenLine, 'GEN', '2', '11-8', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(1);
    expect(rawResults).toMatchSnapshot();
});
