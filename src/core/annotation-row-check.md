## Annotation (TSV) Row Check Sandbox

This function checks one tab-separated line for typical formatting errors.

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other details to help locate the error as available.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

```js
import React, { useState, useEffect } from 'react';
import { checkAnnotationTSVDataRow } from './annotation-row-check';
import { RenderLines, RenderRawResults } from '../demos/RenderProcessedResults';

// Empty, Header, Nonsense, Good, Bad, Very bad, and Actual line samples
const lineE = "";
const lineH = "Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tAnnotation";
const lineN = "Peace on Earth, good will to all men/people!";
const lineG = "2:3\tw3r5\t\t1\t\tThis is an  optional note";
const lineB1 = "2:3\tw3r5\t\t1\t\t<br>Boo";
const lineB2 = "99:3\tw3r5\t\t1\t\tBoo";
const lineB3 = "2:boo\tw3r5\t\t1\t\tNote3";
const lineB4 = "2:3\tw3r5q\t\t1\t\tNote4";
const lineB5 = "2:3\tw3r5\tLaugh\t\t1\t\tNote5";
const lineB6 = "2:3\tw3r5\t\tCan't remember\t1\t\tNote6";
const lineB7 = "2:3\tw3r5\t\t17\t\tNote7";
const lineB8 = "2:3\tw3r5\t\t1\tBad ellipse...\tNote8";
const lineB9 = "2:3\tw3r\t\t1\t\t<br>Boo hoo,, lost my shoe !";
const lineV = "200:9\tW-3r5\tLaugh\t\t17\tBad ellipse...\t<br>Boo hoo,,<br> lost my shoe !";
const lineA1 = "front:intro\td9wn\t\t\t0\t\t# Introduction to Genesis<br><br>## Part 1: General Introduction<br><br>### Outline of Genesis<br><br>1. From the Creation to the Tower of Babel<br>- The account of the creation of the heavens and the earth (1:1–4:26)<br>- The account of Adam (5:1–6:8)<br>- The account of Noah (6:9–11:9)<br>- The account of Shem (11:10–11:26)<br>- The account of Terah (11:27–11:32)<br>1. The accounts of the Patriarchs<br>- The account of Abraham (12:1-25:11)<br>- The account of Ishmael (25:12–25:18)<br>- The account of Isaac, focusing on Jacob (25:19–35:29)<br>- The account of Esau (36:1–37:1)<br>- The account of Jacob, focusing on Joseph (37:2–50:26)<br><br>### What is Genesis about?<br><br>Genesis begins with the early years of creation. It tells about God creating heaven, earth, and the first humans. It also tells about the first time humans sinned. This caused humans to be separated from God and to eventually die. Genesis 1-11 briefly tells about other important events that occurred over many hundreds of years. (See: [[rc://en/tw/dict/bible/kt/sin]] and [[rc://en/tw/dict/bible/other/death]])<br><br>Genesis is also about the beginning of God’s people. Genesis 12-50 tells about how God remained faithful to Abraham and his descendants. Abraham’s descendants became known as the Hebrews and later as the Israelites. These people would worship Yahweh and be his people.<br><br>Genesis ends with Abraham’s descendants living in Egypt with the hope of returning one day to the Promised Land. (See: [[rc://en/tw/dict/bible/kt/promisedland]])<br><br>### How should the title of this book be translated?<br><br>“Genesis” means “beginning,” so translators should express this idea in their title. Titles such as “The Beginning of Things” may be suitable. (See: [[rc://en/ta/man/translate/translate-names]])<br><br>### Who wrote Genesis?<br><br>The writers of both the Old and New Testaments presented Moses as being very involved with writing the book of Genesis. Since ancient times, both Jews and Christians have thought that Moses wrote Genesis, Exodus, Leviticus, Numbers, and Deuteronomy.<br><br>## Part 2: Important Religious and Cultural Concepts<br><br>### What are the covenants mentioned in Genesis?<br><br>A covenant is a formal, binding agreement between two parties that one or both parties must fulfill.<br><br>God made three covenants in Genesis. In the covenant with Adam, God promised to bless Adam and cause him to prosper. Adam was not allowed to eat fruit from the tree of knowledge of good and evil. God promised that Adam would die if he disobeyed what he commanded.<br><br>In the covenant with Noah, God promised to never again destroy the world with a flood.<br><br>In the covenant with Abraham, God promised to make Abraham’s descendants into a great nation. He also promised to protect them and to give them a land of their own.<br><br>### What was God’s purpose for the book of Genesis?<br><br>The book of Genesis says that God created a very good world. However, the world became cursed because human beings began to sin. But Genesis shows that God continues to have complete control over the world.<br><br>Genesis also describes the start of God’s plan to bless the whole world again. This is shown when God makes a covenant with Abraham. With this covenant, God chose Abraham and his descendants to be his people. God promised to bless the world through Abraham’s descendants.<br><br>### What was the custom for inheritance as described by Genesis?<br><br>There are several passages in Genesis that show the customs of a father who is about to die passing on a blessing to his son. Abraham blessed his son, Isaac, and made him the ancestor of the people of Israel. However, Ishmael, Abraham’s other son, did not receive that same divine blessing. Likewise, Isaac’s older son Esau  did not receive the blessing. Isaac’s younger son, Jacob, received it instead. (See: [[rc://en/tw/dict/bible/kt/inherit]] and [[rc://en/tw/dict/bible/kt/bless]])<br><br>Also, it was the custom for a man to divide among his sons his material wealth and land. All his sons received equal portions except the oldest son. The firstborn son received twice as much. His portion was called a double portion. Esau gave up his right to receive the double portion.<br><br>### How does Genesis present sin and evil?<br><br>Genesis presents sin as doing things that are against God’s word and God’s ways. It presents evil as the opposite of good.<br><br>Sin and evil have affected all people. This started when Adam disobeyed God in the Garden of Eden.<br><br>## Part 3: Important Translation Issues<br><br>### What is one way in which Genesis marks the beginning of important sections?<br><br>Genesis uses one Hebrew phrase that the ULT translates as “this is the record of,” “these were the events concerning,” or “these were the descendants of.” The information in these sections may have come from sources much older than Moses. These passages are 2:4; 5:1; 6:9; 10:1; 11:10, 27; 25:12, 19; 36:1, 9; 37:2.<br><br>If the translator wants to translate in only two ways, we recommend for most passages a phrase such as, “this is the record about” or “this is information about.” Some passages will be better translated, however, as “These were the descendants of.”<br><br>### Why are the beginnings of some narrative sections in Genesis difficult to translate?<br><br>Often in Genesis, the author first summarizes what is about to happen. Then in the following verses, the author tells the details of what happened. Probable examples of this style occur in Gen. 1:1, 6:22, 18:1, 21:1 and 22:1.<br><br>However, in many languages, it is preferred to write summaries at the end of a narrative. In this case, translators may choose a different approach. For example, in Gen. 1:1 (“In the beginning God created the heavens and the earth”), translators may decide to translate like this: “This is about how God made the heavens and the earth in the beginning.”<br><br>### What is the difference between “people,” “peoples,” and “people groups”?<br><br>The word “people” refers to all the individuals who belong to a group, such as “the people of Israel.” The word “peoples” (used in the ULT) refers to multiple groups of people. Each people group might speak their own language, have their own customs, and worships their own gods. Some different peoples in the ancient Near East were those of Israel, Egypt, Edom, Moab, and Ammon.<br><br>The expression “people groups” (used in the UST) means the same thing as “peoples” in the ULT. The translator should use the most equivalent term that is common in the project language.<br><br>### What is the relationship between individuals and peoples that have similar names?<br><br>Many individuals in Genesis eventually had large numbers of descendants who were called after their ancestor’s name. For example, Cush was the name of an individual. But, “Cush” also became the name of nation that his descendants formed. They were called “Cushites.” If possible, when translating these names, the translator should make the individual’s name and the nation’s name similar. Examples of this are “Cush” and “Cushite” or “Moab” and “Moabite.” Otherwise, the translator may say, “the descendants of Cush” or “the descendants of Moab.”<br><br>### What do the phrases “to this day” or “of today” mean?<br><br>These phrases were used by the narrator to refer to the time when he was writing. The translator should be aware that “to this day” and “of today” refer to a time already passed. The translator might decide to say, “to this day, at the time when this is being written,” or, “to this day, at the time of writing.” This Hebrew phrase occurs in Gen. 19:37, 19:38, 22:14, 26:33, 32:32, 35:20, 47:26, 48:18.";
const lineA2 = "1:intro\tzb6f\t\t\t0\t\t# Genesis 01 General Notes<br><br>## Structure and formatting<br><br>This chapter presents the first account of God creating the world. There is a pattern to this account: “God said…God saw that it was good…This was evening and morning, the first day.” Translators should preserve this pattern in their versions.<br><br>## Special concepts in this chapter<br><br>### The universe<br><br>This account of creation is told within the framework of ancient Hebrew ideas about the universe: the earth was resting with water around it and below it. Over the earth was something like a vast dome, called “an expanse between the waters” (1:6), on top of which was more water. Translators should try to keep these original images in their work, even though readers in their project language might have a completely different idea of what the universe is like.<br><br>### Evening and morning<br><br>Genesis 1 presents the ancient Hebrew idea of a day: it begins with sunset, lasts through the night and continues through the daylight hours until the next sunset. This pattern should be preserved in translation, even if readers in the project language define “day” differently.<br><br>## Other possible translation difficulties in this chapter<br><br>### “In the beginning”<br><br>Some languages and cultures speak of the world as if it has always existed, as if it had no beginning. But “very long ago” is different from “in the beginning,” and you need to be sure that your translation communicates correctly.<br><br>### “God said, ‘Let there be’”<br><br>This expression occurs often in this chapter. It can be difficult to translate, because God is not shown as talking to a particular person. If God is talking to a thing, it is something not yet in existence. Translators should find the most natural way in the project language to signal the idea that God spoke things into existence; he created the world and the things in it by simply commanding that they should exist.";
const lineA3 = "1:1\tf2mg\t\t0\t\t\tIn the beginning, God created the heavens and the earth “This is about how God made the heavens and the earth in the beginning.” This statement summarizes the rest of the chapter. Some languages translate it as “A very long time ago God created the heavens and the earth.” Translate it in a way that shows this actually happened and is not just a folk story.";
const lineA4 = "1:3\td7qw\tfigs-imperative\t\t0\tLet there be light\tThis is a command. By commanding that light should exist, God made it exist. (See: [[rc://en/ta/man/translate/figs-imperative]])";
const lineA5 = "1:5\tjc2d\tfigs-merism\t\t0\tevening and morning\tThis refers to the whole day. The writer speaks of the whole day as if it were these two parts. In the Jewish culture, a day begins when the sun sets. (See: [[rc://en/ta/man/translate/figs-merism]])";
const lineA6 = "1:6\turb3\tfigs-imperative\t\t0\tLet there be an expanse…let it divide\tThese are commands. By commanding that the expanse should exist and that it divide the waters, God made it exist and divide the waters. (See: [[rc://en/ta/man/translate/figs-imperative]])";
const lineA7 = "1:8\tss9r\tfigs-merism\t\t0\tevening and morning\tThis refers to the whole day. The writer speaks of the whole day as if it were these two parts. In the Jewish culture, a day begins when the sun sets. See how you translated this in [Genesis 1:5](../01/05.md). (See: [[rc://en/ta/man/translate/figs-merism]])";
const lineA8 = "1:9\tzu6f\tfigs-activepassive\t\t0\tLet the waters…be gathered\tThis can be translated with an active verb. This is a command. By commanding that the waters gather together, God made them gather together. Alternate translation: “Let the waters…gather” or “Let the waters…come together” (See: [[rc://en/ta/man/translate/figs-activepassive]] and [[rc://en/ta/man/translate/figs-imperative]])";
const lineA9 = "1:9\tha33\t\t\t0\tIt was so\t“It happened like that” or “That is what happened.” What God commanded happened just as he said it should. This phrase appears throughout the chapter and has the same meaning wherever it appears. See how you translated it in [Genesis 1:7](../01/07.md).";

const data = {
  // You can choose any of the above lines here
  //  (to demonstrate differing results)
  languageCode: 'en',
  annotationType: 'TN',
  tableLineName : 'lineA9',
  tableLine : lineA9,
  bookID : 'GEN', C:'1', V:'2',
  givenLocation : 'that was supplied',
}

function CheckAnnotationRow(props) {
  const { languageCode, annotationType, bookID, C, V, tableLine, tableLineName, givenLocation } = props.data;

  const [results, setResults] = useState(null);

  // We need the following construction because checkAnnotationTSVDataRow is an ASYNC function
  useEffect(() => {
    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // Display our "waiting" message
      setResults(<p style={{ color: 'magenta' }}>Checking {tableLineName} <b>{bookID}</b>…</p>);
      const rawResults = await checkAnnotationTSVDataRow(languageCode, annotationType, tableLine, bookID, C, V, givenLocation);
      setResults(
        <div>
          <b>Check</b> {tableLineName}: "{tableLine.substr(0,256)}…"<br/><br/>
          <RenderRawResults results={rawResults} />
        </div>
      );
    })(); // end of async part in unnamedFunction
  }, []); // end of useEffect part

  return results;
} // end of CheckAnnotationRow function

<CheckAnnotationRow data={data}/>
```
