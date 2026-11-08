/* eslint-env jest */

// The original-language check on a verse bridge (\v 1-3) must find each aligned word in the
// verse its x-ref names, whether the original file puts a verse's text on the \v line or not.

import { checkUSFMText } from '../core/usfm-text-check';
import { clearStoredSegmentCache } from '../core/getApi';

// localforage needs a browser store; give the cache a memory map so the original-language
// fetch (which the other test files disable) can run here.
jest.mock('localforage', () => {
  const createInstance = () => {
    const m = new Map();
    return {
      getItem: async (k) => (m.has(k) ? m.get(k) : null),
      setItem: async (k, v) => { m.set(k, v); return v; },
      clear: async () => m.clear(),
      length: async () => m.size,
    };
  };
  return { INDEXEDDB: 'memory', createInstance };
});

// UGNT Titus 1:1-4, with a verse's first word on the \v line, as usfm-js writes it.
// Door43's files put "\v 2" on a line of its own; the second original below has that layout.
const ugntWordsOnVerseLine = `\\id TIT
\\c 1
\\p
\\v 1 \\w Παῦλος|lemma="Παῦλος" strong="G39720" x-morph="Gr,N,,,,,NMS,"\\w*,
\\w δοῦλος|lemma="δοῦλος" strong="G14010" x-morph="Gr,N,,,,,NMS,"\\w*
\\w Θεοῦ|lemma="θεός" strong="G23160" x-morph="Gr,N,,,,,GMS,"\\w*,
\\w ἀπόστολος|lemma="ἀπόστολος" strong="G06520" x-morph="Gr,N,,,,,NMS,"\\w*
\\w δὲ|lemma="δέ" strong="G11610" x-morph="Gr,CC,,,,,,,,"\\w*
\\w ἐκλεκτῶν|lemma="ἐκλεκτός" strong="G15880" x-morph="Gr,NS,,,,GMP,"\\w*
\\w Θεοῦ|lemma="θεός" strong="G23160" x-morph="Gr,N,,,,,GMS,"\\w*
\\v 2 \\w ἐπ’|lemma="ἐπί" strong="G19090" x-morph="Gr,P,,,,,D,,,"\\w*
\\w ἐλπίδι|lemma="ἐλπίς" strong="G16800" x-morph="Gr,N,,,,,DFS,"\\w*
\\v 3 \\w ἐφανέρωσεν|lemma="φανερόω" strong="G53190" x-morph="Gr,V,IAA3,,S,"\\w*
\\w δὲ|lemma="δέ" strong="G11610" x-morph="Gr,CC,,,,,,,,"\\w*
\\w Θεοῦ|lemma="θεός" strong="G23160" x-morph="Gr,N,,,,,GMS,"\\w*
\\v 4 \\w Τίτῳ|lemma="Τίτος" strong="G51030" x-morph="Gr,N,,,,,DMS,"\\w*
\\w Θεοῦ|lemma="θεός" strong="G23160" x-morph="Gr,N,,,,,GMS,"\\w*
`;
const ugntVerseNumberAlone = ugntWordsOnVerseLine.replace(/^(\\v \d+) /gm, '$1\n');

const zaln = (content, ref, strong, lemma, morph, gloss) =>
  `\\zaln-s |x-strong="${strong}" x-lemma="${lemma}" x-morph="${morph}" x-occurrence="1" x-occurrences="1" x-content="${content}" x-ref="${ref}"\\*\\w ${gloss}|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*`;

// A bridge over 1:1-3 with four alignments. δὲ is in 1:1 and 1:3 once each; Θεοῦ is in 1:1
// twice and in 1:3 once.
const alignedBridge = (refOfTheou) => `\\id TIT
\\usfm 3.0
\\ide UTF-8
\\c 1
\\p
\\v 1-3 ${zaln('Παῦλος', '1:1', 'G39720', 'Παῦλος', 'Gr,N,,,,,NMS,', 'Paul')},
${zaln('δὲ', '1:1', 'G11610', 'δέ', 'Gr,CC,,,,,,,,', 'a')}
\\w servant|x-occurrence="1" x-occurrences="1"\\w*
${zaln('δὲ', '1:3', 'G11610', 'δέ', 'Gr,CC,,,,,,,,', 'revealed')}
\\w his|x-occurrence="1" x-occurrences="1"\\w*
\\w word|x-occurrence="1" x-occurrences="1"\\w*
${zaln('Θεοῦ', refOfTheou, 'G23160', 'θεός', 'Gr,N,,,,,GMS,', 'God')}
`;

const optionsServing = (originalUSFM) => ({
  originalLanguageRepoUsername: 'unfoldingWord',
  disableLinkedTAArticlesCheckFlag: true,
  disableLinkedTWArticlesCheckFlag: true,
  disableLexiconLinkFetchingFlag: true,
  disableLinkedLexiconEntriesCheckFlag: true,
  getFile: ({ repository, path }) => {
    if (repository === 'el-x-koine_ugnt' && path === '57-TIT.usfm') return originalUSFM;
    // eslint-disable-next-line no-throw-literal
    throw `usfm-text-check-verse-bridge.test getFile(): refused ${repository}/${path}`;
  },
});

const alignmentNotices = (rawResults) =>
  rawResults.noticeList.filter((n) => [602, 801, 802, 803, 804, 805, 806, 807, 795].includes(n.priority));

describe('checkUSFMText() on a verse bridge with x-ref - ', () => {
  // The original-language word lists are cached by reference, so each layout must start clean
  beforeEach(async () => { await clearStoredSegmentCache(); });

  for (const [layout, original] of [
    ['the verse text on the \\v line', ugntWordsOnVerseLine],
    ['the verse number alone on the \\v line', ugntVerseNumberAlone],
  ]) {
    describe(`with ${layout} - `, () => {
      it('finds each word in the verse its x-ref names', async () => {
        const rawResults = await checkUSFMText('unfoldingWord', 'en', 'LT', 'TIT', '57-TIT.usfm', alignedBridge('1:3'), 'from test snippet', optionsServing(original));
        expect(alignmentNotices(rawResults)).toEqual([]);
      });

      it('still reports a word counted in the wrong verse, and stops at the end of the bridge', async () => {
        const rawResults = await checkUSFMText('unfoldingWord', 'en', 'LT', 'TIT', '57-TIT.usfm', alignedBridge('1:1'), 'from test snippet', optionsServing(original));
        const notices = alignmentNotices(rawResults);
        expect(notices.map((n) => n.priority)).toEqual([602]);
        expect(notices[0].details).toMatch(/^found 2 occurrences of 'Θεοῦ' instead of 1 from /);
        expect(notices[0].details).toContain('v=3');
        expect(notices[0].details).not.toContain('v=4');
      });
    });
  }
});
