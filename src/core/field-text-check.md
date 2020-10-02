## Basic Text Field Check Sandbox

This `checkTextField()` function can be passed a text (incl. markdown) field and checks for basic errors like leading/trailing spaces, bad punctuation, etc.

This generic function returns a list/array of notices, that can then be post-processed to eliminate any warning types that don't apply to this particular type of field so we don't flood the user with a lot of false positives.

This demonstration doesn't display the raw notices, but rather displays the processed and formatted lists of errors and warnings.

```js
import { checkTextField } from './field-text-check';
import { RenderLines, RenderRawResults } from '../demos/RenderProcessedResults';

// Empty, space, good, and bad, link, and RC text samples
const textE = "";
const textS = " ";
const textG = "Peace on Earth, good will to all men/people!";
const textB = " Peace  on Earth,, good will to all) men! ";
const textL = "https://unfoldingWord.org";
const textRC1 = "rc://en/obs/book/obs/02/03";
const textRC2 = "Compare with rc://en/tw/dict/bible/other/canaan";

// Just change these next two lines to change the text being used (to demonstrate differing results)
const chosenTextName = "textB";
const chosenText = textB;

// The third parameter is "linksAllowed"
const rawResults = checkTextField('Sample', chosenText, false, 'in '+chosenTextName+' that was supplied');
if (!rawResults.successList || !rawResults.successList.length)
    rawResults.successList = ["Done basic text checks"];

<>
<b>Check</b> "{chosenText}"<br/><br/>
<RenderRawResults results={rawResults} />
</>
```