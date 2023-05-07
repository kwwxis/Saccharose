import '../../../loadenv';
import util from 'util';
import { closeKnex } from '../../../util/db';
import { GenshinControl, getGenshinControl } from '../genshinControl';
import { cached } from '../../../util/cache';
import { processFetterConds } from './fetterConds';
import { resolveObjectPath } from '../../../../shared/util/arrayUtil';
import { FetterStoryExcelConfigData, StoryFetters, StoryFettersByAvatar } from '../../../../shared/types/genshin/fetter-types';
import { pathToFileURL } from 'url';
import { normGenshinText } from '../genshinText';

const sep = '</p><!--\n              --><p>';

async function fetchAllFetterStoryExcelConfigData(ctrl: GenshinControl): Promise<FetterStoryExcelConfigData[]> {
  return await cached('FetterStoryExcelConfigData_'+ctrl.outputLangCode, async () => {
    let records: FetterStoryExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/FetterStoryExcelConfigData.json');
    for (let fetter of records) {
      await processFetterConds(ctrl, fetter, 'OpenConds');
      await processFetterConds(ctrl, fetter, 'FinishConds');
      fetter.StoryContextHtml = '<p>'+fetter.StoryContextText.split('\\n').map(s => ctrl.normText(s, ctrl.outputLangCode)).join(sep)+'</p>';
      if (fetter.StoryContext2Text) {
        fetter.StoryContext2Html = '<p>'+fetter.StoryContext2Text.split('\\n').map(s => ctrl.normText(s, ctrl.outputLangCode)).join(sep)+'</p>';
      }
    }
    return records;
  });
}

export async function fetchCharacterStories(ctrl: GenshinControl): Promise<StoryFettersByAvatar> {
  return await cached('GroupedFetterStoryExcelConfigData_' + ctrl.outputLangCode, async () => {
    let fettersByAvatar: StoryFettersByAvatar = {};
    let allFetters = await fetchAllFetterStoryExcelConfigData(ctrl);

    for (let fetter of allFetters) {
      if (!fettersByAvatar.hasOwnProperty(fetter.AvatarId)) {
        fettersByAvatar[fetter.AvatarId] = new StoryFetters();
      }
      if (!fettersByAvatar[fetter.AvatarId].avatar && fetter.Avatar) {
        fettersByAvatar[fetter.AvatarId].avatar = fetter.Avatar;
      }
      fettersByAvatar[fetter.AvatarId].fetters.push(fetter);
    }

    for (let agg of Object.values(fettersByAvatar)) {
      let wikitext = '==Character Stories==\n{{Character Story';
      let i = 1;
      for (let fetter of agg.fetters) {
        wikitext += `\n|title${i}`.padEnd(16)+'= '+fetter.StoryTitleText;
        if (fetter.OpenCondsSummary.Friendship) {
          wikitext += `\n|friendship${i}`.padEnd(16)+'= '+fetter.OpenCondsSummary.Friendship;
        }
        if (fetter.OpenCondsSummary.QuestTitleTextMap) {
          wikitext += `\n|quest${i}`.padEnd(16)+'= '+fetter.OpenCondsSummary.QuestTitleTextMap[ctrl.outputLangCode];
        }
        wikitext += `\n|text${i}`.padEnd(16)+'= '+fetter.StoryContextHtml;
        wikitext += `\n|mention${i}`.padEnd(16)+'= ';
        wikitext += '\n';
        i++;
        if (!!fetter.StoryContext2Text) {
          agg.hasAlteredStories = true;
        }
      }
      wikitext += '}}';
      agg.wikitext = wikitext;

      if (agg.hasAlteredStories) {
        let alteredWikitext = '==Altered Character Stories==\n{{Character Story';
        i = 0;
        for (let fetter of agg.fetters) {
          i++;
          if (!fetter.StoryContext2Text) {
            continue;
          }
          alteredWikitext += `\n|title${i}`.padEnd(16)+'= '+fetter.StoryTitle2Text;
          if (fetter.FinishCondsSummary.Friendship) {
            alteredWikitext += `\n|friendship${i}`.padEnd(16)+'= '+fetter.FinishCondsSummary.Friendship;
          }
          if (fetter.FinishCondsSummary.QuestTitleTextMap) {
            alteredWikitext += `\n|quest${i}`.padEnd(16)+'= '+fetter.FinishCondsSummary.QuestTitleTextMap[ctrl.outputLangCode];
          }
          alteredWikitext += `\n|text${i}`.padEnd(16)+'= '+fetter.StoryContext2Html;
          alteredWikitext += `\n|mention${i}`.padEnd(16)+'= ';
          alteredWikitext += '\n';
        }
        alteredWikitext += '}}';
        agg.alteredWikitext = alteredWikitext;
      }
    }
    return fettersByAvatar;
  });
}

export async function fetchCharacterStoryByAvatarId(ctrl: GenshinControl, avatarId: number): Promise<StoryFetters> {
  let storiesByAvatar = await fetchCharacterStories(ctrl);
  return storiesByAvatar[avatarId];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    let res: StoryFetters = await fetchCharacterStoryByAvatarId(getGenshinControl(), 10000048);
    let x1 = resolveObjectPath(res, 'avatar', 'delete');
    let x2 = resolveObjectPath(res, 'fetters[#EVERY].Avatar', 'delete');
    console.log(util.inspect(res, false, null, true));
    await closeKnex();
  })();
}