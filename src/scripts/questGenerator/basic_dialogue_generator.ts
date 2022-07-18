import '../../setup';
import {openKnex, closeKnex} from '@db';
import { getControl } from '@/scripts/script_util';
import { getTextMapMatches } from '@/scripts/textMapFinder/text_map_finder';

async function dialogueGenerate(firstDialogueId: number|number[]|string) {
  try {
    const knex = openKnex();
    const ctrl = getControl(knex);

    if (typeof firstDialogueId === 'string') {
      const matches = await getTextMapMatches(firstDialogueId.trim());
      if (Object.keys(matches).length) {
        let dialogue = await ctrl.getDialogFromTextContentId(parseInt(Object.keys(matches)[0]));
        firstDialogueId = dialogue.Id;
      } else {
        console.log('Text Map record not found:', firstDialogueId);
        return;
      }
    }

    if (typeof firstDialogueId === 'number') {
      const dialogue = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(firstDialogueId));
      console.log(`FirstDialogueId: ${firstDialogueId}`);
      console.log(await ctrl.generateDialogueWikiText(dialogue));
    } else {
      for (let id of firstDialogueId) {
        console.log(`FirstDialogueId: ${id}`);
        const dialogue = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(id));
        console.log(await ctrl.generateDialogueWikiText(dialogue));
        console.log();
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await closeKnex();
  }
}

async function getDialogueByNpcNameOrId(npcNameOrId: number|string) {
  try {
    const knex = openKnex();
    const ctrl = getControl(knex);
    const npcIdList: number[] = [];

    if (typeof npcNameOrId === 'string') {
      let npcList = await ctrl.selectNpcListByName(npcNameOrId);
      for (let npc of npcList) {
        npcIdList.push(npc.Id);
      }
    } else {
      npcIdList.push(npcNameOrId);
    }

    for (let npcId of npcIdList) {
      const talkConfigs = await ctrl.selectTalkExcelConfigDataByNpcId(npcId);
      for (let talkConfig of talkConfigs) {
        talkConfig.Dialog = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog));
        if (!talkConfig.Dialog) {
          continue;
        }
        console.log(`TalkConfigId: ${talkConfig.Id} | NPC ID: ${npcId}`);
        console.log(`{{Dialogue start}}`);
        console.log((await ctrl.generateDialogueWikiText(talkConfig.Dialog)).trim());
        console.log(`{{Dialogue end}}`);
        console.log();
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await closeKnex();
  }
}

if (require.main === module) {
  (async () => {
    let ids = [
      621530101
    ];
    // 2154 - Taliesin
    // 2617 - Clitopho
    // 2061 - Muning
    await getDialogueByNpcNameOrId('Chiaki');

    //await dialogueGenerate(722860121);
    //await dialogueGenerate(`Yeah! It was thanks to everything you did that you got to see her again. That's amazing!`);
  })();
}