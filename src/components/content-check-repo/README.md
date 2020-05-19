
### Example

This is a component that counts the words for an entire repo or some subset.

#### Case 1 - an entire repo

```js
<ContentCheckRepo url='https://git.door43.org/cecil.new/content-check-test-repo' />
```

#### Case 2 - to a folder within a repo

To a folder in a repo.

```js
<ContentCheckRepo url='https://git.door43.org/cecil.new/content-check-test-repo/folder2' />
```

#### Case 3 - to a file within a repo

To a file in a repo that has expected filetype:

```js
<ContentCheckRepo url='https://git.door43.org/cecil.new/content-check-test-repo/README.md' />
```

To a file in a repo that does not have the expected filetype. This will work since the desired file is explicitly specified and will override the normal constraints. USFM and UTN/TSV examples:

```js
<ContentCheckRepo url='https://git.door43.org/cecil.new/content-check-test-repo/folder1/jud.usfm' />
```

```js
<ContentCheckRepo url='https://git.door43.org/cecil.new/content-check-test-repo/folder1/titus.tsv' />
```

#### Case 4 - to an invalid repo

To a non-existent repo.

```js
<ContentCheckRepo url='https://git.door43.org/thisisnotvalid' />
```

#### Case 5 - to an invalid file or folder within a repo

To a non-existent file or folder.

```js
<ContentCheckRepo url='https://git.door43.org/cecil.new/CurrentState/notafile' />
```
