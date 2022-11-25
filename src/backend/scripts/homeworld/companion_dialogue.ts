import '../../loadenv';
import { closeKnex } from '../../util/db';
import { Control, getControl, grep } from '../script_util';
import { DialogueSectionResult, TalkConfigAccumulator } from '../dialogue/quest_generator';
import { talkConfigGenerate } from '../dialogue/basic_dialogue_generator';
import { loadEnglishTextMap } from '../textmap';
import { cached } from '../../util/cache';
import { HomeWorldEventExcelConfigData, HomeWorldNPCExcelConfigData } from '../../../shared/types';
import { toInt } from '../../../shared/util/numberUtil';

export async function getHomeWorldCompanions(ctrl: Control): Promise<HomeWorldNPCExcelConfigData[]> {
  return cached('HomeWorldCompanions_'+ctrl.outputLangCode, async () => {
    const homeWorldNPCs: HomeWorldNPCExcelConfigData[] = await ctrl.selectAllHomeWorldNPCs();
    const homeWorldEvents: HomeWorldEventExcelConfigData[] = await ctrl.selectAllHomeWorldEvents();

    for (let npc of homeWorldNPCs) {
      npc.SummonEvents = [];
      npc.RewardEvents = [];
    }

    // Load events into HomeWorldNPCExcelConfigData
    for (let homeWorldEvent of homeWorldEvents) {
      let npc = homeWorldNPCs.find(npc => npc.AvatarId === homeWorldEvent.AvatarId);

      if (homeWorldEvent.EventType === 'HOME_AVATAR_SUMMON_EVENT') {
        npc.SummonEvents.push(homeWorldEvent);
      } else if (homeWorldEvent.EventType === 'HOME_AVATAR_REWARD_EVENT') {
        npc.RewardEvents.push(homeWorldEvent);
      }
    }

    // Load grep result into map
    const grepResult = await grep('QuestDialogue/HomeWorld/', './ExcelBinOutput/TalkExcelConfigData.json');
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

    return homeWorldNPCs;
  });
}

export async function fetchCompanionDialogue(ctrl: Control, avatarNameOrId: string|number): Promise<DialogueSectionResult[]> {
  let companions = await getHomeWorldCompanions(ctrl);

  let companion = companions.find(c => (c.Avatar && c.Avatar.NameText === avatarNameOrId) || (c.Npc && c.Npc.NameText === avatarNameOrId)
    || c.AvatarId === avatarNameOrId || c.NpcId === avatarNameOrId);

  if (!companion) {
    return null;
  }

  return cached('CompanionDialogue_'+companion.AvatarId+'_'+ctrl.outputLangCode, async () => {
    let result: DialogueSectionResult[] = [];

    let acc = new TalkConfigAccumulator(ctrl);

    for (let talkConfigId of companion.TalkIds) {
      if (acc.fetchedTalkConfigIds.includes(talkConfigId)) {
        continue;
      }
      result.push(await talkConfigGenerate(ctrl, talkConfigId, null, acc));
    }

    for (let rewardEvent of companion.RewardEvents) {
      let section = await talkConfigGenerate(ctrl, rewardEvent.TalkId, null, acc);
      let rewardInfo = await ctrl.selectRewardExcelConfigData(rewardEvent.RewardId);
      section.wikitextArray.push(rewardInfo.RewardWikitext);
      result.push(section);
    }

    return result;
  });
}

if (require.main === module) {
  (async () => {
    await loadEnglishTextMap();
    let ctrl = getControl();
    console.log(await fetchCompanionDialogue(ctrl, 'Raiden Shogun'));
    await closeKnex();
  })();
}