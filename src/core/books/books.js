
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

export const isValidBookCode = (bookId) => {
  return bookId.toLowerCase() in data;
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
//   for (let i=0; i < data.length; i++) {
//     if ( data[i].testament === "new" ) {
//       list.push( data[i].title )
//     }
//   }
//   return list;
// }

// export const oldTestament = () => {
//   let list[] = [];
//   for (let i=0; i < data.length; i++) {
//     if ( data[i].testament === "old" ) {
//       list.push( data[i].title )
//     }
//   }
//   return list;
// }

// export const bookDataTitles = () => {
//   let list[] = [];
//   for (let i=0; i < data.length; i++) {
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
//   for (let i=0; i < data.length; i++) {
//     if ( data[i].title === title ) {
//       return data[i].id;
//     }
//   }
//   return "";
// }

// export const bookTitleById = (id) => {
//   for (let i=0; i < data.length; i++) {
//     if ( data[i].id === id ) {
//       return data[i].title;
//     }
//   }
//   return "";
// }
