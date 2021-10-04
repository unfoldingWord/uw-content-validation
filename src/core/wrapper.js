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
import { removeDisabledNotices } from './disabled-notices';

// NOTE: We don't need to know the org name or the repo name here
//        because if we check linked articles, the function to do this will be provided in checkingOptions

export async function checkTN_TSV7Table(languageCode, bookID, tableText, checkingOptions) {
  // Note: the filename and givenLocation parameters are left blank
  let checkResults = await checkNotesTSV7Table(languageCode, 'TN', bookID, '', tableText, '', {...checkingOptions, suppressNoticeDisablingFlag: false});
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}

export async function checkTN_TSV9Table(languageCode, bookID, tableText, checkingOptions) {
  // Note: the filename and givenLocation parameters are left blank
  let checkResults = await internalCheckTN_TSV9Table(languageCode, 'TN', bookID, '', tableText, '', {...checkingOptions, suppressNoticeDisablingFlag: false});
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}

export async function checkSQ_TSV7Table(languageCode, bookID, tableText, checkingOptions) {
  // Note: the filename and givenLocation parameters are left blank
  let checkResults = await checkQuestionsTSV7Table(languageCode, 'SQ', bookID, '', tableText, '', checkingOptions)
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}
export async function checkTQ_TSV7Table(languageCode, bookID, tableText, checkingOptions) {
  // Note: the filename and givenLocation parameters are left blank
  let checkResults = await checkQuestionsTSV7Table(languageCode, 'TQ', bookID, '', tableText, '', checkingOptions)
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}

export async function checkTWL_TSV6Table(languageCode, bookID, tableText, checkingOptions) {
  // Note: the filename and givenLocation parameters are left blank
  let checkResults = await internalCheckTWL_TSV6Table(languageCode, 'TWL', bookID, '', tableText, '', checkingOptions)
  if (!checkingOptions?.suppressNoticeDisablingFlag) {
    checkResults.noticeList = removeDisabledNotices(checkResults.noticeList);
  }
  return checkResults;
}
