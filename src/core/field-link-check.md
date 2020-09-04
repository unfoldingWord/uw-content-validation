## Basic Link Field Check Sandbox

This function is for checking text fields that are links, or that contain links.

```js
import checkFieldLinks from './field-link-check';
import { processNoticesToErrorsWarnings } from './notice-processing-functions';
import { RenderLines, RenderRawResults, RenderSuccessesErrorsWarnings } from '../demos/RenderProcessedResults';

// Empty, space, link, RC, good, and bad text samples
const textE = "";
const textS = " ";
const textL = "https://unfoldingWord.org";
const textRC1 = "rc://en/obs/book/obs/02/03";
const textRC2 = "rc://en/tw/dict/bible/other/canaan";
const textMD1 = "Have a look [here](https://unfoldingWord.org/)!";
const textMD2 = " Look at [[https://unfoldingWord.org]] ";
const textMD3 = "Now  look at [[http://door43.org]] ";

// Easy for user to change text used in next line (to demonstrate differing results)
const chosenTextName = "textMD3";
const chosenText = textMD3;

let rawResults;

// Define our callback function
function acceptUpdatedResult(newLinkResult){
    // Update the results with later results
    console.log(`acceptUpdatedResult callback function is updating result now with ${newLinkResult.noticeList.length} notices.`);
    rawResults.noticeList = newLinkResult.noticeList;
    // Now how can we tell Styleguidist to refresh???
}

const linkOptions = {
    expectedCount: 1, // 0 = all links optional (no minimal number expected)
    allowedCount: 0, // 0 = no maximum limit
    otherTextAllowed: true, // if false, field is just the link only
    linkTypesAllowed: ['RC', 'md', 'naked',],
        // 'RC' (ResourceContainer) allows 'rc://...` links
        // 'md' allows '[this](http://here.org)' and [[http://here.org]]
        // 'naked' allows 'http:://example.org' and even 'example.org'
    checkTargets: true, // Attempt to retrieve the link(s) -- slows it down
    callbackFunction: acceptUpdatedResult, // Required to accept updated results if checking targets
};

// This function returns the results of the fast checks
//  and if specified in linkOptions, the callback will update result later with results of slower checks
rawResults = checkFieldLinks(chosenTextName, chosenText, linkOptions, 'that was supplied');
if (!rawResults.successList || !rawResults.successList.length)
    rawResults.successList = ["Done basic link checks"];

<>
<b>Check</b> "{chosenText}"<br/><br/>
<RenderRawResults results={rawResults} />
</>
```
