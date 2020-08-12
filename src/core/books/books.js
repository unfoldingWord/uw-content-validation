
import data from './books.json';
// import * as opt from './optimize'

// export interface bookDataIF {
//   "id";
//   "title";
//   "usfm";
//   "testament";
//   "verseCount": number;
//   "chapters": number[];
// }

const extraBookList = ['FRT','BAK'];
export const isValidBookCode = (bookId) => {
  return bookId.toLowerCase() in data || extraBookList.indexOf(bookId) >= 0;
}
export const isOptionalValidBookCode = (bookId) => {
  return !bookId || bookId.toLowerCase() in data || extraBookList.indexOf(bookId) >= 0;
}
export const isExtraBookCode = (bookId) => {
  return extraBookList.indexOf(bookId) >= 0;
}


export const usfmNumberName = (bookId) => {
  try {return data[bookId.toLowerCase()].usfm;}
  catch(err) {throw new Error("usfmNumberName() given invalid bookId: '" + bookId + "'");}
}

export const chaptersInBook = (bookId) => {
  let chapters;
  try {
    chapters = data[bookId.toLowerCase()].chapters;
  } catch (err) {
    throw new Error("chaptersInBook() given invalid bookId: '" + bookId + "'");
  }
  if (chapters === undefined) {
    throw new Error("chaptersInBook(): Invalid bookId: '" + bookId + "'");
  }
  return chapters;
};

export const versesInChapter = (bookId, chapter) => {
  const verses = chaptersInBook(bookId)[chapter - 1];
  if (verses === undefined) {
    throw new Error("versesInChapter(" + bookId + ") given invalid chapter: " + chapter);
  }
  return verses;
};

// export const bookData = (bookId) => {
//   const _bookData: bookDataIF = data.filter(row => row.id === bookId)[0];
//   return _bookData;
// };

export const testament = (bookId) => {
  const _testament = data[bookId.toLowerCase()].testament;
  return _testament;
};

// export const newTestament = () => {
//   let list[] = [];
//   for (const i=0; i < data.length; i++) {
//     if ( data[i].testament === "new" ) {
//       list.push( data[i].title )
//     }
//   }
//   return list;
// }

// export const oldTestament = () => {
//   let list[] = [];
//   for (const i=0; i < data.length; i++) {
//     if ( data[i].testament === "old" ) {
//       list.push( data[i].title )
//     }
//   }
//   return list;
// }

// export const bookDataTitles = () => {
//   let list[] = [];
//   for (const i=0; i < data.length; i++) {
//       list.push( data[i].title )
//   }
//   return list;
// }

// export const titlesToBoolean = () => {
//   let ob: opt.bpStateIF = {};
//   let list = bookDataTitles();
//   list.forEach((v,k) => {ob[v]= [false,false]});
//   return ob;
// }

// export const bookIdByTitle = (title) => {
//   for (const i=0; i < data.length; i++) {
//     if ( data[i].title === title ) {
//       return data[i].id;
//     }
//   }
//   return "";
// }

// export const bookTitleById = (id) => {
//   for (const i=0; i < data.length; i++) {
//     if ( data[i].id === id ) {
//       return data[i].title;
//     }
//   }
//   return "";
// }

const oftenMissingList = [
  // See https://en.wikipedia.org/wiki/List_of_New_Testament_verses_not_included_in_modern_English_translations
  ['NEH', 7, 68], // ?
  ['MAT', 16, 3],
  ['MAT', 17, 21],
  ['MAT', 18, 11],
  // ['MAT', 20, 16b],
  ['MAT', 23, 14],
  // ['MRK', 6, 11b],
  ['MRK', 7, 16],
  ['MRK', 9, 44], ['MRK', 9, 46],
  ['MRK', 11, 26],
  ['MRK', 15, 28],
  ['MRK', 16, 9], ['MRK', 16, 10], ['MRK', 16, 11], ['MRK', 16, 12], ['MRK', 16, 13], ['MRK', 16, 14],
    ['MRK', 16, 15], ['MRK', 16, 16], ['MRK', 16, 17], ['MRK', 16, 18], ['MRK', 16, 19], ['MRK', 16, 20],
  // ['LUK', 4, 8b],
  // ['LUK', 9, 55], ['LUK', 9, 56],
  ['LUK', 17, 36],
  ['LUK', 22, 43], // ?
  ['LUK', 22, 44], // ?
  ['LUK', 23, 17],
  ['JHN', 5, 3], ['JHN', 5, 4],
  ['JHN', 7, 53], // ?
  ['JHN', 8, 1], // ?
  ['ACT', 8, 37],
  // ['ACT', 9, 5], ['ACT', 9, 6],
  // ['ACT', 13, 42],
  ['ACT', 15, 34],
  // ['ACT', 23, 9b],
  ['ACT', 24, 6], ['ACT', 24, 7], ['ACT', 24, 8],
  ['ACT', 28, 29],
  ['ROM', 16, 24],
  ['2CO', 13, 14], // ?
  ['1JN', 5, 7], ['1JN', 5, 8],
];


export function isOftenMissing(BBB,C,V) {
  function matchBCV(entry) { return entry[0]===BBB && entry[1]===C && entry[2]===V; }

  return oftenMissingList.find(matchBCV) !== undefined;
}
