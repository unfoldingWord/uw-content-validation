import React, { useState, useEffect } from 'react';
// import { withStyles } from '@material-ui/core/styles';
import * as books from '../../core/books/books';
import { ourParseInt, preloadReposIfNecessary } from '../../core';
import { checkBookPackages } from '../book-packages-check/checkBookPackages';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderSuccesses, RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesWarningsGradient, RenderTotals } from '../RenderProcessedResults';
// import { consoleLogObject } from '../../core/utilities';


// const ALL_BPS_VALIDATOR_VERSION_STRING = '0.3.0';

const OLD_TESTAMENT_BOOK_CODES = 'GEN,EXO,LEV,NUM,DEU,JOS,JDG,RUT,1SA,2SA,1KI,2KI,1CH,2CH,EZR,NEH,EST,JOB,PSA,PRO,ECC,SNG,ISA,JER,LAM,EZK,DAN,HOS,JOL,AMO,OBA,JON,MIC,NAM,HAB,ZEP,HAG,ZEC,MAL';
const NEW_TESTAMENT_BOOK_CODES = 'MAT,MRK,LUK,JHN,ACT,ROM,1CO,2CO,GAL,EPH,PHP,COL,1TH,2TH,1TI,2TI,TIT,PHM,HEB,JAS,1PE,2PE,1JN,2JN,3JN,JUD,REV';


function AllBookPackagesCheck(/*username, languageCode, bookIDs,*/ props) {
    // Check a single Bible book across many repositories
    const [result, setResultValue] = useState("Waiting-CheckAllBookPackages");

    // console.log(`I'm here in AllBookPackagesCheckBookPackagesCheck v${ALL_BPS_VALIDATOR_VERSION_STRING}`);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    let username = props.username;
    // console.log(`username='${username}'`);
    let languageCode = props.languageCode;
    // console.log(`languageCode='${languageCode}'`);
    let testament = props.testament;
    // console.log(`testament='${testament}'`);
    let includeOBS = props.includeOBS;
    // console.log(`includeOBS='${includeOBS}'`);
    let branch = props.branch;
    // console.log(`branch='${branch}'`);

    // Clear cached files if we've changed repo
    //  autoClearCache(bookIDs); // This technique avoids the complications of needing a button

    // Enter a string containing UPPERCASE USFM book identifiers separated only by commas
    //  and can also include OBS (for Open Bible Stories)
    let bookIDs = '';
    if (testament.toUpperCase() === 'OT' || testament.toUpperCase() === 'OLD')
      bookIDs = OLD_TESTAMENT_BOOK_CODES;
    else if (testament.toUpperCase() === 'NT' || testament.toUpperCase() === 'NEW')
      bookIDs = NEW_TESTAMENT_BOOK_CODES;
    else if (testament.toUpperCase() === 'ALL')
      bookIDs = `${OLD_TESTAMENT_BOOK_CODES},${NEW_TESTAMENT_BOOK_CODES}`;
    else
      setResultValue(<p style={{ color: 'red' }}>No testament selected</p>);
    if (includeOBS.toUpperCase() === 'Y' || includeOBS.toUpperCase() === 'YES')
      bookIDs += ',OBS';

    let bookIDList = [];
    let bookIDInvalid;
    for (let bookID of bookIDs.split(',')) {
        bookID = bookID.trim();
        if (!books.isValidBookID(bookID) && bookID!=='OBS') {
            bookIDInvalid = bookID;
        }
        bookIDList.push(bookID);
    }
    console.log(`AllBookPackagesCheck bookIDList (${bookIDList.length}) = ${bookIDList.join(', ')}`);

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

        setResultValue(<p style={{ color: 'magenta' }}>Preloading repos for {username} {languageCode} ready for all book packages check…</p>);
        const successFlag = await preloadReposIfNecessary(username, languageCode, bookIDList, branch, preloadList);
        if (!successFlag)
            console.log(`AllBookPackagesCheck error: Failed to pre-load all repos`)

      // Display our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Checking {username} {languageCode} <b>{bookIDList.join(', ')}</b> book packages…</p>);

      let rawCBPsResults = {};
      if (bookIDList.length)
        rawCBPsResults = await checkBookPackages(username, languageCode, bookIDList, setResultValue, checkingOptions);

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

      function renderSummary(processedResults) {
        return (<div>
          <p>Checked <b>{username} {languageCode} {bookIDList.join(', ')}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)</p>
          <RenderSuccesses username={username} results={processedResults}/>
          <RenderTotals rawNoticeListLength={rawCBPsResults.noticeList.length} results={processedResults}/>
          {/* <RenderRawResults results={rawCBPsResults} /> */}
        </div>);
      }

    if (displayType === 'ErrorsWarnings') {
        const processedResults = processNoticesToErrorsWarnings(rawCBPsResults, processOptions);
  //       console.log(`AllBookPackagesCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
  // numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        // console.log("Here now in rendering bit!");

        if (processedResults.errorList.length || processedResults.warningList.length)
          setResultValue(<>
            {renderSummary()}
            <RenderSuccessesErrorsWarnings results={processedResults} />
          </>);
        else // no errors or warnings
          setResultValue(<>
            {renderSummary()}
            <RenderSuccessesErrorsWarnings results={processedResults} />
          </>);
      } else if (displayType === 'SevereMediumLow') {
        const processedResults = processNoticesToSevereMediumLow(rawCBPsResults, processOptions);
//                 console.log(`AllBookPackagesCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
//   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        if (processedResults.severeList.length || processedResults.mediumList.length || processedResults.lowList.length)
          setResultValue(<>
            {renderSummary()}
            <RenderSuccessesSevereMediumLow results={processedResults} />
          </>);
        else // no severe, medium, or low notices
          setResultValue(<>
            {renderSummary()}
            <RenderSuccessesSevereMediumLow results={processedResults} />
          </>);
      } else if (displayType === 'SingleList') {
        const processedResults = processNoticesToSingleList(rawCBPsResults, processOptions);
  //       console.log(`AllBookPackagesCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
  // numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        if (processedResults.warningList.length)
          setResultValue(<>
            {renderSummary()}
            <RenderSuccessesWarningsGradient results={processedResults} />
          </>);
        else // no warnings
          setResultValue(<>
            {renderSummary()}
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

export default AllBookPackagesCheck;
