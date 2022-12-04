import { Control } from '../script_util';
import { getTextMapItem } from '../textmap';
import { replace_prefix, sentenceJoin } from '../../../shared/util/stringUtil';
import { MainQuestExcelConfigData } from '../../../shared/types/quest-types';
import {
  FetterCond,
  FetterCondSummary,
  FetterCondType,
  FetterWithConditions,
} from '../../../shared/types/fetter-types';
import { LangCode } from '../../../shared/types/dialogue-types';

async function doWithCond(fetterConds: FetterCond[], condType: FetterCondType, callback: (fetterCond: FetterCond) => Promise<void>) {
  let cond = fetterConds.find(x => x.CondType === condType);
  if (cond) {
    await callback(cond);
  }
}

export async function processFetterConds(ctrl: Control, fetter: FetterWithConditions, PROP: 'OpenConds' | 'FinishConds') {
  if (!fetter[PROP] || !fetter[PROP].length) {
    return;
  }

  const summaryObj: FetterCondSummary = (fetter[PROP + 'Summary'] = {});

  fetter[PROP] = fetter[PROP].filter(x => !!x.CondType);

  await doWithCond(fetter[PROP], 'FETTER_COND_FETTER_LEVEL', async cond => {
    summaryObj.Friendship = cond.ParamList[0];
  });

  await doWithCond(fetter[PROP], 'FETTER_COND_AVATAR_PROMOTE_LEVEL', async cond => {
    summaryObj.AscensionPhase = cond.ParamList[0];
  });

  await doWithCond(fetter[PROP], 'FETTER_COND_PLAYER_BIRTHDAY', async cond => {
    summaryObj.Birthday = true;
  });

  await doWithCond(fetter[PROP], 'FETTER_COND_FINISH_QUEST', async cond => {
    let openCondId = cond.ParamList[0];
    let quest = await ctrl.selectQuestExcelConfigData(openCondId);
    let mainQuest = await ctrl.selectMainQuestById(quest.MainId);
    await processQuestConds(ctrl, fetter, mainQuest, summaryObj);
  });

  await doWithCond(fetter[PROP], 'FETTER_COND_FINISH_PARENT_QUEST', async cond => {
    let openCondId = cond.ParamList[0];
    let mainQuest = await ctrl.selectMainQuestById(openCondId);
    await processQuestConds(ctrl, fetter, mainQuest, summaryObj);
  });

  await doWithCond(fetter[PROP], 'FETTER_COND_UNLOCK_TRANS_POINT', async cond => {
    // Condition ParamList has two elements, which correspond to:
    //   Element 0: TransPointRewardConfigData.json -> SceneId
    //   Element 1: TransPointRewardConfigData.json -> PointId
    // However there's no information in TransPointRewardConfigData.json that says where the teleport waypoint is located.
    // So we just have to go off of the fetter Tips.
    let waypointArray: string[] = [];
    let statueArray: string[] = [];
    const langCode: LangCode = ctrl.outputLangCode;

    for (let itrTipId of fetter.Tips) {
      let tipTextCmp = getTextMapItem('EN', itrTipId)?.toLowerCase();
      let tipText = getTextMapItem(langCode, itrTipId);

      if (tipTextCmp && tipTextCmp.includes('teleport waypoint')) {
        if (langCode === 'EN') {
          tipText = tipText.split(/waypoints?/i)[1].trim();
        }
        waypointArray.push(tipText);
      }
      if (tipTextCmp && tipTextCmp.includes('statue of the seven')) {
        tipText = tipText.split(/seven/i)[1].trim();
        tipText = tipText.replace(/^(.*) [-–] (Pyro|Hydro|Electro|Cryo|Dendro|Anemo|Geo)$/i, '($2) $1');
        tipText = tipText.replace(/(Pyro|Hydro|Electro|Cryo|Dendro|Anemo|Geo)/, '{{$1}}');
      }
    }

    if (langCode === 'EN') {
      summaryObj.Waypoint = sentenceJoin(waypointArray);
      summaryObj.Statue = replace_prefix(sentenceJoin(statueArray), 'Statue of the Seven ', '');
    } else {
      summaryObj.Waypoint = waypointArray.join(', ');
      summaryObj.Statue = statueArray.join(', ');
    }
  });
}

export async function processQuestConds(ctrl: Control, fetter: FetterWithConditions, mainQuest: MainQuestExcelConfigData, summaryObj: FetterCondSummary) {
  summaryObj.Quest = mainQuest.TitleText;

  if (mainQuest.ChapterId) {
    let chapter = await ctrl.selectChapterById(mainQuest.ChapterId);
    if (chapter && chapter.EndQuestId) {
      if (chapter.EndQuestId === mainQuest.Id) {
        summaryObj.Quest = chapter.ChapterTitleText;
      } else {
        let subQuest = await ctrl.selectQuestExcelConfigData(chapter.EndQuestId);
        if (subQuest.MainId === mainQuest.Id) {
          summaryObj.Quest = chapter.ChapterTitleText;
        }
      }
    }
  }
}