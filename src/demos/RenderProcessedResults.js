import React from 'react';
// import { forwardRef } from 'react';

// NOTE: The following line is currently giving compile warnings -- a problem in a dependency it seems
import MaterialTable from 'material-table';

// import { consoleLogObject, displayPropertyNames } from '../core/utilities';


/*
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
  /* end material box imports and icons */


export function RenderLines({ text }) {
    /**
    * @description - Displays a given piece of text (which can include newline characters)
    * @param {String} text - text to render as numbered lines
    * @return {String} - rendered HTML for the numbered list of lines
    */
    return <ol>
        {text.split('\n').map(function (line, index) {
            return <li key={index}>{line}</li>;
        })}
    </ol>;
}


const MAX_ARRAY_ITEMS_TO_DISPLAY = 8; // Or do we want this as a parameter?
export function RenderObject({ thisObject, excludeList }) {
    /**
    * @description - Displays whatever is in the object
    * @param {Object} thisObject - object to render
    * @param {Array} excludeList - optional list of object property names to be ignored
    * @return {String} - rendered HTML for list of thisObject properties
    */
    // console.log("In RenderObject");
    // consoleLogObject('RenderObject settings', settings);
    return <ul>
        {
            Object.keys(thisObject).map((key, keyIndex) => {
                if (!excludeList || excludeList.indexOf(key) < 0) {
                    let displayObject = thisObject[key];
                    if (Array.isArray(displayObject) && displayObject.length > MAX_ARRAY_ITEMS_TO_DISPLAY)
                        displayObject = `(only first ${MAX_ARRAY_ITEMS_TO_DISPLAY} displayed here) ${JSON.stringify(displayObject.slice(0, MAX_ARRAY_ITEMS_TO_DISPLAY))}, etc…`;
                    return (
                        <li key={keyIndex}>&nbsp;&nbsp;&nbsp;&nbsp;
                            <span><b>{key}</b>{Array.isArray(thisObject[key]) ? ` (${thisObject[key].length.toLocaleString()}) ` : ''}: {typeof displayObject === 'object' ? JSON.stringify(displayObject) : displayObject}</span>
                        </li>
                    )
                }
                return null;
            }, [])}
    </ul>;
}


export function RenderRawResults({ results }) {
    /**
    * @description - Displays the raw noticeList in a table
    * @param {Object} results - object containing noticeList
    * @return {String} - rendered HTML for table of notices
    */
    // This function is flexible enough to handle notice objects:
    //      including bookID,C,V or not
    //      including repoName, filename, lineNumber or not
    //      including extra or not

    // console.log("In RenderRawResults");
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
    // console.log(`Got ${results.noticeList.length} notices`);

    // Discover what fields we have in our notice objects (in order to set our table headers below)
    const allPropertiesSet = new Set();
    let haveOBS = false, haveBible = false;
    // console.log( "allPropertiesSet-A", JSON.stringify([...allPropertiesSet]));
    for (const noticeEntry of results.noticeList)
        // console.log("noticeEntry", JSON.stringify(noticeEntry));
        // console.log(`Found (${Object.keys(noticeEntry).length}) ${Object.keys(noticeEntry)}`);
        for (const [noticePropertyName, noticePropertyValue] of Object.entries(noticeEntry))
            // console.log("  Found", noticePropertyName, "=", noticeEntry[noticePropertyName]);
            if (noticePropertyValue !== undefined) {
                allPropertiesSet.add(noticePropertyName);
                if (noticePropertyName === 'bookID' && noticePropertyValue) {
                    if (noticePropertyValue === 'OBS') haveOBS = true;
                    else haveBible = true;
                }
            }
    // console.log( "allPropertiesSet-Z", JSON.stringify([...allPropertiesSet]));

    // Adjust the headers according to the column sets that we actually have in the noticeList
    let headerData = [
        { title: 'Priority', field: 'priority', type: 'numeric' },
        { title: 'Message', field: 'message' },
    ];
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
    if (allPropertiesSet.has('lineNumber')) headerData = headerData.concat([{ title: 'Line', field: 'lineNumber' }]);
    if (allPropertiesSet.has('filename')) headerData = headerData.concat([{ title: 'Filename', field: 'filename' }]);
    if (allPropertiesSet.has('repoName')) headerData = headerData.concat([{ title: 'Repo', field: 'repoName' }]);
    if (allPropertiesSet.has('characterIndex')) headerData = headerData.concat([{ title: 'CharIndex', field: 'characterIndex' }]);
    if (allPropertiesSet.has('extract')) headerData = headerData.concat([{ title: 'Extract', field: 'extract' }]);
    if (allPropertiesSet.has('location')) headerData = headerData.concat([{ title: 'Location', field: 'location' }]);
    if (allPropertiesSet.has('extra')) headerData = headerData.concat([{ title: 'Extra', field: 'extra' }]);
    // console.log("headerData", headerData.length, JSON.stringify(headerData));

    // Make the actual table and return it
    return <>
        <b>Raw Results</b>:
        <RenderObject thisObject={results} />
        <MaterialTable
            // icons={tableIcons}
            title={`All ${results.noticeList.length.toLocaleString()} Raw Notices`}
            columns={headerData}
            data={results.noticeList}
            options={{ sorting: true, exportButton: true, exportAllData: true }}
        />
    </>;
}


export function RenderBCV({ bookID, C, V }) {
    /**
    * @description - Displays the bookcode and chapter/verse details if specified
    * @param {String} bookID - (optional) 3-character UPPERCASE USFM bookcode or 'OBS'.
    * @param {String} C - (optional) chapter info
    * @param {String} V - (optional) verse info
    * @return {String} - rendered HTML for the given reference
    */
    // These are all optional parameters - they may be undefined or blank if irrelevant
    // console.log(`RenderBCV(${bookID}, ${C}, ${V})`);
    if (!bookID && !C && !V) return null; // They're all undefined or blank!
    // console.log(`RenderBCV2 ${bookID}, ${C}, ${V}`);
    let result;
    if (bookID && bookID.length) result = bookID;
    if (C && C.length) result = `${result}${result.length ? ' ' : ''}${C}`;
    if (V && V.length) result = `${result}${result.length ? ':' : ''}${V}`;
    if (result.length) return ` ${V && V.length ? 'at' : 'in'} ${result}`;
    return null;
}

export function RenderFileDetails({ repoName, filename, lineNumber }) {
    /**
    * @description - Displays the repoName and filename/lineNumber details if specified
    * @param {String} repoName - (optional) repo name string
    * @param {String} filename - (optional) filename string
    * @param {String} lineNumber - (optional) line number integer (1-based)
    * @return {String} - rendered HTML for the given reference
    */
    // These are all optional parameters - they may be undefined or blank if irrelevant
    // console.log(`RenderFileDetails(${repoName}, ${filename}, ${lineNumber})`);
    if (!repoName && !filename && !lineNumber) return null; // They're all undefined or blank!
    // console.log(`RenderFileDetails2 ${repoName}, ${filename}, ${lineNumber}`);
    let result = '';
    if (repoName && repoName.length) result += ` in ${repoName} repository`;
    if (filename && filename.length) result += ` in ${filename}`;
    if (lineNumber) result += ` on line ${lineNumber.toLocaleString()}`;
    return result;
}

export function RenderSuccessesColoured({ results }) {
    // Display our array of success message strings in a nicer format
    //
    // Expects results to contain:
    //      1/ successList
    // console.log("In RenderSuccessesColoured with ", successList);
    // consoleLogObject('RenderSuccessesColoured results', results);

    let haveWarnings;
    try { haveWarnings = results.errorList.length || results.warningList.length; }
    catch (e1) {
        try { haveWarnings = results.severeList.length || results.mediumList.length || results.lowList.length; }
        catch (e2) { haveWarnings = results.warningList.length; }
    }

    return <ul>
        {results.successList.map(function (listEntry, index) {
            return <li key={index}>
                <b style={{ color: haveWarnings ? 'limegreen' : 'green' }}>{listEntry}</b>
            </li>;
        })}
    </ul>;
}

export function RenderProcessedArray({ arrayType, results }) {
    // Display our array of objects in a nicer format
    //  priority (integer), message (string)
    //  plus optional fields:
    //      bookID, C, V, repoName, filename, lineNumber
    //      characterIindex (integer), extract (string), location (string)
    //
    // console.log("In RenderProcessedArray with ", arrayType);
    // consoleLogObject('RenderProcessedArray results', results);

    if (arrayType === 's')
        return <>
            <RenderSuccessesColoured results={results} />
        </>;
    else { // not 's' (successList)
        const myList = arrayType === 'e' ? results.errorList : results.warningList;
        return <ul>
            {myList.map(function (listEntry, index) {
                return <li key={index}>
                    <b style={{ color: arrayType === 'e' ? 'red' : 'orange' }}>{listEntry.message}</b>
                    <RenderBCV bookID={listEntry.bookID} C={listEntry.C} V={listEntry.V} />
                    <RenderFileDetails repoName={listEntry.repoName} filename={listEntry.filename} lineNumber={listEntry.lineNumber} />
                    {listEntry.characterIndex > 0 ? " (at character " + (listEntry.characterIndex + 1) + ")" : ""}
                    <span style={{ color: 'DimGray' }}>{listEntry.extract ? " around '" + listEntry.extract + "'" : ""}</span>
                    {listEntry.location}
                    <small style={{ color: 'Gray' }}>{listEntry.priority >= 0 ? " (Priority " + listEntry.priority + ")" : ""}</small>
                </li>;
            })}
        </ul>;
    }
}


export function RenderGivenArray({ array, colour }) {
    // Display our array of objects in a nicer format
    //  priority (integer), message (string),
    //  plus possible optional fields:
    //      bookID, C, V,
    //      repoName, filename, lineNumber,
    //      characterIndex (integer), extract (string), location (descriptive string)
    //
    // console.log("In RenderGivenArray with ", arrayType);
    // consoleLogObject('RenderGivenArray results', results);

    return <ul>
        {array.map(function (listEntry, index) {
            return <li key={index}>
                <b style={{ color: colour }}>{listEntry.message}</b>
                <RenderBCV bookID={listEntry.bookID} C={listEntry.C} V={listEntry.V} />
                <RenderFileDetails repoName={listEntry.repoName} filename={listEntry.filename} lineNumber={listEntry.lineNumber} />
                {listEntry.characterIndex !== undefined && listEntry.characterIndex >= 0 ? " (at character " + (listEntry.characterIndex + 1) + " of line)" : ""}
                <span style={{ color: 'DimGray' }}>{listEntry.extract ? " around '" + listEntry.extract + "'" : ""}</span>
                {listEntry.location}
                <small style={{ color: 'Gray' }}>{listEntry.priority >= 0 ? " (Priority " + listEntry.priority + ")" : ""}</small>
            </li>;
        })}
    </ul>;
}


export function getGradientColour(priorityValue) {
    // priorityValue is in range 1..999
    //
    // Returns a colour value from red (highest priority) to orange (lower)
    const red = `0${Math.floor(priorityValue * 255 / 999).toString(16)}`.slice(-2);
    // const green = `0${Math.floor((1000-priorityValue) * 55 / 999).toString(16)}`.slice(-2);
    // console.log(`getGradientColour(${priorityValue}) -> red='${red}' green='${green}'`)
    return `#${red}0000`; // or `#${red}${green}00`
}


export function RenderWarningsGradient({ results }) {
    // Display our array of 8-part lists in a nicer format
    //  1/ priority number, 2/ bookID, 3/ C, 4/ V, 5/ message,
    //      6/ index (integer), 7/ extract (optional), 8/ location
    //
    // Expects results to contain:
    //      1/ warningList
    // console.log("In RenderWarningsGradient with ", results.warningList);
    // consoleLogObject('RenderWarningsGradient results', results);

    return <ul>
        {results.warningList.map(function (listEntry, index) {
            const thisColour = getGradientColour(listEntry.priority);
            return <li key={index}>
                <b style={{ color: thisColour }}>{listEntry.message}</b>
                <RenderBCV bookID={listEntry.bookID} C={listEntry.C} V={listEntry.V} />
                <RenderFileDetails repoName={listEntry.repoName} filename={listEntry.filename} lineNumber={listEntry.lineNumber} />
                {listEntry.characterIndex !== undefined && listEntry.characterIndex >= 0 ? " (at character " + (listEntry.characterIndex + 1) + " of line)" : ""}
                <span style={{ color: 'DimGray' }}>{listEntry.extract ? " around '" + listEntry.extract + "'" : ""}</span>
                {listEntry.location}
                <small style={{ color: 'Gray' }}>{listEntry.priority >= 0 ? " (Priority " + listEntry.priority + ")" : ""}</small>
            </li>;
        })}
    </ul>;
}


export function RenderErrors({ results }) {
    // console.log("In RenderErrors");
    // consoleLogObject('RenderErrors results', results);
    return <>
        <b style={{ color: results.errorList.length ? 'red' : 'green' }}>{results.errorList.length.toLocaleString()} error{results.errorList.length === 1 ? '' : 's'}</b>{results.errorList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numSuppressedErrors ? " (" + results.numSuppressedErrors.toLocaleString() + " similar one" + (results.numSuppressedErrors === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderProcessedArray results={results} arrayType='e' />
    </>;
}
export function RenderWarnings({ results }) {
    // console.log("In RenderWarnings");
    // consoleLogObject('RenderWarnings results', results);
    return <>
        <b style={{ color: results.warningList.length ? 'orange' : 'green' }}>{results.warningList.length.toLocaleString()} warning{results.warningList.length === 1 ? '' : 's'}</b>{results.warningList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numSuppressedWarnings ? " (" + results.numSuppressedWarnings.toLocaleString() + " similar one" + (results.numSuppressedWarnings === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderProcessedArray results={results} arrayType='w' />
    </>;
}
export function RenderErrorsAndWarnings({ results }) {
    // console.log("In RenderErrorsAndWarnings");
    // consoleLogObject('RenderErrorsAndWarnings results', results);
    return <>
        <RenderErrors results={results} />
        <RenderWarnings results={results} />
    </>;
}


export function RenderSevere({ results }) {
    // console.log("In RenderSevere");
    // consoleLogObject('RenderSevere results', results);
    return <>
        <b style={{ color: results.severeList.length ? 'red' : 'green' }}>{results.severeList.length.toLocaleString()} severe error{results.severeList.length === 1 ? '' : 's'}</b>{results.severeList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numSevereSuppressed ? " (" + results.numSevereSuppressed.toLocaleString() + " similar one" + (results.numSevereSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={results.severeList} colour='red' />
    </>;
}
export function RenderMedium({ results }) {
    // console.log("In RenderSevere");
    // consoleLogObject('RenderSevere results', results);
    return <>
        <b style={{ color: results.mediumList.length ? 'maroon' : 'green' }}>{results.mediumList.length.toLocaleString()} medium error{results.mediumList.length === 1 ? '' : 's'}</b>{results.mediumList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numMediumSuppressed ? " (" + results.numMediumSuppressed.toLocaleString() + " similar one" + (results.numMediumSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={results.mediumList} colour='maroon' />
    </>;
}
export function RenderLow({ results }) {
    // console.log("In RenderLow");
    // consoleLogObject('RenderLow results', results);
    return <>
        <b style={{ color: results.lowList.length ? 'orange' : 'green' }}>{results.lowList.length.toLocaleString()} other warning{results.lowList.length === 1 ? '' : 's'}</b>{results.lowList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numLowSuppressed ? " (" + results.numLowSuppressed.toLocaleString() + " similar one" + (results.numLowSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={results.lowList} colour='orange' />
    </>;
}
export function RenderSevereMediumLow({ results }) {
    // console.log("In RenderSevereMediumLow");
    // consoleLogObject('RenderSevereMediumLow results', results);
    return <>
        <RenderSevere results={results} />
        <RenderMedium results={results} />
        <RenderLow results={results} />
    </>;
}


export function RenderSuccessesErrorsWarnings({ results }) {
    // console.log("In RenderSuccessesErrorsWarnings");

    // consoleLogObject('RenderSuccessesErrorsWarnings results', results);

    const haveErrorsOrWarnings = results.errorList.length || results.warningList.length;

    let successCount;
    if (results.successList.length === 1) successCount = 'One';
    else if (results.successList.length === 2) successCount = 'Two';
    else if (results.successList.length === 3) successCount = 'Three';
    else if (results.successList.length === 4) successCount = 'Four';
    else if (results.successList.length === 5) successCount = 'Five';
    else successCount = results.successList.length.toLocaleString();

    return <>
        <b style={{ color: haveErrorsOrWarnings ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{results.successList.length === 1 ? '' : 's'} completed</b>{results.successList.length ? ':' : ''}
        <RenderSuccessesColoured results={results} />
        {haveErrorsOrWarnings ? <RenderErrorsAndWarnings results={results} /> : ""}
    </>;
}


export function RenderSuccessesSevereMediumLow({ results }) {
    // console.log("In RenderSuccessesSevereMediumLow");

    // consoleLogObject('RenderSuccessesSevereMediumLow results', results);

    const haveErrorsOrWarnings = results.severeList.length || results.mediumList.length || results.lowList.length;

    let successCount;
    if (results.successList.length === 1) successCount = 'One';
    else if (results.successList.length === 2) successCount = 'Two';
    else if (results.successList.length === 3) successCount = 'Three';
    else if (results.successList.length === 4) successCount = 'Four';
    else if (results.successList.length === 5) successCount = 'Five';
    else successCount = results.successList.length.toLocaleString();

    return <>
        <b style={{ color: haveErrorsOrWarnings ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{results.successList.length === 1 ? '' : 's'} completed</b>{results.successList.length ? ':' : ''}
        <RenderSuccessesColoured results={results} />
        {haveErrorsOrWarnings ? <RenderSevereMediumLow results={results} /> : ""}
    </>;
}

export function RenderSuccessesWarningsGradient({ results }) {
    // console.log("In RenderSuccessesWarningsGradient");

    // consoleLogObject('RenderSuccessesWarningsGradient results', results);

    let successCount;
    if (results.successList.length === 1) successCount = 'One';
    else if (results.successList.length === 2) successCount = 'Two';
    else if (results.successList.length === 3) successCount = 'Three';
    else if (results.successList.length === 4) successCount = 'Four';
    else if (results.successList.length === 5) successCount = 'Five';
    else successCount = results.successList.length.toLocaleString();

    return <>
        <b style={{ color: results.warningList.length ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{results.successList.length === 1 ? '' : 's'} completed</b>{results.successList.length ? ':' : ''}
        <RenderSuccessesColoured results={results} />
        <b style={{ color: results.warningList.length ? 'orange' : 'green' }}>{results.warningList.length.toLocaleString()} warning notice{results.warningList.length === 1 ? '' : 's'}</b>{results.warningList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numSuppressedWarnings ? " (" + results.numSuppressedWarnings.toLocaleString() + " similar one" + (results.numSuppressedWarnings === 1 ? '' : 's') + " suppressed)" : ''}</small>
        {results.warningList.length ? <RenderWarningsGradient results={results} /> : ""}
    </>;
}


export function RenderElapsedTime({ elapsedSeconds }) {
    const seconds = Math.round(elapsedSeconds % 60);
    let remainingTime = Math.floor(elapsedSeconds / 60);
    const minutes = Math.round(remainingTime % 60);
    remainingTime = Math.floor(remainingTime / 60);
    const hours = Math.round(remainingTime % 24);
    remainingTime = Math.floor(remainingTime / 24);
    console.assert(remainingTime === 0, `Elapsed time also contains ${remainingTime} days`);
    return <>{hours ? `${hours} hour` : ''}{hours && hours !== 1 ? 's' : ''}{hours ? ', ' : ''}{minutes ? `${minutes} minute` : ''}{minutes && minutes !== 1 ? 's' : ''}{minutes ? ', ' : ''}{seconds} second{seconds === 1 ? '' : 's'}</>;
}
