// eslint-disable-next-line no-unused-vars
import { CLOSING_PUNCTUATION_CHARACTERS, HEBREW_CANTILLATION_REGEX, PAIRED_PUNCTUATION_OPENERS, PAIRED_PUNCTUATION_CLOSERS } from './text-handling-functions';
// eslint-disable-next-line no-unused-vars
import { functionLog, debugLog, parameterAssert, logicAssert, dataAssert, ourParseInt, aboutToOverwrite } from './utilities';

export function extractTextFromComplexUSFM(usfmText) {
  // functionLog(`extractTextFromComplexUSFM(${usfmText.length} chars)…`)
  // Do initial global replaces
  usfmText = usfmText.replace(/\\zaln-e\\\*/g, ''); // Remove \zaln-e self-closed milestones
  usfmText = usfmText.replace(/\\k-e\\\*/g, ''); // Remove \k-e self-closed milestones
  // debugLog(`  extractTextFromComplexUSFM: got verse text1: (${usfmText.length}) '${usfmText}'`);
  usfmText = usfmText.replace(/\\zaln-s.+?\\\*/g, ''); // Remove \zaln-s self-closed milestones
  usfmText = usfmText.replace(/\\k-s.+?\\\*/g, ''); // Remove \k-s self-closed milestones
  // debugLog(`  extractTextFromComplexUSFM: got verse text2: (${usfmText.length}) '${usfmText}'`);
  usfmText = usfmText.replace(/\\w (.+?)\|.+?\\w\*/g, '$1'); // Replace word fields with just the word
  // debugLog(`  extractTextFromComplexUSFM: got verse text3: (${usfmText.length}) '${usfmText}'`);
  usfmText = usfmText.replace(/{|}/g, ''); // Replace (ST) "added" markers
  // debugLog(`  extractTextFromComplexUSFM: got verse text3: (${usfmText.length}) '${usfmText}'`);

  // Remove lines we don't want
  const hadTrailingNewline = usfmText.slice(-1) === '\n';
  const newLines = [];
  for (let line of usfmText.split('\n')) {
    if (!line.length) continue;
    if (line.startsWith('\\id ')) continue;
    if (line.startsWith('\\usfm ')) continue;
    if (line.startsWith('\\ide ')) continue;
    if (line.startsWith('\\h ')) continue;
    if (line.startsWith('\\toc')) continue;
    if (line === '\\ts\\*' || line === '\\ts\\* ') continue; // Handle known trailing spaces
    if (line.startsWith('\\rem ')) continue;
    if (line.startsWith('\\c ')) line = `[C${line.slice(3)}]`;
    if (line.startsWith('\\v ')) {
      const rest = line.slice(3);
      let [vNum, more] = rest.split(' ', 2);
      if (more === undefined) more = '';
      if (more.length && more[0] !== ' ') more = ` ${more}`;
      line = `‹v${vNum}›${more}`;
    }
    if (line.startsWith('\\p ') && line.trim() === '\\p') line = '\\p'; // Handle known trailing spaces
    newLines.push(line);
  }
  usfmText = newLines.join(' ').replace(/\\p /g, '\n')
  // debugLog(`  extractTextFromComplexUSFM got verse text4: (${usfmText.length}) '${usfmText}'`);
  if (hadTrailingNewline) usfmText += '\n';
  // debugLog(`  extractTextFromComplexUSFM got verse text4b: (${usfmText.length}) '${usfmText}'`);
  logicAssert(hadTrailingNewline === (usfmText.slice(-1) === '\n'), `extractTextFromComplexUSFM hadTrailingNewline was ${hadTrailingNewline} now different!`);

  usfmText = usfmText.replace(/ ‹v\d{1,3}›/g, ''); // Remove (now-adjusted) verse numbers inside the text so we get the flowing text

  usfmText = usfmText.replace(/ {2}/g, ' ') // Eliminate double spaces
  // debugLog(`Got verse text1: '${usfmText}'`);


  // Remove footnotes
  // NOTE: If there's two footnotes and no closer on the first one, this replace will swallow intervening text
  //  but this isn't the place to worry about bad USFM in the original languages
  //  so the quote match will possibly fail as a consequential error
  usfmText = usfmText.replace(/\\f (.+?)\\f\*/g, '');
  // Remove alternative versifications
  usfmText = usfmText.replace(/\\va (.+?)\\va\*/g, '');
  // debugLog(`Got verse text3: '${usfmText}'`);

  // Final clean-up (shouldn’t be necessary, but just in case)
  usfmText = usfmText.replace(/ {2}/g, ' '); // Eliminate double spaces
  //parameterAssert(usfmText.indexOf('\\w') === -1, `getOriginalVerse: Should be no \\w in ${bookID} ${C}:${V} '${usfmText}'`);
  //parameterAssert(usfmText.indexOf('\\k') === -1, `getOriginalVerse: Should be no \\k in ${bookID} ${C}:${V} '${usfmText}'`);
  //parameterAssert(usfmText.indexOf('x-') === -1, `getOriginalVerse: Should be no x- in ${bookID} ${C}:${V} '${usfmText}'`);
  //parameterAssert(usfmText.indexOf('\\f') === -1, `getOriginalVerse: Should be no \\f in ${bookID} ${C}:${V} '${usfmText}'`);
  //parameterAssert(usfmText.indexOf('\\x') === -1, `getOriginalVerse: Should be no \\x in ${bookID} ${C}:${V} '${usfmText}'`);

  // debugLog(`  extractTextFromComplexUSFM is returning (${usfmText.length}) '${usfmText}'`);
  // debugLog(`  extractTextFromComplexUSFM is returning (${usfmText.length}) characters`);
  return usfmText;
}
