import '../../loadenv';
import {promises as fs} from 'fs';
import path from 'path';
import { getGenshinDataFilePath } from '../../loadenv';

const jsonDir = getGenshinDataFilePath('./ExcelBinOutput');
const jsonsInDir = (await fs.readdir(jsonDir)).filter(file => path.extname(file) === '.json');
console.log('JSON DIR:', jsonDir);

let skip = ['ProudSkillExcelConfigData.json'];

for (let file of jsonsInDir) {
  if (skip.includes(file)) {
    continue;
  }

  const filePath = path.join(jsonDir, file);
  console.log('Processing: ' + filePath);

  let fileData = await fs.readFile(filePath, 'utf8');

  // Convert primitive arrays to be single-line.
  let newFileData = fileData.replace(/\[(\s*(\d+|\d+\.\d+|"[^"]+"|true|false),?\s*)*]/g, fm => {
    let s = fm.slice(1, -1).split(',').map(s => s.trim()).join(', ');
    return s ? '[ ' + s + ' ]' : '[]';
  });

  if (newFileData !== fileData) {
    await fs.writeFile(filePath, newFileData, 'utf8');
    console.log('  Wrote to: ' + filePath);
  } else {
    console.log('  No changes needed: ' + filePath);
  }
}

console.log('Done');