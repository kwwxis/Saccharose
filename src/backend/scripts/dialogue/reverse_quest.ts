import { DialogExcelConfigData, TalkExcelConfigData } from '../../../shared/types/dialogue-types';
import { Control } from '../script_util';


/**
 *
 * @param ctrl Control
 * @param query Either dialogue text, dialogue id, or instance.
 */
export async function dialogueToQuest(ctrl: Control, query: string|number|DialogExcelConfigData): Promise<number> {

  return null;
}

/**
 *
 * @param ctrl Control
 * @param query Either TalkExcelConfigData ID or instance.
 */
export async function talkToQuest(ctrl: Control, query: number|TalkExcelConfigData): Promise<number> {
  if (typeof query === 'number') {
    query = await ctrl.selectTalkExcelConfigDataById(query);
  }
  if (query.QuestId) {
    return query.QuestId;
  }
  return await dialogueToQuest(ctrl, query.InitDialog);
}