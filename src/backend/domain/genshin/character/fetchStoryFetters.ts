import '../../../loadenv.ts';
import util from 'util';
import { closeKnex } from '../../../util/db.ts';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { cached } from '../../../util/cache.ts';
import { processFetterConds } from './fetterConds.ts';
import { resolveObjectPath } from '../../../../shared/util/arrayUtil.ts';
import { FetterStoryExcelConfigData, StoryFetters, StoryFettersByAvatar } from '../../../../shared/types/genshin/fetter-types.ts';
import { pathToFileURL } from 'url';
import { isTraveler } from '../../../../shared/types/genshin/avatar-types.ts';
import { mcify } from '../../generic/genericNormalizers.ts';
const sep: string = '</p><!--\n              --><p>';

async function fetchAllFetterStoryExcelConfigData(ctrl: GenshinControl): Promise<FetterStoryExcelConfigData[]> {
  return await cached('FetterStoryExcelConfigData_'+ctrl.outputLangCode, async () => {
    let records: FetterStoryExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/FetterStoryExcelConfigData.json');
    for (let fetter of records) {
      await processFetterConds(ctrl, fetter, 'OpenConds');
      await processFetterConds(ctrl, fetter, 'FinishConds');
      updateStoryContextHtml(ctrl, fetter);
    }
    return records;
  });
}

function updateStoryContextHtml(ctrl: GenshinControl, fetter: FetterStoryExcelConfigData) {
  if (fetter.StoryContextText) {
    fetter.StoryContextText = fetter.StoryContextText.replace(/\\n/g, '\n');
    fetter.StoryContextHtml = '<p>'+fetter.StoryContextText.split('\n').map(s => ctrl.normText(s, ctrl.outputLangCode)).join(sep)+'</p>';
  }
  if (fetter.StoryContext2Text) {
    fetter.StoryContext2Text = fetter.StoryContext2Text.replace(/\\n/g, '\n');
    fetter.StoryContext2Html = '<p>'+fetter.StoryContext2Text.split('\n').map(s => ctrl.normText(s, ctrl.outputLangCode)).join(sep)+'</p>';
  }
}

export async function fetchCharacterStories(ctrl: GenshinControl): Promise<StoryFettersByAvatar> {
  return await cached('GroupedFetterStoryExcelConfigData_' + ctrl.outputLangCode, async () => {
    let fettersByAvatar: StoryFettersByAvatar = {};
    let allFetters = await fetchAllFetterStoryExcelConfigData(ctrl);

    let maleMcStoryFetters: StoryFetters;
    let femaleMcStoryFetters: StoryFetters;

    for (let fetter of allFetters) {
      if (!fettersByAvatar.hasOwnProperty(fetter.AvatarId)) {
        fettersByAvatar[fetter.AvatarId] = new StoryFetters();

        if (isTraveler(fetter.AvatarId, 'male'))
          maleMcStoryFetters = fettersByAvatar[fetter.AvatarId];
        if (isTraveler(fetter.AvatarId, 'female'))
          femaleMcStoryFetters = fettersByAvatar[fetter.AvatarId];
      }
      if (!fettersByAvatar[fetter.AvatarId].avatar && fetter.Avatar) {
        fettersByAvatar[fetter.AvatarId].avatar = fetter.Avatar;
      }
      fettersByAvatar[fetter.AvatarId].fetters.push(fetter);
    }

    if (maleMcStoryFetters && femaleMcStoryFetters) {
      for (let i = 0; i < maleMcStoryFetters.fetters.length; i++) {
        const fm = maleMcStoryFetters.fetters[i];
        const ff = femaleMcStoryFetters.fetters[i];

        fm.StoryTitleText = mcify(ctrl.outputLangCode, fm.StoryTitleText, ff.StoryTitleText);
        fm.StoryContextText = mcify(ctrl.outputLangCode, fm.StoryContextText, ff.StoryContextText);

        fm.StoryTitle2Text = mcify(ctrl.outputLangCode, fm.StoryTitle2Text, ff.StoryTitle2Text);
        fm.StoryContext2Text = mcify(ctrl.outputLangCode, fm.StoryContext2Text, ff.StoryContext2Text);

        ff.StoryTitleText = fm.StoryTitleText;
        ff.StoryContextText = fm.StoryContextText;
        ff.StoryTitle2Text = fm.StoryTitle2Text;
        ff.StoryContext2Text = fm.StoryContext2Text;

        updateStoryContextHtml(ctrl, ff);
        updateStoryContextHtml(ctrl, fm);
      }
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