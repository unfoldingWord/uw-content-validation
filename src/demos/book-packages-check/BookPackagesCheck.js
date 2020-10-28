import React, { useState, useEffect } from 'react';
// import { withStyles } from '@material-ui/core/styles';
import * as books from '../../core/books/books';
import { ourParseInt, preloadReposIfNecessary } from '../../core';
import { checkBookPackages } from './checkBookPackages';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesWarningsGradient, RenderElapsedTime } from '../RenderProcessedResults';
// import { consoleLogObject } from '../../core/utilities';


// const BPS_VALIDATOR_VERSION_STRING = '0.1.3';


function BookPackagesCheck(/*username, languageCode, bookIDs,*/ props) {
    // Check a single Bible book across many repositories
    const [result, setResultValue] = useState("Waiting-CheckBookPackages");

    // console.log(`I'm here in BookPackagesCheck v${BPS_VALIDATOR_VERSION_STRING}`);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    let username = props.username;
    // console.log(`username='${username}'`);
    let languageCode = props.languageCode;
    // console.log(`languageCode='${languageCode}'`);
    let bookIDs = props.bookIDs;
    // console.log(`bookIDs='${bookIDs}'`);
    let branch = props.branch;
    // console.log(`branch='${branch}'`);

    let bookIDList = [];
    let bookIDInvalid;
    for (let bookID of bookIDs.split(',')) {
        bookID = bookID.trim();
        if (!books.isValidBookID(bookID) && bookID!=='OBS') {
            bookIDInvalid = bookID;
        }
        bookIDList.push(bookID);
    }
    // console.log(`bookIDList (${bookIDList.length}) = ${bookIDList.join(', ')}`);

    let checkingOptions = { // Uncomment any of these to test them
        // extractLength: 25,
    };
    // Or this allows the parameters to be specified as a BookPackagesCheck property
    if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);

    let preloadList = ['TA', 'TW', 'TQ'];
    if (bookIDList.length > 5) { preloadList.push('LT'); preloadList.push('ST'); preloadList.push('TN'); }

    useEffect(() => {
        // console.log("BookPackagesCheck.useEffect() called with ", JSON.stringify(props));

        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
        // console.log("Started BookPackagesCheck.unnamedFunction()");

        setResultValue(<p style={{ color: 'magenta' }}>Preloading repos for {username} {languageCode} ready for book packages check…</p>);
        const successFlag = await preloadReposIfNecessary(username, languageCode, bookIDList, branch, preloadList);
        if (!successFlag)
            console.error(`BookPackagesCheck error: Failed to pre-load all repos`)

      // Display our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Checking {username} {languageCode} <b>{bookIDList.join(', ')}</b> book packages…</p>);

      const rawCBPsResults = await checkBookPackages(username, languageCode, bookIDList, setResultValue, checkingOptions);

      // Add some extra fields to our rawCBPsResults object in case we need this information again later
      rawCBPsResults.checkType = 'BookPackages';
      rawCBPsResults.username = username;
      rawCBPsResults.languageCode = languageCode;
      rawCBPsResults.bookIDs = bookIDs;
      rawCBPsResults.bookIDList = bookIDList;
      rawCBPsResults.checkedOptions = checkingOptions;

      // console.log("Here with CBPs rawCBPsResults", typeof rawCBPsResults);
      // Now do our final handling of the result -- we have some options available
      let processOptions = { // Uncomment any of these to test them
        // 'maximumSimilarMessages': 4, // default is 3 -- 0 means don't suppress
        // 'errorPriorityLevel': 800, // default is 700
        // 'cutoffPriorityLevel': 100, // default is 0
        // 'sortBy': 'ByPriority', // default is 'AsFound'
        // 'ignorePriorityNumberList': [123, 202], // default is []
      };
      // Or this allows the parameters to be specified as a BookPackagesCheck property
      if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
      if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
      if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
      if (props.sortBy) processOptions.sortBy = props.sortBy;
      // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;

      let displayType = 'ErrorsWarnings'; // default
      if (props.displayType) displayType = props.displayType;

      function renderSuccesses(processedResults) {
        if (processedResults.checkedFileCount > 0)
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {processedResults.checkedFileCount.toLocaleString()} file{processedResults.checkedFileCount===1?'':'s'} from {username} {processedResults.checkedRepoNames.join(', ')}
        <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;including {processedResults.checkedFilenameExtensions.length} file type{processedResults.checkedFilenameExtensions.size === 1 ? '' : 's'}: {processedResults.checkedFilenameExtensions.join(', ')}.</p>);
        else
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;No files checked!</p>);
      }

    function renderSummary(processedResults) {
        return (<div>
          <p>Checked <b>{username} {languageCode} {bookIDList.join(', ')}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)</p>
          {renderSuccesses(processedResults)}
          <p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={processedResults.elapsedSeconds} /> with {rawCBPsResults.noticeList.length===0?'no':rawCBPsResults.noticeList.length.toLocaleString()} notice{rawCBPsResults.noticeList.length===1?'':'s'}
          {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}.</p>
          {/* <RenderRawResults results={rawCBPsResults} /> */}
        </div>);
      }

    if (displayType === 'ErrorsWarnings') {
        const processedResults = processNoticesToErrorsWarnings(rawCBPsResults, processOptions);
  //       console.log(`BookPackagesCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
  // numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        // console.log("Here now in rendering bit!");

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
        const processedResults = processNoticesToSevereMediumLow(rawCBPsResults, processOptions);
//                 console.log(`BookPackagesCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
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
        const processedResults = processNoticesToSingleList(rawCBPsResults, processOptions);
  //       console.log(`BookPackagesCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
  // numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        if (processedResults.warningList.length)
          setResultValue(<>
            <div>{renderSummary(processedResults)}
              {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
            <RenderSuccessesWarningsGradient results={processedResults} />
          </>);
        else // no warnings
          setResultValue(<>
            {renderSummary(processedResults)}
            <RenderSuccessesWarningsGradient results={processedResults} />
          </>);
      } else setResultValue(<b style={{ color: 'red' }}>Invalid displayType='{displayType}'</b>)

      // console.log("Finished rendering bit.");
    })(); // end of async part in unnamedFunction
    // Doesn't work if we add this to next line: bookIDList,bookIDs,username,branch,checkingOptions,languageCode,props
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(bookIDList), bookIDs, branch, JSON.stringify(checkingOptions), languageCode, JSON.stringify(props), username]); // end of useEffect part

  if (bookIDInvalid) {
    return (<p>Please enter only valid USFM book identifiers separated by commas. ('{bookIDInvalid}' is not valid.)</p>);
  }

  // {/* <div className={classes.root}> */}
  return (
    <div className="Fred">
      {result}
    </div>
  );
}

// BookPackagesCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   languageCode: PropTypes.object.isRequired,
//   bookIDs: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

// const styles = theme => ({
//   root: {
//   },
// });

//export default withStyles(styles)(BookPackagesCheck);
export default BookPackagesCheck;
