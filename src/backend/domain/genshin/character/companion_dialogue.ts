import '../../../loadenv';
import { closeKnex } from '../../../util/db';
import { GenshinControl, getGenshinControl } from '../genshinControl';
import { cached } from '../../../util/cache';
import { toInt } from '../../../../shared/util/numberUtil';
import { HomeWorldEventExcelConfigData, HomeWorldNPCExcelConfigData } from '../../../../shared/types/genshin/homeworld-types';
import { grep } from '../../../util/shellutil';
import { DialogueSectionResult, TalkConfigAccumulator, talkConfigGenerate } from '../dialogue/dialogue_util';
import util from 'util';
import { toBoolean } from '../../../../shared/util/genericUtil';
import { pathToFileURL } from 'url';
import { sort } from '../../../../shared/util/arrayUtil';
import { toLower } from '../../../../shared/util/stringUtil';
import { getGenshinDataFilePath } from '../../../loadenv';

export async function getHomeWorldCompanions(ctrl: GenshinControl): Promise<HomeWorldNPCExcelConfigData[]> {
  return cached('HomeWorldCompanions_'+ctrl.outputLangCode, async () => {
    const homeWorldNPCs: HomeWorldNPCExcelConfigData[] = await ctrl.selectAllHomeWorldNPCs();
    const homeWorldEvents: HomeWorldEventExcelConfigData[] = await ctrl.selectAllHomeWorldEvents();

    // Load events into HomeWorldNPCExcelConfigData
    for (let homeWorldEvent of homeWorldEvents) {
      const npc = homeWorldNPCs.find(npc => npc.AvatarId === homeWorldEvent.AvatarId);

      if (homeWorldEvent.EventType === 'HOME_AVATAR_SUMMON_EVENT') {
        npc.SummonEvents.push(homeWorldEvent);
      } else if (homeWorldEvent.EventType === 'HOME_AVATAR_REWARD_EVENT') {
        npc.RewardEvents.push(homeWorldEvent);
      }
    }

    // Load grep result into map
    const grepResult = await grep('QuestDialogue/HomeWorld/', getGenshinDataFilePath('./ExcelBinOutput/TalkExcelConfigData.json'));
    let npcIdToTalkIds: {[npcId: number]: number[]} = {};
    for (let item of grepResult) {
      let substr = item.split('HomeWorld/')[1];
      substr = substr.replace(/__+/g, '_'); // replace multiple underscore with one underscore
      let parts = substr.split('/');
      let npcId = parseInt(parts[0].split('_')[1]);
      let talkId = parseInt(parts[1].slice(1));
      if (!npcIdToTalkIds.hasOwnProperty(npcId)) {
        npcIdToTalkIds[npcId] = [talkId];
      } else {
        npcIdToTalkIds[npcId].push(talkId);
      }
    }

    // Process grep result
    for (let npcId of Object.keys(npcIdToTalkIds).map(toInt)) {
      let talkIds: number[] = npcIdToTalkIds[npcId];
      let npc = homeWorldNPCs.find(x => x.NpcId === npcId);
      for (let talkId of talkIds) {
        if (npc.TalkIds.includes(talkId) || npc.RewardEvents.find(x => x.TalkId == talkId)) {
          // Don't add talk ids already in the HomeWorld NPC or the events
          continue;
        }
        npc.TalkIds.push(talkId);
      }
      npc.TalkIds.sort();
    }

    sort(homeWorldNPCs, 'CommonName');

    return homeWorldNPCs;
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

  return cached('CompanionDialogue_'+(companion.AvatarId || companion.NpcId)+'_'+ctrl.outputLangCode, async () => {
    let result: DialogueSectionResult[] = [];

    let acc = new TalkConfigAccumulator(ctrl);

    let activitySect = new DialogueSectionResult('activity', 'Event Dialogue');

    for (let talkConfigId of companion.TalkIds) {
      if (acc.fetchedTalkConfigIds.has(talkConfigId)) {
        continue;
      }
      let sect: DialogueSectionResult = await talkConfigGenerate(ctrl, talkConfigId, acc);

      if (sect.hasMetaProp('Activity ID')) {
        activitySect.children.push(sect);
      } else {
        result.push(sect);
      }

      sect.children.filter(subsect => subsect.hasMetaProp('Activity ID')).forEach(subsect => activitySect.children.push(subsect));

      sect.children = sect.children.filter(subsect => !subsect.hasMetaProp('Activity ID'));

      for (let child of sect.children) {
        let friendshipCond = child.originalData.talkConfig?.BeginCond?.find(cond => cond.Type === 'QUEST_COND_AVATAR_FETTER_GT');
        if (friendshipCond) {
          child.wikitext = `;(Unlocks at Friendship Level ${toInt(friendshipCond.Param[1]) + 1})\n` + child.wikitext.trimStart();
        }

        let daytimeCond = child.originalData.talkConfig?.BeginCond?.find(cond => cond.Type === 'QUEST_COND_IS_DAYTIME');
        if (daytimeCond) {
          if (toBoolean(daytimeCond.Param[0])) {
            child.wikitext = `;<nowiki>(Between 6:00 and 19:00)</nowiki>\n` + child.wikitext.trimStart();
          } else {
            child.wikitext = `;<nowiki>(Between 19:00 and 6:00)</nowiki>\n` + child.wikitext.trimStart();
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

      let rewardInfo = await ctrl.selectRewardExcelConfigData(rewardEvent.RewardId);
      section.wikitextArray.push({
        title: 'Rewards',
        wikitext: rewardInfo.RewardSummary.CombinedCards
      });

      if (rewardEvent.FurnitureSuitId) {
        let furnitureSuite = await ctrl.selectFurnitureSuite(rewardEvent.FurnitureSuitId);
        if (furnitureSuite) {
          section.title = 'Special Dialogue for Favorite Furnishing Set: ' + furnitureSuite.SuiteNameText;
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