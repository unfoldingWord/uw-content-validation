import React, { useState, useEffect } from 'react';
// import { withStyles } from '@material-ui/core/styles';
import * as books from '../../core/books/books';
import { ourParseInt, preloadReposIfNecessary } from '../../core';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesWarningsGradient, RenderElapsedTime } from '../RenderProcessedResults';
import { checkBookPackage } from './checkBookPackage';
// import { consoleLogObject } from '../../core/utilities';


// const BP_VALIDATOR_VERSION_STRING = '0.3.1';


function BookPackageCheck(/*username, languageCode, bookID,*/ props) {
    // Check a single Bible book across many repositories
    const [result, setResultValue] = useState("Waiting-CheckBookPackage");

    // console.log(`I'm here in BookPackageCheck v${BP_VALIDATOR_VERSION_STRING}`);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    let username = props.username;
    // console.log(`username='${username}'`);
    let languageCode = props.languageCode;
    // console.log(`languageCode='${languageCode}'`);
    let bookID = props.bookID;
    // console.log(`bookID='${bookID}'`);
    let dataSet = props.dataSet;
    // console.log(`dataSet='${dataSet}'`);
    let branch = props.branch;
    // console.log(`branch='${branch}'`);

    // Clear cached files if we've changed repo
    //  autoClearCache(bookID); // This technique avoids the complications of needing a button

    let checkingOptions = { // Uncomment any of these to test them
        dataSet: dataSet, // Can be 'OLD' (Markdown, etc.), 'NEW' (TSV only), or 'BOTH'
        // extractLength: 25,
        checkManifestFlag: true,
    };
    // Or this allows the parameters to be specified as a BookPackageCheck property
    if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);
    if (props.checkLinkedTAArticleFlag) checkingOptions.checkLinkedTAArticleFlag = props.checkLinkedTAArticleFlag.toLowerCase() === 'true';
    if (props.checkLinkedTWArticleFlag) checkingOptions.checkLinkedTWArticleFlag = props.checkLinkedTWArticleFlag.toLowerCase() === 'true';
    // console.log(`checkingOptions.checkLinkedTAArticleFlag ${checkingOptions.checkLinkedTAArticleFlag} from '${props.checkLinkedTAArticleFlag}'`);
    // console.log(`checkingOptions.checkLinkedTWArticleFlag ${checkingOptions.checkLinkedTWArticleFlag} from '${props.checkLinkedTWArticleFlag}'`);

    useEffect(() => {
        // const newProps = { bookID, branch, checkingOptions, languageCode, cutoffPriorityLevel: props.cutoffPriorityLevel, displayType: props.displayType, errorPriorityLevel: props.errorPriorityLevel, maximumSimilarMessages: props.maximumSimilarMessages, sortBy: props.sortBy, username};
        // console.log("BookPackageCheck.useEffect() called with ", JSON.stringify(newProps));

        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
            // console.log("Started BookPackageCheck.unnamedFunction()");

            // NOTE from RJH: I can't find the correct React place for this / way to do this
            //                  so it shows a warning for the user, and doesn't continue to try to process
            if (bookID !== 'OBS' && !books.isValidBookID(bookID)) {
                console.log(`Invalid '${bookID}' bookID given!`)
                setResultValue(<p style={{ color: 'red' }}>Please enter a valid USFM book identifier or 'OBS'. ('<b>{bookID}</b>' is not valid.)</p>);
                return;
            }

            // if (bookID !== 'OBS') { // Preload the reference repos
            setResultValue(<p style={{ color: 'magenta' }}>Preloading repos for {username} {languageCode} ready for <b>{bookID}</b> book package check…</p>);
            const successFlag = await preloadReposIfNecessary(username, languageCode, [bookID], branch);
            if (!successFlag)
                console.error(`BookPackageCheck error: Failed to pre-load all repos`)
            // }

            // Display our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Checking {username} {languageCode} <b>{bookID}</b> book package…</p>);

            const rawCBPResults = await checkBookPackage(username, languageCode, bookID, setResultValue, checkingOptions);

            // Add some extra fields to our rawCBPResults object in case we need this information again later
            rawCBPResults.checkType = 'BookPackage';
            rawCBPResults.username = username;
            rawCBPResults.languageCode = languageCode;
            rawCBPResults.bookID = bookID;
            rawCBPResults.checkedOptions = checkingOptions;

            // console.log("Here with CBP rawCBPResults", typeof rawCBPResults);
            // Now do our final handling of the result -- we have some options available
            let processOptions = { // Uncomment any of these to test them
                // 'maximumSimilarMessages': 4, // default is 3 -- 0 means don't suppress
                // 'errorPriorityLevel': 800, // default is 700
                // 'cutoffPriorityLevel': 100, // default is 0
                // 'sortBy': 'ByPriority', // default is 'AsFound'
                // 'ignorePriorityNumberList': [123, 202], // default is []
            };
            // Or this allows the parameters to be specified as a BookPackageCheck property
            if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
            if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
            if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
            if (props.sortBy) processOptions.sortBy = props.sortBy;
            if (props.ignorePriorityNumberList) { // We need to convert from string to Array
                console.assert(props.ignorePriorityNumberList[0] === '[' && props.ignorePriorityNumberList[props.ignorePriorityNumberList.length - 1] === ']', `Format of props.ignorePriorityNumberList '${props.ignorePriorityNumberList}' is wrong should be enclosed in []`)
                processOptions.ignorePriorityNumberList = [];
                for (const stringBit of props.ignorePriorityNumberList.substring(1, props.ignorePriorityNumberList.length - 1).split(',')) {
                    const intBit = ourParseInt(stringBit.trim()); // trim allows comma,space to also be used as separator
                    processOptions.ignorePriorityNumberList.push(intBit);
                }
                // console.log(`Now have processOptions.ignorePriorityNumberList=${JSON.stringify(processOptions.ignorePriorityNumberList)}`);
            }

            let displayType = 'ErrorsWarnings'; // default
            if (props.displayType) displayType = props.displayType;

            function renderSuccesses(processedResults) {
                if (processedResults.checkedFileCount > 0)
                    return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {processedResults.checkedFileCount.toLocaleString()} file{processedResults.checkedFileCount === 1 ? '' : 's'} from {username} {processedResults.checkedRepoNames.join(', ')}
                        <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;including {processedResults.checkedFilenameExtensions.length} file type{processedResults.checkedFilenameExtensions.size === 1 ? '' : 's'}: {processedResults.checkedFilenameExtensions.join(', ')}.</p>);
                else
                    return (<p>&nbsp;&nbsp;&nbsp;&nbsp;No files checked!</p>);
            }

            function renderSummary(processedResults) {
                return (<div>
                    <p>Checked <b>{username} {languageCode} {bookID}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)</p>
                    {renderSuccesses(processedResults)}
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={processedResults.elapsedSeconds} /> with {rawCBPResults.noticeList.length === 0 ? 'no' : rawCBPResults.noticeList.length.toLocaleString()} notice{rawCBPResults.noticeList.length === 1 ? '' : 's'}
                        {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}.</p>
                    {/* <RenderRawResults results={rawCBPResults} /> */}
                </div>);
            }

            if (displayType === 'ErrorsWarnings') {
                const processedResults = processNoticesToErrorsWarnings(rawCBPResults, processOptions);
                //             console.log(`BookPackageCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
                //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResults.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

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
                const processedResults = processNoticesToSevereMediumLow(rawCBPResults, processOptions);
                //             console.log(`BookPackageCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
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
                const processedResults = processNoticesToSingleList(rawCBPResults, processOptions);
                // console.log(`BookPackageCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
                //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

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

            // console.log("Finished rendering bit.");
        })(); // end of async part in unnamedFunction
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookID, branch, JSON.stringify(checkingOptions), languageCode, JSON.stringify(props), username]); // end of useEffect part

    // {/* <div className={classes.root}> */}
    return (
        <div className="Fred">
            {result}
        </div>
    );
}

// BookPackageCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   languageCode: PropTypes.object.isRequired,
//   bookID: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

// const styles = theme => ({
//   root: {
//   },
// });

//export default withStyles(styles)(BookPackageCheck);
export default BookPackageCheck;
