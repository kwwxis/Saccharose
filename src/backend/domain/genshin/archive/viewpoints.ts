import { pathToFileURL } from 'url';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import util from 'util';
import { closeKnex } from '../../../util/db.ts';
import { defaultMap, isset } from '../../../../shared/util/genericUtil.ts';
import { fileFormatOptionsApply, fileFormatOptionsCheck } from '../../../util/fileFormatOptions.ts';
import { ViewCodexExcelConfigData, ViewpointsByRegion } from '../../../../shared/types/genshin/viewpoint-types.ts';
import { isInt } from '../../../../shared/util/numberUtil.ts';
import { WorldAreaConfigData } from '../../../../shared/types/genshin/place-types.ts';

export const VIEWPOINT_FILE_FORMAT_PARAMS: string[] = [
  'Id',
  'GadgetId',
  'SceneId',
  'GroupId',
  'ConfigId',
  'NameTextMapHash',
  'DescTextMapHash',
  'Image',
  'CityId',
  'WorldAreaId',
  'SortOrder',
  'NameText',
  'DescText',
  'CityNameText',
  'WorldArea.Id',
  'WorldArea.SceneId',
  'WorldArea.AreaId1',
  'WorldArea.AreaId2',
  'WorldArea.ElementType',
  'WorldArea.TerrainType',
  'WorldArea.AreaNameTextMapHash',
  'WorldArea.AreaNameText',
  'ParentWorldArea.Id',
  'ParentWorldArea.SceneId',
  'ParentWorldArea.AreaId1',
  'ParentWorldArea.AreaId2',
  'ParentWorldArea.ElementType',
  'ParentWorldArea.TerrainType',
  'ParentWorldArea.AreaNameTextMapHash',
  'ParentWorldArea.AreaNameText',
];

export const VIEWPOINT_DEFAULT_FILE_FORMAT_IMAGE = 'Viewpoint {NameText.EN}.png';
export const VIEWPOINT_DEFAULT_FILE_FORMAT_MAP = 'Viewpoint {NameText.EN} Map Location.png';



export async function getCityIdsWithViewpoints(ctrl: GenshinControl): Promise<Set<number>> {
  return ctrl.cached('CityIdsWithViewpoints', 'set', async () => {
    const cityIdsWithViewpoints: Set<number> = new Set();
    const viewpoints: ViewCodexExcelConfigData[] = await ctrl.readJsonFile('./ExcelBinOutput/ViewCodexExcelConfigData.json');
    for (let viewpoint of viewpoints) {
      let cityId = viewpoint.CityId || (<any> viewpoint).cityId;
      if (isInt(cityId)) {
        cityIdsWithViewpoints.add(cityId)
      }
    }
    return cityIdsWithViewpoints;
  });
}

async function postProcessViewpoint(ctrl: GenshinControl, viewpoint: ViewCodexExcelConfigData, areas: WorldAreaConfigData[]): Promise<ViewCodexExcelConfigData> {
  viewpoint.CityNameText = await ctrl.selectCityNameById(viewpoint.CityId);
  viewpoint.WorldArea = areas.find(area => area.Id === viewpoint.WorldAreaId);
  if (viewpoint.WorldArea.AreaNameText === 'Mondstadt' && viewpoint.WorldArea.TerrainType === 'AREA_TERRAIN_CITY') {
    viewpoint.WorldArea.AreaNameText = 'City of Mondstadt';
  }
  if (viewpoint.WorldArea.AreaType === 'LEVEL_2') {
    viewpoint.ParentWorldArea = areas.find(area => area.AreaType === 'LEVEL_1' && area.AreaId1 === viewpoint.WorldArea.AreaId1);
  }
  viewpoint.DownloadImage = await fileFormatOptionsApply(ctrl, viewpoint, 'FileFormat.viewpoint.image', VIEWPOINT_DEFAULT_FILE_FORMAT_IMAGE);
  viewpoint.Wikitext = fileFormatOptionsCheck(`{{Viewpoint
|id      = ${viewpoint.SortOrder}
|title   = ${viewpoint.NameText}
|title2  = ${viewpoint.WorldArea.AreaNameText || ''}
|subarea = ${viewpoint.WorldArea.AreaNameText || ''}
|area    = ${viewpoint.ParentWorldArea ? viewpoint.ParentWorldArea.AreaNameText : ''}
|region  = ${viewpoint.CityNameText}
|note    = 
|text    = ${viewpoint.DescText ? ctrl.normText(viewpoint.DescText, ctrl.outputLangCode) : ''}
|image   = ${viewpoint.DownloadImage}
|map     = ${await fileFormatOptionsApply(ctrl, viewpoint, 'FileFormat.viewpoint.map', VIEWPOINT_DEFAULT_FILE_FORMAT_MAP)}
}}`);
  return viewpoint;
}

export async function selectViewpointsByIds(ctrl: GenshinControl, viewpointIds: number[]): Promise<ViewCodexExcelConfigData[]> {
  let viewpoints: ViewCodexExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/ViewCodexExcelConfigData.json');
  viewpoints = viewpoints.filter(v => viewpointIds.includes(v.Id));

  const areas: WorldAreaConfigData[] = await ctrl.selectWorldAreas();
  const ret: ViewCodexExcelConfigData[] = [];

  for (let viewpoint of viewpoints) {
    await postProcessViewpoint(ctrl, viewpoint, areas);
    ret.push(viewpoint);
  }
  return ret;
}

export async function selectViewpoints(ctrl: GenshinControl, cityIdConstraint?: number): Promise<ViewpointsByRegion> {
  const viewpoints: ViewCodexExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/ViewCodexExcelConfigData.json');
  const areas: WorldAreaConfigData[] = await ctrl.selectWorldAreas();
  const ret: ViewpointsByRegion = defaultMap('Array');

  for (let viewpoint of viewpoints) {
    if (isset(cityIdConstraint) && viewpoint.CityId !== cityIdConstraint) {
      continue;
    }
    await postProcessViewpoint(ctrl, viewpoint, areas);
    ret[viewpoint.CityNameText].push(viewpoint);
  }

  return ret;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();
  const ret = await selectViewpoints(ctrl);
  console.log(util.inspect(ret, false, null, true));

  await closeKnex();
}
