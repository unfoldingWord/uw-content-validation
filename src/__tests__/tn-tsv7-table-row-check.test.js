/* eslint-env jest */

import { checkNotesTSV7DataRow } from '../core/notes-tsv7-row-check';
import Path from "path";
import fs from 'fs-extra';

const optionalCheckingOptions = {
  originalLanguageRepoUsername: 'unfoldingWord',
  taRepoUsername: 'unfoldingWord',
  disableAllLinkFetchingFlag: true, // until we can solve localforage error: No available storage method found
  // disableLinkedTAArticlesCheckFlag: true,
  // disableLinkedTWArticlesCheckFlag: true,
  // disableLinkedLexiconEntriesCheckFlag: true,
  getFile: params => {
    const { username, repository, path } = params;
    // console.log(`tn-table-row-check.test getFile(${username}, ${repository}, ${path})`)
    const filePath = Path.join('./src/__tests__/fixtures', username, repository, path);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
    // eslint-disable-next-line no-throw-literal
    throw `tn-table-row-check.test getFile(): Could not find ${filePath}`;
  }
}

describe('checkNotesTSV7DataRow() - ', () => {
  const languageCode = 'en';
  const repoCode = 'TN2';

  describe('link tests - ', () => {
    it('should fail invalid doublet link', async () => {
      const chosenLine = "2:12\tgnn5\t\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tThis is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [[rc://*/ta/man/translate/figs-parallelism]], [Doublet](../figs-doublet/01.md))";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'RUT', '2', '12', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail broken link start', async () => {
      const chosenLine = "2:12\tgnn5\t\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tThis is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [rc://*/ta/man/translate/figs-parallelism]]";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'RUT', '2', '12', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail broken link end', async () => {
      const chosenLine = "2:12\tgnn5\t\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tThis is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [[rc://*/ta/man/translate/figs-parallelism]";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'RUT', '2', '12', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail double broken link start', async () => {
      const chosenLine = "2:12\tgnn5\t\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tThis is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: rc://*/ta/man/translate/figs-parallelism]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'RUT', '2', '12', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail double broken link end', async () => {
      const chosenLine = "2:12\tgnn5\t\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tThis is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [[rc://*/ta/man/translate/figs-parallelism)";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'RUT', '2', '12', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail if SupportReference link differs from link in OccurrenceNote', async () => {
      const chosenLine = "1:6\turb3\t\tfigs-imperative\t\t0\tThese are commands. By commanding that the expanse should exist and that it divide the waters, God made it exist and divide the waters. (See: [[rc://*/ta/man/figs-parallelism]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '6', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail invalid link path', async () => {
      const chosenLine = "1:7\turb3\t\tfigs-imperative\t\t0\tThese are commands. By commanding that the expanse should exist and that it divide the waters, God made it exist and divide the waters. (See: [[rc://*/ta/woman/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '7', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should succeed with mixed link types', async () => {
      const chosenLine = "1:8\tss9r\t\tfigs-merism\t\t0\tevening and morning\tThis refers to the whole day. The writer speaks of the whole day as if it were these two parts. In the Jewish culture, a day begins when the sun sets. See how you translated this in [Genesis 1:5](../01/05.md). (See: [[rc://*/ta/man/translate/figs-merism]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '8', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
    });

    it('should succeed with dual links', async () => {
      const chosenLine = "1:9\tzu6f\t\tfigs-activepassive\t\t0\tThis can be translated with an active verb. This is a command. By commanding that the waters gather together, God made them gather together. Alternate translation: “Let the waters…gather” or “Let the waters…come together” (See: [[rc://*/ta/man/translate/figs-activepassive]] and [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '9', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
    });

    it('should fail invalid first link', async () => {
      const chosenLine = "1:9\tzu6f\t\tfigs-activepassive\t\t0\tThis can be translated with an active verb. This is a command. By commanding that the waters gather together, God made them gather together. Alternate translation: “Let the waters…gather” or “Let the waters…come together” (See: [[rc://*/ta/man/translate/figs-activepassivez]] and [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '9', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail invalid second link', async () => {
      const chosenLine = "1:9\tzu6f\t\tfigs-activepassive\t\t0\tThis can be translated with an active verb. This is a command. By commanding that the waters gather together, God made them gather together. Alternate translation: “Let the waters…gather” or “Let the waters…come together” (See: [[rc://*/ta/man/translate/figs-activepassive]] and [[rc://*/ta/man/translate/figs-imperativez]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '9', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should pass valid verse link', async () => {
      const chosenLine = "1:19\tha33\t\t\t\t0\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in [Genesis 1:7](../01/07.md).";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '19', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(0);
    });

    it('should fail invalid verse link', async () => {
      const chosenLine = "1:9\tha33\t\t\t\t0\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in [Genesis 1:7](../01/zzz.md).";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '9', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail invalid verse link start', async () => {
      const chosenLine = "1:9\tha33\t\t\t\t0\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in Genesis 1:7](../01/07.md).";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '9', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail invalid verse link end', async () => {
      const chosenLine = "1:9\tha33\t\t\t\t0\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in [Genesis 1:7](../01/07.md.";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '9', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

  });

  describe('Original Quote tests - ', () => {
    it('invalid Original Language', async () => {
      const chosenLine = "1:1\tf2mg\t\t\t0\t\tIn the beginning, God created the heavens and the earth “This is about how God made the heavens and the earth in the beginning.” This statement summarizes the rest of the chapter. Some languages translate it as “A very long time ago God created the heavens and the earth.” Translate it in a way that shows this actually happened and is not just a folk story.";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '1', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should find missing Original Quote', async () => {
      const chosenLine = "1:3\ta7qw\t\tfigs-imperative\t\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '3', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail to find OrigLang Quote', async () => {
      const chosenLine = "1:2\tb7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail to find 2nd instance/occurrence', async () => {
      const chosenLine = "1:2\tc7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t2\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
    });

    it('should fail with leading space', async () => {
      const chosenLine = "1:2\te7qw\t\tfigs-imperative\t וְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with trailing space', async () => {
      const chosenLine = "1:2\tf7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ \t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with leading word joiner', async () => {
      const chosenLine = "1:2\tg7qw\t\tfigs-imperative\t\u2060וְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with trailing word joiner', async () => {
      const chosenLine = "1:2\th7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\u2060\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with leading zero width non-joiner', async () => {
      const chosenLine = "1:2\ti7qw\t\tfigs-imperative\t\u200cוְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with trailing zero width non-joiner', async () => {
      const chosenLine = "1:2\tj7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\u200c\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with leading zero width joiner', async () => {
      const chosenLine = "1:2\tk7qw\t\tfigs-imperative\t\u200dוְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with trailing zero width joiner', async () => {
      const chosenLine = "1:2\tl7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\u200d\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it.skip('should fail with valid but high occurrence number', async () => {
      const chosenLine = "2:2\tv248\t\t\tπροσκυνῆσαι\t2\tPossible meanings are (1) they intended to worship the baby as divine, or (2) they wanted to honor him as a human king. If your language has a word that includes both meanings, you should consider using it here.";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'MAT', '2', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should pass with correct quote', async () => {
      const chosenLine = "2:2\tv248\t\t\tπροσκυνῆσαι\t1\tPossible meanings are (1) they intended to worship the baby as divine, or (2) they wanted to honor him as a human king. If your language has a word that includes both meanings, you should consider using it here.";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'MAT', '2', '2', 'from test line', optionalCheckingOptions);
      // console.log(`Got raw results: ${JSON.stringify(rawResults)}`);
      expect(rawResults.noticeList.length).toEqual(0);
    });

  });

  describe('Occurrence Note tests - ', () => {

    it('should find white space', async () => {
      const chosenLine = "1:2\tm7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\t ";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.some((entry) => entry.message.indexOf('whitespace') !== -1));
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should find empty note', async () => {
      const chosenLine = "1:2\tn7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\t";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

  });

  describe('BookID tests - ', () => {

    it.skip('should find invalid book ID', async () => {
      const chosenLine = "1:2\tp7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      let error = false;
      try {
        await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GIN', '1', '2', 'from test line', optionalCheckingOptions);
        error = false;
      } catch (e) {
        error = true;
      }
      expect(error).toBeTruthy();
    });

  });

  describe('TSV format tests - ', () => {
    it('empty line should fail', async () => {
      const chosenLine = ""; //lineG;
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('header should succeed', async () => {
      const chosenLine = "Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(0);
    });

    it('header should fail', async () => {
      const chosenLine = "Reference\tID\tTagg\tSupportReference\tBadQuote\tOccurrence\tNote";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(8);
    });

    it('should find wrong row count', async () => {
      const chosenLine = "2:3\tw3r5\t\t1\t\t<br>Boo"; // only 6 fields
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail not TSV', async () => {
      const chosenLine = "Peace on Earth, good will to all men/people!";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

  });

  describe('SupportReference tests - ', () => {
    it('should find short SupportReference', async () => {
      const chosenLine = "1:2\tq7q\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      rawResults.suggestion = undefined; // We need to get rid of random characters in suggestion
      expect(rawResults).toMatchSnapshot();
    });

    it('should find long SupportReference', async () => {
      const chosenLine = "1:2\tr7q33\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should find missing SupportReference', async () => {
      const chosenLine = "1:2\t\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

  });

  it('should find invalid SupportReference and missing quotes', async () => {
    const chosenLine = "2:3\tw3r5\t\tLaugh\t\t1\tNote5";
    const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '2', '3', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(3);
    expect(rawResults).toMatchSnapshot();
  });

  it('should handle front matter', async () => {
    const chosenLine = "1:intro\tzb6f\t\t\t\t0\t# Genesis 01 General Notes<br><br>## Structure and formatting<br><br>This chapter presents the first account of God creating the world. There is a pattern to this account: “God said…God saw that it was good…This was evening and morning, the first day.” Translators should preserve this pattern in their versions.<br><br>## Special concepts in this chapter<br><br>### The universe<br><br>This account of creation is told within the framework of ancient Hebrew ideas about the universe: the earth was resting with water around it and below it. Over the earth was something like a vast dome, called “an expanse between the waters” (1:6), on top of which was more water. Translators should try to keep these original images in their work, even though readers in their project language might have a completely different idea of what the universe is like.<br><br>### Evening and morning<br><br>Genesis 1 presents the ancient Hebrew idea of a day: it begins with sunset, lasts through the night and continues through the daylight hours until the next sunset. This pattern should be preserved in translation, even if readers in the project language define “day” differently.<br><br>## Other possible translation difficulties in this chapter<br><br>### “In the beginning”<br><br>Some languages and cultures speak of the world as if it has always existed, as if it had no beginning. But “very long ago” is different from “in the beginning,” and you need to be sure that your translation communicates correctly.<br><br>### “God said, ‘Let there be’”<br><br>This expression occurs often in this chapter. It can be difficult to translate, because God is not shown as talking to a particular person. If God is talking to a thing, it is something not yet in existence. Translators should find the most natural way in the project language to signal the idea that God spoke things into existence; he created the world and the things in it by simply commanding that they should exist.";
    const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', 'intro', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(3);
  });

  it('should find invalid Book ID, chapter number, ID, SupportReference, quotes, OccurrenceNote', async () => {
    const chosenLine = "200:9\tW-3r5\t\tLaugh\t\t17\tBad ellipse...\t<br>Boo hoo,,<br> lost my shoe !";
    const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GIN', '1', '2', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(2);
    expect(rawResults).toMatchSnapshot();
  });

  it('should find mismatched chapter verse', async () => {
    const chosenLine = "2:3\ts7qw\t\tfigs-imperative\t\t0\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
    const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '22', '33', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(3);
    expect(rawResults).toMatchSnapshot();
  });

  it('should find mismatched bookId', async () => {
    const chosenLine = "1:2\tt7qw\t\tfigs-imperative\t\t0\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
    const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(1);
    expect(rawResults).toMatchSnapshot();
  });

  it('should find language code instead of asterisk', async () => {
    const chosenLine = "1:2\tu7qw\t\tfigs-imperative\t\t0\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://en/ta/man/translate/figs-imperative]])";
    const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'EXO', '1', '2', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(2);
    expect(rawResults).toMatchSnapshot();
  });

  it('should be valid', async () => {
    const chosenLine = "1:2\tv7qw\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
    const rawResults = await checkNotesTSV7DataRow(languageCode, repoCode, chosenLine, 'GEN', '1', '2', 'from test line', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(1);
  });

})
