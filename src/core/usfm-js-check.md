## USFM-JS Convert Check Sandbox

This function simply packages the [USFM-JS converter](https://www.npmjs.com/package/usfm-js) and runs it on the given USFM snippet just for our testing.

This might be removed again if it's not at all helpful.

Our packaged function returns a list of success messages and a list of (prioritised) notice components.

The notices are then processed into a list of errors and a list of warnings for display.

```js
import checkUSFMToJSON from './usfm-js-check';
import processNoticesToErrorsWarnings from './notice-processing-functions';
import { RenderLines, RenderSuccessesErrorsWarnings } from '../components/RenderProcessedResults';

// USFM samples
const textS = `\\id GEN Short test
\\usfm 3.0
\\h Genesis
\\mt Genesis
\\c 1
\\s5 My first heading
\\p
\\v 1 This is the first and last verse
`;

const textG = `\\id GEN EN_ULT en_English_ltr unfoldingWord Literal Text Thu Jul 25 2019 09:33:56 GMT-0400 (EDT) tc
\\usfm 3.0
\\ide UTF-8
\\h Genesis
\\toc1 The Book of Genesis
\\toc2 Genesis
\\toc3 Gen
\\mt Genesis

\\s5
\\c 1
\\p
\\v 1 In the beginning, God created the heavens and the earth.
\\v 2 The earth was without form and empty. Darkness was upon the surface of the deep. The Spirit of God was moving above the surface of the waters.
\\s5
\\v 3 God said, “Let there be light,” and there was light.
\\v 4 God saw the light, that it was good. He divided the light from the darkness.
\\v 5 God called the light “day,” and the darkness he called “night.” This was evening and morning, the first day.

\\ts\\*
\\p
\\v 6 God said, “Let there be an expanse between the waters, and let it divide the waters from the waters.”
\\v 7 God made the expanse and divided the waters which were under the expanse from the waters which were above the expanse. It was so.
\\v 8 God called the expanse “sky.” This was evening and morning, the second day.
`;

const textH = `\\id RUT unfoldingWord® Hebrew Bible
\\usfm 3.0
\\ide UTF-8
\\h Ruth
\\toc1 The Book of Ruth
\\toc2 Ruth
\\toc3 Rut
\\mt Ruth

\\c 1
\\p

\\v 1
\\w וַיְהִ֗י|lemma="הָיָה" strong="c:H1961" x-morph="He,C:Vqw3ms"\\w*
\\w בִּימֵי֙|lemma="יוֹם" strong="b:H3117" x-morph="He,R:Ncmpc"\\w*
\\w שְׁפֹ֣ט|lemma="שָׁפַט" strong="H8199" x-morph="He,Vqc"\\w*
\\w הַשּׁפְטִ֔ים|lemma="שָׁפַט" strong="d:H8199" x-morph="He,Td:Vqrmpa" x-tw="rc://*/tw/dict/bible/kt/judge"\\w*
\\w וַיְהִ֥י|lemma="הָיָה" strong="c:H1961" x-morph="He,C:Vqw3ms"\\w*
\\w רָעָ֖ב|lemma="רָעָב" strong="H7458" x-morph="He,Ncmsa" x-tw="rc://*/tw/dict/bible/other/famine"\\w*
\\w בָּאָ֑רֶץ|lemma="אֶרֶץ" strong="b:H0776" x-morph="He,Rd:Ncbsa"\\w*
\\w וַיֵּלֶךְ|lemma="יָלַךְ" strong="c:H3212" x-morph="He,C:Vqw3ms"\\w*
\\w אִ֜ישׁ|lemma="אִישׁ" strong="H0376" x-morph="He,Ncmsa"\\w*
\\k-s | x-tw="rc://*/tw/dict/bible/names/bethlehem"\\*\\w מִבֵּית|lemma="בֵּית לֶחֶם" strong="m:H1035" x-morph="He,R:Np"\\w*
\\w לֶ֣חֶם|lemma="בֵּית לֶחֶם" strong="H1035" x-morph="He,Np"\\w*
\\k-e\\*
\\w יְהוּדָ֗ה|lemma="יְהוּדָה" strong="H3063" x-morph="He,Np" x-tw="rc://*/tw/dict/bible/names/judah"\\w*
\\w לָגוּר֙|lemma="גּוּר" strong="l:H1481a" x-morph="He,R:Vqc"\\w*
\\w בִּשְׂדֵ֣י|lemma="שָׂדֶה" strong="b:H7704b" x-morph="He,R:Ncmpc"\\w*
\\w מוֹאָ֔ב|lemma="מוֹאָב" strong="H4124" x-morph="He,Np" x-tw="rc://*/tw/dict/bible/names/moab"\\w*
\\w ה֥וּא|lemma="הוּא" strong="H1931" x-morph="He,Pp3ms"\\w*
\\w וְאִשְׁתּ֖וֹ|lemma="אִשּׁה" strong="c:H0802" x-morph="He,C:Ncfsc:Sp3ms"\\w*
\\w וּשְׁנֵ֥י|lemma="שְׁנַיִם" strong="c:H8147" x-morph="He,C:Acmdc"\\w*
\\w בָנָֽיו|lemma="בֵּן" strong="H1121a" x-morph="He,Ncmpc:Sp3ms" x-tw="rc://*/tw/dict/bible/kt/son"\\w*׃

\\v 2
\\w וְשֵׁם|lemma="שֵׁם" strong="c:H8034" x-morph="He,C:Ncmsc" x-tw="rc://*/tw/dict/bible/kt/name"\\w*
\\w הָאִ֣ישׁ|lemma="אִישׁ" strong="d:H0376" x-morph="He,Td:Ncmsa"\\w*
\\w אֱֽלִימֶ֡לֶךְ|lemma="אֱלִימֶלֶךְ" strong="H0458" x-morph="He,Np"\\w*
\\w וְשֵׁם֩|lemma="שֵׁם" strong="c:H8034" x-morph="He,C:Ncmsc" x-tw="rc://*/tw/dict/bible/kt/name"\\w*
\\w אִשְׁתּ֨וֹ|lemma="אִשּׁה" strong="H0802" x-morph="He,Ncfsc:Sp3ms"\\w*
\\w נָעֳמִ֜י|lemma="נׇעֳמִי" strong="H5281" x-morph="He,Np"\\w*
\\w וְשֵׁם|lemma="שֵׁם" strong="c:H8034" x-morph="He,C:Ncmsc" x-tw="rc://*/tw/dict/bible/kt/name"\\w*
\\w שְׁנֵֽי|lemma="שְׁנַיִם" strong="H8147" x-morph="He,Acmdc"\\w*־\\w בָנָ֣יו|lemma="בֵּן" strong="H1121a" x-morph="He,Ncmpc:Sp3ms" x-tw="rc://*/tw/dict/bible/kt/son"\\w* ׀
\\w מַחְל֤וֹן|lemma="מַחְלוֹן" strong="H4248" x-morph="He,Np"\\w*
\\w וְכִלְיוֹן֙|lemma="כִּלְיוֹן" strong="c:H3630" x-morph="He,C:Np"\\w*
\\w אֶפְרָתִ֔ים|lemma="אֶפְרָתִי" strong="H0673" x-morph="He,Ngmpa" x-tw="rc://*/tw/dict/bible/names/ephrathah"\\w*
\\k-s | x-tw="rc://*/tw/dict/bible/names/bethlehem"\\*\\w מִבֵּית|lemma="בֵּית לֶחֶם" strong="m:H1035" x-morph="He,R:Np"\\w*
\\w לֶ֖חֶם|lemma="בֵּית לֶחֶם" strong="H1035" x-morph="He,Np"\\w*
\\k-e\\*
\\w יְהוּדָ֑ה|lemma="יְהוּדָה" strong="H3063" x-morph="He,Np" x-tw="rc://*/tw/dict/bible/names/judah"\\w*
\\w וַיָּבֹ֥אוּ|lemma="בּוֹא" strong="c:H0935" x-morph="He,C:Vqw3mp"\\w*
\\w שְׂדֵי|lemma="שָׂדֶה" strong="H7704b" x-morph="He,Ncmpc"\\w*־\\w מוֹאָ֖ב|lemma="מוֹאָב" strong="H4124" x-morph="He,Np" x-tw="rc://*/tw/dict/bible/names/moab"\\w*
\\w וַיִּהְיוּ|lemma="הָיָה" strong="c:H1961" x-morph="He,C:Vqw3mp"\\w*־\\w שָׁם|lemma="שָׁם" strong="H8033" x-morph="He,D"\\w*׃
`;

const textULT = `\\id RUT EN_ULT en_English_ltr Tue Mar 03 2020 16:27:33 GMT+0200 (SAST) tc
\\usfm 3.0
\\ide UTF-8
\\h Ruth
\\toc1 The Book of Ruth
\\toc2 Ruth
\\toc3 Rut
\\mt Ruth

\\ts\\*
\\c 1
\\p
\\v 1 \\zaln-s | x-strong="c:H1961" x-lemma="הָיָה" x-morph="He,C:Vqw3ms" x-occurrence="1" x-occurrences="1" x-content="וַיְהִ֗י"\\*\\w Now|x-occurrence="1" x-occurrences="1"\\w*
\\w it|x-occurrence="1" x-occurrences="1"\\w*
\\w happened|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="b:H3117" x-lemma="יוֹם" x-morph="He,R:Ncmpc" x-occurrence="1" x-occurrences="1" x-content="בִּימֵי֙"\\*\\w in|x-occurrence="1" x-occurrences="3"\\w*
\\w the|x-occurrence="1" x-occurrences="5"\\w*
\\w days|x-occurrence="1" x-occurrences="1"\\w*
\\w of|x-occurrence="1" x-occurrences="4"\\w*\\zaln-e\\*
\\zaln-s | x-strong="H8199" x-lemma="שָׁפַט" x-morph="He,Vqc" x-occurrence="1" x-occurrences="1" x-content="שְׁפֹ֣ט"\\*\\w the|x-occurrence="2" x-occurrences="5"\\w*
\\w ruling|x-occurrence="1" x-occurrences="1"\\w*
\\w of|x-occurrence="2" x-occurrences="4"\\w*\\zaln-e\\*
\\zaln-s | x-strong="d:H8199" x-lemma="שָׁפַט" x-morph="He,Td:Vqrmpa" x-occurrence="1" x-occurrences="1" x-content="הַשּׁפְטִ֔ים"\\*\\w the|x-occurrence="3" x-occurrences="5"\\w*
\\w judges|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="c:H1961" x-lemma="הָיָה" x-morph="He,C:Vqw3ms" x-occurrence="1" x-occurrences="1" x-content="וַיְהִ֥י"\\*\\w that|x-occurrence="1" x-occurrences="1"\\w*
\\w there|x-occurrence="1" x-occurrences="1"\\w*
\\w was|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="H7458" x-lemma="רָעָב" x-morph="He,Ncmsa" x-occurrence="1" x-occurrences="1" x-content="רָעָ֖ב"\\*\\w a|x-occurrence="1" x-occurrences="2"\\w*
\\w famine|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="b:H0776" x-lemma="אֶרֶץ" x-morph="He,Rd:Ncbsa" x-occurrence="1" x-occurrences="1" x-content="בָּאָ֑רֶץ"\\*\\w in|x-occurrence="2" x-occurrences="3"\\w*
\\w the|x-occurrence="4" x-occurrences="5"\\w*
\\w land|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.
\\zaln-s | x-strong="c:H3212" x-lemma="יָלַךְ" x-morph="He,C:Vqw3ms" x-occurrence="1" x-occurrences="1" x-content="וַיֵּלֶךְ"\\*\\w And|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="H0376" x-lemma="אִישׁ" x-morph="He,Ncmsa" x-occurrence="1" x-occurrences="1" x-content="אִ֜ישׁ"\\*\\w a|x-occurrence="2" x-occurrences="2"\\w*
\\w certain|x-occurrence="1" x-occurrences="1"\\w*
\\w man|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="m:H1035" x-lemma="בֵּית לֶחֶם" x-morph="He,R:Np" x-occurrence="1" x-occurrences="1" x-content="מִבֵּית"\\*\\zaln-s | x-strong="H1035" x-lemma="בֵּית לֶחֶם" x-morph="He,Np" x-occurrence="1" x-occurrences="1" x-content="לֶ֣חֶם"\\*\\w from|x-occurrence="1" x-occurrences="1"\\w*
\\w Bethlehem|x-occurrence="1" x-occurrences="1"\\w*
\\w of|x-occurrence="3" x-occurrences="4"\\w*\\zaln-e\\*\\zaln-e\\*
\\zaln-s | x-strong="H3063" x-lemma="יְהוּדָה" x-morph="He,Np" x-occurrence="1" x-occurrences="1" x-content="יְהוּדָ֗ה"\\*\\w Judah|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="c:H3212" x-lemma="יָלַךְ" x-morph="He,C:Vqw3ms" x-occurrence="1" x-occurrences="1" x-content="וַיֵּלֶךְ"\\*\\w went|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="l:H1481a" x-lemma="גּוּר" x-morph="He,R:Vqc" x-occurrence="1" x-occurrences="1" x-content="לָגוּר֙"\\*\\w to|x-occurrence="1" x-occurrences="1"\\w*
\\w live|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="b:H7704b" x-lemma="שָׂדֶה" x-morph="He,R:Ncmpc" x-occurrence="1" x-occurrences="1" x-content="בִּשְׂדֵ֣י"\\*\\w in|x-occurrence="3" x-occurrences="3"\\w*
\\w the|x-occurrence="5" x-occurrences="5"\\w*
\\w fields|x-occurrence="1" x-occurrences="1"\\w*
\\w of|x-occurrence="4" x-occurrences="4"\\w*\\zaln-e\\*
\\zaln-s | x-strong="H4124" x-lemma="מוֹאָב" x-morph="He,Np" x-occurrence="1" x-occurrences="1" x-content="מוֹאָ֔ב"\\*\\w Moab|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*,
\\zaln-s | x-strong="H1931" x-lemma="הוּא" x-morph="He,Pp3ms" x-occurrence="1" x-occurrences="1" x-content="ה֥וּא"\\*\\w he|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="c:H0802" x-lemma="אִשּׁה" x-morph="He,C:Ncfsc:Sp3ms" x-occurrence="1" x-occurrences="1" x-content="וְאִשְׁתּ֖וֹ"\\*\\w and|x-occurrence="1" x-occurrences="2"\\w*
\\w his|x-occurrence="1" x-occurrences="2"\\w*
\\w wife|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="c:H8147" x-lemma="שְׁנַיִם" x-morph="He,C:Acmdc" x-occurrence="1" x-occurrences="1" x-content="וּשְׁנֵ֥י"\\*\\w and|x-occurrence="2" x-occurrences="2"\\w*\\zaln-e\\*
\\zaln-s | x-strong="H1121a" x-lemma="בֵּן" x-morph="He,Ncmpc:Sp3ms" x-occurrence="1" x-occurrences="1" x-content="בָנָֽיו"\\*\\w his|x-occurrence="2" x-occurrences="2"\\w*\\zaln-e\\*
\\zaln-s | x-strong="c:H8147" x-lemma="שְׁנַיִם" x-morph="He,C:Acmdc" x-occurrence="1" x-occurrences="1" x-content="וּשְׁנֵ֥י"\\*\\w two|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s | x-strong="H1121a" x-lemma="בֵּן" x-morph="He,Ncmpc:Sp3ms" x-occurrence="1" x-occurrences="1" x-content="בָנָֽיו"\\*\\w sons|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.
`;

const textB = `\\id GEN Bad USFM test
\\usfm 4.0
\\h Genesis
\\mt Genesis
\\c 7
\\s5 My  first  heading
\\v3 This is the first and last verse::
\\v
\\c 8a
\\v 1b Hello
\\v 1-3 Bad overlap
\\v 2 Not good here
`;

// You can choose any of the above texts here
//  (to demonstrate differing results)
const chosenName = 'textH';
const chosenText = textH;

const rawResult = checkUSFMToJSON(chosenName, chosenText, 'that was supplied');
const processedResult = processNoticesToErrorsWarnings(rawResult);

<>
<b>Check</b><RenderLines text={chosenText} />
<RenderSuccessesErrorsWarnings results={processedResult} />
</>
```
