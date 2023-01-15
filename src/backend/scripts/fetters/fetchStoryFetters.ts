import '../../loadenv';
import util from 'util';
import { closeKnex } from '../../util/db';
import { Control, getControl, normText } from '../script_util';
import { cached } from '../../util/cache';
import { getTextMapItem, loadEnglishTextMap } from '../textmap';
import { processFetterConds } from './fetterConds';
import { resolveObjectPath } from '../../../shared/util/arrayUtil';
import { FetterStoryExcelConfigData, StoryFetters, StoryFettersByAvatar } from '../../../shared/types/fetter-types';
import { pathToFileURL } from 'url';
import { AvatarExcelConfigData } from '../../../shared/types/avatar-types';

const sep = '</p><!--\n              --><p>';

async function fetchAllFetterStoryExcelConfigData(ctrl: Control): Promise<FetterStoryExcelConfigData[]> {
  return await cached('FetterStoryExcelConfigData_'+ctrl.outputLangCode, async () => {
    let records: FetterStoryExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/FetterStoryExcelConfigData.json');
    for (let fetter of records) {
      await processFetterConds(ctrl, fetter, 'OpenConds');
      await processFetterConds(ctrl, fetter, 'FinishConds');
      fetter.StoryContextHtml = '<p>'+fetter.StoryContextText.split('\\n').map(s => normText(s, ctrl.outputLangCode)).join(sep)+'</p>';
      if (fetter.StoryContext2Text) {
        fetter.StoryContext2Html = '<p>'+fetter.StoryContext2Text.split('\\n').map(s => normText(s, ctrl.outputLangCode)).join(sep)+'</p>';
      }
    }
    return records;
  });
}

export async function fetchCharacterStories(ctrl: Control): Promise<StoryFettersByAvatar> {
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
        if (fetter.OpenCondsSummary.Quest) {
          wikitext += `\n|quest${i}`.padEnd(16)+'= '+fetter.OpenCondsSummary.Quest;
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
          if (fetter.FinishCondsSummary.Quest) {
            alteredWikitext += `\n|quest${i}`.padEnd(16)+'= '+fetter.FinishCondsSummary.Quest;
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

export async function fetchCharacterStoryByAvatarId(ctrl: Control, avatarId: number): Promise<StoryFetters> {
  let storiesByAvatar = await fetchCharacterStories(ctrl);
  return storiesByAvatar[avatarId];
}

export async function fetchCharacterStoryByAvatarName(ctrl: Control, avatarName: string): Promise<StoryFetters> {
  let avatarNameNorm = avatarName.replaceAll(/_/g, ' ').toLowerCase().trim();
  let storiesByAvatar = await fetchCharacterStories(ctrl);
  return Object.values(storiesByAvatar).find(x => x.avatar.NameText.toLowerCase() == avatarNameNorm);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadEnglishTextMap();
    let res: StoryFetters = await fetchCharacterStoryByAvatarName(getControl(), 'nahida');
    let x1 = resolveObjectPath(res, 'avatar', true);
    let x2 = resolveObjectPath(res, 'fetters[#EVERY].Avatar', true);
    console.log(util.inspect(res, false, null, true));
    await closeKnex();
  })();
}