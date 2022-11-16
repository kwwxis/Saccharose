
import fs from 'fs';

const fileData = fs.readFileSync('C:/Shared/git/GenshinData/ExcelBinOutput/TalkExcelConfigData.json');
const json: any[] = JSON.parse(fileData.toString());

let maxLength = 0;

for (let obj of json) {
  if (obj._npcId && obj._npcId.length > 1) {
    if (obj._npcId.length > maxLength) {
      maxLength = obj._npcId.length;
    }
  }
}
console.log(maxLength);