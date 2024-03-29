import React from 'react';
import { forwardRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { parameterAssert, userLog, debugLog, functionLog, dataAssert } from '../core/utilities';

// NOTE: The following line is currently giving compile warnings -- a problem in a dependency it seems
import MaterialTable from 'material-table';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';

const tableIcons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};


// const RENDER_PROCESSED_RESULTS_VERSION = '1.0.4';


/**
 *
 * @param {Object} param0 with username string and results object
 * @returns a rendered list of files that have been checked
 */
export function RenderCheckedFilesList({ username, results }) {
    // Also used in some of the lower-level demo results
    if (results?.checkedFileCount > 0)
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {results.checkedFileCount.toLocaleString()} file{results.checkedFileCount === 1 ? '' : 's'} from {results.checkedRepoNames.length.toLocaleString()} <i>{username}</i> repo{results.checkedRepoNames.length === 1 ? '' : 's'}: {results.checkedRepoNames.join(', ')}
            <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;including {results.checkedFilenameExtensions.length} file type{results.checkedFilenameExtensions.length === 1 ? '' : 's'}: {results.checkedFilenameExtensions.join(', ')}.</p>);
    else
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;No files checked!</p>);
}

/**
 *
 * @param {Object} param0 with elapsedSeconds
 * @returns the elapsed time rendered appropriately for the human reader
 */
export function RenderElapsedTime({ elapsedSeconds }) {
    const seconds = Math.round(elapsedSeconds % 60);
    let remainingTime = Math.floor(elapsedSeconds / 60);
    const minutes = Math.round(remainingTime % 60);
    remainingTime = Math.floor(remainingTime / 60);
    const hours = Math.round(remainingTime % 24);
    remainingTime = Math.floor(remainingTime / 24);
    //parameterAssert(remainingTime === 0, `Elapsed time also contains ${remainingTime} days`);
    return <>{hours ? `${hours} hour` : ''}{hours && hours !== 1 ? 's' : ''}{hours ? ', ' : ''}{minutes ? `${minutes} minute` : ''}{minutes && minutes !== 1 ? 's' : ''}{minutes ? ', ' : ''}{seconds} second{seconds === 1 ? '' : 's'}</>;
}
/**
 *
 * @param {Object} param0 with rawNoticeListLength and results object
 * @returns
 */
export function RenderTotals({ rawNoticeListLength, results }) {
    if (results?.numIgnoredNotices || results?.numDisabledNotices) {
        const netNumNotices = rawNoticeListLength - results.numIgnoredNotices - results.numDisabledNotices;
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={results.elapsedSeconds} /> with {netNumNotices === 0 ? 'no' : netNumNotices.toLocaleString()} notice{netNumNotices === 1 ? ' ' : 's '}
            ({rawNoticeListLength === 0 ? 'no' : rawNoticeListLength.toLocaleString()} raw notice{rawNoticeListLength === 1 ? '' : 's'} but
            {results.numIgnoredNotices ? ` ${results.numIgnoredNotices.toLocaleString()} ignored notice${results.numIgnoredNotices === 1 ? '' : 's'}` : ""}
            {results.numIgnoredNotices && results.numDisabledNotices ? ' and' : ''}
            {results.numDisabledNotices ? ` ${results.numDisabledNotices.toLocaleString()} expected/disabled notice${results.numDisabledNotices === 1 ? '' : 's'}` : ""}
            ).
            {results.checkedOptions.cutoffPriorityLevel ? ` Priority level ${results.checkedOptions.cutoffPriorityLevel} or lower were not included.` : ''}
        </p>);
    } else // it’s much simpler
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={results.elapsedSeconds} /> with {rawNoticeListLength === 0 ? 'no' : rawNoticeListLength.toLocaleString()} notice{rawNoticeListLength === 1 ? '' : 's'}.
            {results.checkedOptions.cutoffPriorityLevel ? ` Priority level ${results.checkedOptions.cutoffPriorityLevel} or lower were not included.` : ''}</p>);
}

function RenderSuppressedCount({ suppressedCount }) {
    if (suppressedCount === 0)
        return null;
    // else
    // debugLog(`RenderSuppressedCount have ${suppressedCount.toLocaleString()} suppressed notices`);
    return <>
        <p><small style={{ color: 'Gray' }}>{suppressedCount ? suppressedCount.toLocaleString() + " excess notice" + (suppressedCount === 1 ? '' : 's') + " suppressed." : ''}</small></p>
    </>;
}
function RenderCutoffCount({ cutoffCount, cutoffLevel }) {
    if (cutoffCount === 0)
        return null;
    // else
    // debugLog(`RenderCutoffCount have ${suppressedCount.toLocaleString()} suppressed notices`);
    return <>
        <p><small style={{ color: 'Gray' }}>{cutoffCount ? cutoffCount.toLocaleString() + " low priority notice" + (cutoffCount === 1 ? '' : 's') + " (below level " + cutoffLevel + ") dropped." : ''}</small></p>
    </>;
}

/**
 * @description - Displays a given piece of text (which can include newline characters)
 * @param {Object} param0 with text - text to render as numbered lines
 * @return {String} - rendered HTML for the numbered list of lines
 */
export function RenderNumberedLines({ text }) {
    // This function is only used in some of the demos
    return <ol>
        {text.split('\n').map(function (line, index) {
            return <li key={'RNL' + index}>{line}</li>;
        })}
    </ol>;
}


const MAX_ARRAY_ITEMS_TO_DISPLAY = 8; // Or do we want this as a parameter?
/**
* @description - Displays whatever is in the object
* @param {Object} thisObject - object to render
* @param {Array} excludeList - optional list of object property names to be ignored
* @return {String} - rendered HTML for list of thisObject properties
*/
export function RenderObject({ thisObject, excludeList }) {
    // functionLog("RenderObject");
    // consoleLogObject('RenderObject settings', settings);
    return <ul>
        {
            Object.keys(thisObject).map((key, keyIndex) => {
                if (!excludeList || !excludeList.includes(key)) {
                    let displayObject = thisObject[key];
                    if (Array.isArray(displayObject) && displayObject.length > MAX_ARRAY_ITEMS_TO_DISPLAY)
                        displayObject = `(only first ${MAX_ARRAY_ITEMS_TO_DISPLAY} displayed here) ${JSON.stringify(displayObject.slice(0, MAX_ARRAY_ITEMS_TO_DISPLAY))}, etc…`;
                    return (
                        <li key={'RO' + keyIndex}>&nbsp;&nbsp;&nbsp;&nbsp;
                            <span><b>{key}</b>{Array.isArray(thisObject[key]) ? ` (${thisObject[key].length.toLocaleString()}) ` : ''}: {typeof displayObject === 'object' ? JSON.stringify(displayObject) : displayObject}</span>
                        </li>
                    )
                }
                return null;
            }, [])}
    </ul>;
}


/**
* @description - Displays the raw noticeList in a table
* @param {Object} results - object containing noticeList
* @return {String} - rendered HTML for table of notices
*/
export function RenderRawResults({ results }) {
    // This function is flexible enough to handle notice objects:
    //      including bookID,C,V or not
    //      including repoName, filename, lineNumber or not
    //      including extra or not

    // functionLog("RenderRawResults");
    // consoleLogObject('RenderRawResults results', results);
    // displayPropertyNames('RenderRawResults results', results);

    // Create a list of other property names
    // let propertyList = [], newObject = {};
    // for (const propertyName in results)
    //     if (propertyName !== 'noticeList') {
    //         newObject[propertyName] = results[propertyName];
    //         propertyList.push(<p>{propertyName} = {results[propertyName]}</p>);
    //     }
    // consoleLogObject('propertyList', propertyList);

    if (!results.noticeList || !results.noticeList.length)
        return <>
            <p><b>Raw Results</b> (no notices were produced):</p>
            <RenderObject thisObject={results} excludeList={['noticeList']} />
        </>;
    // If we get here, we have notices.
    // debugLog(`RenderRawResults got ${results.noticeList.length} notices`);

    // Discover what fields we have in our notice objects (in order to set our table headers below)
    const allPropertiesSet = new Set();
    let haveOBS = false, haveBible = false;
    // debugLog( "allPropertiesSet-A", JSON.stringify([...allPropertiesSet]));
    for (const noticeEntry of results.noticeList)
        // debugLog("noticeEntry", JSON.stringify(noticeEntry));
        // debugLog(`RenderRawResults found (${Object.keys(noticeEntry).length}) ${Object.keys(noticeEntry)}`);
        for (const [noticePropertyName, noticePropertyValue] of Object.entries(noticeEntry))
            // debugLog("  Found", noticePropertyName, "=", noticeEntry[noticePropertyName]);
            if (noticePropertyValue !== undefined) {
                allPropertiesSet.add(noticePropertyName);
                if (noticePropertyName === 'bookID' && noticePropertyValue) {
                    if (noticePropertyValue === 'OBS') haveOBS = true;
                    else haveBible = true;
                }
            }
    // debugLog( "RenderRawResults allPropertiesSet-Z", JSON.stringify([...allPropertiesSet]));

    // Adjust the headers according to the column sets that we actually have in the noticeList
    let headerData = [
        { title: 'Priority', field: 'priority', type: 'numeric' },
        { title: 'Message', field: 'message' },
    ];
    if (allPropertiesSet.has('details')) headerData = headerData.concat([{ title: 'Details', field: 'details' }]);
    if (allPropertiesSet.has('bookID')) headerData = headerData.concat([{ title: 'Book', field: 'bookID' }]);
    if (allPropertiesSet.has('C') || allPropertiesSet.has('V')) {
        let CName = '???', VName = '???';
        if (haveBible && !haveOBS) { CName = 'Chapter'; VName = 'Verse'; }
        else if (haveOBS && !haveBible) { CName = 'Story'; VName = 'Frame'; }
        else if (haveBible && haveOBS) { CName = 'Chapter/Story'; VName = 'Verse/Frame'; }
        headerData = headerData.concat([
            { title: CName, field: 'C' },
            { title: VName, field: 'V' }
        ]);
    }
    if (allPropertiesSet.has('rowID')) headerData = headerData.concat([{ title: 'row ID', field: 'rowID' }]);
    if (allPropertiesSet.has('repoCode')) headerData = headerData.concat([{ title: 'RepoCode', field: 'repoCode' }]);
    if (allPropertiesSet.has('username')) headerData = headerData.concat([{ title: 'Username', field: 'username' }]);
    if (allPropertiesSet.has('repoName')) headerData = headerData.concat([{ title: 'RepoName', field: 'repoName' }]);
    if (allPropertiesSet.has('filename')) headerData = headerData.concat([{ title: 'Filename', field: 'filename' }]);
    if (allPropertiesSet.has('fieldName')) headerData = headerData.concat([{ title: 'Field', field: 'fieldName' }]);
    if (allPropertiesSet.has('lineNumber')) headerData = headerData.concat([{ title: 'Line', field: 'lineNumber' }]);
    if (allPropertiesSet.has('characterIndex')) headerData = headerData.concat([{ title: 'CharIndex', field: 'characterIndex' }]);
    if (allPropertiesSet.has('excerpt')) headerData = headerData.concat([{ title: 'Excerpt', field: 'excerpt' }]);
    if (allPropertiesSet.has('location')) headerData = headerData.concat([{ title: 'Location', field: 'location' }]);
    if (allPropertiesSet.has('extra')) headerData = headerData.concat([{ title: 'Extra', field: 'extra' }]);
    // debugLog("headerData", headerData.length, JSON.stringify(headerData));

    // Make the actual table and return it
    return <>
        <b>Raw Results</b>:
        <RenderObject thisObject={results} />
        <MaterialTable
            icons={tableIcons}
            title={`All ${results.noticeList.length.toLocaleString()} Raw Notices`}
            columns={headerData}
            data={results.noticeList}
            options={{ sorting: true, exportButton: true, exportAllData: true, columnsButton: true, filtering: true }}
        />
    </>;
}


function RenderSuccessesSummaryLine({ haveErrorsOrWarnings, results }) {
    // functionLog(`RenderSuccessesSummaryLine(${haveErrorsOrWarnings}, ${results})`);

    let successCount;
    if (results.successList.length === 1) successCount = 'One';
    else if (results.successList.length === 2) successCount = 'Two';
    else if (results.successList.length === 3) successCount = 'Three';
    else if (results.successList.length === 4) successCount = 'Four';
    else if (results.successList.length === 5) successCount = 'Five';
    else if (results.successList.length === 6) successCount = 'Six';
    else successCount = results.successList.length.toLocaleString();

    let currentDate = new Date();
    let dateString = currentDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    let timeString = currentDate.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });

    return <>
        <b style={{ color: haveErrorsOrWarnings ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{results.successList.length === 1 ? '' : 's'} completed {dateString} at {timeString}{results.successList.length ? ':' : ''}</b>
    </>;
}

function RenderSuccessesColored({ results }) {
    // Display our array of success message strings in a nicer format
    //
    // Expects results to contain:
    //      1/ successList
    // functionLog("RenderSuccessesColored with ", successList);
    // consoleLogObject('RenderSuccessesColored results', results);

    let haveWarnings;
    try { haveWarnings = results.errorList.length || results.warningList.length; }
    catch (e1) {
        try { haveWarnings = results.severeList.length || results.mediumList.length || results.lowList.length; }
        catch (e2) { haveWarnings = results.warningList.length; }
    }

    return <ul>
        {results.successList.map(function (listEntry, index) {
            return <li key={'RSC' + index}>
                <b style={{ color: haveWarnings ? 'limegreen' : 'green' }}>{listEntry}</b>
            </li>;
        })}
    </ul>;
}


/**
* @description - Displays the message plus details if specified
* @param {string} color - color field for the message style
* @param {string} message - notice text
* @param {string} details - (optional) extra notice text
* @return {String} - rendered HTML for the given reference
*/
function RenderMessage({ color, message, details }) {
    let detailsString = '';
    if (details)
        if (details.startsWith('verse text ◗'))
            detailsString = <> with verse text ◗<span style={{ backgroundColor: 'LemonChiffon' }}>{details.slice(12, -1)}</span>◖</>;
        else if (details.length)
            detailsString = <> with '{details}'</>;
    return <><b style={{ color: color }}>{message}</b>{detailsString}</>;
}
/**
* @description - Displays the bookcode and chapter/verse details if specified
* @param {string} bookID - (optional) 3-character UPPERCASE USFM bookcode or 'OBS'.
* @param {string} C - (optional) chapter info
* @param {string} V - (optional) verse info
* @return {String} - rendered HTML for the given reference
*/
function RenderBCV({ bookID, C, V }) {
    // These are all optional parameters - they may be undefined or blank if irrelevant
    // functionLog(`RenderBCV(${bookID}, ${C}, ${V})`);
    if (!bookID && !C && !V) return null; // They're all undefined or blank!
    // debugLog(`RenderBCV2 ${bookID}, ${C}, ${V}`);
    let result;
    if (bookID && bookID.length) result = bookID;
    if (C && C.length) result = `${result}${result.length ? ' ' : ''}${C}`;
    if (V && V.length) result = `${result}${result.length ? ':' : ''}${V}`;
    if (result.length)
        return <> {V && V.length ? 'at' : 'in'} <b>{result}</b></>;
    return null;
}
/**
* @description - Displays the repoName and filename/lineNumber details if specified
* @param {string} username - (optional) username/orgName string
* @param {string} repoName - (optional) repo name string
* @param {string} filename - (optional) filename string
* @param {number} lineNumber - (optional) line number integer (1-based)
* @param {string} rowID - (optional) 4-character ID field
* @param {string} fieldName - (optional) name of field
* @return {String} - rendered HTML for the given reference
*/
function RenderFileDetails({ givenEntry }) {
    // The fields are all optional parameters - they may be undefined or blank if irrelevant
    //
    // TODO: I'm sure this function can be rewritten and greatly simplified (but barely worth it???) -- maybe write some test cases first
    //
    // functionLog(`RenderFileDetails(${JSON.stringify(givenEntry)})`);
    // debugLog(`RenderFileDetails(${JSON.stringify(givenEntry)})`);
    if (!givenEntry.repoName && !givenEntry.filename && !givenEntry.lineNumber && !givenEntry.rowID && !givenEntry.fieldName)
        return null; // They're all undefined or blank!

    if (!givenEntry.branch) givenEntry.branch = givenEntry.repoName?.endsWith('2') ? 'newFormat' : 'master'; // default but with TEMP code for newFormat
    // debugLog(`RenderFileDetails2 ${repoName}, ${filename}, ${lineNumber}`);
    // debugLog(`RenderFileDetails got givenEntry.branch='${givenEntry.branch}'`);

    // Not sure if this happens with BP check, but filecheck for TN was giving bad links for TA warnings
    let adjustedRepoName = givenEntry.repoName;
    const firstMsgWord = givenEntry.message.split(' ')[0]; // This might be the former 'extra' field
    if (['TA', 'TW'].indexOf(firstMsgWord) >= 0) {
        let adjustedLanguageCode = givenEntry.repoName.split('_')[0];
        if (adjustedLanguageCode === 'hbo' || adjustedLanguageCode === 'el-x-koine') adjustedLanguageCode = 'en'; // This is a guess (and won’t be needed for TWs when we switch to TWLs)
        adjustedRepoName = `${adjustedLanguageCode}_${firstMsgWord.toLowerCase()}`;
        if (adjustedRepoName !== givenEntry.repoName) debugLog(`RenderFileDetails: trying adjusting repoName from '${givenEntry.repoName}' to '${adjustedRepoName}' for ${JSON.stringify(givenEntry)}`);
    }
    // debugLog(`RenderFileDetails got adjustedRepoName='${adjustedRepoName}'`);

    let resultStart = '', lineResult = '', resultEnd = '', fileLineLink = '', fileLink = '';
    if (adjustedRepoName?.length) resultStart += ` in ${adjustedRepoName} repository`;
    if (givenEntry.username && adjustedRepoName && givenEntry.filename) {
        const useFilename = givenEntry.filename.startsWith('text extracted from ') ? givenEntry.filename.slice('text extracted from '.length) : givenEntry.filename;
        try { // use blame so we can see the actual line!
            if (useFilename.endsWith('.tsv') || useFilename.endsWith('.md')) {
                let folder = '';
                if (useFilename !== 'README.md' && useFilename !== 'LICENSE.md') {
                    if (adjustedRepoName.indexOf('_obs') !== -1 && useFilename.endsWith('.md') && !useFilename.startsWith('content/'))
                        folder = 'content/';
                    else if (adjustedRepoName.endsWith('_tw') && !useFilename.startsWith('bible/')) {
                        folder = 'bible/';
                        dataAssert(useFilename.split('/').length === 2, `RenderFileDetails expected TW filename '${useFilename}' to contain subfolder`); // filename actually contains the subfolder
                    }
                }
                fileLink = `https://git.door43.org/${givenEntry.username}/${adjustedRepoName}/blame/branch/${givenEntry.branch}/${folder}${useFilename}`;
            } else // not TSV or MD
                fileLink = `https://git.door43.org/${givenEntry.username}/${adjustedRepoName}/src/branch/${givenEntry.branch}/${useFilename}`;
        } catch (someErr) { debugLog(`What was someErr here: ${someErr}`); }
        // // NOTE: WHY WAS " && !fileLink" in the next line?
        // if (givenEntry?.filename.length) {
        //     let adjustedFilename = givenEntry.filename;
        //     if (adjustedFilename.startsWith('bible/')) adjustedFilename = adjustedFilename.slice(6); // drop that first foldername
        //     resultStart += ` in FILE ${adjustedFilename}`;
        // }
        if (givenEntry.lineNumber) {
            // resultStart += ' on ';
            if (fileLink && givenEntry.lineNumber)
                fileLineLink = `${fileLink}#L${givenEntry.lineNumber}`;
            lineResult = `line ${givenEntry.lineNumber.toLocaleString()}`;
        }
        // else resultEnd += " no lineNumber";
    }
    // else if (!username) resultEnd += " no username";
    // else if (!repoName) resultEnd += " no repoName";
    // else if (!filename) resultEnd += " no filename";
    if (givenEntry.rowID && givenEntry.rowID.length)
        resultEnd = <>{resultEnd} with row ID <b><span style={{ fontFamily: 'Courier New, courier, monospace' }}>{givenEntry.rowID}</span></b></>;
    if (givenEntry.fieldName && givenEntry.fieldName.length)
        resultEnd = <>{resultEnd} in {givenEntry.fieldName} field</>;

    let adjustedFilename = givenEntry.filename;// could be undefined
    if (adjustedFilename?.startsWith('bible/')) adjustedFilename = adjustedFilename.slice(6); // drop that first foldername
    let inFileBit = adjustedFilename ? ` in file ${adjustedFilename}` : '';

    // debugLog(`RenderFileDetails got resultStart='${resultStart}'`);
    // debugLog(`RenderFileDetails got adjustedFilename='${adjustedFilename}'`);
    // debugLog(`RenderFileDetails got inFileBit='${inFileBit}'`);
    // debugLog(`RenderFileDetails got lineResult='${lineResult}'`);
    // debugLog(`RenderFileDetails got fileLineLink='${fileLineLink}'`);
    // debugLog(`RenderFileDetails got fileLink='${fileLink}'`);
    // debugLog(`RenderFileDetails got resultEnd='${resultEnd}'`);
    if (fileLineLink.length) // we know the filename and the line number
        return <>{resultStart}{inFileBit} on <a rel="noopener noreferrer" target="_blank" href={fileLineLink}>{lineResult}</a>{resultEnd}</>;
    else if (fileLink.length) // we know the filename but not the line number
        return <>{resultStart} in file <a rel="noopener noreferrer" target="_blank" href={fileLink}>{givenEntry.filename}</a>{resultEnd}</>;
    else if (lineResult.length) // we know the line number -- how can this happen
        return <> [DEBUG-CC] {resultStart}{inFileBit}<b>{lineResult}</b>{resultEnd}</>;
    else // we know the filename -- isn't that already covered above ???
        // Well it does happen in RepoCheck: hi_obs-tn LICENSE: Missing LICENSE.md [DEBUG-DD] in hi_obs-tn repository with file (Priority 946)
        return <>{resultStart} with file <b>{givenEntry.filename}</b>{resultEnd}</>;
}
// end of RenderFileDetails

function RenderExcerpt({ excerpt, message }) {
    // functionLog(`RenderExcerpt(${excerpt}, ${message})`);
    // NOTE: These message strings must match notes-links-check.js (priority 82, and priority 32,)
    // Note that messages might start with a repo code, e.g., "TN Actual message start"
    // if (message.endsWith("Untested general/outside link")
    //     || message.endsWith("Error loading general link")
    //     || message.endsWith("Should http link be https")) {
    // debugLog(`Here1 RenderExcerpt(${excerpt}, ${message})`);
    if (excerpt && excerpt[0] === '[' && excerpt.slice(-1) === ')' && excerpt.indexOf('](') !== -1) { // then the excerpt is a link so let's liven it
        // debugLog(`Here2 RenderExcerpt(${excerpt}, ${message})`);
        const ix = excerpt.indexOf('](');
        const displayPart = excerpt.slice(1, ix); // Start after the [ until before the ](
        const linkPart = excerpt.slice(ix + 2, excerpt.length - 1); // Step past the ]( but don’t include the final )
        const adjLinkPart = message === "Should http link be https" ? linkPart.replace('http:', 'https:') : linkPart;
        // debugLog(`RenderExcerpt from '${excerpt}' got ix=${ix}, displayPart='${displayPart}', linkPart='${linkPart}', adjLinkPart='${adjLinkPart}'`);
        return <><span style={{ color: 'DimGray' }}>` around ◗[{displayPart}](<a rel="noopener noreferrer" target="_blank" href={adjLinkPart}>{linkPart}</a>)◖`</span></>
    }
    // }
    if (excerpt && excerpt.length)
        return <> around ◗<span style={{ color: 'DarkOrange' }}><b>{excerpt}</b></span>◖</>;
    // else
    return null;
}
// end of RenderExcerpt

/**
 *
 * @param {Object} props.entry -- the given notice entry object
 */
function RenderPriority({ entry }) {
    // Also displays the debugChain (after the priority) if the debugChain string exists
    if (entry.debugChain)
        return <small><span style={{ color: 'Gray' }}> ({"Priority " + entry.priority})</span> <span style={{ color: 'Purple' }}>[{entry.debugChain}]</span></small>
    else
        return <small style={{ color: 'Gray' }}> ({"Priority " + entry.priority})</small>
}

/**
 *
 * @param {Object} param0
 * @returns JSX rendered entry
 */
function RenderOneEntry({ color, entry }) {
    // functionLog(`RenderOneEntry with ${color} and ${JSON.stringify(entry)}`);
    return <>
        <RenderMessage color={color} message={entry.message} details={entry.details} />
        <RenderBCV bookID={entry.bookID} C={entry.C} V={entry.V} />
        <RenderFileDetails givenEntry={entry} />
        {entry.characterIndex > 0 ? " (at character " + (entry.characterIndex + 1).toLocaleString() + ")" : ""}
        <RenderExcerpt excerpt={entry.excerpt} message={entry.message} />
        {entry.location}
        <RenderPriority entry={entry} /></>;
}


function RenderHiddenNotices({ color, suppressedNoticeList }) {
    return <ul>
        {suppressedNoticeList.map(function (suppressedEntry, index) {
            // debugLog(`RenderHiddenNotices ${index} ${JSON.stringify(suppressedEntry)}`);
            return <li key={'RHN' + index}>
                <RenderOneEntry color={color} entry={suppressedEntry} />
            </li>;
        })}
    </ul>;
}


/**
 *
 * @param {Object} param0 with arrayType of 'w','e','s' and an array of results
 * @returns JSX rendered table
 */
function RenderProcessedArray({ arrayType, results }) {
    // Display our array of objects in a nicer format
    //  priority (integer), message (string)
    //  plus optional fields:
    //      bookID, C, V, repoName, filename, lineNumber
    //      characterIindex (integer), excerpt (string), location (string)
    //
    // functionLog("RenderProcessedArray with ", arrayType);
    // consoleLogObject('RenderProcessedArray results', results);

    if (arrayType === 's')
        return <>
            <RenderSuccessesColored results={results} />
        </>;
    else { // not 's' (successList)
        const myList = arrayType === 'e' ? results.errorList : results.warningList;
        // if (myList === undefined) {
        //     debugLog(`RenderProcessedArray couldn't find errorList or warningList from ${JSON.stringify(results)}`);
        //     return null;
        // }
        const thisColor = arrayType === 'e' ? 'red' : 'orange';
        return <ul>
            {myList.map(function (listEntry, index) {
                if (listEntry.location === undefined)
                    debugLog(`RenderProcessedArray: why is location undefined for ${JSON.stringify(listEntry)}`);
                else if (listEntry.location.indexOf(' HIDDEN') >= 0 && listEntry.hiddenNotices)
                    // This is a "MORE SIMILAR ERRORS/WARNINGS/NOTICES SUPRESSED" message with other notices embedded
                    //  so we allow it to be expanded using HTML5 "details" feature.
                    return <li key={'RPA' + index}><details>
                        <summary><RenderOneEntry color={thisColor} entry={listEntry} /></summary>
                        <RenderHiddenNotices color={thisColor} suppressedNoticeList={listEntry.hiddenNotices} /></details></li>;
                // else (a regular message)
                return <li key={'RPA' + index}>
                    <RenderOneEntry color={thisColor} entry={listEntry} />
                </li>;
            })}
        </ul>;
    }
}
function RenderErrors({ results }) {
    // functionLog("RenderErrors");
    // consoleLogObject('RenderErrors results', results);
    userLog(`Displaying ${results.errorList.length.toLocaleString()} error(s) with ${results.numHiddenErrors.toLocaleString()} hidden`);
    return <>
        <b style={{ color: results.errorList.length ? 'red' : 'green' }}>{results.errorList.length.toLocaleString()} error{results.errorList.length === 1 ? '' : 's'}</b>{results.errorList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numHiddenErrors ? " (" + results.numHiddenErrors.toLocaleString() + " similar one" + (results.numHiddenErrors === 1 ? '' : 's') + " hidden)" : ''}</small>
        <RenderProcessedArray results={results} arrayType='e' />
    </>;
}
function RenderWarnings({ results }) {
    // functionLog("RenderWarnings");
    // consoleLogObject('RenderWarnings results', results);
    userLog(`Displaying ${results.warningList.length.toLocaleString()} warnings(s) with ${results.numHiddenWarnings.toLocaleString()} hidden`);
    return <>
        <b style={{ color: results.warningList.length ? 'orange' : 'green' }}>{results.warningList.length.toLocaleString()} warning{results.warningList.length === 1 ? '' : 's'}</b>{results.warningList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numHiddenWarnings ? " (" + results.numHiddenWarnings.toLocaleString() + " similar one" + (results.numHiddenWarnings === 1 ? '' : 's') + " hidden)" : ''}</small>
        <RenderProcessedArray results={results} arrayType='w' />
    </>;
}
function RenderErrorsAndWarnings({ results }) {
    // functionLog("RenderErrorsAndWarnings");
    // consoleLogObject('RenderErrorsAndWarnings results', results);
    return <>
        <small style={{ color: 'Gray' }}>{results.numSuppressedNotices ? " (" + results.numSuppressedNotices.toLocaleString() + " similar one" + (results.numSuppressedNotices === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderErrors results={results} />
        <RenderWarnings results={results} />
    </>;
}
export function RenderSuccessesErrorsWarnings({ results }) {
    // Not used internally here -- called from Demo check functions

    // functionLog("RenderSuccessesErrorsWarnings");

    // consoleLogObject('RenderSuccessesErrorsWarnings results', results);

    let haveErrorsOrWarnings = results.errorList.length || results.warningList.length;

    return <>
        <RenderSuccessesSummaryLine haveErrorsOrWarnings={haveErrorsOrWarnings} results={results} />
        <RenderSuccessesColored results={results} />
        {haveErrorsOrWarnings ? <RenderErrorsAndWarnings results={results} /> : ""}
    </>;
}


function RenderGivenArray({ color, array }) {
    // Display our array of objects in a nicer format
    //  priority (integer), message (string),
    //  plus possible optional fields:
    //      bookID, C, V,
    //      repoName, filename, lineNumber,
    //      characterIndex (integer), excerpt (string), location (descriptive string)
    //
    // Called from RenderSevere, RenderMedium, RenderLow
    //
    // functionLog("RenderGivenArray with ", arrayType);
    // consoleLogObject('RenderGivenArray results', results);

    return <ul>
        {array.map(function (listEntry, index) {
            // debugLog(`RenderGivenArray ${index} ${JSON.stringify(listEntry)}`);
            if (listEntry.location === undefined)
                debugLog(`RenderGivenArray: why is location undefined for ${JSON.stringify(listEntry)}`);
            else if (listEntry.location.indexOf(' HIDDEN') >= 0 && listEntry.hiddenNotices)
                // This is a "MORE SIMILAR ERRORS/WARNINGS/NOTICES SUPRESSED" message with other notices embedded
                //  so we allow it to be expanded using HTML5 "details" feature.
                return <li key={'RGA' + index}><details>
                    <summary><RenderOneEntry color={color} entry={listEntry} /></summary>
                    <RenderHiddenNotices color={color} suppressedNoticeList={listEntry.hiddenNotices} /></details></li>;
            // else (a regular message)
            return <li key={'RGA' + index}>
                <RenderOneEntry color={color} entry={listEntry} />
            </li>;
        })}
    </ul>;
}
function RenderSevere({ results }) {
    // functionLog("RenderSevere");
    // consoleLogObject('RenderSevere results', results);
    userLog(`RenderSevere displaying ${results.severeList.length.toLocaleString()} severe notice(s) with ${results.numHiddenSevere.toLocaleString()} hidden`);
    return <>
        <b style={{ color: results.severeList.length ? 'red' : 'green' }}>{results.severeList.length.toLocaleString()} severe error{results.severeList.length === 1 ? '' : 's'}</b>{results.severeList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numHiddenSevere ? " (" + results.numHiddenSevere.toLocaleString() + " similar one" + (results.numHiddenSevere === 1 ? '' : 's') + " hidden)" : ''}</small>
        <RenderGivenArray color='red' array={results.severeList} />
    </>;
}
function RenderMedium({ results }) {
    // functionLog("RenderMedium");
    // consoleLogObject('RenderSevere results', results);
    userLog(`RenderMedium displaying ${results.mediumList.length.toLocaleString()} medium notice(s) with ${results.numHiddenMedium.toLocaleString()} hidden`);
    return <>
        <b style={{ color: results.mediumList.length ? 'maroon' : 'green' }}>{results.mediumList.length.toLocaleString()} medium error{results.mediumList.length === 1 ? '' : 's'}</b>{results.mediumList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numHiddenMedium ? " (" + results.numHiddenMedium.toLocaleString() + " similar one" + (results.numHiddenMedium === 1 ? '' : 's') + " hidden)" : ''}</small>
        <RenderGivenArray color='maroon' array={results.mediumList} />
    </>;
}
function RenderLow({ results }) {
    // functionLog("RenderLow");
    // consoleLogObject('RenderLow results', results);
    userLog(`RenderLow displaying ${results.lowList.length.toLocaleString()} low notice(s) with ${results.numHiddenLow.toLocaleString()} hidden`);
    return <>
        <b style={{ color: results.lowList.length ? 'orange' : 'green' }}>{results.lowList.length.toLocaleString()} other warning{results.lowList.length === 1 ? '' : 's'}</b>{results.lowList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numHiddenLow ? " (" + results.numHiddenLow.toLocaleString() + " similar one" + (results.numHiddenLow === 1 ? '' : 's') + " hidden)" : ''}</small>
        <RenderGivenArray color='orange' array={results.lowList} />
    </>;
}
function RenderSevereMediumLow({ results }) {
    // functionLog("RenderSevereMediumLow");
    // consoleLogObject('RenderSevereMediumLow results', results);
    return <>
        <small style={{ color: 'Gray' }}>{results.numSuppressedNotices ? " (" + results.numSuppressedNotices.toLocaleString() + " similar one" + (results.numSuppressedNotices === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderSevere results={results} />
        <RenderMedium results={results} />
        <RenderLow results={results} />
    </>;
}
export function RenderSuccessesSevereMediumLow({ results }) {
    // Not used internally here -- called from Demo check functions

    // functionLog("RenderSuccessesSevereMediumLow");

    // consoleLogObject('RenderSuccessesSevereMediumLow results', results);

    const haveErrorsOrWarnings = results.severeList.length || results.mediumList.length || results.lowList.length;

    return <>
        <RenderSuccessesSummaryLine haveErrorsOrWarnings={haveErrorsOrWarnings} results={results} />
        <RenderSuccessesColored results={results} />
        {haveErrorsOrWarnings ? <RenderSevereMediumLow results={results} /> : ""}
    </>;
}


function getGradientcolor(priorityValue) {
    // priorityValue is in range 1..999
    //
    // Returns a color value from red (highest priority) to orange (lower)
    const red = `0${Math.floor(priorityValue * 255 / 999).toString(16)}`.slice(-2);
    // const green = `0${Math.floor((1000-priorityValue) * 55 / 999).toString(16)}`.slice(-2);
    // debugLog(`getGradientcolor(${priorityValue}) -> red='${red}' green='${green}'`)
    return `#${red}0000`; // or `#${red}${green}00`
}
function RenderNoticesGradient({ results }) {
    // Display our array of 8-part lists in a nicer format
    //  1/ priority number, 2/ bookID, 3/ C, 4/ V, 5/ message,
    //      6/ index (integer), 7/ excerpt (optional), 8/ location
    //
    // Expects results to contain:
    //      1/ warningList
    //
    // Called from RenderSuccessesNoticesGradient below
    //
    // functionLog(`RenderNoticesGradient with ${results.warningList}`);
    // consoleLogObject('RenderNoticesGradient results', results);

    return <ul>
        {results.warningList.map(function (listEntry, index) {
            // debugLog(`RenderNoticesGradient ${index} ${JSON.stringify(listEntry)}`);
            const thisColor = getGradientcolor(listEntry.priority);
            if (listEntry.location === undefined)
                debugLog(`RenderNoticesGradient: why is location undefined for ${JSON.stringify(listEntry)}`);
            else if (listEntry.location.indexOf(' HIDDEN') >= 0 && listEntry.hiddenNotices)
                // This is a "MORE SIMILAR ERRORS/WARNINGS/NOTICES SUPRESSED" message with other notices embedded
                //  so we allow it to be expanded using HTML5 "details" feature.
                return <li key={'RWG' + index}><details>
                    <summary><RenderOneEntry color={thisColor} entry={listEntry} /></summary>
                    <RenderHiddenNotices color={thisColor} suppressedNoticeList={listEntry.hiddenNotices} /></details></li>;
            // else (a regular message)
            return <li key={'RWG' + index}>
                <RenderOneEntry color={thisColor} entry={listEntry} />
            </li>;
        })}
    </ul>;
}
export function RenderSuccessesNoticesGradient({ results }) {
    // Not used internally here -- called from Demo check functions

    // functionLog(`RenderSuccessesNoticesGradient(${Object.keys(results)})`);

    // consoleLogObject('RenderSuccessesNoticesGradient results', results);

    let haveErrorsOrWarnings = results.warningList.length;

    userLog(`RenderSuccessesNoticesGradient displaying ${results.warningList.length.toLocaleString()} gradient notice(s) with ${results.numHiddenNotices.toLocaleString()} hidden`);
    return <>
        <RenderSuccessesSummaryLine haveErrorsOrWarnings={haveErrorsOrWarnings} results={results} />
        <RenderSuccessesColored results={results} />
        <RenderSuppressedCount suppressedCount={results.numSuppressedNotices} />
        <b style={{ color: results.warningList.length ? 'orange' : 'green' }}>{results.warningList.length.toLocaleString()} warning notice{results.warningList.length === 1 ? '' : 's'}</b>{results.warningList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numHiddenNotices ? " (" + results.numHiddenNotices.toLocaleString() + " similar one" + (results.numHiddenNotices === 1 ? '' : 's') + " hidden)" : ''}</small>
        {haveErrorsOrWarnings ? <RenderNoticesGradient results={results} /> : ""}
        <RenderCutoffCount cutoffCount={results.numCutoffNotices} cutoffLevel={results.processingOptions.cutoffPriorityLevel} />
    </>;
}
