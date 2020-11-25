## Manifest Text Check Sandbox

This function checks the given manifest.yaml for typical formatting errors. See https://resource-container.readthedocs.io/en/latest/manifest.html for the manifest specification.

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other details to help locate the error as available.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

```js
// The code in this box is editable for changing settings—
//        Simply click inside here and add, change, or delete text as required.

import React, { useState, useEffect } from 'react';
import { checkManifestText } from './manifest-text-check';
import { RenderLines, RenderRawResults } from '../demos/RenderProcessedResults';

// Manifest empty, good and bad text samples
const textE = '';
const textG = `dublin_core:
  conformsto: 'rc0.2'
  contributor:
    - 'Jesse Griffin, BA Biblical Studies, MA Biblical Languages'
    - 'Larry Sallee, Th.M Dallas Theological Seminary, D.Min. Columbia Biblical Seminary'
    - 'Door43 World Missions Community'
  creator: 'unfoldingWord'
  description: "An open-licensed update of the ASV, intended to provide a 'form-centric' understanding of the Bible. It increases the translator's understanding of the lexical and grammatical composition of the underlying text by adhering closely to the word order and structure of the originals."
  format: 'text/usfm3'
  identifier: 'ult'
  issued: '2020-03-25'
  language:
    direction: 'ltr'
    identifier: 'en'
    title: 'English'
  modified: '2020-03-25'
  publisher: 'unfoldingWord'
  relation:
    - 'en/tw'
    - 'en/tq'
    - 'en/tn'
  rights: 'CC BY-SA 4.0'
  source:
    -
      identifier: 'asv'
      language: 'en'
      version: '1901'
    -
      identifier: 'ugnt'
      language: 'el-x-koine'
      version: '0.12'
    -
      identifier: 'uhb'
      language: 'hbo'
      version: '2.1.12'
  subject: 'Aligned Bible'
  title: 'unfoldingWord® Literal Text'
  type: 'bundle'
  version: '10'

checking:
  checking_entity:
    - 'unfoldingWord'
  checking_level: '3'

projects:

  -
    title: 'Genesis'
    versification: 'ufw'
    identifier: 'gen'
    sort: 1
    path: './01-GEN.usfm'
    categories: [ 'bible-ot'  ]

  -
    title: 'Exodus'
    versification: 'ufw'
    identifier: 'exo'
    sort: 2
    path: './02-EXO.usfm'
    categories: [ 'bible-ot'  ]

  -
    title: 'Zechariah'
    versification: 'ufw'
    identifier: 'zec'
    sort: 38
    path: './38-ZEC.usfm'
    categories: [ 'bible-ot' ]

  -
    title: 'Malachi'
    versification: 'ufw'
    identifier: 'mal'
    sort: 39
    path: './39-MAL.usfm'
    categories: [ 'bible-ot' ]

  -
    title: 'Matthew'
    versification: 'ufw'
    identifier: 'mat'
    sort: 40
    path: './41-MAT.usfm'
    categories: [ 'bible-nt' ]

  -
    title: 'Jude'
    versification: 'ufw'
    identifier: 'jud'
    sort: 65
    path: './66-JUD.usfm'
    categories: [ 'bible-nt' ]

  -
    title: 'Revelation'
    versification: 'ufw'
    identifier: 'rev'
    sort: 66
    path: './67-REV.usfm'
    categories: [ 'bible-nt' ]
`;
const textB1 = `dublin_core:
  conformsto: 'rc0.2'
  contributor:
    - 'Jesse Griffin, BA Biblical Studies, MA Biblical Languages'
    - 'Larry Sallee, Th.M Dallas Theological Seminary, D.Min. Columbia Biblical Seminary'
    - 'Door43 World Missions Community'
  creator: 'unfoldingWord'
  description: "An open-licensed update of the ASV, intended to provide a 'form-centric' understanding of the Bible. It increases the translator's understanding of the lexical and grammatical composition of the underlying text by adhering closely to the word order and structure of the originals."
  format: 'text/usfm3'
  identifier: 'ult'
  issued: '2020-03-25'
  language:
    direction: 'ltr'
    identifier: 'en'
    title: 'English'
  modified: '2020-03-25'
  publisher: 'unfoldingWord'
  relation:
    - 'en/tw'
    - 'en/tq'
    - 'en/tn'
  rights: 'CC BY-SA 4.0'
  source:
    -
      identifier: 'asv'
      language: 'en'
      version: '1901'
    -
      identifier: 'ugnt'
      language: 'el-x-koine'
      version: '0.12'
    -
      identifier: 'uhb'
      language: 'hbo'
      version: '2.1.12'
  subject: 'Aligned Bible'
  title: 'unfoldingWord® Literal Text'
  type: 'bundle'
  version: '10'

checking:
  checking_entity:
    - 'unfoldingWord'
  checking_level: '3'

projects:

  =
    title: 'Genesis'
    versification: 'ufw'
    identifier: 'gen'
    sort: 1
    path: './01-GEN.usfm'
    categories: [ 'bible-ot'  ]

  -
    title 'Revelation'
    versification: 'ufw'
    identifier: 'rev'
    sort: 66
    path: './67-REV.usfm'
    categories: [ 'bible-nt' ]
`;
// This is an extract from a media.yaml file:
const textB2 = `resource:
  version: '{latest}'
  media:
    -
     identifier: 'pdf'
     version: '{latest}'
     contributor: []
     url: 'https://cdn.door43.org/en/ult/v{latest}/pdf/en_ult_v{latest}.pdf'

projects:
  -
    identifier: 'gen'
    version: '{latest}'
    media:
      -
       identifier: 'pdf'
       version: '{latest}'
       contributor: []
       url: 'https://cdn.door43.org/en/ult/v{latest}/pdf/en_ult_01-GEN_v{latest}.pdf'

  -
    identifier: 'rev'
    version: '{latest}'
    media:
      -
       identifier: 'pdf'
       version: '{latest}'
       contributor: []
       url: 'https://cdn.door43.org/en/ult/v{latest}/pdf/en_ult_67-REV_v{latest}.pdf'
`;

const data = {
  // You can choose any of the above lines here
  //  (to demonstrate differing results)
  chosenTextName : 'textG',
  chosenText : textG,
  languageCode : 'en',
  givenLocation : "that was supplied",
}

function CheckManifestText(props) {
  const { languageCode, chosenText, chosenTextName, givenLocation } = props.data;

  const [results, setResults] = useState(null);

  // We need the following construction because checkTN_TSVDataRow is an ASYNC function
  useEffect(() => {
    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // Display our "waiting" message
      setResults(<p style={{ color: 'magenta' }}>Checking {chosenTextName}…</p>);
      const optionalCheckingOptions = {};
      const rawResults = await checkManifestText('', '', chosenText, 'in manifest data that was supplied', optionalCheckingOptions);
      if (!rawResults.successList || !rawResults.successList.length)
        rawResults.successList = ["Done manifest text checks"];
      setResults(
        <div>
          <b>Check</b> {chosenTextName}: "{chosenText.substr(0,256)}…"<br/><br/>
          // <b>Manifest contents</b>: <RenderLines text={chosenText} />
          <RenderRawResults results={rawResults} />
        </div>
      );
    })(); // end of async part in unnamedFunction
  }, []); // end of useEffect part

  return results;
} // end of CheckManifestText function

<CheckManifestText data={data}/>
```
