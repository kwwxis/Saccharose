import '../../loadenv';
import util from 'util';
import { closeKnex } from '../../util/db';
import { Control, getControl, normText } from '../script_util';
import {
  AvatarExcelConfigData,
  FetterStoryExcelConfigData,
  FetterStoryExcelConfigDataCondSummary,
  MainQuestExcelConfigData,
} from '../../../shared/types';
import { cached } from '../../util/cache';
import { loadEnglishTextMap } from '../textmap';

export type AvatarAndFetterStoryExcelConfigData = {
  avatar: AvatarExcelConfigData,
  fetters: FetterStoryExcelConfigData[],
  wikitext: string,
  alteredWikitext: string,
  hasAlteredStories: boolean,
};

export type GroupedFetterStoryExcelConfigData = {
  [avatarId: number]: AvatarAndFetterStoryExcelConfigData
};

const sep = '</p><!--\n              --><p>';

async function processFetterConds(ctrl: Control, fetter: FetterStoryExcelConfigData, conds: 'OpenConds' | 'FinishConds') {
  if (!fetter[conds] || !fetter[conds].length) {
    return;
  }

  let summaryProp = conds + 'Summary';
  fetter[summaryProp] = {};
  let summaryObj: FetterStoryExcelConfigDataCondSummary = fetter[summaryProp]

  let friendshipCond = fetter[conds].find(x => x.CondType === 'FETTER_COND_FETTER_LEVEL');
  if (friendshipCond) {
    summaryObj.Friendship = friendshipCond.ParamList[0];
  }

  let questCond = fetter[conds].find(x => x.CondType === 'FETTER_COND_FINISH_QUEST');
  if (questCond) {
    let openCondId = questCond.ParamList[0];
    let quest = await ctrl.selectQuestExcelConfigData(openCondId);
    let mainQuest = await ctrl.selectMainQuestById(quest.MainId);
    await processQuestConds(ctrl, fetter, mainQuest, summaryObj);
  }

  let parentQuestCond = fetter[conds].find(x => x.CondType === 'FETTER_COND_FINISH_PARENT_QUEST');
  if (parentQuestCond) {
    let openCondId = parentQuestCond.ParamList[0];
    let mainQuest = await ctrl.selectMainQuestById(openCondId);
    await processQuestConds(ctrl, fetter, mainQuest, summaryObj);
  }
}
async function processQuestConds(ctrl: Control, fetter: FetterStoryExcelConfigData, mainQuest: MainQuestExcelConfigData, summaryObj: FetterStoryExcelConfigDataCondSummary) {
  summaryObj.Quest = mainQuest.TitleText;

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

export async function fetchCharacterStories(ctrl: Control): Promise<GroupedFetterStoryExcelConfigData> {
  const fetters = await cached('FetterStoryExcelConfigData_'+ctrl.outputLangCode, async () => {
    let records: FetterStoryExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/FetterStoryExcelConfigData.json');
    for (let fetter of records) {
      await processFetterConds(ctrl, fetter, 'OpenConds');
      await processFetterConds(ctrl, fetter, 'FinishConds');
      fetter.StoryContextHtml = '<p>'+fetter.StoryContextText.split('\\n').map(s => normText(s)).join(sep)+'</p>';
      if (fetter.StoryContext2Text) {
        fetter.StoryContext2Html = '<p>'+fetter.StoryContext2Text.split('\\n').map(s => normText(s)).join(sep)+'</p>';
      }
    }
    return records;
  });

  return await cached('GroupedFetterStoryExcelConfigData_' + ctrl.outputLangCode, async () => {
    let out: GroupedFetterStoryExcelConfigData = {};
    for (let fetter of fetters) {
      if (!out.hasOwnProperty(fetter.AvatarId)) {
        out[fetter.AvatarId] = {
          avatar: await ctrl.selectAvatarById(fetter.AvatarId),
          fetters: [],
          wikitext: '',
          alteredWikitext: '',
          hasAlteredStories: false,
        };
      }
      out[fetter.AvatarId].fetters.push(fetter);
    }
    for (let story of Object.values(out)) {
      let wikitext = '==Character Stories==\n{{Character Story';
      let i = 1;
      for (let fetter of story.fetters) {
        wikitext += `\n|title${i}`.padEnd(16)+'= '+fetter.StoryTitleText;
        if (fetter.OpenCondsSummary.Friendship) {
          wikitext += `\n|friendship${i}`.padEnd(16)+'= '+fetter.OpenCondsSummary.Friendship;
        }
        if (fetter.OpenCondsSummary.Quest) {
          wikitext += `\n|quest${i}`.padEnd(16)+'= '+fetter.OpenCondsSummary.Quest;
        }
        wikitext += `\n|text${i}`.padEnd(16)+'= '+fetter.StoryContextHtml;
        wikitext += `\n|mention${i}`.padEnd(16)+'= ';
        wikitext += '\n';
        i++;
        if (!!fetter.StoryContext2Text) {
          story.hasAlteredStories = true;
        }
      }
      wikitext += '}}';
      story.wikitext = wikitext;

      if (story.hasAlteredStories) {
        let alteredWikitext = '==Altered Character Stories==\n{{Character Story';
        i = 0;
        for (let fetter of story.fetters) {
          i++;
          if (!fetter.StoryContext2Text) {
            continue;
          }
          alteredWikitext += `\n|title${i}`.padEnd(16)+'= '+fetter.StoryTitle2Text;
          if (fetter.FinishCondsSummary.Friendship) {
            alteredWikitext += `\n|friendship${i}`.padEnd(16)+'= '+fetter.FinishCondsSummary.Friendship;
          }
          if (fetter.FinishCondsSummary.Quest) {
            alteredWikitext += `\n|quest${i}`.padEnd(16)+'= '+fetter.FinishCondsSummary.Quest;
          }
          alteredWikitext += `\n|text${i}`.padEnd(16)+'= '+fetter.StoryContext2Html;
          alteredWikitext += `\n|mention${i}`.padEnd(16)+'= ';
          alteredWikitext += '\n';
        }
        alteredWikitext += '}}';
        story.alteredWikitext = alteredWikitext;
      }
    }
    return out;
  });
}

export async function fetchCharacterStoryByAvatarId(ctrl: Control, avatarId: number): Promise<AvatarAndFetterStoryExcelConfigData> {
  let storiesByAvatar = await fetchCharacterStories(ctrl);
  return storiesByAvatar[avatarId];
}

export async function fetchCharacterStoryByAvatarName(ctrl: Control, avatarName: string): Promise<AvatarAndFetterStoryExcelConfigData> {
  let avatarNameNorm = avatarName.replaceAll(/_/g, ' ').toLowerCase().trim();
  let storiesByAvatar = await fetchCharacterStories(ctrl);
  return Object.values(storiesByAvatar).find(x => x.avatar.NameText.toLowerCase() == avatarNameNorm);
}

if (require.main === module) {
  (async () => {
    await loadEnglishTextMap();
    const storiesByAvatar = await fetchCharacterStories(getControl());
    let res = Object.values(storiesByAvatar).find(x => x.avatar.NameText.toLowerCase() == 'nahida');
    console.log(util.inspect(res, false, null, true));
    await closeKnex();
  })();
}