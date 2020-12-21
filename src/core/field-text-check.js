import { DEFAULT_EXTRACT_LENGTH, MATCHED_PUNCTUATION_PAIRS, BAD_CHARACTER_COMBINATIONS, isWhitespace, countOccurrences } from './text-handling-functions'


// const FIELD_TEXT_VALIDATOR_VERSION_STRING = '0.3.2';


/**
 * @description -- Does basic checks for small errors like leading/trailing spaces, etc.
 * @param {string} fieldType -- classification, e.g., TSV, USFM, YAML, link, markdown, raw
 * @param {string} fieldName -- used for identification
 * @param {string} fieldText -- the field being checked
 * @param {boolean} allowedLinks -- doesn't check links -- only checks lack of links
 * @param {string} optionalFieldLocation -- used to inform where this field is located
 * @param {Object} optionalCheckingOptions
 */
export function checkTextField(fieldType, fieldName, fieldText, allowedLinks, optionalFieldLocation, optionalCheckingOptions) {
    // We assume that checking for compulsory fields is done elsewhere

    // Returns a single notice list
    //  The list contains objects with the following fields:
    //      priority (compulsory): the priority number 0..999 (usually 800+ are errors, lower are warnings)
    //      message (compulsory): the error description string
    //      characterIndeX: the 0-based index for the position in the string
    //      extract: a short extract of the string containing the error (or empty-string if irrelevant)
    //      location: the detailed location string
    //  (Returned in this way for more intelligent processing at a higher level)
    // console.log(`checkTextField(${fieldName}, ${fieldText.length.toLocaleString()} chars, ${allowedLinks}, '${optionalFieldLocation}')…`);
    console.assert(fieldType !== undefined, "checkTextField: 'fieldType' parameter should be defined");
    console.assert(typeof fieldType === 'string', `checkTextField: 'fieldType' parameter should be a string not a '${typeof fieldType}': ${fieldType}`);
    console.assert(fieldType !== '', `checkTextField: 'fieldType' ${fieldType} parameter should be not be an empty string`);
    console.assert(fieldType === 'markdown' || fieldType === 'USFM' || fieldType === 'YAML' || fieldType === 'text' || fieldType === 'raw' || fieldType === 'link', `checkTextField: unrecognised 'fieldType' parameter: '${fieldType}'`);
    console.assert(fieldName !== undefined, "checkTextField: 'fieldName' parameter should be defined");
    console.assert(typeof fieldName === 'string', `checkTextField: 'fieldName' parameter should be a string not a '${typeof fieldName}': ${fieldName}`);
    // if (fieldType !== 'markdown')
    //     console.assert(fieldName !== '', `checkTextField: ${fieldType} 'fieldName' parameter should be not be an empty string`);
    console.assert(fieldText !== undefined, "checkTextField: 'fieldText' parameter should be defined");
    console.assert(typeof fieldText === 'string', `checkTextField: 'fieldText' parameter should be a string not a '${typeof fieldText}': ${fieldText}`);
    console.assert(allowedLinks === true || allowedLinks === false, "checkTextField: allowedLinks parameter must be either true or false");
    if (!allowedLinks) console.assert(fieldText.indexOf('x-tw') < 0, `checkTextField should be allowedLinks for ${fieldType} ${fieldName} ${fieldText}`)
    console.assert(optionalFieldLocation !== undefined, "checkTextField: 'optionalFieldLocation' parameter should be defined");
    console.assert(typeof optionalFieldLocation === 'string', `checkTextField: 'optionalFieldLocation' parameter should be a string not a '${typeof optionalFieldLocation}': ${optionalFieldLocation}`);
    console.assert(optionalFieldLocation.indexOf('true') === -1, `checkTextField: 'optionalFieldLocation' parameter should not be '${optionalFieldLocation}'`);
    if (optionalCheckingOptions !== undefined)
        console.assert(typeof optionalCheckingOptions === 'object', `checkTextField: 'optionalCheckingOptions' parameter should be an object not a '${typeof optionalCheckingOptions}': ${JSON.stringify(optionalCheckingOptions)}`);

    let result = { noticeList: [] };

    function addNoticePartial(noticeObject) {
        // We add the fieldName here
        // console.log(`dBTC Notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "dBTCs addNoticePartial: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `dBTCs addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "dBTCs addNoticePartial: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `dBTCs addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(characterIndex !== undefined, "dBTCs addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `dBTCs addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "dBTCs addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `dBTCs addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "dBTCs addNoticePartial: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `dBTCs addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);

        // noticeObject.debugChain = noticeObject.debugChain ? `checkTextField(${fieldType}, ${fieldName}, ${allowedLinks}) ${noticeObject.debugChain}` : `checkTextField(${fieldType}, ${fieldName}, ${allowedLinks})`;
        if (fieldName.length) noticeObject.fieldName = fieldName; // Don't add the field if it's blank
        result.noticeList.push(noticeObject);
    }


    // Main code for checkTextField()
    if (!fieldText) // Nothing to check
        return result;

    // Create our more detailed location string by prepending the fieldName
    let ourLocation = optionalFieldLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    let extractLength;
    try {
        extractLength = optionalCheckingOptions?.extractLength;
    } catch (btcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
    // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    const halfLength = Math.floor(extractLength / 2); // rounded down
    const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    let suggestion = fieldText.trim();

    let characterIndex;
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 895)
        && (characterIndex = fieldText.indexOf('\u200B')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/\u200B/g, '‼') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 895, message: "Field contains zero-width space(s)", characterIndex, extract, location: ourLocation });
        suggestion = suggestion.replace(/\u200B/g, ''); // Or should it be space ???
    }

    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 638)
        && isWhitespace(fieldText)) {
        addNoticePartial({ priority: 638, message: "Only found whitespace", location: ourLocation });
        return result;
    }

    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 993)
        && (characterIndex = fieldText.indexOf('<<<<<<<')) >= 0) {
        const iy = characterIndex + halfLength; // Want extract to focus more on what follows
        const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')

        addNoticePartial({ priority: 993, message: "Unresolved GIT conflict", characterIndex, extract, location: ourLocation });
    } else {
        if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 992)
            && (characterIndex = fieldText.indexOf('=======')) >= 0) {
            const iy = characterIndex + halfLength; // Want extract to focus more on what follows
            const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 992, message: "Unresolved GIT conflict", characterIndex, extract, location: ourLocation });
        } else {
            if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 991)
                && (characterIndex = fieldText.indexOf('>>>>>>>>')) >= 0) {
                const iy = characterIndex + halfLength; // Want extract to focus more on what follows
                const extract = (iy > halfLength ? '…' : '') + fieldText.substring(iy - halfLength, iy + halfLengthPlus).replace(/ /g, '␣') + (iy + halfLengthPlus < fieldText.length ? '…' : '')
                addNoticePartial({ priority: 991, message: "Unresolved GIT conflict", characterIndex, extract, location: ourLocation });
            }
        }
    }

    if (fieldText[0] === ' ') {
        const extract = fieldText.substring(0, extractLength).replace(/ /g, '␣') + (fieldText.length > extractLength ? '…' : '');
        if (fieldText[1] === ' ') // spaces plural
            addNoticePartial({ priority: 110, message: `Unexpected leading spaces`, characterIndex: 0, extract, location: ourLocation });
        else
            addNoticePartial({ priority: 109, message: `Unexpected leading space`, characterIndex: 0, extract, location: ourLocation });
    } else if (fieldText[0] === '\u2060') {
        const extract = fieldText.substring(0, extractLength).replace(/\u2060/g, '‼') + (fieldText.length > extractLength ? '…' : '');
        addNoticePartial({ priority: 770, message: `Unexpected leading word-joiner`, characterIndex: 0, extract, location: ourLocation });
        if (suggestion[0] === '\u2060') suggestion = suggestion.substring(1);
    } else if (fieldText[0] === '\u200D') {
        const extract = fieldText.substring(0, extractLength).replace(/\u200D/g, '‼') + (fieldText.length > extractLength ? '…' : '');
        addNoticePartial({ priority: 771, message: `Unexpected leading zero-width joiner`, characterIndex: 0, extract, location: ourLocation });
        if (suggestion[0] === '\u200D') suggestion = suggestion.substring(1);
    }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 64)
        && (characterIndex = fieldText.indexOf('<br> ')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 64, message: "Unexpected leading space(s) after break", characterIndex, extract, location: ourLocation });
    }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 63)
        && (characterIndex = fieldText.indexOf('\\n ')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 63, message: "Unexpected leading space(s) after line break", characterIndex, extract, location: ourLocation });
    }

    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 772)
        && fieldText[fieldText.length - 1] === '\u2060') {
        const extract = fieldText.substring(0, extractLength).replace(/\u2060/g, '‼') + (fieldText.length > extractLength ? '…' : '');
        addNoticePartial({ priority: 772, message: `Unexpected trailing word-joiner`, characterIndex: 0, extract, location: ourLocation });
        if (suggestion[suggestion.length - 1] === '\u2060') suggestion = suggestion.substring(0, suggestion.length - 1);
    } else if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 773)
        && fieldText[fieldText.length - 1] === '\u200D') {
        const extract = fieldText.substring(0, extractLength).replace(/\u200D/g, '‼') + (fieldText.length > extractLength ? '…' : '');
        addNoticePartial({ priority: 773, message: `Unexpected trailing zero-width joiner`, characterIndex: 0, extract, location: ourLocation });
        if (suggestion[suggestion.length - 1] === '\u200D') suggestion = suggestion.substring(0, suggestion.length - 1);
    }

    // Find leading line breaks (but not if the whole line is just the line break sequence)
    const fieldTextLower = fieldText.toLowerCase();
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 107)
        && (fieldTextLower.substring(0, 2) === '\\n' || fieldTextLower.substring(0, 4) === '<br>' || fieldTextLower.substring(0, 5) === '<br/>' || fieldTextLower.substring(0, 6) === '<br />')
        && fieldTextLower !== '\\n' && fieldTextLower !== '<br>' && fieldTextLower !== '<br/>' && fieldTextLower !== '<br />') {
        const extract = fieldText.substring(0, extractLength) + (fieldText.length > extractLength ? '…' : '');
        addNoticePartial({ priority: 107, message: "Unexpected leading line break", characterIndex: 0, extract, location: ourLocation });
        while (suggestion.toLowerCase().substring(0, 2) === '\\n') suggestion = suggestion.substring(2);
        while (suggestion.toLowerCase().substring(0, 4) === '<br>') suggestion = suggestion.substring(4);
        while (suggestion.toLowerCase().substring(0, 5) === '<br/>') suggestion = suggestion.substring(5);
        while (suggestion.toLowerCase().substring(0, 6) === '<br />') suggestion = suggestion.substring(6);
    }

    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 95)
        && fieldText[fieldText.length - 1] === ' ')
        // Markdown gives meaning to two spaces at the end of a line
        if (fieldType !== 'markdown' || fieldText.length < 3 || fieldText[fieldText.length - 2] !== ' ' || fieldText[fieldText.length - 3] === ' ') {
            const extract = (fieldText.length > extractLength ? '…' : '') + fieldText.substring(fieldText.length - 10).replace(/ /g, '␣');
            const notice = { priority: 95, message: "Unexpected trailing space(s)", extract, location: ourLocation };
            if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                notice.characterIndex = fieldText.length - 1; // characterIndex means nothing for processed USFM
            addNoticePartial(notice);
        }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 94)
        && (characterIndex = fieldText.indexOf(' <br')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 94, message: "Unexpected trailing space(s) before break", characterIndex, extract, location: ourLocation });
    }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 93)
        && (characterIndex = fieldText.indexOf(' \\n')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 93, message: "Unexpected trailing space(s) before line break", characterIndex, extract, location: ourLocation });
    }

    // Find trailing line breaks (but not if the whole line is just the line break sequence)
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 104)
        && (fieldTextLower.substring(fieldTextLower.length - 2) === '\\n' || fieldTextLower.substring(fieldTextLower.length - 4) === '<br>' || fieldTextLower.substring(fieldTextLower.length - 5) === '<br/>' || fieldTextLower.substring(fieldTextLower.length - 6) === '<br />')
        && fieldTextLower !== '\\n' && fieldTextLower !== '<br>' && fieldTextLower !== '<br/>' && fieldTextLower !== '<br />') {
        const extract = (fieldText.length > extractLength ? '…' : '') + fieldText.substring(fieldText.length - 10);
        addNoticePartial({ priority: 104, message: "Unexpected trailing line break", characterIndex: fieldText.length - 1, extract, location: ourLocation });
        while (suggestion.toLowerCase().substring(suggestion.length - 2) === '\\n') suggestion = suggestion.substring(0, suggestion.length - 2);
        while (suggestion.toLowerCase().substring(suggestion.length - 4) === '<br>') suggestion = suggestion.substring(0, suggestion.length - 4);
        while (suggestion.toLowerCase().substring(suggestion.length - 5) === '<br/>') suggestion = suggestion.substring(0, suggestion.length - 5);
        while (suggestion.toLowerCase().substring(suggestion.length - 6) === '<br />') suggestion = suggestion.substring(0, suggestion.length - 6);
    }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 124)
        && (characterIndex = fieldText.indexOf('  ')) >= 0
        && (fieldType !== 'markdown' || characterIndex !== fieldText.length - 2)) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/ /g, '␣') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        const doubleCount = countOccurrences(fieldText, '  ');
        let notice;
        if (doubleCount === 1)
            notice = { priority: 124, message: "Unexpected double spaces", extract, location: ourLocation };
        else
            notice = { priority: 224, message: "Multiple unexpected double spaces", details: `${doubleCount} occurrences—only first is displayed`, extract, location: ourLocation };
        if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
            notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
        if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < notice.priority)
            addNoticePartial(notice);
        // Note: replacing double-spaces in the suggestion is done later -- after other suggestion modifications which might affect it
    }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 583)
        && (characterIndex = fieldText.indexOf('\n')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 583, message: "Unexpected newLine character", characterIndex, extract, location: ourLocation });
        suggestion = suggestion.replace(/\n/g, ' ');
    }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 582)
        && (characterIndex = fieldText.indexOf('\r')) >= 0) {
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 582, message: "Unexpected carriageReturn character", characterIndex, extract, location: ourLocation });
        suggestion = suggestion.replace(/\r/g, ' ');
    }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 581)
        && (characterIndex = fieldText.indexOf('\xA0')) >= 0) { // non-break space
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/\xA0/g, '⍽') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        addNoticePartial({ priority: 581, message: "Unexpected non-break space character", characterIndex, extract, location: ourLocation });
        suggestion = suggestion.replace(/\xA0/g, ' ');
    }
    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 580)
        && (characterIndex = fieldText.indexOf('\u202F')) >= 0) { // narrow non-break space
        const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus).replace(/\u202F/g, '⍽') + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
        const notice = { priority: 580, message: "Unexpected narrow non-break space character", extract, location: ourLocation };
        if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
            notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
        addNoticePartial(notice);
        suggestion = suggestion.replace(/\u202F/g, ' ');
    }
    if (fieldName === 'OrigQuote' || fieldName === 'Quote') {
        if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 179)
            && (characterIndex = fieldText.indexOf(' …')) >= 0) {
            const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 179, message: "Unexpected space before ellipse character", characterIndex, extract, location: ourLocation });
            suggestion = suggestion.replace(/ …/g, '…');
        }
        if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 178)
            && (characterIndex = fieldText.indexOf('… ')) >= 0) {
            const extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
            addNoticePartial({ priority: 178, message: "Unexpected space after ellipse character", characterIndex, extract, location: ourLocation });
            suggestion = suggestion.replace(/… /g, '…');
        }
    }
    suggestion = suggestion.replace(/ {2}/g, ' ');

    if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 177) {
        // Check for doubled punctuation chars (international)
        // Doesn't check for doubled forward slash by default coz that might occur in a link, e.g., https://etc…
        //  or doubled # coz that occurs in markdown
        let doubledPunctuationCheckList = '({}<>⟨⟩:،、‒–—―…!‹›«»‐?‘’“”\';⁄·&@•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§|‖¦©℗®℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (!allowedLinks) doubledPunctuationCheckList += '/[].)'; // Double square brackets can be part of markdown links, double periods can be part of a path
        if (fieldType !== 'markdown') doubledPunctuationCheckList += '_*#~'; // There are used for markdown formatting
        if (fieldType !== 'USFM' || fieldText.indexOf('x-morph') < 0) doubledPunctuationCheckList += ',"'; // Allowed in original language morphology fields
        if (fieldType !== 'YAML' || !fieldText.startsWith('--')) // NOTE: First hyphen may have been removed in preprocessing
            doubledPunctuationCheckList += '-';
        for (const punctChar of doubledPunctuationCheckList) {
            if ((characterIndex = fieldText.indexOf(punctChar + punctChar)) >= 0) {
                let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
                const notice = { priority: 177, message: `Unexpected doubled ${punctChar} characters`, extract, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }
    if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 195) {
        // Check for punctuation chars following space and at start of line
        //  Removed ©$€₱
        let afterSpaceCheckList = ')}>⟩:,،、‒–—―!.›»‐-?’”;/⁄·@•^†‡°¡¿※#№÷×ºª%‰‱¶′″‴§‖¦℗®℠™¤₳฿₵¢₡₢₫₯֏₠ƒ₣₲₴₭₺₾ℳ₥₦₧₰£៛₽₹₨₪৳₸₮₩¥';
        if (fieldType !== 'markdown') afterSpaceCheckList += '_*~'; // These are used for markdown formatting
        if (fieldType !== 'USFM' || (fieldText.indexOf('x-lemma') < 0 && fieldText.indexOf('x-tw') < 0)) afterSpaceCheckList += '|';
        if (fieldType !== 'YAML') afterSpaceCheckList += '\'"'; // These are used for YAML strings, e.g., version: '0.15'
        // if (fieldName === 'OrigQuote' || fieldName === 'Quote') afterSpaceCheckList += '…'; // NOT NEEDED -- this is specifically checked elsewhere
        for (const punctChar of afterSpaceCheckList) {
            if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 191)
                && (characterIndex = fieldText.indexOf(' ' + punctChar)) >= 0) {
                let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
                const notice = { priority: 191, message: `Unexpected ${punctChar} character after space`, extract, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
            if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 195)
                && (punctChar !== '-' || fieldType !== 'YAML')
                && (punctChar !== '!' || fieldType !== 'markdown') // image tag
                && fieldText[0] === punctChar) {
                characterIndex = 0;
                let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
                addNoticePartial({ priority: 195, message: `Unexpected ${punctChar} character at start of line`, characterIndex, extract, location: ourLocation });
            }
        }
        if (fieldType === 'USFM')
            suggestion = suggestion.replace(/| /g, '|');
    }

    if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 192) {
        // Check for punctuation chars before space
        //  Removed ' (can be normal, e.g., Jesus' cloak)
        //  Removed ©
        let beforeSpaceCheckList = '({<⟨،、‒–—―‹«‐‘“/⁄·@\\•^†‡°¡¿※№×ºª‰‱¶′″‴§|‖¦℗℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (fieldType !== 'markdown') beforeSpaceCheckList += '_~'; // These are used for markdown formatting
        if (fieldType !== 'markdown' && fieldType !== 'USFM') beforeSpaceCheckList += '*'; // There are used for markdown formatting and USFM closing markers
        if (fieldType !== 'YAML') beforeSpaceCheckList += '[';
        for (const punctChar of beforeSpaceCheckList) {
            if ((characterIndex = fieldText.indexOf(punctChar + ' ')) >= 0) {
                let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
                const notice = { priority: 192, message: `Unexpected space after ${punctChar} character`, extract, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }

    if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 193) {
        // Check for punctuation chars at end of line
        //  Removed ' (can be normal, e.g., Jesus' cloak)
        let beforeEOLCheckList = '([{<⟨،、‒–—―‹«‐‘“/⁄·@©\\•^†‡°¡¿※№×ºª‰‱¶′″‴§|‖¦℗℠™¤₳฿₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥';
        if (fieldType !== 'markdown') beforeEOLCheckList += '_~'; // These are used for markdown formatting
        if (fieldType !== 'markdown' && fieldType !== 'USFM') beforeEOLCheckList += '*'; // There are used for markdown formatting and USFM closing markers
        for (const punctChar of beforeEOLCheckList) {
            if (punctChar !== '—' && fieldText[fieldText.length - 1] === punctChar) {
                characterIndex = fieldText.length - 1;
                let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '')
                const notice = { priority: 193, message: `Unexpected ${punctChar} character at end of line`, extract, location: ourLocation };
                if ((fieldType !== 'raw' && fieldType !== 'text') || fieldName.substring(0, 6) !== 'from \\')
                    notice.characterIndex = characterIndex; // characterIndex means nothing for processed USFM
                addNoticePartial(notice);
            }
        }
    }

    if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 849)
        // Check for bad combinations of characters
        for (const badCharCombination of BAD_CHARACTER_COMBINATIONS)
            if ((characterIndex = fieldText.indexOf(badCharCombination)) >= 0) {
                let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '');
                addNoticePartial({ priority: 849, message: `Unexpected '${badCharCombination}' character combination`, characterIndex, extract, location: ourLocation });
            }

    // // Check for problems created by tC Create or something
    // characterIndex = fieldText.indexOf('\\[');
    // if (characterIndex === -1) characterIndex = fieldText.indexOf('\\]');
    // if (characterIndex !== -1) {
    //     let extract = (characterIndex > halfLength ? '…' : '') + fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus) + (characterIndex + halfLengthPlus < fieldText.length ? '…' : '');
    //     addNoticePartial({ priority: 849, message: "Unexpected \\[ or \\] characters", characterIndex, extract, location: ourLocation });
    // }

    // if (countOccurrences(fieldText, '(') !== countOccurrences(fieldText, ')')) {
    //     console.log(`checkTextField(${fieldType}, ${fieldName}, '${fieldText}', ${allowedLinks}, ${ourLocation}) found ${countOccurrences(fieldText, '(')} '(' but ${countOccurrences(fieldText, ')')} ')'`);
    //     addNoticePartial({ priority: 1, message: `Mismatched ( ) characters`, details: `left=${countOccurrences(fieldText, '(').toLocaleString()}, right=${countOccurrences(fieldText, ')').toLocaleString()}`, location: ourLocation });
    // }
    // Check matched pairs in the field
    for (const punctSet of MATCHED_PUNCTUATION_PAIRS) {
        // Can't check '‘’' coz they might be used as apostrophe
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
                if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < thisPriority)
                    addNoticePartial({ priority: thisPriority, message: `Mismatched ${leftChar}${rightChar} characters`, details: `left=${leftCount.toLocaleString()}, right=${rightCount.toLocaleString()}`, location: ourLocation });
            }
            try { // This regex build fails for some of the characters
                const leftRegex = new RegExp(`(\\w)\\${leftChar}(\\w)`, 'g'), rightRegex = new RegExp(`(\\w)\\${rightChar}(\\w)`, 'g');
                // console.log(`leftRegex is ${leftRegex}`);
                let regexResultArray;
                // eslint-disable-next-line no-cond-assign
                while (regexResultArray = leftRegex.exec(fieldText))
                    if (fieldType !== 'markdown' || regexResultArray[0][0] !== '_') {
                        // console.log(`Got misplaced left ${leftChar} in ${fieldType} ${fieldName} '${fieldText}':`, JSON.stringify(regexResultArray));
                        let thisPriority = 717, thisMessage = `Misplaced ${leftChar} character`;
                        if (leftChar === '(' && regexResultArray[0][2] === 's') { thisPriority = 17; thisMessage = `Possible misplaced ${leftChar} character`; } // Lower priority for words like 'thing(s)'
                        if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < thisPriority)
                            addNoticePartial({ priority: thisPriority, message: thisMessage, extract: regexResultArray[0], location: ourLocation });
                    }
                    if (rightChar !== '’') // Can't check '‘’' coz they might be used as apostrophe
                // eslint-disable-next-line no-cond-assign
                while (regexResultArray = rightRegex.exec(fieldText))
                    if (fieldType !== 'markdown' || regexResultArray[0][2] !== '_') {
                        // console.log(`Got misplaced right ${rightChar} in ${fieldType} ${fieldName} '${fieldText}':`, JSON.stringify(regexResultArray));
                        if (!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 716)
                            addNoticePartial({ priority: 716, message: `Misplaced ${rightChar} character`, extract: regexResultArray[0], location: ourLocation });
                    }
            } catch { }
        }
    }

    if ((!optionalCheckingOptions?.cutoffPriorityLevel || optionalCheckingOptions?.cutoffPriorityLevel < 765)
        && !allowedLinks) {
        // Simple check that there aren't any
        characterIndex = fieldText.indexOf('://');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('http');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('ftp');
        // The following might have to be removed if text fields can contain email addresses
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.org');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.com');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.info');
        if (characterIndex === -1) characterIndex = fieldText.indexOf('.bible');
        if (characterIndex >= 0) {
            let extract = `${characterIndex > halfLength ? '…' : ''}${fieldText.substring(characterIndex - halfLength, characterIndex + halfLengthPlus)}${characterIndex + halfLengthPlus < fieldText.length ? '…' : ''}`
            addNoticePartial({ priority: 765, message: "Unexpected link", characterIndex, extract, location: ourLocation });
        }
    }

    // See if we have a suggestion
    if (suggestion !== fieldText) {
        // console.log(`Had text ${fieldText}`);
        // console.log(`Sug text ${suggestion}`);
        result.suggestion = suggestion;
    }

    return result;
}
// end of checkTextField function
