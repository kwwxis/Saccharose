export function doQuotes(text: string): string {
  let arr: string[] = text.split(/(''+)/g);
  let countArr = arr.length;

  if (countArr == 1) {
    return text;
  }

  // First, do some preliminary work. This may shift some apostrophes from
  // being mark-up to being text. It also counts the number of occurrences
  // of bold and italics mark-ups.
  let numBold = 0;
  let numItalics = 0;
  for (let i = 1; i < countArr; i += 2) {
    let thislen = arr[i].length;

    // If there are ever four apostrophes, assume the first is supposed to
    // be text, and the remaining three constitute mark-up for bold text.
    // (T15227: ''''foo'''' turns into ' ''' foo ' ''')
    if (thislen == 4) {
      arr[i - 1] += '\'';
      arr[i] = '\'\'\'';
      thislen = 3;
    } else if (thislen > 5) {
      // If there are more than 5 apostrophes in a row, assume they're all
      // text except for the last 5.
      // (T15227: ''''''foo'''''' turns into ' ''''' foo ' ''''')
      arr[i - 1] += '\''.repeat(thislen - 5);
      arr[i] = '\'\'\'\'\'';
      thislen = 5;
    }
    // Count the number of occurrences of bold and italics mark-ups.
    if (thislen == 2) {
      numItalics++;
    } else if (thislen == 3) {
      numBold++;
    } else if (thislen == 5) {
      numItalics++;
      numBold++;
    }
  }

  // If there is an odd number of both bold and italics, it is likely
  // that one of the bold ones was meant to be an apostrophe followed
  // by italics. Which one we cannot know for certain, but it is more
  // likely to be one that has a single-letter word before it.
  if ((numBold % 2 == 1) && (numItalics % 2 == 1)) {
    let firstSingleLetterWord = -1;
    let firstMultiLetterWord = -1;
    let firstSpace = -1;
    for (let i = 1; i < countArr; i += 2) {
      if (arr[i].length == 3) {
        let x1 = arr[i - 1].substr(-1);
        let x2 = arr[i - 1].substr(-2, 1);
        // let x1 = substr( arr[i - 1], -1 );
        // let x2 = substr( arr[i - 1], -2, 1 );
        if (x1 === ' ') {
          if (firstSpace == -1) {
            firstSpace = i;
          }
        } else if (x2 === ' ') {
          firstSingleLetterWord = i;
          // if firstsingleletterword is set, we don't
          // look at the other options, so we can bail early.
          break;
        } else if (firstMultiLetterWord == -1) {
          firstMultiLetterWord = i;
        }
      }
    }

    // If there is a single-letter word, use it!
    if (firstSingleLetterWord > -1) {
      arr[firstSingleLetterWord] = '\'\'';
      arr[firstSingleLetterWord - 1] += '\'';
    } else if (firstMultiLetterWord > -1) {
      // If not, but there's a multi-letter word, use that one.
      arr[firstMultiLetterWord] = '\'\'';
      arr[firstMultiLetterWord - 1] += '\'';
    } else if (firstSpace > -1) {
      // ... otherwise use the first one that has neither.
      // (notice that it is possible for all three to be -1 if, for example,
      // there is only one pentuple-apostrophe in the line)
      arr[firstSpace] = '\'\'';
      arr[firstSpace - 1] += '\'';
    }
  }

  // Now let's actually convert our apostrophic mush to HTML!
  let output = '';
  let buffer = '';
  let state = '';
  let i = 0;
  for (let r of arr) {
    if (i % 2 == 0) {
      if (state === 'both') {
        buffer += r;
      } else {
        output += r;
      }
    } else {
      let thislen = r.length;
      if (thislen == 2) {
        // two quotes - open or close italics
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
        } else { // state can be 'b' or ''
          output += '<i>';
          state += 'i';
        }
      } else if (thislen == 3) {
        // three quotes - open or close bold
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
      } else if (thislen == 5) {
        // five quotes - open or close both separately
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
    i++;
  }
  // Now close all remaining tags.  Notice that the order is important.
  if (state === 'b' || state === 'ib') {
    output += '</b>';
  }
  if (state === 'i' || state === 'bi' || state === 'ib') {
    output += '</i>';
  }
  if (state === 'bi') {
    output += '</b>';
  }
  // There might be lonely ''''', so make sure we have a buffer
  if (state === 'both' && buffer) {
    output += '<b><i>' + buffer + '</i></b>';
  }
  return output;
}

export type MW_QUOTE_POS = 'BOLD_OPEN'|'BOLD_CLOSE'|'ITALIC_OPEN'|'ITALIC_CLOSE';
export const MW_QUOTE_POS_TO_TAG = {
  BOLD_OPEN: '<b>',
  BOLD_CLOSE: '</b>',
  ITALIC_OPEN: '<i>',
  ITALIC_CLOSE: '</i>'
};
export const MW_TAG_TO_QUOTE_POS: {[tag: string]: MW_QUOTE_POS} = {
  '<b>': 'BOLD_OPEN',
  '</b>': 'BOLD_CLOSE',
  '<i>': 'ITALIC_OPEN',
  '</i>': 'ITALIC_CLOSE'
};

const replacePart = s => s.replace(/<\/?i>/g, `''`).replace(/<\/?b>/g, `'''`);

export function getQuotePos(s: string, i: number): MW_QUOTE_POS {
  let parts = doQuotes(s).split(/(<\/?b>|<\/?i>)/g).filter(x => !!x);
  let pos = 0;
  for (let part of parts) {
    if (MW_TAG_TO_QUOTE_POS[part]) {
      if (i === pos) {
        return MW_TAG_TO_QUOTE_POS[part];
      } else {
        pos += replacePart(part).length;
      }
    } else {
      pos += replacePart(part).length;
    }
  }
  return null;
}

export function checkQuotePos(s: string, i: number, type: MW_QUOTE_POS) {
  let checkTag = MW_QUOTE_POS_TO_TAG[type];

  let parts = doQuotes(s).split(new RegExp('('+checkTag+')', 'g')).filter(x => !!x);
  let pos = 0;
  for (let part of parts) {
    if (part === checkTag) {
      if (i === pos) {
        return true;
      } else {
        pos += replacePart(part).length;
      }
    } else {
      pos += replacePart(part).length;
    }
  }
  return false;
}

if (require.main === module) {
  console.log('doQuotes:', doQuotes(`''italic'''`));
  console.log('doQuotes:', doQuotes(`'''italic''`));
  console.log();
  console.log(`checkQuotePos:`, checkQuotePos(`'''''bold and italic'''italic''`, 0, 'BOLD_OPEN')); // false
  console.log(`checkQuotePos:`, checkQuotePos(`'''''bold and italic'''italic''`, 0, 'ITALIC_OPEN')); // true
  console.log(`checkQuotePos:`, checkQuotePos(`'''''bold and italic''bold'''`, 20, 'ITALIC_CLOSE')); // true
  console.log(`checkQuotePos:`, checkQuotePos(`'''''bold and italic''bold'''`, 26, 'BOLD_CLOSE')); // true
  console.log();
  console.log();
  console.log(`getQuotePos:`, getQuotePos(`'''''bold and italic'''italic''`, 0)); // ITALIC_OPEN
  console.log(`getQuotePos:`, getQuotePos(`'''''bold and italic''bold'''`, 20)); // ITALIC_CLOSE
  console.log(`getQuotePos:`, getQuotePos(`'''''bold and italic''bold'''`, 26)); // BOLD_CLOSE
  console.log(`getQuotePos:`, getQuotePos(`'''''bold and italic'''''`, 0)); // ITALIC_OPEN
  console.log(`getQuotePos:`, getQuotePos(`'''''bold and italic'''''`, 1)); // null
  console.log(`getQuotePos:`, getQuotePos(`'''''bold and italic'''''`, 2)); // BOLD_OPEN
  console.log(`getQuotePos:`, getQuotePos(`'''''bold and italic'''''`, 4)); // null
}