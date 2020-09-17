## Door43 Book Package Check Sandbox

This function checks the Door43 Book Package (i.e., a Bible book or Open Bible Stories) for the specified language by loading and checking files from several interconnected Door43 Content Service (DCS) repositories.

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other details to help locate the error as available.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

The code below requests some info and then checks the single specified Bible book in several repos. This is convenient to see all these check results collected into one place.

See a list of valid book identifiers [here](http://ubsicap.github.io/usfm/identification/books.html), although only `GEN` to `REV` from that list are useful here.

Note that `OBS` can also be entered here as a *pseudo book identifier* in order to check an **Open Bible Stories** repo.

`Book Package Check` calls `checkBookPackage()` which then calls `checkFileContents()` for the book file in each repo (or calls `checkRepo()` for **OBS**).

**Warning**: Some book packages contain many files and/or very large files, and downloading them all and then checking them might slow down your browser -- maybe even causing pop-up messages asking to confirm that you want to keep waiting.

**Note**: This demonstration uses cached values of files stored inside the local browser. This makes reruns of the checks much faster, but it won't notice if you have updated the files on Door43. If you want to clear the local caches, use the `Clear Cache` function.

```js
import React, { useState, useEffect } from 'react';
import { checkBookPackage } from './book-package-check';
import { RenderRawResults } from '../demos/RenderProcessedResults';

// You can put your own data into the following fields:
const data = {
  username: 'unfoldingWord',
  languageCode : 'en',
  bookID : 'OBA',
  givenLocation : 'that was supplied',
  checkingOptions: {},
}

function CheckBookPackage(props) {
  const { username, languageCode, bookID, givenLocation, checkingOptions } = props.data;

  const [results, setResults] = useState(null);

  // We need the following construction because checkBookPackage is an ASYNC function
  useEffect(() => {
    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // Display our "waiting" message
      setResults(<p style={{ color: 'magenta' }}>Checking <b>{username}</b> {languageCode} <b>{bookID}</b>…</p>);
      const rawResults = await checkBookPackage(username, languageCode, bookID, setResults, checkingOptions);
      setResults(
        <div>
          <b>Checked</b> Door43 {username} {languageCode} {bookID}<br/><br/>
          <RenderRawResults results={rawResults} />
        </div>
      );
    })(); // end of async part in unnamedFunction
  }, []); // end of useEffect part

  return results;
} // end of CheckBookPackage function

<CheckBookPackage data={data}/>
```
