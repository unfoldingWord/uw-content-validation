/* eslint-env jest */

import { checkTN_TSV7Table, checkSN_TSV7Table, checkTQ_TSV7Table, checkSQ_TSV7Table, checkTWL_TSV6Table, checkTA_markdownArticle, checkTW_markdownArticle, checkDeprecatedTN_TSV9Table } from '../core/wrapper';
import Path from 'path';
import fs from 'fs-extra';

// These are just very short tests to make sure that the wrapper functions run

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

  it('Should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'TIT';
    const filename = 'testFile.tsv';
    const tableText = `Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote
1:3\tb22h\t\t\tκαιροῖς ἰδίοις\t1\t“at the proper time”
1:3\txy18\t\trc://*/ta/man/translate/figs-exclusive\tἡμῶν\t1\tThis includes Paul, Titus, and all Christians. (See: [[rc://*/ta/man/translate/figs-exclusive]])
`;
    const rawResults = await checkTN_TSV7Table(username, languageCode, bookID, filename, tableText, optionalCheckingOptions);
    // console.log(`Test took ${rawResults.elapsedSeconds} seconds`);
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
\t'src/__tests__/fixtures/unfoldingWord/en_ult/57-TIT.usfm': null,
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


describe('checkSN_TSV7Table() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('Should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'TIT';
    const filename = 'testFile.tsv';
    const tableText = `Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote
front:intro\tm2jl\t\t\t\t\t# Introduction to Titus\\n\\nThis is the introduction to the book of Titus
1:intro\tc7me\t\t\t\t\t# Introduction to Titus chapter 01\\n\\nPaul begins his letter by reminding Titus who Paul is to God, and who Titus is to Paul. He then instructs Titus about the kind of man that Titus must appoint as elders. These elders are necessary for the health of the new believers because there were so many people in Crete who are teaching things that were not true about God, and turning people away from God.
1:1\trtc9\t\t\tδοῦλος Θεοῦ\t1\tPaul said that he was a servant or a slave of God because he did only what he knew that God, his master, wanted him to do. Other servants of God were Moses, David, and the other prophets.
1:1\txyz8\t\t\tδοῦλος\t1\tPeople who speak some modern languages think that slave is different from servant, because slaves suffer in ways that servants do not. However, the Greek word **servant** means both slave and servant. It means anyone who must obey his master. This is why Paul said he was a slave or servant of God, because he wanted to obey God in every way.
1:1\tabc8\t\t\tἐκλεκτῶν Θεοῦ\t1\tThese people were the Christians. God chose them to know him. They did this by believing in Christ. This is why they were different from all other people. Paul became a servant and apostle of God so that they would trust in Christ and know God increasingly well.
`;
    const rawResults = await checkSN_TSV7Table(username, languageCode, bookID, filename, tableText, optionalCheckingOptions);
    // console.log(`Test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 1000); // Allow 1 second

})


describe('checkTQ_TSV7Table() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('Should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'TIT';
    const filename = 'testFile.tsv';
    const tableText = `Reference\tID\tTags\tQuote\tOccurrence\tQuestion\tResponse
1:2\tkowp\t\t\t\tWho were the “eyewitnesses” that Luke mentions?\tThe “eyewitnesses” were the ones who were with the apostles from the beginning of Jesus’ ministry.
1:2\tgjx5\t\t\t\tWhat did some of the eyewitnesses do after they saw what Jesus did?\tThey wrote down an account or story of what Jesus did.
1:4\tb5g8\t\t\t\tWhy did Luke decide to write his own account of what Jesus said and did?\tHe wanted Theophilus to know the certainty concerning the things he had been taught.
1:6\tykne\t\t\t\tWhy did God consider Zechariah and Elizabeth to be righteous?\tGod considered them to be righteous because they walked blamelessly in his commandments.
1:7\tlyss\t\t\t\tWhy did Zechariah and Elizabeth have no children?\tThey did not have children because Elizabeth was unable to bear a child. Now she and Zechariah were very old.
1:8\tndy2\t\t\t\tWhat work was Zechariah doing before God?\tZechariah was serving as a priest.
`;
    const rawResults = await checkTQ_TSV7Table(username, languageCode, bookID, filename, tableText, optionalCheckingOptions);
    // console.log(`Test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 1000); // Allow 1 second

})


describe('checkSQ_TSV7Table() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('Should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'TIT';
    const filename = 'testFile.tsv';
    const tableText = `Reference\tID\tTags\tQuote\tOccurrence\tQuestion\tResponse
front:intro\tgtn1\t\t\t\t# Titus Study Questions\\n\\nThe Apostle Paul left Titus in Crete and gave him the responsibility to teach the new believers there, and to appoint elders in the local churches. Titus was a godly man, but he was not have as much experience as Paul did in guiding the formation of the new churches. In this letter, therefore, Paul counsels Titus concerning:\\n\\n* How Titus should fulfil his task\\n* The kind of men he should appoint as elders\\n* The type of threats that existed that could damage the new believers\\n* How believers should act in their daily lifes\\n* What is the hope that the believers look forward to\\n* How believers should interact with secular authorities and those who do not believe in Jesus\\n* The precise message that we should believe and teach\\n* How to deal with division within the church\\n\\nYou can discover Paul’s teaching concerning each of these things by carefully reading each chapter of the letter. Ask yourself questions about what you read, and pray to God that he will open your eyes to see clearly.\t
1:1\tx3em\t\tδοῦλος Θεοῦ, ἀπόστολος δὲ Ἰησοῦ Χριστοῦ\t1\tHow did Paul describe himself to Titus?\t
1:1\tv5b9\t\tδοῦλος & ἀπόστολος\t1\tWhy do you think Paul described himself as a **servant** before he described himself as an **apostle**?\t
1:1\tsg88\t\tδοῦλος Θεοῦ\t1\tIn what ways was Paul **a servant of God**?\t
`;
    const rawResults = await checkSQ_TSV7Table(username, languageCode, bookID, filename, tableText, optionalCheckingOptions);
    // console.log(`Test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 1000); // Allow 1 second

})


describe('checkTWL_TSV6Table() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('Should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = '1JN';
    const filename = 'testFile.tsv';
    const tableText = `Reference\tID\tTags\tOrigWords\tOccurrence\tTWLink
1:1\te6vb\t\tχεῖρες\t1\trc://*/tw/dict/bible/other/hand
1:1\tndps\tkeyterm\tζωῆς\t1\trc://*/tw/dict/bible/kt/life
1:2\tx9aq\tkeyterm\tζωὴ\t1\trc://*/tw/dict/bible/kt/life
1:2\tbtym\tkeyterm\tμαρτυροῦμεν\t1\trc://*/tw/dict/bible/kt/testimony
1:2\tch2n\t\tἀπαγγέλλομεν\t1\trc://*/tw/dict/bible/other/declare
`;
    const rawResults = await checkTWL_TSV6Table(username, languageCode, bookID, filename, tableText, optionalCheckingOptions);
    // console.log(`Test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 1000); // Allow 1 second

})


describe('checkTA_markdownArticle() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('Should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const articleFilepathInRepo = 'translate/something';
    const articleText = `### How do I start?

Follow these steps in order to get started:

2. **Contact.** Make contact with at least one person in the unfoldingWord network, notifying unfoldingWord that you intend to begin translation. To obtain information about how to do that, see [Finding Answers](../../intro/finding-answers/01.md)
3. **Review.** Review the [Translation Guidelines](../../intro/translation-guidelines/01.md).
4. **Agree.** Agree that the Statement of Faith is an accurate reflection of your own beliefs and that you intend to translate the content in harmony with it and also in accordance with the Translation Guidelines. Do this by signing the form that is provided. (see https://ufw.io/forms/)
6. **Read.**
    * Read the passage that you plan to translate in as many different translations as you have. In [translationStudio](../../process/setup-ts/01.md), the first mode is the reading mode. Access this mode by clicking on the top symbol on the left side. You can choose up to three translations to show in this mode. We recommend that two of these be the unfoldingWord® Literal Text (ULT) and the unfoldingWord® Simplified Text (UST). The ULT will help you to see the form of the original text, and the UST will help you to understand the meaning of the original text. Think about how to communicate the meaning in the form that people would use in your language.
    * Read the definitions of the unfoldingWord® Translation Words (the important words) in the passage. To do this, click on the tab that says, “Words.” Then click on each of the words in blue and read the explanation for each of these important words. Under each explanation there is also a section called “Translation Suggestions.” Here you will find ideas for how to translate these words.
7. **Talk.** Discuss the passage, the unfoldingWord® Translation Notes, and the unfoldingWord® Translation Words with others on the translation team. Help each other to understand what they mean. If there are parts that you still do not understand, ask pastors or other church leaders for help.
8. **Translate.** When you understand well what the passage is saying, say the first chunk (1-3 verses) out loud in your language in the way that someone from your language community would say it. If possible, say it to another member of the translation team. Let the translation team member correct it until it sounds good in your language. Use the different expressions in the ULT, UST, and Translation Notes to give you ideas for how to say the same things in different ways. Do not follow [the order of words](../translate-wforw/01.md) from either the ULT or the UST if it is more [natural](../guidelines-natural/01.md) for your language to use a different order. To help with this, say the whole chunk of text without looking at the source texts. This will help you to say these things in a way that is natural for your language, rather than in a way that was natural for the source language but might not be the best way to say it in your language. Still without looking at the source texts, type your translation of the chunk into [translationStudio](../../process/setup-ts/01.md) (or record it). To do this, click on the second icon down on the left side. The chunk that you are working on will appear in the ULT, covering the space where you will type the translation. When you are ready to type, click on the right edge of the space that is mostly covered by the ULT of that chunk. The blank space will then cover the ULT. Type your translation of the chunk here in this space from your memory. When you type (or write) from your memory without looking at the ULT, your translation will be more natural. Now repeat this step for the rest of the chunks of this passage.
9. **Check**. Since you typed or recorded your translation of these chunks without looking at the source texts, you might have left out some things. Now is the time to add those things to your translation. Click on the third icon down on the left side of translationStudio again. In that mode:
    * In translationStudio, exit editing mode by clicking the check mark icon at the top right of your translation. Now it is time to move the verse numbers where they should be in your translation. Drag each number onto the word that will begin that verse. If your translation has reordered the parts of the chunk or combined verses, you can leave some verse numbers together to indicate that what follows includes content from both of those verses.

When you finish the passage or chapter, it is ready for the [Oral Partner Check](../../checking/peer-check/01.md). To translate the next passage or chapter, start again at step 5.
`;
    const rawResults = await checkTA_markdownArticle(username, languageCode, articleFilepathInRepo, articleText, optionalCheckingOptions);
    // console.log(`Test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 1000); // Allow 1 second

})


describe('checkTW_markdownArticle() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('Should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const articleFilepathInRepo = 'names/something';
    const articleText = `# Ammon, Ammonite

## Facts:

The “people of Ammon” or the “Ammonites” were a people group that lived on the east side of the Jordan River across from the Israelites.

* The term “Ammonitess” refers specifically to a female Ammonite. This could also be translated as “Ammonite woman.”

(Translation suggestions: [How to Translate Names](rc://en/ta/man/translate/translate-names))

(See also: [curse](../kt/curse.md), [Jordan River](../names/jordanriver.md), [Lot](../names/lot.md))

## Bible References:

* [1 Chronicles 19:1-3](rc://en/tn/help/1ch/19/01)
* [Ezekiel 25:2](rc://en/tn/help/ezk/25/02)
* [Joshua 12:1-2](rc://en/tn/help/jos/12/01)

## Word Data:

* Strong’s: H5983, H5984, H5985
`;
    const rawResults = await checkTW_markdownArticle(username, languageCode, articleFilepathInRepo, articleText, optionalCheckingOptions);
    // console.log(`Test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toEqual(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 1000); // Allow 1 second

})


describe('checkDeprecatedTN_TSV9Table() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('Should pass', async () => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'TIT';
    const filename = 'testFile.tsv';
    const tableText = `Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote
TIT\tfront\tintro\tm2jl\t\t\t0\t\t# Introduction to Titus<br><br><br>## Part 1: General Introduction<br><br>### Outline of the book of Titus<br><br>1. Paul instructs Titus to appoint godly leaders. (1:1-16)<br>2. Paul instructs Titus to train people to live godly lives. (2:1-3:11)<br>3. Paul ends by sharing some of his plans and sending greetings to various believers. (3:12-15)<br><br>### Who wrote the book of Titus?<br><br>Paul wrote the book of Titus. Paul was from the city of Tarsus. He had been known as Saul in his early life. Before becoming a Christian, Paul was a Pharisee. He persecuted Christians. After he became a Christian, he traveled several times throughout the Roman Empire telling people about Jesus.<br><br>### What is the book of Titus about?<br><br>Paul wrote this letter to Titus, his fellow worker, who was leading the churches on the island of Crete. Paul instructed him about selecting church leaders. Paul also described how the believers should behave towards each other. He also encouraged them all to live in a way that pleases God.<br><br>### How should the title of this book be translated?<br><br>Translators may choose to call this book by its traditional title, “Titus.” Or they may choose a clearer title, such as “Paul’s Letter to Titus” or “A Letter to Titus.” (See: [[rc://en/ta/man/translate/translate-names]])<br><br>## Part 2: Important Religious and Cultural Concepts<br><br>### In what roles can people serve within the church?<br><br>There are some teachings in the book of Titus about whether a woman or divorced man can serve in positions of leadership within the church. Scholars disagree about the meaning of these teachings. Further study on these issues may be necessary before translating this book.<br><br>## Part 3: Important Translation Issues<br><br>### Singular and plural **you**<br><br>In this book, the word **I** refers to Paul. Also, the word **you** is almost always singular and refers to Titus. The exception to this is 3:15. (See: [[rc://en/ta/man/translate/figs-exclusive]] and [[rc://en/ta/man/translate/figs-you]])<br><br>### What is the meaning of **God our Savior**?<br><br>This is a common phrase in this letter. Paul meant to make the readers think about how God forgave them in Christ for sinning against him, and by forgiving them he saved them from being punished when he judges all people. A similar phrase in this letter is **our great God and Savior Jesus Christ**.
TIT\t1\tintro\tc7me\t\t\t0\t\t# Titus 1 General Notes<br><br>## Structure and formatting<br><br>Paul formally introduces this letter in verses 1-4. Writers often began letters in this way in the ancient Near East.<br><br>In verses 6-9, Paul lists several qualities that a man must have if he is to be an elder in the church. (See: rc://en/ta/man/translate/figs-abstractnouns) Paul gives a similar list in 1 Timothy 3.<br><br>## Special concepts in this chapter<br><br>### Elders<br><br>The church has used different titles for church leaders. Some titles include overseer, elder, pastor, and bishop.<br><br>## Other possible translation difficulties in this chapter<br><br>### Should, may, must<br><br>The ULT uses different words that indicate requirements or obligations. These verbs have different levels of force associated with them. The subtle differences may be difficult to translate. The UST translates these verbs in a more general way.
TIT\t1\t1\trtc9\tfigs-abstractnouns\tκατὰ πίστιν\t1\tfor the faith\t**Faith** is an abstract noun. Here it refers to believing or trusting in Jesus. If it is more clear in your language, you can translate it with a verb such as these, as in the UST. Alternate Translation: “to strengthen the faith” or “to help [God’s chosen people] to trust him more” (See: [[rc://en/ta/man/translate/figs-abstractnouns]])
TIT\t1\t1\txyz8\tfigs-abstractnouns\tἐπίγνωσιν\t1\tthe knowledge\tHere, **knowledge** is an abstract noun. If it is clearer in your language, you can use a verb such as “to know,” as in the UST. Paul wants people to know the true message about God and Christ so that they can live in a way that pleases God. (See: [[rc://en/ta/man/translate/figs-abstractnouns]])
TIT\t1\t1\tabc8\tfigs-abstractnouns\tἀληθείας\t1\tof the truth\tHere, **truth** is an abstract noun. If it is clearer in your language, you can use an adjective phrase such as “what is true” or “the true message.” Paul wants people to know the true message about God and Christ so that they can live in a way that pleases God. (See: [[rc://en/ta/man/translate/figs-abstractnouns]])
TIT\t1\t1\tfyf8\tfigs-abstractnouns\tτῆς κατ’ εὐσέβειαν\t1\tthat agrees with godliness\tHere, **godliness** is an abstract noun that refers to living in a way that pleases God. Alternate Translation: “that is suitable for honoring God” (See: [[rc://en/ta/man/translate/figs-abstractnouns]])
TIT\t1\t2\txyz9\t\tἐπ’ ἐλπίδι ζωῆς αἰωνίου\t1\twith the certain hope of everlasting life\t“that gives us the certain hope of everlasting life” or “based on our certain hope for everlasting life”
TIT\t1\t2\tr2gj\t\tπρὸ χρόνων αἰωνίων\t1\tbefore all the ages of time\t“before time began”
TIT\t1\t3\tb22h\t\tκαιροῖς ἰδίοις\t1\tat the right time\t“at the proper time”
`;
    const rawResults = await checkDeprecatedTN_TSV9Table(username, languageCode, bookID, filename, tableText, optionalCheckingOptions);
    // console.log(`Test took ${rawResults.elapsedSeconds} seconds`);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  }, 1000); // Allow 1 second

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
