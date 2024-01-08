// List of namespaces
// (Ones we don't particularly care about for our use cases are commented out)
import { MwOwnSegment } from '../../backend/mediawiki/mwOwnSegmentHolder.ts';
import { Change } from 'diff';

export const MW_NAMESPACES = {
  // '-2': 'Media',
  // '-1': 'Special',
  0: 'Main',
  // 1: 'Talk',
  2: 'User',
  // 3: 'User talk',
  4: 'Project',
  // 5: 'Project talk',
  6: 'File',
  // 7: 'File talk',
  8: 'MediaWiki',
  // 9: 'MediaWiki talk',
  10: ' Template',
  // 11: 'Template talk',
  12: 'Help',
  // 13: 'Help talk',
  14: 'Category',
  // 15: 'Category talk',
  828: 'Module',
  // 829: 'Module talk',
};

export type MwNamespace = keyof typeof MW_NAMESPACES | '*';

export type MwArticleInfo = {
  pageid: number,
  ns: number,
  title: string,
  contentmodel: 'wikitext',
  pagelanguage: string,
  pagelanguagehtmlcode: string,
  pagelanguagedir: string,
  touched: string, // timestamp
  lastrevid: number,
  length: number,
  protection: any[],
  restrictiontypes: string[],
  notificationtimestamp: string,
  associatedpage: string, // talk page
  fullurl: string,
  editurl: string,
  canonicalurl: string,
  displaytitle: string,
  varianttitles: Record<string, string>,
  missing?: ''
};

export type MwRevision = {
  revid: number,
  pageid: number,
  parentid: number,
  minor: boolean,
  user: string,
  userid: number,
  timestamp: string,
  size: number,
  comment: string,

  content?: string,
  segments?: MwOwnSegment[],
  has_segments?: boolean,

  prevContent?: string,
  prevDiff?: Change[],
};

export type MwRevLoadMode = 'default' | 'content' | 'contentAndPrev';

export type MwArticleSearchResult = {
  ns: number,
  title: string,
  pageid: number,
  timestamp: string,
}
