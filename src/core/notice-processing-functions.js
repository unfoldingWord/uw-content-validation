import { displayPropertyNames, consoleLogObject } from './utilities';
import { result } from 'lodash';


const PROCESSOR_VERSION_STRING = '0.2.2';

// All of the following can be overriden with optionalProcessingOptions
const DEFAULT_MAXIMUM_SIMILAR_MESSAGES = 3; // Zero means no suppression of similar messages
const DEFAULT_CUTOFF_PRIORITY_LEVEL = 0; // This level or lower gets excluded from the lists
const DEFAULT_IGNORE_PRIORITY_NUMBER_LIST = [];

// For processNoticesToErrorsWarnings
const DEFAULT_ERROR_PRIORITY_LEVEL = 700; // This level or higher becomes an error (cf. warnings)

// For processNoticesToSevereMediumLow
const DEFAULT_SEVERE_PRIORITY_LEVEL = 800; // This level or higher becomes a severe error
const DEFAULT_MEDIUM_PRIORITY_LEVEL = 600; // This level or higher becomes a medium error

// For processNoticesToSingleList


function processNoticesCommon(givenNoticeObject, optionalProcessingOptions) {
    /*
        Expects to get an object with:
            successList: a list of strings describing what has been checked
            noticeList: a list of five or eight common/compulsory components to notices, being:
                1/ A notice priority number in the range 1-1000.
                    Each different type of warning/error has a unique number
                      (but not each instance of those warnings/errors).
                    By default, notice priority numbers 700 and over are
                      considered `errors` and 0-699 are considered `warnings`.
                The next three fields may be ommitted if irrelevant
                    2/ Book code 3-character UPPERCASE string
                        (or empty string if not relevant)
                    3/ Chapter number string
                        (or empty string if not relevant)
                    4/ Verse number string (can also be a bridge, e.g., '22-23')
                        (or empty string if not relevant)
                5/ The actual general description text of the notice
                6/ A zero-based integer index which indicates the position
                      of the error on the line or in the text as appropriate.
                    -1 indicates that this index does not contain any useful information.
                7/ An extract of the checked text which indicates the area
                      containing the problem.
                    Where helpful, some character substitutions have already been made,
                      for example, if the notice is about spaces,
                      it is generally helpful to display spaces as a visible
                      character in an attempt to best highlight the issue to the user.
                8/ A string indicating the context of the notice,
                        e.g., `in line 17 of 'someBook.usfm'.
                There is also an optional sixth/ninth notice component (where multiple files/repos are checked)
                9/ A string indicating an extra location component, e.g., repoCode or bookCode
                    This will need to be added to the message string (#5 above) but is left
                        to now in order to allow the most display flexibility
        Available options are:
            cutoffPriorityLevel (integer; default is DEFAULT_CUTOFF_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)
            sortBy ('AsFound' or 'ByPriority', default is 'AsFound')
            ignorePriorityNumberList (list of integers, default is empty list, list of notice priority numbers to be ignored)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.
    */
//     console.log(`processNoticesCommon v${PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
//   Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    // Add in any missing BBB,C,V fields
    const standardisedNoticeList = [];
    for (const thisGivenNotice of givenNoticeObject.noticeList) {
        if (thisGivenNotice.length === 6)
            standardisedNoticeList.push([thisGivenNotice[0], '', '', '', thisGivenNotice[1], thisGivenNotice[2], thisGivenNotice[3], thisGivenNotice[4], thisGivenNotice[5]]);
        else if (thisGivenNotice.length === 5)
            standardisedNoticeList.push([thisGivenNotice[0], '', '', '', thisGivenNotice[1], thisGivenNotice[2], thisGivenNotice[3], thisGivenNotice[4]]);
        else { // pass through as is
            console.assert(thisGivenNotice.length === 9 || thisGivenNotice.length === 8);
            standardisedNoticeList.push(thisGivenNotice);
        }
    }
    // At this point, all noticeList entries should be eight or nine fields wide (no longer five or six)

    // Check that notice priority numbers are unique (to detect programming errors)
    if (true) { // May be commented out of production code
        const numberStore = {}, duplicatePriorityList = [];
        for (const thisGivenNotice of standardisedNoticeList) {
            const thisPriority = thisGivenNotice[0], thisMsg = thisGivenNotice[4];
            const oldMsg = numberStore[thisPriority];
            if (oldMsg && oldMsg !== thisMsg && duplicatePriorityList.indexOf(thisPriority) < 0
                // Some of the messages include the troubling character in the message
                //    so we expect them to differ slightly
                && !thisMsg.startsWith('Mismatched ')
                && !thisMsg.startsWith('Unexpected doubled ')
                && !thisMsg.startsWith('Unexpected space after ')
                && !thisMsg.startsWith('Unexpected content after \\')
                && !thisMsg.endsWith(' character after space')
                && !thisMsg.endsWith(' marker at start of line')
            ) {
                console.log(`PROGRAMMING ERROR: priority ${thisPriority} has at least two different messages: '${oldMsg}' and '${thisMsg}'`);
                duplicatePriorityList.push(thisPriority); // so that we only give the error once
            }
            numberStore[thisPriority] = thisMsg;
        }
    }

    const resultObject = { // inititalise with our new fields
        numIgnoredNotices: 0,
        processingOptions: optionalProcessingOptions, // Just helpfully includes what we were given (may be undefined)
    };
    // Copy across all the other properties that we aren't interested in
    for (const gnoPropertyName in givenNoticeObject)
        if (gnoPropertyName !== 'successList' && gnoPropertyName !== 'noticeList')
            resultObject[gnoPropertyName] = givenNoticeObject[gnoPropertyName];

    // Fetch our processing parameters
    let ignorePriorityNumberList;
    try {
        ignorePriorityNumberList = optionalProcessingOptions.ignorePriorityNumberList;
    } catch (e) { }
    if (ignorePriorityNumberList === undefined) {
        ignorePriorityNumberList = DEFAULT_IGNORE_PRIORITY_NUMBER_LIST;
        // console.log(`Using default ignorePriorityNumberList=${ignorePriorityNumberList}`);
    } else
        console.log(`Using supplied ignorePriorityNumberList=${ignorePriorityNumberList} cf. default=${DEFAULT_IGNORE_PRIORITY_NUMBER_LIST}`);
    let sortBy;
    try {
        sortBy = optionalProcessingOptions.sortBy;
    } catch (e) { }
    if (sortBy === undefined) {
        sortBy = 'AsFound';
        // console.log(`Using default sortBy='${sortBy}'`);
    } else
        console.log(`Using supplied sortBy='${sortBy}' cf. default='AsFound'`);
    let cutoffPriorityLevel;
    try {
        cutoffPriorityLevel = optionalProcessingOptions.cutoffPriorityLevel;
    } catch (e) { }
    if (cutoffPriorityLevel === undefined) {
        cutoffPriorityLevel = DEFAULT_CUTOFF_PRIORITY_LEVEL;
        // console.log(`Using default cutoffPriorityLevel=${cutoffPriorityLevel}`);
    } else
        console.log(`Using supplied cutoffPriorityLevel=${cutoffPriorityLevel} cf. default=${DEFAULT_CUTOFF_PRIORITY_LEVEL}`);
    // if (cutoffPriorityLevel > errorPriorityLevel)
    // resultObject.errorList.push([999, "Cutoff level must not be higher than error level", -1, `(${cutoffPriorityLevel} vs ${errorPriorityLevel})`, " in processNoticesCommon options"]);


    // Handle the successList
    if (givenNoticeObject.successList.length < 5)
        resultObject.successList = givenNoticeObject.successList;
    else { // successList is fairly long -- maybe we can shorten it by combining multiple similar messages
        const BibleRegex = /\d\d-(\w\w\w).usfm/; // "Checked JUD file: 66-JUD.usfm"
        const NotesRegex = /\d\d-(\w\w\w).tsv/; // "Checked EN_TN_01-GEN.TSV file: en_tn_01-GEN.tsv"
        resultObject.successList = [];
        const bookList = [], notesList = [];
        for (const thisParticularSuccessMessage of givenNoticeObject.successList) {
            // console.log("thisParticularSuccessMessage", thisParticularSuccessMessage);
            let regexResult;
            if ((regexResult = BibleRegex.exec(thisParticularSuccessMessage)) !== null
                // but don't do it for Book Package checks (in different repos)
                && thisParticularSuccessMessage.startsWith(`Checked ${regexResult[1]} file`)) {
                // console.log("regexResult", JSON.stringify(regexResult));
                bookList.push(regexResult[1]);
            }
            else if ((regexResult = NotesRegex.exec(thisParticularSuccessMessage)) !== null
                // but don't do it for Book Package checks (in different repos)
                && thisParticularSuccessMessage.startsWith(`Checked ${regexResult[1]} file`)) {
                // console.log("regexResult", JSON.stringify(regexResult));
                notesList.push(regexResult[1]);
            }
            else
                resultObject.successList.push(thisParticularSuccessMessage); // Just copy it across
        }
        // Put summary messages at the beginning of the list
        if (bookList.length)
            resultObject.successList.unshift(`Checked ${bookList.length} USFM Bible files: ${bookList.join(', ')}`);
        else if (notesList.length)
            resultObject.successList.unshift(`Checked ${notesList.length} TSV notes files: ${notesList.join(', ')}`);
    }

    // Handle the checkedFilenames list
    //  which might have 100s or 1,000s of .md filenames
    if (resultObject.checkedFilenames && resultObject.checkedFilenames.length > 10) {
        // console.log(`Have ${resultObject.checkedFilenames.length} checkedFilenames`);
        resultObject.checkedFilenames = [...new Set(resultObject.checkedFilenames)]; // Only keep unique ones
        // console.log(`Now have ${resultObject.checkedFilenames.length} checkedFilenames`);
        // console.log(JSON.stringify(resultObject.checkedFilenames));
    }

    // Specialised processing
    // If have s5 marker warnings, add one error
    // consoleLogObject('givenNoticeObject', givenNoticeObject);
    for (const thisParticularNotice of standardisedNoticeList) {
        // console.log("thisParticularNotice", thisParticularNotice);
        if (thisParticularNotice[4].indexOf('\\s5') >= 0) {
            let thisthisParticularNoticeArray = [701, thisParticularNotice[1], '', '', "\\s5 fields should be coded as \\ts\\* milestones", -1, '', ` in ${givenNoticeObject.checkType}`];
            if (thisParticularNotice.length === 6) thisParticularNotice.push(thisParticularNotice[5]); // Sometime we have an additional file identifier
            standardisedNoticeList.push(thisParticularNotice);
            break;
        }
    }

    // Remove any notices that they have asked us to ignore
    let remainingNoticeList;
    if (ignorePriorityNumberList.length) {
        // console.log("Doing ignore of", ignorePriorityNumberList.length,"value(s)");
        remainingNoticeList = [];
        for (const thisNotice of standardisedNoticeList)
            if (ignorePriorityNumberList.indexOf(thisNotice[0]) >= 0)
                resultObject.numIgnoredNotices++;
            else
                remainingNoticeList.push(thisNotice);
    } else
        remainingNoticeList = standardisedNoticeList;
    if (resultObject.numIgnoredNotices)
        console.log(`Ignored ${resultObject.numIgnoredNotices} notices`);

    // Cut off the lowest priority notices if requested
    if (cutoffPriorityLevel > 0) {
        const newNoticeList = [];
        for (const thisNotice of remainingNoticeList)
            if (thisNotice[0] < cutoffPriorityLevel)
                resultObject.numSuppressedWarnings++;
            else newNoticeList.push(thisNotice);
        remainingNoticeList = newNoticeList;
    }
    // if (cutoffPriorityLevel > errorPriorityLevel)
    // resultObject.errorList.push([999, "Cutoff level must not be higher than error level", -1, `(${cutoffPriorityLevel} vs ${errorPriorityLevel})`, " in processNoticesCommon options"]);

    // Sort the remainingNoticeList as required
    if (sortBy === 'ByPriority')
        remainingNoticeList.sort(function (a, b) { return b[0] - a[0] });
    else if (sortBy !== 'AsFound')
        console.log(`ERROR: Sorting '${sortBy}' is not implemented yet!!!`);

    // Add in extra location info if it's there
    // Default is to prepend it to the msg
    //  This prevents errors/warnings from different repos or books from being combined
    if (remainingNoticeList.length && remainingNoticeList[0].length === 9) { // normally it's 8
        // console.log(`We need to add the extra location, e.g. '${remainingNoticeList[0][5]}': will prepend it to the messages`);
        const newNoticeList = [];
        for (const thisNotice of remainingNoticeList)
            newNoticeList.push([thisNotice[0], thisNotice[1], thisNotice[2], thisNotice[3], `${thisNotice[8]} ${thisNotice[4]}`, thisNotice[5], thisNotice[6], thisNotice[7]]);
        remainingNoticeList = newNoticeList;
    }

    // Count the number of occurrences of each message
    const allTotals = {};
    for (const thisNotice of remainingNoticeList)
        if (isNaN(allTotals[thisNotice[0]])) allTotals[thisNotice[0]] = 1;
        else allTotals[thisNotice[0]]++;

    return [remainingNoticeList, allTotals, resultObject];
}
// end of processNoticesCommon function


export function processNoticesToErrorsWarnings(givenNoticeObject, optionalProcessingOptions) {
    /*
        Available options are:
            errorPriorityLevel (integer; default is DEFAULT_ERROR_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)

        Returns an object with:
            successList: a list of strings describing what has been checked
            errorList
            warningList
            numIgnoredNotices, numSuppressedErrors, numSuppressedWarnings
            processingOptions: just helpfully passes on what we were given (may be undefined)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.
    */
//     console.log(`processNoticesToErrorsWarnings v${PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
//    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.errorList = []; resultObject.warningList = [];
    resultObject.numSuppressedErrors = 0; resultObject.numSuppressedWarnings = 0;

    let maximumSimilarMessages;
    try {
        maximumSimilarMessages = optionalProcessingOptions.maximumSimilarMessages;
    } catch (e) { }
    if (typeof maximumSimilarMessages !== 'number' || isNaN(maximumSimilarMessages)) {
        maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
        // console.log(`Using default maximumSimilarMessages=${maximumSimilarMessages}`);
    } else
        console.log(`Using supplied maximumSimilarMessages=${maximumSimilarMessages} cf. default=${DEFAULT_MAXIMUM_SIMILAR_MESSAGES}`);
    let errorPriorityLevel;
    try {
        errorPriorityLevel = optionalProcessingOptions.errorPriorityLevel;
    } catch (e) { }
    if (errorPriorityLevel === undefined) {
        errorPriorityLevel = DEFAULT_ERROR_PRIORITY_LEVEL;
        // console.log(`Using default errorPriorityLevel=${errorPriorityLevel}`);
    } else
        console.log(`Using supplied errorPriorityLevel=${errorPriorityLevel} cf. default=${DEFAULT_ERROR_PRIORITY_LEVEL}`);

    // Check for repeated notices that should be compressed
    //  while simultaneously separating into error and warning lists
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice[0], thisMsg = thisNotice[4];
        const thisID = thisPriority + thisMsg; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisID])) counter[thisID] = 1;
        else counter[thisID]++;
        if (maximumSimilarMessages > 0 && counter[thisID] === maximumSimilarMessages + 1) {
            if (thisPriority >= errorPriorityLevel) {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.errorList.push([-1, '', '', '', thisMsg, -1, '', ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR ERROR${numSuppressed === 1 ? '' : 'S'} SUPPRESSED`]);
                resultObject.numSuppressedErrors++;
            } else {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.warningList.push([-1, '', '', '', thisMsg, -1, '', ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR WARNING${numSuppressed === 1 ? '' : 'S'} SUPPRESSED`]);
                resultObject.numSuppressedWarnings++;
            }
        } else if (maximumSimilarMessages > 0 && counter[thisID] > maximumSimilarMessages + 1) {
            if (thisPriority >= errorPriorityLevel)
                resultObject.numSuppressedErrors++;
            else
                resultObject.numSuppressedWarnings++;
        } else if (thisPriority >= errorPriorityLevel)
            resultObject.errorList.push(thisNotice);
        else
            resultObject.warningList.push(thisNotice);
    }

    // console.log(`processNoticesToErrorsWarnings is returning ${resultObject.successList.length} successes, ${resultObject.errorList.length} errors, and ${resultObject.warningList.length} warnings
    //   numIgnoredNotices=${resultObject.numIgnoredNotices} numSuppressedErrors=${resultObject.numSuppressedErrors} numSuppressedWarnings=${resultObject.numSuppressedWarnings}`);
    return resultObject;
}
// end of processNoticesToErrorsWarnings function


export function processNoticesToSevereMediumLow(givenNoticeObject, optionalProcessingOptions) {
    /*
        Available options are:
            severePriorityLevel (integer; default is DEFAULT_SEVERE_PRIORITY_LEVEL above)
            mediumPriorityLevel (integer; default is DEFAULT_MEDIUM_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)

        Returns an object with:
            successList: a list of strings describing what has been checked
            severeList
            mediumList
            lowList
            numIgnoredNotices, numSevereSuppressed, numMediumSuppressed, numLowSuppressed
            processingOptions: just helpfully passes on what we were given (may be undefined)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.
    */
//     console.log(`processNoticesToSevereMediumLow v${PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
//    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.severeList = []; resultObject.mediumList = []; resultObject.lowList = [];
    resultObject.numSevereSuppressed = 0; resultObject.numMediumSuppressed = 0; resultObject.numLowSuppressed = 0;

    let maximumSimilarMessages;
    try {
        maximumSimilarMessages = optionalProcessingOptions.maximumSimilarMessages;
    } catch (e) { }
    if (typeof maximumSimilarMessages !== 'number' || isNaN(maximumSimilarMessages)) {
        maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
        // console.log(`Using default maximumSimilarMessages=${maximumSimilarMessages}`);
    } else
        console.log(`Using supplied maximumSimilarMessages=${maximumSimilarMessages} cf. default=${DEFAULT_MAXIMUM_SIMILAR_MESSAGES}`);
    let severePriorityLevel;
    try {
        severePriorityLevel = optionalProcessingOptions.severePriorityLevel;
    } catch (e) { }
    if (severePriorityLevel === undefined) {
        severePriorityLevel = DEFAULT_SEVERE_PRIORITY_LEVEL;
        // console.log(`Using default severePriorityLevel=${severePriorityLevel}`);
    } else
        console.log(`Using supplied severePriorityLevel=${severePriorityLevel} cf. default=${DEFAULT_SEVERE_PRIORITY_LEVEL}`);
    let mediumPriorityLevel;
    try {
        mediumPriorityLevel = optionalProcessingOptions.mediumPriorityLevel;
    } catch (e) { }
    if (mediumPriorityLevel === undefined) {
        mediumPriorityLevel = DEFAULT_MEDIUM_PRIORITY_LEVEL;
        // console.log(`Using default mediumPriorityLevel=${mediumPriorityLevel}`);
    } else
        console.log(`Using supplied mediumPriorityLevel=${mediumPriorityLevel} cf. default=${DEFAULT_MEDIUM_PRIORITY_LEVEL}`);

    // Check for repeated notices that should be compressed
    //  while simultaneously separating into error and warning lists
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice[0], thisMsg = thisNotice[4];
        const thisID = thisPriority + thisMsg; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisID])) counter[thisID] = 1;
        else counter[thisID]++;
        if (maximumSimilarMessages > 0 && counter[thisID] === maximumSimilarMessages + 1) {
            if (thisPriority >= severePriorityLevel) {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.severeList.push([-1, '', '', '', thisMsg, -1, '', ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR ERROR${numSuppressed === 1 ? '' : 'S'} SUPPRESSED`]);
                resultObject.numSevereSuppressed++;
            } else if (thisPriority >= mediumPriorityLevel) {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.mediumList.push([-1, '', '', '', thisMsg, -1, '', ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR ERROR${numSuppressed === 1 ? '' : 'S'} SUPPRESSED`]);
                resultObject.numMediumSuppressed++;
            } else {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.lowList.push([-1, '', '', '', thisMsg, -1, '', ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR WARNING${numSuppressed === 1 ? '' : 'S'} SUPPRESSED`]);
                resultObject.numLowSuppressed++;
            }
        } else if (maximumSimilarMessages > 0 && counter[thisID] > maximumSimilarMessages + 1) {
            if (thisPriority >= severePriorityLevel)
                resultObject.numSevereSuppressed++;
            else if (thisPriority >= mediumPriorityLevel)
                resultObject.numMediumSuppressed++;
            else
                resultObject.numLowSuppressed++;
        } else if (thisPriority >= severePriorityLevel)
            resultObject.severeList.push(thisNotice);
        else if (thisPriority >= mediumPriorityLevel)
            resultObject.mediumList.push(thisNotice);
        else
            resultObject.lowList.push(thisNotice);
    }

    // console.log(`processNoticesToSevereMediumLow is returning ${resultObject.successList.length} successes, ${resultObject.severeList.length} severe, ${resultObject.mediumList.length} medium, and ${resultObject.lowList.length} low
    //   numIgnoredNotices=${resultObject.numIgnoredNotices} numSevereSuppressed=${resultObject.numSevereSuppressed} numMediumSuppressed=${resultObject.numMediumSuppressed} numLowSuppressed=${resultObject.numLowSuppressed}`);
    return resultObject;
}
// end of processNoticesToSevereMediumLow function


export function processNoticesToSingleList(givenNoticeObject, optionalProcessingOptions) {
    /*
        Available options are:
            severePriorityLevel (integer; default is DEFAULT_SEVERE_PRIORITY_LEVEL above)
            mediumPriorityLevel (integer; default is DEFAULT_MEDIUM_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)

        Returns an object with:
            successList: a list of strings describing what has been checked
            warningList
            numIgnoredNotices, numSevereSuppressed, numMediumSuppressed, numLowSuppressed
            processingOptions: just helpfully passes on what we were given (may be undefined)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.
    */
//     console.log(`processNoticesToSingleList v${PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
//    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.warningList = []; resultObject.numSuppressedWarnings = 0;

    let maximumSimilarMessages;
    try {
        maximumSimilarMessages = optionalProcessingOptions.maximumSimilarMessages;
    } catch (e) { }
    if (typeof maximumSimilarMessages !== 'number' || isNaN(maximumSimilarMessages)) {
        maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
        // console.log(`Using default maximumSimilarMessages=${maximumSimilarMessages}`);
    } else
        console.log(`Using supplied maximumSimilarMessages=${maximumSimilarMessages} cf. default=${DEFAULT_MAXIMUM_SIMILAR_MESSAGES}`);

    // Check for repeated notices that should be compressed
    //  while simultaneously creating warning list
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice[0], thisMsg = thisNotice[4];
        const thisID = thisPriority + thisMsg; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisID])) counter[thisID] = 1;
        else counter[thisID]++;
        if (maximumSimilarMessages > 0 && counter[thisID] === maximumSimilarMessages + 1) {
            const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
            resultObject.warningList.push([-1, '', '', '', thisMsg, -1, '', ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR WARNING${numSuppressed === 1 ? '' : 'S'} SUPPRESSED`]);
            resultObject.numSuppressedWarnings++;
        } else if (maximumSimilarMessages > 0 && counter[thisID] > maximumSimilarMessages + 1) {
            resultObject.numSuppressedWarnings++;
        } else
            resultObject.warningList.push(thisNotice);
    }

    // console.log(`processNoticesToSingleList is returning ${resultObject.successList.length} successes, ${resultObject.warningList.length} warnings
    //   numIgnoredNotices=${resultObject.numIgnoredNotices} numSuppressedWarnings=${resultObject.numSuppressedWarnings}`);
    return resultObject;
}
// end of processNoticesToSingleList function
