## Basic Text Field Check Sandbox

This non-component function can also have a playground to test it out.

```js
import doBasicTextChecks from './basic-text-check.js';

// Empty, space, good, and bad text samples
const textE = "";
const textS = " ";
const textG = "Peace on Earth, good will to all men/people!";
const textB = " Peace  on Earth,, good will to all) men! ";

const result = doBasicTextChecks('Sample', textB, 'that was supplied');

function RenderList(props) {
    console.log("props", JSON.stringify(props));
    let myList = props.listType=="e"? result.errorList : result.warningList;
    return ( <ul>
            {myList.map(function(listEntry){
                return <li><b>{listEntry[0]}</b> {listEntry[1]}</li>;
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

// Empty, Header, Nonsense, Good, and Bad line samples
const lineE = "";
const lineH = "Book	Chapter	Verse	ID	SupportReference	OrigQuote	Occurrence	GLQuote	OccurrenceNote";
const lineN = "Peace on Earth, good will to all men/people!";
const lineG = "GEN\t2\t3\tw3r5\t\t\t1\t\tThis is an  optional note";
const lineB1 = "EXO\t2\t3\tw3r5\t\t\t1\t\t<br>Boo";
const lineB2 = "GEN\t99\t3\tw3r5\t\t\t1\t\t Boo";
const lineB3 = "GEN\t2\tboo\tw3r5\t\t\t1\t\tNote3";
const lineB4 = "GEN\t2\t3\tw3r5q\t\t\t1\t\tNote4";
const lineB5 = "GEN\t2\t3\tw3r5\t\t\t1\t\tNote5";
const lineB6 = "GEN\t2\t3\tw3r5\t\t\t1\t\tNote6";
const lineB7 = "GEN\t2\t3\tw3r5\t\t\t1\t\tNote7";
const lineB8 = "GEN\t2\t3\tw3r5\t\t\t1\t\tNote8";
const lineB9 = "GEN\t2\t3\tw3r5\t\t\t1\t\t<br>Boo hoo,, lost my shoe !";

const result = checkTN_TSVDataRow('GEN', lineB4, 'that was supplied');

function RenderList(props) {
    console.log("props", JSON.stringify(props));
    let myList = props.listType=="e"? result.errorList : result.warningList;
    return ( <ul>
            {myList.map(function(listEntry){
                return <li><b>{listEntry[0]}</b> {listEntry[1]}</li>;
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
