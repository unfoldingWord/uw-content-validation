/* eslint-env jest */

import { checkUSFMText } from '../core/usfm-text-check';
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
    // console.log(`usfm-text-check.test getFile(${username}, ${repository}, ${path})`)
    const filePath = Path.join('./src/__tests__/fixtures', username, repository, path);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
    // eslint-disable-next-line no-throw-literal
    throw `usfm-text-check.test getFile(): Could not find ${filePath}`;
  }
}

describe('checkUSFMText() - ', () => {
  const username = 'unfoldingWord';
  const languageCode = 'en';
  const repoCode = 'LT';

  describe('short snippet tests - ', () => {
    it('should pass on smallest snippet', async () => {
      const usfmText = `\\id 2JN
\\usfm 3.0
\\ide UTF-8
\\mt1 2 John
\\c 1
\\p \\v 1 a b c\\v 2 b c d\\v 3 c d e\\v 4 d e f\\v 5 e f g\\v 6 f g h\\v 7 g h i\\v 8 h i j\\v 9 i j k\\v 10 j k l\\v 11 k l m\\v 12 l m n\\v 13 n o p
`; // There's a minimum number of words/characters expected in each verse
      const rawResults = await checkUSFMText(username, languageCode, repoCode, '2JN', 'test.usfm', usfmText, 'from test snippet', optionalCheckingOptions);
      // console.log(`checkUSFMText from usfmText='${usfmText}' got rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(0);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail on empty string', async () => {
      const rawResults = await checkUSFMText(username, languageCode, repoCode, 'RUT', 'test.usfm', "", 'from test snippet', optionalCheckingOptions);
      // console.log(`checkUSFMText rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(6);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail on non-USFM', async () => {
      const usfmText = "2:12\tgnn5\t\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tThis is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [[rc://*/ta/man/translate/figs-parallelism]], [Doublet](../figs-doublet/01.md))\n";
      const rawResults = await checkUSFMText(username, languageCode, repoCode, 'RUT', 'test.usfm', usfmText, 'from test snippet', optionalCheckingOptions);
      // console.log(`checkUSFMText from usfmText='${usfmText}' got rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(12);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail on no ID line', async () => {
      const rawResults = await checkUSFMText(username, languageCode, repoCode, 'RUT', 'test.usfm', "\\ide UTF-8\n", 'from test snippet', optionalCheckingOptions);
      // console.log(`checkUSFMText rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(6);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail on wrong book code', async () => {
      const rawResults = await checkUSFMText(username, languageCode, repoCode, 'RUT', 'test.usfm', "\\id GEN\n", 'from test snippet', optionalCheckingOptions);
      // console.log(`checkUSFMText rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(6);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail on gap between "5, 000"', async () => {
      const usfmText = `\\id 2JN
\\usfm 3.0
\\ide UTF-8
\\mt1 2 John
\\c 1
\\p \\v 1 a b c\\v 2 b c d\\v 3 c d e\\v 4 d e f\\v 5 e f g\\v 6 f g h\\v 7 g h i\\v 8 h i j\\v 9 i j k\\v 10 j k l\\v 11 k l m\\v 12 l m n
\\v 13 (\\zaln-s |x-strong="G10630" x-lemma="γάρ" x-morph="Gr,CC,,,,,,,," x-occurrence="1" x-occurrences="1" x-content="γὰρ"\\*\\w For|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G15100" x-lemma="εἰμί" x-morph="Gr,V,IIA3,,P," x-occurrence="1" x-occurrences="1" x-content="ἦσαν"\\*\\w there|x-occurrence="1" x-occurrences="1"\\w*
\\w were|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G56160" x-lemma="ὡσεί" x-morph="Gr,D,,,,,,,,," x-occurrence="1" x-occurrences="2" x-content="ὡσεὶ"\\*\\w about|x-occurrence="1" x-occurrences="2"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G40000" x-lemma="πεντακισχίλιοι" x-morph="Gr,EN,,,,NMP," x-occurrence="1" x-occurrences="1" x-content="πεντακισχίλιοι"\\*\\w 5|x-occurrence="1" x-occurrences="1"\\w*,
\\w 000|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G04350" x-lemma="ἀνήρ" x-morph="Gr,N,,,,,NMP," x-occurrence="1" x-occurrences="1" x-content="ἄνδρες"\\*\\w men|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.)
`; // There's a minimum number of words/characters expected in each verse
      const rawResults = await checkUSFMText(username, languageCode, repoCode, '2JN', 'test.usfm', usfmText, 'from test snippet', optionalCheckingOptions);
      // console.log(`checkUSFMText from usfmText='${usfmText}' got rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should not fail on gap between "5, 000"', async () => {
      const usfmText = `\\id 2JN
\\usfm 3.0
\\ide UTF-8
\\mt1 2 John
\\c 1
\\p \\v 1 a b c\\v 2 b c d\\v 3 c d e\\v 4 d e f\\v 5 e f g\\v 6 f g h\\v 7 g h i\\v 8 h i j\\v 9 i j k\\v 10 j k l\\v 11 k l m\\v 12 l m n
\\v 13 (\\zaln-s |x-strong="G10630" x-lemma="γάρ" x-morph="Gr,CC,,,,,,,," x-occurrence="1" x-occurrences="1" x-content="γὰρ"\\*\\w For|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G15100" x-lemma="εἰμί" x-morph="Gr,V,IIA3,,P," x-occurrence="1" x-occurrences="1" x-content="ἦσαν"\\*\\w there|x-occurrence="1" x-occurrences="1"\\w*
\\w were|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G56160" x-lemma="ὡσεί" x-morph="Gr,D,,,,,,,,," x-occurrence="1" x-occurrences="2" x-content="ὡσεὶ"\\*\\w about|x-occurrence="1" x-occurrences="2"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G40000" x-lemma="πεντακισχίλιοι" x-morph="Gr,EN,,,,NMP," x-occurrence="1" x-occurrences="1" x-content="πεντακισχίλιοι"\\*\\w 5|x-occurrence="1" x-occurrences="1"\\w*,\\w 000|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G04350" x-lemma="ἀνήρ" x-morph="Gr,N,,,,,NMP," x-occurrence="1" x-occurrences="1" x-content="ἄνδρες"\\*\\w men|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.)
`; // There's a minimum number of words/characters expected in each verse
      const rawResults = await checkUSFMText(username, languageCode, repoCode, '2JN', 'test.usfm', usfmText, 'from test snippet', optionalCheckingOptions);
      // console.log(`checkUSFMText from usfmText='${usfmText}' got rawResults=${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(1); // TODO: Why do we get "verse number didn't increment correctly"???
      expect(rawResults).toMatchSnapshot();
    });

  });

});
