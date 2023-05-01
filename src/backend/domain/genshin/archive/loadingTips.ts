import { pathToFileURL } from 'url';
import { GenshinControl, getGenshinControl, loadEnglishTextMap } from '../genshinControl';
import util from 'util';
import { closeKnex } from '../../../util/db';
import { defaultMap } from '../../../../shared/util/genericUtil';
import {
  WorldAreaConfigData,
} from '../../../../shared/types/genshin/general-types';
import { sort } from '../../../../shared/util/arrayUtil';
import { SbOut } from '../../../../shared/util/stringUtil';
import { ManualTextMapHashes } from '../../../../shared/types/genshin/manual-text-map';
import {
  LoadingSituationExcelConfigData,
  LoadingTipsByCategory,
  LoadingTipsExcelConfigData,
} from '../../../../shared/types/genshin/loading-types';
import { normText } from '../genshinNormalizers';

function determineLoadingTipCategory(ctrl: GenshinControl, tip: LoadingTipsExcelConfigData,
                                     situations: LoadingSituationExcelConfigData[], worldAreas: WorldAreaConfigData[]): string {
  if (!situations || !situations.length) {
    return 'General';
  }
  let foundCats: {text: string, weight: number}[] = [
    {text: 'General', weight: 5}
  ];
  let foundRegions: Set<string> = new Set<string>();
  let tipTitleEN = ctrl.getTextMapItem('EN', tip.TipsTitleTextMapHash);
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
    return ctrl.getTextMapItem(ctrl.outputLangCode, ManualTextMapHashes[cat]);
  } else {
    return cat;
  }
}

export function generateLoadingTipsWikiText(ctrl: GenshinControl, tipsByCategory: LoadingTipsByCategory, limitTipToIds?: number[]): {[cat: string]: string} {
  let ret: {[cat: string]: string} = {};

  for (let [cat, tips] of Object.entries(tipsByCategory)) {
    let sbOut: SbOut = new SbOut();
    sbOut.line(`===${cat}===`);

    let firstTip: boolean = true;
    let prevTitle: string = null;
    for (let tip of tips) {
      if (limitTipToIds && !limitTipToIds.includes(tip.Id)) {
        continue;
      }
      if (tip.TipsTitleText !== prevTitle) {
        prevTitle = tip.TipsTitleText;
        if (firstTip) {
          firstTip = false;
        } else {
          sbOut.emptyLine();
        }
        sbOut.line(`====${normText(tip.TipsTitleText, ctrl.outputLangCode)}====`);
      }
      sbOut.line('* ' + normText(tip.TipsDescText, ctrl.outputLangCode));
    }
    ret[cat] = sbOut.toString();
  }
  return ret;
}

function createLoadingTipsByCategoryObject(ctrl: GenshinControl): LoadingTipsByCategory {
  const manualKeys = [
    'Mondstadt',
    'Liyue',
    'Inazuma',
    'Sumeru',
    'Domains',
    'Spiral Abyss',
    'Serenitea Pot',
    'Golden Apple Archipelago',
    'Three Realms Gateway Offering',
    'General',
  ];

  let initialObj = {};
  for (let manualKey of manualKeys) {
    let hash = ManualTextMapHashes[manualKey];
    if (hash) {
      let cat = ctrl.getTextMapItem(ctrl.outputLangCode, hash);
      initialObj[cat] = [];
    } else {
      initialObj[manualKey] = [];
    }
  }
  
  return defaultMap('Array', initialObj);
}

export async function selectLoadingTips(ctrl: GenshinControl): Promise<LoadingTipsByCategory> {
  const areas: WorldAreaConfigData[] = await ctrl.selectWorldAreas();
  const situations: LoadingSituationExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/LoadingSituationExcelConfigData.json');
  const situationsByStageId: {[stageId: number]: LoadingSituationExcelConfigData} = {};
  for (let sit of situations) {
    situationsByStageId[sit.StageId] = sit;
  }

  const tips: LoadingTipsExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/LoadingTipsExcelConfigData.json');
  const ret: LoadingTipsByCategory = createLoadingTipsByCategoryObject(ctrl);

  for (let tip of tips) {
    let situations = tip.StageId ? tip.StageId.split(',').map(stageId => situationsByStageId[stageId]).filter(x => !!x) : null;
    let category = determineLoadingTipCategory(ctrl, tip, situations, areas);
    ret[category].push(tip);
  }

  for (let cat of Object.keys(ret)) {
    ret[cat] = sort(ret[cat], 'TipsTitleText', 'Id');
  }

  return ret;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadEnglishTextMap();

  const ctrl = getGenshinControl();
  const ret = await selectLoadingTips(ctrl);
  console.log(util.inspect(ret, false, null, true));

  await closeKnex();
}