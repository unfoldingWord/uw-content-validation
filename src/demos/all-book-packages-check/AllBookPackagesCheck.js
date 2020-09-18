import React, { useState, useEffect } from 'react';
// import { withStyles } from '@material-ui/core/styles';
import * as books from '../../core/books/books';
import { ourParseInt, clearCacheAndPreloadRepos } from '../../core';
import checkBookPackages from '../book-packages-check/checkBookPackages';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesWarningsGradient, RenderElapsedTime } from '../RenderProcessedResults';
// import { consoleLogObject } from '../../core/utilities';


// const BPS_VALIDATOR_VERSION_STRING = '0.1.1';


function AllBookPackagesCheck(/*username, languageCode, bookIDs,*/ props) {
    // Check a single Bible book across many repositories
    const [result, setResultValue] = useState("Waiting-CheckAllBookPackages");

    // console.log(`I'm here in AllBookPackagesCheckBookPackagesCheck v${BPS_VALIDATOR_VERSION_STRING}`);
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
    let bookIDs;
    if (testament.toUpperCase() === 'OT' || testament.toUpperCase() === 'OLD'){
        bookIDs = 'GEN,EXO,LEV,NUM,DEU,JOS,JDG,RUT,1SA,2SA,1KI,2KI,1CH,2CH,EZR,NEH,EST,JOB,PSA,PRO,ECC,SNG,ISA,JER,LAM,EZK,DAN,HOS,JOL,AMO,OBA,JON,MIC,NAM,HAB,ZEP,HAG,ZEC,MAL';
    }
    else if (testament.toUpperCase() === 'NT' || testament.toUpperCase() === 'NEW') {
        bookIDs = 'MAT,MRK,LUK,JHN,ACT,ROM,1CO,2CO,GAL,EPH,PHP,COL,1TH,2TH,1TI,2TI,TIT,PHM,HEB,JAS,1PE,2PE,1JN,2JN,3JN,JUD,REV';
    }
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
    console.log(`bookIDList (${bookIDList.length}) = ${bookIDList.join(', ')}`);

    let checkingOptions = { // Uncomment any of these to test them
        // 'extractLength': 25,
    };
    // Or this allows the parameters to be specified as a BookPackagesCheck property
    if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);

    useEffect(() => {
        // console.log("BookPackagesCheck.useEffect() called with ", JSON.stringify(props));

        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
        // console.log("Started BookPackagesCheck.unnamedFunction()");

        // Preload the reference repos
        // let preloadCount = 1;
        // // TEMP: Removed TQ
        // const repoCodeList = [originalLanguageRepoCode, 'TA','TW', 'ULT','UST','TN'];
        // for (const repoCode of repoCodeList) {
        // setResultValue(<p style={{ color: 'magenta' }}>Preloading <b>{repoCode}</b> repo ({preloadCount}/{repoCodeList.length}) ready for {username} {languageCode} all book packages check…</p>);
        //     const repoName = getRepoName(languageCode, repoCode);
        //     console.log(`AllBookPackagesCheck: preloading zip file for ${repoName}…`);
        //     const zipFetchSucceeded = await fetchRepositoryZipFile({ username, repository: repoName, branch });
        //     if (!zipFetchSucceeded)
        //         console.log(`AllBookPackagesCheck: misfetched ${repoCode} zip file for repo with ${zipFetchSucceeded}`);
        //     preloadCount += 1;
        //   }

        // This call is not needed, but makes sure you don't have stale data that has been cached
        setResultValue(<p style={{ color: 'magenta' }}>Preloading repos for {username} {languageCode} ready for all book packages check…</p>);
        const successFlag = await clearCacheAndPreloadRepos(username, languageCode, bookIDList, branch, ['TA','TW', 'ULT','UST','TN']);
        if (!successFlag)
            console.log(`AllBookPackagesCheck error: Failed to pre-load all repos`)


      // Display our "waiting" message
      setResultValue(<p style={{ color: 'magenta' }}>Checking {username} {languageCode} <b>{bookIDList.join(', ')}</b> book packages…</p>);

      const rawCBPsResults = await checkBookPackages(username, languageCode, bookIDList, setResultValue, checkingOptions);
      // console.log("checkBookPackage() returned", typeof rawCBPsResults); //, JSON.stringify(rawCBPsResults));

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

      if (displayType === 'ErrorsWarnings') {
        const processedResults = processNoticesToErrorsWarnings(rawCBPsResults, processOptions);
        console.log(`BookPackagesCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
  numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        // console.log("Here now in rendering bit!");

        function renderSummary() {
          return (<div>
            <p>Checked <b>{username} {languageCode} {bookIDList.join(', ')}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {processedResults.checkedFileCount.toLocaleString()} file{processedResults.checkedFileCount===1?'':'s'} from {username} {processedResults.checkedRepoNames.join(', ')}
              <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;including {processedResults.checkedFilenameExtensions.length} file type{processedResults.checkedFilenameExtensions.size === 1 ? '' : 's'}: {processedResults.checkedFilenameExtensions.join(', ')}.</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={processedResults.elapsedSeconds} /> with {rawCBPsResults.noticeList.length===0?'no':rawCBPsResults.noticeList.length} notice{rawCBPsResults.noticeList.length===1?'':'s'}.</p>
            {/* <RenderRawResults results={rawCBPsResults} /> */}
          </div>);
        }

        if (processedResults.errorList.length || processedResults.warningList.length)
          setResultValue(<>
            <div>{renderSummary()}
              {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
            <RenderSuccessesErrorsWarnings results={processedResults} />
          </>);
        else // no errors or warnings
          setResultValue(<>
            <div>{renderSummary()}
              {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</div>
            <RenderSuccessesErrorsWarnings results={processedResults} />
          </>);
      } else if (displayType === 'SevereMediumLow') {
        const processedResults = processNoticesToSevereMediumLow(rawCBPsResults, processOptions);
//                 console.log(`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
//   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()}`, `numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()}`, `numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        if (processedResults.severeList.length || processedResults.mediumList.length || processedResults.lowList.length)
          setResultValue(<>
            <p>Checked <b>{username} {languageCode} {bookIDList.join(', ')}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)
              {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</p>
            <RenderSuccessesSevereMediumLow results={processedResults} />
          </>);
        else // no severe, medium, or low notices
          setResultValue(<>
            <p>Checked <b>{username} {languageCode} {bookIDList.join(', ')}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)
              {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</p>
            <RenderSuccessesSevereMediumLow results={processedResults} />
          </>);
      } else if (displayType === 'SingleList') {
        const processedResults = processNoticesToSingleList(rawCBPsResults, processOptions);
        console.log(`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
  numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()}`, `numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()}`, `numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

        if (processedResults.warningList.length)
          setResultValue(<>
            <p>Checked <b>{username} {languageCode} {bookIDList.join(', ')}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)
              {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</p>
            <RenderSuccessesWarningsGradient results={processedResults} />
          </>);
        else // no warnings
          setResultValue(<>
            <p>Checked <b>{username} {languageCode} {bookIDList.join(', ')}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)
              {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</p>
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
export default AllBookPackagesCheck;
