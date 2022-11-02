import '../../setup';
import {Control, getControl} from "../script_util";
import {loadEnglishTextMap} from "../textmap";
import { closeKnex } from '@db';
import { DialogExcelConfigData } from '@types';
import config from '@/config';
import {promises as fs} from 'fs';

if (require.main === module) {
  (async () => {
    let filePath = config.database.getGenshinDataFilePath('./ExcelBinOutput/DialogExcelConfigData.json');
    let result: any[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => JSON.parse(data));
    let talkRoleTypes: Set<string> = new Set();

    for (let dialog of result) {
      if (dialog.talkRole && dialog.talkRole._type) {
        talkRoleTypes.add(dialog.talkRole._type);
      }
    }

    console.log(talkRoleTypes);
  })();
}