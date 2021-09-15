// eslint-disable-next-line no-unused-vars
import { DEFAULT_EXCERPT_LENGTH, REPO_CODES_LIST } from './defaults'
import { OPEN_CLOSE_PUNCTUATION_PAIRS, BAD_CHARACTER_COMBINATIONS, BAD_CHARACTER_REGEXES, LEADING_ZERO_COMBINATIONS, isWhitespace, countOccurrencesInString } from './text-handling-functions'
// eslint-disable-next-line no-unused-vars
import { debugLog, parameterAssert } from './utilities';


// const FIELD_TEXT_VALIDATOR_VERSION_STRING = '0.3.13';


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
    // if (!fieldType.startsWith('markdown'))
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

    function addNoticePartial(incompleteNoticeObject) {
        // We add the fieldName here
        // debugLog(`dBTC Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${excerpt ? ` ${excerpt}` : ""}${location}`);
        //parameterAssert(noticeObject.priority !== undefined, "dBTCs addNoticePartial: 'priority' parameter should be defined");
        //parameterAssert(typeof noticeObject.priority === 'number', `dBTCs addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        //parameterAssert(noticeObject.message !== undefined, "dBTCs addNoticePartial: 'message' parameter should be defined");
        //parameterAssert(typeof noticeObject.message === 'string', `dBTCs addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // //parameterAssert(characterIndex !== undefined, "dBTCs addNoticePartial: 'characterIndex' parameter should be defined");
        if (incompleteNoticeObject.characterIndex) { //parameterAssert(typeof noticeObject.characterIndex === 'number', `dBTCs addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        }
        // //parameterAssert(excerpt !== undefined, "dBTCs addNoticePartial: 'excerpt' parameter should be defined");
        if (incompleteNoticeObject.excerpt) { //parameterAssert(typeof noticeObject.excerpt === 'string', `dBTCs addNoticePartial: 'excerpt' parameter should be a string not a '${typeof noticeObject.excerpt}': ${noticeObject.excerpt}`);
        }
        //parameterAssert(noticeObject.location !== undefined, "dBTCs addNoticePartial: 'location' parameter should be defined");
        //parameterAssert(typeof noticeObject.location === 'string', `dBTCs addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // noticeObject.debugChain = noticeObject.debugChain ? `checkTextField(${fieldType}, ${fieldName}, ${allowedLinks}) ${noticeObject.debugChain}` : `checkTextField(${fieldType}, ${fieldName}, ${allowedLinks})`;
        if (fieldName.length && !fieldName.endsWith(' line')) incompleteNoticeObject.fieldName = fieldName; // Don’t add the field if it’s blank
        result.noticeList.push(incompleteNoticeObject);
    }


    // Main code for checkTextField()
    if (!fieldText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the fieldName
    let ourLocation = optionalFieldLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const cutoffPriorityLevel = checkingOptions?.cutoffPriorityLevel ? checkingOptions?.cutoffPriorityLevel : 0;
    // debugLog(`checkTextField: Using cutoffPriorityLevel=${cutoffPriorityLevel} ${typeof cutoffPriorityLevel} ${cutoffPriorityLevel < 200}`);

    let excerptLength;
    try {
        excerptLength = checkingOptions?.excerptLength;
    } catch (btcError) { }
    if (typeof excerptLength !== 'number' || isNaN(excerptLength)) {
        excerptLength = DEFAULT_EXCERPT_LENGTH;
        // debugLog(`checkTextField: Using default excerptLength=${excerptLength}`);
    }
    // else
    // debugLog(`checkTextField: Using supplied excerptLength=${excerptLength}`, `cf. default=${DEFAULT_EXCERPT_LENGTH}`);
    const excerptHalfLength = Math.floor(excerptLength / 2); // rounded down
    const excerptHalfLengthPlus = Math.floor((excerptLength + 1) / 2); // rounded up
    // debugLog(`checkTextField: Using excerptHalfLength=${excerptHalfLength}`, `excerptHalfLengthPlus=${excerptHalfLengthPlus}`);

    let suggestion = fieldText.trim();

    let characterIndex;
    if (cutoffPriorityLevel < 895 && (characterIndex = fieldText.indexOf('\u200B')) !== -1) {
        const charCount = countOccurrencesInString(fieldText, '\u200B');
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/\u200B/g, '‼') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 895, message: "Field contains zero-width space(s)", details: `${charCount} occurrence${charCount === 1 ? '' : 's'} found`, characterIndex, excerpt, location: ourLocation });
        suggestion = suggestion.replace(/\u200B/g, ''); // Or should it be space ???
    }

    if (cutoffPriorityLevel < 638 && isWhitespace(fieldText)) {
        addNoticePartial({ priority: 638, message: "Only found whitespace", location: ourLocation });
        return result;
    }

    if (cutoffPriorityLevel < 993 && (characterIndex = fieldText.indexOf('<<<<<<<')) !== -1) {
        const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
        const excerpt = (iy > excerptHalfLength ? '…' : '') + fieldText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < fieldText.length ? '…' : '');

        addNoticePartial({ priority: 993, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
    } else {
        if (cutoffPriorityLevel < 992 && (characterIndex = fieldText.indexOf('=======')) !== -1) {
            const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
            const excerpt = (iy > excerptHalfLength ? '…' : '') + fieldText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 992, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
        } else {
            if (cutoffPriorityLevel < 991 && (characterIndex = fieldText.indexOf('>>>>>>>>')) !== -1) {
                const iy = characterIndex + excerptHalfLength; // Want excerpt to focus more on what follows
                const excerpt = (iy > excerptHalfLength ? '…' : '') + fieldText.substring(iy - excerptHalfLength, iy + excerptHalfLengthPlus).replace(/ /g, '␣') + (iy + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                addNoticePartial({ priority: 991, message: "Unresolved GIT conflict", characterIndex, excerpt, location: ourLocation });
            }
        }
    }

    if (fieldText[0] === ' ') {
        const excerpt = fieldText.slice(0, excerptLength).replace(/ /g, '␣') + (fieldText.length > excerptLength ? '…' : '');
        if (fieldText[1] === ' ') // spaces plural
            addNoticePartial({ priority: 110, message: `Unexpected leading spaces`, characterIndex: 0, excerpt, location: ourLocation });
        else
            addNoticePartial({ priority: 109, message: `Unexpected leading space`, characterIndex: 0, excerpt, location: ourLocation });
    } else if (fieldText[0] === '\u2060') {
        const excerpt = fieldText.slice(0, excerptLength).replace(/\u2060/g, '‼') + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 770, message: `Unexpected leading word-joiner (u2060) character`, characterIndex: 0, excerpt, location: ourLocation });
        if (suggestion[0] === '\u2060') suggestion = suggestion.slice(1);
    } else if (fieldText[0] === '\u200D') {
        const excerpt = fieldText.slice(0, excerptLength).replace(/\u200D/g, '‼') + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 771, message: `Unexpected leading zero-width joiner (u200D) character`, characterIndex: 0, excerpt, location: ourLocation });
        if (suggestion[0] === '\u200D') suggestion = suggestion.slice(1);
    }
    if (cutoffPriorityLevel < 64 && (characterIndex = fieldText.indexOf('<br> ')) !== -1) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 64, message: "Unexpected leading space(s) after break", characterIndex, excerpt, location: ourLocation });
    }
    if (cutoffPriorityLevel < 63 && (characterIndex = fieldText.indexOf('\\n ')) !== -1) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 63, message: "Unexpected leading space(s) after line break", characterIndex, excerpt, location: ourLocation });
    }

    if (cutoffPriorityLevel < 772 && fieldText[fieldText.length - 1] === '\u2060') {
        const excerpt = fieldText.slice(0, excerptLength).replace(/\u2060/g, '‼') + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 772, message: `Unexpected trailing word-joiner (u2060) character`, characterIndex: 0, excerpt, location: ourLocation });
        if (suggestion[suggestion.length - 1] === '\u2060') suggestion = suggestion.slice(0, suggestion.length - 1);
    } else if (cutoffPriorityLevel < 773 && fieldText[fieldText.length - 1] === '\u200D') {
        const excerpt = fieldText.slice(0, excerptLength).replace(/\u200D/g, '‼') + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 773, message: `Unexpected trailing zero-width joiner (u200D) character`, characterIndex: 0, excerpt, location: ourLocation });
        if (suggestion[suggestion.length - 1] === '\u200D') suggestion = suggestion.slice(0, suggestion.length - 1);
    }

    // Find leading line breaks (but not if the whole line is just the line break sequence)
    const fieldTextLower = fieldText.toLowerCase();
    if (cutoffPriorityLevel < 107
        && (fieldTextLower.slice(0, 2) === '\\n' || fieldTextLower.slice(0, 4) === '<br>' || fieldTextLower.slice(0, 5) === '<br/>' || fieldTextLower.slice(0, 6) === '<br />')
        && fieldTextLower !== '\\n' && fieldTextLower !== '<br>' && fieldTextLower !== '<br/>' && fieldTextLower !== '<br />') {
        const excerpt = fieldText.slice(0, excerptLength) + (fieldText.length > excerptLength ? '…' : '');
        addNoticePartial({ priority: 107, message: "Unexpected leading line break", characterIndex: 0, excerpt, location: ourLocation });
        while (suggestion.toLowerCase().slice(0, 2) === '\\n') suggestion = suggestion.slice(2);
        while (suggestion.toLowerCase().slice(0, 4) === '<br>') suggestion = suggestion.slice(4);
        while (suggestion.toLowerCase().slice(0, 5) === '<br/>') suggestion = suggestion.slice(5);
        while (suggestion.toLowerCase().slice(0, 6) === '<br />') suggestion = suggestion.slice(6);
    }

    if (cutoffPriorityLevel < 95 && fieldText[fieldText.length - 1] === ' ')
        // Markdown gives meaning to two spaces at the end of a line
        if (!fieldType.startsWith('markdown') || fieldText.length < 3 || fieldText[fieldText.length - 2] !== ' ' || fieldText[fieldText.length - 3] === ' ') {
            const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - 10).replace(/ /g, '␣');
            const notice = { priority: 95, message: "Unexpected trailing space(s)", excerpt, location: ourLocation };
            if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.slice(0, 6) !== 'from \\')
                notice.characterIndex = fieldText.length - 1; // characterIndex means nothing for processed USFM
            addNoticePartial(notice);
        }
    if (cutoffPriorityLevel < 94 && (characterIndex = fieldText.indexOf(' <br')) !== -1) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 94, message: "Unexpected trailing space(s) before break", characterIndex, excerpt, location: ourLocation });
    }
    if (cutoffPriorityLevel < 93 && (characterIndex = fieldText.indexOf(' \\n')) !== -1) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 93, message: "Unexpected trailing space(s) before line break", characterIndex, excerpt, location: ourLocation });
    }

    // Find trailing line breaks (but not if the whole line is just the line break sequence)
    if (cutoffPriorityLevel < 104
        && (fieldTextLower.substring(fieldTextLower.length - 2) === '\\n' || fieldTextLower.substring(fieldTextLower.length - 4) === '<br>' || fieldTextLower.substring(fieldTextLower.length - 5) === '<br/>' || fieldTextLower.substring(fieldTextLower.length - 6) === '<br />')
        && fieldTextLower !== '\\n' && fieldTextLower !== '<br>' && fieldTextLower !== '<br/>' && fieldTextLower !== '<br />') {
        const excerpt = (fieldText.length > excerptLength ? '…' : '') + fieldText.substring(fieldText.length - 10);
        addNoticePartial({ priority: 104, message: "Unexpected trailing line break", characterIndex: fieldText.length - 1, excerpt, location: ourLocation });
        while (suggestion.toLowerCase().substring(suggestion.length - 2) === '\\n') suggestion = suggestion.substring(0, suggestion.length - 2);
        while (suggestion.toLowerCase().substring(suggestion.length - 4) === '<br>') suggestion = suggestion.substring(0, suggestion.length - 4);
        while (suggestion.toLowerCase().substring(suggestion.length - 5) === '<br/>') suggestion = suggestion.substring(0, suggestion.length - 5);
        while (suggestion.toLowerCase().substring(suggestion.length - 6) === '<br />') suggestion = suggestion.substring(0, suggestion.length - 6);
    }
    if (cutoffPriorityLevel < 124
        && (characterIndex = fieldText.indexOf('  ')) >= 0
        && (!fieldType.startsWith('markdown') || characterIndex !== fieldText.length - 2)) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/ /g, '␣') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        const doubleCount = countOccurrencesInString(fieldText, '  ');
        let notice;
        if (doubleCount === 1)
            notice = { priority: 124, message: "Unexpected double spaces", excerpt, location: ourLocation };
        else
            notice = { priority: 224, message: "Multiple unexpected double spaces", details: `${doubleCount} occurrences—only first is displayed`, excerpt, location: ourLocation };
        if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.slice(0, 6) !== 'from \\')
            notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
        if (cutoffPriorityLevel < notice.priority)
            addNoticePartial(notice);
        // Note: replacing double-spaces in the suggestion is done later -- after other suggestion modifications which might affect it
    }
    if (cutoffPriorityLevel < 583 && (characterIndex = fieldText.indexOf('\n')) !== -1) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 583, message: "Unexpected newLine character", characterIndex, excerpt, location: ourLocation });
        suggestion = suggestion.replace(/\n/g, ' ');
    }
    if (cutoffPriorityLevel < 582 && (characterIndex = fieldText.indexOf('\r')) !== -1) {
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        addNoticePartial({ priority: 582, message: "Unexpected carriageReturn character", characterIndex, excerpt, location: ourLocation });
        suggestion = suggestion.replace(/\r/g, ' ');
    }
    if (cutoffPriorityLevel < 581 && (characterIndex = fieldText.indexOf('\xA0')) !== -1) { // non-break space
        const previousCharacter = characterIndex === 0 ? '' : fieldText.substring(characterIndex - 1, characterIndex);
        const nextCharacter = characterIndex === fieldText.length - 1 ? '' : fieldText.slice(characterIndex + 1, characterIndex + 2);
        if (previousCharacter !== '«' && previousCharacter !== '‹' && nextCharacter !== '»' && nextCharacter !== '›') { // For French punctuation
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/\xA0/g, '⍽') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 581, message: "Unexpected non-break space (u00A0) character", characterIndex, excerpt, location: ourLocation });
            suggestion = suggestion.replace(/\xA0/g, ' ');
        }
    }
    if (cutoffPriorityLevel < 580 && (characterIndex = fieldText.indexOf('\u202F')) !== -1) { // narrow non-break space
        const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus).replace(/\u202F/g, '⍽') + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
        const notice = { priority: 580, message: "Unexpected narrow non-break space (u202F) character", excerpt, location: ourLocation };
        if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.slice(0, 6) !== 'from \\')
            notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
        addNoticePartial(notice);
        suggestion = suggestion.replace(/\u202F/g, ' ');
    }
    if (fieldName === 'OrigQuote' || fieldName === 'Quote') {
        if (cutoffPriorityLevel < 179 && (characterIndex = fieldText.indexOf(' …')) !== -1) {
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 179, message: "Unexpected space before ellipse character", characterIndex, excerpt, location: ourLocation });
            suggestion = suggestion.replace(/ …/g, '…');
        }
        if (cutoffPriorityLevel < 178 && (characterIndex = fieldText.indexOf('… ')) !== -1) {
            const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
            addNoticePartial({ priority: 178, message: "Unexpected space after ellipse character", characterIndex, excerpt, location: ourLocation });
            suggestion = suggestion.replace(/… /g, '…');
        }
    }
    suggestion = suggestion.replace(/ {2}/g, ' ');

    if (cutoffPriorityLevel < 177) {
        // Check for doubled punctuation chars (international)
        // Doesn’t check for doubled forward slash by default coz that might occur in a link, e.g., https://etc…
        //  or doubled # coz that occurs in markdown
        let doubledPunctuationCheckList = '({}<>⟨⟩:،、‒–—―…!‹›«»‐?‘’“”\';⁄·&@•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (!allowedLinks) doubledPunctuationCheckList += '/[].)'; // Double square brackets can be part of markdown links, double periods can be part of a path
        if (!fieldType.startsWith('markdown')) doubledPunctuationCheckList += '_*#~'; // There are used for markdown formatting
        if (!fieldType.startsWith('USFM') || fieldText.indexOf('x-morph') < 0) doubledPunctuationCheckList += ',"'; // Allowed in original language morphology fields
        if (!fieldType.startsWith('YAML') || !fieldText.startsWith('--')) // NOTE: First hyphen may have been removed in preprocessing
            doubledPunctuationCheckList += '-';
        for (const punctChar of doubledPunctuationCheckList) {
            if ((characterIndex = fieldText.indexOf(punctChar + punctChar)) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                const notice = { priority: 177, message: `Unexpected doubled ${punctChar} characters`, excerpt, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.slice(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }
    if (cutoffPriorityLevel < 195) {
        // Check for punctuation chars following space and at start of line
        //  Removed © and leading currency symbols $€₱
        // Note that this works for French punctuation, because ?! etc, should be preceded by a non-breaking space (not a regular space)
        let afterSpaceCheckList = ')}>⟩:,،、‒–—―!.›»‐-?’”;/⁄·@•^†‡°¡¿※#№÷×ºª%‰‱¶′″‴§‖¦℗®℠™¤₳฿₵¢₡₢₫₯֏₠ƒ₣₲₴₭₺₾ℳ₥₦₧₰£៛₽₹₨₪৳₸₮₩¥';
        // if (['en','hbo','el-x-koine'].includes(languageCode) ) afterSpaceCheckList += '’'; // These languages don't have words starting with apostrophe/right-single-quotation-mark
        if (!fieldType.startsWith('markdown')) afterSpaceCheckList += '_*~'; // These are used for markdown formatting
        if (!fieldType.startsWith('USFM') || (fieldText.indexOf('x-lemma') < 0 && fieldText.indexOf('x-tw') < 0)) afterSpaceCheckList += '|';
        if (!fieldType.startsWith('YAML')) afterSpaceCheckList += '\'"'; // These are used for YAML strings, e.g., version: '0.15'
        // if (fieldName === 'OrigQuote' || fieldName === 'Quote') afterSpaceCheckList += '…'; // NOT NEEDED -- this is specifically checked elsewhere
        for (const punctCharBeingChecked of afterSpaceCheckList) {
            if (cutoffPriorityLevel < 191 && (characterIndex = fieldText.indexOf(' ' + punctCharBeingChecked)) >= 0) {
                const nextChar = fieldText.slice(characterIndex + 1, characterIndex + 2);
                if (punctCharBeingChecked !== '-' || '1234567890'.indexOf(nextChar) === -1) { // Allow negative numbers, e.g., -1
                    const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                    // Lower priority for em-dash in markdown and for forward slash (used to list alternatives, e.g., "yes / no")
                    const notice = { priority: 191 /* can be lowered to 71 */, message: `Unexpected ${punctCharBeingChecked} character after space`, excerpt, location: ourLocation };
                    if (((punctCharBeingChecked === '—' || punctCharBeingChecked === '/') && fieldType.startsWith('markdown'))
                        || (punctCharBeingChecked === '’' && !['en', 'hbo', 'el-x-koine'].includes(languageCode))) // Some other languages allow words to start with apostrophes
                        notice.priority = 71; // Lower the priority from 191
                    if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.slice(0, 6) !== 'from \\')
                        notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                    addNoticePartial(notice);
                }
            }
            if (cutoffPriorityLevel < 195
                && (punctCharBeingChecked !== '-' || !(fieldType.startsWith('YAML') || fieldType.startsWith('markdown')))
                && (punctCharBeingChecked !== '!' || !fieldType.startsWith('markdown')) // image tag
                && fieldText[0] === punctCharBeingChecked) {
                characterIndex = 0;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                addNoticePartial({ priority: 195, message: `Unexpected ${punctCharBeingChecked} character at start of line`, characterIndex, excerpt, location: ourLocation });
            }
        }
        if (fieldType.startsWith('USFM'))
            suggestion = suggestion.replace(/| /g, '|');
    }

    if (cutoffPriorityLevel < 192) {
        // Check for punctuation chars before space
        //  Removed ' (can be normal, e.g., Jesus' cloak)
        //  Removed ©
        let beforeSpaceCheckList = '({<⟨،、‒–—―‹«‐‘“/⁄·@\\•^†‡°¡¿※№×ºª‰‱¶′″‴§|‖¦℗℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (!fieldType.startsWith('markdown')) beforeSpaceCheckList += '_~'; // These are used for markdown formatting
        if (!fieldType.startsWith('markdown') && !fieldType.startsWith('USFM')) beforeSpaceCheckList += '*'; // There are used for markdown formatting and USFM closing markers
        if (!fieldType.startsWith('YAML')) beforeSpaceCheckList += '[';
        for (const punctCharBeingChecked of beforeSpaceCheckList) {
            if ((characterIndex = fieldText.indexOf(punctCharBeingChecked + ' ')) !== -1) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                // Lower priority for em-dash in markdown and for forward slash (used to list alternatives, e.g., "yes / no")
                // debugLog(`Got space after ${punctCharBeingChecked} in ${fieldType} around ${excerpt}: priority ${punctCharBeingChecked === '—' && fieldType.startsWith('markdown') ? 72 : 192}`);
                const notice = { priority: (punctCharBeingChecked === '—' || punctCharBeingChecked === '/') && fieldType.startsWith('markdown') ? 72 : 192, message: `Unexpected space after ${punctCharBeingChecked} character`, excerpt, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.slice(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }

    if (cutoffPriorityLevel < 193) {
        // Check for punctuation chars at end of line
        //  Removed ' (can be normal, e.g., Jesus' cloak)
        let beforeEOLCheckList = '([{<⟨،、‒–—―‹«‐‘“/⁄·@©\\•^†‡°¡¿※№×ºª‰‱¶′″‴§|‖¦℗℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (!fieldType.startsWith('markdown')) beforeEOLCheckList += '_~'; // These are used for markdown formatting
        if (!fieldType.startsWith('markdown') && !fieldType.startsWith('USFM')) beforeEOLCheckList += '*'; // There are used for markdown formatting and USFM closing markers
        for (const punctChar of beforeEOLCheckList) {
            if (punctChar !== '—' && fieldText[fieldText.length - 1] === punctChar) {
                characterIndex = fieldText.length - 1;
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                const notice = { priority: 193, message: `Unexpected ${punctChar} character at end of line`, excerpt, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.slice(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }

    if (cutoffPriorityLevel < 849)
        // Check for bad combinations of characters
        for (const badCharCombination of BAD_CHARACTER_COMBINATIONS)
            if ((characterIndex = fieldText.indexOf(badCharCombination)) >= 0) {
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                addNoticePartial({ priority: 849, message: `Unexpected '${badCharCombination}' character combination`, characterIndex, excerpt, location: ourLocation });
            }
    if (cutoffPriorityLevel < 819)
        // Check for bad combinations of characters with regex
        for (const [details, badCharCombinationRegex] of BAD_CHARACTER_REGEXES)
            if ((characterIndex = fieldText.search(badCharCombinationRegex)) >= 0) {
                const badChar = fieldText.slice(characterIndex, characterIndex + 1);
                const badTwoChars = fieldText.slice(characterIndex, characterIndex + 2);
                const badChars = fieldText.slice(characterIndex);
                const nextChar = fieldText.slice(characterIndex + 1, characterIndex + 2);
                const nextTwoChars = fieldText.slice(characterIndex + 1, characterIndex + 3);
                const nextChars = fieldText.slice(characterIndex + 1);
                // NOTE: The hard part here is getting rid of false alarms
                //  Is it really worth it when this many exceptions need to be defined -- yes, it does find some genuine errors
                if (nextChars.startsWith('<br>') && (repoCode === 'TN' || repoCode === 'TA')) // allow <br>
                    continue;
                if (nextTwoChars === '\\n' && (repoCode === 'TN2' || repoCode === 'SN')) // allow \n (2 chars)
                    continue;
                if (nextChar === '\\' && fieldType === 'USFM line') // probably another USFM marker
                    continue;
                if (nextChar === '}' && repoCode === 'ST') // UST uses these
                    continue;
                if (nextChar === '…' && fieldName === 'OrigQuote') // discontiguous quote
                    continue;
                if (nextTwoChars === '\u00A0»' || nextTwoChars === '\u00A0›') // French punctuation
                    continue;
                if (nextChars.startsWith('<sup>') && fieldType === 'markdown' && repoCode === 'TA')
                    continue;
                if ((fieldName.startsWith('README') || fieldName.endsWith('.md line') || fieldName.endsWith('Note line'))
                    && (nextChar === '*' || badTwoChars === '![')) // allow markdown formatting
                    continue;
                if (badChars.startsWith('.md') || badChars.startsWith('.usfm') || badChars.startsWith('.tsv') || badChars.startsWith('.yaml')
                    || badChars.startsWith('.org')
                    || (badChar === '.' && (fieldText.indexOf('http') !== -1 || fieldText.indexOf('rc:') !== -1 || fieldName.endsWith('manifest line'))))
                    continue; // Skip these known cases
                if (badTwoChars === ':H' && repoCode === 'UHB') // e.g., strong="c:H1162"
                    continue;
                if ((badTwoChars === '.g' && fieldText.toLowerCase().indexOf('e.g.') !== -1)
                    || (badTwoChars === '.e' && fieldText.toLowerCase().indexOf('i.e.') !== -1))
                    continue;
                if (badChar === '.' && fieldText.indexOf('etc.') !== -1)
                    continue;
                if (badTwoChars === '.m'
                    && (fieldText.toLowerCase().indexOf('a.m.') !== -1 || fieldText.toLowerCase().indexOf('p.m.') !== -1))
                    continue;
                if ((badTwoChars === '.C' && fieldText.toLowerCase().indexOf('B.C.') !== -1)
                    || (badTwoChars === '.D' && fieldText.toLowerCase().indexOf('A.D.') !== -1))
                    continue;
                if (badTwoChars === '?v' && fieldName.endsWith('manifest line')) // presumably a relation version number
                    continue;
                if (badChar === '?' && fieldText.indexOf('http') !== -1) // ? can be part of a URL
                    continue;
                if (['\\w', '\\zaln-s', '\\v', '\\p', '\\q', '\\q1', '\\SPECIAL', '\\NONE', '\\f'].indexOf(fieldName) !== -1 && (badChar === ',' || badChar === ':')) // suppress x-morph formatting false alarms
                    continue;
                // debugLog(`checkTextField 329 at the bottom with ${badChar} in '${fieldName}' preceding ${nextChars}`);
                const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                // debugLog(`checkTextField for ${repoCode} '${fieldType}' '${fieldName}' got ${details} badTwoChars='${badTwoChars}' with '${excerpt}' priority 329`);
                addNoticePartial({ priority: 329, message: `Unexpected bad character combination`, details, characterIndex, excerpt, location: ourLocation });
            }

    if (cutoffPriorityLevel < 92)
        // Check for leading zeroes in numbers
        for (const badZeroCharCombination of LEADING_ZERO_COMBINATIONS)
            if ((characterIndex = fieldText.indexOf(badZeroCharCombination)) >= 0
                // but not an error perhaps if followed by period, e.g., 0.32.
                && (fieldText.slice(characterIndex + badZeroCharCombination.length, characterIndex + badZeroCharCombination.length + 1) !== '.')) {
                const nextChar = fieldText.slice(characterIndex + 1, characterIndex + 2);
                // debugLog(`92 leading zero for fieldType=${fieldType} fieldName=${fieldName}`);
                if (nextChar !== '”' && // e.g., “0” is ok
                    (fieldType !== 'YAML' || fieldText.indexOf('sort:') === -1)) { // "sort: 0" is ok in manifests
                    const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
                    addNoticePartial({ priority: 92, message: `Unexpected leading zero`, characterIndex, excerpt, location: ourLocation });
                }
            }

    // // Check for problems created by tC Create or something
    // characterIndex = fieldText.indexOf('\\[');
    // if (characterIndex === -1) characterIndex = fieldText.indexOf('\\]');
    // if (characterIndex !== -1) {
    //     const excerpt = (characterIndex > excerptHalfLength ? '…' : '') + fieldText.substring(characterIndex - excerptHalfLength, characterIndex + excerptHalfLengthPlus) + (characterIndex + excerptHalfLengthPlus < fieldText.length ? '…' : '');
    //     addNoticePartial({ priority: 849, message: "Unexpected \\[ or \\] characters", characterIndex, excerpt, location: ourLocation });
    // }

    // if (countOccurrencesInString(fieldText, '(') !== countOccurrencesInString(fieldText, ')')) {
    //     userLog(`checkTextField(${fieldType}, ${fieldName}, '${fieldText}', ${allowedLinks}, ${ourLocation}) found ${countOccurrencesInString(fieldText, '(')} '(' but ${countOccurrencesInString(fieldText, ')')} ')'`);
    //     addNoticePartial({ priority: 1, message: `Mismatched ( ) characters`, details: `left=${countOccurrencesInString(fieldText, '(').toLocaleString()}, right=${countOccurrencesInString(fieldText, ')').toLocaleString()}`, location: ourLocation });
    // }
    // Check matched pairs in the field
    for (const punctSet of OPEN_CLOSE_PUNCTUATION_PAIRS) {
        // Can’t check '‘’' coz they might be used as apostrophe
        const leftChar = punctSet[0], rightChar = punctSet[1];
        // if (fieldType === 'markdown' && leftChar === '<') continue; // markdown uses this for block quote
        // TODO: The following 'continue' might not be doing the 2nd lot of checks
        if ((fieldType.startsWith('USFM') || fieldName.startsWith('from \\') || (fieldType === 'markdown' && fieldName === ''))
            && '([{“‘«'.indexOf(leftChar) >= 0) continue; // Start/end can be on different lines
        if (!fieldType.startsWith('markdown') || leftChar !== '<') { // > is a markdown block marker and also used for HTML, e.g., <br>
            const leftCount = countOccurrencesInString(fieldText, leftChar),
                rightCount = countOccurrencesInString(fieldText, rightChar);
            if (leftCount !== rightCount
                && (rightChar !== '’' || leftCount > rightCount)) { // Closing single quote is also used as apostrophe in English
                // NOTE: These are higher priority than similar checks in a whole file which is less specific
                const thisPriority = leftChar === '“' ? 163 : 563;
                if (cutoffPriorityLevel < thisPriority)
                    addNoticePartial({ priority: thisPriority, message: `Mismatched ${leftChar}${rightChar} characters`, details: `left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });
            }
            try { // This regex build fails for some of the characters
                const leftRegex = new RegExp(`(\\w)\\${leftChar}(\\w)`, 'g'), rightRegex = new RegExp(`(\\w)\\${rightChar}(\\w)`, 'g');
                // debugLog(`leftRegex is ${leftRegex}`);
                let regexMatchObject;
                while ((regexMatchObject = leftRegex.exec(fieldText)))
                    if ((!fieldType.startsWith('markdown') || regexMatchObject[0][0] !== '_')
                        && (!fieldType.startsWith('YAML') || leftChar !== '{')
                        // TODO: We have to allow for a blank language code until we change checkPlainText()
                        && (languageCode !== 'en' || regexMatchObject[0][2] !== 's' || fieldText.indexOf('(s)') === -1)) {
                        // debugLog(`Got possible misplaced '${languageCode}' left ${leftChar} in ${fieldType} ${fieldName} '${fieldText}': ${JSON.stringify(regexMatchObject)}`);
                        let thisPriority = 717, thisMessage = `Misplaced ${leftChar} character`;
                        if (leftChar === '(' && regexMatchObject[0][2] === 's') { thisPriority = 17; thisMessage = `Possible misplaced ${leftChar} character`; } // Lower priority for words like 'thing(s)'
                        if (cutoffPriorityLevel < thisPriority)
                            addNoticePartial({ priority: thisPriority, message: thisMessage, excerpt: regexMatchObject[0], location: ourLocation });
                    }
                if (rightChar !== '’') // Can’t check '‘’' coz they might be used as apostrophe
                    while ((regexMatchObject = rightRegex.exec(fieldText)))
                        if ((!fieldType.startsWith('markdown') || regexMatchObject[0][2] !== '_')
                            && (!fieldType.startsWith('YAML') || rightChar !== '}')) {
                            // debugLog(`Got misplaced right ${rightChar} in ${fieldType} ${fieldName} '${fieldText}':`, JSON.stringify(regexMatchObject));
                            if (cutoffPriorityLevel < 716)
                                addNoticePartial({ priority: 716, message: `Misplaced ${rightChar} character`, excerpt: regexMatchObject[0], location: ourLocation });
                        }
            } catch { }
        }
    }

    if (cutoffPriorityLevel < 765 && !allowedLinks) {
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
