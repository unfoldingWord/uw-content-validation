## Basic File Check Sandbox

This `doBasicFileChecks()` function can be passed a text and checks for global errors like mismatching punctuation pairs.

Note that it's not always wise to call this function. If punctuation pairs, etc., are already constrained to, and checked for, in certain fields/parts of the file, then this function may just confuse the user with duplicated warnings.

This generic function returns a list/array of notices, that can then be post-processed to eliminate any warning types that don't apply to this particular type of field so we don't flood the user with a lot of false positives.

This demonstration doesn't display the raw notices, but rather displays the processed and formatted lists of errors and warnings.

```js
import doBasicFileChecks from './basic-file-check';
import { RenderLines, RenderRawResults } from '../demos/RenderProcessedResults';

// Empty, space, good, and bad samples
const textE = "";
const textS = " ";
const textG = `{Peace on Earth, good will to all men/people!
}`;
const textB = `{ Peace  on Earth,,
 good will to all) men! `;

// Just change these next two lines to change the text being used (to demonstrate differing results)
const chosenName = "textB";
const chosenText = textB;

const rawResults = doBasicFileChecks('Sample', chosenText, 'in '+chosenName+' that was supplied');
if (!rawResults.successList || !rawResults.successList.length)
    rawResults.successList = ["Done basic file checks"];

<>
<b>Check</b> "{chosenText}"<br/><br/>
<RenderRawResults results={rawResults} />
</>
```
