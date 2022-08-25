import '../../setup';
import {closeKnex} from '@db';
import { Control } from '@/scripts/script_util';
import { DialogExcelConfigData, TalkExcelConfigData } from '@types';

export async function dialogueGenerate(ctrl: Control, firstDialogueId: number|number[]|string): Promise<{[id: number]: string}> {
  let result: {[id: number]: string} = {};

  if (typeof firstDialogueId === 'string') {
    const matches = await ctrl.getTextMapMatches(ctrl.inputLangCode, firstDialogueId.trim());
    if (Object.keys(matches).length) {
      let dialogue = await ctrl.getDialogFromTextContentId(parseInt(Object.keys(matches)[0]));
      firstDialogueId = dialogue.Id;
    } else {
      throw 'Text Map record not found for: ' + firstDialogueId;
    }
  }

  if (typeof firstDialogueId === 'number') {
    const dialogue = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(firstDialogueId));
    result[firstDialogueId] = '{{Dialogue start}}\n'+(await ctrl.generateDialogueWikiText(dialogue)).trim()+'\n{{Dialogue end}}';
  } else {
    for (let id of firstDialogueId) {
      const dialogue = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(id));
      result[id] = '{{Dialogue start}}\n'+(await ctrl.generateDialogueWikiText(dialogue)).trim()+'\n{{Dialogue end}}';
    }
  }
  return result;
}

export async function talkConfigGenerate(ctrl: Control, talkConfigId: number): Promise<string> {
  let initTalkConfig = await ctrl.selectTalkExcelConfigDataByQuestSubId(talkConfigId);

  async function handleTalkDialogue(talkConfig: TalkExcelConfigData, originatorDialog?: DialogExcelConfigData) {
    talkConfig.Dialog = [];

    if (talkConfig.InitDialog) {
      talkConfig.Dialog = await ctrl.selectDialogBranch(await ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog));

      if (originatorDialog) {
        if (!originatorDialog.Branches) {
          originatorDialog.Branches = [];
        }
        originatorDialog.Branches.push(talkConfig.Dialog);
      }
    }

    let nextOriginatorDialog = talkConfig.Dialog[talkConfig.Dialog.length - 1];

    if (talkConfig.NextTalks) {
      for (let nextTalkConfigId of talkConfig.NextTalks) {
        let nextTalkConfig = await ctrl.selectTalkExcelConfigDataByQuestSubId(nextTalkConfigId);
        await handleTalkDialogue(nextTalkConfig, nextOriginatorDialog);
      }
    }
  }
  await handleTalkDialogue(initTalkConfig);

  let out = '{{Dialogue start}}';
  out += await ctrl.generateDialogueWikiText(initTalkConfig.Dialog);
  out += '\n{{Dialogue end}}';
  return out;
}

if (require.main === module) {
  (async () => {
    //console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    //console.log(await talkConfigGenerate(6906901));
    closeKnex();
  })();
}