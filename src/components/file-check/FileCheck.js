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


const checkerVersionString = '0.0.4';

function display_object(given_title, given_object) {
    let output = given_title + ' object:\n';
    // for (let property_name in given_object)
    //     output += "  " + property_name + '\n';
    for (let property_name in given_object) {
        //try {
        let this_property_contents = '' + given_object[property_name];
        if (this_property_contents.length > 50)
            this_property_contents = '(' + this_property_contents.length + ') ' + this_property_contents.substring(0, 50) + '…';
        output += '  ' + property_name + ': ' + this_property_contents + '\n';
        /*}
        catch (e) {
          console.log("Can't parse " + property_name);
        }*/
    }
    console.log(output);
}
// end of display_object function


// let MAX_SIMILAR_MESSAGES = 3;
// let successList = [];
// let errorList = [];
// let warningList = [];
// let suppressedErrorCount = 0, suppressedWarningCount = 0;

// function addSuccessMessage(successString) {
//     console.log("fc Success: " + successString);
//     successList.push(successString);
// }
// function addError(message, index, extract, location) {
//     console.log("fc ERROR: " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
//     let similarCount = 0;
//     errorList.forEach((errMsg) => { if (errMsg[0].startsWith(message)) similarCount += 1 });
//     if (similarCount < MAX_SIMILAR_MESSAGES)
//         errorList.push(message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
//     else if (similarCount == MAX_SIMILAR_MESSAGES)
//         errorList.push(`${message}  ◄ MORE SIMILAR ERRORS SUPPRESSED`);
//     else suppressedErrorCount += 1;
// }
// function addWarning(message, index, extract, location) {
//     console.log("fc Warning: " + message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
//     let similarCount = 0;
//     warningList.forEach((warningMsg) => { if (warningMsg[0].startsWith(message)) similarCount += 1 });
//     if (similarCount < MAX_SIMILAR_MESSAGES)
//         warningList.push(message + (index > 0 ? " (at character " + index + 1 + ")" : "") + (extract ? " " + extract : "") + location);
//     else if (similarCount == MAX_SIMILAR_MESSAGES)
//         warningList.push(`${message}  ◄ MORE SIMILAR WARNINGS SUPPRESSED`);
//     else suppressedWarningCount += 1;
// }


export function FileCheck(props) {
    const { state: repo, component: repoComponent } = useContext(RepositoryContext);
    const { state: file, component: fileComponent } = useContext(FileContext);

    console.log("I'm here in FileCheck v" + checkerVersionString);
    // display_object("props", props);
    // display_object("file", file);

    let givenLocation = props['location'];
    if (givenLocation && givenLocation[0] != ' ') givenLocation = ' ' + givenLocation;

    let returnedResult = ( <>
        <b style={{ color: 'purple' }}>Loading…</b>
        </> );

    if (file) {
        /* Has fields: name, path, sha, type=file,
          size, encoding=base64, content,
          html_url, git_url, download_url,
          _links:object, branch, filepath. */
        // display_object("file", file);
        let result;
        const ourLocation = " in "+file.name+givenLocation;
        if (file.name.toLowerCase().endsWith('.tsv'))
            result = checkTN_TSVText(file.name, file.content, ourLocation);
        else if (file.name.toLowerCase().endsWith('.usfm')) {
            const filenameMain = file.name.substring(0, file.name.length - 5);
            // console.log("Have USFM filenameMain=" + filenameMain);
            const BBB = filenameMain.substring(filenameMain.length - 3);
            console.log("Have USFM bookcode=" + BBB);
            result = checkUSFMText(BBB, file.content, ourLocation);
        } else if (file.name.toLowerCase().endsWith('.md'))
            result = checkMarkdownText(file.name, file.content, ourLocation);
        else if (file.name.toLowerCase().startsWith('manifest.'))
            result = checkManifestText(file.name, file.content, ourLocation);
        else {
            // msg_html += "<p style=\"color:#538b01\">'<span style=\"font-style:italic\">" + file.name + "</span>' is not recognized, so ignored.</p>";
            msgLines += "Warning: '" + file.name + "' is not recognized, so treated as plain text.\n";
            result = checkPlainText(file.name, file.content, ourLocation);
        }

        // if (result) {
        //     for (let j = 0; j < result.successList.length; j++) {
        //         const success_msg = result.successList[j];
        //         msgLines.push("Success: " + success_msg);
        //     }
        //     for (let j = 0; j < result.errorList.length; j++) {
        //         const error_msg = result.errorList[j];
        //         msgLines.push("ERROR: " + error_msg);
        //     }
        //     if (result.errorList.length > 0) {
        //         msgLines.push("Displayed " + result.errorList.length.toLocaleString() + " errors above.");
        //         if (suppressedErrorCount > 0) msgLines.push("(" + suppressedErrorCount.toLocaleString() + " further errors suppressed.)");
        //         // msgLines += "\n"
        //     }
        //     for (let j = 0; j < result.warningList.length; j++) {
        //         const warning_msg = result.warningList[j];
        //         msgLines.push("Warning: " + warning_msg);
        //     }
        //     if (result.warningList.length > 0) {
        //         msgLines.push("Displayed " + result.warningList.length.toLocaleString() + " warnings above.");
        //         if (suppressedWarningCount > 0) msgLines.push(" (" + suppressedWarningCount.toLocaleString() + " further warnings suppressed.)");
        //         // msgLines += "\n"
        //     }
        // }

        // function RenderLines(props) {
        //     return (<ol>
        //         {props.text.split('\n').map(function (line) {
        //             return <li>{line}</li>;
        //         })}
        //     </ol>
        //     );
        // }

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
                    return <li key={listEntry.id}><b style={{ color: props.arrayType == 'e' ? 'red' : 'orange' }}>{listEntry[0]}</b> {(listEntry[1] > 0 ? " (at character " + (listEntry[1] + 1) + ")" : "")} {listEntry[2] ? " in '" + listEntry[2] + "'" : ""} {listEntry[3]}</li>;
                })}
            </ul>
            );
        }
    }

        if (result.errorList.length || result.warningList.length)
            returnedResult = (<>
                <p>Checked <b>{file.name}</b></p>
                <b style={{ color: result.errorList.length ? 'red' : 'green' }}>{result.errorList.length} error{result.errorList.length == 1 ? '' : 's'}</b>{result.errorList.length ? ':' : ''}
                <RenderArray arrayType='e' />
                <b style={{ color: result.warningList.length ? 'orange' : 'green' }}>{result.warningList.length} warning{result.warningList.length == 1 ? '' : 's'}</b>{result.warningList.length ? ':' : ''}
                <RenderArray arrayType='w' />
            </>);
        else // no errors
            returnedResult = (<>
                <p>Checked <b>{file.name}</b></p>
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
