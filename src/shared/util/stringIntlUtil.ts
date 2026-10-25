import { LANG_CODE_TO_LOCALE, LangCode } from '../types/lang-types.ts';

/**
 * Splits the text into segments (words) based on the specified language code.
 * @param langCode The language code to use for segmentation.
 * @param text The text to segment.
 * @returns An array of segments, each represented as an Intl.SegmentData object.
 */
export const wordSplit = (langCode: LangCode, text: string): Intl.SegmentData[] => {
  const segmenter = new Intl.Segmenter(LANG_CODE_TO_LOCALE[langCode], { granularity: 'word' });
  return Array.from(segmenter.segment(text));
};
/**
 * Rejoins the segments (words) into a single string.
 * @param segments The segments to rejoin.
 * @returns The rejoined string.
 */
export const wordRejoin = (segments: Intl.SegmentData[]): string => {
  return segments.map(s => s.segment).join('');
};

/**
 * Removes the first word at the start of the segments.
 *
 * Modifies the segments passed in and returns the removed word segments.
 *
 * @param segments
 */
export function takeFromStartUntilFirstWord(segments: Intl.SegmentData[]): Intl.SegmentData[] {
  let i = 0;
  for (let segment of segments) {
    i++;
    if (segment.isWordLike) {
      break;
    }
  }
  return segments.splice(0, i);
}

/**
 * Removes the last word at the end of the segments.
 *
 * Modifies the segments passed in and returns the removed word segments.
 *
 * @param segments
 */
export function takeFromEndUntilLastWord(segments: Intl.SegmentData[]): Intl.SegmentData[] {
  let i = 0;
  for (let segment of segments.slice().reverse()) {
    i++;
    if (segment.isWordLike) {
      break;
    }
  }
  return segments.splice(-i);
}
