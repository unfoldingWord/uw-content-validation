import Path from 'path';
import yaml from 'yaml';
import localforage from 'localforage';
import { setup } from 'axios-cache-adapter';
import JSZip from 'jszip';
import * as books from './books';
import { clearCheckedArticleCache } from './tn-links-check';
// import { consoleLogObject } from '../core/utilities';


// const GETAPI_VERSION_STRING = '0.6.2';

const MAX_INDIVIDUAL_FILES_TO_DOWNLOAD = 5; // More than this and it downloads the zipfile for the entire repo

const baseURL = 'https://git.door43.org/';
const apiPath = 'api/v1';


// caches failed http file fetches so we don't waste time with repeated attempts
const failedStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'CV-failed-store',
});

// caches zip file fetches done by cachedGetRepositoryZipFile()
const zipStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'CV-zip-store',
});

// caches http file fetches done by cachedFetchFileFromServer()
const cacheStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'CV-web-cache',
});

// caches the unzipped files requested so we don't do repeated unzipping of the same file which is slow in JS
const unzipStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'CV-unzip-store',
});

// API for http requests
// NOTE: Even if data expires in this AxiosCacheAdapter, the localforage caches don't have the same / any expiry ages
//        (We expect the users of the demos to manually clear the caches when an update is required.)
const Door43Api = setup({
  baseURL: baseURL,
  cache: {
    store: cacheStore,
    maxAge: 1 * 60 * 60 * 1000, // 1 hour (unless they manually clear the cache)
    exclude: { query: false },
    key: req => {
      // if (req.params) debugger
      let serialized = req.params instanceof URLSearchParams ?
        req.params.toString() : JSON.stringify(req.params) || '';
      return req.url + serialized;
    },
  },
});


/**
 * Clear all the localforage.INDEXEDDB stores
 * @return {Promise<void>}
 */
export async function clearCaches() {
  console.log("Clearing all four CV localforage.INDEXEDDB caches…");
  // const tasks = [zipStore, cacheStore].map(localforage.clear);
  // const results = await Promise.all(tasks);
  // results.forEach(x => console.log("Done it", x));
  await failedStore.clear();
  await zipStore.clear();
  await cacheStore.clear(); // This is the one used by the Axion Door43Api (above)
  await unzipStore.clear();
  await clearCheckedArticleCache(); // Used for checking TA and TW articles referred to by TN links
}


/**
 * @description - Forms and returns a Door43 repoName string
 * @param {String} languageCode - the language code, e.g., 'en'
 * @param {String} repoCode - the repo code, e.g., 'TQ'
 * @return {String} - the Door43 repoName string
 */
export function formRepoName(languageCode, repoCode) {
  //    console.log(`formRepoName('${languageCode}', '${repoCode}')…`);

  // TODO: Should we also check the username 'unfoldingWord' and/or 'Door43-Catalog' here???
  //        (We don't currently have the username available in this function.)
  if (repoCode === 'LT') repoCode = languageCode === 'en' ? 'ULT' : 'GLT';
  if (repoCode === 'ST') repoCode = languageCode === 'en' ? 'UST' : 'GST';

  let repo_languageCode = languageCode;
  if (repoCode === 'UHB') repo_languageCode = 'hbo';
  else if (repoCode === 'UGNT') repo_languageCode = 'el-x-koine';

  let repoName;
  if (repoCode === 'TWL' || repoCode === 'TN' || repoCode === 'TQ')
    repoName = `${repo_languageCode}_translation-annotations`;
  else if (repoCode === 'SN' || repoCode === 'SQ')
    repoName = `${repo_languageCode}_study-annotations`;
  else {
    if (repoCode.endsWith('1')) repoCode = repoCode.substring(0, repoCode.length - 1);
    repoName = `${repo_languageCode}_${repoCode.toLowerCase()}`;
  }
  return repoName;
}


/**
 * add new repo to list if missing
 * @param repos
 * @param newRepo
 */
/*
function addToListIfMissing(repos, newRepo) {
  if (!repos.includes(newRepo)) {
    repos.unshift(newRepo);
  }
}
*/


/**
 * try to get previously unzipped file from cache
 * @param {string} path
 * @return {Promise<unknown>} resolves to file contents or null if not found
 */
async function getUnZippedFile(path) {
  // console.log(`getUnZippedFile(${path})`);
  const contents = await unzipStore.getItem(path.toLowerCase());
  return contents;
}


/**
 * searches for files in this order:
 *   - cache of uncompressed files (unzipStore)
 *   - cache of zipped repos (zipStore)
 *   - and finally calls cachedFetchFileFromServer() which first checks in cacheStore to see if already fetched. * @param {String} username
 * @param {String} repository
 * @param {String} path
 * @param {String} branch
 * @return {Promise<*>}
 */
// This is the function that we call the most from the outside
export async function cachedGetFile({ username, repository, path, branch }) {
  // if (repository==='en_ta') console.log(`cachedGetFile(${username}, ${repository}, ${path}, ${branch})…`);
  console.assert(typeof username === 'string' && username.length, `cachedGetFile: username parameter should be a string`);
  console.assert(typeof repository === 'string' && repository.length, `cachedGetFile: repository parameter should be a string`);
  console.assert(typeof path === 'string' && path.length, `cachedGetFile: path parameter should be a string`);
  console.assert(typeof branch === 'string' && branch.length, `cachedGetFile: branch parameter should be a string`);

  const filePath = Path.join(username, repository, path, branch);
  let contents = await getUnZippedFile(filePath);
  if (contents) {
    // console.log(`cachedGetFile got ${filePath} from unzipped cache`);
    return contents;
  }

  contents = await getFileFromZip({ username, repository, path, branch });
  // if (contents)
  //   if (filePath.indexOf('_tq/') < 0) // Don't log for TQ files coz too many
  //     console.log(`  cachedGetFile got ${filePath} from zipfile`);
  if (!contents) {
    contents = await cachedFetchFileFromServer({ username, repository, path, branch });
  }

  if (contents) {
    // save unzipped file in cache to speed later retrieval
    await unzipStore.setItem(filePath.toLowerCase(), contents);
    // if (filePath.indexOf('_tq/') < 0) // Don't log for TQ files coz too many
    //   console.log(`cachedGetFile saved ${filePath} to cache for next time`);
  }
  // else console.error(`cachedGetFile(${username}, ${repository}, ${path}, ${branch}) -- failed to get file`);

  return contents;
}


/**
 * Retrieve manifest.yaml from requested repo
 * @param {string} username
 * @param {string} repository
 * @param {string} branch
 * @return {Promise<[]|*[]>} resolves to manifest contents if downloaded (else undefined)
 */
async function cachedGetManifest({ username, repository, branch }) {
  // console.log(`cachedGetManifest(${username}, ${repository}, ${branch})…`);

  const manifestContents = await cachedGetFile({ username, repository, path: 'manifest.yaml', branch });
  let formData;
  try {
    formData = yaml.parse(manifestContents);
    // console.log("yaml.parse(YAMLText) got formData", JSON.stringify(formData));
  }
  catch (yamlError) {
    console.error(`${username} ${repository} ${branch} manifest yaml parse error: ${yamlError.message}`);
  }
  return formData;
}


/**
 * Retrieve manifest.yaml from requested repo
 * @param {string} username
 * @param {string} repository
 * @param {string} branch
 * @param {string} bookID -- 3-character USFM book code
 * @return {Promise<[]|*[]>} resolves to filename from the manifest for the book (else undefined)
 */
export async function cachedGetBookFilenameFromManifest({ username, repository, branch, bookID }) {
  // console.log(`cachedGetBookFilenameFromManifest(${username}, ${repository}, ${branch}, ${bookID})…`);
  const manifestJSON = await cachedGetManifest({ username, repository, branch });
  for (const projectEntry of manifestJSON.projects) {
    if (projectEntry.identifier === bookID) {
      let bookPath = projectEntry.path;
      if (bookPath.startsWith('./')) bookPath = bookPath.substring(2);
      return bookPath;
    }
  }
}


/**
 * Clears the caches of stale data and preloads repo zips, before running book package checks
 *   This allows the calling app to clear cache and start loading repos in the backgound as soon as it starts up.
 *      In this case it would not need to use await to wait for results.
 *   TRICKY: note that even if the user is super fast in selecting books and clicking next, it will not hurt anything.
 *      cachedGetFileFromZipOrServer() would just be fetching files directly from repo until the zips are loaded.
 *      After that the files would be pulled out of zipStore.
 * @param {string} username
 * @param {string} languageCode
 * @param {Array} bookIDList - one or more books that will be checked
 * @param {string} branch - optional, defaults to master
 * @param {Array} repos - optional, list of repos to pre-load
 * @return {Promise<Boolean>} resolves to true if file loads are successful
 */
/*
async function clearCacheAndPreloadRepos(username, languageCode, bookIDList, branch = 'master', repos = ['TA', 'TW', 'TQ']) {
  // NOTE: We preload TA and TW by default because we are likely to have many links to those repos
  //        We preload TQ1 by default because it has thousands of files (17,337), so individual file fetches might be slow
  //          even for one book which might have several hundred files.
  console.log(`clearCacheAndPreloadRepos(${username}, ${languageCode}, ${bookIDList}, ${branch}, [${repos}])…`);
  clearCaches(); // clear existing cached files so we know we have the latest
  let success = true;

  const repos_ = [...repos];
  if (bookIDList && Array.isArray(bookIDList) && bookIDList.length > MAX_INDIVIDUAL_FILES_TO_DOWNLOAD) { // Fetch individually if checking less books
    // make sure we have the original languages needed
    for (const bookID of bookIDList) {
      if (bookID !== 'OBS') {
        const whichTestament = books.testament(bookID); // returns 'old' or 'new'
        const origLang = whichTestament === 'old' ? 'UHB' : 'UGNT';
        if (!repos_.includes(origLang))
          repos_.unshift(origLang);
      }
    }
  }

  // Fetch zipped versions of all the repos needing to be preloaded
  console.log(`Need to preload ${repos_.length} repos: ${repos_}`)
  for (const repoCode of repos_) {
    const repoName = formRepoName(languageCode, repoCode);
    console.log(`clearCacheAndPreloadRepos: preloading zip file for ${repoName}…`);
    const zipFetchSucceeded = await cachedGetRepositoryZipFile({ username, repository: repoName, branch });
    if (!zipFetchSucceeded) {
      console.log(`clearCacheAndPreloadRepos: misfetched zip file for ${repoCode} repo with ${zipFetchSucceeded}`);
      success = false;
    }
  }

  return success;
}
*/


/**
 * preloads repo zips, before running book package checks.
 *   TRICKY: note that even if the user is super fast in selecting books and clicking next, it will not hurt anything.  getFile() would just be fetching files directly from repo until the zips are loaded.  After that the files would be pulled out of zipStore.
 * @param {string} username
 * @param {string} languageCode
 * @param {Array} bookIDList - one or more books that will be preloaded
 * @param {string} branch - optional, defaults to master
 * @param {Array} repos - optional, list of additional repos to pre-load
 * @param {boolean} loadOriginalLangs - if true will download original language books
 * @return {Promise<Boolean>} resolves to true if file loads are successful
 */
/*
async function PreLoadRepos(username, languageCode, bookIDList, branch = 'master', repos = [], loadOriginalLangs = false) {
  console.log(`PreLoadRepos(${username}, ${languageCode}, ${bookIDList}, ${branch}, ${repos}, ${loadOriginalLangs})…`);

  let success = true;
  const repos_ = repos.map((repo) => (formRepoName(languageCode, repo)));

  if (loadOriginalLangs) {
    // make sure we have the original languages needed
    for (const origLangBibles of [ 'UHB', 'UGNT' ]) {
      addToListIfMissing(repos_, formRepoName(languageCode, origLangBibles));
    }
  }

  if (bookIDList && Array.isArray(bookIDList)) {
    for (const bookID of bookIDList) {
      if (bookID !== 'OBS') {
        addToListIfMissing(repos_, formRepoName(languageCode, 'LT'));
        addToListIfMissing(repos_, formRepoName(languageCode, 'ST'));
      }
    }
  }

  // load all the repos needed
  for (const repoName of repos_) {
    console.log(`PreLoadRepos: preloading zip file for ${repoName}…`);
    const zipFetchSucceeded = await cachedGetRepositoryZipFile({ username, repository: repoName, branch });
    if (!zipFetchSucceeded) {
      console.error(`PreLoadRepos: misfetched zip file for ${repoName} repo with ${zipFetchSucceeded}`);
      success = false;
    }
  }

  return success;
}
*/


/**
 * Preloads any necessary repo zips, before running book package checks
 *   This allows the calling app to clear cache and start loading repos in the backgound as soon as it starts up.
 *      In this case it would not need to use await to wait for results.
 *   TRICKY: note that even if the user is super fast in selecting books and clicking next, it will not hurt anything.
 *            cachedGetFileFromZipOrServer() would just be fetching files directly from repo until the zips are loaded.
 *            After that the files would be pulled out of zipStore.
 * @param {string} username
 * @param {string} languageCode
 * @param {Array} bookIDList - one or more books that will be checked
 * @param {string} branch - optional, defaults to master
 * @param {Array} repos - optional, list of repos to pre-load
 * @return {Promise<Boolean>} resolves to true if file loads are successful
 */
export async function preloadReposIfNecessary(username, languageCode, bookIDList, branch = 'master', repos = ['TA', 'TW', 'TQ1']) {
  // NOTE: We preload TA and TW by default because we are likely to have many links to those repos
  //        We preload TQ1 by default because it has thousands of files (17,337), so individual file fetches might be slow
  //          even for one book which might have several hundred files.
  console.log(`preloadReposIfNecessary(${username}, ${languageCode}, ${bookIDList} (${typeof bookID}), ${branch}, [${repos}])…`);
  let success = true;

  const repos_ = [...repos];
  if (bookIDList.length ===1 && bookIDList[0] === 'OBS') {
    if (!repos_.includes('OBS'))
      repos_.unshift('OBS');
  }
  if (bookIDList && Array.isArray(bookIDList) && bookIDList.length > MAX_INDIVIDUAL_FILES_TO_DOWNLOAD) { // Fetch individually if checking less books
    // make sure we have the original languages needed
    for (const bookID of bookIDList) {
      if (bookID !== 'OBS') {
        const whichTestament = books.testament(bookID); // returns 'old' or 'new'
        const origLang = whichTestament === 'old' ? 'UHB' : 'UGNT';
        if (!repos_.includes(origLang))
          repos_.unshift(origLang);
      }
    }
  }
  // console.log("  Adjusted repo list", repos_.length, JSON.stringify(repos_));

  // // See if the required repos are there already
  // console.log(`Check if need to preload ${repos_.length} repos: ${repos_}`)
  // const newRepoList = [];
  // for (const repoCode of repos_) {
  //   const repoName = formRepoName(languageCode, repoCode);
  //   // console.log(`preloadReposIfNecessary: checking zip file for ${repoName}…`);
  //   const uri = zipUri({ username, repository: repoName, branch });
  //   const zipBlob = await zipStore.getItem(uri.toLowerCase());
  //   if (!zipBlob) newRepoList.push(repoCode);
  // }

  // if (newRepoList.length) { // Fetch zipped versions of all the repos needing to be preloaded
  //   console.log(`Need to preload ${newRepoList.length} repos: ${newRepoList}`)
  //   for (const repoCode of newRepoList) {
  //     const repoName = formRepoName(languageCode, repoCode);
  //     console.log(`preloadReposIfNecessary: preloading zip file for ${repoName}…`);
  //     const zipFetchSucceeded = await cachedGetRepositoryZipFile({ username, repository: repoName, branch });
  //     if (!zipFetchSucceeded) {
  //       console.log(`preloadReposIfNecessary: misfetched zip file for ${repoCode} repo with ${zipFetchSucceeded}`);
  //       success = false;
  //     }
  //   }
  // }
  // else console.log("All repos were cached already!");

  for (const repoCode of repos_) {
    let adjustedLanguageCode = languageCode;
    if ((languageCode === 'hbo' && repoCode !== 'UHB') || (languageCode === 'el-x-koine' && repoCode !== 'UGNT'))
      adjustedLanguageCode = 'en'; // Assume English then
    const repoName = formRepoName(adjustedLanguageCode, repoCode);
    // console.log(`preloadReposIfNecessary: preloading zip file for ${repoName}…`);
    const zipFetchSucceeded = await cachedGetRepositoryZipFile({ username, repository: repoName, branch });
    if (!zipFetchSucceeded) {
      console.error(`preloadReposIfNecessary() misfetched zip file for ${repoCode} repo with ${zipFetchSucceeded}`);
      success = false;
    }
  }
  return success;
}


/**
 * does http file fetch from server  uses cacheStore to minimize repeated fetches of same file
 * @param {string} username
 * @param {string} repository
 * @param {string} path
 * @param {string} branch
 * @return {Promise<null|any>} resolves to file content
 */
async function cachedFetchFileFromServer({ username, repository, path, branch = 'master' }) {
  // console.log(`cachedFetchFileFromServer(${username}, ${repository}, ${path}, ${branch})…`);
  // TODO: Check how slow this next call is -- can it be avoided or cached?
  // RJH removed this 2Oct2020 -- what's the point -- it just slows things down --
  //      if it needs to be checked, should be checked before this point
  // const repoExistsOnDoor43 = await repositoryExistsOnDoor43({ username, repository });
  // let uri;
  const uri = Path.join(username, repository, 'raw/branch', branch, path);
  const failMessage = await failedStore.getItem(uri.toLowerCase());
  if (failMessage) {
    // console.log(`  cachedFetchFileFromServer failed previously for ${uri}: ${failMessage}`);
    return null;
  }
  try {
    // console.log("URI=",uri);
    const data = await cachedGetFileUsingPartialURL({ uri });
    // console.log("Got data", data);
    return data;
  }
  catch (fffsError) {
    console.error(`cachedFetchFileFromServer could not fetch ${username} ${repository} ${branch} ${path}: ${fffsError}`)
      /* await */ failedStore.setItem(uri.toLowerCase(), fffsError.message);
    return null;
  }
  // } else { // ! repoExistsOnDoor43
  //   console.error(`cachedFetchFileFromServer repo ${username} '${repository}' does not exist!`);
  //   /* await */ failedStore.setItem(uri.toLowerCase(), `Repo '${repository}' does not exist!`);
  //   return null;
  // }
};


/**
 *  older getFile without that doesn't use the unzipStore
 * @param {string} username
 * @param {string} repository
 * @param {string} path
 * @param {string} branch
 * @return {Promise<*>}
 */
/*
async function cachedGetFileFromZipOrServer({ username, repository, path, branch }) {
  // console.log(`cachedGetFileFromZipOrServer(${username}, ${repository}, ${path}, ${branch})…`);
  let file;
  file = await getFileFromZip({ username, repository, path, branch });
  if (!file) {
    file = await cachedFetchFileFromServer({ username, repository, path, branch });
  }
  return file;
}
*/

async function getUID({ username }) {
  // console.log(`getUID(${username})…`);
  const uri = Path.join(apiPath, 'users', username);
  // console.log(`getUID uri=${uri}`);
  const user = await cachedGetFileUsingPartialURL({ uri });
  // console.log(`getUID user=${user}`);
  const { id: uid } = user;
  // console.log(`  getUID returning: ${uid}`);
  return uid;
}

export async function repositoryExistsOnDoor43({ username, repository }) {
  // console.log(`repositoryExistsOnDoor43(${username}, ${repository})…`);
  let uid;
  try {
    uid = await getUID({ username });
  } catch (uidError) {
    console.error(`repositoryExistsOnDoor43(${username}, ${repository}) - invalid username`, uidError.message);
    return false;
  }
  // console.log(`repositoryExistsOnDoor43 uid=${uid}`);
  // Default limit is 10 -- way too small
  const params = { q: repository, limit: 500, uid }; // Documentation says limit is 50, but larger numbers seem to work ok
  const uri = Path.join(apiPath, 'repos', `search`);
  // console.log(`repositoryExistsOnDoor43 uri=${uri}`);
  let retrievedRepoList;
  try {
    const { data: retrievedRepoListData } = await cachedGetFileUsingPartialURL({ uri, params });
    retrievedRepoList = retrievedRepoListData;
  }
  catch (rEE) {
    console.error(`repositoryExistsOnDoor43(${username}, ${repository}) - error fetching repo list`, rEE.message);
    return false;
  }
  // console.log("retrievedRepoList.length", retrievedRepoList.length);
  if (retrievedRepoList.length < 1) {
    console.log(`repositoryExistsOnDoor43(${username}, ${repository}) - no repos found`, retrievedRepoList);
    return false;
  }
  // console.log(`repositoryExistsOnDoor43 retrievedRepoList (${retrievedRepoList.length})=${JSON.stringify(retrievedRepoList)}`);
  // for (const thisRepo of retrievedRepoList) console.log(`  thisRepo (${JSON.stringify(Object.keys(thisRepo))}) =${JSON.stringify(thisRepo.name)}`);
  const desiredMatch = `${username}/${repository}`.toLowerCase();
  const filteredRepoList = retrievedRepoList.filter(repo => repo.full_name.toLowerCase() === desiredMatch);
  if (filteredRepoList.length < 1) {
    console.log(`repositoryExistsOnDoor43(${username}, ${repository}) - repo not found`, retrievedRepoList.length, filteredRepoList.length);
    return false;
  }
  // const foundRepo = filteredRepoList[0];
  // console.log(`repositoryExistsOnDoor43 foundRepo=${JSON.stringify(foundRepo)}`);
  return true;
};


async function cachedGetFileUsingPartialURL({ uri, params }) {
  // console.log(`cachedGetFileUsingPartialURL(${uri}, ${JSON.stringify(params)})…`);
  // console.log(`  get querying: ${baseURL+uri}`);
  const response = await Door43Api.get(baseURL + uri, { params });
  if (response.request.fromCache !== true) console.log(`  Door43Api downloaded Door43 ${uri}`);
  // console.log(`  cachedGetFileUsingPartialURL returning: ${JSON.stringify(response.data)}`);
  return response.data;
};

export async function cachedGetFileUsingFullURL({ uri, params }) {
  // console.log(`cachedGetFileUsingFullURL(${uri}, ${params})…`);
  const response = await Door43Api.get(uri, { params });
  if (response.request.fromCache !== true) console.log(`  Door43Api downloaded ${uri}`);
  // console.log(`  cachedGetFileUsingFullURL returning: ${response.data}`);
  return response.data;
};


/*
function fetchRepositoriesZipFiles({username, languageId, branch}) {
  const repositories = resourceRepositories({languageId});
  const promises = Object.values(repositories).map(repository => {
    return downloadRepositoryZipFile({username, repository, branch});
  });
  const zipArray = await Promise.all(promises);
  return zipArray;
};
*/


/**
 * retrieve repo as zip file
 * @param {string} username
 * @param {string} repository
 * @param {string} branch
 * @param {boolean} forceLoad - if not true, then use existing repo in zipstore
 * @return {Promise<[]|*[]>} resolves to true if downloaded
 */
export async function cachedGetRepositoryZipFile({ username, repository, branch }, forceLoad = false) {
  // https://git.door43.org/{username}/{repository}/archive/{branch}.zip
  // console.log(`cachedGetRepositoryZipFile(${username}, ${repository}, ${branch}, ${forceLoad})…`);

  if (!forceLoad) { // see if we already have in zipStore
    const zipBlob = await getZipFromStore(username, repository, branch);
    if (zipBlob) {
      // console.log(`cachedGetRepositoryZipFile for ${username}, ${repository}, ${branch} -- already loaded`);
      return true;
    }
  }
  return downloadRepositoryZipFile({ username, repository, branch });
};


async function downloadRepositoryZipFile({ username, repository, branch }) {
  console.log(`downloadRepositoryZipFile(${username}, ${repository}, ${branch})…`);
  // RJH removed this 2Oct2020 -- what's the point -- it just slows things down --
  //      if it needs to be checked, should be checked before this point
  // const repoExists = await repositoryExistsOnDoor43({ username, repository });
  // if (!repoExists) {
  //   console.error(`downloadRepositoryZipFile(${username}, ${repository}, ${branch}) -- repo doesn't even exist`);
  //   return null;
  // }

  // Template is https://git.door43.org/{username}/{repository}/archive/{branch}.zip
  const uri = zipUri({ username, repository, branch });
  const response = await fetch(uri);
  if (response.status === 200 || response.status === 0) {
    const zipArrayBuffer = await response.arrayBuffer(); // blob storage not supported on mobile
    await zipStore.setItem(uri.toLowerCase(), zipArrayBuffer);
    // console.log(`  downloadRepositoryZipFile(${username}, ${repository}, ${branch}) -- saved zip: ${uri}`);
    return true;
  } else {
    console.error(`downloadRepositoryZipFile(${username}, ${repository}, ${branch}) -- got response status: ${response.status}`);
    return false;
  }
};


/**
 * pull repo from zipstore and get a file list
 * @param {string} username
 * @param {string} repository
 * @param {string} branch
 * @param {string} optionalPrefix - to filter by book, etc.
 * @return {Promise<[]|*[]>}  resolves to file list
 */
export async function getFileListFromZip({ username, repository, branch, optionalPrefix }) {
  // console.log(`getFileListFromZip(${username}, ${repository}, ${branch}, ${optionalPrefix})…`);

  const uri = zipUri({ username, repository, branch });
  let zipBlob = await getZipFromStore(username, repository, branch);

  if (!zipBlob) { // Seems that we need to load the zip file first
    const response = await fetch(uri);
    if (response.status === 200 || response.status === 0) {
      const zipArrayBuffer = await response.arrayBuffer(); // blob storage not supported on mobile
      zipBlob = await zipStore.setItem(uri.toLowerCase(), zipArrayBuffer);
    } else {
      console.error(`getFileListFromZip got response status: ${response.status}`);
      return [];
    }
  }

  const pathList = [];
  try {
    if (zipBlob) {
      // console.log(`  Got zipBlob for uri=${uri}`);
      const zip = await JSZip.loadAsync(zipBlob);
      // console.log(`  Got zip`);
      // Now we need to fetch the list of files from the repo
      // zip.forEach(function (relativePath, fileObject) {
      zip.forEach(function (relativePath) {
        // console.log(`relPath=${relativePath}`)
        // consoleLogObject('fileObject', fileObject);
        if (!relativePath.endsWith('/')) // it's not a folder
        {
          if (relativePath.startsWith(`${repository}/`)) // remove repo name prefix
            relativePath = relativePath.substring(repository.length + 1);
          if (relativePath.length
            && !relativePath.startsWith('.git') // skips files in these folders
            && !relativePath.startsWith('.apps') // skips files in this folder
            && (!optionalPrefix || relativePath.startsWith(optionalPrefix))) // it's the correct prefix
            pathList.push(relativePath);
        }
      })
    }
    // else console.log("  getFileListFromZip: No zipBlob");
  } catch (error) {
    console.error(`getFileListFromZip got: ${error.message}`);
  }

  // console.log(`getFileListFromZip is returning (${pathList.length}) entries: ${pathList}`);
  return pathList;
}


/**
 * try to get zip file from cache
 * @param {string} username
 * @param {string} repository
 * @param {string} branch
 * @return {Promise<unknown>} resolves to null if not found
 */
async function getZipFromStore(username, repository, branch) {
  // console.log(`getZipFromStore(${username}, ${repository}, ${branch})…`);
  const uri = zipUri({ username, repository, branch });
  // console.log(`  uri=${uri}`);
  const zipBlob = await zipStore.getItem(uri.toLowerCase());
  // console.log(`  getZipFromStore(${uri} -- empty: ${!zipBlob}`);
  return zipBlob;
}


/**
 * pull repo from zipstore and get the unzipped file
 * @param {string} username
 * @param {string} repository
 * @param {string} branch
 * @param {object} optionalPrefix
 * @return {Promise<[]|*[]>} resolves to unzipped file if found or null
 */
async function getFileFromZip({ username, repository, path, branch }) {
  // console.log(`getFileFromZip(${username}, ${repository}, ${path}, ${branch})…`);
  let file;
  const zipBlob = await getZipFromStore(username, repository, branch);
  try {
    if (zipBlob) {
      // console.log(`  Got zipBlob for uri=${uri}`);
      const zip = await JSZip.loadAsync(zipBlob);
      const zipPath = Path.join(repository.toLowerCase(), path);
      // console.log(`  zipPath=${zipPath}`);
      file = await zip.file(zipPath).async('string');
      // console.log(`    Got zipBlob ${file.length} bytes`);
    }
    // else console.log("  No zipBlob");
  } catch (error) {
    if (error.message.indexOf(' is null') < 0)
      console.error(`getFileFromZip for ${username} ${repository} ${path} ${branch} got: ${error.message}`);
    file = null;
  }
  return file;
};


function zipUri({ username, repository, branch = 'master' }) {
  // console.log(`zipUri(${username}, ${repository}, ${branch})…`);
  const zipPath = Path.join(username, repository, 'archive', `${branch}.zip`);
  const zipUri = baseURL + zipPath;
  return zipUri;
};


// async function fetchTree({ username, repository, sha = 'master' }) {
//   // console.log(`fetchTree(${username}, ${repository}, ${sha})…`);
//   let data;
//   try {
//     const uri = Path.join('api/v1/repos', username, repository, 'git/trees', sha);
//     // console.log(`  uri='${uri}'`);
//     data = await cachedGetFileUsingPartialURL({ uri });
//     // console.log(`  data (${typeof data})`);
//     return data;
//     // const tree = JSON.parse(data); // RJH: Why was this here???
//     // console.log(`  tree (${typeof tree})`);
//     // return tree;
//   } catch (error) {
//     console.error(`fetchTree got: ${error.message}`);
//     console.log(`  Data was: ${JSON.stringify(data)}`);
//     return null;
//   }
// };


/*
async function recursiveTree({username, repository, path, sha}) {
  console.log("recurse tree args:",username,repository,path,sha)
  let tree = {};
  const pathArray = path.split();
  const results = fetchTree({username, repository, sha});
  const result = results.tree.filter(item => item.path === pathArray[0])[0];
  if (result) {
    if (result.type === 'tree') {
      const childPath = pathArray.slice(1).join('/');
      const children = recursiveTree({username, repository, path: childPath, sha: result.sha});
      tree[result.path] = children;
    } else if (result.type === 'blob') {
      tree[result.path] = true;
    }
  }
};

async function fileExists({username, repository, path, branch}) {
  // get root listing
  recursiveTree()
  // get recursive path listing
}
*/
