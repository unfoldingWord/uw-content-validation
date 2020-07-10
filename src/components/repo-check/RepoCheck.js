import React, { useState, useEffect, useContext } from 'react';
import { RepositoryContext } from 'gitea-react-toolkit';
// import { RepositoryContextProvider, RepositoryContext, FileContextProvider, FileContext } from 'gitea-react-toolkit';
// import { forwardRef } from 'react';
// import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
// import { Typography } from '@material-ui/core';
// import List from '@material-ui/core/List';
// import ListItem from '@material-ui/core/ListItem';
// import ListItemText from '@material-ui/core/ListItemText';
// import Paper from '@material-ui/core/Paper';
// import AddBox from '@material-ui/icons/AddBox';
// import ArrowDownward from '@material-ui/icons/ArrowDownward';
// import Check from '@material-ui/icons/Check';
// import ChevronLeft from '@material-ui/icons/ChevronLeft';
// import ChevronRight from '@material-ui/icons/ChevronRight';
// import Clear from '@material-ui/icons/Clear';
// import DeleteOutline from '@material-ui/icons/DeleteOutline';
// import Edit from '@material-ui/icons/Edit';
// import FilterList from '@material-ui/icons/FilterList';
// import FirstPage from '@material-ui/icons/FirstPage';
// import LastPage from '@material-ui/icons/LastPage';
// import Remove from '@material-ui/icons/Remove';
// import SaveAlt from '@material-ui/icons/SaveAlt';
// import Search from '@material-ui/icons/Search';
// import ViewColumn from '@material-ui/icons/ViewColumn';
// import MaterialTable from 'material-table';
// import { fetchRepo } from './helpers';
import checkRepo from './checkRepo.js';
import processNotices from '../../core/notice-handling-functions.js';
import { RenderSuccessesErrorsWarnings } from '../RenderProcessedResults';
// import { consoleLogObject } from '../../core/utilities.js';

// const tableIcons = {
//   Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
//   Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
//   Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
//   Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
//   DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
//   Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
//   Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
//   Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
//   FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
//   LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
//   NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
//   PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
//   ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
//   Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
//   SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
//   ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
//   ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
// };

const CHECKER_VERSION_STRING = '0.0.2';


function RepoCheck(/*username, language_code,*/ props) {
    // Check a single Bible book across many repositories
    const { state: repo, component: repoComponent } = useContext(RepositoryContext);

    //   console.log("BPC repo", typeof repo, JSON.stringify(repo));
    //   console.log("BPC repoComponent", typeof repoComponent);
    //   console.log("BPC repository", typeof repository, JSON.stringify(repository));
    //   console.log("BPC setRepository", typeof setRepository);
    //   console.log("BPC file", typeof file, JSON.stringify(file));
    //   console.log("BPC fileComponent", typeof fileComponent);

    console.log("I'm here in RepoCheck v" + CHECKER_VERSION_STRING);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    if (!repo) {
        return( <>
            <b style={{ color: 'purple' }}>Attempting to load a repo…</b>
            </>);
    }

    // We have got our requested repo now
    // consoleLogObject("repo", repo);
    /* Has fields: id:number, owner:object, name, full_name, description,
        empty, private, fork, parent, mirror, size,
        html_url, ssh_url, clone_url, website,
        stars_count, forks_count, watchers_count, open_issues_count,
        default_branch, archived, created_at, updated_at, permissions:object,
        has_issues, has_wiki, has_pull_requests, ignore_whitespace_conflicts,
        allow_merge_commits, allow_rebase, allow_rebase_explicit, allow_squash_merge,
        avatar_url, branch, tree_url */
    // consoleLogObject("repo owner", repo.owner);

    const [result, setResultValue] = useState("Waiting-checkRepo");
    useEffect(() => {
        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
            // console.log("Started unnamedFunction()");

            // Display our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for {username} {language_code} repo…</p>);

            let checkingOptions = { // Uncomment any of these to test them
                // 'extractLength': 25,
            };
            // Or this allows the parameters to be specified as a RepoCheck property
            if (props.extractLength) checkingOptions.extractLength = parseInt(props.extractLength);

            let preliminaryResult = await checkRepo(repo, checkingOptions);
            console.log("checkRepo() returned", typeof preliminaryResult); //, JSON.stringify(preliminaryResult));

            // Add some extra fields to our preliminaryResult object in case we need this information again later
            preliminaryResult.checkType = 'Repo';
            preliminaryResult.username = username;
            preliminaryResult.language_code = language_code;
            preliminaryResult.checkedOptions = checkingOptions;

            console.log("Here with preliminaryResult", typeof preliminaryResult);
            // Now do our final handling of the result -- we have some options available
            let processOptions = { // Uncomment any of these to test them
                // 'maximumSimilarMessages': 3, // default is 2
                // 'errorPriorityLevel': 800, // default is 700
                // 'cutoffPriorityLevel': 100, // default is 0
                // 'sortBy': 'ByPriority', // default is 'AsFound'
                // 'ignorePriorityNumberList': [123, 202], // default is []
            };
            // Or this allows the parameters to be specified as a RepoCheck property
            if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = parseInt(props.maximumSimilarMessages);
            if (props.errorPriorityLevel) processOptions.errorPriorityLevel = parseInt(props.errorPriorityLevel);
            if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = parseInt(props.cutoffPriorityLevel);
            if (props.sortBy) processOptions.sortBy = props.sortBy;
            // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;
            const processedResult = processNotices(preliminaryResult, processOptions);
            console.log("RepoCheck got back processedResult with " + processedResult.successList.length.toLocaleString() + " success message(s), " + processedResult.errorList.length.toLocaleString() + " error(s) and " + processedResult.warningList.length.toLocaleString() + " warning(s)\n"
                + "  numIgnoredNotices=" + processedResult.numIgnoredNotices.toLocaleString(), "numSuppressedErrors=" + processedResult.numSuppressedErrors.toLocaleString(), "numSuppressedWarnings=" + processedResult.numSuppressedWarnings.toLocaleString());

            // console.log("Here now in rendering bit!");
            let username = repo.owner.username;
            console.log("username='"+ username+"'");
            let language_code = repo.name.split('_', 1)[0];
            console.log("language_code='"+ language_code+"'");

            if (processedResult.errorList.length || processedResult.warningList.length)
                setResultValue(<>
                    <p>Checked <b>{username} {language_code}</b> (from <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branches)
                    {processedResult.numIgnoredNotices ? " (but " + processedResult.numIgnoredNotices.toLocaleString() + " ignored errors/warnings)" : ""}</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {processedResult.checkedFileCount} file{processedResult.checkedFileCount == 1 ? '' : 's'} from {repo.full_name}.</p>
                    <RenderSuccessesErrorsWarnings results={processedResult} />
                </>);
            else // no errors or warnings
                setResultValue(<>
                    <p>Checked <b>{username} {language_code}</b> (from <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branches)
                <p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {processedResult.checkedFileCount} file{processedResult.checkedFileCount == 1 ? '' : 's'} from {repo.full_name}.</p>
                        {processedResult.numIgnoredNotices ? " (with a total of " + processedResult.numIgnoredNotices.toLocaleString() + " notices ignored)" : ""}</p>
                <RenderSuccessesErrorsWarnings results={processedResult} />
                </>);

            // console.log("Finished rendering bit.");
        })(); // end of async part in unnamedFunction
    }, []); // end of useEffect part

    // {/* <div className={classes.root}> */}
    return (
        <div className="Fred">
            {result}
        </div>
    );
}

// RepoCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   language_code: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

const styles = theme => ({
    root: {
    },
});

export default withStyles(styles)(RepoCheck);
