import React, { useEffect, useState } from 'react';
// import PropTypes from 'prop-types';
// import ReactJson from 'react-json-view';
// import { Paper, Button } from '@material-ui/core';
// import { RepositoryContext, FileContext } from 'gitea-react-toolkit';
import { withStyles } from '@material-ui/core/styles';
import { ourParseInt, cachedGetFile } from '../../core';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesWarningsGradient, RenderElapsedTime } from '../RenderProcessedResults';
import { checkFileContents } from './checkFileContents';
// import { consoleLogObject } from '../../core/utilities';


// const FILE_CHECK_VERSION_STRING = '0.1.5';


function FileCheck(props) {
  // console.log(`I'm here in FileCheck v${FILE_CHECK_VERSION_STRING}`);
  // consoleLogObject("props", props);

  const [result, setResultValue] = useState("Waiting-FileCheck");
  useEffect(() => {
    // console.log("FileCheck.useEffect() called with ", JSON.stringify(props));

    // Use an IIFE (Immediately Invoked Function Expression)
    //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
    (async () => {
      // console.log("Started FileCheck.unnamedFunction()");

      if (!username) {
        setResultValue(<p style={{ color: 'red' }}>No <b>username</b> set!</p>);
        return;
      }
      if (!repoName) {
        setResultValue(<p style={{ color: 'red' }}>No <b>repoName</b> set!</p>);
        return;
      }
      if (!filename) {
        setResultValue(<p style={{ color: 'red' }}>No <b>filename</b> set!</p>);
        return;
      }

      // Display our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Fetching {username} {repoName} <b>{filename}</b>…</p>);
      // console.log(`FileCheck about to call cachedGetFile(${username}, ${repoName}, ${filename}, ${branch})…`);
      const fileContent = await cachedGetFile({ username: username, repository: repoName, path: filename, branch: branch });

      setResultValue(<p style={{ color: 'magenta' }}>Checking {username} {repoName} <b>{filename}</b>…</p>);
      let rawCFResults = { noticeList: [{ priority: 990, message: "Unable to load file", details: `username=${username}`, repoName, filename }], elapsedSeconds: 0 };
      if (fileContent) {
        const languageCode = repoName.split('_')[0];
        rawCFResults = await checkFileContents(languageCode, filename, fileContent, givenLocation, checkingOptions);

        // Because we know here that we're only checking one file, we don't need the filename field in the notices
        function deleteFilenameField(notice) { delete notice.filename; notice.username=username; return notice; }
        rawCFResults.noticeList = rawCFResults.noticeList.map(deleteFilenameField);
      }
      // console.log(`FileCheck got initial results with ${rawCFResults.successList.length} success message(s) and ${rawCFResults.noticeList.length} notice(s)`);

      // // Since we know the repoName here, add it to our notices
      // for (const thisNotice of rawCFResults.noticeList)
      //   thisNotice.repoName = repoName; // Add in this info that we know

      // Add some extra fields to our rawCFResults object in case we need this information again later
      rawCFResults.checkType = 'File';
      rawCFResults.username = username;
      rawCFResults.repoName = repoName;
      rawCFResults.branch = props.branch;
      rawCFResults.filename = filename;
      rawCFResults.checkingOptions = checkingOptions;

      // Now do our final handling of the result
      let processOptions = { // Uncomment any of these to test them
        // 'maximumSimilarMessages': 4, // default is 3  -- 0 means don't suppress
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

      let displayType = 'ErrorsWarnings'; // default
      if (props.displayType) displayType = props.displayType;

      function renderSummary(processedResults) {
        return (<div>
          <p>Checked <b>{filename}</b> (from {username} {repoName} <i>{branch === undefined ? 'DEFAULT' : branch}</i> branch)</p>
          <p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={processedResults.elapsedSeconds} /> with {rawCFResults.noticeList.length === 0 ? 'no' : rawCFResults.noticeList.length.toLocaleString()} notice{rawCFResults.noticeList.length === 1 ? '' : 's'}
            {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}.</p>
          {/* <RenderRawResults results={rawCFResults} /> */}
        </div>);
      }

      if (displayType === 'ErrorsWarnings') {
        const processedResults = processNoticesToErrorsWarnings(rawCFResults, processOptions);
        //                 console.log(`${`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)`}
        //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        if (processedResults.errorList.length || processedResults.warningList.length)
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesErrorsWarnings results={processedResults} />
          </>);
        else // no errors or warnings
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesErrorsWarnings results={processedResults} />
          </>);
      } else if (displayType === 'SevereMediumLow') {
        const processedResults = processNoticesToSevereMediumLow(rawCFResults, processOptions);
        //                 console.log(`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
        //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        if (processedResults.severeList.length || processedResults.mediumList.length || processedResults.lowList.length)
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesSevereMediumLow results={processedResults} />
          </>);
        else // no severe, medium, or low notices
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesSevereMediumLow results={processedResults} />
          </>);
      } else if (displayType === 'SingleList') {
        const processedResults = processNoticesToSingleList(rawCFResults, processOptions);
        //       console.log(`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
        // numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        if (processedResults.warningList.length)
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesWarningsGradient results={processedResults} />
          </>);
        else // no warnings
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesWarningsGradient results={processedResults} />
          </>);
      } else setResultValue(<b style={{ color: 'red' }}>Invalid displayType='{displayType}'</b>)
    })(); // end of async part in unnamedFunction
    // Doesn't work if we add this to next line: username,repoName,branch,checkingOptions,filename,givenLocation,props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // end of useEffect part

  const username = props.username;
  // console.log(`FileCheck username='${username}'`);
  if (!username) return <><b>ERROR</b>: The Door43 <b>username</b> must be specified</>;
  const repoName = props.repoName;
  // console.log(`FileCheck repoName='${repoName}'`);
  if (!repoName) return <><b>ERROR</b>: The Door43 <b>repository name</b> must be specified</>;
  let branch = props.branch;
  // console.log(`FileCheck branch='${branch}'`);
  if (branch === undefined) branch = 'master';
  const filename = props.filename;
  // console.log(`filename='${filename}'`);
  if (!filename) return <><b>ERROR</b>: The Door43 <b>filename</b> must be specified</>;

  let givenLocation = props['location'] ? props['location'] : "";
  if (givenLocation && givenLocation[0] !== ' ') givenLocation = ` ${givenLocation}`;

  const checkingOptions = { // Uncomment any of these to test them
    // extractLength: 25,
  };
  // Or this allows the parameters to be specified as a FileCheck property
  if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);

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
