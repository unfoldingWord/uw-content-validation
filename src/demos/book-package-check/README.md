## Door43 Book Package Check - Readme

The code below requests some info and then checks the single specified Bible book in several repos. This is convenient to see all these check results collected into one place.

See a list of valid book identifiers [here](http://ubsicap.github.io/usfm/identification/books.html), although only `GEN` to `REV` from that list are useful here.

Note that `OBS` can also be entered here as a *pseudo book identifier* in order to check an **Open Bible Stories** repo.

`Book Package Check` calls `checkBookPackage()` which then calls `checkFileContents()` for the book file in each repo (or calls `checkRepo()` for **OBS**).

**Warning**: Some book packages contain many files and/or very large files, and downloading them all and then checking them might slow down your browser—maybe even causing pop-up messages asking to confirm that you want to keep waiting.

**Note**: This demonstration can use saved (cached) copies of files stored inside the local browser. This makes reruns of the checks faster, but it won't notice if you have recently updated the files on Door43. If you want to clear the local caches, use either the `reloadAllFilesFirst` variable below, or the `Clear Cache` function from the menu.

```js
// The code in this box is editable for changing settings—
//        Simply click inside here and add, change, or delete text as required.

import BookPackageCheck from './BookPackageCheck';

<BookPackageCheck
  // Leave as Y while adjusting settings below, then change to N to start the check
  wait='Y' // 'Y' (for Yes, i.e., to wait) or 'N' (for No, i.e., to start checking)

  // Set to N to rerun the check without fetching new copies of the files (slightly faster)
  reloadAllFilesFirst='Y' // 'Y' (for Yes -- same as ClearCache in menu) or 'N' (for No)

  username='unfoldingWord'
  languageCode='en'
  // bookID can be a USFM bookID, e.g., 'GEN', 'MAT', '3JN'
  //  and can also be 'OBS' (for Open Bible Stories)
  bookID='NEH'

  // We can choose the forthcoming new TSV formats or the existing formats
  dataSet='OLD' // 'OLD' (Markdown TQ, TSV TN, etc.), 'NEW' (TSV TQ2, TN2, etc.), 'DEFAULT', or 'BOTH'

  // Default displayType is 'ErrorsWarnings'
  //  Alternatives are `SevereMediumLow', 'SingleList'
  displayType='SingleList'

  // Normally links in files are downloaded to check that they really exist
  disableAllLinkFetchingFlag='false' // 'true' or 'false'
  // The next two are only relevant if the above is 'false'
  checkLinkedTAArticleFlag='true' // 'true' or 'false'
  checkLinkedTWArticleFlag='true' // 'true' or 'false'

  // Lines starting with // are ignored -- you can add or remove // as desired
  // Specifying extractLength and maximumSimilarMessages is just to show off options
  // —those fields are not necessary (or normal) here
  extractLength='20' // Default is 15
  // cutoffPriorityLevel='200' // Default is to detect all errors/warnings
  maximumSimilarMessages='5' // Default is 3 (0 means don't suppress any)
  //ignorePriorityNumberList='[]'
  //sortBy='ByRepo' // Default is 'ByPriority'; also have 'ByRepo' and 'AsFound'
  ignoreDisabledNoticesFlag='false' // Show known non-issues: 'true' or 'false'
  />
```
