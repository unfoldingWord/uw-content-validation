/* eslint-env jest */

import { isWhitespace, countOccurrencesInString, countOccurrencesInList, ourReplaceAll, ourDeleteAll } from '../core/text-handling-functions';

describe('isWhitespace() - ', () => {

  describe('whitespace tests - ', () => {
    it('single space is whitespace', () => {
      const returnedValue = isWhitespace(' ');
      expect(returnedValue).toEqual(true);
    });
    it('multiple spaces are whitespace', () => {
      const returnedValue = isWhitespace('            ');
      expect(returnedValue).toEqual(true);
    });
    it('zero-width space is whitespace', () => {
      const returnedValue = isWhitespace('\u200B');
      expect(returnedValue).toEqual(true);
    });
    it('single character is not whitespace', () => {
      const returnedValue = isWhitespace('           a');
      expect(returnedValue).toEqual(false);
    });
  })
})

describe('countOccurrencesInString() - ', () => {

  describe('countOccurrencesInString tests - ', () => {
    it('count non-match single character', () => {
      const returnedValue = countOccurrencesInString('abc', 'z');
      expect(returnedValue).toEqual(0);
    });
    it('count single character', () => {
      const returnedValue = countOccurrencesInString('abc', 'b');
      expect(returnedValue).toEqual(1);
    });
    it('count multiple single characters', () => {
      const returnedValue = countOccurrencesInString('babcb', 'b');
      expect(returnedValue).toEqual(3);
    });
  })
})

describe('countOccurrencesInList() - ', () => {

  describe('countOccurrencesInList tests - ', () => {
    it('count non-match single character', () => {
      const returnedValue = countOccurrencesInList(['abc', 'a','b','c'], 'z');
      expect(returnedValue).toEqual(0);
    });
    it('count single character', () => {
      const returnedValue = countOccurrencesInList(['abc', 'a','b','c'], 'b');
      expect(returnedValue).toEqual(1);
    });
    it('count multiple single characters', () => {
      const returnedValue = countOccurrencesInList(['babcb','b','a','b', 'zdfsdb','b'], 'b');
      expect(returnedValue).toEqual(3);
    });
  })
})

describe('ourReplaceAll() - ', () => {

  describe('ourReplaceAll tests - ', () => {
    it('replace single character', () => {
      const returnedValue = ourReplaceAll('abc', 'b', 'q');
      expect(returnedValue).toEqual('aqc');
    });
    it('replace multiple single characters', () => {
      const returnedValue = ourReplaceAll('babcb', 'b', 'q');
      expect(returnedValue).toEqual('qaqcq');
    });
  })
})

describe('ourDeleteAll() - ', () => {

  describe('ourDeleteAll tests - ', () => {
    it('delete single character', () => {
      const returnedValue = ourDeleteAll('abc', 'b');
      expect(returnedValue).toEqual('ac');
    });
    it('delete multiple single characters', () => {
      const returnedValue = ourDeleteAll('babcb', 'b');
      expect(returnedValue).toEqual('ac');
    });
  })
})
