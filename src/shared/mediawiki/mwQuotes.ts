import { defaultMap } from '../util/genericUtil.ts';

const isEven = (n: number) => n % 2 === 0;
const isOdd = (n: number) => n % 2 === 1;

/*
 * Converting quotes to <i> and <b> has very specific behavior, so we have to follow the same behavior as
 * https://phabricator.wikimedia.org/source/mediawiki/browse/master/includes/parser/Parser.php rather than trying
 * to roll our own behavior.
 */
export function convertWikitextQuotes(text: string): string {
  let arr: string[] = text.split(/(''+)/g);
  let countArr = arr.length;

  if (countArr == 1) {
    return text;
  }

  let numBold = 0;
  let numItalics = 0;
  for (let i = 1; i < countArr; i += 2) {
    let thislen = arr[i].length;

    if (thislen == 4) {
      arr[i - 1] += `'`;
      arr[i] = `'''`;
      thislen = 3;
    } else if (thislen > 5) {
      arr[i - 1] += `'`.repeat(thislen - 5);
      arr[i] = `'''''`;
      thislen = 5;
    }
    if (thislen == 2) {
      numItalics++;
    } else if (thislen == 3) {
      numBold++;
    } else if (thislen == 5) {
      numItalics++;
      numBold++;
    }
  }

  if (isOdd(numBold) && isOdd(numItalics)) {
    let firstSingleLetterWord = -1;
    let firstMultiLetterWord = -1;
    let firstSpace = -1;
    for (let i = 1; i < countArr; i += 2) {
      if (arr[i].length == 3) {
        let x1 = arr[i - 1].substr(-1);
        let x2 = arr[i - 1].substr(-2, 1);
        if (x1 === ' ') {
          if (firstSpace == -1) {
            firstSpace = i;
          }
        } else if (x2 === ' ') {
          firstSingleLetterWord = i;
          break;
        } else if (firstMultiLetterWord == -1) {
          firstMultiLetterWord = i;
        }
      }
    }

    if (firstSingleLetterWord > -1) {
      arr[firstSingleLetterWord] = `''`;
      arr[firstSingleLetterWord - 1] += `'`;
    } else if (firstMultiLetterWord > -1) {
      arr[firstMultiLetterWord] = `''`;
      arr[firstMultiLetterWord - 1] += `'`;
    } else if (firstSpace > -1) {
      arr[firstSpace] = `''`;
      arr[firstSpace - 1] += `'`;
    }
  }

  let output = '';
  let buffer = '';
  let state: ''|'i'|'b'|'ib'|'bi'|'both' = '';
  for (let [i, r] of arr.entries()) {
    if (isEven(i)) {
      if (state === 'both') {
        buffer += r;
      } else {
        output += r;
      }
    } else {
      let rlen = r.length;
      if (rlen == 2) {
        if (state === 'i') {
          output += '</i>';
          state = '';
        } else if (state === 'bi') {
          output += '</i>';
          state = 'b';
        } else if (state === 'ib') {
          output += '</b></i><b>';
          state = 'b';
        } else if (state === 'both') {
          output += '<b><i>' + buffer + '</i>';
          state = 'b';
        } else {
          output += '<i>';
          state += 'i';
        }
      } else if (rlen == 3) {
        if (state === 'b') {
          output += '</b>';
          state = '';
        } else if (state === 'bi') {
          output += '</i></b><i>';
          state = 'i';
        } else if (state === 'ib') {
          output += '</b>';
          state = 'i';
        } else if (state === 'both') {
          output += '<i><b>' + buffer + '</b>';
          state = 'i';
        } else { // state can be 'i' or ''
          output += '<b>';
          state += 'b';
        }
      } else if (rlen == 5) {
        if (state === 'b') {
          output += '</b><i>';
          state = 'i';
        } else if (state === 'i') {
          output += '</i><b>';
          state = 'b';
        } else if (state === 'bi') {
          output += '</i></b>';
          state = '';
        } else if (state === 'ib') {
          output += '</b></i>';
          state = '';
        } else if (state === 'both') {
          output += '<i><b>' + buffer + '</b></i>';
          state = '';
        } else { // (state == '')
          buffer = '';
          state = 'both';
        }
      }
    }
  }
  if (state === 'b' || state === 'ib') {
    output += '</b>';
  }
  if (state === 'i' || state === 'bi' || state === 'ib') {
    output += '</i>';
  }
  if (state === 'bi') {
    output += '</b>';
  }
  if (state === 'both' && buffer) {
    output += '<b><i>' + buffer + '</i></b>';
  }
  return output;
}

export type MW_QUOTE_TYPE = 'BOLD_OPEN' | 'BOLD_CLOSE' | 'ITALIC_OPEN' | 'ITALIC_CLOSE';
export type MW_QUOTE_POSMAP = {[index: number]: MW_QUOTE_TYPE[]};
export const MW_QUOTE_TYPE_TO_TAG = {
  BOLD_OPEN: '<b>',
  BOLD_CLOSE: '</b>',
  ITALIC_OPEN: '<i>',
  ITALIC_CLOSE: '</i>',
};
export const MW_QUOTE_TYPE_TO_QUOTES = {
  BOLD_OPEN:  `'''`,
  BOLD_CLOSE: `'''`,
  ITALIC_OPEN:  `''`,
  ITALIC_CLOSE: `''`,
};
export const MW_TAG_TO_QUOTE_TYPE: {[tag: string]: MW_QUOTE_TYPE} = {
  '<b>': 'BOLD_OPEN',
  '</b>': 'BOLD_CLOSE',
  '<i>': 'ITALIC_OPEN',
  '</i>': 'ITALIC_CLOSE'
};

export function html2quotes(s: string) {
  return s.replace(/<\/?i>/g, `''`).replace(/<\/?b>/g, `'''`);
}

export function getQuoteTypes(s: string, i: number): MW_QUOTE_TYPE[] {
  return getQuotePosMap(s)[i] || [];
}

export function getQuotePosMap(s: string): MW_QUOTE_POSMAP {
  let parts: string[] = convertWikitextQuotes(s).split(/(<\/?b>|<\/?i>)/g).filter(x => !!x);
  let pos: number = 0;
  let out: MW_QUOTE_POSMAP = defaultMap('Array');

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const quoteType = MW_TAG_TO_QUOTE_TYPE[part];
    if (quoteType) {
      if (pos > (s.length - 1)) {
        pos = s.length - 1;
      }
      out[pos].push(quoteType);

      const quotes: string = MW_QUOTE_TYPE_TO_QUOTES[quoteType];

      //console.log(`QUOTE[${i}]`, s.slice(pos, pos+quotes.length), pos, quotes.length, quoteType, quotes);
      if (s.slice(pos, pos+quotes.length) === quotes) {
        pos += quotes.length;
      }
    } else {
      while (s.slice(pos, pos+part.length) !== part) {
        pos++;
      }
      pos += part.length;
    }
  }

  return out;
}

export function unnestHtmlTags(s: string) {
  let bold_open: number = 0;
  let italic_open: number = 0;
  let parts: string[] = s.split(/(<\/?[bi]>)/g);
  let out: string = '';

  for (let part of parts) {
    if (part === '<b>') {
      if (bold_open === 0) {
        out += '<b>';
      }
      bold_open++;
    } else if (part === '</b>') {
      bold_open--;
      if (bold_open === 0) {
        out += '</b>';
      }
    } else if (part === '<i>') {
      if (italic_open === 0) {
        out += '<i>';
      }
      italic_open++;
    } else if (part === '</i>') {
      italic_open--;
      if (italic_open === 0) {
        out += '</i>';
      }
    } else {
      out += part;
    }
  }

  return out;
}
