## Markdown Text Check Sandbox

This function checks the given markdown-formatted text for typical formatting errors.

It returns a list of success messages and a list of prioritised notice components.

The notices are then processed into a list of errors and a list of warnings for display.

```js
import Markdown from 'react-markdown'
import checkMarkdownText from './markdown-text-check';
import processNotices from './notice-processing-functions';
import { RenderLines, RenderSuccessesErrorsWarnings } from '../components/RenderProcessedResults';

// Markdown text samples
const textSG = `# Short Good Markdown Test

This is a paragraph.

## Second level heading

Another paragraph.

  * List item 1
  * List item 2
`;
const textSB = `### Short Bad Markdown Test
This should be a paragraph.

# First level heading

Another  paragraph.

  * List item 1
   * List item 2
`;

// You can choose any of the above texts here
//  (to demonstrate differing results)
const chosenText = textSB;
const chosenName = 'textSB';

let rawResult = checkMarkdownText(chosenName, chosenText, 'that was supplied');
if (!rawResult.successList || !rawResult.successList.length)
  rawResult.successList = ["Done markdown text checks"];
const processedResult = processNotices(rawResult);

<>
<b>Raw Markdown (but normalized)</b> <RenderLines text={chosenText} />
<b>Formatted Text</b> <Markdown source={chosenText} />
<RenderSuccessesErrorsWarnings results={processedResult} />
</>
```
