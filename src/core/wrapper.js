// This file wraps our internal functions for tC Create and the Content Validation App
//    and other unfoldingWord tools to use more easily
//
// NOTE: We also remove disabled notices before returning these results
//
// These wrapper functions were requested by Cecil New in October 2021
//

import { checkNotesTSV7Table } from './notes-tsv7-table-check';
import { internalCheckTN_TSV9Table } from './tn-tsv9-table-check';
import { checkQuestionsTSV7Table } from './questions-tsv7-table-check';
import { internalCheckTWL_TSV6Table } from './twl-tsv6-table-check';
import { checkMarkdownFileContents } from './markdown-file-contents-check';
import { removeDisabledNotices } from './disabled-notices';

// NOTE: We don't need to know the org name or the repo name here
//        because if we check linked articles, the function to do this will be provided in checkingOptions

export async function checkTN_TSV7Table(username, languageCode, bookID, filename, tableText, checkingOptions) {
  // Note: the givenLocation parameter is left blank
  let checkResults = await checkNotesTSV7Table(username, languageCode, bookID === 'OBS' ? 'OBS-TN' : 'TN2', bookID, filename, tableText, '', { ...checkingOptions, suppressNoticeDisablingFlag: false });
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}
export async function checkSN_TSV7Table(username, languageCode, bookID, filename, tableText, checkingOptions) {
  // Note: the givenLocation parameter is left blank
  let checkResults = await checkNotesTSV7Table(username, languageCode, bookID === 'OBS' ? 'OBS-SN' : 'SN', bookID, filename, tableText, '', { ...checkingOptions, suppressNoticeDisablingFlag: false });
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}

export async function checkTQ_TSV7Table(username, languageCode, bookID, filename, tableText, checkingOptions) {
  // Note: the givenLocation parameter is left blank
  let checkResults = await checkQuestionsTSV7Table(username, languageCode, bookID === 'OBS' ? 'OBS-TQ' : 'TQ', bookID, filename, tableText, '', { ...checkingOptions, suppressNoticeDisablingFlag: false })
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}
export async function checkSQ_TSV7Table(username, languageCode, bookID, filename, tableText, checkingOptions) {
  // Note: the givenLocation parameter is left blank
  let checkResults = await checkQuestionsTSV7Table(username, languageCode, bookID === 'OBS' ? 'OBS-SQ' : 'SQ', bookID, filename, tableText, '', { ...checkingOptions, suppressNoticeDisablingFlag: false })
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}

export async function checkTWL_TSV6Table(username, languageCode, bookID, filename, tableText, checkingOptions) {
  // Note: the givenLocation parameter is left blank
  let checkResults = await internalCheckTWL_TSV6Table(username, languageCode, bookID === 'OBS' ? 'OBS-TWL' : 'TWL', bookID, filename, tableText, '', { ...checkingOptions, suppressNoticeDisablingFlag: false })
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}

export async function checkTA_markdownArticle(username, languageCode, articleFilepathInRepo, articleFileContent, checkingOptions) {
  // Note: the givenLocation parameter is left blank
  let checkResults = await checkMarkdownFileContents(username, languageCode, 'TA', articleFilepathInRepo, articleFileContent, '', { ...checkingOptions, suppressNoticeDisablingFlag: false });
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}

export async function checkTW_markdownArticle(username, languageCode, articleFilepathInRepo, articleFileContent, checkingOptions) {
  // Note: the givenLocation parameter is left blank
  let checkResults = await checkMarkdownFileContents(username, languageCode, 'TW', articleFilepathInRepo, articleFileContent, '', { ...checkingOptions, suppressNoticeDisablingFlag: false });
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}

// This format is scheduled to be deprecated
export async function checkDeprecatedTN_TSV9Table(username, languageCode, bookID, filename, tableText, checkingOptions) {
  // Note: the givenLocation parameter is left blank
  let checkResults = await internalCheckTN_TSV9Table(username, languageCode, 'TN', bookID, filename, tableText, '', { ...checkingOptions, suppressNoticeDisablingFlag: false });
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}
