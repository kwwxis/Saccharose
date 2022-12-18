import {promises as fs} from 'fs';
import path from 'path';
import { LANG_CODES, LangCode, TalkRoleType } from '../../shared/types/dialogue-types';
import { DATAFILE_VOICE_ITEMS, getGenshinDataFilePath, getTextMapRelPath } from '../loadenv';

// TYPES
// ----------------------------------------------------------------------------------------------------
const TextMap: {[langCode: string]: {[id: string]: string}} = {};

export type VoiceItem = {fileName: string, gender?: 'M' | 'F'};
export type VoiceItemMap = {[dialogueId: string]: VoiceItem[]};

const VoiceItems: VoiceItemMap = {};

export type QuestSummaryMap = {[questId: number]: number};
export const QuestSummary: QuestSummaryMap = {};

// TEXT MAPS
// ----------------------------------------------------------------------------------------------------
export async function loadTextMaps(filterLangCodes?: string[]): Promise<void> {
  console.log('[Init] Loading TextMap -- starting...');
  let promises = [];
  for (let langCode of LANG_CODES) {
    if (langCode === 'CH') {
      continue;
    }
    if (filterLangCodes && filterLangCodes.length && !filterLangCodes.includes(langCode)) {
      if (!TextMap[langCode])
        TextMap[langCode] = {};
      continue;
    }
    console.log('[Init] Loading TextMap -- ' + langCode)
    let p = fs.readFile(getGenshinDataFilePath(getTextMapRelPath(langCode)), {encoding: 'utf8'}).then(data => {
      TextMap[langCode] = Object.freeze(JSON.parse(data));
    });
    promises.push(p);
  }
  return Promise.all(promises).then(() => {
    console.log('[Init] Loading TextMap -- done!');
  });
}

export async function loadEnglishTextMap(): Promise<void> {
  return loadTextMaps(['EN']);
}

export function getTextMapItem(langCode: LangCode, id: any): string {
  if (typeof id === 'number') {
    id = String(id);
  }
  if (typeof id !== 'string') {
    return undefined;
  }
  return TextMap[langCode][id];
}


// TEXT MAPS
// ----------------------------------------------------------------------------------------------------
export async function loadQuestSummarization(): Promise<void> {
  let filePath = getGenshinDataFilePath('./ExcelBinOutput/QuestSummarizationTextExcelConfigData.json');
  let result: {Id: number, DescTextMapHash: number}[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => Object.freeze(JSON.parse(data)));

  for (let item of result) {
    QuestSummary[item.Id] = item.DescTextMapHash;
  }
}

// VOICE ITEMS
// ----------------------------------------------------------------------------------------------------
export async function loadVoiceItems(): Promise<void> {
  console.log('[Init] Loading Voice Items -- starting...');
  let voiceItemsFilePath = path.resolve(process.env.GENSHIN_DATA_ROOT, DATAFILE_VOICE_ITEMS);

  let result: VoiceItemMap = await fs.readFile(voiceItemsFilePath, {encoding: 'utf8'}).then(data => Object.freeze(JSON.parse(data)));

  Object.assign(VoiceItems, result);
  console.log('[Init]  Loading Voice Items -- done!');
}

export type VoiceItemType = 'Dialog'|'Reminder'|'Fetter'|'AnimatorEvent'|'WeatherMonologue'|'JoinTeam';

export function getVoiceItems(type: VoiceItemType, id: number|string): VoiceItem[] {
  return VoiceItems[type+'_'+id];
}

export function getIdFromVoFile(voFile: string): [type: VoiceItemType, id: number] {
  voFile = voFile.toLowerCase();
  for (let key of Object.keys(VoiceItems)) {
    let voiceItemArray = VoiceItems[key];
    for (let voiceItem of voiceItemArray) {
      if (voiceItem.fileName.toLowerCase() == voFile) {
        let args = key.split('_');
        return [args[0] as VoiceItemType, parseInt(args[1])]
      }
    }
  }
  return null;
}

export function getVoPrefix(type: VoiceItemType, id: number|string, text?: string, TalkRoleType?: TalkRoleType): string {
  let voItems = VoiceItems[type+'_'+id];
  let voPrefix = '';
  if (voItems) {
    let maleVo = voItems.find(voItem => voItem.gender === 'M');
    let femaleVo = voItems.find(voItem => voItem.gender === 'F');
    let noGenderVo = voItems.filter(voItem => !voItem.gender);
    let tmp = [];

    if (maleVo) {
      tmp.push(`{{A|${maleVo.fileName}}}`);
    }
    if (femaleVo) {
      if (TalkRoleType === 'TALK_ROLE_MATE_AVATAR') {
        // If dialog speaker is Traveler's sibling, then female VO goes before male VO.
        tmp.unshift(`{{A|${femaleVo.fileName}}}`);
      } else {
        // In all other cases, male VO goes before female VO
        tmp.push(`{{A|${femaleVo.fileName}}}`);
      }
    }
    if (noGenderVo) {
      noGenderVo.forEach(x => tmp.push(`{{A|${x.fileName}}}`));
    }
    if (tmp.length) {
      if (text && (/{{MC/i.test(text) || TalkRoleType === 'TALK_ROLE_PLAYER' || TalkRoleType === 'TALK_ROLE_MATE_AVATAR')) {
        voPrefix = tmp.join(' ') + ' ';
      } else {
        voPrefix = tmp.shift() + tmp.map(x => `<!--${x}-->`).join('') + ' ';
      }
    }
  }
  return voPrefix;
}