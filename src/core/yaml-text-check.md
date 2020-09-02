## YAML Text Check Sandbox

This function checks the given yaml file for typical formatting errors.

It returns a list of success messages and a list of notice components. (There is always a priority number in the range 0..999 and the main message string, as well as other helpful details as relevant.)

These raw notice components can then be filtered and/or sorted as required by the calling program, and then divided into a list of errors and a list of warnings or whatever as desired.

Note that we have a more specialised function for checking `manifest.yaml` files.

```js
import checkYAMLText from './yaml-text-check';
import { RenderLines, RenderRawResults } from '../demos/RenderProcessedResults';

// YAML empty, good and bad text samples
const textE = '';
const textG1 = `dublin_core:
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
const textB = `dublin_core:
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
const textG2 = `resource:
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

// You can choose any of the above texts here
//  (to demonstrate differing results)
const chosenText = textG2;
const chosenTextName = 'textG2';

const rawResults = checkYAMLText(chosenTextName, chosenText, 'in YAML data that was supplied');

<>
<b>YAML contents</b>: <RenderLines text={chosenText} />
<RenderRawResults results={rawResults} />
</>
```
