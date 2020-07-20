## Plain Text Check Sandbox

This function checks the given text for typical formatting errors.

It returns a list of success messages and a list of prioritised notice components.

The notices are then processed into a list of errors and a list of warnings for display.

```js
import checkPlainText from './plain-text-check.js';
import processNotices from './notice-handling-functions';
import { RenderLines, RenderSuccessesErrorsWarnings } from '../components/RenderProcessedResults';

// Plain text samples
const textSG = `Short Good Plain Test

This is a paragraph.

Second level heading

Another paragraph.

  List item 1
  List item 2
`;
const textSB = `Short Ba,d Plain Test

This should be a  paragraph.

First level heading

Another  paragraph.

  List item 1
   List item 2
`;

// You can choose any of the above texts here
//  (to demonstrate differing results)
const chosenText = textSB;
const chosenName = 'textSB';

let rawResult = checkPlainText(chosenName, chosenText, 'that was supplied');
rawResult.successList = ["Done plain text checks"];
const processedResult = processNotices(rawResult);

<>
<b>Source (normalized)</b> <RenderLines text={chosenText} />
<RenderSuccessesErrorsWarnings results={processedResult} />
</>
```
