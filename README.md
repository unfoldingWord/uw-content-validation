[![CI](https://github.com/unfoldingWord/uw-content-validation/actions/workflows/test.yml/badge.svg)](https://github.com/unfoldingWord/uw-content-validation/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/uw-content-validation.svg)](https://www.npmjs.com/package/uw-content-validation)

# uW Content/Resource Validation functions

**Documentation & live demos:** https://content-validation.netlify.app/

This repository contains JavaScript functions for validating/checking for errors in [Door43](https://git.door43.org/)/[unfoldingWord](https://www.unfoldingword.org/) Bible-translation content. The text passed to a function might be a single line/field of a file (e.g., one TSV row, for immediate feedback in an editor), or the entire contents of a file open in an enclosing app.

The package is published to NPM as [`uw-content-validation`](https://www.npmjs.com/package/uw-content-validation) and is used by [tC Create](https://github.com/unfoldingWord/tc-create-app) and the [Content Validation App](https://github.com/unfoldingWord-box3/content-validation-app).

Every check returns an object containing two lists:

1. `successList`: a list of strings giving an overview of what checks were made,
1. `noticeList`: a list of objects with fields that can be filtered, sorted, combined, and then displayed as error or warning messages.

The returned object may also contain other relevant fields such as `checkedFileCount`, `checkedFilenames`, `checkedFilenameExtensions`, `checkedFilesizes`, `checkedRepoNames`, and `elapsedSeconds`.

There are three sample notice-processing functions that show how to:

1. Divide the `noticeList` into a list of errors and a list of warnings,
1. Divide the `noticeList` into severe, medium, and low priority lists,
1. Convert the `noticeList` into a single list sorted by priority.

The [Styleguidist site](https://content-validation.netlify.app/) shows how these core functions are used, effectively producing a primitive app that checks Door43 files, repositories, and book packages, as well as demonstrating the individual low-level functions.

## What it checks

The library validates the following Door43/unfoldingWord resource types — for both Bible books and [Open Bible Stories](https://www.openbiblestories.org/) (OBS):

| Content | Format | Examples |
|---|---|---|
| Bible text | [USFM](https://ubsicap.github.io/usfm/) (including word/phrase alignment) | original languages `UHB` (Hebrew), `UGNT` (Greek); Gateway-Language `LT` (literal) and `ST` (simplified) translations |
| Translation/Study Notes & Questions | 7-column TSV | `TN` (TN2), `SN`, `TQ`, `SQ` |
| Translation Word Links | 6-column TSV | `TWL` |
| Legacy Translation Notes | 9-column TSV (deprecated, still supported) | old `TN` |
| Articles | Markdown (and Markdown fields inside TSV) | `TA` (Translation Academy), `TW` (Translation Words) |
| Metadata | YAML | repository `manifest` files |
| Other | Plain text | — |

Among the things the checks look for: malformed TSV rows/columns and missing or mis-formatted required fields; USFM marker validity and word-alignment integrity (via three independent USFM checkers); link integrity (`rc://` links, the existence of linked TA/TW articles and lexicon entries); `Quote`/`OrigQuote` matching against the original-language UHB/UGNT text; punctuation, whitespace, and unexpected-character anomalies; Markdown structure; and YAML well-formedness. Many of these can fetch related files from `git.door43.org` to verify cross-resource links — fetching is toggleable via `checkingOptions` (see below).

### Public API

The published entry points (in `src/core/wrapper.js`, re-exported from `src/index.js`) each take `(username, languageCode, …, checkingOptions)` and return `{ successList, noticeList }`:

| Function | Checks |
|---|---|
| `checkTN_TSV7Table` | a TN2 7-column notes table |
| `checkSN_TSV7Table` | a Study Notes 7-column table |
| `checkTQ_TSV7Table` | a Translation Questions 7-column table |
| `checkSQ_TSV7Table` | a Study Questions 7-column table |
| `checkTWL_TSV6Table` | a Translation Word Links 6-column table |
| `checkTA_markdownArticle` | a single Translation Academy article |
| `checkTW_markdownArticle` | a single Translation Words article |
| `checkDeprecatedTN_TSV9Table` | a legacy 9-column Translation Notes table |

Prefer these wrapped functions over the internal `internalCheck…`/`check…` functions when integrating externally — the wrappers also apply notice-disabling (suppression of known false positives) before returning.

## The Stack

- JavaScript for the core validation functions.
- React (functional components & hooks) for the demonstration applets.
- Material-UI for UI/UX baseline design components.
- React Styleguidist for the interactive playground/documentation.
- Yarn for dependencies and publishing.
- **GitHub** for source, **NPM** for the published package, and **Netlify** for the documentation/demo site (with per-PR deploy previews).
- Jest + ESLint for testing, run on GitHub Actions CI.

## Design Philosophy

This code is designed to thoroughly check Bible-related content data files. It is quite possible for the package to give multiple different notices for a single mistake. For example, a punctuation abnormality in a quoted text might produce a notice about the bad punctuation as well as a notice about not being able to match the quote. The package errs on the side that having additional warnings is better than missing one (and then later being confused about why a data file won’t load). Because of these consequential warnings, it’s good to rerun the checks from time to time on your latest files as you fix multiple errors.

There is also a separate function for checking individual TSV rows (e.g., TN, TN2, TQ), intended to provide immediate user feedback when built into a TSV editor.

### Notice Objects (in `noticeList`)

The lower-level checking functions provide the list of success-message strings plus one list of `notices` (warnings/errors combined). Each notice is an object with some or all of the following fields (as available/relevant).

There are two compulsory fields in every notice object:

1. `priority`: A notice priority number in the range 1–1,000. Each *type* of warning/error has a unique number (but not each *instance*). By default, priority numbers 700 and over are considered `errors` and 0–699 are considered `warnings`, but that’s somewhat arbitrary and configurable.
1. `message`: The general descriptive text of the notice (starts with a capital letter).

All of the following fields may be missing or undefined, i.e., they’re all optional:

1. `details`: More helpful details about the notice (if applicable; doesn’t start with a capital letter)
1. `repoCode`: brief repository code (if available), e.g., `UHB`, `UGNT`, `LT`, `ST`, `TN`, `TN2`, `TQ`, `TWL`, etc.
1. `repoName`: Door43 repository name (if available), e.g., `en_ta`, `hi_tw`
1. `filename`: filename string (if available)
1. `bookID`: The 3-character UPPERCASE [book identifier](http://ubsicap.github.io/usfm/identification/books.html) or `OBS` (if relevant)
1. `C`: The chapter number or OBS story number (if relevant)
1. `V`: The verse number or OBS frame number (if relevant)
1. `rowID`: 4-character ID field for a TSV row (if relevant)
1. `lineNumber`: A one-based line number in the file (if available)
1. `fieldName`: name of the TSV field (if relevant)
1. `characterIndex`: A **zero-based** integer character index indicating the position of the error in the given text (line or field) (if available)
1. `excerpt`: An excerpt (if available) from the checked text indicating the area containing the problem. Where helpful, some character substitutions have already been made — for example, if the notice is about spaces, spaces are generally displayed as a visible character to best highlight the issue. (The excerpt length defaults to 20 characters, but is settable as an option.)
1. `location`: A string indicating the context of the notice, e.g., "in line 17 of 'someBook.usfm'".
1. `extra`: for a check that looks in multiple repos, this contains extra identifying information (typically the `repoCode`) to help the user determine which resource/repo/file the notice applies to (which, in the demos, is then often prepended to the `message`).

Keeping notices in this structured format (rather than just an array of strings) allows the *notice components* to be processed at a higher level — e.g., user-controlled filtering and sorting. In a rush it might be good to display the highest-priority messages first; when working systematically it might be better to sort by filename and line-number so that warnings about the same part of a file can be viewed together irrespective of priority.

The default in the demos is to funnel all the raw notices through the supplied `processNoticesToErrorsWarnings` function (in `src/demos/notice-processing-functions.js`) which:

1. Removes excess repeated errors. For example, if there’s a systematic error in a file (say, an unneeded leading space in every field), rather than returning hundreds of errors, only the first several are returned, followed by an "errors suppressed" message. (The number displayed is settable; zero means display all.)
1. Separates notices into error and warning lists based on the priority number. (The switch-over point is settable.)
1. Optionally drops the lowest-priority notices and/or certain given notice types (by priority number).

A second version splits into `Severe`, `Medium`, and `Low` lists instead; a third leaves them as notices but applies a bright-red → dull-red colour gradient. Callers are, of course, free to write their own.

## User-settable Options

### Checking Options

Checking can be altered and/or sped up when the calling app sets some or all of the following fields in `checkingOptions`:

- `disableAllLinkFetchingFlag`: a boolean which, if true, stops the package from fetching (hence checking) links — e.g., when a translation note refers to Translation Academy it won’t check that the TA article actually exists — and also stops checking of extra files like `LICENSE.md`. This gives a dramatic speed-up (but means the data might still contain major errors).
- `disableLexiconLinkFetchingFlag`: a boolean to stop the package from fetching lexicon links specifically, so that the main link fetching can be enabled without slowing the checks down by fetching/testing thousands of lexicon links.
- `disableLinkedTAArticlesCheckFlag`, `disableLinkedTWArticlesCheckFlag`, `disableLinkedLexiconEntriesCheckFlag`: booleans which, if true, stop the functions from checking the *content* of articles linked from other places. These only make a difference if the appropriate link fetching (above) is enabled.
- `getFile`: a function taking `{username, repository, path, branch}` that returns the full text of the relevant Door43 file — default uses our own function and associated caching.
- `fetchRepositoryZipFile`: a function taking `{username, repository, branch}` that returns the contents of the zip file containing all the Door43 files — default uses our own function and caching.
- `getFileListFromZip`: takes the same parameters and returns an array of the filepaths of all files in the Door43 zip file — default uses our own function and caching.
- `originalLanguageVerseText`: the Hebrew/Aramaic or Greek original-language text for the book/chapter/verse of the TSV row being checked — this enables `Quote` fields to be checked without needing to load and parse the actual USFM file.
- `originalLanguageRepoUsername`, `originalLanguageRepoBranch`: specify the username/organisation and/or branch/tag for fetching the UHB and UGNT files.
- `taRepoUsername`, `taRepoBranchName`: specify the username/organisation and/or branch/tag for fetching the TA files.
- `taRepoLanguageCode`, `taRepoSectionName`: specify how the `SupportReference` field is checked in TA — defaults are `en` and `translate`.
- `twRepoUsername`, `twRepoBranchName`: specify the username/organisation and/or branch/tag for fetching the TW files.
- `excerptLength`: an integer defining how long excerpts of lines containing errors should be — default 20 characters; the package attempts to place the error in the middle of the excerpt.
- `cutoffPriorityLevel`: an integer that can define notices to not be detected — defaults to 0 so none are dropped. (Only partially implemented.)
- `suppressNoticeDisablingFlag`: Defaults to `false`, i.e., to removing (suppressing) notices for warnings expected in certain files that we don’t want displayed. This is always set to `true` for the demos (because they suppress these notices later — see `showDisabledNoticesFlag` below).

Most high-level demonstrations allow a choice of one of three display formats for notices:

- `SingleList` (recommended): sorts notices by priority (highest first), colouring the highest bright red, fading to black for the lowest.
- `ErrorsWarnings`: divides notices into an *errors* list and a *warnings* list, displayed in different colours.
- `SevereMediumLow`: divides notices into three lists displayed in different colours.

### Processing Options

There are also options for the display of notices in the demonstrations, set in `optionalProcessingOptions` and used by the sample notice-processing functions:

- `ignorePriorityNumberList`: a list of integers; notices with these priority values are dropped during processing.
- `sortBy`: `ByPriority` (default), `ByRepo`, or `AsFound`.
- `errorPriorityLevel`: an integer defining *errors* (vs *warnings*) — defaults to 700 (and above).
- `severePriorityLevel`: an integer defining *severe* errors — defaults to 800 (and above).
- `mediumPriorityLevel`: an integer defining *medium* errors — defaults to 600 (and up to `severePriorityLevel`).
- `maximumSimilarMessages`: how many of a certain notice to display before summarising (e.g., *99 similar errors suppressed*) — zero means never summarise — defaults to 3.
- `showDisabledNoticesFlag`: some content files produce false alarms (e.g., a discussion of using the `,` as punctuation). Where known, these are disabled from being shown. Setting this to `true` shows them anyway (with "(disabled)" added) — default `false`.

## Development

You will need `node.js` (16+) and `yarn` installed.

1. Install dependencies with `yarn`.
1. Run the Styleguide locally with `yarn start`.
1. Visit `localhost:6060` in your browser. (For Chromebooks, see the note below.)
1. Modify the code and documentation, and check the result in the Styleguide.
    - Update `styleguide.config.js` to match any new component/section names.
1. See `userLog()` debug output in the browser console (in Chrome, CTRL-SHIFT-J).

Tests (ESLint + Jest with coverage) are run with `yarn test`, and on every push via GitHub Actions ("CI" workflow). Run a single test file with `yarn jest src/__tests__/<file>.test.js --watchAll=false`.

> **Note:** the React Styleguidist toolchain uses webpack 4, which is incompatible with the OpenSSL provider bundled in Node 17+. The `styleguide:start`/`styleguide:build` scripts therefore set `NODE_OPTIONS=--openssl-legacy-provider`, and the Netlify build pins `NODE_VERSION` in `netlify.toml`.

### Publishing to NPM

The scripts in `package.json` do the heavy lifting.

1. Commit and push all changes.
1. Run `yarn publish`:
    - log in to NPM if asked,
    - enter the new version number (semver),
    - the code is transpiled to `dist/` and published to NPM, then the release is git-tagged.
1. Visit the published library on [NPM](https://www.npmjs.com/package/uw-content-validation).

The documentation/demo site at https://content-validation.netlify.app/ is built and deployed automatically by **Netlify** on every push to `master` (and a deploy preview is built for each pull request), so no manual docs deploy is required.

## Chromebook Linux Beta Notes

Use `hostname -I` to get the host address. **Neither `localhost` nor `127.0.0.1` will work.**

```
$ hostname -I
100.115.92.202
$
```
