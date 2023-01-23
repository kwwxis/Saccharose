import { isInt } from './numberUtil';

/**
 * Aggregate of all markers in a single line.
 */
export class MarkerAggregate {
  line: number;
  isFront: boolean;
  ranges: {startCol: number, endCol: number, fullLine: boolean, token: string}[] = [];

  private constructor(line: number, isFront: boolean) {
    this.line = line;
    this.isFront = isFront;
  }

  /**
   * Convert an array of markers into marker aggregates.
   *
   * Does not allow overlaps. Processes from left to right. Markers overlapping already-processed markers will be
   * silently ignored.
   */
  static from(markers: Marker[]): { front: Map<number, MarkerAggregate>, back: Map<number, MarkerAggregate> } {
    let front: Map<number, MarkerAggregate> = new Map<number, MarkerAggregate>();
    let back: Map<number, MarkerAggregate> = new Map<number, MarkerAggregate>();

    if (!markers || !markers.length) {
      return { front, back };
    }

    for (let marker of markers) {
      let agg: MarkerAggregate = marker.isFront ? front.get(marker.line) : back.get(marker.line);
      if (!agg) {
        agg = new MarkerAggregate(marker.line, marker.isFront);
        marker.isFront ? front.set(marker.line, agg) : back.set(marker.line, agg);
      }
      let doOverlap: boolean = false;
      for (let range of agg.ranges) {
        doOverlap = range.fullLine || marker.fullLine || (Math.max(range.startCol, marker.startCol) < Math.min(range.endCol, marker.endCol));
        if (doOverlap) {
          break;
        }
      }
      if (!doOverlap) {
        agg.ranges.push({startCol: marker.startCol, endCol: marker.endCol, fullLine: marker.fullLine, token: marker.token});
      }
    }

    return { front, back };
  }
}

export class Marker {
  token: string;
  line: number;
  startCol: number;
  endCol: number;
  fullLine?: boolean;
  isFront?: boolean;

  constructor(token: string, line: number, startCol: number, endCol: number, fullLine: boolean = false, isFront: boolean = false) {
    this.token = token;
    this.line = line;
    this.startCol = startCol;
    this.endCol = endCol;
    this.fullLine = fullLine;
    this.isFront = isFront;
  }

  static fullLine(token: string, line: number, isFront: boolean = false) {
    return new Marker(token, line, 0, 0, true, isFront);
  }

  toString() {
    let s = this.token + ',' + this.line;
    if (this.fullLine) {
      s += ',fullLine';
    } else {
      s += `,${this.startCol},${this.endCol}`;
    }
    if (this.isFront) {
      s += 'isFront';
    }
    return s;
  }

  static fromString(s: string) {
    let a = s.trim().split(',').map(x => x.trim()).filter(x => !!x);
    if (a.length < 3) {
      return null;
    }

    let intArgs = a.filter(arg => isInt(arg)).map(arg => parseInt(arg));
    let isFullLine = a.some(arg => arg.toLowerCase().includes('fullline') || arg.toLowerCase().includes('full-line'));
    let isFront = a.some(arg => arg.toLowerCase().includes('front'));

    if (isFullLine) {
      return new Marker(a[0], intArgs[0], 0, 0, isFullLine, isFront);
    } else {
      return new Marker(a[0], intArgs[0], intArgs[1] || 0, intArgs[2] || 0, isFullLine, isFront);
    }
  }
}