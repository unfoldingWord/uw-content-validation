const PROCESSOR_VERSION_STRING = '0.0.1';

const MAXIMUM_SIMILAR_MESSAGES = 3;
const DEFAULT_ERROR_PRIORITY_LEVEL = 700;
const IGNORE_PRIORITY_NUMBER_LIST = [];

export function processNotices(noticeObject, optionalOptions) {
    /*
        Expects to get an object with:
            successList: a list of strings describing what has been checked
            noticeList: a list of 5 components to notices, being:
                1/ A notice priority number in the range 1-1000.
                    Each different type of warning/error has a unique number
                      (but not each instance of those warnings/errors).
                    By default, notice priority numbers 700 and over are
                      considered `errors` and 0-699 are considered `warnings`.
                2/ The actual general description text of the notice
                3/ A zero-based integer index which indicates the position
                      of the error on the line or in the text as appropriate.
                    -1 indicates that this index does not contain any useful information.
                4/ An extract of the checked text which indicates the area
                      containing the problem.
                    Where helpful, some character substitutions have already been made,
                      for example, if the notice is about spaces,
                      it is generally helpful to display spaces as a visible
                      character in an attempt to best highlight the issue to the user.
                5/ A string indicating the context of the notice,
                        e.g., `in line 17 of 'someBook.usfm'.

        Available options are:
            errorPriorityLevel (integer; default is DEFAULT_ERROR_PRIORITY_LEVEL above)
            maximumSimilarMessages (integer; default is MAXIMUM_SIMILAR_MESSAGES above)
            sortBy ('AsFound' or 'ByPriority', default is 'AsFound')
            ignorePriorityList (list of integers, default is empty list, list of notice priority numbers to be ignored)
    */
    console.log("processNotices v" + PROCESSOR_VERSION_STRING, "with options=" + JSON.stringify(optionalOptions));
    console.log("  Given " + noticeObject.successList.length + " success strings plus " + noticeObject.noticeList.length + " notices");

    // Check that notice priority numbers are unique (to detect programming errors)
    // May be commented out of production code
    let numberStore = {};
    let errorList = [];
    for (let thisNotice of noticeObject.noticeList) {
        const thisPriority = thisNotice[0], thisMsg = thisNotice[1];
        const oldMsg = numberStore[thisPriority];
        if (oldMsg && oldMsg!=thisMsg && errorList.indexOf(thisPriority)<0
          && !thisMsg.endsWith(' character after space')) {
            console.log("PROGRAMMING ERROR:", thisPriority, "has at least two messages: '"+oldMsg+"' and '"+thisMsg+"'");
            errorList.push(thisPriority); // so that we only give the error once
        }
        numberStore[thisPriority] = thisMsg;
    }

    let resultObject = {
        successList: [], errorList: [], warningList: [],
        numIgnoredNotices: 0, numSuppressedErrors: 0, numSuppressedWarnings: 0
    };

    // Process successList strings
    //  (We don't actually do any processing on these so just copy them across)
    resultObject.successList = noticeObject.successList;

    // Remove notices that they have asked up to ignore
    let ignorePriorityNumberList;
    try {
        ignorePriorityNumberList = optionalOptions.ignorePriorityList;
        console.log("Using supplied ignorePriorityNumberList=" + ignorePriorityNumberList);
    } catch (e) {
        ignorePriorityNumberList = IGNORE_PRIORITY_NUMBER_LIST;
        console.log("Using default ignorePriorityNumberList=" + ignorePriorityNumberList);
    }
    let remainingNoticeList;
    if (ignorePriorityNumberList.length) {
        // console.log("Doing ignore of", ignorePriorityNumberList.length,"value(s)");
        remainingNoticeList = [];
        for (let thisNotice of noticeObject.noticeList) {
            if (ignorePriorityNumberList.indexOf(thisNotice[0]) >= 0)
                resultObject.numIgnoredNotices++;
            else
                remainingNoticeList.push(thisNotice);
            }
    } else
        remainingNoticeList = noticeObject.noticeList;
    if (resultObject.numIgnoredNotices)
        console.log("Ignored " + resultObject.numIgnoredNotices + " notices");

    // Sort the remainingNoticeList as required
    let sortBy;
    try {
        sortBy = optionalOptions.sortBy;
        console.log("Using supplied sortBy='" + sortBy + "'");
    } catch (e) {
        sortBy = 'AsFound';
        console.log("Using default sortBy='" + sortBy + "'");
    }
    if (sortBy == 'ByPriority')
        remainingNoticeList.sort(function (a, b){return b[0]-a[0]});
    else if (sortBy != 'AsFound')
        console.log("ERROR: Sorting '"+sortBy+"' is not implemented yet!!!");

    // Check for repeated notices that should be compressed
    //  while simultaneously separating into error and warning lists
    let errorPriorityLevel;
    try {
        errorPriorityLevel = optionalOptions.errorPriorityLevel;
        console.log("Using supplied errorPriorityLevel=" + errorPriorityLevel);
    } catch (e) {
        errorPriorityLevel = DEFAULT_ERROR_PRIORITY_LEVEL;
        console.log("Using default errorPriorityLevel=" + errorPriorityLevel);
    }
    let maximumSimilarMessages;
    try {
        maximumSimilarMessages = optionalOptions.maximumSimilarMessages;
        console.log("Using supplied maximumSimilarMessages=" + maximumSimilarMessages);
    } catch (e) {
        maximumSimilarMessages = MAXIMUM_SIMILAR_MESSAGES;
        console.log("Using default maximumSimilarMessages=" + maximumSimilarMessages);
    }
    let counter = {};
    for (let thisNotice of remainingNoticeList) {
        const thisPriority = thisNotice[0], thisMsg = thisNotice[1];
        const thisID = thisPriority + thisMsg; // Could have identical worded messages but with different priorities
        if (isNaN(counter[thisID])) counter[thisID] = 1;
        else counter[thisID]++;
        if (counter[thisID] == maximumSimilarMessages+1) {
            if (thisPriority >= errorPriorityLevel)
                resultObject.errorList.push([-1, thisMsg, -1, '', ' ◄ MORE SIMILAR ERRORS SUPPRESSED']);
            else
                resultObject.warningList.push([-1, thisMsg, -1, '', ' ◄ MORE SIMILAR WARNINGS SUPPRESSED']);
        } else if (counter[thisID] > maximumSimilarMessages+1) {
            if (thisPriority >= errorPriorityLevel)
                resultObject.numSuppressedErrors++;
            else
                resultObject.numSuppressedWarnings++;
        } else if (thisPriority >= errorPriorityLevel)
            resultObject.errorList.push(thisNotice);
        else
            resultObject.warningList.push(thisNotice);
    }

    // console.log("processNotices is returning", resultObject.successList.length, "successes,", resultObject.errorList.length, "errors, and", resultObject.warningList.length, "warnings");
    // console.log("  numIgnoredNotices="+resultObject.numIgnoredNotices, "numSuppressedErrors="+resultObject.numSuppressedErrors, "numSuppressedWarnings="+resultObject.numSuppressedWarnings);
    return resultObject;
}
// end of processNotices function


export default processNotices;