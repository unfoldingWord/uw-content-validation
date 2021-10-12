export const DEFAULT_EXCERPT_LENGTH = 20;

export const REPO_CODES_LIST = [
  'UHB', 'UGNT',
  'LT', 'ST',
  'TA', 'TW', 'TWL',
  // The ones with 2 suffix are the 2021 new TSV format repos
  // The ones with 1 suffix are the old markdown repos (e.g., in Door43-Catalog)
  'TN', 'TN2', 'TQ', 'TQ1',
  'SN', 'SQ',
  'UGL', 'UHAL',
  'OBS', 'OBS-TWL',
  'OBS-TN', 'OBS-TN1', 'OBS-TQ', 'OBS-TQ1',
  'OBS-SN', 'OBS-SN1', 'OBS-SQ', 'OBS-SQ1',
];

export const CATALOG_NEXT_ONLY_REPO_CODES_LIST = [
  'TWL',
  'TN2', 'TQ',
  'SN', 'SQ',
  'OBS-TWL',
  'OBS-TN', 'OBS-TQ',
  'OBS-SN', 'OBS-SQ',
];

export const NUM_OBS_STORIES = 50;
export const MAX_OBS_FRAMES = 18; // Stories 16, 19, and 49 each have 18 frames

export const OBS_FRAME_COUNT_LIST = [ // Starts with count for story #1
  16, 12, 16, 9, 10, 7, 10, 15, 15, 12, 8, 14, 15, 15, 13, 18, 14, 13, 18, 13, 15, 7, 10, 9, 8,
  10, 11, 10, 9, 9, 8, 16, 9, 10, 13, 7, 11, 15, 12, 9, 8, 11, 13, 9, 13, 10, 14, 14, 18, 17];
