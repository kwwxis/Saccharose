import { pathToFileURL } from 'url';
import { getTextMapItem, loadEnglishTextMap } from '../textmap';
import { Control, getControl, normText } from '../script_util';
import util from 'util';
import { closeKnex } from '../../util/db';
import { defaultMap } from '../../../shared/util/genericUtil';

export interface WorldAreaConfigData {
  Id: number,
  SceneId: number,
  AreaId1: number,
  AreaId2: number,

  ElementType?: string,
  TerrainType?: 'AREA_TERRAIN_CITY' | 'AREA_TERRAIN_OUTDOOR',
  AreaType: 'LEVEL_1' | 'LEVEL_2',

  AreaNameTextMapHash: number,
  AreaNameText: string,

  AreaDefaultLock: boolean,
  ShowTips: boolean,
  TowerPointId: number,
  AreaOffset: number[],
  MinimapScale: number,

  BIIDMOCNDEL: number[],
  HBLACDGEBND: number[],
  GJBLMBDABFF: boolean,
}

export interface ViewCodexExcelConfigData {
  Id: number,
  GadgetId: number,
  SceneId: number,
  GroupId: number,
  ConfigId: number,
  NameTextMapHash: number,
  DescTextMapHash: number,
  Image: string,
  CityId: number,
  WorldAreaId: number,
  SortOrder: number,
  NameText: string,
  DescText: string,
  ShowOnlyUnlocked: boolean,

  CityNameText?: string,
  WorldArea?: WorldAreaConfigData,
  ParentWorldArea?: WorldAreaConfigData,
  Wikitext?: string,
}

export type ViewpointsByRegion = {[region: string]: ViewCodexExcelConfigData[]};

export async function selectViewpoints(ctrl: Control): Promise<ViewpointsByRegion> {
  let viewpoints: ViewCodexExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/ViewCodexExcelConfigData.json');
  let areas: WorldAreaConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/WorldAreaConfigData.json');

  let ret: ViewpointsByRegion = defaultMap('Array');

  for (let viewpoint of viewpoints) {
    viewpoint.CityNameText = await ctrl.selectCityNameById(viewpoint.CityId);
    viewpoint.WorldArea = areas.find(area => area.Id === viewpoint.WorldAreaId);
    if (viewpoint.WorldArea.AreaNameText === 'Mondstadt' && viewpoint.WorldArea.TerrainType === 'AREA_TERRAIN_CITY') {
      viewpoint.WorldArea.AreaNameText = 'City of Mondstadt';
    }
    if (viewpoint.WorldArea.AreaType === 'LEVEL_2') {
      viewpoint.ParentWorldArea = areas.find(area => area.AreaType === 'LEVEL_1' && area.AreaId1 === viewpoint.WorldArea.AreaId1);
    }
    viewpoint.Wikitext = `{{Viewpoint
|id      = ${viewpoint.SortOrder}
|title   = ${viewpoint.NameText}
|title2  = ${viewpoint.WorldArea.AreaNameText || ''}
|subarea = ${viewpoint.WorldArea.AreaNameText || ''}
|area    = ${viewpoint.ParentWorldArea ? viewpoint.ParentWorldArea.AreaNameText : ''}
|region  = ${viewpoint.CityNameText}
|note    = 
|text    = ${viewpoint.DescText ? normText(viewpoint.DescText, ctrl.outputLangCode) : ''}
|image   = Viewpoint ${viewpoint.NameText}.png
|map     = Viewpoint ${viewpoint.NameText} Map Location.png
}}`.trim();
    ret[viewpoint.CityNameText].push(viewpoint);
  }

  return ret;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadEnglishTextMap();

  const ctrl = getControl();
  const ret = await selectViewpoints(ctrl);
  console.log(util.inspect(ret, false, null, true));

  await closeKnex();
}