import { pathToFileURL } from 'url';
import { loadEnglishTextMap } from '../textmap';
import { Control, getControl, normText } from '../script_util';
import util from 'util';
import { closeKnex } from '../../util/db';
import { defaultMap, isset } from '../../../shared/util/genericUtil';
import { fileFormatOptionsApply, fileFormatOptionsCheck } from '../../util/fileFormatOptions';
import { WorldAreaConfigData } from '../../../shared/types/general-types';
import { ViewCodexExcelConfigData, ViewpointsByRegion } from '../../../shared/types/viewpoint-types';

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

const cityIdsWithViewpoints: Set<number> = new Set();

export async function getCityIdsWithViewpoints(ctrl: Control): Promise<Set<number>> {
  if (!cityIdsWithViewpoints.size) {
    await selectViewpoints(ctrl);
  }
  return cityIdsWithViewpoints;
}

export async function selectViewpoints(ctrl: Control, cityIdConstraint?: number): Promise<ViewpointsByRegion> {
  let viewpoints: ViewCodexExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/ViewCodexExcelConfigData.json');
  let areas: WorldAreaConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/WorldAreaConfigData.json');

  let ret: ViewpointsByRegion = defaultMap('Array');

  for (let viewpoint of viewpoints) {
    cityIdsWithViewpoints.add(viewpoint.CityId);
    if (isset(cityIdConstraint) && viewpoint.CityId !== cityIdConstraint) {
      continue;
    }
    viewpoint.CityNameText = await ctrl.selectCityNameById(viewpoint.CityId);
    viewpoint.WorldArea = areas.find(area => area.Id === viewpoint.WorldAreaId);
    if (viewpoint.WorldArea.AreaNameText === 'Mondstadt' && viewpoint.WorldArea.TerrainType === 'AREA_TERRAIN_CITY') {
      viewpoint.WorldArea.AreaNameText = 'City of Mondstadt';
    }
    if (viewpoint.WorldArea.AreaType === 'LEVEL_2') {
      viewpoint.ParentWorldArea = areas.find(area => area.AreaType === 'LEVEL_1' && area.AreaId1 === viewpoint.WorldArea.AreaId1);
    }
    viewpoint.Wikitext = fileFormatOptionsCheck(`{{Viewpoint
|id      = ${viewpoint.SortOrder}
|title   = ${viewpoint.NameText}
|title2  = ${viewpoint.WorldArea.AreaNameText || ''}
|subarea = ${viewpoint.WorldArea.AreaNameText || ''}
|area    = ${viewpoint.ParentWorldArea ? viewpoint.ParentWorldArea.AreaNameText : ''}
|region  = ${viewpoint.CityNameText}
|note    = 
|text    = ${viewpoint.DescText ? normText(viewpoint.DescText, ctrl.outputLangCode) : ''}
|image   = ${fileFormatOptionsApply(ctrl.state.Request, viewpoint, 'FileFormat.viewpoint.image', VIEWPOINT_DEFAULT_FILE_FORMAT_IMAGE)}
|map     = ${fileFormatOptionsApply(ctrl.state.Request, viewpoint, 'FileFormat.viewpoint.map', VIEWPOINT_DEFAULT_FILE_FORMAT_MAP)}
}}`);
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