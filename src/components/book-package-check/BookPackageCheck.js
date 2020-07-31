import React, { useState, useEffect } from 'react';
import { withStyles } from '@material-ui/core/styles';
import * as books from '../../core/books/books';
import checkBookPackage from './checkBookPackage';
import processNoticesToErrorsWarnings from '../../core/notice-processing-functions';
import { RenderSuccessesErrorsWarnings } from '../RenderProcessedResults';
import { ourParseInt, consoleLogObject } from '../../core/utilities';


const CHECKER_VERSION_STRING = '0.1.1';


function BookPackageCheck(/*username, language_code, bookCode,*/ props) {
    // Check a single Bible book across many repositories
    const [result, setResultValue] = useState("Waiting-CheckBookPackage");

    // console.log(`I'm here in BookPackageCheck v${CHECKER_VERSION_STRING}`);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    let username = props.username;
    // console.log(`username='${username}'`);
    let language_code = props.language_code;
    // console.log(`language_code='${language_code}'`);
    let bookCode = props.bookCode;
    // console.log(`bookCode='${bookCode}'`);
    let branch = props.branch;
    // console.log(`branch='${branch}'`);

    if (bookCode!=='OBS' && !books.isValidBookCode(bookCode))
        return (<p>Please enter a valid USFM book code. ('{bookCode}' is not valid.)</p>);

     // Clear cached files if we've changed repo
    //  autoClearCache(bookCode); // This technique avoids the complications of needing a button

     let checkingOptions = { // Uncomment any of these to test them
        // 'extractLength': 25,
        };
    // Or this allows the parameters to be specified as a BookPackageCheck property
    if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);

    useEffect(() => {
        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
            // console.log("Started unnamedFunction()");

            // Display our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Waiting for check results for {username} {language_code} <b>{bookCode}</b> book package…</p>);

            const rawResult = await checkBookPackage(username, language_code, bookCode, setResultValue, checkingOptions);
            // console.log("checkBookPackage() returned", typeof rawResult); //, JSON.stringify(rawResult));

            // Add some extra fields to our rawResult object in case we need this information again later
            rawResult.checkType = 'BookPackage';
            rawResult.username = username;
            rawResult.language_code = language_code;
            rawResult.bookCode = bookCode;
            rawResult.checkedOptions = checkingOptions;

            // console.log("Here with CBP rawResult", typeof rawResult);
            // Now do our final handling of the result -- we have some options available
            let processOptions = { // Uncomment any of these to test them
                // 'maximumSimilarMessages': 3, // default is 2
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
            // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;
            const processedResult = processNoticesToErrorsWarnings(rawResult, processOptions);
//             console.log(`BookPackageCheck got back processedResult with ${processedResult.successList.length.toLocaleString()} success message(s), ${processedResult.errorList.length.toLocaleString()} error(s) and ${processedResult.warningList.length.toLocaleString()} warning(s)
//   numIgnoredNotices=${processedResult.numIgnoredNotices.toLocaleString()} numSuppressedErrors=${processedResult.numSuppressedErrors.toLocaleString()} numSuppressedWarnings=${processedResult.numSuppressedWarnings.toLocaleString()}`);

            // console.log("Here now in rendering bit!");

            function renderSummary() {
                return (<>
                <p>Checked <b>{username} {language_code} {bookCode}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branches)</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {processedResult.checkedFileCount.toLocaleString()} file{processedResult.checkedFileCount==1?'':'s'} from {processedResult.checkedRepoNames.join(', ')}
                <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;including {processedResult.checkedFilenameExtensions.length} file type{processedResult.checkedFilenameExtensions.size === 1 ? '' : 's'}: {processedResult.checkedFilenameExtensions.join(', ')}.</p>
                </>);
            }

            if (processedResult.errorList.length || processedResult.warningList.length)
                setResultValue(<>
                    <p>{renderSummary()}
                        {processedResult.numIgnoredNotices ? ` (but ${processedResult.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</p>
                    <RenderSuccessesErrorsWarnings results={processedResult} />
                </>);
            else // no errors or warnings
                setResultValue(<>
                    <p>{renderSummary()}
                    {processedResult.numIgnoredNotices ? ` (with a total of ${processedResult.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</p>
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

// BookPackageCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   language_code: PropTypes.object.isRequired,
//   bookCode: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

const styles = theme => ({
  root: {
  },
});

export default withStyles(styles)(BookPackageCheck);
