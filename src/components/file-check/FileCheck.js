import React, { useContext, useEffect, useState } from 'react';
// import PropTypes from 'prop-types';
// import ReactJson from 'react-json-view';
// import { Paper, Button } from '@material-ui/core';
// import { RepositoryContext, FileContext } from 'gitea-react-toolkit';
import { withStyles } from '@material-ui/core/styles';
import { getFile } from '../../core/getApi';
import checkFile from './checkFile';
import { processNoticesToErrorsWarnings } from '../../core/notice-processing-functions';
import { RenderSuccessesErrorsWarnings } from '../RenderProcessedResults';
import { ourParseInt, consoleLogObject } from '../../core/utilities';


const CHECKER_VERSION_STRING = '0.1.1';

/*
function FileCheckGRT(props) {
    const { state: repo, component: repoComponent } = useContext(RepositoryContext);
    const { state: file, component: fileComponent } = useContext(FileContext);
    // const [result, setResultValue] = useState("Waiting-CheckFile");

    console.log("I'm here in FileCheckGRT v" + CHECKER_VERSION_STRING);
    // consoleLogObject("props", props);
    // if (repo) consoleLogObject("repo", repo);
    /* Has fields: id:number, owner:object, name, full_name, description,
        empty, private, fork, parent, mirror, size,
        html_url, ssh_url, clone_url, website,
        stars_count, forks_count, watchers_count, open_issues_count,
        default_branch, archived, created_at, updated_at, permissions:object,
        has_issues, has_wiki, has_pull_requests, ignore_whitespace_conflicts,
        allow_merge_commits, allow_rebase, allow_rebase_explicit, allow_squash_merge,
        avatar_url, branch, tree_url *//*
// if (file) consoleLogObject("file", file);
/* Has fields: name, path, sha, type=file,
size, encoding=base64, content,
html_url, git_url, download_url,
_links:object, branch, filepath. *//*

//  Displays "Loading…" correctly when loading
//      but keeps it there even if there's errors or problems :-(
// TODO: Add a timeout function
let returnedResult;
if (repo) // the repo metadata is loaded now
  // this displays briefly once the repo is loaded, but before the file is loaded
  returnedResult = (<>
      <b style={{ color: 'magenta' }}>Attempting to load a file from <b>{repo.full_name}</b> <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch…</b>
  </>);
else // this is what displays initially (and stays displayed if there's no errors)
  returnedResult = (<>
      <b style={{ color: 'purple' }}>Attempting to load a file…</b>
  </>);

if (file) { // the file is loaded now and the content is now available to use
  // console.log("Got "+file.name);
  // setResultValue(<>
  //     <b>Checking {file.name}</b> from {repo.full_name}…
  // </>);
  // console.log("Updated!");

  let givenLocation = props['location'] ? props['location'] : "";
  if (givenLocation && givenLocation[0] !== " ") givenLocation = ` ${givenLocation}`;
  givenLocation = ` in ${repo.full_name} repo${givenLocation}`;

  let checkingOptions = { // Uncomment any of these to test them
      // 'extractLength': 25,
  };
  // Or this allows the parameters to be specified as a FileCheck property
  if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);

  const rawResults = checkFile(file.name, file.content, givenLocation, checkingOptions);
  // console.log("FileCheck got initial results with " + rawResults.successList.length + " success message(s) and " + rawResults.noticeList.length + " notice(s)");

  // Add some extra fields to our rawResults object in case we need this information again later
  rawResults.checkType = 'File';
  rawResults.repoFullname = repo.full_name;
  rawResults.checkingOptions = checkingOptions;

  // Now do our final handling of the result
  let processOptions = { // Uncomment any of these to test them
      // 'maximumSimilarMessages': 3, // default is 2
      // 'errorPriorityLevel': 800, // default is 700
      // 'cutoffPriorityLevel': 100, // default is 0
      // 'sortBy': 'ByPriority', // default is 'AsFound'
      // 'ignorePriorityNumberList': [123, 202], // default is []
  };
  // Or this allows the parameters to be specified as a FileCheck property
  if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
  if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
  if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
  if (props.sortBy) processOptions.sortBy = props.sortBy;
  // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;
  const processedResult = processNoticesToErrorsWarnings(rawResults, processOptions);
  // console.log("FileCheck got processed results with " + processedResult.successList.length.toLocaleString() + " success message(s), " + processedResult.errorList.length.toLocaleString() + " error(s) and " + processedResult.warningList.length.toLocaleString() + " warning(s)\n"
  //     + "  numIgnoredNotices=" + processedResult.numIgnoredNotices.toLocaleString(), "numSuppressedErrors=" + processedResult.numSuppressedErrors.toLocaleString(), "numSuppressedWarnings=" + processedResult.numSuppressedWarnings.toLocaleString());

  if (processedResult.errorList.length || processedResult.warningList.length)
      returnedResult = <>
          <p>Checked <b>{file.name}</b> (from {repo.full_name} <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch)
                  {processedResult.numIgnoredNotices ? " (but " + processedResult.numIgnoredNotices.toLocaleString() + " ignored errors/warnings)" : ""}</p>
          <RenderSuccessesErrorsWarnings results={processedResult} />
      </>;
  else // no errors or warnings
      returnedResult = <>
          <p>Checked <b>{file.name}</b> (from {repo.full_name} <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch)
                  {processedResult.numIgnoredNotices ? " (with a total of " + processedResult.numIgnoredNotices.toLocaleString() + " notices ignored)" : ""}</p>
          <RenderSuccessesErrorsWarnings results={processedResult} />
      </>;
}
else {
  console.log("No file yet");
}
return returnedResult;
};
// end of FileCheck()

const styles = theme => ({
root: {
},
});
*/


function FileCheck(props) {

    // console.log("I'm here in FileCheck v" + CHECKER_VERSION_STRING);
    // consoleLogObject("props", props);

    let username = props.username;
    // console.log(`username='${username}'`);
    let repoName = props.repoName;
    // console.log(`repoName='${repoName}'`);
    let branch = props.branch;
    // console.log(`branch='${branch}'`);
    if (branch === undefined) branch = 'master';
    let filename = props.filename;
    // console.log(`filename='${filename}'`);

    let givenLocation = props['location'] ? props['location'] : "";
    if (givenLocation && givenLocation[0] !== " ") givenLocation = ` ${givenLocation}`;
    givenLocation = ` in ${repoName} repo${givenLocation}`;

    let checkingOptions = { // Uncomment any of these to test them
        // 'extractLength': 25,
    };
    // Or this allows the parameters to be specified as a FileCheck property
    if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);

    const [result, setResultValue] = useState("Waiting-FileCheck");
    useEffect(() => {
        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
            // console.log("Started FileCheck.unnamedFunction()");

            // Display our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for <b>{filename}</b>…</p>);
            // console.log(`About to call getFile(${username}, ${repoName}, ${filename}, ${branch})…`);
            const fileContent = await getFile({ username: username, repository: repoName, path: filename, branch: branch });
            const rawResults = checkFile(filename, fileContent, givenLocation, checkingOptions);
            // console.log("FileCheck got initial results with " + rawResults.successList.length + " success message(s) and " + rawResults.noticeList.length + " notice(s)");

            // Add some extra fields to our rawResults object in case we need this information again later
            rawResults.checkType = 'File';
            rawResults.username = username;
            rawResults.repoName = repoName;
            rawResults.branch = props.branch;
            rawResults.filename = filename;
            rawResults.checkingOptions = checkingOptions;

            // Now do our final handling of the result
            let processOptions = { // Uncomment any of these to test them
                // 'maximumSimilarMessages': 3, // default is 2
                // 'errorPriorityLevel': 800, // default is 700
                // 'cutoffPriorityLevel': 100, // default is 0
                // 'sortBy': 'ByPriority', // default is 'AsFound'
                // 'ignorePriorityNumberList': [123, 202], // default is []
            };
            // Or this allows the parameters to be specified as a FileCheck property
            if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
            if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
            if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
            if (props.sortBy) processOptions.sortBy = props.sortBy;
            // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;
            const processedResult = processNoticesToErrorsWarnings(rawResults, processOptions);
            // console.log("FileCheck got processed results with " + processedResult.successList.length.toLocaleString() + " success message(s), " + processedResult.errorList.length.toLocaleString() + " error(s) and " + processedResult.warningList.length.toLocaleString() + " warning(s)\n"
            //     + "  numIgnoredNotices=" + processedResult.numIgnoredNotices.toLocaleString(), "numSuppressedErrors=" + processedResult.numSuppressedErrors.toLocaleString(), "numSuppressedWarnings=" + processedResult.numSuppressedWarnings.toLocaleString());

            if (processedResult.errorList.length || processedResult.warningList.length)
            setResultValue(<>
                    <p>Checked <b>{filename}</b> (from {username} {repoName} <i>{branch === undefined ? 'DEFAULT' : branch}</i> branch)
                        {processedResult.numIgnoredNotices ? " (but " + processedResult.numIgnoredNotices.toLocaleString() + " ignored errors/warnings)" : ""}</p>
                    <RenderSuccessesErrorsWarnings results={processedResult} />
                </>);
            else // no errors or warnings
            setResultValue(<>
                    <p>Checked <b>{filename}</b> (from {username} {repoName} <i>{branch === undefined ? 'DEFAULT' : branch}</i> branch)
                        {processedResult.numIgnoredNotices ? " (with a total of " + processedResult.numIgnoredNotices.toLocaleString() + " notices ignored)" : ""}</p>
                    <RenderSuccessesErrorsWarnings results={processedResult} />
                </>);

        })(); // end of async part in unnamedFunction
    }, []); // end of useEffect part

    // {/* <div className={classes.root}> */}
    return (
        <div className="Fred">
            {result}
        </div>
    );
};
// end of FileCheck()

const styles = theme => ({
    root: {
    },
});

export default withStyles(styles)(FileCheck);
