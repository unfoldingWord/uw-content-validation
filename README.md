[![Custom badge](https://img.shields.io/endpoint?color=%2374b9ff&url=https%3A%2F%2Fraw.githubusercontent.com%2unfoldingWord%2Fcontent-validation-rcl%2Fmaster%2Fcoverage%2Fshields.json)]()
[![Install, Build & Run Cypress](https://github.com/unfoldingWord/content-validation-rcl/workflows/Install,%20Build%20&%20Run%20Cypress/badge.svg)]()

# uW Content/Resource Validation React Component Library

GH Pages: https://unfoldingword.github.io/content-validation-rcl/

## The Stack

- Javascript + React (functional components & hooks).
- MaterialUI for UI/UX baseline design components.
- Styleguidist for Playground Documentation.
- Yarn for dependencies, publishing, and deploying.
- Github + NPM + Github Pages for Hosting.
- Cypress for testing

## Design Philosophy

This code is designed to thoroughly check various types of Bible-related content data files. This includes:

1. Unified Standard Format Marker (USFM) Bible content files, including original language Bibles and Bible translations aligned by word/phrase to the original words/phrases
1. Translation Notes (TN) tables in Tab-Separated Values (TSV) files
1. Markdown files (and markdown fields in TSV files)
1. Plain-text files
1. Metadata (manifest) JSON files

Note: There is also a separate function for checking individual TN/TSV lines which is intended to be able to provide instant user feedback if built into a TSV editor.

The top-level checking components display:

1. A list of things that were checked (successList)
1. A list of (higher-priority) errors
1. A list of (lower-priority) warnings

However, the lower-level checking functions provide only the list of success message strings and one list of `notices` (i.e., warnings/errors combined) typically consisting of the following eight fields:

1. A notice priority number in the range 1-1000. Each different type of warning/error has a unique number (but not each instance of those warnings/errors). By default, notice priority numbers 700 and over are considered `errors` and 0-699 are considered `warnings`.
1. The 3-character UPPERCASE book code or OBS (if relevant)
1. The chapter number or story number (if relevant)
1. The verse number of frame number
1. The actual general description text of the notice
1. A zero-based integer index which indicates the position of the error in the given text (line or file). -1 indicates that this index does not contain any useful information, e.g., for a global error.
1. An extract of the checked text which indicates the area containing the problem. Where helpful, some character substitutions have already been made, for example, if the notice is about spaces, it is generally helpful to display spaces as a visible character in an attempt to best highlight the issue to the user. (The length of the extract is settable as an option.)
1. A string indicating the context of the notice, e.g., `in line 17 of 'someBook.usfm'`.


Keeping our notices in this format, rather than the simplicity of just saving an array of single strings, allows the above *notice components* to be processed at a higher level. The default is to funnel them all through the supplied `processNoticesToErrorsWarnings` function (in core/notice-processing-functions.fs) which does the following:

1. Removes excess repeated errors. For example, if there's a systematic error in a file, say with unneeded leading spaces in every field, rather than returning with hundreds of errors, only the first several errors will be returned, followed by an "errors suppressed" message. (The number of each error displayed is settable as an option -- zero means display all errors with no suppression.)
1. Separates notices into error and warning lists based on the priority number. (The switch-over point is settable as an option.)
1. Optionally drops the lowest priority notices.

There is a second version of the function which splits into `Severe`, `Medium`, and `Low` priority lists instead. And a third version that leaves them as notices, but allows for a Red...Yellow colour gradient instead.

However, the user is, of course, free to create their own alternative version of these functions. This is possibly also the place to consider localisation of all the notices into different interface languages???

Still unfinished:

1. Checking of links
1. Testing and fine-tuning of error messages (e.g., comparing with tX)
1. Optimise various different file fetches and caches (incl. using zips)
1. Get error messages from BCS Grammar Check (once they adjust the code)
1. Standardise parameters according to best practise (i.e., dereferencing, etc.)
1. Understand and standardise React stuff, e.g., e.g., withStyles, etc.
1. Write unit tests and get them passing
1. Check for and remove left-over (but unused) code from the copied source projects
1. Remove all debug code and console logging

## Functionality and Limitations

See component `README` for details.

# How to install

Once you have this codebase forked and cloned to your local machine, you can start modifying the codebase. You will need to ensure `node.js` and `yarn` are already installed.

### Installation and Running the Styleguide Locally

1. Install the npm dependencies with `yarn`.
1. Run the Styleguide with `yarn start`.
1. Ensure that the Styleguide is running by visiting `localhost:6060` on your web browser. (for Chromebooks see note below)
1. Modify the code and documentation in your code editor and check out the Styleguide.
    - Update the styleguide.config.js to match your new component names.
1. See debug `console.log()` output in browser console -- in chrome, CTRL-SHIFT-J to open.

### Setting up NPM Publishing

1. Rename your library:
    - the folder
    - repo on Github
1. Update the `package.json`:
    - change the `name` and `description` of your app
    - change the URLs of your `homepage` and `repository`
1. Create an account on `npmjs.org` if you don't have one already.

### Publishing to NPM

The scripts in the `package.json` file do all of the heavy lifting.

1. Commit and push all changes to your github repo.
1. Run `yarn publish`:
    - login to NPM using your credentials if asked.
    - enter the new version number using symver.
    - wait for the code to be transpiled and published to NPM.
    - wait for the styleguide to be built and deployed to GHPages.
1. Visit your published library on NPM.
1. Visit your deployed Styleguide on GHPages.

### Deploying Styleguide to GHPages

You can optionally deploy the styleguide to GHPages without publishing to NPM.

1. Run `yarn deploy`
1. There is a `predeploy` hook that builds the Styleguide.
1. That's it!

## Chromebook Linux Beta Notes

Must use `hostname -I` to get the host address. **Neither `localhost` nor `127.0.0.1` will work.**

```
$ hostname -I
100.115.92.202
$
```