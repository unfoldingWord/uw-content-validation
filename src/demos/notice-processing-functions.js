// import { displayPropertyNames, consoleLogObject } from './utilities';


// const NOTICE_PROCESSOR_VERSION_STRING = '0.7.2';

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
// (no constants required)


function processNoticesCommon(givenNoticeObject, optionalProcessingOptions) {
    /**
    * @description - Preprocesses the successList and noticeList
    * @param {Object} givenNoticeObject - must contain a noticeList array
    * @param {Object} optionalProcessingOptions - may contain parameters
    * @return {Array} - noticeList, countObject, preResultObject
    */
    /*
        Expects to get an object with:
            successList: a list of strings describing what has been checked
            noticeList: a list of components to notices, being:
                priority: A notice priority number in the range 1-1000.
                    Each different type of warning/error has a unique number
                      (but not each instance of those warnings/errors).
                    By default, notice priority numbers 700 and over are
                      considered `errors` and 0-699 are considered `warnings`.
                message: The actual general description text of the notice
                details: Extra notice information (if relevant)
                The next three fields may be ommitted if irrelevant
                 (since BCV is not relevant to all types of files/repos)
                    bookID: book identifier 3-character UPPERCASE string
                    C: Chapter number string
                    V: Verse number string (can also be a bridge, e.g., '22-23')
                repoName: repository name (if relevant)
                filename: string (if relevant)
                rowID: 4-character string (if relevant)
                lineNumber: A one-based integer indicating the line number in the file
                fieldName: string (if relevant)
                characterIndex: A zero-based integer index which indicates the position
                    of the error on the line or in the text field as appropriate.
                extract: An extract of the checked text which indicates the area
                      containing the problem.
                    Where helpful, some character substitutions have already been made,
                      for example, if the notice is about spaces,
                      it is generally helpful to display spaces as a visible
                      character in an attempt to best highlight the issue to the user.
                 location: A string indicating the context of the notice,
                        e.g., `in 'someBook.usfm'.
                There is also an optional notice component (where multiple files/repos are checked)
                extra: A string indicating an extra location component, e.g., repoCode or bookID
                    This will probably need to be added to the message string but is left
                        until now in order to allow the most display flexibility
        Available options are:
            cutoffPriorityLevel (integer; default is DEFAULT_CUTOFF_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is DEFAULT_MAXIMUM_SIMILAR_MESSAGES above)
            sortBy ('AsFound' or 'ByPriority', default is 'AsFound')
            ignorePriorityNumberList (list of integers, default is empty list, list of notice priority numbers to be ignored)
        Also, any other parameters are just passed through,
            although filenameList might be abbreviated, e.g. for 100s of .md files.

        Returns an array of three fields:
            remainingNoticeList
                A list of notice entries, each one containing exactly eight or nine fields (see above)
                    i.e., notice entries originally containing five or six fields have had blank BCV fields inserted.
            allTotals
                A table of priority numbers with a count of notices for that priority.
                    (May be used in further processing for possible removal of lots of similar messages)
            resultObject
                A prototype object which will be added to and then returned as the final result of the NEXT notice processing step.
                Contains the following:
                    successList -- a list of strings noting what has been checked
                    numIgnored Notices (int)
                    numSuppressedWarnings (int)
                    processingOptions (a copy of the optionalProcessingOptions passed to these functions)
                    Any other fields that were part of the givenNoticeObject passed to these functions. These might include:
                        checkedFilenames -- list of strings
                        checkedRepos -- list of strings
                    depending on the type of check that was made.
    */
    //     console.log(`processNoticesCommon v${NOTICE_PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
    //   Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);


    const standardisedNoticeList = givenNoticeObject.noticeList;


    // Run a check through the noticeList to help discover any programming errors that need fixing
    // This section may be commented out of production code
    if (givenNoticeObject.noticeList && givenNoticeObject.noticeList.length) {
        const numberStore = {}, duplicatePriorityList = [];
        for (const thisGivenNotice of standardisedNoticeList) {
            const thisPriority = thisGivenNotice.priority, thisMsg = thisGivenNotice.message;
            console.assert(typeof thisPriority === 'number' && thisPriority > 0 && thisPriority < 10000, `BAD PRIORITY for ${JSON.stringify(thisGivenNotice)}`);
            console.assert(typeof thisMsg === 'string' && thisMsg.length > 10, `BAD MESSAGE for ${JSON.stringify(thisGivenNotice)}`);

            // Check that notice priority numbers are unique (to detect programming errors)
            const oldMsg = numberStore[thisPriority];
            if (oldMsg && oldMsg !== thisMsg && duplicatePriorityList.indexOf(thisPriority) < 0
                // Some of the messages include the troubling character in the message
                //    so we expect them to differ slightly
                && !thisMsg.startsWith('Mismatched ')
                && !thisMsg.startsWith('Unexpected doubled ')
                && !thisMsg.startsWith('Unexpected space after ')
                && !thisMsg.startsWith('Unexpected content after \\')
                && !thisMsg.startsWith('USFMGrammar: ')
                && !thisMsg.endsWith(' character after space')
                && !thisMsg.endsWith(' marker at start of line')
                && !thisMsg.endsWith(' closing character (no matching opener)')
                && !thisMsg.endsWith(' closing character doesn\'t match')
            ) {
                console.log(`PROGRAMMING ERROR: priority ${thisPriority} has at least two different messages: '${oldMsg}' and '${thisMsg}'`);
                duplicatePriorityList.push(thisPriority); // so that we only give the error once
            }

            // Check fields for bad values, and also across fields for unexpected combinations
            const thisRepoName = thisGivenNotice.repoName, thisFilename = thisGivenNotice.filename, thisLineNumber = thisGivenNotice.lineNumber,
                thisRowID = thisGivenNotice.rowID, thisFieldName = thisGivenNotice.fieldName, thisLocation = thisGivenNotice.location
            if (thisRepoName) {
                console.assert(thisRepoName.indexOf(' ') < 0 && thisRepoName.indexOf('/') < 0 && thisRepoName.indexOf('\\') < 0, `repoName '${thisRepoName}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                if (thisLocation)
                    console.assert(thisLocation.indexOf(thisRepoName) < 0, `repoName is repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisFilename) {
                console.assert(thisFilename.indexOf(':') < 0 && thisFilename.indexOf('\\') < 0, `filename '${thisFilename}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                // NOTE: Some OBS messages have to include part of the part in the 'filename' (to prevent ambiguity) so we don't disallow forward slash
                if (!thisRepoName || !thisRepoName.endsWith('_obs'))
                    console.assert(thisFilename.indexOf('/') < 0, `filename '${thisFilename}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                if (thisLocation)
                    console.assert(thisLocation.indexOf(thisFilename) < 0, `filename is repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisRowID) {
                console.assert(thisRowID.indexOf(' ') < 0 && thisRowID.indexOf('/') < 0 && thisRowID.indexOf('\\') < 0, `rowID '${thisRowID}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                if (thisLocation)
                    console.assert(thisLocation.indexOf(thisRowID) < 0, `rowID is repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisFieldName) {
                // NOTE: fieldName can be a USFM marker, e.g., 'from \w'
                console.assert(thisFieldName.indexOf('/') < 0, `fieldName '${thisFieldName}' contains unexpected characters in ${JSON.stringify(thisGivenNotice)}`);
                if (thisLocation)
                    console.assert(thisLocation.indexOf(thisFieldName) < 0, `fieldName is repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            if (thisLineNumber) {
                console.assert(typeof thisLineNumber === 'number' && thisLineNumber > 0, `lineNumber '${thisLineNumber}' contains unexpected value in ${JSON.stringify(thisGivenNotice)}`);
                // Note: lineNumber can occur in location, e.g., in 3 in '3JN' or 'Door43' so have to take extra care not to give false alarms
                if (thisLocation && thisLineNumber > 4 && thisLineNumber!==43)
                    // && (!thisGivenNotice.bookID || thisGivenNotice.bookID.indexOf(thisLineNumber + '') < 0)
                    console.assert(thisLocation.indexOf(thisLineNumber + '') < 0 && thisLocation.indexOf(thisLineNumber.toLocaleString()) < 0, `lineNumber might be repeated in location in ${JSON.stringify(thisGivenNotice)}`);
            }
            numberStore[thisPriority] = thisMsg;
        }
    }


    const resultObject = { // inititalise with our new fields
        numIgnoredNotices: 0,
        numSuppressedWarnings: 0,
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
    } catch (npfIPNLerror) { }
    if (ignorePriorityNumberList === undefined) {
        ignorePriorityNumberList = DEFAULT_IGNORE_PRIORITY_NUMBER_LIST;
        // console.log(`Using default ignorePriorityNumberList=${ignorePriorityNumberList}`);
    }
    else console.log(`Using supplied ignorePriorityNumberList=${ignorePriorityNumberList} cf. default=${DEFAULT_IGNORE_PRIORITY_NUMBER_LIST}`);
    let sortBy;
    try {
        sortBy = optionalProcessingOptions.sortBy;
    } catch (npfSBerror) { }
    if (sortBy === undefined) {
        sortBy = 'AsFound';
        // console.log(`Using default sortBy='${sortBy}'`);
    }
    // else console.log(`Using supplied sortBy='${sortBy}' cf. default='AsFound'`);
    let cutoffPriorityLevel;
    try {
        cutoffPriorityLevel = optionalProcessingOptions.cutoffPriorityLevel;
    } catch (npfCPLerror) { }
    if (cutoffPriorityLevel === undefined) {
        cutoffPriorityLevel = DEFAULT_CUTOFF_PRIORITY_LEVEL;
        // console.log(`Using default cutoffPriorityLevel=${cutoffPriorityLevel}`);
    }
    else console.log(`Using supplied cutoffPriorityLevel=${cutoffPriorityLevel} cf. default=${DEFAULT_CUTOFF_PRIORITY_LEVEL}`);
    // if (cutoffPriorityLevel > errorPriorityLevel)
    // resultObject.errorList.push({999, "Cutoff level must not be higher than error level", extract:`(${cutoffPriorityLevel} vs ${errorPriorityLevel})`, " in processNoticesCommon options"]);


    if (givenNoticeObject.successList)
        // Handle the successList
        if (givenNoticeObject.successList.length < 5)
            resultObject.successList = givenNoticeObject.successList;
        else { // successList is fairly long -- maybe we can shorten it by combining multiple similar messages
            const BibleRegex = /\d\d-(\w\w\w).usfm/; // "Checked JUD file: 66-JUD.usfm"
            const NotesRegex = /\d\d-(\w\w\w).tsv/; // "Checked EN_TN_01-GEN.TSV file: en_tn_01-GEN.tsv"
            resultObject.successList = [];
            const UHBBookList = [], UGNTBookList = [], ULTBookList = [], USTBookList = [], TNBookList = [];
            const USFMBookList = [], TSVNotesList = []
            for (const thisParticularSuccessMsg of givenNoticeObject.successList) {
                // console.log("thisParticularSuccessMessage", thisParticularSuccessMessage);
                let regexResult;
                if (thisParticularSuccessMsg.startsWith('Checked UHB file: '))
                    UHBBookList.push(thisParticularSuccessMsg.substring(18, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked UGNT file: '))
                    UHBBookList.push(thisParticularSuccessMsg.substring(19, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked ULT file: '))
                    ULTBookList.push(thisParticularSuccessMsg.substring(18, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked UST file: '))
                    USTBookList.push(thisParticularSuccessMsg.substring(18, thisParticularSuccessMsg.length))
                else if (thisParticularSuccessMsg.startsWith('Checked TN file: '))
                    TNBookList.push(thisParticularSuccessMsg.substring(17, thisParticularSuccessMsg.length))
                else if ((regexResult = BibleRegex.exec(thisParticularSuccessMsg)) !== null
                    // but don't do it for Book Package checks (in different repos)
                    && thisParticularSuccessMsg.startsWith(`Checked ${regexResult[1]} file`)) {
                    // console.log("regexResult", JSON.stringify(regexResult));
                    USFMBookList.push(regexResult[1]);
                }
                else if ((regexResult = NotesRegex.exec(thisParticularSuccessMsg)) !== null
                    // but don't do it for Book Package checks (in different repos)
                    && thisParticularSuccessMsg.startsWith(`Checked ${regexResult[1]} file`)) {
                    // console.log("regexResult", JSON.stringify(regexResult));
                    TSVNotesList.push(regexResult[1]);
                }
                else
                    resultObject.successList.push(thisParticularSuccessMsg); // Just copy it across
            }
            // Put summary messages at the beginning of the list
            if (TSVNotesList.length)
                resultObject.successList.unshift(`Checked ${TSVNotesList.length} TSV notes files: ${TSVNotesList.join(', ')}`);
            if (USFMBookList.length)
                resultObject.successList.unshift(`Checked ${USFMBookList.length} USFM Bible files: ${USFMBookList.join(', ')}`);
            if (TNBookList.length)
                resultObject.successList.unshift(`Checked ${TNBookList.length} TN files: ${TNBookList.join(', ')}`);
            if (USTBookList.length)
                resultObject.successList.unshift(`Checked ${USTBookList.length} UST files: ${USTBookList.join(', ')}`);
            if (ULTBookList.length)
                resultObject.successList.unshift(`Checked ${ULTBookList.length} ULT files: ${ULTBookList.join(', ')}`);
            if (UGNTBookList.length)
                resultObject.successList.unshift(`Checked ${UGNTBookList.length} UGNT files: ${UGNTBookList.join(', ')}`);
            if (UHBBookList.length)
                resultObject.successList.unshift(`Checked ${UHBBookList.length} UHB files: ${UHBBookList.join(', ')}`);
        }
    else resultObject.successList = [];

    // Handle the checkedFilenames list
    //  which might have 100s or 1,000s of .md filenames
    if (resultObject.checkedFilenames && resultObject.checkedFilenames.length > 10) {
        // console.log(`Have ${resultObject.checkedFilenames.length} checkedFilenames`);
        resultObject.checkedFilenames = [...new Set(resultObject.checkedFilenames)]; // Only keep unique ones
        // console.log(`Now have ${resultObject.checkedFilenames.length} checkedFilenames`);
        // console.log(JSON.stringify(resultObject.checkedFilenames));
    }

    // Specialised processing
    // If have s5 marker warnings, add one summary error
    // consoleLogObject('standardisedNoticeList', standardisedNoticeList);
    for (const thisParticularNotice of standardisedNoticeList) {
        // console.log("thisParticularNotice", JSON.stringify(thisParticularNotice));
        if (thisParticularNotice.message.indexOf('\\s5') >= 0) {
            const thisNewNotice = {
                ...thisParticularNotice, priority: 701, message: "\\s5 fields should be coded as \\ts\\* milestones", location: ` in ${givenNoticeObject.checkType}`,
                // I think we need to delete these fields below as they were probably set in thisParticularNotice
                C: undefined, V: undefined, characterIndex: undefined, extract: undefined
            };
            // if (thisParticularNotice.filename && thisParticularNotice.filename.length)
            //     thisNewNotice.filename = thisParticularNotice.filename; // Sometimes we have an additional file identifier
            // if (thisParticularNotice.repoName && thisParticularNotice.repoName.length)
            //     thisNewNotice.repoName = thisParticularNotice.repoName; // Sometimes we have an additional file identifier
            // if (thisParticularNotice.extra && thisParticularNotice.extra.length)
            //     thisNewNotice.extra = thisParticularNotice.extra; // Sometimes we have an additional file identifier
            standardisedNoticeList.push(thisNewNotice);
            break;
        }
    }

    // Remove any notices that they have asked us to ignore
    let remainingNoticeList;
    if (ignorePriorityNumberList.length) {
        // console.log("Doing ignore of", ignorePriorityNumberList.length,"value(s)");
        remainingNoticeList = [];
        for (const thisNotice of standardisedNoticeList)
            if (ignorePriorityNumberList.indexOf(thisNotice.priority) >= 0)
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
            if (thisNotice.priority < cutoffPriorityLevel)
                resultObject.numSuppressedWarnings++;
            else newNoticeList.push(thisNotice);
        remainingNoticeList = newNoticeList;
    }
    // if (cutoffPriorityLevel > errorPriorityLevel)
    // resultObject.errorList.push({999, "Cutoff level must not be higher than error level", extract:`(${cutoffPriorityLevel} vs ${errorPriorityLevel})`, " in processNoticesCommon options"]);

    // Sort the remainingNoticeList as required
    if (sortBy === 'ByPriority')
        remainingNoticeList.sort(function (a, b) { return b.priority - a.priority });
    else if (sortBy !== 'AsFound')
        console.log(`ERROR: Sorting '${sortBy}' is not implemented yet!!!`);

    /*
    // Add additional information fields to the location
    const newNoticeList = [];
    for (const thisNotice of remainingNoticeList) {
        const newNotice = thisNotice;
        if (newNotice.location) newNotice.location = newNotice.location.trim(); // Remove any leading spaces
        else newNotice.location = '';
        if (newNotice.repoName) newNotice.location = `in ${newNotice.filename} repoName ${newNotice.location}`
        if (newNotice.filename) newNotice.location = `in file ${newNotice.filename} ${newNotice.location}`;
        if (newNotice.rowID) newNotice.location = `with ID ${newNotice.rowID} ${newNotice.location}`;
        if (newNotice.lineNumber) newNotice.location = `in line ${newNotice.lineNumber} ${newNotice.location}`;
        if (newNotice.fieldName) newNotice.location = `in ${newNotice.fieldName} field ${newNotice.location}`;
        // Default is to prepend extra to the message
        //  This prevents errors/warnings from different repos or books from being combined
        if (newNotice.extra) newNotice.message = `${newNotice.extra} ${newNotice.message}`;
        newNoticeList.push(newNotice);
    }
    */

    // Add in extra location info if it's there
    // Default is to prepend it to the msg
    //  This prevents errors/warnings from different repos or books from being combined
    if (remainingNoticeList.length
        && remainingNoticeList[0].extra && remainingNoticeList[0].extra.length) {
        // console.log(`We need to add the extra location, e.g. '${remainingNoticeList[0][5]}': will prepend it to the messages`);
        const newNoticeList = [];
        for (const thisNotice of remainingNoticeList) {
            const thisExtra = thisNotice.extra;
            console.assert(thisExtra && thisExtra.length, `Expect thisNotice to have an "extra" field: ${JSON.stringify(thisNotice)}`)
            const newNotice = { ...thisNotice };
            // We don't need the extra field if we've already got this info
            if (thisExtra !== thisNotice.repoName && thisExtra !== thisNotice.bookID)
                newNotice.message = `${thisNotice.extra} ${thisNotice.message}`;
            delete newNotice.extra; // since we've used it (if it existed)
            newNoticeList.push(newNotice);
        }
        remainingNoticeList = newNoticeList;
    }

    // Count the number of occurrences of each message
    //  ready for further processing
    const allTotals = {};
    for (const thisNotice of remainingNoticeList)
        if (isNaN(allTotals[thisNotice.priority])) allTotals[thisNotice.priority] = 1;
        else allTotals[thisNotice.priority]++;

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
    //     console.log(`processNoticesToErrorsWarnings v${NOTICE_PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
    //    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.errorList = []; resultObject.warningList = [];
    resultObject.numSuppressedErrors = 0; resultObject.numSuppressedWarnings = 0;

    let maximumSimilarMessages;
    try {
        maximumSimilarMessages = optionalProcessingOptions.maximumSimilarMessages;
    } catch (npfMSMerror) { }
    if (typeof maximumSimilarMessages !== 'number' || isNaN(maximumSimilarMessages)) {
        maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
        // console.log(`Using default maximumSimilarMessages=${maximumSimilarMessages}`);
    }
    // else console.log(`Using supplied maximumSimilarMessages=${maximumSimilarMessages} cf. default=${DEFAULT_MAXIMUM_SIMILAR_MESSAGES}`);
    let errorPriorityLevel;
    try {
        errorPriorityLevel = optionalProcessingOptions.errorPriorityLevel;
    } catch (npfEPLerror) { }
    if (errorPriorityLevel === undefined) {
        errorPriorityLevel = DEFAULT_ERROR_PRIORITY_LEVEL;
        // console.log(`Using default errorPriorityLevel=${errorPriorityLevel}`);
    }
    else console.log(`Using supplied errorPriorityLevel=${errorPriorityLevel} cf. default=${DEFAULT_ERROR_PRIORITY_LEVEL}`);

    // Check for repeated notices that should be compressed
    //  while simultaneously separating into error and warning lists
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice.priority, thisMsg = thisNotice.message;
        const thisID = thisPriority + thisMsg; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisID])) counter[thisID] = 1;
        else counter[thisID]++;
        if (maximumSimilarMessages > 0 && counter[thisID] === maximumSimilarMessages + 1) {
            if (thisPriority >= errorPriorityLevel) {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.errorList.push({ priority: -1, message: thisMsg, location: ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR ERROR${numSuppressed === 1 ? '' : 'S'} SUPPRESSED` });
                resultObject.numSuppressedErrors++;
            } else {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.warningList.push({ priority: -1, message: thisMsg, location: ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR WARNING${numSuppressed === 1 ? '' : 'S'} SUPPRESSED` });
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
    //     console.log(`processNoticesToSevereMediumLow v${NOTICE_PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
    //    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.severeList = []; resultObject.mediumList = []; resultObject.lowList = [];
    resultObject.numSevereSuppressed = 0; resultObject.numMediumSuppressed = 0; resultObject.numLowSuppressed = 0;

    let maximumSimilarMessages;
    try {
        maximumSimilarMessages = optionalProcessingOptions.maximumSimilarMessages;
    } catch (npfMSMerror) { }
    if (typeof maximumSimilarMessages !== 'number' || isNaN(maximumSimilarMessages)) {
        maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
        // console.log(`Using default maximumSimilarMessages=${maximumSimilarMessages}`);
    }
    // else console.log(`Using supplied maximumSimilarMessages=${maximumSimilarMessages} cf. default=${DEFAULT_MAXIMUM_SIMILAR_MESSAGES}`);
    let severePriorityLevel;
    try {
        severePriorityLevel = optionalProcessingOptions.severePriorityLevel;
    } catch (npfSPLerror) { }
    if (severePriorityLevel === undefined) {
        severePriorityLevel = DEFAULT_SEVERE_PRIORITY_LEVEL;
        // console.log(`Using default severePriorityLevel=${severePriorityLevel}`);
    }
    else console.log(`Using supplied severePriorityLevel=${severePriorityLevel} cf. default=${DEFAULT_SEVERE_PRIORITY_LEVEL}`);
    let mediumPriorityLevel;
    try {
        mediumPriorityLevel = optionalProcessingOptions.mediumPriorityLevel;
    } catch (nfpMPLerror) { }
    if (mediumPriorityLevel === undefined) {
        mediumPriorityLevel = DEFAULT_MEDIUM_PRIORITY_LEVEL;
        // console.log(`Using default mediumPriorityLevel=${mediumPriorityLevel}`);
    }
    else console.log(`Using supplied mediumPriorityLevel=${mediumPriorityLevel} cf. default=${DEFAULT_MEDIUM_PRIORITY_LEVEL}`);

    // Check for repeated notices that should be compressed
    //  while simultaneously separating into error and warning lists
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice.priority, thisMsg = thisNotice.message;
        const thisID = thisPriority + thisMsg; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisID])) counter[thisID] = 1;
        else counter[thisID]++;
        if (maximumSimilarMessages > 0 && counter[thisID] === maximumSimilarMessages + 1) {
            if (thisPriority >= severePriorityLevel) {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.severeList.push({ priority: -1, message: thisMsg, location: ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR ERROR${numSuppressed === 1 ? '' : 'S'} SUPPRESSED` });
                resultObject.numSevereSuppressed++;
            } else if (thisPriority >= mediumPriorityLevel) {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.mediumList.push({ priority: -1, message: thisMsg, location: ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR ERROR${numSuppressed === 1 ? '' : 'S'} SUPPRESSED` });
                resultObject.numMediumSuppressed++;
            } else {
                const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
                resultObject.lowList.push({ priority: -1, message: thisMsg, location: ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR WARNING${numSuppressed === 1 ? '' : 'S'} SUPPRESSED` });
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
    //     console.log(`processNoticesToSingleList v${NOTICE_PROCESSOR_VERSION_STRING} with options=${JSON.stringify(optionalProcessingOptions)}
    //    Given ${givenNoticeObject.successList.length.toLocaleString()} success string(s) plus ${givenNoticeObject.noticeList.length.toLocaleString()} notice(s)`);

    // We default to sorting ByPriority unless something else was specified
    let sortBy;
    try {
        sortBy = optionalProcessingOptions.sortBy;
    } catch (npfSBerror) { }
    if (sortBy === undefined)
        optionalProcessingOptions.sortBy = 'ByPriority';

    const [remainingNoticeList, allTotals, resultObject] = processNoticesCommon(givenNoticeObject, optionalProcessingOptions);

    // Add the fields that we need here to the existing resultObject
    resultObject.warningList = []; resultObject.numSuppressedWarnings = 0;

    let maximumSimilarMessages;
    try {
        maximumSimilarMessages = optionalProcessingOptions.maximumSimilarMessages;
    } catch (npfMSMerror) { }
    if (typeof maximumSimilarMessages !== 'number' || isNaN(maximumSimilarMessages)) {
        maximumSimilarMessages = DEFAULT_MAXIMUM_SIMILAR_MESSAGES;
        // console.log(`Using default maximumSimilarMessages=${maximumSimilarMessages}`);
    }
    // else console.log(`Using supplied maximumSimilarMessages=${maximumSimilarMessages} cf. default=${DEFAULT_MAXIMUM_SIMILAR_MESSAGES}`);

    // Check for repeated notices that should be compressed
    //  while simultaneously creating warning list
    let counter = {};
    for (const thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice.priority, thisMsg = thisNotice.message;
        const thisID = thisPriority + thisMsg; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisID])) counter[thisID] = 1;
        else counter[thisID]++;
        if (maximumSimilarMessages > 0 && counter[thisID] === maximumSimilarMessages + 1) {
            const numSuppressed = allTotals[thisPriority] - maximumSimilarMessages;
            resultObject.warningList.push({ priority: thisPriority, message: thisMsg, location: ` ◄ ${numSuppressed.toLocaleString()} MORE SIMILAR WARNING${numSuppressed === 1 ? '' : 'S'} SUPPRESSED` });
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
