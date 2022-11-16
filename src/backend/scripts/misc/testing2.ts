import '../../loadenv';
import {Control, getControl} from "../script_util";
import {loadEnglishTextMap} from "../textmap";
import { closeKnex } from '../../util/db';
import { DialogExcelConfigData } from '../../util/types';
import config from '../../config';
import {promises as fs} from 'fs';

if (require.main === module) {
  (async () => {
    /*
    let filePath = config.database.getGenshinDataFilePath('./ExcelBinOutput/DialogExcelConfigData.json');
    let result: any[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => JSON.parse(data));
    let talkRoleTypes: Set<string> = new Set();

    for (let dialog of result) {
      if (dialog.talkRole && dialog.talkRole._type) {
        talkRoleTypes.add(dialog.talkRole._type);
      }
    }

    console.log('talkRoleTypes', talkRoleTypes);
    */

    let filePath = config.database.getGenshinDataFilePath('./ExcelBinOutput/MaterialExcelConfigData.json');
    let result: any[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => JSON.parse(data));
    let materialTypes: Set<string> = new Set();
    let itemTypes: Set<string> = new Set();
    let useTargets: Set<string> = new Set();
    let useOps: Set<string> = new Set();

    let uniqueProps: {[name: string]: string} = {};

    for (let material of result) {
      if (material.materialType) {
        materialTypes.add(material.materialType);
      }
      if (material.itemType) {
        itemTypes.add(material.itemType);
      }
      if (material.useTarget) {
        useTargets.add(material.useTarget);
      }
      if (material.itemUse) {
        for (let x of material.itemUse) {
          useOps.add(x.useOp);
        }
      }
      Object.keys(material).forEach(key => {
        uniqueProps[key] = typeof material[key];
      });
    }

    console.log('itemTypes', itemTypes);
    console.log('materialTypes', materialTypes);
    console.log('useTargets', useTargets);
    console.log('useOps', useOps);
    console.log('uniqueProps', uniqueProps);
  })();
}