import { isInt, toInt } from './numberUtil.ts';
import { escapeRegExp } from './stringUtil.ts';
import { IndexedRange, inRange, rangeLen } from './arrayUtil.ts';
import { isPromise } from './genericUtil.ts';

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

  applyAdjustments(adjustments: MarkerAdjustment[]) {
    adjustments = adjustments.filter(a => a.line == this.line);

    console.log('Adjustments', this, adjustments);

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

  static from(markers: Marker[]): Map<number, MarkerAggregate> {
    const aggs: Map<number, MarkerAggregate> = new Map<number, MarkerAggregate>;
    if (!markers || !markers.length) {
      return aggs;
    }
    for (let marker of markers) {
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
 * @param line The line content
 * @param lineNum The line number (starting from 1)
 */
export type MarkerPreCreateInterceptorSync = (line: string, lineNum?: number) => MarkerCreateInterceptorResult;

/**
 * @param line The line content
 * @param lineNum The line number (starting from 1)
 */
export type MarkerPreCreateInterceptorAsync = (line: string, lineNum?: number) => MarkerCreateInterceptorResult|Promise<MarkerCreateInterceptorResult>;

/**
 * @param markers The zero-to-many markers that were created for this line.
 * @param line The line content
 * @param lineNum The line number (starting from 1)
 */
export type MarkerPostCreateInterceptorSync = (markers: Marker[], line?: string, lineNum?: number) => MarkerCreateInterceptorResult;

/**
 * @param markers The zero-to-many markers that were created for this line.
 * @param line The line content
 * @param lineNum The line number (starting from 1)
 */
export type MarkerPostCreateInterceptorAsync = (markers: Marker[], line?: string, lineNum?: number) => MarkerCreateInterceptorResult|Promise<MarkerCreateInterceptorResult>;


export class Marker implements IndexedRange {
  /**
   * CSS classes for the marker, separate with '.'
   *
   * For example: `'token1.token2.token3'`
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
   * Optionally apply HTML attributes to the marker.
   */
  attr?: {[attrName: string]: string|number|boolean};

  _startMod?: number = 0;
  _endMod?: number = 0;

  constructor(token: string, line: number, start: number, end: number, attr?: {[attrName: string]: string|number}, fullLine: boolean = false) {
    this.token = token;
    this.line = line;
    this.start = start;
    this.end = end;
    this.attr = attr;
    this.fullLine = fullLine;
  }

  static fullLine(token: string, line: number) {
    return new Marker(token, line, 0, 0, null, true);
  }

  toString() {
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

  static fromString(s: string) {
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

  static async createAsync(searchText: string|RegExp, contentText: string, interceptors?: {
    pre?: MarkerPreCreateInterceptorAsync,
    post?: MarkerPostCreateInterceptorAsync,
  }, token?: string): Promise<Marker[]> {
    const ret = this.createInternal(searchText, contentText, interceptors, token);
    await Promise.all(ret.promises);
    return ret.markers;
  }

  static create(searchText: string|RegExp, contentText: string, interceptors?: {
    pre?: MarkerPreCreateInterceptorSync,
    post?: MarkerPostCreateInterceptorSync,
  }, token?: string): Marker[] {
    const ret = this.createInternal(searchText, contentText, interceptors, token);
    return ret.markers;
  }

  private static createInternal(searchText: string|RegExp, contentText: string, interceptors?: {
    pre?: MarkerPreCreateInterceptorAsync,
    post?: MarkerPostCreateInterceptorAsync,
  }, token?: string): {
    markers: Marker[],
    promises: Promise<void>[],
  } {
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

  static joining(markers: Marker[]): string {
    return markers && Array.isArray(markers) && markers.length ? markers.map(m => m.toString()).join(';') : '';
  }

  static isMarker(o: any): o is Marker {
    return !!o && typeof o === 'object' && !Array.isArray(o) && o.hasOwnProperty('token') && o.hasOwnProperty('line') &&
      (o.fullLine || isInt(o.start) || isInt(o.end));
  }

  private static multiFromString(o: string): Marker[] {
    return o.split(';')
      .map(s => s.trim())
      .filter(s => !!s)
      .map(s => this.fromString(s))
      .filter(s => !!s);
  }

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
