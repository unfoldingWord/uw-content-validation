/* eslint-env jest */

import { extractTextFromComplexUSFM } from '../core/usfm-helpers';

// These are just very short tests to make sure that the USFM helper functions run


describe('check_USFM_Helpers() - ', () => {
  it('Should pass', async () => { // Don't know how to change from async
    const usfmSnippet = `\\ts\\*
\\v 25 \\zaln-s |x-strong="G20680" x-lemma="ἐσθίω" x-morph="Gr,V,MPA2,,P," x-occurrence="1" x-occurrences="1" x-content="ἐσθίετε"\\*\\w Eat|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G39560" x-lemma="πᾶς" x-morph="Gr,RI,,,,ANS," x-occurrence="1" x-occurrences="1" x-content="πᾶν"\\*\\w everything|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G35880" x-lemma="ὁ" x-morph="Gr,RD,,,,ANS," x-occurrence="1" x-occurrences="1" x-content="τὸ"\\*\\w that|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G44530" x-lemma="πωλέω" x-morph="Gr,V,PPP,ANS," x-occurrence="1" x-occurrences="1" x-content="πωλούμενον"\\*\\w is|x-occurrence="1" x-occurrences="1"\\w*
\\w sold|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G17220" x-lemma="ἐν" x-morph="Gr,P,,,,,D,,," x-occurrence="1" x-occurrences="1" x-content="ἐν"\\*\\w in|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G31110" x-lemma="μάκελλον" x-morph="Gr,N,,,,,DNS," x-occurrence="1" x-occurrences="1" x-content="μακέλλῳ"\\*\\w the|x-occurrence="1" x-occurrences="3"\\w*
\\w market|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G33670" x-lemma="μηδείς" x-morph="Gr,RI,,,,ANS," x-occurrence="1" x-occurrences="1" x-content="μηδὲν"\\*\\w without|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G03500" x-lemma="ἀνακρίνω" x-morph="Gr,V,PPA,NMP," x-occurrence="1" x-occurrences="1" x-content="ἀνακρίνοντες"\\*\\w asking|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G12230" x-lemma="διά" x-morph="Gr,P,,,,,A,,," x-occurrence="1" x-occurrences="1" x-content="διὰ"\\*\\w for|x-occurrence="1" x-occurrences="1"\\w*
\\w the|x-occurrence="2" x-occurrences="3"\\w*
\\w sake|x-occurrence="1" x-occurrences="1"\\w*
\\w of|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G35880" x-lemma="ὁ" x-morph="Gr,EA,,,,AFS," x-occurrence="1" x-occurrences="1" x-content="τὴν"\\*\\w the|x-occurrence="3" x-occurrences="3"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G48930" x-lemma="συνείδησις" x-morph="Gr,N,,,,,AFS," x-occurrence="1" x-occurrences="1" x-content="συνείδησιν"\\*\\w conscience|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.
\\v 26 \\zaln-s |x-strong="G10630" x-lemma="γάρ" x-morph="Gr,CC,,,,,,,," x-occurrence="1" x-occurrences="1" x-content="γὰρ"\\*\\w For|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* “\\zaln-s |x-strong="G35880" x-lemma="ὁ" x-morph="Gr,EA,,,,NFS," x-occurrence="1" x-occurrences="1" x-content="ἡ"\\*\\w the|x-occurrence="1" x-occurrences="3"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G10930" x-lemma="γῆ" x-morph="Gr,N,,,,,NFS," x-occurrence="1" x-occurrences="1" x-content="γῆ"\\*\\w earth|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* {\\w is|x-occurrence="1" x-occurrences="1"\\w*}
\\zaln-s |x-strong="G35880" x-lemma="ὁ" x-morph="Gr,EA,,,,GMS," x-occurrence="1" x-occurrences="1" x-content="τοῦ"\\*\\w the|x-occurrence="2" x-occurrences="3"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G29620" x-lemma="κύριος" x-morph="Gr,N,,,,,GMS," x-occurrence="1" x-occurrences="1" x-content="Κυρίου"\\*\\w Lord|x-occurrence="1" x-occurrences="1"\\w*’\\w s|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*,
\\zaln-s |x-strong="G25320" x-lemma="καί" x-morph="Gr,CC,,,,,,,," x-occurrence="1" x-occurrences="1" x-content="καὶ"\\*\\w and|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G35880" x-lemma="ὁ" x-morph="Gr,EA,,,,NNS," x-occurrence="1" x-occurrences="1" x-content="τὸ"\\*\\w the|x-occurrence="3" x-occurrences="3"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G41380" x-lemma="πλήρωμα" x-morph="Gr,N,,,,,NNS," x-occurrence="1" x-occurrences="1" x-content="πλήρωμα"\\*\\w fullness|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*
\\zaln-s |x-strong="G08460" x-lemma="αὐτός" x-morph="Gr,RP,,,3GFS," x-occurrence="1" x-occurrences="1" x-content="αὐτῆς"\\*\\w of|x-occurrence="1" x-occurrences="1"\\w*
\\w it|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.”
`;
    const rawReextractedUSFM = await extractTextFromComplexUSFM(usfmSnippet);
    // console.log(`Got ${rawReextractedUSFM}`);
    expect(rawReextractedUSFM.length).toEqual(150);
    expect(rawReextractedUSFM).toMatchSnapshot();
  }, 100); // Allow 0.1 seconds

})
