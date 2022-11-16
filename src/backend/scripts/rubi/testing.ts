import '../../loadenv';
//import {normText} from './script_util';
import {TEXT_WIDTH_LOOKUP_TABLE} from './text_width_lookup';

import { init } from 'server-text-width';

const { getTextWidth } = init(TEXT_WIDTH_LOOKUP_TABLE);

console.log('A');
console.log(getTextWidth('Measure my width', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));
console.log(getTextWidth('Measure', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));
console.log(getTextWidth('my', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));
console.log(getTextWidth('My', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));
console.log(getTextWidth('width', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));

console.log('\nB');
console.log(getTextWidth('鑠石の丘', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));

console.log('\nC');
console.log(getTextWidth('鑠', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));
console.log(getTextWidth('石', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));
console.log(getTextWidth('の', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));
console.log(getTextWidth('丘', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));

console.log('\nD');
console.log(getTextWidth('しゃくせき', {fontName: 'Rubik', fontSize: '8px', fontWeight: '400'}));
console.log(getTextWidth('おか', {fontName: 'Rubik', fontSize: '8px', fontWeight: '400'}));

console.log('\nE');
console.log(getTextWidth('Scarlet King', {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'}));
console.log(getTextWidth('King Deshret', {fontName: 'Rubik', fontSize: '8px', fontWeight: '400'}));

type RubyInfo = {text: string, width: number, type: 'S'|'D', pos: number};

const normWidth = (s: string) => getTextWidth(s, {fontName: 'Rubik', fontSize: '16px', fontWeight: '400'});
const rtWidth = (s: string) => getTextWidth(s, {fontName: 'Rubik', fontSize: '8px', fontWeight: '400'});

export const convertRubi = (text: string): string => {
  let rubyList: RubyInfo[] = [];

  let i = 0;
  text = text.replace(/{RUBY#\[([SD])\]([^}]+)}/g, (_match: string, p1: 'S'|'D', p2: string) => {
    rubyList.push({
      text: p2,
      width: rtWidth(p2),
      type: p1,
      pos: -1,
    });
    return '{RUBY'+(i++)+'}';
  });

  let rubySplit = text.split(/({RUBY\d+})/); // keep whitespace parts
  let currentPos = 0;
  text = '';
  for (let part of rubySplit) {
    if (part.startsWith('{RUBY')) {
      let rubyNum = parseInt(/{RUBY(\d+)}/.exec(part)[1]);
      rubyList[rubyNum].pos = currentPos;
      continue;
    }
    currentPos += part.length;
    text += part;
  }

  console.log('text:', text);
  console.log('ruby info:', rubyList);

  let words: string[] = text.split(/(\s+)/g);

  let idxStart: number = 0;
  for (let word of words) {
    let idxEnd = idxStart + word.length;

    idxStart = idxEnd;
  }

  // console.log('split parts', parts);
  // for (let i = 0; i < parts.length; i++) {
  //   let prevPart = i == 0 ? null : parts[i - 1];
  //   let nextPart = i == (parts.length - 1) ? null : parts[i + 1];
  //   let part = parts[i];
  //   if (part.startsWith('{RUBY')) {
  //     let rubyNum = parseInt(/{RUBY(\d+)}/.exec(part)[1]);
  //     let ruby = rubyList[rubyNum];
  //     let rubyHalfWidth = ruby.width/2;
  //     console.log('uh', rubyHalfWidth, prevPart, nextPart);
  //   }
  // }
  return null;
}

console.log('\nF');
console.log(convertRubi('Lorem ipsum Scarle{RUBY#[S]King Deshret}t King lorem ipsum.'));