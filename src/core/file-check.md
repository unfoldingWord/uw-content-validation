## File Contents Check Sandbox

This function checks the given file contents for typical formatting errors. (Although the `filename` is passed as a parameter for informational purposes, the calling program is normally responsible for actually loading the file and passing through the contents to be checked.)

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other details to help locate the error as available.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

```js
import React, { useState, useEffect } from 'react';
import { checkFileContents } from './book-package-check';
import { RenderLines, RenderRawResults } from '../demos/RenderProcessedResults';

const sampleUSFM = `\\id GEN EN_ULT en_English_ltr unfoldingWord Literal Text Thu Jul 25 2019 09:33:56 GMT-0400 (EDT) tc
\\usfm 3.0
\\ide UTF-8
\\h Genesis
\\toc1 The Book of Genesis
\\toc2 Genesis
\\toc3 Gen
\\mt Genesis

\\s5
\\c 1
\\p
\\v 1 In the beginning, God created the heavens and the earth.
\\v 2 The earth was without form and empty. Darkness was upon the surface of the deep. The Spirit of God was moving above the surface of the waters.
\\s5
\\v 3 God said, “Let there be light,” and there was light.
\\v 4 God saw the light, that it was good. He divided the light from the darkness.
\\v 5 God called the light “day,” and the darkness he called “night.” This was evening and morning, the first day.

\\ts\\*
\\p
\\v 6 God said, “Let there be an expanse between the waters, and let it divide the waters from the waters.”
\\v 7 God made the expanse and divided the waters which were under the expanse from the waters which were above the expanse. It was so.
\\v 8 God called the expanse “sky.” This was evening and morning, the second day.
`;

const data = {
  languageCode: 'en',
  filename: 'sample_GEN.usfm',
  fileContent : sampleUSFM,
  givenLocation : 'that was supplied',
  checkingOptions: {},
}

function CheckFileContents(props) {
  const { languageCode, filename, fileContent, givenLocation, checkingOptions } = props.data;

  const [results, setResults] = useState(null);

  // We need the following construction because checkFileContents is an ASYNC function
  useEffect(() => {
    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // Display our "waiting" message
      setResults(<p style={{ color: 'magenta' }}>Checking {filename}…</p>);
      const rawResults = await checkFileContents(languageCode, filename, fileContent, givenLocation, checkingOptions);

      // Because we know here that we're only checking one file, we don't need the filename field in the notices
      function deleteFilenameField(notice) { delete notice.filename; return notice; }
      rawResults.noticeList = rawResults.noticeList.map(deleteFilenameField);

      setResults(
        <div>
          <b>Checked</b> {filename}: "{fileContent.substr(0,256)}…"<br/><br/>
          <RenderRawResults results={rawResults} />
        </div>
      );
    })(); // end of async part in unnamedFunction
  }, []); // end of useEffect part

  return results;
} // end of CheckFileContents function

<CheckFileContents data={data}/>
```
