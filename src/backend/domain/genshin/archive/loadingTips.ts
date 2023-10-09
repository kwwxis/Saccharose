import util from 'util';
import { pathToFileURL } from 'url';
import { GenshinControl, getGenshinControl } from '../genshinControl';
import { closeKnex } from '../../../util/db';
import { defaultMap } from '../../../../shared/util/genericUtil';
import { WorldAreaConfigData } from '../../../../shared/types/genshin/general-types';
import { sort, toMap } from '../../../../shared/util/arrayUtil';
import { SbOut } from '../../../../shared/util/stringUtil';
import { ManualTextMapHashes } from '../../../../shared/types/genshin/manual-text-map';
import {
  LoadingSituationExcelConfigData,
  LoadingCat,
  LoadingTipsExcelConfigData,
} from '../../../../shared/types/genshin/loading-types';
import { LangCodeMap } from '../../../../shared/types/lang-types';

// region Category Check
// --------------------------------------------------------------------------------------------------------------
async function getCategoryForTip(ctrl: GenshinControl,
                                 tip: LoadingTipsExcelConfigData,
                                 situations: LoadingSituationExcelConfigData[],
                                 worldAreas: WorldAreaConfigData[]): Promise<{ catName: string, catNameMap: LangCodeMap }> {
  if (!situations || !situations.length) {
    return {
      catName: 'General',
      catNameMap: null,
    };
  }
  const foundCats: {text: string, weight: number}[] = [
    {text: 'General', weight: 5}
  ];
  const foundRegions: Set<string> = new Set<string>();
  const tipTitleEN = await ctrl.getTextMapItem('EN', tip.TipsTitleTextMapHash);
  for (let sit of situations) {
    if (sit.StageId === 23) {
      foundCats.push({ text: 'Three Realms Gateway Offering', weight: 10});
    }
    if (sit.LoadingSituationType.includes('GCG')) {
      foundCats.push({ text: 'General', weight: 10});
    } else if (sit.LoadingSituationType.includes('HOMEWORLD')) {
      foundCats.push({ text: 'Serenitea Pot', weight: 10});
    } else if (sit.LoadingSituationType.includes('ENTER_ISLAND')) {
      foundCats.push({ text: 'Golden Apple Archipelago', weight: 10});
    } else if (sit.LoadingSituationType.includes('DUNGEON')) {
      foundCats.push({ text: 'Domains', weight: 1});
    } else if (sit.LoadingSituationType.includes('ENTER_TOWER') || sit.LoadingSituationType.includes('ENTER_ROOM')) {
      foundCats.push({ text: 'Spiral Abyss', weight: 1});
    }
    if (tipTitleEN === 'Domains' || tipTitleEN === 'Doors of Resurrection') {
      foundCats.push({ text: 'Domains', weight: 15});
    }
    if (tipTitleEN === 'Spiral Abyss' || tipTitleEN === 'Elemental Nodes') {
      foundCats.push({ text: 'Spiral Abyss', weight: 15});
    }
    if (sit.PicPath && sit.PicPath.includes('GoldenApple')) {
      foundCats.push({ text: 'Golden Apple Archipelago', weight: 15});
    }
    if (sit.Area1Id) {
      const areas = worldAreas.filter(area => sit.Area1Id.includes(area.AreaId1) && area.AreaType === 'LEVEL_1');
      for (let area of areas) {
        if (area.ParentCity) {
          foundRegions.add(area.ParentCity.CityNameText);
        }
      }
    }
  }
  let cat: string;
  if (foundRegions.size === 1) {
    cat = foundRegions.values().next().value;
  } else {
    sort(foundCats, '-weight');
    cat = foundCats[0].text;
  }
  if (ManualTextMapHashes[cat]) {
    return {
      catName: await ctrl.getTextMapItem(ctrl.outputLangCode, ManualTextMapHashes[cat]),
      catNameMap: await ctrl.createLangCodeMap(ManualTextMapHashes[cat], true)
    };
  } else {
    return {
      catName: cat,
      catNameMap: null
    };
  }
}
// endregion

// region Wikitext
// --------------------------------------------------------------------------------------------------------------
export function generateLoadingTipsWikiText(ctrl: GenshinControl, cat: LoadingCat, depth: number = 0): string {
  if (!cat) {
    return '';
  }

  const indent1: string = '='.repeat(depth + 1);
  const indent2: string = '='.repeat(depth + 2);
  const sbOut: SbOut = new SbOut();

  if (indent1.length != 1) {
    sbOut.line();
    sbOut.line(`${indent1}${cat.catName}${indent1}`);
  }

  let firstTip: boolean = true;
  let prevTitle: string = null;
  for (let tip of cat.tips) {
    if (tip.TipsTitleText !== prevTitle) {
      prevTitle = tip.TipsTitleText;
      if (firstTip) {
        firstTip = false;
      } else {
        sbOut.emptyLine();
      }
      sbOut.line(`${indent2}${ctrl.normText(tip.TipsTitleText, ctrl.outputLangCode)}${indent2}`);
    }
    sbOut.line('* ' + ctrl.normText(tip.TipsDescText, ctrl.outputLangCode));
  }

  for (let innerCat of cat.subCats) {
    sbOut.line(generateLoadingTipsWikiText(ctrl, innerCat, depth + 1));
  }
  return sbOut.toString(depth > 0).replace(/\n\n\n+/g, '\n\n').replace(/=\n\n+=/g, '=\n=');
}
// endregion

// region Main Select
// --------------------------------------------------------------------------------------------------------------
async function createResultObject(ctrl: GenshinControl): Promise<LoadingCat> {
  const nationKeys: string[] = [
    'Mondstadt',
    'Liyue',
    'Inazuma',
    'Sumeru',
    'Fontaine',
  ];

  const otherKeys: string[] = [
    'Domains',
    'Spiral Abyss',
    'Serenitea Pot',
    'Golden Apple Archipelago',
    'Three Realms Gateway Offering',
    'Veluriyam Mirage',
    'General',
  ];

  const result: LoadingCat = {
    catName: await ctrl.getTextMapItem(ctrl.outputLangCode, ManualTextMapHashes.All),
    catNameMap: await ctrl.createLangCodeMap(ManualTextMapHashes.All),
    subCats: [

    ],
    tips: []
  };

  for (let nationKey of nationKeys) {
    const catNameHash: number = ManualTextMapHashes[nationKey];
    const catName = await ctrl.getTextMapItem(ctrl.outputLangCode, catNameHash) || nationKey;
    const catNameMap = await ctrl.createLangCodeMap(catNameHash, true);
    result.subCats.push({
      catName,
      catNameMap,
      subCats: [],
      tips: []
    });
  }

  const otherCat: LoadingCat = {
    catName: await ctrl.getTextMapItem(ctrl.outputLangCode, ManualTextMapHashes.Other),
    catNameMap: await ctrl.createLangCodeMap(ManualTextMapHashes.Other),
    subCats: [],
    tips: []
  };

  result.subCats.push(otherCat);

  for (let otherKey of otherKeys) {
    const catNameHash: number = ManualTextMapHashes[otherKey];
    const catName = await ctrl.getTextMapItem(ctrl.outputLangCode, catNameHash) || otherKey;
    const catNameMap = await ctrl.createLangCodeMap(catNameHash, true);
    otherCat.subCats.push({
      catName,
      catNameMap,
      subCats: [],
      tips: []
    });
  }
  
  return result;
}

export async function selectLoadingMainCatNames(ctrl: GenshinControl) {
  const ret: LoadingCat = await createResultObject(ctrl);
  return ret.subCats.map(cat => cat.catName);
}

function sortResultObject(result: LoadingCat) {
  sort(result.tips, 'TipsTitleText', 'TipsDescText');
  for (let subCat of result.subCats) {
    sortResultObject(subCat);
  }
}

export async function selectLoadingTips(ctrl: GenshinControl): Promise<LoadingCat> {
  const areas: WorldAreaConfigData[] = await ctrl.selectWorldAreas();
  const situations: LoadingSituationExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/LoadingSituationExcelConfigData.json');
  const situationsByStageId: {[stageId: number]: LoadingSituationExcelConfigData} = toMap(situations, 'StageId');
  const otherCatName: string = await ctrl.getTextMapItem(ctrl.outputLangCode, ManualTextMapHashes.Other);

  const tips: LoadingTipsExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/LoadingTipsExcelConfigData.json');
  const ret: LoadingCat = await createResultObject(ctrl);

  for (let tip of tips) {
    const situations: LoadingSituationExcelConfigData[] = tip.StageId ? tip.StageId.split(',')
      .map(stageId => situationsByStageId[stageId]).filter(x => !!x) : null;

    const { catName, catNameMap } = await getCategoryForTip(ctrl, tip, situations, areas);

    const cat = ret.subCats.find(cat => cat.catName === catName);
    if (cat) {
      cat.tips.push(tip);
    } else {
      const otherCat = ret.subCats.find(cat => cat.catName === otherCatName);
      let otherSubCat = otherCat.subCats.find(cat => cat.catName === catName);
      if (!otherSubCat) {
        otherSubCat = {
          catName,
          catNameMap,
          subCats: [],
          tips: [],
        };
        otherCat.subCats.push(otherSubCat);
      }
      otherSubCat.tips.push(tip);
      if (tip.Id === 1625) {
        console.log(otherSubCat);
      }
    }
  }
  sortResultObject(ret);
  return ret;
}
// endregion

// region CLI
// --------------------------------------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();
  const ret = await selectLoadingTips(ctrl);
  console.log(util.inspect(ret, false, null, true));

  await closeKnex();
}
// endregion