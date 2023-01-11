import { isInt } from './numberUtil';

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