import { fetchTree, getFilelistFromZip, fetchRepositoryZipFile, getFile, getURL } from '../core/getApi';
import JSZip from 'jszip';
import { consoleLogObject } from '../core/utilities';


const HELPERS_VERSION_STRING = '0.2.1';


/*
// This function was EXTREMELY SLOW!!!
export async function getFilelistFromFetchedTreemaps(username, repoName, branch, givenPath) {
    // console.log(`getFilelist v${HELPERS_VERSION_STRING} with ${username}, ${repoName}, ${branch}, ${givenPath}…`);

    // Now we need to fetch the list of files from the repo
    // console.log("getFilelistFromFetchedTreemaps about to fetch tree for", username, repoName, branch, givenPath);
    let fetchedRepoTreemap = await fetchTree({ username: username, repository: repoName, sha: branch });
    if (givenPath) { // Note that we only support one level here, i.e., no / in givenPath
        let found = false;
        // console.log(`Have givenPath='${givenPath}'`);
        // console.log("  original fetchedRepoTreemap", JSON.stringify(fetchedRepoTreemap.tree));

        for (const [_number, detailObject] of fetchedRepoTreemap.tree.entries()) {
            // consoleLogObject("detailObject", detailObject);
            if (detailObject.type === 'tree' && detailObject.path === givenPath) {
                // consoleLogObject("found detailObject", detailObject);
                const subtreeURI = detailObject.url;
                // Something like: https://git.door43.org/api/v1/repos/unfoldingWord/en_tq/git/trees/2d87fe72bfd7efced23f4fa61485d766e8446191
                // console.log(`subtreeURI=${subtreeURI}`);
                fetchedRepoTreemap = await getURL({ uri: subtreeURI });
                found = true;
                break;
            }
        }
        if (!found) {
            console.log(`ERROR: UNABLE TO FIND PATH '${givenPath}' in ${username}/${repoName}`);
            return [];
        }
        // const uri = Path.join('api/v1/repos', username, repository, 'git/trees', branch);
        // console.log(`  uri='${uri}'`);
        // const fetchedRepoTreemap = await get({uri});
    }
    // fetchedRepoTreemap = fetchedRepoTreemap.tree;
    // console.log("  fetchedRepoTreemap keys", JSON.stringify(Object.keys(fetchedRepoTreemap)));
    // console.log("  fetchedRepoTreemap.tree", JSON.stringify(fetchedRepoTreemap.tree));
    // consoleLogObject("  fetchedRepoTreemap", fetchedRepoTreemap);

    const pathList = [];

    async function walkTree(givenTree, pathPrefix) {
        /*
        Load all the filenames by means of the tree
            so this function is called recursively for subfolders
        *//*
        // console.log("tree1 type =", typeof givenTree); // == Object
        // console.log("tree2 type =", typeof givenTree.tree); // == Object
        // consoleLogObject("givenTree.tree", givenTree.tree);
        for (const [_number, detailObject] of givenTree.tree.entries()) {
            // console.log("getFilelistFromFetchedTreemaps processing", thisFilename);
            // console.log("  thisFilename="+thisFilename, "detailObject="+detailObject);
            // consoleLogObject("detailObject", detailObject);
            // detailObject has fields: path, mode, type, size, sha, url

            const thisFilename = detailObject.path;
            // console.log(`thisFilename=${thisFilename}`);

            // Ignore standard git metadata and similar files/folders
            if (thisFilename === '.github'
                || thisFilename === '.gitattributes'
                || thisFilename === '.gitignore'
                || thisFilename === '.apps'
            ) {
                // console.log("  Ignoring", thisFilename)
                continue;
            }

            // console.log(`thisType=${detailObject.type}`);
            if (detailObject.type === 'blob') {
                let thisPath = pathPrefix? `${pathPrefix}/${thisFilename}` : thisFilename;
                thisPath = givenPath? `${givenPath}/${thisPath}` : thisPath;
                // console.log(`thisPath=${thisPath}`);
                pathList.push(thisPath);
            } else if (detailObject.type === 'tree') {
                const subtreeURI = detailObject.url;
                // Something like: https://git.door43.org/api/v1/repos/unfoldingWord/en_tq/git/trees/2d87fe72bfd7efced23f4fa61485d766e8446191
                // console.log(`subtreeURI=${subtreeURI}`);
                let fetchedSubRepoTreemap = await getURL({ uri: subtreeURI });
                // fetchedSubRepoTreemap = fetchedSubRepoTreemap.tree;
                // console.log("  fetchedSubRepoTreemap", JSON.stringify(fetchedSubRepoTreemap));
                // console.log("  fetchedSubRepoTreemap keys", JSON.stringify(Object.keys(fetchedSubRepoTreemap)));
                // consoleLogObject("  fetchedSubRepoTreemap", fetchedSubRepoTreemap);
                const newPath = pathPrefix ? `${pathPrefix}/${detailObject.path}` : detailObject.path;
                // console.log(`newPath=${newPath}`);
                await walkTree(fetchedSubRepoTreemap, newPath);
            } else
                console.log(`What is thisType=${detailObject.type}`);
        }
    }
    await walkTree(fetchedRepoTreemap, '');

    // console.log(`getFilelistFromFetchedTreemaps is returning (${pathList.length}) ${pathList}`);
    return pathList;
}
*/
