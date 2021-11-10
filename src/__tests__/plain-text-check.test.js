/* eslint-env jest */

import { checkPlainText } from '../core/plain-text-check';
import Path from "path";
import fs from 'fs-extra';

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
    // console.log(`plain-text-check.test getFile(${username}, ${repository}, ${path})`)
    const filePath = Path.join('./src/__tests__/fixtures', username, repository, path);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
    // eslint-disable-next-line no-throw-literal
    throw `plain-text-check.test getFile(): Could not find ${filePath}`;
  }
}

describe('checkPlainText() - ', () => {
  const username = 'unfoldingWord';
  const languageCode = 'en';
  const repoCode = 'LT';

  describe('short snippet tests - ', () => {
    it('should pass on smallest snippet', async () => {
      const plainText = `This is a short sentence that's all grammatically correct.
`;
      const rawResults = await checkPlainText(username, languageCode, repoCode, 'text', 'snippet', plainText, 'from test snippet', optionalCheckingOptions);
      console.log(`checkPlainText from plainText='${plainText}' got rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(0);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail on empty string', async () => {
      const rawResults = await checkPlainText(username, languageCode, repoCode, 'text', 'snippet', "", 'from test snippet', optionalCheckingOptions);
      console.log(`checkPlainText rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('might fail on tabbed line', async () => {
      const plainText = "2:12\tgnn5\t\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tThis is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [[rc://*/ta/man/translate/figs-parallelism]], [Doublet](../figs-doublet/01.md))\n";
      const rawResults = await checkPlainText(username, languageCode, repoCode, 'text', 'snippet', plainText, 'from test snippet', optionalCheckingOptions);
      console.log(`checkPlainText from plainText='${plainText}' got rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(0);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail on separated digits', async () => {
      const rawResults = await checkPlainText(username, languageCode, repoCode, 'text', 'snippet', "Jesus fed 5, 000 people (or was it 4, 999?).\n", 'from test snippet', optionalCheckingOptions);
      console.log(`checkPlainText rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail on long digit string', async () => {
      const rawResults = await checkPlainText(username, languageCode, repoCode, 'text', 'snippet', "Jesus fed 5000 people (or was it 456789?).\n", 'from test snippet', optionalCheckingOptions);
      console.log(`checkPlainText rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

  });

});
