import { isInt, toInt } from './numberUtil.ts';
import { escapeRegExp } from './stringUtil.ts';
import { IndexedRange, inRange, rangeLen } from './arrayUtil.ts';

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

export type MarkerLineProcessor = (line: string, lineNum?: number) => {
  /**
   * If set to true, the default marker processing for this line will be skipped.
   */
  skip?: boolean,

  /**
   * Add additional markers.
   */
  markers?: Marker[]
};

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

  static create(searchText: string|RegExp, contentText: string, customProcessor?: MarkerLineProcessor): Marker[] {
    let re = typeof searchText === 'string' ? new RegExp(escapeRegExp(searchText), 'gi') : searchText;
    let ret: Marker[] = [];

    if (!re.flags.includes('g')) {
      throw 'Error: Marker.create() can only be used with regexes containing the \'g\' flag.';
    }

    let lineNum = 1;
    for (let line of contentText.split('\n')) {
      if (customProcessor) {
        let procRet = customProcessor(line, lineNum);
        if (procRet) {
          if (procRet.markers && procRet.markers.length) {
            ret.push(... procRet.markers);
          }
          if (procRet.skip) {
            lineNum++;
            continue;
          }
        }
      }

      let match: RegExpMatchArray;
      re.lastIndex = 0;
      while ((match = re.exec(line)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches:
        if (match.index === re.lastIndex) {
          re.lastIndex++;
        }
        ret.push(new Marker('highlight', lineNum, match.index, match.index + match[0].length));
      }
      lineNum++;
    }
    return ret;
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
