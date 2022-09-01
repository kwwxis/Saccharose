import '../../setup';
import { closeKnex } from '@db';
import { Control, getControl, grep, nameNormMap } from '@/scripts/script_util';
import { DialogueSectionResult, TalkConfigAccumulator } from './quest_generator';
import { talkConfigGenerate } from './basic_dialogue_generator';
import { loadTextMaps } from '../textmap';
import { cached } from '@cache';

export async function fetchCompanionDialogueTalkIds(): Promise<{[charName: string]: number[]}> {
  return cached('CompanionDialogueTalkIds', async () => {
    const grepResult = await grep('QuestDialogue/HomeWorld/', './ExcelBinOutput/TalkExcelConfigData.json');
    let charToTalkId: {[charName: string]: number[]} = {};
    for (let item of grepResult) {
      let substr = item.split('HomeWorld/')[1];
      let parts = substr.split('/');
      let char = parts[0].split('_')[0];
      let talkId = parts[1].slice(1);
      if (nameNormMap.hasOwnProperty(char.toLowerCase())) {
        char = nameNormMap[char.toLowerCase()];
      }

      if (!charToTalkId.hasOwnProperty(char)) {
        charToTalkId[char] = [parseInt(talkId)];
      } else {
        charToTalkId[char].push(parseInt(talkId));
      }
    }
    return charToTalkId;
  });
}

export async function fetchCompanionDialogue(ctrl: Control, charName: string): Promise<DialogueSectionResult[]> {
  return cached('CompanionDialogue_'+charName, async () => {
    let result: DialogueSectionResult[] = [];
    let talkIds = (await fetchCompanionDialogueTalkIds())[charName];
    if (!talkIds) {
      return [];
    }

    let acc = new TalkConfigAccumulator(ctrl);

    for (let talkConfigId of talkIds) {
      if (acc.fetchedTalkConfigIds.includes(talkConfigId)) {
        continue;
      }
      result.push(await talkConfigGenerate(ctrl, talkConfigId, null, acc));
    }

    return result;
  });
}

if (require.main === module) {
  (async () => {
    await loadTextMaps();
    console.log(await fetchCompanionDialogue(getControl(), 'Raiden Shogun'));
    closeKnex();
  })();
}