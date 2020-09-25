## Door43 Repository Check Sandbox

This function checks the given Door43 repository files for typical formatting errors.

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other details to help locate the error as available.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

The code below requests some info and then checks a Door43 repository.You can enter the `repoName`, i.e., the `username/repoName` in the code below. (Unfortunately if you refresh the page from the browser controls, it will return to the default setting. If you want to restart the test without returning to the default repo, just change one letter in a `//` comment line below.)

**Warning**: Some repos contain many files and/or very large files, and downloading them all and then checking them might slow down your browser -- maybe even causing pop-up messages asking to confirm that you want to keep waiting.

**Note**: This demonstration uses cached values of files stored inside the local browser. This makes reruns of the checks much faster, but it won't notice if you have updated the files on Door43. If you want to clear the local caches, use the `Clear Cache` function.

```js
import React, { useState, useEffect } from 'react';
import { formRepoName, preloadReposIfNecessary } from './getApi';
import { checkRepo } from './book-package-check';
import { RenderRawResults } from '../demos/RenderProcessedResults';

// You can put your own data into the following fields:
const data = {
  username: 'unfoldingWord',
  languageCode : 'fr',
  repoCode : 'ULB',
  branch : 'master',
  givenLocation : 'that was supplied',
  checkingOptions: {},
}

function CheckRepo(props) {
  const { username, languageCode, repoCode, branch, givenLocation, checkingOptions } = props.data;

  const [results, setResults] = useState(null);

  // We need the following construction because checkRepo is an ASYNC function
  useEffect(() => {
    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {

      // TODO: See if this preloading is really helping at all???
      // This call is not needed, but makes sure you don't have stale data that has been cached
      setResults(<p style={{ color: 'magenta' }}>Preloading repos for {username} {languageCode} ready for repo check…</p>);
      const successFlag = await preloadReposIfNecessary(username, languageCode, ['GEN','MAT'], branch, [repoCode]);
      if (!successFlag)
          console.log(`CheckRepo error: Failed to pre-load all repos`)

      // Display our "waiting" message
      const repoName = formRepoName(languageCode, repoCode);
      setResults(<p style={{ color: 'magenta' }}>Checking {username} {repoName} {branch}…</p>);
      const rawResults = await checkRepo(username, repoName, branch, givenLocation, setResults, checkingOptions);
      setResults(
        <div>
          <b>Checked</b> Door43 {username} {repoName} {branch}<br/><br/>
          <RenderRawResults results={rawResults} />
        </div>
      );
    })(); // end of async part in unnamedFunction
  }, []); // end of useEffect part

  return results;
} // end of CheckRepo function

<CheckRepo data={data}/>
```
