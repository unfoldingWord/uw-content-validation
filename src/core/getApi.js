import Path from 'path';
// import YAML from 'js-yaml-parser';
import localforage from 'localforage';
import { setup } from 'axios-cache-adapter';
import JSZip from 'jszip';
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

const Door43Api = setup({
  baseURL: baseURL,
  cache: {
    store: cacheStore,
    maxAge: 5 * 60 * 1000, // 5-minutes
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
 * adds caching of uncompressed files, calls getFile() if file is not cached
 * @param {String} username
 * @param {String} repository
 * @param {String} path
 * @param {String} branch
 * @return {Promise<*>}
 */
export async function getFileCached({ username, repository, path, branch }) {
  const filePath = Path.join(repository, path, branch);
  // console.log(`getFileCached(${username}, ${repository}, ${path}, ${branch})…`);
  if (cachedUnzippedFiles[filePath]) {
    // console.log(`in cache - ${filePath}`);
    return cachedUnzippedFiles[filePath];
  }

  let file = await getFile({ username, repository, path, branch });

  if (file) {
    cachedUnzippedFiles[filePath] = file;
    // console.log(`saving to cache - ${filePath}`);
  }

  return file;
}


export async function clearCaches() {
  console.log("Clearing localforage.INDEXEDDB zipStore and cacheStore caches…");
  // const tasks = [zipStore, cacheStore].map(localforage.clear);
  // const results = await Promise.all(tasks);
  // results.forEach(x => console.log("Done it", x));
  await failedStore.clear();
  await zipStore.clear();
  await cacheStore.clear();
  cachedUnzippedFiles = {};
}


/*
const resourceRepositories = ({languageId}) => {
  return {
    obs: languageId + '_obs',
    'obs-tn': languageId + '_obs-tn',
    'obs-tq': languageId + '_obs-tq',
    'obs-sn': languageId + '_obs-sn',
    'obs-sq': languageId + '_obs-sq',
    ult: languageId + '_ult',
    ust: languageId + '_ust',
    irv: languageId + '_irv',
    ulb: languageId + '_ulb',
    udb: languageId + '_udb',
    tn: languageId + '_tn',
    ta: languageId + '_ta',
    tw: languageId + '_tw',
    ugnt: 'el-x-koine_ugnt',
    uhb: 'hbo_uhb',
    ugl: languageId + '_ugl',
    uhal: languageId + '_uhal',
  };
};
*/

/*
async function fetchResourceManifests({username, languageId}) {
  let manifests = {};
  const _resourceRepositories = resourceRepositories({languageId});
  const resourceIds = Object.keys(_resourceRepositories);
  const promises = resourceIds.map(resourceId => {
    const repository = _resourceRepositories[resourceId];
    const _username = ['ugnt','uhb'].includes(resourceId) ? 'unfoldingword' : username;
    return fetchManifest({username: _username, repository})
  });
  const manifestArray = await Promise.all(promises);
  resourceIds.forEach((resourceId, index) => {
    manifests[resourceId] = manifestArray[index];
  });
  return manifests;
};


async function fetchManifest({username, repository}) {
  console.log(`fetchManifest(${username}, ${repository})…`);
  const yaml = await getFile({username, repository, path: 'manifest.yaml'});
  const json = (yaml) ? YAML.safeLoad(yaml) : null;
  return json;
};
*/

// https://git.door43.org/unfoldingword/en_ult/raw/branch/master/manifest.yaml
async function fetchFileFromServer({ username, repository, path, branch = 'master' }) {
  // console.log(`fetchFileFromServer(${username}, ${repository}, ${path}, ${branch})…`);
  const repoExists = await repositoryExists({ username, repository });
  let uri;
  if (repoExists) {
    uri = Path.join(username, repository, 'raw/branch', branch, path);
    const failMessage = await failedStore.getItem(uri);
    if (failMessage) {
      // console.log(`fetchFileFromServer failed previously for ${uri}: ${failMessage}`);
      return null;
    }
    try {
      // console.log("URI=",uri);
      const data = await cachedGet({ uri });
      // console.log("Got data", data);
      return data;
    }
    catch (fffsError) {
      // console.log(`ERROR: fetchFileFromServer could not fetch ${path}: ${fffsError}`)
      /* await */ failedStore.setItem(uri, fffsError.message);
      return null;
    }
  } else {
    // console.log(`ERROR: fetchFileFromServer repo '${repository}' does not exist!`);
    /* await */ failedStore.setItem(uri, `Repo '${repository}' does not exist!`);
    return null;
  }
};

// This is the function that we call the most from the outside
export async function getFile({ username, repository, path, branch }) {
  // console.log(`getFile(${username}, ${repository}, ${path}, ${branch})…`);
  let file;
  file = await getFileFromZip({ username, repository, path, branch });
  if (!file) {
    file = await fetchFileFromServer({ username, repository, path, branch });
  }
  return file;
}


async function getUID({ username }) {
  // console.log(`getUID(${username})…`);
  const uri = Path.join(apiPath, 'users', username);
  // console.log(`getUID uri=${uri}`);
  const user = await cachedGet({ uri });
  // console.log(`getUID user=${user}`);
  const { id: uid } = user;
  // console.log(`  getUID returning: ${uid}`);
  return uid;
}
async function repositoryExists({ username, repository }) {
  // console.log(`repositoryExists(${username}, ${repository})…`);
  const uid = await getUID({ username });
  // console.log(`repositoryExists uid=${uid}`);
  // Default limit is 10 -- way too small
  const params = { q: repository, limit: 500, uid }; // Documentation says limit is 50, but larger numbers seem to work ok
  // console.log(`repositoryExists params=${JSON.stringify(params)}`);
  const uri = Path.join(apiPath, 'repos', `search`);
  // console.log(`repositoryExists uri=${uri}`);
  const { data: repos } = await cachedGet({ uri, params });
  // console.log(`repositoryExists repos (${repos.length})=${repos}`);
  // for (const thisRepo of repos) console.log(`  thisRepo (${JSON.stringify(Object.keys(thisRepo))}) =${JSON.stringify(thisRepo.name)}`);
  const repo = repos.filter(repo => repo.name === repository)[0];
  // console.log(`repositoryExists repo=${repo}`);
  // console.log(`  repositoryExists returning: ${!!repo}`);
  return !!repo;
};


async function cachedGet({ uri, params }) {
  // console.log(`cachedGet(${uri}, ${JSON.stringify(params)})…`);
  // console.log(`  get querying: ${baseURL+uri}`);
  const { data } = await Door43Api.get(baseURL + uri, { params });
  // console.log(`  cachedGet returning: ${JSON.stringify(data)}`);
  return data;
};

export async function cachedGetURL({ uri, params }) {
  // console.log(`cachedGetURL(${uri}, ${params})…`);
  const { data } = await Door43Api.get(uri, { params });
  // console.log(`  cachedGetURL returning: ${data}`);
  return data;
};


/*
function fetchRepositoriesZipFiles({username, languageId, branch}) {
  const repositories = resourceRepositories({languageId});
  const promises = Object.values(repositories).map(repository => {
    return fetchRepositoryZipFile({username, repository, branch});
  });
  const zipArray = await Promise.all(promises);
  return zipArray;
};
*/


// https://git.door43.org/{username}/{repository}/archive/{branch}.zip
export async function fetchRepositoryZipFile({ username, repository, branch }) {
  console.log(`fetchRepositoryZipFile(${username}, ${repository}, ${branch})…`);
  const repoExists = await repositoryExists({ username, repository });
  if (!repoExists) {
    return null;
  }
  const uri = zipUri({ username, repository, branch });
  const response = await fetch(uri);
  if (response.status === 200 || response.status === 0) {
    const zipArrayBuffer = await response.arrayBuffer(); // blob storage not supported on mobile
    await zipStore.setItem(uri, zipArrayBuffer);
    return true;
  } else {
    console.log(`ERROR: fetchRepositoryZipFile got response status: ${response.status}`);
    return false;
  }
};


export async function getFilelistFromZip({ username, repository, branch, optionalPrefix }) {
  // console.log(`getFilelistFromZip(${username}, ${repository}, ${branch}, ${optionalPrefix})…`);

  const uri = zipUri({ username, repository, branch });
  let zipBlob = await zipStore.getItem(uri);

  if (!zipBlob) { // Seems that we need to load the zip file first
    const response = await fetch(uri);
    if (response.status === 200 || response.status === 0) {
      const zipArrayBuffer = await response.arrayBuffer(); // blob storage not supported on mobile
      zipBlob = await zipStore.setItem(uri, zipArrayBuffer);
    } else {
      console.log(`ERROR: getFilelistFromZip got response status: ${response.status}`);
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
    // else console.log("  getFilelistFromZip: No zipBlob");
  } catch (error) {
    console.log(`ERROR: getFilelistFromZip got: ${error.message}`);
  }

  // console.log(`getFilelistFromZip is returning (${pathList.length}) entries: ${pathList}`);
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
    // else console.log("  No zipBlob");
  } catch (error) {
    console.log(`ERROR: getFileFromZip for ${username} ${repository} ${path} ${branch} got: ${error.message}`);
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
    data = await cachedGet({ uri });
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
