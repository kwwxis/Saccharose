import '../../../loadenv.ts';
import { closeKnex } from '../../../util/db.ts';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { HomeWorldNPCExcelConfigData } from '../../../../shared/types/genshin/homeworld-types.ts';
import { grep } from '../../../util/shellutil.ts';
import { TalkConfigAccumulator, talkConfigGenerate } from '../dialogue/dialogue_util.ts';
import util from 'util';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { pathToFileURL } from 'url';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { escapeHtml, toLower } from '../../../../shared/util/stringUtil.ts';
import { getGenshinDataFilePath } from '../../../loadenv.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';

export async function getHomeWorldCompanions(ctrl: GenshinControl): Promise<HomeWorldNPCExcelConfigData[]> {
  return ctrl.cached('HomeWorld:Companions:NPCExcels:'+ctrl.outputLangCode, 'json', async () => {
    const companions: HomeWorldNPCExcelConfigData[] = await ctrl.selectAllHomeWorldNPCs({
      LoadHomeWorldEvents: true
    });

    // Load grep result into map
    const grepResult = await grep('QuestDialogue/HomeWorld/', getGenshinDataFilePath('./ExcelBinOutput/TalkExcelConfigData.json'), {});
    let npcIdToTalkIds: {[npcId: number]: number[]} = {};
    for (let item of grepResult) {
      let substr = item.split('HomeWorld/')[1].split('"')[0];
      substr = substr.replace(/__+/g, '_'); // replace multiple underscore with one underscore
      let parts = substr.split('/');
      let npcId = toInt(parts[0].split('_')[1]);
      let talkId = toInt(parts[1].slice(1));
      if (!npcIdToTalkIds.hasOwnProperty(npcId)) {
        npcIdToTalkIds[npcId] = [talkId];
      } else {
        npcIdToTalkIds[npcId].push(talkId);
      }
    }

    // Process grep result
    for (let npcId of Object.keys(npcIdToTalkIds).map(toInt)) {
      let talkIds: number[] = npcIdToTalkIds[npcId];
      let npc = companions.find(x => x.NpcId === npcId);
      for (let talkId of talkIds) {
        if (npc.TalkIds.includes(talkId) || npc.RewardEvents.find(x => x.TalkId == talkId)) {
          // Don't add talk ids already in the HomeWorld NPC or the events
          continue;
        }
        npc.TalkIds.push(talkId);
      }
      npc.TalkIds.sort();
    }

    sort(companions, 'CommonName');

    return companions;
  });
}

export async function fetchCompanionDialogue(ctrl: GenshinControl, avatarNameOrId: string|number|HomeWorldNPCExcelConfigData): Promise<DialogueSectionResult[]> {
  let companion: HomeWorldNPCExcelConfigData;

  if (typeof avatarNameOrId === 'object') {
    companion = avatarNameOrId;
  } else {
    companion = (await getHomeWorldCompanions(ctrl)).find(c => toLower(c.CommonName) === toLower(avatarNameOrId) || c.CommonId == toInt(avatarNameOrId));
  }

  if (!companion) {
    return null;
  }

  return ctrl.cached('HomeWorld:Companions:Dialogue:Avatar_'+(companion.AvatarId || companion.NpcId)+':'+ctrl.outputLangCode, 'memory', async () => {
    let result: DialogueSectionResult[] = [];

    let acc = new TalkConfigAccumulator(ctrl);

    let activitySect = new DialogueSectionResult('activity', 'Event Dialogue');

    for (let talkConfigId of companion.TalkIds) {
      if (acc.fetchedTalkConfigIds.has(talkConfigId)) {
        continue;
      }
      let sect: DialogueSectionResult = await talkConfigGenerate(ctrl, talkConfigId, acc);
      if (!sect) {
        continue;
      }

      if (sect.hasHeaderProp('Activity ID')) {
        activitySect.children.push(sect);
      } else {
        result.push(sect);
      }

      sect.children.filter(subsect => subsect.hasHeaderProp('Activity ID')).forEach(subsect => activitySect.children.push(subsect));

      sect.children = sect.children.filter(subsect => !subsect.hasHeaderProp('Activity ID'));

      for (let child of sect.children) {
        let friendshipCond = child.originalData.talkConfig?.BeginCond?.find(cond => cond.Type === 'QUEST_COND_AVATAR_FETTER_GT');
        if (friendshipCond) {
          child.prependFreeForm(`;(${ctrl.i18n('UnlocksAtFriendshipLevel', {level: toInt(friendshipCond.Param[1]) + 1})})\n`);
        }

        let daytimeCond = child.originalData.talkConfig?.BeginCond?.find(cond => cond.Type === 'QUEST_COND_IS_DAYTIME');
        if (daytimeCond) {
          if (toBoolean(daytimeCond.Param[0])) {
            child.prependFreeForm(`;<nowiki>(Between 6:00 and 19:00)</nowiki>\n`);
          } else {
            child.prependFreeForm(`;<nowiki>(Between 19:00 and 6:00)</nowiki>\n`);
          }
        }
      }
    }

    if (activitySect.children.length) {
      result.push(activitySect);
    }

    for (let rewardEvent of companion.RewardEvents) {
      let section: DialogueSectionResult = await talkConfigGenerate(ctrl, rewardEvent.TalkId, acc);
      if (!section) {
        continue;
      }

      if (rewardEvent.Reward) {
        section.wikitextArray.push({
          title: 'Rewards',
          wikitext: rewardEvent.Reward.RewardSummary.CombinedStrings
        });
      }

      if (rewardEvent.FurnitureSuitId) {
        let furnitureSuite = await ctrl.selectFurnitureSuite(rewardEvent.FurnitureSuitId);
        if (furnitureSuite) {
          section.title = `Special Dialogue for Favorite Furnishing Set: <a href="/furnishing-sets/${furnitureSuite.SuiteId}">${escapeHtml(furnitureSuite.SuiteNameText)}</a>`;
          section.isHtmlTitle = true;
        }
      }

      result.push(section);
    }

    return result;
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    let ctrl = getGenshinControl();
    //console.log(await fetchCompanionDialogue(ctrl, 'Raiden Shogun'));
    let res = await fetchCompanionDialogue(ctrl, 'Collei');
    console.log(util.inspect(res, false, null, true));
    await closeKnex();
  })();
}
