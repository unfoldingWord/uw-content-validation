## Basic Text Field Check Sandbox

This function can be passed a text (incl. markdown) field
and checks for basic errors like leading/trailing spaces,
bad punctuation, etc.

```js
import doBasicTextChecks from './basic-text-check';
import processNotices from './notice-handling-functions';
import { RenderRawNotices, RenderSettings, RenderSuccessesErrorsWarnings } from '../components/RenderProcessedResults';

// Empty, space, good, and bad, link, and RC text samples
const textE = "";
const textS = " ";
const textG = "Peace on Earth, good will to all men/people!";
const textB = " Peace  on Earth,, good will to all) men! ";
const textL = "https://unfoldingWord.org";
const textRC1 = "rc://en/obs/book/obs/02/03";
const textRC2 = "Compare with rc://en/tw/dict/bible/other/canaan";

// Just change this next line to change the text being used (to demonstrate differing results)
const chosenText = textB;

// The third parameter is "linksAllowed"
let preliminaryResult = doBasicTextChecks('Sample', chosenText, false, 'that was supplied');
preliminaryResult.successList = ["Done basic text checks"];
const processOptions = {
    // Uncomment any of these to test them
    // 'maximumSimilarMessages': 3, // default is 2
    // 'errorPriorityLevel': 600, // default is 700
    // 'cutoffPriorityLevel': 200, // default is 0
    // 'sortBy': 'ByPriority', // default is 'AsFound'
    // 'ignorePriorityNumberList': [123, 202], // default is []
};
const processedResult = processNotices(preliminaryResult, processOptions);

<>
<b>Check</b> "{chosenText}"<br/><br/>
<RenderRawNotices results={preliminaryResult} />
<p>Which after processing{Object.keys(processOptions).length? <> using <b>processOptions</b><RenderSettings settings={processOptions} /></>:''} then becomes:</p>
<RenderSuccessesErrorsWarnings results={processedResult} />
</>
```
