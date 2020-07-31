import React from 'react';
import MaterialTable from 'material-table';
import { consoleLogObject } from '../core/utilities';


export function RenderLines(props) {
    return <ol>
        {props.text.split('\n').map(function (line) {
            return <li key={line.id}>{line}</li>;
        })}
    </ol>;
}


export function RenderSettings(props) {
    // console.log("In RenderSettings");
    // consoleLogObject('RenderSettings props', props);
    // consoleLogObject('RenderSettings settings', props.settings);
    return <>
        {
            Object.keys(props.settings).map((key, i) => (
                <p key={i}>&nbsp;&nbsp;&nbsp;&nbsp;
                    <span><b>{key}</b>: {props.settings[key]}</span>
                </p>
            ), [])}
    </>;
}


export function RenderRawNotices(props) {
    // This function is flexible enough to handle notice entries of different lengths:
    //      including BBB,C,V or not
    //      including extra at end or not

    // console.log("In RenderRawNotices");
    // consoleLogObject('RenderRawNotices props', props);

    let propertyList = [];
    for (const propertyName in props.results) {
        if (propertyName !== 'noticeList')
            propertyList.push(<p>{propertyName} = {props.results[propertyName]}</p>);
    }
    consoleLogObject('propertyList', propertyList);

    if (!props.results.noticeList.length)
        return <>
            {propertyList}
            <p>No notices were produced.</p>
        </>;

    // If we get here, we have notices.
    let formattedData = [];
    let haveExtras = false;
    props.results.noticeList.map(function (noticeEntry) {
        if (props.results.noticeList[0].length === 9) {
            formattedData.push({
                priority: noticeEntry[0], book: noticeEntry[1], chapter: noticeEntry[2], verse: noticeEntry[3],
                message: noticeEntry[4], index: noticeEntry[5], extract: noticeEntry[6], location: noticeEntry[7], extra: noticeEntry[8]
            });
            haveExtras = true;
        } else if (props.results.noticeList[0].length === 8) {
            formattedData.push({
                priority: noticeEntry[0], book: noticeEntry[1], chapter: noticeEntry[2], verse: noticeEntry[3],
                message: noticeEntry[4], index: noticeEntry[5], extract: noticeEntry[6], location: noticeEntry[7], extra: ""
            });
        } else if (props.results.noticeList[0].length === 6) {
            formattedData.push({
                priority: noticeEntry[0], book: "", chapter: "", verse: "",
                message: noticeEntry[1], index: noticeEntry[2], extract: noticeEntry[3], location: noticeEntry[4], extra: ""
            });
            haveExtras = true;
        } else if (props.results.noticeList[0].length === 5) {
            formattedData.push({
                priority: noticeEntry[0], book: "", chapter: "", verse: "",
                message: noticeEntry[1], index: noticeEntry[2], extract: noticeEntry[3], location: noticeEntry[4], extra: noticeEntry[5]
            });
        } else
            console.log(`ERROR: Unexpected notice entry length`);
    });

    let headerData = [
        { title: 'Priority', field: 'priority', type: 'numeric' },
        { title: 'Book', field: 'BBB' },
        { title: 'Chapter', field: 'C' },
        { title: 'Verse', field: 'V' },
        { title: 'Message', field: 'message' },
        { title: 'Index', field: 'index', type: 'numeric' },
        { title: 'Extract', field: 'extract' },
        { title: 'Location', field: 'location' }
    ];
    if (haveExtras) headerData.push({ title: 'Extra', field: 'extra' });

return <>
        {propertyList}
        <MaterialTable
            //icons={tableIcons}
            title='Raw Notices'
            columns={headerData}
            data={formattedData}
            options={{ fred: '' }}
        />
    </>;
}


function RenderBCV({BBB,C,V}) {
    // These are all optional parameters
    //  They may be blank if irrelevant
    if (!BBB && !C && !V) return '';
    let result;
    if (BBB.length) result = BBB;
    if (C.length) result = `${result}${result.length?' ':''}${C}`;
    if (V.length) result = `${result}${result.length?':':''}${V}`;
    if (result.length) return ` ${V.length? 'at':'in'} ${result}`;
    return '';
}

export function RenderProcessedArray(props) {
    // Display our array of 5-part lists in a nicer format
    //  1/ priority number, 2/ message, 3/ index (integer), 4/ extract (optional), 5/ location
    //
    // Expects props to contain:
    //      1/ results
    //      2/ arrayType
    // console.log("In RenderProcessedArray with ", props.arrayType);
    // consoleLogObject('RenderProcessedArray props', props);

    if (props.arrayType === 's')
        return <ul>
            {props.results.successList.map(function (listEntry) {
                return <li key={listEntry.id}>
                    <b style={{ color: props.results.errorList.length || props.results.warningList.length ? 'limegreen' : 'green' }}>{listEntry}</b>
                </li>;
            })}
        </ul>;
    else { // not 's' (successList)
        const myList = props.arrayType === 'e' ? props.results.errorList : props.results.warningList;
        return <ul>
            {myList.map(function (listEntry) {
                return <li key={listEntry.id}>
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
        <RenderProcessedArray results={props.results} arrayType='s' />
        {haveErrorsOrWarnings ? <RenderErrorsAndWarnings results={props.results} /> : ""}
    </>;
}
