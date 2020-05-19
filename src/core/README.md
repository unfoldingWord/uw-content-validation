## Basic Text Field Check Sandbox

This non-component function can also have a playground to test it out
(although the output format is not really intended for users).

```js
import doBasicTextChecks from './basic-text-check.js';

const text  = " Peace  on Earth,, good will to men! ";
const result = doBasicTextChecks('Sample', text, 'that was supplied');
<>
{result.errorList.length} errors: {result.errorList}<br/>
{result.warningList.length} warnings: {result.warningList}
</>
```
