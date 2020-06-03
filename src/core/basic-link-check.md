## Basic Link Field Check Sandbox

This function is for checking text fields that are links, or that contain links.

```js
import doBasicLinkChecks from './link-checks.js';

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
const chosenText = textMD3;

let result;

// Define our callback function
function acceptUpdatedResult(newResult){
    // Update the results with later results
    console.log("acceptUpdatedResult callback function is updating result now with "+newResult.errorList.length+" errors and "+newResult.warningList.length+" warnings.");
    result.errorList = newResult.errorList;
    result.warningList = newResult.warningList;
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
result = doBasicLinkChecks('Sample', chosenText, linkOptions, 'that was supplied');

function RenderArray(props) {
    // Display our array of 4-part lists in a nicer format
    // Uses 'result' object from outer scope
    const myList = props.arrayType=='e' ? result.errorList : result.warningList;
    return ( <ul>
            {myList.map(function(listEntry){
                return <li><b style={{color:props.arrayType=='e'?'red':'orange'}}>{listEntry[0]}</b> {(listEntry[1]>0?" (at character "+(listEntry[1]+1)+")":"")} {listEntry[2]?" in '"+listEntry[2]+"'":""} {listEntry[3]}</li>;
            })}
          </ul>
    );
}
<>
<b>Check</b> "{chosenText}"<br/><br/>
<b style={{color:result.errorList.length?'red':'green'}}>{result.errorList.length} error{result.errorList.length==1? '':'s'}</b>{result.errorList.length?':':''}
<RenderArray arrayType='e' />
<b style={{color:result.warningList.length?'orange':'green'}}>{result.warningList.length} warning{result.warningList.length==1? '':'s'}</b>{result.warningList.length?':':''}
<RenderArray arrayType='w' />
</>
```
