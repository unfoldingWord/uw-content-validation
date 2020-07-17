import React, { useContext } from 'react';
// import PropTypes from 'prop-types';
// import ReactJson from 'react-json-view';
// import { Paper, Button } from '@material-ui/core';
import { RepositoryContext, FileContext } from 'gitea-react-toolkit';
import { withStyles } from '@material-ui/core/styles';
import checkFile from './checkFile.js';
import processNotices from '../../core/notice-handling-functions.js';
import { RenderSuccessesErrorsWarnings } from '../RenderProcessedResults';
// import { consoleLogObject } from '../../core/utilities.js';


const CHECKER_VERSION_STRING = '0.0.3';

function FileCheck(props) {
    const { state: repo, component: repoComponent } = useContext(RepositoryContext);
    const { state: file, component: fileComponent } = useContext(FileContext);

    // console.log("I'm here in FileCheck v" + CHECKER_VERSION_STRING);
    // consoleLogObject("props", props);
    // consoleLogObject("repo", repo);
    /* Has fields: id:number, owner:object, name, full_name, description,
        empty, private, fork, parent, mirror, size,
        html_url, ssh_url, clone_url, website,
        stars_count, forks_count, watchers_count, open_issues_count,
        default_branch, archived, created_at, updated_at, permissions:object,
        has_issues, has_wiki, has_pull_requests, ignore_whitespace_conflicts,
        allow_merge_commits, allow_rebase, allow_rebase_explicit, allow_squash_merge,
        avatar_url, branch, tree_url */
    // consoleLogObject("file", file);
    /* Has fields: name, path, sha, type=file,
      size, encoding=base64, content,
      html_url, git_url, download_url,
      _links:object, branch, filepath. */

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
        let givenLocation = props['location'] ? props['location'] : "";
        if (givenLocation && givenLocation[0] != " ") givenLocation = " " + givenLocation;
        givenLocation = " in " + repo.full_name + givenLocation;

        let checkingOptions = { // Uncomment any of these to test them
            // 'extractLength': 25,
        };
        // Or this allows the parameters to be specified as a FileCheck property
        if (props.extractLength) checkingOptions.extractLength = parseInt(props.extractLength);

        let preliminaryResult = checkFile(file.name, file.content, givenLocation, checkingOptions);
        // console.log("FileCheck got initial results with " + preliminaryResult.successList.length + " success message(s) and " + preliminaryResult.noticeList.length + " notice(s)");

        // Add some extra fields to our preliminaryResult object in case we need this information again later
        preliminaryResult.checkType = 'File';
        preliminaryResult.repoFullname = repo.full_name;
        preliminaryResult.checkingOptions = checkingOptions;

        // Now do our final handling of the result
        let processOptions = { // Uncomment any of these to test them
            // 'maximumSimilarMessages': 3, // default is 2
            // 'errorPriorityLevel': 800, // default is 700
            // 'cutoffPriorityLevel': 100, // default is 0
            // 'sortBy': 'ByPriority', // default is 'AsFound'
            // 'ignorePriorityNumberList': [123, 202], // default is []
        };
        // Or this allows the parameters to be specified as a FileCheck property
        if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = parseInt(props.maximumSimilarMessages);
        if (props.errorPriorityLevel) processOptions.errorPriorityLevel = parseInt(props.errorPriorityLevel);
        if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = parseInt(props.cutoffPriorityLevel);
        if (props.sortBy) processOptions.sortBy = props.sortBy;
        // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;
        const processedResult = processNotices(preliminaryResult, processOptions);
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

export default withStyles(styles)(FileCheck);
