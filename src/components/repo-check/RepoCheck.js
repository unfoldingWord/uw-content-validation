import React, { useState, useEffect, useContext } from 'react';
import { RepositoryContext } from 'gitea-react-toolkit';
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
import { fetchRepo } from './helpers';
import * as util from '../../core/utilities.js';
import checkRepo from './checkRepo.js';
import processNotices from '../../core/notice-handling-functions.js';
import { displayObject } from '../../core/utilities.js';

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

const CHECKER_VERSION_STRING = '0.0.1';

function RepoCheck(/*url, classes, style,*/ props) {
  const { state: repo, component: repoComponent } = useContext(RepositoryContext);

  console.log("I'm here in RepoCheck v" + CHECKER_VERSION_STRING);
  displayObject("props", props);
  displayObject("props.classes", props.classes);
  let classes = props.classes;
  displayObject("repo", repo);
  /* Has fields: id:number, owner:object, name, full_name, description,
      empty, private, fork, parent, mirror, size,
      html_url, ssh_url, clone_url, website,
      stars_count, forks_count, watchers_count, open_issues_count,
      default_branch, archived, created_at, updated_at, permissions:object,
      has_issues, has_wiki, has_pull_requests, ignore_whitespace_conflicts,
      allow_merge_commits, allow_rebase, allow_rebase_explicit, allow_squash_merge,
      avatar_url, branch, tree_url */

  const [res, setVal] = useState("Waiting-CheckRepo");
  useEffect(() => {
    const fetchData = async () => {
      let result;
      try {
        console.log("About to call fetchRepo(" + url + ")");
        result = await fetchRepo({ url: url });
      } catch (error) {
        setVal(
          <div>
            {error.message}
          </div>
        )
        return;
      }
      let keys = Array.from(Object.keys(result.grandTotals));

      // ok - we have results to show
      let mt = util.wf_to_mt(result.grandTotals.wordFrequency);
      //let aw = util.aw_to_mt(result.grandTotals.allWords);
      setVal(
        <Paper className={classes.paper}>
          <Typography className={classes.root} style={style}>
            Total number of words: <strong>{result.grandTotals.total}</strong> <br />
                Distinct number of words: <strong>{result.grandTotals.distinct}</strong> <br />
                Number of Markdown Level 1 Headings: <strong>{result.grandTotals.l1count}</strong>
          </Typography>
          <MaterialTable
            icons={tableIcons}
            title={mt.title}
            columns={mt.columns}
            data={mt.data}
            options={mt.options}
          />
        </Paper>
      );

    };
    fetchData();
  }, []);
  // the parameter [] allows the effect to skip if value unchanged
  // an empty [] will only update on mount of component

  return (
    <div className={classes.root}>
      {res}
    </div>
  );

  //  Displays "Loading…" correctly when loading
  //      but keeps it there even if there's errors or problems :-(
  let returnedResult;
  if (repo) // this displays briefly once the repo is loaded, but before the file is loaded
    returnedResult = (<>
      <b style={{ color: 'magenta' }}>Attempting to load the repo from <b>{repo.full_name}</b> <i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch…</b>
    </>);
  else // this is what displays initially (and stays displayed if there's no errors)
    returnedResult = (<>
      <b style={{ color: 'purple' }}>Attempting to load a repo…</b>
    </>);

  if (repo) {
    let givenLocation = props['location'] ? props['location'] : "";
    if (givenLocation && givenLocation[0] != ' ') givenLocation = ' ' + givenLocation;

    const checkingOptions = { // Uncomment any of these to test them
      // 'extractLength': 25,
    };
    // Or this allows the parameters to be specified as a FileCheck property
    if (props.extractLength) checkingOptions.extractLength = parseInt(props.extractLength);

    let preliminaryResult = checkRepo(repo, givenLocation, checkingOptions);
    console.log("RepoCheck got initial results with " + preliminaryResult.successList.length + " success message(s) and " + preliminaryResult.noticeList.length + " notice(s)");

    // Now do our final handling of the result
    const processOptions = { // Uncomment any of these to test them
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
    console.log("RepoCheck got processed results with " + result.successList.length.toLocaleString() + " success message(s), " + result.errorList.length.toLocaleString() + " error(s) and " + result.warningList.length.toLocaleString() + " warning(s)");
    console.log("  numIgnoredNotices=" + result.numIgnoredNotices.toLocaleString(), "numSuppressedErrors=" + result.numSuppressedErrors.toLocaleString(), "numSuppressedWarnings=" + result.numSuppressedWarnings.toLocaleString());

    // console.log("format:",format); // format='xxx' format='string'
    // let results = text ? doBasicTextChecks('Text', text, -1, format): doBasicTextChecks('Children', children, -1, format);
    // if ( ! results.isValidFormat ) {
    //   return (
    //     <Typography className={classes.root} style={style}
    //       align='center' variant='h6'>
    //     Invalid format: {format} <br/>
    //     Valid formats are: {results.validFormats} <br/>
    //     Default is 'markdown'
    //     </Typography>
    //   )
    // }
    // let mt = util.wf_to_mt(results.wordFrequency);
    //let aw = util.aw_to_mt(results.allWords);
    // return (
    //   <Paper className={classes.paper}>
    //     <Typography className={classes.root} style={style}>
    //       {results.errorList.length} errors: <strong>{results.errorList}</strong> <br/>
    //       {results.warningList.length} warnings: <strong>{results.warningList}</strong>
    //     </Typography>
    //     <MaterialTable
    //       icons={tableIcons}
    //       title={mt.title}
    //       columns={mt.columns}
    //       data={mt.data}
    //       options={mt.options}
    //     />
    //   </Paper>
    // );
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
        <p>Checked <b>{repo.full_name}</b> (<i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch)
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
        <p>Checked <b>{repo.full_name}</b> (<i>{repo.branch === undefined ? 'DEFAULT' : repo.branch}</i> branch)
                {result.numIgnoredNotices ? " (with a total of " + result.numIgnoredNotices.toLocaleString() + " notices ignored)" : ""}</p>
        <b style={{ color: 'green' }}>{result.successList.length.toLocaleString()} check{result.successList.length == 1 ? '' : 's'} completed</b>{result.successList.length ? ':' : ''}
        <RenderArray arrayType='s' />
      </>);
  }
  else {
    console.log("No repo yet");
    return returnedResult;
  }

  // return (!repo && repoComponent) || (!file && fileComponent) || returnedResult;
  return returnedResult;
};

// RepoCheck.propTypes = {
//   /** @ignore */
//   classes: PropTypes.object.isRequired,
//   /** @ignore */
//   style: PropTypes.object,
//   /** text format: default is Markdown */
//   format: PropTypes.string,
// };

const styles = theme => ({
  root: {
  },
});

export default withStyles(styles)(RepoCheck);
