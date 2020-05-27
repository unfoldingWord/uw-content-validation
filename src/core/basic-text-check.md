## Basic Text Field Check Sandbox

This function can be passed a text (incl. markdown) field
and checks for basic errors like leading/trailing spaces,
bad punctuation, etc.

```js
import doBasicTextChecks from './basic-text-check.js';

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
const result = doBasicTextChecks('Sample', chosenText, false, 'that was supplied');

function RenderList(props) {
    // Display our list of 2-part lists in a nicer format
    // Uses 'result' object from outer scope
    const myList = props.listType=='e' ? result.errorList : result.warningList;
    return ( <ul>
            {myList.map(function(listEntry){
                return <li><b style={{color:props.listType=='e'?'red':'orange'}}>{listEntry[0]}</b> {listEntry[1]}</li>;
            })}
          </ul>
    );
}
<>
<b>Check</b> "{chosenText}"<br/><br/>
<b style={{color:result.errorList.length?'red':'green'}}>{result.errorList.length} error{result.errorList.length==1? '':'s'}</b>{result.errorList.length?':':''}
<RenderList listType='e' />
<b style={{color:result.warningList.length?'orange':'green'}}>{result.warningList.length} warning{result.warningList.length==1? '':'s'}</b>{result.warningList.length?':':''}
<RenderList listType='w' />
</>
```
