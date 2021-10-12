## Basic File Check Sandbox

This `checkTextfileContents()` function can be passed a text and checks for global errors like mismatching punctuation pairs.

Note that it’s not always wise to call this function. If punctuation pairs, etc., are already constrained to, and checked for, in certain fields/parts of the file, then this function may just confuse the user with duplicated warnings.

This generic function returns a list/array of notices, that can then be post-processed to eliminate any warning types that don’t apply to this particular type of field so we don’t flood the user with a lot of false positives.

This demonstration doesn’t display the raw notices, but rather displays the processed and formatted lists of errors and warnings.

```js
// The control code in this box is editable for changing settings—
//    simply click inside here and add, change, or delete text as required.
// Note that (gray) lines starting with // are "comments", i.e., they are ignored by the software
//    so if you want to enable those lines, you must remove the // from the beginning of the line.

import { checkTextfileContents } from './file-text-check';
import { RenderRawResults } from '../demos/RenderProcessedResults';

// Empty, space, good, and bad samples
const textE = "";
const textS = " ";
const textG = `{Peace on Earth, good will to all men/people!
}`;
const textB = `{ Peace  on Earth,,
 good will to all) men! `;

// Just change these next two lines to change the text being used (to demonstrate differing results)
const username = 'unfoldingWord';
const chosenTextName = "textB";
const chosenText = textB;
const checkingOptions = {};

const rawResults = checkTextfileContents(username, 'en', 'TN', 'text', 'Sample', chosenText, 'in '+chosenTextName+' that was supplied', checkingOptions);

// Because we know here that we're only checking one file, we don’t need the filename field in the notices
function deleteFilenameField(notice) { delete notice.filename; return notice; }
rawResults.noticeList = rawResults.noticeList.map(deleteFilenameField);

if (!rawResults.successList || !rawResults.successList.length)
    rawResults.successList = ["Done basic file checks"];

<>
<b>Check</b> "{chosenText}"<br/><br/>
<RenderRawResults results={rawResults} />
</>
```
