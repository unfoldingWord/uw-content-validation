import React, { useContext } from 'react';
// import PropTypes from 'prop-types';
// import ReactJson from 'react-json-view';
// import { Paper, Button } from '@material-ui/core';
import { RepositoryContext, FileContext } from 'gitea-react-toolkit';
import checkFile from './checkFile.js';
import processNotices from '../../core/notice-handling-functions.js';
import { display_object } from '../../core/utilities.js';


const CHECKER_VERSION_STRING = '0.0.3';

function FileCheck(props) {
    const { state: repo, component: repoComponent } = useContext(RepositoryContext);
    const { state: file, component: fileComponent } = useContext(FileContext);

    console.log("I'm here in FileCheck v" + CHECKER_VERSION_STRING);
    display_object("props", props);
    // display_object("repo", repo);
    /* Has fields: id:number, owner:object, name, full_name, description,
        empty, private, fork, parent, mirror, size,
        html_url, ssh_url, clone_url, website,
        stars_count, forks_count, watchers_count, open_issues_count,
        default_branch, archived, created_at, updated_at, permissions:object,
        has_issues, has_wiki, has_pull_requests, ignore_whitespace_conflicts,
        allow_merge_commits, allow_rebase, allow_rebase_explicit, allow_squash_merge,
        avatar_url, branch, tree_url */
    // display_object("file", file);
    /* Has fields: name, path, sha, type=file,
      size, encoding=base64, content,
      html_url, git_url, download_url,
      _links:object, branch, filepath. */
    // display_object("file", file);

    //  Displays "Loading…" correctly when loading
    //      but keeps it there even if there's errors or problems :-(
    let returnedResult;
    if (repo) // this displays briefly once the repo is loaded, but before the file is loaded
        returnedResult = (<>
            <b style={{ color: 'magenta' }}>Attempting to load a file from <b>{repo.full_name}</b> <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch…</b>
        </>);
    else // this is what displays initially (and stays displayed if there's no errors)
        returnedResult = (<>
            <b style={{ color: 'purple' }}>Attempting to load a file…</b>
        </>);

    if (file) {
        let givenLocation = props['location'] ? props['location'] : "";
        if (givenLocation && givenLocation[0] != ' ') givenLocation = ' ' + givenLocation;

        let checkingOptions = { // Uncomment any of these to test them
            // 'extractLength': 25,
        };
        // Or this allows the parameters to be specified as a FileCheck property
        if (props.extractLength) checkingOptions.extractLength = parseInt(props.extractLength);

        let preliminaryResult = checkFile(file.name, file.content, givenLocation, checkingOptions);
        console.log("FileCheck got initial results with " + preliminaryResult.successList.length + " success message(s) and " + preliminaryResult.noticeList.length + " notice(s)");

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
        const result = processNotices(preliminaryResult, processOptions);
        console.log("FileCheck got processed results with " + result.successList.length.toLocaleString() + " success message(s), " + result.errorList.length.toLocaleString() + " error(s) and " + result.warningList.length.toLocaleString() + " warning(s)");
        console.log("  numIgnoredNotices=" + result.numIgnoredNotices.toLocaleString(), "numSuppressedErrors=" + result.numSuppressedErrors.toLocaleString(), "numSuppressedWarnings=" + result.numSuppressedWarnings.toLocaleString());

        function RenderArray(props) {
            // Display our array of 4-part lists in a nicer format
            // Uses 'result' object from outer scope
            let myList;
            if (props.arrayType === 's')
                return (<ol>
                    {result.successList.map(function (listEntry) {
                        return <li key={listEntry.id}>
                            <b style={{ color: 'green' }}>{listEntry}</b>
                        </li>;
                    })}
                </ol>
                );
            else {
                const myList = props.arrayType === 'e' ? result.errorList : result.warningList;
                return (<ul>
                    {myList.map(function (listEntry) {
                        return <li key={listEntry.id}>
                            <b style={{ color: props.arrayType === 'e' ? 'red' : 'orange' }}>{listEntry[1]}</b>
                            {listEntry[2] > 0 ? " (at character " + (listEntry[2] + 1) + ")" : ""}
                            <span style={{ color: 'DimGray' }}>{listEntry[3] ? " in '" + listEntry[3] + "'" : ""}</span>
                            {listEntry[4]}
                            <small style={{ color: 'Gray' }}>{listEntry[0] >= 0 ? " (Priority " + listEntry[0] + ")" : ""}</small>
                        </li>;
                    })}
                </ul>
                );
            }
        }

        if (result.errorList.length || result.warningList.length)
            returnedResult = (<>
                <p>Checked <b>{file.name}</b> (from {repo.full_name} <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch)
                    {result.numIgnoredNotices ? " (but " + result.numIgnoredNotices.toLocaleString() + " ignored errors/warnings)" : ""}</p>
                <b style={{ color: result.errorList.length ? 'red' : 'green' }}>{result.errorList.length.toLocaleString()} error{result.errorList.length == 1 ? '' : 's'}</b>{result.errorList.length ? ':' : ''}
                <small style={{ color: 'Gray' }}>{result.numSuppressedErrors ? " (" + result.numSuppressedErrors.toLocaleString() + " similar one" + (result.numSuppressedErrors == 1 ? '' : 's') + " suppressed)" : ''}</small>
                <RenderArray arrayType='e' />
                <b style={{ color: result.warningList.length ? 'orange' : 'green' }}>{result.warningList.length.toLocaleString()} warning{result.warningList.length == 1 ? '' : 's'}</b>{result.warningList.length ? ':' : ''}
                <small style={{ color: 'Gray' }}>{result.numSuppressedWarnings ? " (" + result.numSuppressedWarnings.toLocaleString() + " similar one" + (result.numSuppressedWarnings == 1 ? '' : 's') + " suppressed)" : ''}</small>
                <RenderArray arrayType='w' />
            </>);
        else // no errors or warnings
            returnedResult = (<>
                <p>Checked <b>{file.name}</b> (from {repo.full_name} <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch)
                {result.numIgnoredNotices ? " (with a total of " + result.numIgnoredNotices.toLocaleString() + " notices ignored)" : ""}</p>
                <b style={{ color: 'green' }}>{result.successList.length.toLocaleString()} check{result.successList.length == 1 ? '' : 's'} completed</b>{result.successList.length ? ':' : ''}
                <RenderArray arrayType='s' />
            </>);
    }
    else {
        console.log("No file yet");
        return returnedResult;
    }


    // return (!repo && repoComponent) || (!file && fileComponent) || returnedResult;
    return returnedResult;
};
// end of FileCheck()

export default FileCheck;
