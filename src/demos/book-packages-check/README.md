## Door43 Book Packages Check - Readme

The code below requests some info and then checks the given Bible books across several repos. This is convenient to see all these check results collected into one place.

See a list of valid book identifiers [here](http://ubsicap.github.io/usfm/identification/books.html), although only `GEN` to `REV` from that list are useful here.

Note that `OBS` can also be entered here as a *pseudo book identifier* in order to check an **Open Bible Stories** repo.

`Book Packages Check` calls `checkBookPackages()` which then calls `checkBookPackage()` for each given book identifier, which in turn calls `checkFileContents()` for the book file in each repo (or calls `checkRepo()` for **OBS**).

**Warning**: Some book packages contain many files and/or very large files, and downloading them all and then checking them might slow down your browser—maybe even causing pop-up messages asking to confirm that you want to keep waiting.

**Note**: This demonstration uses saved (cached) copies of files stored inside the local browser. This makes reruns of the checks faster, but it won't notice if you have recently updated the files on Door43. If you want to clear the local caches, use either the `reloadAllFilesFirst` variable below, or the `Clear Cache` function from the menu.

```js
// The code in this box is editable for changing settings—
//        Simply click inside here and add, change, or delete text as required.

import BookPackagesCheck from './BookPackagesCheck';

<BookPackagesCheck
  // Leave as Y while adjusting settings below, then change to N to start the check
  wait='Y' // 'Y' (for Yes, i.e., to wait) or 'N' (for No, i.e., to start checking)

  // Set to N to rerun the check without fetching new copies of the files (slightly faster)
  reloadAllFilesFirst='Y' // 'Y' (for Yes -- same as ClearCache in menu) or 'N' (for No)

  username='unfoldingWord'
  languageCode='en'
  // Enter a string containing UPPERCASE USFM book identifiers separated only by commas
  //  and can also include OBS (for Open Bible Stories)
  bookIDs='OBS,RUT,EST,JON,EPH,TIT,3JN' // These English BPs should all be finished

  // Default displayType is 'ErrorsWarnings'
  //  Alternatives are `SevereMediumLow', 'SingleList'
  displayType='SingleList'

  // Lines starting with // are ignored -- you can add or remove // as desired
  // Specifying maximumSimilarMessages and extractLength is just to show off options
  // —those fields are not necessary (or normal) here
  maximumSimilarMessages='4' // Default is 3 (0 means don't suppress)
  // extractLength='20' // Default is 15
  />
```
