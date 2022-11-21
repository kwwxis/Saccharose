import '../../loadenv';
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

    /*
    let filePath = config.database.getGenshinDataFilePath('./ExcelBinOutput/MaterialExcelConfigData.json');
    let result: any[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => JSON.parse(data));
    let materialTypes: Set<string> = new Set();
    let itemTypes: Set<string> = new Set();
    let useTargets: Set<string> = new Set();
    let useOps: Set<string> = new Set();

    let uniqueProps: {[name: string]: string} = {};

    for (let material of result) {
      if (material.MaterialType) {
        materialTypes.add(material.MaterialType);
      }
      if (material.ItemType) {
        itemTypes.add(material.ItemType);
      }
      if (material.UseTarget) {
        useTargets.add(material.UseTarget);
      }
      if (material.ItemUse) {
        for (let x of material.ItemUse) {
          useOps.add(x.UseOp);
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
    console.log('uniqueProps', uniqueProps);*/

    let filePath = config.database.getGenshinDataFilePath('./ExcelBinOutput/DungeonExcelConfigData.json');
    let result: any[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => JSON.parse(data));
    let types: Set<string> = new Set();

    let uniqueProps: {[name: string]: string} = {};

    for (let dungeon of result) {
      if (dungeon.Type) {
        types.add(dungeon.Type);
      }
      Object.keys(dungeon).forEach(key => {
        uniqueProps[key] = typeof dungeon[key];
      });
    }

    console.log('types', types);
    console.log('uniqueProps', uniqueProps);
  })();
}