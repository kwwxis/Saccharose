import { DialogExcelConfigData, TalkExcelConfigData } from '../../../shared/types/dialogue-types';
import { Control } from '../script_util';
import { isInt } from '../../../shared/util/numberUtil';
import { traceBack } from './dialogue_util';

export async function guessQuestFromDialogueId(ctrl: Control, id: number|string): Promise<number> {
  if (typeof id === 'string') {
    if (isInt(id)) {
      id = parseInt(id);
    } else {
      return undefined;
    }
  }
  if (!id || id < 100) {
    return undefined; // minimum quest id is 3 digits
  }

  let strId = id.toString().padStart(9, '0');

  // Most dialogue IDs are in the format of xxxxx|yy|zz (9 digits)
  //  xxxxx - quest ID
  //  yy - step id
  //  zz - line id (sometimes can be 3 digits as "zzz")
  // when the dialogue ID is less than 9 digits, it should be '0'-padded to the left

  // largest quest ID has 5 digits
  // smallest quest ID has 3
  for (let n of [3,4,5]) {
    let sub = parseInt(strId.slice(0, n));
    if (await ctrl.doesQuestExist(sub)) {
      return sub;
    }
  }
  return undefined;
}

/**
 *
 * @param ctrl Control
 * @param query Either dialogue text, dialogue/talk id, or instance.
 */
export async function dialogueToQuestId(ctrl: Control, query: string|number|DialogExcelConfigData|TalkExcelConfigData): Promise<number[]> {
  let talk: TalkExcelConfigData;
  let dialog: DialogExcelConfigData;

  if (typeof query === 'string' && isInt(query)) {
    query = parseInt(query);
  }
  if (typeof query === 'string') {
    let matches = ctrl.getTextMapMatches(ctrl.inputLangCode, query, '-m 1') // only get one match
    if (!Object.keys(matches).length) {
      return [];
    }
    let textMapId = parseInt(Object.keys(matches)[0]);
    dialog = (await ctrl.selectDialogsFromTextContentId(textMapId))[0];
  }
  if (typeof query === 'number') {
    talk = await ctrl.selectTalkExcelConfigDataById(query);
    dialog = await ctrl.selectSingleDialogExcelConfigData(query);
  }
  if (typeof query === 'object') {
    if (query.hasOwnProperty('QuestId') || query.hasOwnProperty('InitDialog')) {
      talk = query as TalkExcelConfigData;
    }
    if (query.hasOwnProperty('TalkContentTextMapHash')) {
      dialog = query as DialogExcelConfigData;
    }
  }
  if (talk && talk.QuestId) {
    return [talk.QuestId];
  }
  if (!dialog) {
    return [];
  }
  let ret = [];
  let firstDialogs = await traceBack(ctrl, dialog);
  for (let d of firstDialogs) {
    let talks = await ctrl.selectTalkExcelConfigDataListByFirstDialogueId(d.Id);
    for (let t of talks) {
      if (t && t.QuestId) {
        ret.push(t.QuestId);
      }
    }
  }
  if (ret.length) {
    return ret;
  }
  for (let d of firstDialogs) {
    let qId = await guessQuestFromDialogueId(ctrl, d.Id);
    if (qId) {
      ret.push(qId);
    }
  }
  return ret;
}