## Clear Cache - Readme

The code below requests some info and then clears all saved Door43 file information from the browser's local storage. This is useful if files have been updated on Door43, and you want to validate the most recent version of the files.

Of course, this will cause some of the checks to run slower now, as they will have to refetch all the necessary files from Door43.

Simply change `N` to `Y` below to clear the caches.

```js
import ClearCache from './ClearCache';

<ClearCache
  // Change N to Y to activate the cache clearing
  areYouSure='N'
/>
```
