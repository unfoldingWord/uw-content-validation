# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn                    # install dependencies
yarn start              # start Styleguidist dev server at localhost:6060
yarn test               # ESLint + Jest with coverage
yarn test:unit          # same as above
yarn styleguide:build   # build static styleguide
yarn deploy             # build and deploy styleguide to GitHub Pages
yarn publish            # transpile to dist/, publish to NPM, deploy styleguide, tag release
```

Run a single Jest test file:
```bash
yarn jest src/__tests__/wrapper.test.js --watchAll=false
```

## Architecture

This is a **published NPM library** (`uw-content-validation`) that validates Bible-related content files for Door43/unfoldingWord. The public API is in `src/core/index.js`, re-exported from `src/index.js`, and transpiled to `dist/` on publish.

### Layer structure

**`src/core/`** — all published library code:

- `wrapper.js` — the primary public API used by [tC Create](https://github.com/unfoldingWord/tc-create-app) and the Content Validation App. Wraps internal check functions and calls `removeDisabledNotices()` before returning. Use these exported functions (`checkTN_TSV7Table`, `checkTQ_TSV7Table`, `checkSN_TSV7Table`, `checkSQ_TSV7Table`, `checkTWL_TSV6Table`, `checkTA_markdownArticle`, `checkTW_markdownArticle`, `checkDeprecatedTN_TSV9Table`) rather than the internal ones when integrating externally.
- `getApi.js` — HTTP fetching from `git.door43.org` API with four `localforage`-backed caches (failed fetches, zip files, unzipped files, general HTTP). Callers can inject their own `getFile` / `getFileListFromZip` / `fetchRepositoryZipFile` via `checkingOptions` to bypass network calls (used in tests and editor tools).
- `defaults.js` — shared constants: `REPO_CODES_LIST`, `CATALOG_NEXT_ONLY_REPO_CODES_LIST`, OBS frame counts.
- `books/books.js` — `BibleBookData` map keyed by 3-char USFM book ID (e.g., `'GEN'`), with title, USFM prefix, testament, verse list.
- `text-handling-functions.js` — punctuation, character, and whitespace utilities used by field checkers.
- `utilities.js` — four logging functions (`userLog`, `debugLog`, `functionLog`) and two assertion helpers (`parameterAssert`, `logicAssert`). All currently print to console; can be silenced by commenting out their bodies.
- `disabled-notices.js` — hardcoded list of known false-positive notices to suppress in stable resources. Matched against notice fields to filter before returning.

**Check function naming pattern:** `check<Resource>` or `internalCheck<Resource>` (internal ones are wrapped by `wrapper.js`). Each accepts `(username, languageCode, repoCode, bookID, ...)` plus an optional `checkingOptions` object, and returns `{ successList: string[], noticeList: Notice[] }`.

File types handled:
| Module | Format |
|---|---|
| `usfm-text-check.js`, `usfm-js-check.js`, `BCS-usfm-grammar-check.js` | USFM Bible files (including word-aligned) |
| `tn-tsv9-row/table-check.js` | Legacy TN 9-column TSV |
| `notes-tsv7-row/table-check.js` | TN2/SN 7-column TSV |
| `questions-tsv7-row/table-check.js` | TQ/SQ 7-column TSV |
| `twl-tsv6-row/table-check.js` | TWL 6-column TSV |
| `markdown-text-check.js`, `markdown-file-contents-check.js` | Markdown (TA articles, TW, TQ1) |
| `yaml-text-check.js`, `manifest-text-check.js` | YAML manifests |
| `plain-text-check.js` | Plain text |

**`src/demos/`** — React Styleguidist components (not included in published dist). Demos show how to chain the core functions and process results. `notice-processing-functions.js` shows three patterns for converting raw `noticeList` to display: errors/warnings split, severe/medium/low split, and priority-sorted single list.

### Notice object shape

Every notice has:
- `priority` (1–1000, required) — 700+ treated as errors by default
- `message` (string, required)

Optional: `details`, `repoCode`, `repoName`, `filename`, `bookID`, `C`, `V`, `rowID`, `lineNumber`, `fieldName`, `characterIndex` (0-based), `excerpt`, `location`, `extra`.

### `checkingOptions` keys

Key options callers can pass:
- `disableAllLinkFetchingFlag: true` — skip all network fetches (used in tests; big speed-up)
- `disableLexiconLinkFetchingFlag: true` — skip lexicon link checks only
- `getFile({username, repository, path, branch})` — inject file retrieval (tests use local fixtures)
- `getFileListFromZip({username, repository, optionalPrefix})` — inject zip file listing
- `originalLanguageVerseText` — pass pre-loaded verse text to avoid fetching USFM for quote checks
- `excerptLength` — default 20 characters around the error position
- `suppressNoticeDisablingFlag` — set `false` (default) to remove disabled notices before returning

## Testing

Tests in `src/__tests__/` inject local fixture files via `getFile` and `getFileListFromZip` in `checkingOptions`, with `disableAllLinkFetchingFlag: true` to avoid network calls. Fixtures live in `src/__tests__/fixtures/<username>/<repository>/`.

The `jest` config collects coverage only from `src/core/**.{js,jsx,ts}`.

## Publishing

`yarn publish` runs: `babel ./src --out-dir ./dist` (strips demos and test dirs), then `yarn deploy` (gh-pages), then git-tags the version. The `dist/` directory is what consumers import; it is transpiled ES5.
