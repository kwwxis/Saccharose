import '../../../loadenv';
import { GenshinControl, getGenshinControl } from '../genshinControl';
import { pathToFileURL } from 'url';
import util from 'util';
import { closeKnex } from '../../../util/db';
import { cached } from '../../../util/cache';
import {
  FurnitureMakeExcelConfigData,
  FurnitureSuiteExcelConfigData,
  HomeWorldFurnitureExcelConfigData,
  HomeWorldFurnitureTypeExcelConfigData,
} from '../../../../shared/types/genshin/homeworld-types';

async function selectHomeWorldFurniture(ctrl: GenshinControl) {

  const furnitureList: HomeWorldFurnitureExcelConfigData[] = await cached('', async () => {
    return ctrl.readExcelDataFile('HomeWorldFurnitureExcelConfigData.json', true);
  });

  const typeList: HomeWorldFurnitureTypeExcelConfigData[] = await cached('', async () => {
    return ctrl.readExcelDataFile('HomeWorldFurnitureTypeExcelConfigData.json', true);
  });

  const suiteList: FurnitureSuiteExcelConfigData[] = await cached('', async () => {
    return ctrl.readExcelDataFile('FurnitureSuiteExcelConfigData.json', true);
  });

  const makeList: FurnitureMakeExcelConfigData[] = await cached('', async () => {
    return ctrl.readExcelDataFile('FurnitureSuiteExcelConfigData.json', true);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();
  const ret = await selectHomeWorldFurniture(ctrl);
  console.log(util.inspect(ret, false, null, true));

  await closeKnex();
}