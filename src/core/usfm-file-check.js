import { React, useContext } from 'react';
// import PropTypes from 'prop-types';
// import ReactJson from 'react-json-view';
// import { Paper, Button } from '@material-ui/core';
import {
    RepositoryContext,
    FileContext,
} from 'gitea-react-toolkit';
import * as books from '../core';
import doBasicTextChecks from './basic-text-check';


const checkerVersionString = '0.0.4';
// function display_object(given_title, given_object) {
//   let output = given_title + ' object:\n';
//   // for (let property_name in given_object)
//   //     output += "  " + property_name + '\n';
//   for (let property_name in given_object) {
//     //try {
//     let this_property_contents = '' + given_object[property_name];
//     if (this_property_contents.length > 50)
//       this_property_contents = '(' + this_property_contents.length + ') ' + this_property_contents.substring(0, 50) + '…';
//     output += '  ' + property_name + ': ' + this_property_contents + '\n';
//     /*}
//     catch (e) {
//       console.log("Can't parse " + property_name);
//     }*/
//   }
//   console.log(output);
// }
// end of display_object function

// console.log(fileComponent);
// let fCString = JSON.stringify(fileComponent, null, 4);
// console.log("fC "+fCString);
//console.dir(fileComponent);
// console.log(JSON.stringify(fileComponent, null, 4));

// if (repo) {
//   // display_object("repo", repo);
// }


let MAX_SIMILAR_MESSAGES = 3;
let successList = [];
let errorList = [];
let warningList = [];
let suppressedErrorCount = 0, suppressedWarningCount = 0;

function addSuccessMessage(successString) {
    console.log("Success: " + successString);
    successList.push(successString);
}
function addError(message, index, extract, location) {
    console.log("ufc ERROR: " + message + (index>0?" (at character "+index+1+")":"") + (extract?" "+extract:"") + location);
    let similarCount = 0;
    errorList.forEach((errMsg) => { if (errMsg[0].startsWith(message)) similarCount += 1 });
    if (similarCount < MAX_SIMILAR_MESSAGES)
        errorList.push(message + (index>0?" (at character "+index+1+")":"") + (extract?" "+extract:"") + location);
    else if (similarCount == MAX_SIMILAR_MESSAGES)
        errorList.push(`${message}  ◄ MORE SIMILAR ERRORS SUPPRESSED`);
    else suppressedErrorCount += 1;
}
function addWarning(message, index, extract, location) {
    console.log("ufc Warning: "+message + (index>0?" (at character "+index+1+")":"") + (extract?" "+extract:"") + location);
    let similarCount = 0;
    warningList.forEach((warningMsg) => { if (warningMsg[0].startsWith(message)) similarCount += 1 });
    if (similarCount < MAX_SIMILAR_MESSAGES)
        warningList.push(message + (index>0?" (at character "+index+1+")":"") + (extract?" "+extract:"") + location);
    else if (similarCount == MAX_SIMILAR_MESSAGES)
        warningList.push(`${message}  ◄ MORE SIMILAR WARNINGS SUPPRESSED`);
    else suppressedWarningCount += 1;
}


function doOurBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation) {
    // Does basic checks for small errors like leading/trailing spaces, etc.

    // We assume that checking for compulsory fields is done elsewhere

    // Updates the global error and warning lists

    const resultObject = doBasicTextChecks(fieldName, fieldText, linkTypes, optionalFieldLocation)
    for (let errorEntry in resultObject.errorList)
        addError(errorEntry[0], errorEntry[1], errorEntry[2], errorEntry[3]);
    for (let warningEntry in resultObject.warningList)
        addError(warningEntry[0], warningEntry[1], warningEntry[2], warningEntry[3]);
}
// end of doOurBasicTextChecks function


const INTRO_LINE_START_MARKERS = ['id', 'usfm', 'ide', 'h', 'toc1', 'toc2', 'toc3', 'mt', 'mt1', 'mt2'];
const CV_MARKERS = ['c', 'v'];
const HEADING_MARKERS = ['s', 's1', 's2', 's3', 's4', 'r', 'd'];
const PARAGRAPH_MARKERS = ['p', 'q', 'q1', 'q2', 'q3', 'q4', 'm', 'pi', 'pi1'];
const NOTE_MARKERS = ['f', 'x'];
const SPECIAL_MARKERS = ['w', 'zaln-s'];
const MILESTONE_MARKERS = ['ts-s']; // TEMP XXXXX
const ALLOWED_LINE_START_MARKERS = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_MARKERS)
    .concat(CV_MARKERS).concat(PARAGRAPH_MARKERS)
    .concat(NOTE_MARKERS).concat(SPECIAL_MARKERS).concat(MILESTONE_MARKERS);
const DEPRECATED_MARKERS = ['h1', 'h2', 'h3', 'h4', 'pr', 'ph', 'ph1', 'ph2', 'ph3', 'ph4', 'addpn', 'pro', 'fdc', 'xdc'];
const MARKERS_WITHOUT_CONTENT = ['b', 'ts-s', 's5']; // TEMP XXXXX
const MARKERS_WITH_COMPULSORY_CONTENT = [].concat(INTRO_LINE_START_MARKERS).concat(HEADING_MARKERS)
    .concat(CV_MARKERS).concat(NOTE_MARKERS).concat(SPECIAL_MARKERS);
function checkUSFMFile(file) {
    // Updates successList, errorList, warningList
    console.log("checkUSFMFile(" + file.name + ")…");

    function checkUSFMLine(marker, rest, lineLocation) {

        if (ALLOWED_LINE_START_MARKERS.indexOf(marker) >= 0) {
            if (rest) {
                if (MARKERS_WITHOUT_CONTENT.indexOf(marker) >= 0)
                    if (isWhitespace(rest))
                        addWarning(`Unexpected whitespace '${rest}'`, 1, "", ` after \\${marker} marker${lineLocation}`);
                    else
                        addError(`Unexpected content '${rest}'`, ` after \\${marker} marker${lineLocation}`);
                else if (rest[0] == ' ') {
                    let extract = rest.substring(0, 10).replace(/ /g, '␣');
                    if (rest.length > 10) extract += '…';
                    if (isWhitespace(rest))
                        addWarning(`Found only whitespace with \\${marker}`, marker.length, "", ` being '${extract}'${lineLocation}`);
                    else
                        addWarning(`Unexpected leading space(s) for \\${marker}`, marker.length, "", ` with '${extract}'${lineLocation}`);
                }

            } else { // nothing following the marker
                if (MARKERS_WITH_COMPULSORY_CONTENT.indexOf(marker) >= 0)
                    addError("Expected compulsory content", marker.length, "", ` after \\${marker} marker${lineLocation}`);
            }
        } else
            addError(`Unexpected '${marker}' marker at start of line`, atString);
    }
    // end of checkUSFMLine function

    let lastFiveFilenameChars = file.name.substring(file.name.length - 5)
    let BBB; // 3-character UPPERCASE USFM bookcode
    if (lastFiveFilenameChars != '.usfm')
        addError(`Filename '${file.name}' should end with '.usfm'`, ` (not '${lastFiveFilenameChars}')`);
    else { // should be in form 08-RUT.usfm
        let mainFilenamePart = file.name.substring(0, file.name.length - 5);
        console.log("mainFilenamePart", mainFilenamePart);
        BBB = mainFilenamePart.substring(mainFilenamePart.length - 3);
        console.log("BBB = " + BBB);
        let pre_BBB_char = mainFilenamePart.charAt(mainFilenamePart.length - 4);
        if (pre_BBB_char != '-')
            addError("Filename '" + file.name + "' should contain a hyphen before the book code", " (not '" + pre_BBB_char + "')");
        let underlineCount = countOccurrences(file.name, '_');
        if (underlineCount != 0)
            addError("Filename '" + file.name + "' should contain no underscore characters", " (found " + underlineCount + ")");
        // let filename_bits = mainFilenamePart.substring(0, mainFilenamePart.length - 4).split('_');
        // console.assert(filename_bits.length == 3);
    }

    // if (ALLOWED_BBBs.indexOf(BBB) == -1)
    let bbb = BBB.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    }
    catch {
        addError("Filename '" + file.name + "' should contain a valid book number", " (not '" + BBB + "')");
    }

    let lines = file.content.split('\n');
    console.log("  " + file.name + " has " + lines.length.toLocaleString() + " total lines");

    let lastB = '', lastC = '', lastV = '', C = '0', V = '0';
    let numVersesThisChapter = 0;
    for (let n = 1; n <= lines.length; n++) {
        let line = lines[n - 1];
        if (C == '0') V = n.toString();
        let atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + " of " + file.name;
        // console.log("line '"+ line+"'"+ atString);
        if (!line) {
            // addWarning("Unexpected blank line" + atString);
            continue;
        }
        if (line.indexOf('\r') >= 0)
            addError("Unexpected carriageReturn character", atString);
        if (line[0] != '\\')
            addError("Expected line to start with backslash not '" + line[0] + "'", atString);

        let marker = line.substring(1).split(' ', 1)[0];
        let rest = line.substring(marker.length + 2)
        // console.log("Line " + n + ": marker='" + marker + "' rest='" + rest + "'");

        if (marker == 'c') C = rest;
        else if (marker == 'v') V = rest.split(' ', 1)[0];
        let atString = " at " + BBB + " " + C + ":" + V + " on line " + n.toLocaleString() + " of " + file.name;

        checkUSFMLine(marker, rest, atString);

        lastC = C; lastV = V;
    }

    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data lines in ${file.name}.`)
    if (errorList || warningList)
        addSuccessMessage("RepoChecker v" + checkerVersionString + " finished with " + errorList.length + " errors and " + warningList.length + " warnings")
    else
        addSuccessMessage("No errors or warnings found by RepoChecker v" + checkerVersionString)
    console.log("  Returning with " + successList.length + " successes, " + errorList.length + " errors, " + warningList.length + " warnings.");
}


function checkTN_TSVFile(file) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     Updates successList, errorList, warningList
     */
    console.log("checkTN_TSVFile(" + file.name + ")…");

    let lastFourFilenameChars = file.name.substring(file.name.length - 4);
    let BBB; // 3-character UPPERCASE USFM bookcode
    if (lastFourFilenameChars != '.tsv')
        addError("Filename '" + file.name + "' should end with '.tsv'", " (not '" + lastFourFilenameChars + "')");
    else { // should be in form en_tn_08-RUT.tsv
        let mainFilenamePart = file.name.substring(0, file.name.length - 4);
        console.log("mainFilenamePart", mainFilenamePart);
        BBB = mainFilenamePart.substring(mainFilenamePart.length - 3);
        console.log("BBB = " + BBB);
        let pre_BBB_char = mainFilenamePart.charAt(mainFilenamePart.length - 4);
        if (pre_BBB_char != '-')
            addError("Filename '" + file.name + "' should contain a hyphen before the book code", " (not '" + pre_BBB_char + "')");
        let underlineCount = countOccurrences(file.name, '_');
        if (underlineCount != 2)
            addError("Filename '" + file.name + "' should contain exactly three underscore characters", " (found " + underlineCount + ")");
        let filename_bits = mainFilenamePart.substring(0, mainFilenamePart.length - 4).split('_');
        console.assert(filename_bits.length == 3);
    }

    // if (ALLOWED_BBBs.indexOf(BBB) == -1)
    let bbb = BBB.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        numChaptersThisBook = books.chaptersInBook(bbb).length;
    }
    catch {
        addError("Filename '" + file.name + "' should contain a valid book number", " (not '" + BBB + "')");
    }

    let lines = file.content.split('\n');
    console.log("  " + file.name + " has " + lines.length.toLocaleString() + " total lines (expecting " + NUM_EXPECTED_TN_FIELDS + " fields in each line)");

    let lastB = '', lastC = '', lastV = '';
    let fieldID_list = [];
    let numVersesThisChapter = 0;
    for (let n = 0; n < lines.length; n++) {
        if (n == 0) {
            if (lines[0] == EXPECTED_TN_HEADING_LINE)
                addSuccessMessage("Checked TSV header in " + file.name);
            else
                addError("Bad TSV header", " in " + file.name + ": '" + lines[0] + "'");
        }
        else // not the header
        {
            checkTN_TSVDataRow(BBB, lines[n], n); // This call is a double-up just for testing
            let fields = lines[n].split('\t');
            if (fields.length == NUM_EXPECTED_TN_FIELDS) {
                let [B, C, V, fieldID, support_reference, orig_quote, occurrence, GL_quote, occurrenceNote] = fields;
                let inString = " in line " + n.toLocaleString() + " of " + file.name;
                let withString = " with '" + fieldID + "'" + inString;
                let CV_withString = ' ' + C + ':' + V + withString;
                let atString = " at " + B + ' ' + C + ':' + V + " (" + fieldID + ")" + inString;

                // Check the fields one-by-one
                if (B) {
                    if (B != BBB)
                        addError("Wrong '" + B + "' book code (expected '" + BBB + "')", CV_withString);
                }
                else
                    addError("Missing book code", " at" + CV_withString);

                if (C) {
                    if (C == 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C != lastC)
                            numVersesThisChapter = books.versesInChapter(bbb, intC);
                        if (intC == 0)
                            addError("Invalid zero '" + C + "' chapter number", atString);
                        if (intC > numChaptersThisBook)
                            addError("Invalid large '" + C + "' chapter number", atString);
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addError("Receding '" + C + "' chapter number after '" + lastC + "'", atString);
                            else if (intC > lastintC + 1)
                                addError("Advancing '" + C + "' chapter number after '" + lastC + "'", atString);
                        }
                    }
                    else
                        addError("Bad chapter number", " with" + CV_withString);
                }
                else
                    addError("Missing chapter number", " after " + lastC + ':' + V + withString);

                if (V) {
                    if (V == 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV == 0)
                            addError("Invalid zero '" + V + "' verse number", atString);
                        if (intV > numVersesThisChapter)
                            addError("Invalid large '" + V + "' verse number for chapter " + C, atString);
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (intV < lastintV)
                                addError("Receding '" + V + "' verse number after '" + lastV + "'", atString);
                            // else if (intV > lastintV + 1)
                            //   addWarning("Skipped verses with '" + V + "' verse number after '" + lastV + "'" + atString);
                        }
                    }
                    else
                        addError("Bad verse number", atString);

                }
                else
                    addError("Missing verse number", " after " + C + ':' + lastV + withString);

                if (fieldID) {
                    if (fieldID_list.indexOf(fieldID) >= 0)
                        addError("Duplicate '" + fieldID + "' ID", atString);
                } else
                    addError("Missing ID", atString);

                if (support_reference) { // need to check UTN against UTA
                    doOurBasicTextChecks('SupportReference', support_reference, atString);
                }


                if (orig_quote) { // need to check UTN against UHB and UGNT
                    doOurBasicTextChecks('OrigQuote', orig_quote, atString);
                }

                if (occurrence) { // This should usually be a digit
                    if (occurrence == '0') {
                        if (V != 'intro')
                            addError("Invalid '" + occurrence + "' occurrence field", atString);
                    }
                    else if ('123456789'.indexOf(occurrence) < 0)
                        addError("Invalid '" + occurrence + "' occurrence field", atString);
                }

                if (GL_quote) { // need to check UTN against ULT
                    doOurBasicTextChecks('GLQuote', GL_quote, atString);
                }

                if (occurrenceNote) {
                    doOurBasicTextChecks('OccurrenceNote', occurrenceNote, atString);
                }

                if (B != lastB || C != lastC || V != lastV) {
                    fieldID_list = []; // ID's only need to be unique within each verse
                    lastB = B; lastC = C; lastV = V;
                }

            } else
                console.log("  Line " + n + ": Has " + fields.length + " fields instead of " + EXPECTED_TN_HEADING_LINE);

        }
    }
    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data lines in ${file.name}.`)
    if (errorList || warningList)
        addSuccessMessage(`RepoChecker v${checkerVersionString} finished with ${errorList.length.toLocaleString()} errors and ${warningList.length.toLocaleString()} warnings`)
    else
        addSuccessMessage("No errors or warnings found by RepoChecker v" + checkerVersionString)
    console.log(`  Returning with ${successList.length.toLocaleString()} successes, ${errorList.length.toLocaleString()} errors, ${warningList.length.toLocaleString()} warnings.`);
    // return [successList, errorList, warningList];
}
// end of checkTN_TSVFile function


export function RepoChecker() {
    const { state: repo, component: repoComponent } = useContext(RepositoryContext);
    const { state: file, component: fileComponent } = useContext(FileContext);

    console.log("I'm here in RepoChecker v" + checkerVersionString);

    // Main part of RepoChecker function
    successList.length = 0;
    errorList.length = 0;
    warningList.length = 0;
    suppressedErrorCount = 0;
    suppressedWarningCount = 0;
    let msgLines = '';

    if (file) {
        /* Has fields: name, path, sha, type=file,
          size, encoding=base64, content,
          html_url, git_url, download_url,
          _links:object, branch, filepath. */
        // display_object("file", file);
        if (file.name.toLowerCase().endsWith('.tsv'))
            checkTN_TSVFile(file);
        else if (file.name.toLowerCase().endsWith('.usfm'))
            checkUSFMFile(file);
        else if (file.name.toLowerCase().endsWith('.md'))
            checkMarkdownFile(file);
        else {
            // msg_html += "<p style=\"color:#538b01\">'<span style=\"font-style:italic\">" + file.name + "</span>' is not recognized, so ignored.</p>";
            msgLines += "Warning: '" + file.name + "' is not recognized, so ignored.\n";
        }

        for (let j = 0; j < successList.length; j++) {
            let success_msg = successList[j];
            msgLines += "Success: " + success_msg + "\n"
        }
        for (let j = 0; j < errorList.length; j++) {
            let error_msg = errorList[j];
            msgLines += "ERROR: " + error_msg + "\n"
        }
        if (errorList.length > 0) {
            msgLines += "Displayed " + errorList.length.toLocaleString() + " errors above.";
            if (suppressedErrorCount > 0) msgLines += " (" + suppressedErrorCount.toLocaleString() + " further errors suppressed.)"
            msgLines += "\n"
        }
        for (let j = 0; j < warningList.length; j++) {
            let warning_msg = warningList[j];
            msgLines += "Warning: " + warning_msg + "\n"
        }
        if (warningList.length > 0) {
            msgLines += "Displayed " + warningList.length.toLocaleString() + " warnings above.";
            if (suppressedWarningCount > 0) msgLines += " (" + suppressedWarningCount.toLocaleString() + " further warnings suppressed.)"
            msgLines += "\n"
        }

    }
    else {
        console.log("No file yet");
    }

    // let resultObject = {
    //   successList: successList,
    //   numErrors: errorList.length
    // };

    return (!repo && repoComponent) || (!file && fileComponent) || msgLines;
};
// end of RepoChecker()

export default RepoChecker;
