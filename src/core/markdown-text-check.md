## Markdown Text Check Sandbox

This function checks the given markdown-formatted text for typical formatting errors.

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other details to help locate the error as available.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

```js
// The code in this box is editable for changing settings—
//        Simply click inside here and add, change, or delete text as required.

import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown'
import { checkMarkdownText } from './markdown-text-check';
import { RenderRawResults } from '../demos/RenderProcessedResults';

// Markdown text samples
const textSG = `# Short Good Markdown Test

This is a paragraph.

## Second level heading

Another paragraph.

  * List item 1
  * List item 2
`;
const textSB = `### Short Bad Markdown Test
This should be a paragraph.

# First level heading

Another  paragraph.

  * List item 1
   * List item 2
`;

const data = {
  // You can choose any of the above lines here
  //  (to demonstrate differing results)
  chosenTextName : 'textSB',
  chosenText : textSB,
  languageCode : 'en',
  repoCode : 'TN',
  givenLocation : "that was supplied",
}

function OurCheckMarkdownText(props) {
  const { languageCode, repoCode, chosenText, chosenTextName, givenLocation } = props.data;

  const [results, setResults] = useState(null);

  // We need the following construction because checkMarkdownText is an ASYNC function
  useEffect(() => {
    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // Display our "waiting" message
      setResults(<p style={{ color: 'magenta' }}>Checking {chosenTextName}…</p>);
      const checkingOptions = {};
      const rawResults = await checkMarkdownText(languageCode, repoCode, chosenTextName, chosenText, givenLocation, checkingOptions);
      if (!rawResults.successList || !rawResults.successList.length)
        rawResults.successList = ["Done markdown text checks"];
      setResults(
        <div>
          <b>Check</b> {chosenTextName}: "{chosenText.substr(0,256)}…"<br/><br/>
          <RenderRawResults results={rawResults} />
        </div>
      );
    })(); // end of async part in unnamedFunction
  }, []); // end of useEffect part

  return results;
} // end of OurCheckMarkdownText function

<OurCheckMarkdownText data={data}/>
```
