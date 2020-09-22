import React, { useState, useEffect } from 'react';
// import { withStyles } from '@material-ui/core/styles';
import * as books from '../../core/books/books';
import { clearCacheAndPreloadRepos, ourParseInt, checkBookPackage } from '../../core';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesWarningsGradient, RenderElapsedTime } from '../RenderProcessedResults';
// import { consoleLogObject } from '../../core/utilities';


// const BPS_VALIDATOR_VERSION_STRING = '0.1.2';


function GlBookPackageCheck(/*username, languageCode, bookIDs,*/ props) {
    // Check a single Bible book across many repositories
    const [result, setResultValue] = useState("Waiting-CheckBookPackages");

    // console.log(`I'm here in GlBookPackageCheck v${BPS_VALIDATOR_VERSION_STRING}`);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    let username = props.username;
    // console.log(`username='${username}'`);
    let languageCode = props.languageCode;
    // console.log(`languageCode='${languageCode}'`);
    let bookID = props.bookID;
    // console.log(`bookID='${bookID}'`);
    let branch = props.branch;
    // console.log(`branch='${branch}'`);

    // Clear cached files if we've changed repo
    //  autoClearCache(bookIDs); // This technique avoids the complications of needing a button

    let checkingOptions = { // Uncomment any of these to test them
        // 'extractLength': 25,
    };
    // Or this allows the parameters to be specified as a GlBookPackageCheck property
    if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);

    useEffect(() => {
        // console.log("GlBookPackageCheck.useEffect() called with ", JSON.stringify(props));

        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
            // console.log("Started GlBookPackageCheck.unnamedFunction()");

            // NOTE from RJH: I can't find the correct React place for this / way to do this
            //                  so it shows a warning for the user, and doesn't continue to try to process
            if (bookID !== 'OBS' && !books.isValidBookID(bookID)) {
                console.log(`Invalid '${bookID}' bookID given!`)
                setResultValue(<p style={{ color: 'red' }}>Please enter a valid USFM book identifier or 'OBS'. ('<b>{bookID}</b>' is not valid.)</p>);
                return;
            }

            // // TODO: We need to implement BM's new function here
            // // Preload the reference repos
            // let preloadCount = 1;
            // // TEMP: Removed TQ
            // const repoCodeList = ['UHB','UGNT', 'TA','TW'];
            // for (const repoCode of repoCodeList) {
            // setResultValue(<p style={{ color: 'magenta' }}>Preloading <b>{repoCode}</b> repo ({preloadCount}/{repoCodeList.length}) ready for {username} {languageCode} book packages check…</p>);
            //     const repoName = getRepoName(languageCode, repoCode);
            //     console.log(`GlBookPackageCheck: preloading zip file for ${repoName}…`);
            //     const zipFetchSucceeded = await fetchRepositoryZipFile({ username, repository: repoName, branch });
            //     if (!zipFetchSucceeded)
            //         console.log(`GlBookPackageCheck: misfetched ${repoCode} zip file for repo with ${zipFetchSucceeded}`);
            //     preloadCount += 1;
            //     }

            // This call is not needed, but makes sure you don't have stale data that has been cached
            setResultValue(<p style={{ color: 'magenta' }}>Preloading repos for {username} {languageCode} ready for GL book package check…</p>);
            const successFlag = await clearCacheAndPreloadRepos(username, languageCode, [bookID], branch);
            if (!successFlag)
                console.log(`AllBookPackagesCheck error: Failed to pre-load all repos`)

            // Display our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Checking {username} {languageCode} <b>{bookID}</b> book packages…</p>);

            const rawCBPsResults = await checkBookPackage(username, languageCode, bookID, setResultValue, checkingOptions);
            // console.log("checkBookPackage() returned", typeof rawCBPsResults); //, JSON.stringify(rawCBPsResults));

            // Add some extra fields to our rawCBPsResults object in case we need this information again later
            rawCBPsResults.checkType = 'BookPackages';
            rawCBPsResults.username = username;
            rawCBPsResults.languageCode = languageCode;
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
            // Or this allows the parameters to be specified as a GlBookPackageCheck property
            if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
            if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
            if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
            if (props.sortBy) processOptions.sortBy = props.sortBy;
            // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;

            let displayType = 'ErrorsWarnings'; // default
            if (props.displayType) displayType = props.displayType;

            function renderSummary(processedResults) {
                return (<div>
                    <p>Checked <b>{username} {languageCode} {bookID}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {processedResults.checkedFileCount.toLocaleString()} file{processedResults.checkedFileCount === 1 ? '' : 's'} from {username} {processedResults.checkedRepoNames.join(', ')}
                        <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;including {processedResults.checkedFilenameExtensions.length} file type{processedResults.checkedFilenameExtensions.size === 1 ? '' : 's'}: {processedResults.checkedFilenameExtensions.join(', ')}.</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={processedResults.elapsedSeconds} /> with {rawCBPsResults.noticeList.length === 0 ? 'no' : rawCBPsResults.noticeList.length.toLocaleString()} notice{rawCBPsResults.noticeList.length === 1 ? '' : 's'}.</p>
                    {/* <RenderRawResults results={rawCBPsResults} /> */}
                </div>);
            }

            if (displayType === 'ErrorsWarnings') {
                const processedResults = processNoticesToErrorsWarnings(rawCBPsResults, processOptions);
                console.log(`GlBookPackageCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
  numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

                // console.log("Here now in rendering bit!");

                if (processedResults.errorList.length || processedResults.warningList.length)
                    setResultValue(<>
                        <div>{renderSummary(processedResults)}
                            {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
                        <RenderSuccessesErrorsWarnings results={processedResults} />
                    </>);
                else // no errors or warnings
                    setResultValue(<>
                        <div>{renderSummary(processedResults)}
                            {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</div>
                        <RenderSuccessesErrorsWarnings results={processedResults} />
                    </>);

            } else if (displayType === 'SevereMediumLow') {
                const processedResults = processNoticesToSevereMediumLow(rawCBPsResults, processOptions);
                //                 console.log(`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
                //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()}`, `numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()}`, `numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

                if (processedResults.severeList.length || processedResults.mediumList.length || processedResults.lowList.length)
                    setResultValue(<>
                        <div>{renderSummary(processedResults)}
                            {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
                        <RenderSuccessesSevereMediumLow results={processedResults} />
                    </>);
                else // no severe, medium, or low notices
                    setResultValue(<>
                        <div>{renderSummary(processedResults)}
                            {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</div>
                        <RenderSuccessesSevereMediumLow results={processedResults} />
                    </>);

            } else if (displayType === 'SingleList') {
                const processedResults = processNoticesToSingleList(rawCBPsResults, processOptions);
                console.log(`FileCheck got processed results with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
  numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()}`, `numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()}`, `numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

                if (processedResults.warningList.length)
                    setResultValue(<>
                        <div>{renderSummary(processedResults)}
                            {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
                        <RenderSuccessesWarningsGradient results={processedResults} />
                    </>);
                else // no warnings
                    setResultValue(<>
                        <div>{renderSummary(processedResults)}
                            {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</div>
                        <RenderSuccessesWarningsGradient results={processedResults} />
                    </>);
            } else setResultValue(<b style={{ color: 'red' }}>Invalid displayType='{displayType}'</b>)

            // console.log("Finished rendering bit.");
        })(); // end of async part in unnamedFunction
        // Doesn't work if we add this to next line: bookIDList,bookIDs,username,branch,checkingOptions,languageCode,props
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookID, branch, JSON.stringify(checkingOptions), languageCode, JSON.stringify(props), username]); // end of useEffect part

    // {/* <div className={classes.root}> */}
    return (
        <div className="Fred">
            {result}
        </div>
    );
}

// GlBookPackageCheck.propTypes = {
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

//export default withStyles(styles)(GlBookPackageCheck);
export default GlBookPackageCheck;
