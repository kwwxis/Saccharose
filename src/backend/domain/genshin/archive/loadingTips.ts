import util from 'util';
import { pathToFileURL } from 'url';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { closeKnex } from '../../../util/db.ts';
import { mapBy, sort } from '../../../../shared/util/arrayUtil.ts';
import { SbOut } from '../../../../shared/util/stringUtil.ts';
import { ManualTextMapHashes } from '../../../../shared/types/genshin/manual-text-map.ts';
import {
  LoadingSituationExcelConfigData,
  LoadingCat,
  LoadingTipsExcelConfigData,
} from '../../../../shared/types/genshin/loading-types.ts';
import { LangCodeMap } from '../../../../shared/types/lang-types.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { WorldAreaConfigData } from '../../../../shared/types/genshin/place-types.ts';

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
    if (sit.LoadingSituationType.includes('HOMEWORLD')) {
      foundCats.push({ text: 'Serenitea Pot', weight: 10});
    } else if (sit.LoadingSituationType.includes('ENTER_ISLAND')) {
      foundCats.push({ text: 'Golden Apple Archipelago', weight: 10});
    } else if (sit.LoadingSituationType.includes('DUNGEON')) {
      foundCats.push({ text: 'Domains', weight: 1});
    } else if (sit.LoadingSituationType.includes('ENTER_TOWER') || sit.LoadingSituationType.includes('ENTER_ROOM')) {
      foundCats.push({ text: 'Spiral Abyss', weight: 1});
    } else if (sit.LoadingSituationType.includes('ENTER_GCG')) {
      foundCats.push({ text: 'Genius Invokation TCG', weight: 10});
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
    if (sit.PicPath && sit.PicPath.includes('Penumbra')) {
      foundCats.push({ text: 'Veluriyam Mirage', weight: 15});
    }
    if (sit.PicPath && sit.PicPath.includes('Simulanka')) {
      foundCats.push({ text: 'Simulanka', weight: 15});
    }
    if (sit.PicPath && sit.PicPath.includes('UI_LoadingPic_RoleCombat')) {
      foundCats.push({ text: 'Imaginarium Theater', weight: 15});
    }
    if (sit.PicPath && sit.PicPath.includes('LeyLineChallenge')) {
      foundCats.push({ text: 'Stygian Onslaught', weight: 15});
    }
    if (sit.PicPath && sit.PicPath.includes('Beyond')) {
      foundCats.push({ text: 'Miliastra Wonderland', weight: 15});
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
export function generateLoadingTipsWikiText(ctrl: GenshinControl, cat: LoadingCat, depth: number = 0, enableNewFormat: boolean = false): string {
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
        if (enableNewFormat) {
          sbOut.line(`|}`);
        }
        sbOut.emptyLine();
      }
      sbOut.line(`${indent2}${ctrl.normText(tip.TipsTitleText, ctrl.outputLangCode)}${indent2}`);
      if (enableNewFormat) {
        sbOut.line(`{| class="article-table" style="width:100%"`);
        sbOut.line(`! style="width:80%" | Tip`);
        sbOut.line(`! style="width:20%" | Quest Condition`);
      }
    }

    if (enableNewFormat) {
      sbOut.line(`|-`);
      sbOut.line(`| ${ctrl.normText(tip.TipsDescText, ctrl.outputLangCode)}`);

      if (tip.EnableMainQuestId || tip.DisableMainQuestId) {
        sbOut.append(' || ');
        if (tip.EnableMainQuestId) {
          sbOut.append(`Enabled by<br>[[${tip.EnableMainQuestName}]]`);
        }
        if (tip.DisableMainQuestId) {
          if (tip.EnableMainQuestId) {
            sbOut.append('<br>');
          }
          sbOut.append(`Disabled by<br>[[${tip.DisableMainQuestName}]]`);
        }
      } else {
        sbOut.append(' ||');
      }
    } else {
      sbOut.line('* ' + ctrl.normText(tip.TipsDescText, ctrl.outputLangCode));
    }
  }
  if (cat.tips.length && enableNewFormat) {
    sbOut.line(`|}`);
  }

  for (let innerCat of cat.subCats) {
    sbOut.line(generateLoadingTipsWikiText(ctrl, innerCat, depth + 1, enableNewFormat));
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
    'Natlan',
    'Nod-Krai',
  ];

  const otherKeys: string[] = [
    'Domains',
    'Spiral Abyss',
    'Serenitea Pot',
    'Golden Apple Archipelago',
    'Miliastra Wonderland',
    'Three Realms Gateway Offering',
    'Veluriyam Mirage',
    'Simulanka',
    'Genius Invokation TCG',
    'Imaginarium Theater',
    'Stygian Onslaught',
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
    const catName = (await ctrl.getTextMapItem(ctrl.outputLangCode, catNameHash)) || nationKey;
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
    const catName = (await ctrl.getTextMapItem(ctrl.outputLangCode, catNameHash)) || otherKey;
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

export async function postProcessLoadingTip(ctrl: GenshinControl, tip: LoadingTipsExcelConfigData): Promise<LoadingTipsExcelConfigData> {
  if (!tip) {
    return tip;
  }

  let enableMainId: number;
  let disableMainId: number;

  if (isInt(tip.PreMainQuestIds)) {
    enableMainId = toInt(tip.PreMainQuestIds);
  } else if (tip.PreQuestIdList && tip.PreQuestIdList.length) {
    enableMainId = await ctrl.selectMainQuestIdByQuestExcelId(tip.PreQuestIdList[0]);
  }

  if (enableMainId) {
    tip.EnableMainQuestName = await ctrl.selectMainQuestName(enableMainId);
    if (tip.EnableMainQuestName) {
      tip.EnableMainQuestId = enableMainId;
    }
  }

  if (tip.DisableQuestIdList) {
    disableMainId = await ctrl.selectMainQuestIdByQuestExcelId(tip.DisableQuestIdList[0]);
  }

  if (disableMainId) {
    tip.DisableMainQuestName = await ctrl.selectMainQuestName(disableMainId);
    if (tip.DisableMainQuestName) {
      tip.DisableMainQuestId = disableMainId;
    }
  }

  return tip;
}

export async function selectLoadingTips(ctrl: GenshinControl): Promise<LoadingCat> {
  const areas: WorldAreaConfigData[] = await ctrl.selectWorldAreas();
  const situations: LoadingSituationExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/LoadingSituationExcelConfigData.json');
  const situationsByStageId: {[stageId: number]: LoadingSituationExcelConfigData} = mapBy(situations, 'StageId');
  const otherCatName: string = await ctrl.getTextMapItem(ctrl.outputLangCode, ManualTextMapHashes.Other);

  const tips: LoadingTipsExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/LoadingTipsExcelConfigData.json');
  const ret: LoadingCat = await createResultObject(ctrl);

  await tips.asyncMap(tip => postProcessLoadingTip(ctrl, tip));

  for (let tip of tips) {
    const situations: LoadingSituationExcelConfigData[] = tip.StageId ? tip.StageId.split(',')
      .map(stageId => situationsByStageId[stageId.trim()]).filter(x => !!x) : null;

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
