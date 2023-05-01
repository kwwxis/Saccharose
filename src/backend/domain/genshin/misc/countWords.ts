import '../../../loadenv';
import { pathToFileURL } from 'url';
import { getFullTextMap, loadEnglishTextMap } from '../textmap';
import { closeKnex } from '../../../util/db';
import { sort } from '../../../../shared/util/arrayUtil';
import { trim } from '../../../../shared/util/stringUtil';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadEnglishTextMap();

  let wordMap: {[word: string]: number} = {};

  let textmap = getFullTextMap('EN');
  for (let line of Object.values(textmap)) {
    let words = line.split(/\s+|\n|\\n|\{|}|<|>/g).filter(x => !!x);
    for (let word of words) {
      word = trim(word, '.?!,;()"\'#:·—-');
      if (word !== 'I' && !word.startsWith(`I'`)) {
        word = word.toLowerCase();
      }
      if (!word.trim()) {
        continue;
      }
      if (!wordMap[word]) {
        wordMap[word] = 0;
      }
      wordMap[word] = wordMap[word] + 1;
    }
  }

  let wordArray = Object.keys(wordMap).map(word => ({word, count: wordMap[word]}));
  sort(wordArray, '-count');

  console.log('Rank'.padEnd(7, ' ') + 'Count'.padEnd(8, ' ') + 'Word');
  let rank = 1;
  for (let item of wordArray.slice(0, 1000)) {
    console.log(String(rank).padEnd(7, ' ') + String(item.count).padEnd(8, ' ') + item.word);
    rank++;
  }

  await closeKnex();
}