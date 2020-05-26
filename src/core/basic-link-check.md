## Basic Link Field Check Sandbox

This function is for checking fields that are links, or that contain links.

```js
import doBasicLinkChecks from './link-checks.js';

// Empty, space, link, RC, good, and bad text samples
const textE = "";
const textS = " ";
const textL = "https://unfoldingWord.org";
const textRC1 = "rc://en/obs/book/obs/02/03";
const textRC2 = "rc://en/tw/dict/bible/other/canaan";
const textMD1 = "Have a look [here](https://unfoldingWord.org/)!";
const textMD2 = " Look at [[http://unfoldingWord.org]] ";

// Easy for user to change text used in next line (to demonstrate differing results)
const chosenText = textMD2;

const linkOptions = {
    expectedCount: 2, // 0 = all links optional
    allowedCount: 1, // 0 = no limit
    otherTextAllowed: true, // if false, field is just the link only
    linkTypesAllowed: ['RC', 'md', 'naked',],
    checkTargets: true, // Attempt to retrieve the link(s) -- slows it down
};

const result = doBasicLinkChecks('Sample', chosenText, linkOptions, 'that was supplied');

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
{result.errorList.length} error{result.errorList.length==1? '':'s'}{result.errorList.length?':':''}
<RenderList listType='e' />
{result.warningList.length} warning{result.warningList.length==1? '':'s'}{result.warningList.length?':':''}
<RenderList listType='w' />
</>
```
