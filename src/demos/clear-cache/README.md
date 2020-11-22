## Clear Cache - Readme

The code below requests some input and then clears all cached (saved) Door43 file information from the browser's local storage. This is useful if files have been updated on Door43, and you want to validate the most recent version of the files.

Of course, this will cause the checks to run slower afterwards, as they will have to refetch all the necessary files from Door43.

Unless you use this `ClearCache` function below, these demos can cache files for several hours. This means that reruns of the demos will be significantly faster in most cases.

**Note**: Clearing the cache for these demos doesn't always mean that the demos reload the very latest Door43 files—Door43 servers have their own caches and your ISP (Internet Service Provider) might have some as well. Typically the files that are fetched are at least 5-10 minutes behind the latest updates on Door43—that external caching is totally out of the control of these demos—all you can do is wait, sorry.

Simply change `N` to `Y` below to clear the internal caches.

```js
// The code in this box is editable for changing settings—
//        Simply click inside here and add, change, or delete text as required.

import ClearCache from './ClearCache';

<ClearCache
  // Change N to Y to activate the cache clearing
  areYouSure='N'
/>
```
