## Raw Text Field Check Sandbox

This `doBasicTextChecks()` function can be passed a text (incl. markdown) field and checks for basic errors like leading/trailing spaces, bad punctuation, etc.

The raw function returns only a list of notices (which are normally processed later into a list of errors and warnings).

This demonstration only displays the raw notices so that you can see exactly what is being returned. (A later demonstration shows similar notices processed into error and warning lists.)

```js
import doBasicTextChecks from './basic-text-check';
import { RenderLines, RenderRawNotices } from '../components/RenderProcessedResults';

// Empty, space, good, and bad, link, and RC text samples
const textE = "";
const textS = " ";
const textG = "Peace on Earth, good will to all men/people!";
const textB = " Peace  on Earth,, good will to all) men! ";
const textL = "https://unfoldingWord.org";
const textRC1 = "rc://en/obs/book/obs/02/03";
const textRC2 = "Compare with rc://en/tw/dict/bible/other/canaan";

// Just change these next two lines to change the text being used (to demonstrate differing results)
const chosenName = "textB";
const chosenText = textB;

// The third parameter is "linksAllowed"
const rawResult = doBasicTextChecks('Sample', chosenText, false, 'in '+chosenName+' that was supplied');
if (!rawResult.successList || !rawResult.successList.length)
    rawResult.successList = ["Done basic text checks"];

<>
<b>Check</b> "{chosenText}"<br/><br/>
<RenderRawNotices results={rawResult} />
</>
```
