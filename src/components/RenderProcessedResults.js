import React from 'react';
import MaterialTable from 'material-table';
// import { consoleLogObject } from '../core/utilities';


export function RenderLines(props) {
    return <ol>
        {props.text.split('\n').map(function (line, index) {
            return <li key={index}>{line}</li>;
        })}
    </ol>;
}


export function RenderSettings(props) {
    // console.log("In RenderSettings");
    // consoleLogObject('RenderSettings props', props);
    // consoleLogObject('RenderSettings settings', props.settings);
    return <ul>
        {
            Object.keys(props.settings).map((key, index) => (
                <li key={index}>&nbsp;&nbsp;&nbsp;&nbsp;
                    <span><b>{key}</b>:
                    {typeof props.settings[key] === 'object' ? JSON.stringify(props.settings[key]) : props.settings[key]}</span>
                </li>
            ), [])}
    </ul>;
}


export function RenderRawResults(props) {
    // This function is flexible enough to handle notice entries of different lengths:
    //      including BBB,C,V or not
    //      including extra at end or not

    // console.log("In RenderRawResults");
    // consoleLogObject('RenderRawResults props', props);

    // Create a list of other property names
    let propertyList = [], newObject = {};
    for (const propertyName in props.results)
        if (propertyName !== 'noticeList') {
            newObject[propertyName] = props.results[propertyName];
            propertyList.push(<p>{propertyName} = {props.results[propertyName]}</p>);
        }
    // consoleLogObject('propertyList', propertyList);

    if (!props.results.noticeList || !props.results.noticeList.length)
        return <>
            <p><b>No notices were produced</b>:</p>
            <RenderSettings settings={props.results} />
        </>;

    // If we get here, we have notices.
    let formattedData = [];
    let haveBCV = false, haveExtras = false;
    props.results.noticeList.map(function (noticeEntry) {
        // console.log(`Render (${noticeEntry.length}) ${noticeEntry}`);
        if (noticeEntry.length === 9) {
            console.assert(noticeEntry[1].length || noticeEntry[2].length || noticeEntry[3].length, `Why have (${noticeEntry.length}) ${noticeEntry}`);
            formattedData.push({
                priority: noticeEntry[0], book: noticeEntry[1], chapter: noticeEntry[2], verse: noticeEntry[3],
                message: noticeEntry[4], index: noticeEntry[5], extract: noticeEntry[6], location: noticeEntry[7], extra: noticeEntry[8]
            });
            haveBCV = true;
            haveExtras = true;
        } else if (noticeEntry.length === 8) {
            console.assert(noticeEntry[1].length || noticeEntry[2].length || noticeEntry[3].length, `Why have (${noticeEntry.length}) ${noticeEntry}`);
            formattedData.push({
                priority: noticeEntry[0], book: noticeEntry[1], chapter: noticeEntry[2], verse: noticeEntry[3],
                message: noticeEntry[4], index: noticeEntry[5], extract: noticeEntry[6], location: noticeEntry[7], extra: ""
            });
            haveBCV = true;
        } else if (noticeEntry.length === 6) {
            formattedData.push({
                priority: noticeEntry[0], book: "", chapter: "", verse: "",
                message: noticeEntry[1], index: noticeEntry[2], extract: noticeEntry[3], location: noticeEntry[4], extra: ""
            });
            haveExtras = true;
        } else if (noticeEntry.length === 5) {
            formattedData.push({
                priority: noticeEntry[0], book: "", chapter: "", verse: "",
                message: noticeEntry[1], index: noticeEntry[2], extract: noticeEntry[3], location: noticeEntry[4], extra: noticeEntry[5]
            });
        } else
            console.log(`ERROR: RenderRawResults: Unexpected notice entry length of ${noticeEntry.length}`);
    });

    // Adjust the headers according to the column sets that we actually have
    let headerData = [{ title: 'Priority', field: 'priority', type: 'numeric' }];
    if (haveBCV)
        headerData = headerData.concat([
            { title: 'Book', field: 'book' },
            { title: 'Chapter', field: 'chapter' },
            { title: 'Verse', field: 'verse' }
        ]);
    headerData = headerData.concat([
        { title: 'Message', field: 'message' },
        { title: 'Index', field: 'index', type: 'numeric' },
        { title: 'Extract', field: 'extract' },
        { title: 'Location', field: 'location' }
    ]);
    if (haveExtras) headerData.push({ title: 'Extra', field: 'extra' });

    // Make the actual table and return it
    return <>
        <b>Raw Results</b>:
        <RenderSettings settings={newObject} />
        <MaterialTable
            //icons={tableIcons}
            title='Raw Notices'
            columns={headerData}
            data={formattedData}
            options={{ fredXXX: '' }}
        />
    </>;
}


function RenderBCV({ BBB, C, V }) {
    // These are all optional parameters
    //  They may be blank if irrelevant
    if (!BBB && !C && !V) return '';
    let result;
    if (BBB.length) result = BBB;
    if (C.length) result = `${result}${result.length ? ' ' : ''}${C}`;
    if (V.length) result = `${result}${result.length ? ':' : ''}${V}`;
    if (result.length) return ` ${V.length ? 'at' : 'in'} ${result}`;
    return '';
}


function RenderSuccessesColoured(props) {
    // Display our array of success message strings in a nicer format
    //
    // Expects props to contain:
    //      1/ successList
    // console.log("In RenderSuccessesColoured with ", props.successList);
    // consoleLogObject('RenderSuccessesColoured props', props);

    let haveWarnings;
    try { haveWarnings = props.results.errorList.length || props.results.warningList.length; }
    catch (e1) {
        try { haveWarnings = props.results.severeList.length || props.results.mediumList.length || props.results.lowList.length; }
        catch (e2) { haveWarnings = props.results.warningList.length; }
    }

    return <ul>
        {props.results.successList.map(function (listEntry, index) {
            return <li key={index}>
                <b style={{ color: haveWarnings ? 'limegreen' : 'green' }}>{listEntry}</b>
            </li>;
        })}
    </ul>;
}

export function RenderProcessedArray(props) {
    // Display our array of 8-part lists in a nicer format
    //  1/ priority number, 2/ BBB, 3/ C, 4/ V, 5/ message,
    //      6/ index (integer), 7/ extract (optional), 8/ location
    //
    // Expects props to contain:
    //      1/ results
    //      2/ arrayType (letter)
    // console.log("In RenderProcessedArray with ", props.arrayType);
    // consoleLogObject('RenderProcessedArray props', props);

    if (props.arrayType === 's')
        return <>
            <RenderSuccessesColoured results={props.results} />
        </>;
    else { // not 's' (successList)
        const myList = props.arrayType === 'e' ? props.results.errorList : props.results.warningList;
        return <ul>
            {myList.map(function (listEntry, index) {
                return <li key={index}>
                    <b style={{ color: props.arrayType === 'e' ? 'red' : 'orange' }}>{listEntry[4]}</b>
                    <RenderBCV BBB={listEntry[1]} C={listEntry[2]} V={listEntry[3]} />
                    {listEntry[5] > 0 ? " (at character " + (listEntry[5] + 1) + " of line)" : ""}
                    <span style={{ color: 'DimGray' }}>{listEntry[6] ? " around '" + listEntry[6] + "'" : ""}</span>
                    {listEntry[7]}
                    <small style={{ color: 'Gray' }}>{listEntry[0] >= 0 ? " (Priority " + listEntry[0] + ")" : ""}</small>
                </li>;
            })}
        </ul>;
    }
}


export function RenderGivenArray(props) {
    // Display our array of 8-part lists in a nicer format
    //  1/ priority number, 2/ BBB, 3/ C, 4/ V, 5/ message,
    //      6/ index (integer), 7/ extract (optional), 8/ location
    //
    // Expects props to contain:
    //      1/ array
    //      2/ colour
    // console.log("In RenderGivenArray with ", props.arrayType);
    // consoleLogObject('RenderGivenArray props', props);

    return <ul>
        {props.array.map(function (listEntry, index) {
            return <li key={index}>
                <b style={{ color: props.colour }}>{listEntry[4]}</b>
                <RenderBCV BBB={listEntry[1]} C={listEntry[2]} V={listEntry[3]} />
                {listEntry[5] > 0 ? " (at character " + (listEntry[5] + 1) + " of line)" : ""}
                <span style={{ color: 'DimGray' }}>{listEntry[6] ? " around '" + listEntry[6] + "'" : ""}</span>
                {listEntry[7]}
                <small style={{ color: 'Gray' }}>{listEntry[0] >= 0 ? " (Priority " + listEntry[0] + ")" : ""}</small>
            </li>;
        })}
    </ul>;
}


function getGradientColour(priorityValue) {
    // priorityValue is in range 1..999
    //
    // Returns a colour value from red (highest priority) to orange (lower)
    const red = `0${Math.floor(priorityValue * 255 / 999).toString(16)}`.slice(-2);
    // const green = `0${Math.floor((1000-priorityValue) * 55 / 999).toString(16)}`.slice(-2);
    // console.log(`getGradientColour(${priorityValue}) -> red='${red}' green='${green}'`)
    return `#${red}0000`; // or `#${red}${green}00`
}


function RenderWarningsGradient(props) {
    // Display our array of 8-part lists in a nicer format
    //  1/ priority number, 2/ BBB, 3/ C, 4/ V, 5/ message,
    //      6/ index (integer), 7/ extract (optional), 8/ location
    //
    // Expects props to contain:
    //      1/ results.warningList
    // console.log("In RenderWarningsGradient with ", props.warningList);
    // consoleLogObject('RenderWarningsGradient props', props);

    return <ul>
        {props.results.warningList.map(function (listEntry, index) {
            const thisColour = getGradientColour(listEntry[0]);
            return <li key={index}>
                <b style={{ color: thisColour }}>{listEntry[4]}</b>
                <RenderBCV BBB={listEntry[1]} C={listEntry[2]} V={listEntry[3]} />
                {listEntry[5] > 0 ? " (at character " + (listEntry[5] + 1) + " of line)" : ""}
                <span style={{ color: 'DimGray' }}>{listEntry[6] ? " around '" + listEntry[6] + "'" : ""}</span>
                {listEntry[7]}
                <small style={{ color: 'Gray' }}>{listEntry[0] >= 0 ? " (Priority " + listEntry[0] + ")" : ""}</small>
            </li>;
        })}
    </ul>;
}


export function RenderErrors(props) {
    // console.log("In RenderErrors");
    // consoleLogObject('RenderErrors props', props);
    return <>
        <b style={{ color: props.results.errorList.length ? 'red' : 'green' }}>{props.results.errorList.length.toLocaleString()} error{props.results.errorList.length === 1 ? '' : 's'}</b>{props.results.errorList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{props.results.numSuppressedErrors ? " (" + props.results.numSuppressedErrors.toLocaleString() + " similar one" + (props.results.numSuppressedErrors === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderProcessedArray results={props.results} arrayType='e' />
    </>;
}
export function RenderWarnings(props) {
    // console.log("In RenderWarnings");
    // consoleLogObject('RenderWarnings props', props);
    return <>
        <b style={{ color: props.results.warningList.length ? 'orange' : 'green' }}>{props.results.warningList.length.toLocaleString()} warning{props.results.warningList.length === 1 ? '' : 's'}</b>{props.results.warningList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{props.results.numSuppressedWarnings ? " (" + props.results.numSuppressedWarnings.toLocaleString() + " similar one" + (props.results.numSuppressedWarnings === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderProcessedArray results={props.results} arrayType='w' />
    </>;
}
export function RenderErrorsAndWarnings(props) {
    // console.log("In RenderErrorsAndWarnings");
    // consoleLogObject('RenderErrorsAndWarnings props', props);
    return <>
        <RenderErrors results={props.results} />
        <RenderWarnings results={props.results} />
    </>;
}


export function RenderSevere(props) {
    // console.log("In RenderSevere");
    // consoleLogObject('RenderSevere props', props);
    return <>
        <b style={{ color: props.results.severeList.length ? 'red' : 'green' }}>{props.results.severeList.length.toLocaleString()} severe error{props.results.severeList.length === 1 ? '' : 's'}</b>{props.results.severeList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{props.results.numSevereSuppressed ? " (" + props.results.numSevereSuppressed.toLocaleString() + " similar one" + (props.results.numSevereSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={props.results.severeList} colour='red' />
    </>;
}
export function RenderMedium(props) {
    // console.log("In RenderSevere");
    // consoleLogObject('RenderSevere props', props);
    return <>
        <b style={{ color: props.results.mediumList.length ? 'maroon' : 'green' }}>{props.results.mediumList.length.toLocaleString()} medium error{props.results.mediumList.length === 1 ? '' : 's'}</b>{props.results.mediumList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{props.results.numMediumSuppressed ? " (" + props.results.numMediumSuppressed.toLocaleString() + " similar one" + (props.results.numMediumSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={props.results.mediumList} colour='maroon' />
    </>;
}
export function RenderLow(props) {
    // console.log("In RenderLow");
    // consoleLogObject('RenderLow props', props);
    return <>
        <b style={{ color: props.results.lowList.length ? 'orange' : 'green' }}>{props.results.lowList.length.toLocaleString()} other warning{props.results.lowList.length === 1 ? '' : 's'}</b>{props.results.lowList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{props.results.numLowSuppressed ? " (" + props.results.numLowSuppressed.toLocaleString() + " similar one" + (props.results.numLowSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={props.results.lowList} colour='orange' />
    </>;
}
export function RenderSevereMediumLow(props) {
    // console.log("In RenderSevereMediumLow");
    // consoleLogObject('RenderSevereMediumLow props', props);
    return <>
        <RenderSevere results={props.results} />
        <RenderMedium results={props.results} />
        <RenderLow results={props.results} />
    </>;
}


export function RenderSuccessesErrorsWarnings(props) {
    // console.log("In RenderSuccessesErrorsWarnings");

    // consoleLogObject('RenderSuccessesErrorsWarnings props', props);

    const haveErrorsOrWarnings = props.results.errorList.length || props.results.warningList.length;

    let successCount;
    if (props.results.successList.length === 1) successCount = 'One';
    else if (props.results.successList.length === 2) successCount = 'Two';
    else if (props.results.successList.length === 3) successCount = 'Three';
    else if (props.results.successList.length === 4) successCount = 'Four';
    else if (props.results.successList.length === 5) successCount = 'Five';
    else successCount = props.results.successList.length.toLocaleString();

    return <>
        <b style={{ color: haveErrorsOrWarnings ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{props.results.successList.length === 1 ? '' : 's'} completed</b>{props.results.successList.length ? ':' : ''}
        <RenderSuccessesColoured results={props.results} />
        {haveErrorsOrWarnings ? <RenderErrorsAndWarnings results={props.results} /> : ""}
    </>;
}


export function RenderSuccessesSevereMediumLow(props) {
    // console.log("In RenderSuccessesSevereMediumLow");

    // consoleLogObject('RenderSuccessesSevereMediumLow props', props);

    const haveErrorsOrWarnings = props.results.severeList.length || props.results.mediumList.length || props.results.lowList.length;

    let successCount;
    if (props.results.successList.length === 1) successCount = 'One';
    else if (props.results.successList.length === 2) successCount = 'Two';
    else if (props.results.successList.length === 3) successCount = 'Three';
    else if (props.results.successList.length === 4) successCount = 'Four';
    else if (props.results.successList.length === 5) successCount = 'Five';
    else successCount = props.results.successList.length.toLocaleString();

    return <>
        <b style={{ color: haveErrorsOrWarnings ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{props.results.successList.length === 1 ? '' : 's'} completed</b>{props.results.successList.length ? ':' : ''}
        <RenderSuccessesColoured results={props.results} />
        {haveErrorsOrWarnings ? <RenderSevereMediumLow results={props.results} /> : ""}
    </>;
}

export function RenderSuccessesWarningsGradient(props) {
    // console.log("In RenderSuccessesWarningsGradient");

    // consoleLogObject('RenderSuccessesWarningsGradient props', props);

    let successCount;
    if (props.results.successList.length === 1) successCount = 'One';
    else if (props.results.successList.length === 2) successCount = 'Two';
    else if (props.results.successList.length === 3) successCount = 'Three';
    else if (props.results.successList.length === 4) successCount = 'Four';
    else if (props.results.successList.length === 5) successCount = 'Five';
    else successCount = props.results.successList.length.toLocaleString();

    return <>
        <b style={{ color: props.results.warningList.length ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{props.results.successList.length === 1 ? '' : 's'} completed</b>{props.results.successList.length ? ':' : ''}
        <RenderSuccessesColoured results={props.results} />
        <b style={{ color: props.results.warningList.length ? 'orange' : 'green' }}>{props.results.warningList.length.toLocaleString()} warning notice{props.results.warningList.length === 1 ? '' : 's'}</b>{props.results.warningList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{props.results.numSuppressedWarnings ? " (" + props.results.numSuppressedWarnings.toLocaleString() + " similar one" + (props.results.numSuppressedWarnings === 1 ? '' : 's') + " suppressed)" : ''}</small>
        {props.results.warningList.length ? <RenderWarningsGradient results={props.results} /> : ""}
    </>;
}


export function RenderElapsedTime(props) {
    const seconds = Math.round(props.elapsedTime % 60);
    let remainingTime = Math.floor(props.elapsedTime / 60);
    const minutes = Math.round(remainingTime % 60);
    remainingTime = Math.floor(remainingTime / 60);
    const hours = Math.round(remainingTime % 24);
    remainingTime = Math.floor(remainingTime / 24);
    console.assert(remainingTime === 0, `Elapsed time also contains ${remainingTime} days`);
return <>{hours? `${hours} hour`:''}{hours && hours!==1?'s':''}{hours?', ':''}{minutes? `${minutes} minute`:''}{minutes && minutes!==1?'s':''}{minutes?', ':''}{seconds} second{seconds===1?'':'s'}</>;
}
