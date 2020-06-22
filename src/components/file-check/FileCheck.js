import React, { useContext } from 'react';
// import PropTypes from 'prop-types';
// import ReactJson from 'react-json-view';
// import { Paper, Button } from '@material-ui/core';
import {
    RepositoryContext,
    FileContext,
} from 'gitea-react-toolkit';
// import checkMarkdownText, checkTN_TSVText, checkManifestText, checkPlainText from '../../core';
import checkUSFMText from '../../core/usfm-text-check.js';
import checkMarkdownText from '../../core/markdown-text-check.js';
import checkPlainText from '../../core/plain-text-check.js';
// import checkManifestText from '../../core/manifest-text-check.js';
import checkTN_TSVText from '../../core/table-text-check.js';
import processNotices from '../../core/notice-handling-functions.js';

const checkerVersionString = '0.0.4';

// function display_object(given_title, given_object) {
//     let output = given_title + ' object:\n';
//     // for (let property_name in given_object)
//     //     output += "  " + property_name + '\n';
//     for (let property_name in given_object) {
//         //try {
//         let this_property_contents = '' + given_object[property_name];
//         if (this_property_contents.length > 50)
//             this_property_contents = '(' + this_property_contents.length + ') ' + this_property_contents.substring(0, 50) + '…';
//         output += '  ' + property_name + ': ' + this_property_contents + '\n';
//         /*}
//         catch (e) {
//           console.log("Can't parse " + property_name);
//         }*/
//     }
//     console.log(output);
// }
// // end of display_object function


export function FileCheck(props) {
    const { state: repo, component: repoComponent } = useContext(RepositoryContext);
    const { state: file, component: fileComponent } = useContext(FileContext);

    console.log("I'm here in FileCheck v" + checkerVersionString);
    // display_object("props", props);
    // display_object("file", file);

    let givenLocation = props['location'];
    if (givenLocation && givenLocation[0] != ' ') givenLocation = ' ' + givenLocation;

    let returnedResult = (<>
        <b style={{ color: 'purple' }}>Loading…</b>
    </>);

    if (file) {
        /* Has fields: name, path, sha, type=file,
          size, encoding=base64, content,
          html_url, git_url, download_url,
          _links:object, branch, filepath. */
        // display_object("file", file);
        let preliminaryResult;
        const ourLocation = ' in ' + file.name + givenLocation;
        const checkingOptions = { 'extractLength': 25 };
        if (file.name.toLowerCase().endsWith('.tsv'))
            preliminaryResult = checkTN_TSVText(file.name, file.content, ourLocation, checkingOptions);
        else if (file.name.toLowerCase().endsWith('.usfm')) {
            const filenameMain = file.name.substring(0, file.name.length - 5);
            // console.log("Have USFM filenameMain=" + filenameMain);
            const BBB = filenameMain.substring(filenameMain.length - 3);
            console.log("Have USFM bookcode=" + BBB);
            preliminaryResult = checkUSFMText(BBB, file.content, ourLocation, checkingOptions);
        } else if (file.name.toLowerCase().endsWith('.md'))
            preliminaryResult = checkMarkdownText(file.name, file.content, ourLocation, checkingOptions);
        else if (file.name.toLowerCase().startsWith('manifest.'))
            resupreliminaryResultlt = checkManifestText(file.name, file.content, ourLocation, checkingOptions);
        else {
            // msg_html += "<p style=\"color:#538b01\">'<span style=\"font-style:italic\">" + file.name + "</span>' is not recognized, so ignored.</p>";
            msgLines += "Warning: '" + file.name + "' is not recognized, so treated as plain text.\n";
            preliminaryResult = checkPlainText(file.name, file.content, ourLocation, checkingOptions);
        }
        console.log("FileCheck got initial results with " + preliminaryResult.successList.length + " success messages and " + preliminaryResult.noticeList.length + " notices");
        // for (let j=0; j<preliminaryResult.noticeList.length; j++)
        //     console.log(j, preliminaryResult.noticeList[j][0], preliminaryResult.noticeList[j][1], preliminaryResult.noticeList[j][2], preliminaryResult.noticeList[j][3], preliminaryResult.noticeList[j][4]);

        // Now do our final handling of the result
        // const processOptions = { 'maximumSimilarMessages':3, 'errorPriorityLevel':800, 'sortBy':'ByPriority'};
        const result = processNotices(preliminaryResult); //, processOptions); // Also takes optional options
        console.log("FileCheck got processed results with " + result.successList.length + " success messages, " + result.errorList.length + " errors and " + result.warningList.length + " warnings");
        console.log("  numIgnoredNotices="+result.numIgnoredNotices, "numSuppressedErrors="+result.numSuppressedErrors, "numSuppressedWarnings="+result.numSuppressedWarnings);
        // for (let j=0; j<result.warningList.length; j++)
        //     console.log(j, result.warningList[j][0], result.warningList[j][1], result.warningList[j][2], result.warningList[j][3], result.warningList[j][4]);

        function RenderArray(props) {
            // Display our array of 4-part lists in a nicer format
            // Uses 'result' object from outer scope
            let myList;
            if (props.arrayType == 's')
                return (<ol>
                    {result.successList.map(function (listEntry) {
                        return <li key={listEntry.id}><b style={{ color: 'green' }}>{listEntry}</b></li>;
                    })}
                </ol>
                );
            else {
                const myList = props.arrayType == 'e' ? result.errorList : result.warningList;
                return (<ul>
                    {myList.map(function (listEntry) {
                        return <li key={listEntry.id}>
                            <b style={{ color: props.arrayType == 'e' ? 'red' : 'orange' }}>{listEntry[1]}</b>
                            {listEntry[2] > 0 ? " (at character " + (listEntry[2] + 1) + ")" : ""}
                            <span style={{color:'DimGray'}}>{listEntry[3] ? " in '" + listEntry[3] + "'" : ""}</span>
                            {listEntry[4]}
                            <small style={{color:'Gray'}}>{listEntry[0] >= 0 ? " (Priority " + listEntry[0] + ")" : ""}</small>
                        </li>;
                    })}
                </ul>
                );
            }
        }

        if (result.errorList.length || result.warningList.length)
            returnedResult = (<>
                <p>Checked <b>{file.name}</b>{result.numIgnoredNotices ? " (with a total of "+result.numIgnoredNotices.toLocaleString()+" notices ignored)":""}</p>
                <b style={{ color: result.errorList.length ? 'red' : 'green' }}>{result.errorList.length} error{result.errorList.length == 1 ? '' : 's'}</b>{result.errorList.length ? ':' : ''}
                <RenderArray arrayType='e' />
                <b style={{ color: result.warningList.length ? 'orange' : 'green' }}>{result.warningList.length} warning{result.warningList.length == 1 ? '' : 's'}</b>{result.warningList.length ? ':' : ''}
                <RenderArray arrayType='w' />
            </>);
        else // no errors
            returnedResult = (<>
                <p>Checked <b>{file.name}</b>{result.numIgnoredNotices ? " (with a total of "+result.numIgnoredNotices.toLocaleString()+" notices ignored)":""}</p>
                <b style={{ color: 'green' }}>{result.successList.length} check{result.successList.length == 1 ? '' : 's'} completed</b>{result.successList.length ? ':' : ''}
                <RenderArray arrayType='s' />
            </>);
    }
    else {
        console.log("No file yet");
        return returnedResult;
    }


    return (!repo && repoComponent) || (!file && fileComponent) || returnedResult;
};
// end of FileCheck()

export default FileCheck;
