// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { OPEN_CLOSE_PUNCTUATION_PAIRS, BAD_CHARACTER_COMBINATIONS, LEADING_ZERO_COMBINATIONS, isWhitespace, countOccurrences } from './text-handling-functions'
// eslint-disable-next-line no-unused-vars
import { parameterAssert } from './utilities';


// const FIELD_TEXT_VALIDATOR_VERSION_STRING = '0.3.6';


/**
 * @description -- Does basic checks for small errors like leading/trailing spaces, etc.
 * @param {string} languageCode -- can be an empty string
 * @param {string} repoCode -- e.g., 'TN' or 'TQ2', etc.
 * @param {string} fieldType -- classification, e.g., TSV, USFM, YAML, link, markdown, raw
 * @param {string} fieldName -- used for identification
 * @param {string} fieldText -- the field being checked
 * @param {boolean} allowedLinks -- doesn’t check links -- only checks lack of links
 * @param {string} optionalFieldLocation -- used to inform where this field is located
 * @param {Object} checkingOptions
 */
export function checkTextField(languageCode, repoCode, fieldType, fieldName, fieldText, allowedLinks, optionalFieldLocation, checkingOptions) {
    // We assume that checking for compulsory fields is done elsewhere

    // Returns a single notice list
    //  The list contains objects with the following fields:
    //      priority (compulsory): the priority number 0..999 (usually 800+ are errors, lower are warnings)
    //      message (compulsory): the error description string
    //      characterIndex: the 0-based index for the position in the string
    //      excerpt: a short excerpt of the string containing the error (or empty-string if irrelevant)
    //      location: the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)
    // functionLog(`checkTextField(${fieldName}, ${fieldText.length.toLocaleString()} chars, ${allowedLinks}, '${optionalFieldLocation}')…`);
    //parameterAssert(languageCode !== undefined, "checkTextField: 'languageCode' parameter should be defined");
    //parameterAssert(typeof languageCode === 'string', `checkTextField: 'languageCode' parameter should be a string not a '${typeof languageCode}': ${languageCode}`);
    //parameterAssert(languageCode !== 'unfoldingWord', `checkTextField: 'languageCode' ${languageCode} parameter should be not be 'unfoldingWord'`);
    //parameterAssert(repoCode !== undefined, "checkTextField: 'repoCode' parameter should be defined");
    //parameterAssert(typeof repoCode === 'string', `checkTextField: 'repoCode' parameter should be a string not a '${typeof repoCode}': ${repoCode}`);
    //parameterAssert(REPO_CODES_LIST.includes(repoCode), `checkTextField: 'repoCode' parameter should not be '${repoCode}'`);
    //parameterAssert(fieldType !== undefined, "checkTextField: 'fieldType' parameter should be defined");
    //parameterAssert(typeof fieldType === 'string', `checkTextField: 'fieldType' parameter should be a string not a '${typeof fieldType}': ${fieldType}`);
    //parameterAssert(fieldType !== '', `checkTextField: 'fieldType' ${fieldType} parameter should be not be an empty string`);
    //parameterAssert(fieldType === 'markdown' || fieldType === 'USFM' || fieldType === 'YAML' || fieldType === 'text' || fieldType === 'raw' || fieldType === 'link', `checkTextField: unrecognised 'fieldType' parameter: '${fieldType}'`);
    //parameterAssert(fieldName !== undefined, "checkTextField: 'fieldName' parameter should be defined");
    //parameterAssert(typeof fieldName === 'string', `checkTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}': ${fieldName}`);
    // if (fieldType !== 'markdown')
    //     //parameterAssert(fieldName !== '', `checkTextField: ${fieldType} 'fieldName' parameter should be not be an empty string`);
    //parameterAssert(fieldText !== undefined, "checkTextField: 'fieldText' parameter should be defined");
    //parameterAssert(typeof fieldText === 'string', `checkTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}': ${fieldText}`);
    //parameterAssert(allowedLinks === true || allowedLinks === false, "checkTextField: allowedLinks parameter must be either true or false");
    if (!allowedLinks) { //parameterAssert(fieldText.indexOf('x-tw') < 0, `checkTextField should be allowedLinks for ${fieldType} ${fieldName} ${fieldText}`);
    }
    //parameterAssert(optionalFieldLocation !== undefined, "checkTextField: 'optionalFieldLocation' parameter should be defined");
    //parameterAssert(typeof optionalFieldLocation === 'string', `checkTextField: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}': ${optionalFieldLocation}`);
    //parameterAssert(optionalFieldLocation.indexOf('true') === -1, `checkTextField: 'optionalFieldLocation' parameter should not be '${optionalFieldLocation}'`);
    if (checkingOptions !== undefined) { //parameterAssert(typeof checkingOptions === 'object', `checkTextField: 'checkingOptions' parameter should be an object not a '${typeof checkingOptions}': ${JSON.stringify(checkingOptions)}`);
    }

    let result = { noticeList: [] };

    function addNoticePartial(noticeObject) {
        // We add the fieldName here
        // debugLog(`dBTC Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(noticeObject.priority !== undefined, "dBTCs addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `dBTCs addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "dBTCs addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `dBTCs addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "dBTCs addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `dBTCs addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "dBTCs addNoticePartial: 'excerpt' parameter should be defined");
        if (noticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `dBTCs addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "dBTCs addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `dBTCs addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // noticeObject.debugChain = noticeObject.debugChain ? `checkTextField(${fieldType}, ${fieldName}, ${allowedLinks}) ${noticeObject.debugChain}` : `checkTextField(${fieldType}, ${fieldName}, ${allowedLinks})`;
        if (fieldName.length) noticeObject.fieldName = fieldName; // Don’t add the field if it’s blank
        result.noticeList.push(noticeObject);
    }


    // Main code for checkTextField()
    if (!fieldText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the fieldName
    let ourLocation = optionalFieldLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (btcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    let suggestion = fieldText.trim();

    let characterIndex;
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 895)
        && (characterIndex = fieldText.indexOf('\u200B')) >= 0) {
        const charCount = countOccurrences(fieldText, '\u200B');
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/\u200B/g, '‼') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 895, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, characterIndex, excerpt, location: ourLocation });
        suggestion = suggestion.replace(/\u200B/g, ''); // Or should it be space ???
    }

    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 638)
        && isWhitespace(fieldText)) {
        addNoticePartial({ priority: 638, message: "Only found whitespace", location: ourLocation });
        return result;
    }

    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 993)
        && (characterIndex = fieldText.indexOf('<<<<<<<')) >= 0) {
        const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
        const excerpt = (iy > excerptHalfLength ? '…' : '') + fieldText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < fieldText.length ? '…' : '');

        addNoticePartial({ priority: 993, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
    } else {
        if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 992)
            && (characterIndex = fieldText.indexOf('=======')) >= 0) {
            const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
            const excerpt = (iy > excerptHalfLength ? '…' : '') + fieldText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 992, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
        } else {
            if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 991)
                && (characterIndex = fieldText.indexOf('>>>>>>>>')) >= 0) {
                const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
                const excerpt = (iy > excerptHalfLength ? '…' : '') + fieldText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                addNoticePartial({ priority: 991, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
            }
        }
    }

    if (fieldText[0] === ' ') {
        const excerpt = fieldText.substring(0, excerptLength).replace(/ /g, '␣') + (fieldText.length > excerptLength ? '…' : '');
        if (fieldText[1] === ' ') // spaces plural
            addNoticePartial({ priority: 110, message: `Unexpected leading spaces`, characterIndex: 0, excerpt, location: ourLocation });
        else
            addNoticePartial({ priority: 109, message: `Unexpected leading space`, characterIndex: 0, excerpt, location: ourLocation });
    } else if (fieldText[0] === '\u2060') {
        const excerpt = fieldText.substring(0, excerptLength).replace(/\u2060/g, '‼') + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 770, message: `Unexpected leading word-joiner`, characterIndex: 0, excerpt, location: ourLocation });
        if (suggestion[0] === '\u2060') suggestion = suggestion.substring(1);
    } else if (fieldText[0] === '\u200D') {
        const excerpt = fieldText.substring(0, excerptLength).replace(/\u200D/g, '‼') + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 771, message: `Unexpected leading zero-width joiner`, characterIndex: 0, excerpt, location: ourLocation });
        if (suggestion[0] === '\u200D') suggestion = suggestion.substring(1);
    }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 64)
        && (characterIndex = fieldText.indexOf('<br> ')) >= 0) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 64, message: "Unexpected leading space(s) after break", characterIndex, excerpt, location: ourLocation });
    }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 63)
        && (characterIndex = fieldText.indexOf('\\n ')) >= 0) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 63, message: "Unexpected leading space(s) after line break", characterIndex, excerpt, location: ourLocation });
    }

    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 772)
        && fieldText[fieldText.length - 1] === '\u2060') {
        const excerpt = fieldText.substring(0, excerptLength).replace(/\u2060/g, '‼') + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 772, message: `Unexpected trailing word-joiner`, characterIndex: 0, excerpt, location: ourLocation });
        if (suggestion[suggestion.length - 1] === '\u2060') suggestion = suggestion.substring(0, suggestion.length - 1);
    } else if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 773)
        && fieldText[fieldText.length - 1] === '\u200D') {
        const excerpt = fieldText.substring(0, excerptLength).replace(/\u200D/g, '‼') + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 773, message: `Unexpected trailing zero-width joiner`, characterIndex: 0, excerpt, location: ourLocation });
        if (suggestion[suggestion.length - 1] === '\u200D') suggestion = suggestion.substring(0, suggestion.length - 1);
    }

    // Find leading line breaks (but not if the whole line is just the line break sequence)
    const fieldTextLower = fieldText.toLowerCase();
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 107)
        && (fieldTextLower.substring(0, 2) === '\\n' || fieldTextLower.substring(0, 4) === '<br>' || fieldTextLower.substring(0, 5) === '<br/>' || fieldTextLower.substring(0, 6) === '<br />')
        && fieldTextLower !== '\\n' && fieldTextLower !== '<br>' && fieldTextLower !== '<br/>' && fieldTextLower !== '<br />') {
        const excerpt = fieldText.substring(0, excerptLength) + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 107, message: "Unexpected leading line break", characterIndex: 0, excerpt, location: ourLocation });
        while (suggestion.toLowerCase().substring(0, 2) === '\\n') suggestion = suggestion.substring(2);
        while (suggestion.toLowerCase().substring(0, 4) === '<br>') suggestion = suggestion.substring(4);
        while (suggestion.toLowerCase().substring(0, 5) === '<br/>') suggestion = suggestion.substring(5);
        while (suggestion.toLowerCase().substring(0, 6) === '<br />') suggestion = suggestion.substring(6);
    }

    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 95)
        && fieldText[fieldText.length - 1] === ' ')
        // Markdown gives meaning to two spaces at the end of a line
        if (fieldType !== 'markdown' || fieldText.length < 3 || fieldText[fieldText.length - 2] !== ' ' || fieldText[fieldText.length - 3] === ' ') {
            const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - 10).replace(/ /g, '␣');
            const notice = { priority: 95, message: "Unexpected trailing space(s)", excerpt, location: ourLocation };
            if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                notice.characterIndex = fieldText.length - 1; // characterIndex means nothing for processed USFM
            addNoticePartial(notice);
        }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 94)
        && (characterIndex = fieldText.indexOf(' <br')) >= 0) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 94, message: "Unexpected trailing space(s) before break", characterIndex, excerpt, location: ourLocation });
    }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 93)
        && (characterIndex = fieldText.indexOf(' \\n')) >= 0) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 93, message: "Unexpected trailing space(s) before line break", characterIndex, excerpt, location: ourLocation });
    }

    // Find trailing line breaks (but not if the whole line is just the line break sequence)
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 104)
        && (fieldTextLower.substring(fieldTextLower.length - 2) === '\\n' || fieldTextLower.substring(fieldTextLower.length - 4) === '<br>' || fieldTextLower.substring(fieldTextLower.length - 5) === '<br/>' || fieldTextLower.substring(fieldTextLower.length - 6) === '<br />')
        && fieldTextLower !== '\\n' && fieldTextLower !== '<br>' && fieldTextLower !== '<br/>' && fieldTextLower !== '<br />') {
        const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - 10);
        addNoticePartial({ priority: 104, message: "Unexpected trailing line break", characterIndex: fieldText.length - 1, excerpt, location: ourLocation });
        while (suggestion.toLowerCase().substring(suggestion.length - 2) === '\\n') suggestion = suggestion.substring(0, suggestion.length - 2);
        while (suggestion.toLowerCase().substring(suggestion.length - 4) === '<br>') suggestion = suggestion.substring(0, suggestion.length - 4);
        while (suggestion.toLowerCase().substring(suggestion.length - 5) === '<br/>') suggestion = suggestion.substring(0, suggestion.length - 5);
        while (suggestion.toLowerCase().substring(suggestion.length - 6) === '<br />') suggestion = suggestion.substring(0, suggestion.length - 6);
    }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 124)
        && (characterIndex = fieldText.indexOf('  ')) >= 0
        && (fieldType !== 'markdown' || characterIndex !== fieldText.length - 2)) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        const doubleCount = countOccurrences(fieldText, '  ');
        let notice;
        if (doubleCount === 1)
            notice = { priority: 124, message: "Unexpected double spaces", excerpt, location: ourLocation };
        else
            notice = { priority: 224, message: "Multiple unexpected double spaces", details: `${doubleCount} occurrences—only first is displayed`, excerpt, location: ourLocation };
        if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
            notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
        if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < notice.priority)
            addNoticePartial(notice);
        // Note: replacing double-spaces in the suggestion is done later -- after other suggestion modifications which might affect it
    }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 583)
        && (characterIndex = fieldText.indexOf('\n')) >= 0) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 583, message: "Unexpected newLine character", characterIndex, excerpt, location: ourLocation });
        suggestion = suggestion.replace(/\n/g, ' ');
    }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 582)
        && (characterIndex = fieldText.indexOf('\r')) >= 0) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 582, message: "Unexpected carriageReturn character", characterIndex, excerpt, location: ourLocation });
        suggestion = suggestion.replace(/\r/g, ' ');
    }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 581)
        && (characterIndex = fieldText.indexOf('\xA0')) >= 0) { // non-break space
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/\xA0/g, '⍽') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 581, message: "Unexpected non-break space (uA0) character", characterIndex, excerpt, location: ourLocation });
        suggestion = suggestion.replace(/\xA0/g, ' ');
    }
    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 580)
        && (characterIndex = fieldText.indexOf('\u202F')) >= 0) { // narrow non-break space
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/\u202F/g, '⍽') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        const notice = { priority: 580, message: "Unexpected narrow non-break space (u202F) character", excerpt, location: ourLocation };
        if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
            notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
        addNoticePartial(notice);
        suggestion = suggestion.replace(/\u202F/g, ' ');
    }
    if (fieldName === 'OrigQuote' || fieldName === 'Quote') {
        if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 179)
            && (characterIndex = fieldText.indexOf(' …')) >= 0) {
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 179, message: "Unexpected space before ellipse character", characterIndex, excerpt, location: ourLocation });
            suggestion = suggestion.replace(/ …/g, '…');
        }
        if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 178)
            && (characterIndex = fieldText.indexOf('… ')) >= 0) {
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 178, message: "Unexpected space after ellipse character", characterIndex, excerpt, location: ourLocation });
            suggestion = suggestion.replace(/… /g, '…');
        }
    }
    suggestion = suggestion.replace(/ {2}/g, ' ');

    if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 177) {
        // Check for doubled punctuation chars (international)
        // Doesn’t check for doubled forward slash by default coz that might occur in a link, e.g., https://etc…
        //  or doubled # coz that occurs in markdown
        let doubledPunctuationCheckList = '({}<>⟨⟩:،、‒–—―…!‹›«»‐?‘’“”\';⁄·&@•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (!allowedLinks) doubledPunctuationCheckList += '/[].)'; // Double square brackets can be part of markdown links, double periods can be part of a path
        if (fieldType !== 'markdown') doubledPunctuationCheckList += '_*#~'; // There are used for markdown formatting
        if (fieldType !== 'USFM' || fieldText.indexOf('x-morph') < 0) doubledPunctuationCheckList += ',"'; // Allowed in original language morphology fields
        if (fieldType !== 'YAML' || !fieldText.startsWith('--')) // NOTE: First hyphen may have been removed in preprocessing
            doubledPunctuationCheckList += '-';
        for (const punctChar of doubledPunctuationCheckList) {
            if ((characterIndex = fieldText.indexOf(punctChar + punctChar)) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                const notice = { priority: 177, message: `Unexpected doubled ${punctChar} characters`, excerpt, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }
    if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 195) {
        // Check for punctuation chars following space and at start of line
        //  Removed ©$€₱
        let afterSpaceCheckList = ')}>⟩:,،、‒–—―!.›»‐-?’”;/⁄·@•^†‡°¡¿※#№÷×ºª%‰‱¶′″‴§‖¦℗®℠™¤₳฿₵¢₡₢₫₯֏₠ƒ₣₲₴₭₺₾ℳ₥₦₧₰£៛₽₹₨₪৳₸₮₩¥';
        if (fieldType !== 'markdown') afterSpaceCheckList += '_*~'; // These are used for markdown formatting
        if (fieldType !== 'USFM' || (fieldText.indexOf('x-lemma') < 0 && fieldText.indexOf('x-tw') < 0)) afterSpaceCheckList += '|';
        if (fieldType !== 'YAML') afterSpaceCheckList += '\'"'; // These are used for YAML strings, e.g., version: '0.15'
        // if (fieldName === 'OrigQuote' || fieldName === 'Quote') afterSpaceCheckList += '…'; // NOT NEEDED -- this is specifically checked elsewhere
        for (const punctChar of afterSpaceCheckList) {
            if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 191)
                && (characterIndex = fieldText.indexOf(' ' + punctChar)) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                const notice = { priority: 191, message: `Unexpected ${punctChar} character after space`, excerpt, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
            if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 195)
                && (punctChar !== '-' || fieldType !== 'YAML')
                && (punctChar !== '!' || fieldType !== 'markdown') // image tag
                && fieldText[0] === punctChar) {
                characterIndex = 0;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                addNoticePartial({ priority: 195, message: `Unexpected ${punctChar} character at start of line`, characterIndex, excerpt, location: ourLocation });
            }
        }
        if (fieldType === 'USFM')
            suggestion = suggestion.replace(/| /g, '|');
    }

    if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 192) {
        // Check for punctuation chars before space
        //  Removed ' (can be normal, e.g., Jesus' cloak)
        //  Removed ©
        let beforeSpaceCheckList = '({<⟨،、‒–—―‹«‐‘“/⁄·@\\•^†‡°¡¿※№×ºª‰‱¶′″‴§|‖¦℗℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (fieldType !== 'markdown') beforeSpaceCheckList += '_~'; // These are used for markdown formatting
        if (fieldType !== 'markdown' && fieldType !== 'USFM') beforeSpaceCheckList += '*'; // There are used for markdown formatting and USFM closing markers
        if (fieldType !== 'YAML') beforeSpaceCheckList += '[';
        for (const punctChar of beforeSpaceCheckList) {
            if ((characterIndex = fieldText.indexOf(punctChar + ' ')) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                const notice = { priority: 192, message: `Unexpected space after ${punctChar} character`, excerpt, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }

    if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 193) {
        // Check for punctuation chars at end of line
        //  Removed ' (can be normal, e.g., Jesus' cloak)
        let beforeEOLCheckList = '([{<⟨،、‒–—―‹«‐‘“/⁄·@©\\•^†‡°¡¿※№×ºª‰‱¶′″‴§|‖¦℗℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (fieldType !== 'markdown') beforeEOLCheckList += '_~'; // These are used for markdown formatting
        if (fieldType !== 'markdown' && fieldType !== 'USFM') beforeEOLCheckList += '*'; // There are used for markdown formatting and USFM closing markers
        for (const punctChar of beforeEOLCheckList) {
            if (punctChar !== '—' && fieldText[fieldText.length - 1] === punctChar) {
                characterIndex = fieldText.length - 1;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                const notice = { priority: 193, message: `Unexpected ${punctChar} character at end of line`, excerpt, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }

    if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 849)
        // Check for bad combinations of characters
        for (const badCharCombination of BAD_CHARACTER_COMBINATIONS)
            if ((characterIndex = fieldText.indexOf(badCharCombination)) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                addNoticePartial({ priority: 849, message: `Unexpected '${badCharCombination}' character combination`, characterIndex, excerpt, location: ourLocation });
            }

    if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 92)
        // Check for leading zeroes in numbers
        for (const badZeroCharCombination of LEADING_ZERO_COMBINATIONS)
            if ((characterIndex = fieldText.indexOf(badZeroCharCombination)) >= 0
                // but not an error perhaps if followed by period, e.g., 0.32.
                && (fieldText.substring(characterIndex + badZeroCharCombination.length, characterIndex + badZeroCharCombination.length + 1) !== '.')) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                addNoticePartial({ priority: 92, message: `Unexpected leading zero`, characterIndex, excerpt, location: ourLocation });
            }

    // // Check for problems created by tC Create or something
    // characterIndex = fieldText.indexOf('\\[');
    // if (characterIndex === -1) characterIndex = fieldText.indexOf('\\]');
    // if (characterIndex !== -1) {
    //     const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
    //     addNoticePartial({ priority: 849, message: "Unexpected \\[ or \\] characters", characterIndex, excerpt, location: ourLocation });
    // }

    // if (countOccurrences(fieldText, '(') !== countOccurrences(fieldText, ')')) {
    //     userLog(`checkTextField(${fieldType}, ${fieldName}, '${fieldText}', ${allowedLinks}, ${ourLocation}) found ${countOccurrences(fieldText, '(')} '(' but ${countOccurrences(fieldText, ')')} ')'`);
    //     addNoticePartial({ priority: 1, message: `Mismatched ( ) characters`, details: `left=${countOccurrences(fieldText, '(').toLocaleString()}, right=${countOccurrences(fieldText, ')').toLocaleString()}`, location: ourLocation });
    // }
    // Check matched pairs in the field
    for (const punctSet of OPEN_CLOSE_PUNCTUATION_PAIRS) {
        // Can’t check '‘’' coz they might be used as apostrophe
        const leftChar = punctSet[0], rightChar = punctSet[1];
        // if (fieldType === 'markdown' && leftChar === '<') continue; // markdown uses this for block quote
        // TODO: The following 'continue' might not be doing the 2nd lot of checks
        if ((fieldType === 'USFM' || fieldName.startsWith('from \\') || (fieldType === 'markdown' && fieldName === ''))
            && '([{“‘«'.indexOf(leftChar) >= 0) continue; // Start/end can be on different lines
        if (fieldType !== 'markdown' || leftChar !== '<') { // > is a markdown block marker and also used for HTML, e.g., <br>
            const leftCount = countOccurrences(fieldText, leftChar),
                rightCount = countOccurrences(fieldText, rightChar);
            if (leftCount !== rightCount
                && (rightChar !== '’' || leftCount > rightCount)) { // Closing single quote is also used as apostrophe in English
                // NOTE: These are higher priority than similar checks in a whole file which is less specific
                const thisPriority = leftChar === '“' ? 163 : 563;
                if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < thisPriority)
                    addNoticePartial({ priority: thisPriority, message: `Mismatched ${leftChar}${rightChar} characters`, details: `left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });
            }
            try { // This regex build fails for some of the characters
                const leftRegex = new RegExp(`(\\w)\\${leftChar}(\\w)`, 'g'), rightRegex = new RegExp(`(\\w)\\${rightChar}(\\w)`, 'g');
                // debugLog(`leftRegex is ${leftRegex}`);
                let regexResultArray;
                while ((regexResultArray = leftRegex.exec(fieldText)))
                    if ((fieldType !== 'markdown' || regexResultArray[0][0] !== '_')
                        && (fieldType !== 'YAML' || leftChar !== '{')
                        // TODO: We have to allow for a blank language code until we change checkPlainText()
                        && (languageCode !== 'en' || regexResultArray[0][2] !== 's' || fieldText.indexOf('(s)') === -1)) {
                        // debugLog(`Got possible misplaced '${languageCode}' left ${leftChar} in ${fieldType} ${fieldName} '${fieldText}': ${JSON.stringify(regexResultArray)}`);
                        let thisPriority = 717, thisMessage = `Misplaced ${leftChar} character`;
                        if (leftChar === '(' && regexResultArray[0][2] === 's') { thisPriority = 17; thisMessage = `Possible misplaced ${leftChar} character`; } // Lower priority for words like 'thing(s)'
                        if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < thisPriority)
                            addNoticePartial({ priority: thisPriority, message: thisMessage, excerpt: regexResultArray[0], location: ourLocation });
                    }
                if (rightChar !== '’') // Can’t check '‘’' coz they might be used as apostrophe
                    while ((regexResultArray = rightRegex.exec(fieldText)))
                        if ((fieldType !== 'markdown' || regexResultArray[0][2] !== '_')
                            && (fieldType !== 'YAML' || rightChar !== '}')) {
                            // debugLog(`Got misplaced right ${rightChar} in ${fieldType} ${fieldName} '${fieldText}':`, JSON.stringify(regexResultArray));
                            if (!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 716)
                                addNoticePartial({ priority: 716, message: `Misplaced ${rightChar} character`, excerpt: regexResultArray[0], location: ourLocation });
                        }
            } catch { }
        }
    }

    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 765)
        && !allowedLinks) {
        // Simple check that there aren’t any
        characterIndex = fieldText.indexOf('://');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('http');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('ftp');
        // The following might have to be removed if text fields can contain email addresses
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.org');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.com');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.info');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.bible');
        if (characterIndex >= 0) {
            const excerpt = `${characterIndex > excerptHalfLength ? '…' : ''}${fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus)}${characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : ''}`
            addNoticePartial({ priority: 765, message: "Unexpected link", characterIndex, excerpt, location: ourLocation });
        }
    }

    // See if we have a suggestion
    if (suggestion !== fieldText) {
        // debugLog(`Had text ${fieldText}`);
        // debugLog(`Sug text ${suggestion}`);
        result.suggestion = suggestion;
    }

    return result;
}
// end of checkTextField function
