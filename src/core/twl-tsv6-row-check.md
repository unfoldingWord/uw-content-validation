## TW Links (TSV) Row Check Sandbox

This function checks one tab-separated line for typical formatting errors.

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other details to help locate the error as available.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

```js
// The control code in this box is editable for changing settings—
//    simply click inside here and add, change, or delete text as required.
// Note that (gray) lines starting with // are "comments", i.e., they are ignored by the software
//    so if you want to enable those lines, you must remove the // from the beginning of the line.

import React, { useState, useEffect } from 'react';
import { checkTWL_TSV6DataRow } from './twl-tsv6-row-check';
import { RenderRawResults } from '../demos/RenderProcessedResults';

// Empty, Header, Nonsense, Good, Bad, Very bad, and Actual line samples
const lineE = "";
const lineH = "Reference\tID\tTags\tOrigWords\tOccurrence\tTWLink";
const lineN = "Peace on Earth, good will to all men/people!";
const lineG = "2:3\tw3r5\t\t1\t\tThis is an  optional note";
const lineB1 = "2:3\tw3r5\t\t1\t\t<br>Boo";
const lineB2 = "99:3\tw3r5\t\t1\t\tBoo";
const lineB3 = "2:boo\tw3r5\t\t1\t\tNote3";
const lineB4 = "2:3\tw3r5q\t\t1\t\tNote4";
const lineB5 = "2:3\tw3r5\tLaugh\t\t1\t\tNote5";
const lineB6 = "2:3\tw3r5\t\tCan’t remember\t1\t\tNote6";
const lineB7 = "2:3\tw3r5\t\t17\t\tNote7";
const lineB8 = "2:3\tw3r5\t\t1\tBad ellipse...\tNote8";
const lineB9 = "2:3\tw3r\t\t1\t\t<br>Boo hoo,, lost my shoe !";
const lineV = "200:9\tW-3r5\tLaugh\t\t17\tBad ellipse...\t<br>Boo hoo,,<br> lost my shoe !";
const lineA1 = "1:1\tgfme\tkeyterm\tהַשּׁפְטִ֔ים\t1\trc://*/tw/dict/bible/kt/judge";
const lineA2 = "1:1\trenf\t\tרָעָ֖ב\t1\trc://*/tw/dict/bible/other/famine";
const lineA3 = "1:1\tqury\tname\tמִבֵּית לֶ֣חֶם\t1\trc://*/tw/dict/bible/names/bethlehem";
const lineA4 = "2:16\tytc7\tkeyterm; name\tΧριστοῦ Ἰησοῦ\t1\trc://*/tw/dict/bible/kt/jesus";

const data = {
  // You can choose any of the above lines here
  //  (to demonstrate differing results)
  username: 'unfoldingWord',
  languageCode: 'en',
  repoCode: 'TWL',
  tableLineName : 'lineA4',
  tableLine : lineA4,
  bookID : 'ROM', C:'2', V:'16',
  givenLocation : 'that was supplied',
}

function OurCheckTWLRow(props) {
  const { username, languageCode, repoCode, bookID, C, V, tableLine, tableLineName, givenLocation } = props.data;

  const [results, setResults] = useState(null);

  // We need the following construction because checkTWL_TSV6DataRow is an ASYNC function
  useEffect(() => {
    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // Display our "waiting" message
      setResults(<p style={{ color: 'magenta' }}>Checking {tableLineName} <b>{bookID}</b>…</p>);
      const checkingOptions = {};
      const rawResults = await checkTWL_TSV6DataRow(username, languageCode, repoCode, tableLine, bookID, C, V, givenLocation, checkingOptions);
      setResults(
        <div>
          <b>Check</b> {tableLineName}: "{tableLine}"<br/><br/>
          <RenderRawResults results={rawResults} />
        </div>
      );
    })(); // end of async part in unnamedFunction
  }, []); // end of useEffect part

  return results;
} // end of OurCheckTWLRow function

<OurCheckTWLRow data={data}/>
```
