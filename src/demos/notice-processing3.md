## Notice Processing 3 Sandbox

### Single colour-graded list

This `processNoticesToSingleList()` function is passed an object that contains a list of success messages (e.g., "Checked GEN", "Checked MAT" type stuff) and a list of notices that each contain a priority number. Using the priorities, it processes the notices into a list of warnings that can be displayed with the priority indicated by the colour/redness of the message.

It should be noted that although the success messages are simple strings, the notices and the returned warning lists are lists/arrays of ARRAYS. This is done to allow the encapsulating software to have more flexibility in how the information is used. See the code documentation for the final details, but in general, the error and warning lists contain eight fields:

1. A priority integer (0..999)
2. The book identifier (if relevant, 3-character UPPERCASE string or empty string)
3. The chapter number (if relevant, string or empty string)
4. The verse number (if relevant, string or empty string, can be a range, e.g., '22-24')
5. The main error/warning message (string)
6. The (zero-based) index of where the error was found on the line. -1 indicates that this field is not helpful/relevant.
7. A text extract (typically 10 characters) centred about the error. An empty string indicates that this field is not helpful/relevant.
8. The location of the error, e.g., "line 2 in file GEN.usfm in unfoldingWord/en_ult repo".

Note below that the optional `processOptions` object allows the user to adjust things like the division point between error and warning priorities, and allows low priority or certain notices to simply be dropped, etc. The system defaults to suppressing multiple cases of similar errors, but this can also be fine-tuned through these parameters.

Although this demonstration here formats and colour the warning list, it's expected that the encapsulating program will format and use the fields as desired. Because they are returned as an array of fields rather than simply strings, it's certainly possible for the encapsulating program to sort or filter the messages as desired.

```js
import { checkTextField } from '../core/field-text-check';
import { processNoticesToSingleList } from './notice-processing-functions';
import { RenderRawResults, RenderObject, RenderSuccessesWarningsGradient } from '../demos/RenderProcessedResults';

// Empty, space, good, and bad, link, and RC text samples
const textE = "";
const textS = " ";
const textG = "Peace on Earth, good will to all men/people!";
const textB = " Peace  on Earth,, good will to all) men! ";
const textL = "https://unfoldingWord.org";
const textRC1 = "rc://en/obs/book/obs/02/03";
const textRC2 = "Compare with rc://en/tw/dict/bible/other/canaan";

// Just change this next two lines to change the text being used (to demonstrate differing results)
const chosenTextName = "textB";
const chosenText = textB;

// The third parameter is "linksAllowed"
const rawResults = checkTextField('Sample', chosenText, false, 'in '+chosenTextName+' that was supplied');
if (!rawResults.successList || !rawResults.successList.length)
    rawResults.successList = ["Done basic text checks"];
const processOptions = {
    // Uncomment any of these to test them
    // 'maximumSimilarMessages': 3, // default is 2
    // 'cutoffPriorityLevel': 200, // default is 0
    // 'sortBy': 'ByPriority', // default is 'AsFound'
    // 'ignorePriorityNumberList': [123, 202], // default is []
};
const processedResults = processNoticesToSingleList(rawResults, processOptions);

<>
<b>Check</b> "{chosenText}"<br/><br/>
<RenderRawResults results={rawResults} />
<br/>Which after processing{Object.keys(processOptions).length? <> using <b>processOptions</b><RenderObject thisObject={processOptions} /></>:''} then becomes:<br/><br/>
<RenderSuccessesWarningsGradient results={processedResults} />
</>
```
