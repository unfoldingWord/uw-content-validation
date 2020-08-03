## Notice Processing 1 Sandbox

### Error and Warning lists

This `processNoticesToErrorsWarnings()` function is passed an object that contains a list of success messages (e.g., "Checked GEN", "Checked MAT" type stuff) and a list of notices that each contain a priority number. Using the priorities, it processes the notices into a list of errors and a list of warnings.

It should be noted that although the success messages are simple strings, the notices and the returned error and warning lists are lists/arrays of ARRAYS. This is done to allow the encapsulating software to have more flexibility in how the information is used. See the code documentation for the final details, but in general, the error and warning lists contain eight fields:

1. A priority integer (0..999) -- usually 700+ are errors, under 700 are warnings.
2. The book code (if relevant, 3-letter UPPERCASE string or empty string)
3. The chapter number (if relevant, string or empty string)
4. The verse number (if relevant, string or empty string, can be a range, e.g., '22-24')
5. The main error/warning message (string)
6. The (zero-based) index of where the error was found on the line. -1 indicates that this field is not helpful/relevant.
7. A text extract (typically 10 characters) centred about the error. An empty string indicates that this field is not helpful/relevant.
8. The location of the error, e.g., "line 2 in file GEN.usfm in unfoldingWord/en_ult repo".

Note below that the optional `processOptions` object allows the user to adjust things like the division point between error and warning priorities, and allows low priority or certain notices to simply be dropped, etc. The system defaults to suppressing multiple cases of similar errors, but this can also be fine-tuned through these parameters.

Although this demonstration here formats and colours the error and warning lists, it's expected that the encapsulating program will format and use the fields as desired. Because they are returned as an array of fields rather than simply strings, it's certainly possible for the encapsulating program to sort or filter the messages as desired.

```js
import doBasicTextChecks from './basic-text-check';
import { processNoticesToErrorsWarnings } from './notice-processing-functions';
import { RenderRawNotices, RenderSettings, RenderSuccessesErrorsWarnings } from '../components/RenderProcessedResults';

// Empty, space, good, and bad, link, and RC text samples
const textE = "";
const textS = " ";
const textG = "Peace on Earth, good will to all men/people!";
const textB = " Peace  on Earth,, good will to all) men! ";
const textL = "https://unfoldingWord.org";
const textRC1 = "rc://en/obs/book/obs/02/03";
const textRC2 = "Compare with rc://en/tw/dict/bible/other/canaan";

// Just change this next two lines to change the text being used (to demonstrate differing results)
const chosenName = "textB";
const chosenText = textB;

// The third parameter is "linksAllowed"
const rawResult = doBasicTextChecks('Sample', chosenText, false, 'in '+chosenName+' that was supplied');
if (!rawResult.successList || !rawResult.successList.length)
    rawResult.successList = ["Done basic text checks"];
const processOptions = {
    // Uncomment any of these to test them
    // 'maximumSimilarMessages': 3, // default is 2
    // 'errorPriorityLevel': 600, // default is 700
    // 'cutoffPriorityLevel': 200, // default is 0
    // 'sortBy': 'ByPriority', // default is 'AsFound'
    // 'ignorePriorityNumberList': [123, 202], // default is []
};
const processedResult = processNoticesToErrorsWarnings(rawResult, processOptions);

<>
<b>Check</b> "{chosenText}"<br/><br/>
<RenderRawNotices results={rawResult} />
<p>Which after processing{Object.keys(processOptions).length? <> using <b>processOptions</b><RenderSettings settings={processOptions} /></>:''} then becomes:</p>
<RenderSuccessesErrorsWarnings results={processedResult} />
</>
```
