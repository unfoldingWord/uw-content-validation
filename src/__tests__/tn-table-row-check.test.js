/* eslint-env jest */

import {checkTN_TSVDataRow} from '../core/tn-table-row-check';
import Path from "path";
import fs from 'fs-extra';

const optionalCheckingOptions = {
  originalLanguageRepoUsername: 'unfoldingWord',
  taRepoUsername: 'unfoldingWord',
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

describe('checkTN_TSVDataRow() - ', () => {
  const languageCode = 'en';

  describe('link tests - ', () => {
    it('should fail invalid doublet link', async() => {
      const chosenLine = "RUT\t2\t12\tgnn5\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tmay your full wages come from Yahweh	This is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [[rc://*/ta/man/translate/figs-parallelism]], [Doublet](../figs-doublet/01.md))";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'RUT','2','12', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail broken link start', async() => {
      const chosenLine = "RUT\t2\t12\tgnn5\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tmay your full wages come from Yahweh	This is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [rc://*/ta/man/translate/figs-parallelism]]";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'RUT','2','12', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail broken link end', async() => {
      const chosenLine = "RUT\t2\t12\tgnn5\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tmay your full wages come from Yahweh	This is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [[rc://*/ta/man/translate/figs-parallelism]";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'RUT','2','12', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail double broken link start', async() => {
      const chosenLine = "RUT\t2\t12\tgnn5\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tmay your full wages come from Yahweh	This is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: rc://*/ta/man/translate/figs-parallelism]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'RUT','2','12', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail double broken link end', async() => {
      const chosenLine = "RUT\t2\t12\tgnn5\tfigs-parallelism\tשְׁלֵמָ֗ה\t1\tmay your full wages come from Yahweh	This is a poetic expression that is very similar to the previous sentence. Alternate translation: “May Yahweh fully give to you everything that you deserve” (See: [[rc://*/ta/man/translate/figs-parallelism)";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'RUT','2','12', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail if SupportReference link differs from link in OccurrenceNote', async() => {
      const chosenLine = "GEN\t1\t6\turb3\tfigs-imperative\t\t0\tLet there be an expanse…let it divide\tThese are commands. By commanding that the expanse should exist and that it divide the waters, God made it exist and divide the waters. (See: [[rc://*/ta/man/figs-parallelism]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','6', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail invalid link path', async() => {
      const chosenLine = "GEN\t1\t7\turb3\tfigs-imperative\t\t0\tLet there be an expanse…let it divide\tThese are commands. By commanding that the expanse should exist and that it divide the waters, God made it exist and divide the waters. (See: [[rc://*/ta/woman/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','7', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should succeed with mixed link types', async() => {
      const chosenLine = "GEN\t1\t8\tss9r\tfigs-merism\t\t0\tevening and morning\tThis refers to the whole day. The writer speaks of the whole day as if it were these two parts. In the Jewish culture, a day begins when the sun sets. See how you translated this in [Genesis 1:5](../01/05.md). (See: [[rc://*/ta/man/translate/figs-merism]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','8', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
    });

    it('should succeed with dual links', async() => {
      const chosenLine = "GEN\t1\t9\tzu6f\tfigs-activepassive\t\t0\tLet the waters…be gathered\tThis can be translated with an active verb. This is a command. By commanding that the waters gather together, God made them gather together. Alternate translation: “Let the waters…gather” or “Let the waters…come together” (See: [[rc://*/ta/man/translate/figs-activepassive]] and [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','9', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
    });

    it('should fail invalid first link', async() => {
      const chosenLine = "GEN\t1\t9\tzu6f\tfigs-activepassive\t\t0\tLet the waters…be gathered\tThis can be translated with an active verb. This is a command. By commanding that the waters gather together, God made them gather together. Alternate translation: “Let the waters…gather” or “Let the waters…come together” (See: [[rc://*/ta/man/translate/figs-activepassivez]] and [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','9', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(6);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail invalid second link', async() => {
      const chosenLine = "GEN\t1\t9\tzu6f\tfigs-activepassive\t\t0\tLet the waters…be gathered\tThis can be translated with an active verb. This is a command. By commanding that the waters gather together, God made them gather together. Alternate translation: “Let the waters…gather” or “Let the waters…come together” (See: [[rc://*/ta/man/translate/figs-activepassive]] and [[rc://*/ta/man/translate/figs-imperativez]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','9', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(4);
      expect(rawResults).toMatchSnapshot();
    });

    it('should pass valid verse link', async() => {
      const chosenLine = "GEN\t1\t19\tha33\t\t\t0\tIt was so\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in [Genesis 1:7](../01/07.md).";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','19', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(0);
    });

    it('should fail invalid verse link', async() => {
      const chosenLine = "GEN\t1\t9\tha33\t\t\t0\tIt was so\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in [Genesis 1:7](../01/zzz.md).";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','9', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail invalid verse link start', async() => {
      const chosenLine = "GEN\t1\t9\tha33\t\t\t0\tIt was so\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in Genesis 1:7](../01/07.md).";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','9', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail invalid verse link end', async() => {
      const chosenLine = "GEN\t1\t9\tha33\t\t\t0\tIt was so\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in [Genesis 1:7](../01/07.md.";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','9', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

  });

  describe('Original Quote tests - ', () => {
    it('invalid Original Language', async() => {
      const chosenLine = "GEN\t1\t1\tf2mg\t\t0\t\t\tIn the beginning, God created the heavens and the earth “This is about how God made the heavens and the earth in the beginning.” This statement summarizes the rest of the chapter. Some languages translate it as “A very long time ago God created the heavens and the earth.” Translate it in a way that shows this actually happened and is not just a folk story.";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','1', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should find missing Original Quote', async() => {
      const chosenLine = "GEN\t1\t3\ta7qw\tfigs-imperative\t\t1\tLet there be light\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','3', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail to find OrigLang Quote', async() => {
      const chosenLine = "GEN\t1\t2\tb7qw\tfigs-imperative\tוְ⁠חֹ֖שֶךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail to find 2nd instance/occurrence', async() => {
      const chosenLine = "GEN\t1\t2\tc7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t2\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
    });

    it('should fail with leading space', async() => {
      const chosenLine = "GEN\t1\t2\te7qw\tfigs-imperative\t וְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with trailing space', async() => {
      const chosenLine = "GEN\t1\t2\tf7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ \t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with leading word joiner', async() => {
      const chosenLine = "GEN\t1\t2\tg7qw\tfigs-imperative\t\u2060וְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with trailing word joiner', async() => {
      const chosenLine = "GEN\t1\t2\th7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\u2060\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with leading zero width non-joiner', async() => {
      const chosenLine = "GEN\t1\t2\ti7qw\tfigs-imperative\t\u200cוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with trailing zero width non-joiner', async() => {
      const chosenLine = "GEN\t1\t2\tj7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\u200c\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with leading zero width joiner', async() => {
      const chosenLine = "GEN\t1\t2\tk7qw\tfigs-imperative\t\u200dוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail with trailing zero width joiner', async() => {
      const chosenLine = "GEN\t1\t2\tl7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\u200d\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(3);
      expect(rawResults).toMatchSnapshot();
    });

  });

  describe('Occurrence Note tests - ', () => {

    it('should find white space', async() => {
      const chosenLine = "GEN\t1\t2\tm7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\t ";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should find empty note', async() => {
      const chosenLine = "GEN\t1\t2\tn7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\t";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

  });

  describe('GL Note tests - ', () => {

    it('should find bad ellipse', async() => {
      const chosenLine = "GEN\t2\t3\tw3r5\t\t\t1\tBad ellipse...\tNote8";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','2','3', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

  });

  describe('BookID tests - ', () => {

    it('should find wrong book ID', async() => {
      const chosenLine = "RUT\t1\t2\to7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it.skip('should find invalid book ID', async() => {
      const chosenLine = "GIN\t1\t2\tp7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      let error = false;
      try {
        await checkTN_TSVDataRow(languageCode, chosenLine, 'GIN', '1', '2', 'that was supplied', optionalCheckingOptions);
        error = false;
      } catch(e) {
        error = true;
      }
      expect(error).toBeTruthy();
    });

  });

  describe('TSV format tests - ', () => {
    it('empty line should fail', async() => {
      const chosenLine = ""; //lineG;
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('header should succeed', async() => {
      const chosenLine = "Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(0);
    });

    it('should find wrong row count', async() => {
      const chosenLine = "EXO\t2\t3\tw3r5\t\t1\t\t<br>Boo"; // only 8 fields
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

    it('should fail not TSV', async() => {
      const chosenLine = "Peace on Earth, good will to all men/people!";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(1);
      expect(rawResults).toMatchSnapshot();
    });

  });

  describe('SupportReference tests - ', () => {
    it('should find short SupportReference', async() => {
      const chosenLine = "GEN\t1\t2\tq7q\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      rawResults.suggestion = undefined; // We need to get rid of random characters in suggestion
      expect(rawResults).toMatchSnapshot();
    });

    it('should find long SupportReference', async() => {
      const chosenLine = "GEN\t1\t2\tr7q33\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

    it('should find missing SupportReference', async() => {
      const chosenLine = "GEN\t1\t2\t\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
      const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
      expect(rawResults.noticeList.length).toEqual(2);
      expect(rawResults).toMatchSnapshot();
    });

  });

  it('should find invalid SupportReference and missing quotes', async() => {
    const chosenLine = "GEN\t2\t3\tw3r5\tLaugh\t\t1\t\tNote5";
    const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','2','3', 'that was supplied', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(4);
    expect(rawResults).toMatchSnapshot();
  });

  it('should skip front matter', async() => {
    const chosenLine = "GEN\t1\tintro\tzb6f\t\t\t0\t\t# Genesis 01 General Notes<br><br>## Structure and formatting<br><br>This chapter presents the first account of God creating the world. There is a pattern to this account: “God said…God saw that it was good…This was evening and morning, the first day.” Translators should preserve this pattern in their versions.<br><br>## Special concepts in this chapter<br><br>### The universe<br><br>This account of creation is told within the framework of ancient Hebrew ideas about the universe: the earth was resting with water around it and below it. Over the earth was something like a vast dome, called “an expanse between the waters” (1:6), on top of which was more water. Translators should try to keep these original images in their work, even though readers in their project language might have a completely different idea of what the universe is like.<br><br>### Evening and morning<br><br>Genesis 1 presents the ancient Hebrew idea of a day: it begins with sunset, lasts through the night and continues through the daylight hours until the next sunset. This pattern should be preserved in translation, even if readers in the project language define “day” differently.<br><br>## Other possible translation difficulties in this chapter<br><br>### “In the beginning”<br><br>Some languages and cultures speak of the world as if it has always existed, as if it had no beginning. But “very long ago” is different from “in the beginning,” and you need to be sure that your translation communicates correctly.<br><br>### “God said, ‘Let there be’”<br><br>This expression occurs often in this chapter. It can be difficult to translate, because God is not shown as talking to a particular person. If God is talking to a thing, it is something not yet in existence. Translators should find the most natural way in the project language to signal the idea that God spoke things into existence; he created the world and the things in it by simply commanding that they should exist.";
    const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','intro', 'that was supplied', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(0);
  });

  it('should find invalid Book ID, chapter number, ID, SupportReference, quotes, OccurrenceNote', async() => {
    const chosenLine = "GIN\t200\t9\tW-3r5\tLaugh\t\t17\tBad ellipse...\t<br>Boo hoo,,<br> lost my shoe !";
    const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(16);
    expect(rawResults).toMatchSnapshot();
  });

  it('should find mismatched chapter verse', async() => {
    const chosenLine = "GEN\t2\t3\ts7qw\tfigs-imperative\t\t0\tLet there be light\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
    const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','22','33', 'that was supplied', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(3);
    expect(rawResults).toMatchSnapshot();
  });

  it('should find mismatched bookId', async() => {
    const chosenLine = "EXO\t1\t2\tt7qw\tfigs-imperative\t\t0\tLet there be light\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
    const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(2);
    expect(rawResults).toMatchSnapshot();
  });

  it('should find language code instead of asterisk', async() => {
    const chosenLine = "EXO\t1\t2\tu7qw\tfigs-imperative\t\t0\tLet there be light\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://en/ta/man/translate/figs-imperative]])";
    const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'EXO','1','2', 'that was supplied', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(1);
    expect(rawResults).toMatchSnapshot();
  });

  it('should be valid', async() => {
    const chosenLine = "GEN\t1\t2\tv7qw\tfigs-imperative\tוְ⁠חֹ֖שֶׁךְ\t1\tDarkness\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://*/ta/man/translate/figs-imperative]])";
    const rawResults = await checkTN_TSVDataRow(languageCode, chosenLine, 'GEN','1','2', 'that was supplied', optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(1);
  });

})


