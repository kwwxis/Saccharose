import { isInt, toInt } from './numberUtil.ts';
import { escapeRegExp } from './stringUtil.ts';
import { IndexedRange, inRange, rangeLen } from './arrayUtil.ts';
import { isPromise, isUnset } from './genericUtil.ts';

/**
 * An adjustment to the content-text that may change the positions of markers.
 */
export type MarkerAdjustment = {
  /**
   * The line that the adjustment happened at.
   */
  line: number,

  /**
   * The column that the adjustment happened at.
   */
  col: number,

  /**
   * The adjustment operation type.
   */
  mode: 'delete' | 'insert',

  /**
   * The number of characters that were deleted/inserted depending on the 'mode'
   */
  count: number,
}

/**
 * Aggregate of all markers in a single line.
 */
export class MarkerAggregate {
  line: number;
  markers: Marker[] = [];

  private constructor(line: number) {
    this.line = line;
  }

  /**
   * Applies adjustments to all of the markers in this aggregate.
   *
   * @param adjustments The adjustments to apply to the markers.
   */
  applyAdjustments(adjustments: MarkerAdjustment[]) {
    adjustments = adjustments.filter(a => a.line == this.line);

    for (let marker of this.markers) {
      for (let a of adjustments) {
        // If the adjustment is after the marker, then we don't have to do anything
        if (a.col > marker.end) {
          continue;
        }

        // Otherwise, the adjustment is either before or in the marker, in which case we need to do something...

        const aRange: IndexedRange = {start: a.col, end: a.col + a.count};
        let inMarkerLen: number = 0;
        let beforeMarkerLen: number = 0;

        if (inRange(aRange.start, marker)) {
          inMarkerLen = rangeLen(aRange);
        } else if (a.mode === 'insert') {
          beforeMarkerLen = rangeLen(aRange);
        } else if (inRange(aRange.end, marker) && aRange.end !== marker.start) {
          inMarkerLen = aRange.end - marker.start;
          beforeMarkerLen = marker.start - aRange.start;
        } else {
          beforeMarkerLen = rangeLen(aRange);
        }

        if (a.mode === 'delete') {
          marker._startMod -= beforeMarkerLen;
          marker._endMod -= beforeMarkerLen;
          marker._endMod -= inMarkerLen;
        } else {
          marker._startMod += beforeMarkerLen;
          marker._endMod += beforeMarkerLen;
          marker._endMod += inMarkerLen;
        }
      }
    }

    for (let marker of this.markers) {
      marker.start += marker._startMod;
      marker.end += marker._endMod;
      marker._startMod = 0;
      marker._endMod = 0;
    }
  }

  /**
   * Creates a map of MarkerAggregates from a list of markers.
   *
   * @param markers
   * @return A map of MarkerAggregates, keyed by line number.
   */
  static from(markers: Marker[]): Map<number, MarkerAggregate> {
    const aggs: Map<number, MarkerAggregate> = new Map<number, MarkerAggregate>;
    if (!markers || !markers.length) {
      return aggs;
    }
    for (let marker of markers) {
      // Skip markers that are not valid, either because it is a 0-length marker or because the end is before the start.
      // Full-line markers are exempt from this check because they don't have a start or end.
      if (!marker.fullLine && (marker.start === marker.end || marker.end < marker.start)) {
        continue;
      }

      let agg: MarkerAggregate = aggs.get(marker.line);
      if (!agg) {
        agg = new MarkerAggregate(marker.line);
        aggs.set(marker.line, agg);
      }
      agg.markers.push(marker);
    }
    return aggs;
  }
}

/**
 * An object that should be returned by marker creation interceptors
 * to indicate whether to skip default marker processing and/or add additional markers.
 *
 * Do note that `skip` only skips the default markers but does not skip any additional markers that are added via
 * the `markers` property. If you wish to "replace" the default markers with your own entirely, then set `skip` to true
 * and populate the `markers` property with your own markers.
 */
export type MarkerCreateInterceptorResult = {
  /**
   * If set to true, the default marker processing for this line will be skipped.
   */
  skip?: boolean,

  /**
   * Add additional markers.
   */
  markers?: Marker[]
};

/**
 * An interceptor that is called before the default marker creation for a line.
 * It can return an object to indicate whether to skip default marker processing and/or add additional markers.
 *
 * @param line The line content
 * @param lineNum The line number (starting from 1)
 */
export type MarkerPreCreateInterceptorSync = (line: string, lineNum?: number) => MarkerCreateInterceptorResult;

/**
 * An interceptor that is called before the default marker creation for a line.
 * It can return an object to indicate whether to skip default marker processing and/or add additional markers.
 *
 * @param line The line content
 * @param lineNum The line number (starting from 1)
 */
export type MarkerPreCreateInterceptorAsync = (line: string, lineNum?: number) => MarkerCreateInterceptorResult|Promise<MarkerCreateInterceptorResult>;

/**
 * An interceptor that is called after the default marker creation for a line.
 * It can return an object to indicate whether to discard the default markers and/or add additional markers.
 *
 * If `skip` is set to true, then the default markers will be discarded and only the additional markers (if any) will be used.
 *
 * @param markers The zero-to-many markers that were created for this line.
 * @param line The line content
 * @param lineNum The line number (starting from 1)
 */
export type MarkerPostCreateInterceptorSync = (markers: Marker[], line?: string, lineNum?: number) => MarkerCreateInterceptorResult;

/**
 * An interceptor that is called after the default marker creation for a line.
 * It can return an object to indicate whether to discard the default markers and/or add additional markers.
 *
 * If `skip` is set to true, then the default markers will be discarded and only the additional markers (if any) will be used.
 *
 * @param markers The zero-to-many markers that were created for this line.
 * @param line The line content
 * @param lineNum The line number (starting from 1)
 */
export type MarkerPostCreateInterceptorAsync = (markers: Marker[], line?: string, lineNum?: number) => MarkerCreateInterceptorResult|Promise<MarkerCreateInterceptorResult>;

/**
 * A marker that can be applied to a line of text. It has a token (CSS class), a line number, and a start and end column.
 *
 * This class does not support multi-line markers. If you need to mark multiple lines, you should create a separate
 * marker for each line.
 */
export class Marker implements IndexedRange {
  /**
   * CSS classes for the marker, separate with '.'
   *
   * For example, `'token1.token2.token3'`
   *
   * In the above example, the marker will have the CSS classes `token1`, `token2`, and `token3`.
   */
  token: string;

  /**
   * Line number (1-based)
   */
  line: number;

  /**
   * Column number (0-based)
   */
  start: number;

  /**
   * Column number (0-based)
   */
  end: number;

  /**
   * If the marker is for the entire line? If true, then 'start' and 'end' will be ignored.
   */
  fullLine?: boolean;

  /**
   * Optionally, apply HTML attributes to the marker.
   */
  attr?: {[attrName: string]: string|number|boolean};

  // The two fields below are used internally to apply adjustments to the marker's start and end positions.
  // Their values are ephemeral and will be reset to 0 after the adjustments are applied.
  _startMod?: number = 0;
  _endMod?: number = 0;

  /**
   * Creates a new marker. See field docs for details on the parameters.
   */
  constructor(token: string, line: number, start: number, end: number, attr?: {[attrName: string]: string|number}, fullLine: boolean = false) {
    this.token = token;
    this.line = line;
    this.start = start;
    this.end = end;
    this.attr = attr;
    this.fullLine = fullLine;
  }

  /**
   * Helper factory method to create a full-line marker.
   */
  static fullLine(token: string, line: number): Marker {
    return new Marker(token, line, 0, 0, null, true);
  }

  /**
   * Returns a string representation of the marker that can be used to reconstruct the marker using `Marker.fromString()`.
   */
  toString(): string {
    let s = this.token + ',' + this.line;
    if (this.fullLine) {
      s += ',fullLine';
    } else {
      s += `,${this.start},${this.end}`;
    }
    if (this.attr) {
      for (let [key, val] of Object.entries(this.attr)) {
        s += ',attr:' + key + ':' + encodeURIComponent(val);
      }
    }
    return s;
  }

  /**
   * Creates a marker from a string representation of the marker. See `Marker.toString()` for details on the format.
   *
   * @param s The string representation of the marker.
   * @returns A new Marker object, or null if the string is invalid.
   */
  static fromString(s: string): Marker {
    let a = s.trim().split(',').map(x => x.trim()).filter(x => !!x);
    if (a.length < 3) {
      return null;
    }

    let intArgs: number[] = [];
    let isFullLine: boolean = false;
    let attr: {[attrName: string]: string|number} = {};

    for (let arg of a) {
      if (isInt(arg)) {
        intArgs.push(toInt(arg));
      } else if (arg.startsWith('attr:')) {
        const argParts = arg.split(':');
        const key: string = argParts[1];
        let value: any = decodeURIComponent(argParts[2]);

        if (value.toLowerCase() === 'true') {
          value = true;
        } else if (value.toLowerCase() === 'false') {
          value = false;
        } else if (isInt(value)) {
          value = toInt(value);
        }

        attr[key] = value;
      } else if (arg.toLowerCase().includes('fullline') || arg.toLowerCase().includes('full-line')) {
        isFullLine = true;
      }
    }

    if (!Object.keys(attr).length) {
      attr = null;
    }

    if (isFullLine) {
      return new Marker(a[0], intArgs[0], 0, 0, attr, isFullLine);
    } else {
      return new Marker(a[0], intArgs[0], intArgs[1] || 0, intArgs[2] || 0, attr, isFullLine);
    }
  }

  /**
   * Creates markers for all occurrences of the search text in the content text. The search text can be a string or a regular expression.
   *
   * This is asynchronous for the sake of any asynchronous interceptors.
   * If you don't have any asynchronous interceptors, you can use `Marker.create()` instead.
   *
   * @param searchText The text to search for. Can be a string or a regular expression.
   * @param contentText The text to search in.
   * @param interceptors Optional interceptors to modify the markers before and after creation.
   * @param token Optional token to use for the markers. If not provided, the default token will be used.
   * @returns An array of markers for all occurrences of the search text in the content text.
   */
  static async createAsync(searchText: string|RegExp, contentText: string, interceptors?: {
    pre?: MarkerPreCreateInterceptorAsync,
    post?: MarkerPostCreateInterceptorAsync,
  }, token?: string): Promise<Marker[]> {
    const ret = this.createInternal(searchText, contentText, interceptors, token);
    await Promise.all(ret.promises);
    return ret.markers;
  }

  /**
   * Creates markers for all occurrences of the search text in the content text. The search text can be a string or a regular expression.
   *
   * This is synchronous and will not wait for any asynchronous interceptors.
   * If you have any asynchronous interceptors, use `Marker.createAsync()` instead.
   *
   * @param searchText The text to search for. Can be a string or a regular expression.
   * @param contentText The text to search in.
   * @param interceptors Optional interceptors to modify the markers before and after creation.
   * @param token Optional token to use for the markers. If not provided, the default token will be used.
   * @returns An array of markers for all occurrences of the search text in the content text.
   */
  static create(searchText: string|RegExp, contentText: string, interceptors?: {
    pre?: MarkerPreCreateInterceptorSync,
    post?: MarkerPostCreateInterceptorSync,
  }, token?: string): Marker[] {
    const ret = this.createInternal(searchText, contentText, interceptors, token);
    return ret.markers;
  }

  /**
   * The internal implementation of the marker creation logic. This is used by both `create()` and `createAsync()`.
   */
  private static createInternal(searchText: string|RegExp, contentText: string, interceptors?: {
    pre?: MarkerPreCreateInterceptorAsync,
    post?: MarkerPostCreateInterceptorAsync,
  }, token?: string): {
    markers: Marker[],
    promises: Promise<void>[],
  } {
    if (isUnset(searchText)) {
      throw 'Error: Marker.create() used with null or undefined search text';
    }
    if (isUnset(contentText)) {
      throw 'Error: Marker.create() used with null or undefined content text';
    }

    const re: RegExp = typeof searchText === 'string' ? new RegExp(escapeRegExp(searchText), 'gi') : searchText;
    const markers: Marker[] = [];
    const promises: Promise<void>[] = [];

    if (!re.flags.includes('g')) {
      throw 'Error: Marker.create() can only be used with regexes containing the \'g\' flag.';
    }

    const queue: [number, string][] = [];
    {
      let lineNum = 1;
      for (let line of contentText.split('\n')) {
        queue.push([lineNum, line]);
        lineNum++;
      }
    }

    const doMarking = (lineNum: number, line: string, preIntercepted?: MarkerCreateInterceptorResult) => {
      if (preIntercepted) {
        if (preIntercepted.markers && preIntercepted.markers.length) {
          markers.push(... preIntercepted.markers);
        }
        if (preIntercepted.skip) {
          return;
        }
      }

      let lineMarkers: Marker[] = [];

      let match: RegExpMatchArray;
      re.lastIndex = 0;
      while ((match = re.exec(line)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches:
        if (match.index === re.lastIndex) {
          re.lastIndex++;
        }
        lineMarkers.push(new Marker(token || 'highlight', lineNum, match.index, match.index + match[0].length));
      }

      if (interceptors?.post) {
        const postIntercepted = interceptors.post(lineMarkers, line, lineNum);
        if (isPromise(postIntercepted)) {
          promises.push(postIntercepted.then(ret => handlePostIntercept(lineMarkers, ret)));
        } else {
          handlePostIntercept(lineMarkers, postIntercepted);
        }
      } else {
        handlePostIntercept(lineMarkers, null);
      }
    };

    const handlePostIntercept = (lineMarkers: Marker[], postIntercepted: MarkerCreateInterceptorResult) => {
      if (postIntercepted) {
        if (postIntercepted.markers && postIntercepted.markers.length) {
          markers.push(... postIntercepted.markers);
        }
        if (postIntercepted.skip) {
          return;
        }
      }
      markers.push(... lineMarkers);
    }

    for (let [lineNum, line] of queue) {
      if (interceptors?.pre) {
        const preIntercepted = interceptors.pre(line, lineNum);
        if (isPromise(preIntercepted)) {
          promises.push(preIntercepted.then(ret => doMarking(lineNum, line, ret)));
        } else if (preIntercepted) {
          doMarking(lineNum, line, preIntercepted);
        }
      } else {
        doMarking(lineNum, line);
      }
    }

    return { markers, promises };
  }

  /**
   * Joins an array of markers into a single string representation that can be used to reconstruct the markers using `Marker.splitting()`.
   *
   * This is *not* something that merges markers into a single marker, but rather a serialization function.
   *
   * @param markers The array of markers to join.
   * @returns A string representation of the markers.
   */
  static joining(markers: Marker[]): string {
    return markers && Array.isArray(markers) && markers.length ? markers.map(m => m.toString()).join(';') : '';
  }

  /**
   * Checks if an object is probably a Marker and returns a type-narrowing result.
   * This is not a foolproof check, but it should be sufficient for most cases.
   *
   * @param o The object to check.
   * @returns True if the object is probably a Marker, false otherwise.
   */
  static isMarker(o: any): o is Marker {
    return !!o && typeof o === 'object' && !Array.isArray(o) && o.hasOwnProperty('token') && o.hasOwnProperty('line') &&
      (o.fullLine || isInt(o.start) || isInt(o.end));
  }

  /**
   * Helper for splitting() that splits a string into multiple markers using ';' as the delimiter.
   */
  private static multiFromString(o: string): Marker[] {
    return o.split(';')
      .map(s => s.trim())
      .filter(s => !!s)
      .map(s => this.fromString(s))
      .filter(s => !!s);
  }

  /**
   * Splits a string or an array of strings/markers into an array of markers.
   *
   * - If the input is a string, it will be split by ';' and each part will be converted to a marker.
   * - If the input is an array, each element will be processed individually.
   * - Each element can be a string or a marker. If it is a string, it will be split by ';' and converted to markers.
   *
   * @param o The input to split. Can be a string, a marker, or an array of strings/markers.
   * @returns An array of markers.
   */
  static splitting(o: string|Marker|(string|Marker)[]): Marker[] {
    if (!o) {
      return [];
    }
    if (Marker.isMarker(o)) {
      return [o];
    }
    if (!o.length) {
      return [];
    }
    if (typeof o === 'string') {
      return Marker.multiFromString(o);
    }
    let markers: Marker[] = [];
    for (let s of o) {
      if (typeof s === 'string') {
        markers.push(... Marker.multiFromString(s));
      } else {
        markers.push(s);
      }
    }
    return markers;
  }
}
