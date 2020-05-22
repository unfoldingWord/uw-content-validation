## Basic Text Field Check Sandbox

This non-component function can also have a playground to test it out.

```js
import doBasicTextChecks from './basic-text-check.js';

// Empty, space, link, RC, good, and bad text samples
const textE = "";
const textS = " ";
const textL = "https://unfoldingWord.org";
const textRC1 = "rc://en/obs/book/obs/02/03";
const textRC2 = "rc://en/tw/dict/bible/other/canaan";
const textG = "Peace on Earth, good will to all men/people!";
const textB = " Peace  on Earth,, good will to all) men! ";

// Easy for user to change text used in next line (to demonstrate differing results)
const chosenText = textRC1;

const result = doBasicTextChecks('Sample', chosenText, 'that was supplied');

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

## TSV Table Line Check Sandbox

This non-component function can also have a playground to test it out.

```js
import checkTN_TSVDataRow from './table-line-check.js';

// Empty, Header, Nonsense, Good, Bad, and Very bad line samples
const lineE = "";
const lineH = "Book	Chapter	Verse	ID	SupportReference	OrigQuote	Occurrence	GLQuote	OccurrenceNote";
const lineN = "Peace on Earth, good will to all men/people!";
const lineG = "GEN\t2\t3\tw3r5\t\t\t1\t\tThis is an  optional note";
const lineB1 = "EXO\t2\t3\tw3r5\t\t\t1\t\t<br>Boo";
const lineB2 = "GEN\t99\t3\tw3r5\t\t\t1\t\t Boo";
const lineB3 = "GEN\t2\tboo\tw3r5\t\t\t1\t\tNote3";
const lineB4 = "GEN\t2\t3\tw3r5q\t\t\t1\t\tNote4";
const lineB5 = "GEN\t2\t3\tw3r5\tLaugh\t\t1\t\tNote5";
const lineB6 = "GEN\t2\t3\tw3r5\t\tCan't remember\t1\t\tNote6";
const lineB7 = "GEN\t2\t3\tw3r5\t\t\t17\t\tNote7";
const lineB8 = "GEN\t2\t3\tw3r5\t\t\t1\tBad ellipse...\tNote8";
const lineB9 = "GEN\t2\t3\tw3r5\t\t\t1\t\t<br>Boo hoo,, lost my shoe !";
const lineV = "GIN\t200\tv\tW-3r5\tLaugh\t\t17\tBad ellipse...\t<br>Boo hoo,,<br> lost my shoe !";

const chosenLine = lineV;

// Easy for user to change line used as parameter below
//  (to demonstrate differing results)
const result = checkTN_TSVDataRow('GEN', chosenLine, 'that was supplied');

function RenderList(props) {
    // Display our list of 2-part lists in a nicer format
    // Uses 'result' object from outer scope
    const myList = props.listType=='e'? result.errorList : result.warningList;
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
