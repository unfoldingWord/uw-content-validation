import Path from 'path';
// import YAML from 'js-yaml-parser';
import yaml from 'yaml';
import localforage from 'localforage';
import { setup } from 'axios-cache-adapter';
import JSZip from 'jszip';
import * as books from './books';
// import { consoleLogObject } from '../core/utilities';


const baseURL = 'https://git.door43.org/';
const apiPath = 'api/v1';


const failedStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'failed-store',
});

const zipStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'zip-store',
});

const cacheStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'web-cache',
});

// NOTE: Even if data expires in this AxiosCacheAdapter, the localforage caches don't have the same / any expiry ages
//        (We expect the users of the demos to manually clear the caches when an update is required.)
const Door43Api = setup({
  baseURL: baseURL,
  cache: {
    store: cacheStore,
    maxAge: 4 * 60 * 60 * 1000, // 4 hours (unless they manually clear the cache)
    exclude: { query: false },
    key: req => {
      // if (req.params) debugger
      let serialized = req.params instanceof URLSearchParams ?
        req.params.toString() : JSON.stringify(req.params) || '';
      return req.url + serialized;
    },
  },
});


let cachedUnzippedFiles = {};

/**
 * adds caching of uncompressed files, calls cachedGetFileFromZipOrServer() if file is not cached
 * @param {String} username
 * @param {String} repository
 * @param {String} path
 * @param {String} branch
 * @return {Promise<*>}
 */
// This is the function that we call the most from the outside
export async function cachedGetFile({ username, repository, path, branch }) {
  // console.log(`cachedGetFile(${username}, ${repository}, ${path}, ${branch})…`);
  const filePath = Path.join(username, repository, path, branch);
  if (cachedUnzippedFiles[filePath]) {
    // console.log(`in cache - ${filePath}`);
    return cachedUnzippedFiles[filePath];
  }

  // NOTE: cachedGetFileFromZipOrServer() below will look for a downloaded zip first
  const fileContents = await cachedGetFileFromZipOrServer({ username, repository, path, branch });

  if (fileContents) {
    cachedUnzippedFiles[filePath] = fileContents;
    // console.log(`saving to cache - ${filePath}`);
  }

  return fileContents;
}


export async function cachedGetManifest({ username, repository, branch }) {
  // console.log(`cachedGetManifest(${username}, ${repository}, ${branch})…`);

  const manifestContents = await cachedGetFile({ username, repository, path: 'manifest.yaml', branch });
  let formData;
  try {
    formData = yaml.parse(manifestContents);
    // console.log("yaml.parse(YAMLText) got formData", JSON.stringify(formData));
  }
  catch (yamlError) {
    console.log(`ERROR: ${username} ${repository} ${branch} manifest yaml parse error: ${yamlError.message}`);
  }
  return formData;
}


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


export async function clearCaches() {
  console.log("Clearing localforage.INDEXEDDB zipStore and cacheStore caches…");
  // const tasks = [zipStore, cacheStore].map(localforage.clear);
  // const results = await Promise.all(tasks);
  // results.forEach(x => console.log("Done it", x));
  await failedStore.clear();
  await zipStore.clear();
  await cacheStore.clear(); // This should clear the Axion Door43Api cache also hopefully
  cachedUnzippedFiles = {};
}


export function formRepoName(languageCode, repoCode) {
  /**
  * @description - Creates and returns a Door43 repoName string
  * @param {String} languageCode - the language code, e.g., 'en'
  * @param {String} repoCode - the repo code, e.g., 'TQ'
  * @return {String} - the Door43 repoName string
  */
  //    console.log(`formRepoName('${languageCode}', '${repoCode}')…`);

  // TODO: Should we also check the username 'unfoldingWord' and/or 'Door43-Catalog' here???
  //        (We don't currently have the username available in this function.)
  if (repoCode === 'LT') repoCode = languageCode === 'en' ? 'ULT' : 'GLT';
  if (repoCode === 'ST') repoCode = languageCode === 'en' ? 'UST' : 'GST';

  let repo_languageCode = languageCode;
  if (repoCode === 'UHB') repo_languageCode = 'hbo';
  else if (repoCode === 'UGNT') repo_languageCode = 'el-x-koine';
  const repoName = `${repo_languageCode}_${repoCode.toLowerCase()}`;
  return repoName;
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
export async function clearCacheAndPreloadRepos(username, languageCode, bookIDList, branch = 'master', repos = ['TA', 'TW', 'TQ']) {
  // NOTE: We preload TA and TW by default because we are likely to have many links to those repos
  //        We preload TQ by default because it has thousands of files (17,337), so individual file fetches might be slow
  //          even for one book which might have several hundred files.
  console.log(`clearCacheAndPreloadRepos(${username}, ${languageCode}, ${bookIDList}, ${branch}, [${repos}])…`);
  clearCaches(); // clear existing cached files so we know we have the latest
  let success = true;

  const repos_ = [...repos];
  if (bookIDList && Array.isArray(bookIDList) && bookIDList.length > 5) { // Fetch individually if checking less books
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
export async function preloadReposIfNecessary(username, languageCode, bookIDList, branch = 'master', repos = ['TA', 'TW', 'TQ']) {
  // NOTE: We preload TA and TW by default because we are likely to have many links to those repos
  //        We preload TQ by default because it has thousands of files (17,337), so individual file fetches might be slow
  //          even for one book which might have several hundred files.
  console.log(`preloadReposIfNecessary(${username}, ${languageCode}, ${bookIDList}, ${branch}, [${repos}])…`);
  let success = true;

  const repos_ = [...repos];
  if (bookIDList && Array.isArray(bookIDList) && bookIDList.length > 5) { // Fetch individually if checking less books
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

  // // See if the required repos are there already
  // console.log(`Check if need to preload ${repos_.length} repos: ${repos_}`)
  // const newRepoList = [];
  // for (const repoCode of repos_) {
  //   const repoName = formRepoName(languageCode, repoCode);
  //   // console.log(`preloadReposIfNecessary: checking zip file for ${repoName}…`);
  //   const uri = zipUri({ username, repository: repoName, branch });
  //   const zipBlob = await zipStore.getItem(uri);
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
    const repoName = formRepoName(languageCode, repoCode);
    // console.log(`preloadReposIfNecessary: preloading zip file for ${repoName}…`);
    const zipFetchSucceeded = await cachedGetRepositoryZipFile({ username, repository: repoName, branch });
    if (!zipFetchSucceeded) {
      console.log(`ERROR: preloadReposIfNecessary() misfetched zip file for ${repoCode} repo with ${zipFetchSucceeded}`);
      success = false;
    }
  }
  return success;
}


async function cachedFetchFileFromServer({ username, repository, path, branch = 'master' }) {
  // console.log(`cachedFetchFileFromServer(${username}, ${repository}, ${path}, ${branch})…`);
  const repoExistsOnDoor43 = await repositoryExistsOnDoor43({ username, repository });
  let uri;
  if (repoExistsOnDoor43) {
    uri = Path.join(username, repository, 'raw/branch', branch, path);
    const failMessage = await failedStore.getItem(uri);
    if (failMessage) {
      // console.log(`cachedFetchFileFromServer failed previously for ${uri}: ${failMessage}`);
      return null;
    }
    try {
      // console.log("URI=",uri);
      const data = await cachedGetFileUsingPartialURL({ uri });
      // console.log("Got data", data);
      return data;
    }
    catch (fffsError) {
      console.log(`ERROR: cachedFetchFileFromServer could not fetch ${path}: ${fffsError}`)
      /* await */ failedStore.setItem(uri, fffsError.message);
      return null;
    }
  } else {
    console.log(`ERROR: cachedFetchFileFromServer repo '${repository}' does not exist!`);
    /* await */ failedStore.setItem(uri, `Repo '${repository}' does not exist!`);
    return null;
  }
};


async function cachedGetFileFromZipOrServer({ username, repository, path, branch }) {
  // console.log(`cachedGetFileFromZipOrServer(${username}, ${repository}, ${path}, ${branch})…`);
  let file;
  file = await getFileFromZip({ username, repository, path, branch });
  if (!file) {
    file = await cachedFetchFileFromServer({ username, repository, path, branch });
  }
  return file;
}


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
async function repositoryExistsOnDoor43({ username, repository }) {
  // console.log(`repositoryExistsOnDoor43(${username}, ${repository})…`);
  const uid = await getUID({ username });
  // console.log(`repositoryExistsOnDoor43 uid=${uid}`);
  // Default limit is 10 -- way too small
  const params = { q: repository, limit: 500, uid }; // Documentation says limit is 50, but larger numbers seem to work ok
  // console.log(`repositoryExistsOnDoor43 params=${JSON.stringify(params)}`);
  const uri = Path.join(apiPath, 'repos', `search`);
  // console.log(`repositoryExistsOnDoor43 uri=${uri}`);
  const { data: repos } = await cachedGetFileUsingPartialURL({ uri, params });
  // console.log(`repositoryExistsOnDoor43 repos (${repos.length})=${repos}`);
  // for (const thisRepo of repos) console.log(`  thisRepo (${JSON.stringify(Object.keys(thisRepo))}) =${JSON.stringify(thisRepo.name)}`);
  const repo = repos.filter(repo => repo.name === repository)[0];
  // console.log(`repositoryExistsOnDoor43 repo=${repo}`);
  // console.log(`  repositoryExistsOnDoor43 returning: ${!!repo}`);
  return !!repo;
};


async function cachedGetFileUsingPartialURL({ uri, params }) {
  // console.log(`cachedGetFileUsingPartialURL(${uri}, ${JSON.stringify(params)})…`);
  // console.log(`  get querying: ${baseURL+uri}`);
  const response = await Door43Api.get(baseURL + uri, { params });
  if (response.request.fromCache !== true) console.log(`  Downloaded ${uri}`);
  // console.log(`  cachedGetFileUsingPartialURL returning: ${JSON.stringify(response.data)}`);
  return response.data;
};

export async function cachedGetFileUsingFullURL({ uri, params }) {
  // console.log(`cachedGetFileUsingFullURL(${uri}, ${params})…`);
  const response = await Door43Api.get(uri, { params });
  if (response.request.fromCache !== true) console.log(`  Downloaded ${uri}`);
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


export async function cachedGetRepositoryZipFile({ username, repository, branch }) {
  // console.log(`cachedGetRepositoryZipFile(${username}, ${repository}, ${branch})…`);
  const uri = zipUri({ username, repository, branch });
  const zipBlob = await zipStore.getItem(uri);
  if (zipBlob) return true;
  // else
  return downloadRepositoryZipFile({ username, repository, branch });
}


async function downloadRepositoryZipFile({ username, repository, branch }) {
  console.log(`downloadRepositoryZipFile(${username}, ${repository}, ${branch})…`);
  const repoExists = await repositoryExistsOnDoor43({ username, repository });
  if (!repoExists) {
    return null;
  }
  // Template is https://git.door43.org/{username}/{repository}/archive/{branch}.zip
  const uri = zipUri({ username, repository, branch });
  const response = await fetch(uri);
  if (response.status === 200 || response.status === 0) {
    const zipArrayBuffer = await response.arrayBuffer(); // blob storage not supported on mobile
    await zipStore.setItem(uri, zipArrayBuffer);
    return true;
  } else {
    console.log(`ERROR: downloadRepositoryZipFile got response status: ${response.status}`);
    return false;
  }
};


export async function getFileListFromZip({ username, repository, branch, optionalPrefix }) {
  // console.log(`getFileListFromZip(${username}, ${repository}, ${branch}, ${optionalPrefix})…`);

  const uri = zipUri({ username, repository, branch });
  let zipBlob = await zipStore.getItem(uri);

  if (!zipBlob) { // Seems that we need to load the zip file first
    const response = await fetch(uri);
    if (response.status === 200 || response.status === 0) {
      const zipArrayBuffer = await response.arrayBuffer(); // blob storage not supported on mobile
      zipBlob = await zipStore.setItem(uri, zipArrayBuffer);
    } else {
      console.log(`ERROR: getFileListFromZip got response status: ${response.status}`);
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
    console.log(`ERROR: getFileListFromZip got: ${error.message}`);
  }

  // console.log(`getFileListFromZip is returning (${pathList.length}) entries: ${pathList}`);
  return pathList;
}


async function getFileFromZip({ username, repository, path, branch }) {
  // console.log(`getFileFromZip(${username}, ${repository}, ${path}, ${branch})…`);
  let file;
  const uri = zipUri({ username, repository, branch });
  const zipBlob = await zipStore.getItem(uri);
  try {
    if (zipBlob) {
      // console.log(`  Got zipBlob for uri=${uri}`);
      const zip = await JSZip.loadAsync(zipBlob);
      const zipPath = Path.join(repository.toLowerCase(), path);
      // console.log(`  zipPath=${zipPath}`);
      file = await zip.file(zipPath).async('string');
      // console.log(`    Got zipBlob ${file.length} bytes`);
    }
    // else console.log(`  No zipBlob for getFileFromZip(${username}, ${repository}, ${path}, ${branch})`);
  } catch (error) {
    console.log(`ERROR: getFileFromZip(${username}, ${repository}, ${path}, ${branch}) got: ${error.message}`);
    file = null;
  }
  return file;
};


export function zipUri({ username, repository, branch = 'master' }) {
  // console.log(`zipUri(${username}, ${repository}, ${branch})…`);
  const zipPath = Path.join(username, repository, 'archive', `${branch}.zip`);
  const zipUri = baseURL + zipPath;
  return zipUri;
};


export async function fetchTree({ username, repository, sha = 'master' }) {
  // console.log(`fetchTree(${username}, ${repository}, ${sha})…`);
  let data;
  try {
    const uri = Path.join('api/v1/repos', username, repository, 'git/trees', sha);
    // console.log(`  uri='${uri}'`);
    data = await cachedGetFileUsingPartialURL({ uri });
    // console.log(`  data (${typeof data})`);
    return data;
    // const tree = JSON.parse(data); // RJH: Why was this here???
    // console.log(`  tree (${typeof tree})`);
    // return tree;
  } catch (error) {
    console.log(`ERROR: fetchTree got: ${error.message}`);
    console.log(`  Data was: ${JSON.stringify(data)}`);
    return null;
  }
};


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
