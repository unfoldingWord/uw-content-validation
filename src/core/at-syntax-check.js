// Validates "Alternate translation: [...]" syntax inside translationNotes Note fields.
// Priorities sit in the 450-490 medium range — these are readability/style issues
// that don't break apps consuming this content.

const AT_PHRASE_RE = /altern\w+\s+translat\w+/gi;

const PRI = {
    TRAILING_PERIOD: 450,
    BAD_POSITION: 455,
    LABEL_SPELLING_OR_CASE: 460,
    BAD_SEPARATOR: 465,
    BRACKET_PADDING: 470,
    EMPTY_BRACKET: 472,
    NESTED_BRACKET: 475,
    STRAY_BRACKET_IN_LABEL: 480,
    MISSING_BRACKET_AFTER_COLON: 485,
};

export function checkAlternateTranslationSyntax(noteText, fieldName, rowID, location) {
    const notices = [];
    if (!noteText || !noteText.length) return notices;

    AT_PHRASE_RE.lastIndex = 0;
    let m;
    while ((m = AT_PHRASE_RE.exec(noteText))) {
        const phraseStart = m.index;
        const phraseText = m[0];
        const phraseEnd = phraseStart + phraseText.length;

        const labelInfo = findLabelTerminator(noteText, phraseEnd);
        if (!labelInfo) continue;
        const { colonIdx, extLabel, strayBrackets } = labelInfo;

        const bodyInfo = parseAtBody(noteText, colonIdx + 1);

        if (!bodyInfo.qualifiesAsAt) {
            const isCanonical = phraseText === 'Alternate translation';
            const noExtension = extLabel === '';
            if (isCanonical && noExtension && positionPassesBoundary(noteText, phraseStart)) {
                notices.push(makeNotice(PRI.MISSING_BRACKET_AFTER_COLON,
                    'Alternate translation label not followed by `[` or `(N) [`',
                    "expected ': [...]' or ': (1) [...]'",
                    phraseStart, noteText.slice(phraseStart, Math.min(noteText.length, colonIdx + 8)),
                    fieldName, rowID, location));
            }
            continue;
        }

        if (phraseText !== 'Alternate translation') {
            notices.push(makeNotice(PRI.LABEL_SPELLING_OR_CASE,
                'Alternate translation label has wrong spelling or casing',
                `expected 'Alternate translation', got '${phraseText}'`,
                phraseStart, phraseText, fieldName, rowID, location));
        }

        if (!positionPassesBoundary(noteText, phraseStart)) {
            const ctxStart = Math.max(0, phraseStart - 20);
            notices.push(makeNotice(PRI.BAD_POSITION,
                'Alternate translation label must follow a sentence boundary',
                'preceding non-whitespace character must not be a letter or digit',
                phraseStart, noteText.slice(ctxStart, phraseStart + phraseText.length),
                fieldName, rowID, location));
        }

        if (strayBrackets.length) {
            notices.push(makeNotice(PRI.STRAY_BRACKET_IN_LABEL,
                'Alternate translation extended label contains stray `[` or `]`',
                'did you forget the colon, or is this not a markdown link?',
                strayBrackets[0], noteText.slice(phraseStart, colonIdx + 1),
                fieldName, rowID, location));
        }

        validateBody(noteText, colonIdx + 1, bodyInfo, notices, fieldName, rowID, location);
    }

    return notices;
}

function findLabelTerminator(text, fromIdx) {
    const MAX_LABEL_LEN = 100;
    const strayBrackets = [];
    const limit = Math.min(text.length, fromIdx + MAX_LABEL_LEN);
    const lookahead = text.slice(fromIdx, limit);
    const nextAtPhrase = lookahead.search(/altern\w+\s+translat\w+/i);
    const hardLimit = nextAtPhrase === -1 ? limit : fromIdx + nextAtPhrase;
    let i = fromIdx;
    while (i < hardLimit) {
        const c = text[i];
        if (c === ':') return { colonIdx: i, extLabel: text.slice(fromIdx, i), strayBrackets };
        if (c === '\n') return null;
        if (c === '[') {
            const closeBracket = text.indexOf(']', i + 1);
            if (closeBracket !== -1 && closeBracket < limit
                && text[closeBracket + 1] === '('
                && !text.slice(i, closeBracket).includes('\n')) {
                const closeParen = text.indexOf(')', closeBracket + 2);
                if (closeParen !== -1 && closeParen - closeBracket < 200
                    && !text.slice(closeBracket, closeParen).includes('\n')) {
                    i = closeParen + 1;
                    continue;
                }
            }
            strayBrackets.push(i);
            i++;
            continue;
        }
        if (c === ']') { strayBrackets.push(i); i++; continue; }
        i++;
    }
    return null;
}

function parseAtBody(text, fromIdx) {
    let i = fromIdx;
    const colonImmediatelyFollowedBy = text[i];
    let leadingSpaceCount = 0;
    while (i < text.length && text[i] === ' ') { i++; leadingSpaceCount++; }

    const parenMatch = /^\(([^)[\]\n]+)\)\s+/.exec(text.slice(i));
    if (parenMatch) i += parenMatch[0].length;

    if (text[i] !== '[') return { qualifiesAsAt: false };

    const segments = [];
    while (true) {
        const bracketStart = i;
        if (text[bracketStart] !== '[') break;
        const bracketEnd = text.indexOf(']', bracketStart + 1);
        const content = bracketEnd === -1
            ? text.slice(bracketStart + 1)
            : text.slice(bracketStart + 1, bracketEnd);
        segments.push({ bracketStart, bracketEnd, content });
        if (bracketEnd === -1) break;
        i = bracketEnd + 1;

        const nextOpen = text.indexOf('[', i);
        if (nextOpen === -1) break;
        if (text[nextOpen + 1] === '[') break;
        if (text[bracketEnd + 1] === '(') break;
        const between = text.slice(i, nextOpen);
        if (between.includes('\n') || between.length > 200) break;
        const sep = classifySeparator(between);
        if (!sep.continues) break;
        segments[segments.length - 1].separator = between;
        segments[segments.length - 1].separatorValid = sep.valid;
        i = nextOpen;
    }

    return {
        qualifiesAsAt: true,
        segments,
        leadingSpaceCount,
        colonImmediatelyFollowedBy,
    };
}

function classifySeparator(text) {
    if (text.includes('[') || text.includes(']')) return { continues: false, valid: false };
    const trimmed = text.trim();
    if (trimmed === '') return { continues: false, valid: false };
    const hasMarker = /(^|[\s,;])(or|\(\d+\))(\s|$)/.test(trimmed)
        || /[,;]/.test(trimmed);
    if (!hasMarker) return { continues: false, valid: false };
    return { continues: true, valid: true };
}

function validateBody(text, bodyStart, bodyInfo, notices, fieldName, rowID, location) {
    if (bodyInfo.colonImmediatelyFollowedBy !== ' ') {
        notices.push(makeNotice(PRI.MISSING_BRACKET_AFTER_COLON,
            'Alternate translation colon must be followed by a single space',
            null,
            bodyStart, text.slice(Math.max(0, bodyStart - 1), Math.min(text.length, bodyStart + 6)),
            fieldName, rowID, location));
    } else if (bodyInfo.leadingSpaceCount > 1) {
        notices.push(makeNotice(PRI.MISSING_BRACKET_AFTER_COLON,
            'Alternate translation colon should be followed by exactly one space',
            null,
            bodyStart, text.slice(Math.max(0, bodyStart - 1), Math.min(text.length, bodyStart + 6)),
            fieldName, rowID, location));
    }

    for (const seg of bodyInfo.segments) {
        if (seg.bracketEnd === -1) {
            notices.push(makeNotice(PRI.NESTED_BRACKET,
                'Alternate translation bracket is not closed',
                '`[` has no matching `]`',
                seg.bracketStart, text.slice(seg.bracketStart, Math.min(text.length, seg.bracketStart + 40)),
                fieldName, rowID, location));
            continue;
        }
        const c = seg.content;
        if (c.length === 0) {
            notices.push(makeNotice(PRI.EMPTY_BRACKET,
                'Alternate translation bracket is empty',
                null, seg.bracketStart, '[]', fieldName, rowID, location));
            continue;
        }
        if (/^\s/.test(c) || /\s$/.test(c)) {
            notices.push(makeNotice(PRI.BRACKET_PADDING,
                'Alternate translation bracket cannot start or end with whitespace',
                null, seg.bracketStart, `[${c}]`, fieldName, rowID, location));
        }
        if (c.includes('[') || c.includes(']')) {
            notices.push(makeNotice(PRI.NESTED_BRACKET,
                'Alternate translation bracket cannot contain `[` or `]`',
                null, seg.bracketStart, `[${c}]`, fieldName, rowID, location));
        }
        if (seg.separator !== undefined && !seg.separatorValid) {
            notices.push(makeNotice(PRI.BAD_SEPARATOR,
                'Invalid separator between Alternate translation brackets',
                `found: '${seg.separator}'`,
                seg.bracketEnd + 1, seg.separator, fieldName, rowID, location));
        }
    }

    const last = bodyInfo.segments[bodyInfo.segments.length - 1];
    if (last && last.bracketEnd !== -1) {
        const rest = text.slice(last.bracketEnd + 1);
        if (/^\.\s*$/.test(rest)) {
            notices.push(makeNotice(PRI.TRAILING_PERIOD,
                'Alternate translation should not end with `.` after `]` at end of note',
                null,
                last.bracketEnd + 1,
                text.slice(Math.max(0, last.bracketEnd - 4), last.bracketEnd + 2),
                fieldName, rowID, location));
        }
    }
}

function positionPassesBoundary(text, idx) {
    if (idx === 0) return true;
    let i = idx - 1;
    while (i >= 0 && (text[i] === ' ' || text[i] === '\t')) i--;
    if (i < 0) return true;
    if (text[i] === '\n') return true;
    return !/[A-Za-z0-9]/.test(text[i]);
}

function makeNotice(priority, message, details, characterIndex, excerpt, fieldName, rowID, location) {
    const notice = { priority, message, fieldName, rowID, location };
    if (details) notice.details = details;
    if (typeof characterIndex === 'number') notice.characterIndex = characterIndex;
    if (excerpt) notice.excerpt = excerpt.length > 60 ? excerpt.slice(0, 57) + '…' : excerpt;
    return notice;
}
