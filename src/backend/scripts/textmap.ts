import {promises as fs} from 'fs';
import path from 'path';
import { LANG_CODES, LangCode, LangCodeMap, TalkRoleType } from '../../shared/types/dialogue-types';
import { DATAFILE_VOICE_ITEMS, getGenshinDataFilePath, getPlainTextMapRelPath, getTextMapRelPath } from '../loadenv';
import { normText } from './script_util';
import { ElementType, ManualTextMapHashes } from '../../shared/types/manual-text-map';
import { SpriteTagExcelConfigData } from '../../shared/types/general-types';
import { normalizeRawJson, schema } from '../importer/import_run';

// TYPES
// ----------------------------------------------------------------------------------------------------
const TextMap: {[langCode: string]: {[id: string]: string}} = {};
const PlainLineMap: {[langCode: string]: {[lineNum: number]: number}} = {};

export type VoiceItem = {fileName: string, gender?: 'M' | 'F'};
export type VoiceItemMap = {[dialogueId: string]: VoiceItem[]};

const VoiceItems: VoiceItemMap = {};

export type QuestSummaryMap = {[questId: number]: number};
export const QuestSummary: QuestSummaryMap = {};

// TEXT MAPS
// ----------------------------------------------------------------------------------------------------\
export async function loadTextMaps(filterLangCodes?: string[], loadPlainLineMaps: boolean = true): Promise<void> {
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

    console.log(`[Init] Loading TextMap${loadPlainLineMaps ? ' and PlainLineMap ' : ' '}-- ` + langCode);

    const p = fs.readFile(getGenshinDataFilePath(getTextMapRelPath(langCode)), {encoding: 'utf8'}).then(data => {
      TextMap[langCode] = Object.freeze(JSON.parse(data));
    });

    promises.push(p);

    if (loadPlainLineMaps) {
      PlainLineMap[langCode] = {};

      const p2 = fs.readFile(getGenshinDataFilePath(getPlainTextMapRelPath(langCode, 'Hash')), {encoding: 'utf8'}).then(data => {
        let lines = data.split(/\n/g);
        for (let i = 0; i < lines.length; i++) {
          PlainLineMap[langCode][i + 1] = parseInt(lines[i]);
        }
      });

      promises.push(p2);
    }
  }

  return Promise.all(promises).then(() => {
    console.log('[Init] Loading TextMap -- done!');
  });
}

export function clearFullTextMap(langCode: LangCode): void {
  TextMap[langCode] = {};
  delete TextMap[langCode];
}

export function getFullTextMap(langCode: LangCode): {[id: string]: string} {
  if (langCode === 'CH') {
    langCode = 'CHS';
  }
  return TextMap[langCode];
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
  if (langCode === 'CH') {
    langCode = 'CHS';
  }
  return TextMap[langCode][id];
}

export function getPlainLineNumFromTextMapHash(langCode: LangCode, textmapHash: number): number {
  let res = Object.entries(PlainLineMap[langCode]).find(entry => entry[1] === textmapHash);
  if (res) {
    return parseInt(res[0]);
  }
  return undefined;
}

export function getTextMapHashFromPlainLineMap(langCode: LangCode, lineNum: number): number {
  return PlainLineMap[langCode][lineNum] || undefined;
}

export function createLangCodeMap(id: any, doNormText: boolean = true): LangCodeMap {
  let map = {};
  for (let langCode of LANG_CODES) {
    map[langCode] = getTextMapItem(langCode, id);
    if (doNormText) {
      map[langCode] = normText(map[langCode], langCode);
    }
  }
  return map as LangCodeMap;
}

export function getElementName(elementType: ElementType, langCode: LangCode = 'EN') {
  let hash = ManualTextMapHashes[elementType];
  if (!hash) {
    hash = ManualTextMapHashes['None'];
  }
  return getTextMapItem(langCode, hash);
}

// QUEST SUMMARIZATION
// ----------------------------------------------------------------------------------------------------
export async function loadQuestSummarization(): Promise<void> {
  let filePath = getGenshinDataFilePath('./ExcelBinOutput/QuestSummarizationTextExcelConfigData.json');
  let result: {Id: number, DescTextMapHash: number}[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => Object.freeze(JSON.parse(data)));

  for (let item of result) {
    QuestSummary[item.Id] = item.DescTextMapHash;
  }
}

// SPRITE TAGS
// ----------------------------------------------------------------------------------------------------
export const SPRITE_TAGS: {[spriteId: number]: SpriteTagExcelConfigData} = {};

export async function loadSpriteTags(): Promise<void> {
  let filePath = getGenshinDataFilePath('./ExcelBinOutput/SpriteTagExcelConfigData.json');
  let result: SpriteTagExcelConfigData[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => {
    let rows = JSON.parse(data);
    rows = normalizeRawJson(rows, schema.SpriteTagExcelConfigData);
    return Object.freeze(rows);
  });
  for (let row of result) {
    SPRITE_TAGS[row.Id] = row;
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

export type VoiceItemType = 'Dialog'|'Reminder'|'Fetter'|'AnimatorEvent'|'WeatherMonologue'|'JoinTeam'|'Card';

export function getAllVoiceItemsOfType(type: VoiceItemType) {
  let items: VoiceItem[] = [];
  for (let [key, item] of Object.entries(VoiceItems)) {
    if (key.startsWith(type)) {
      items.push(... item)
    }
  }
  return items;
}

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

export function getVoPrefix(type: VoiceItemType, id: number|string, text?: string, TalkRoleType?: TalkRoleType, commentOutDupes: boolean = true): string {
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
      tmp.push(`{{A|${femaleVo.fileName}}}`);
    }
    if (noGenderVo) {
      noGenderVo.forEach(x => tmp.push(`{{A|${x.fileName}}}`));
    }
    if (tmp.length) {
      if (!commentOutDupes) {
        voPrefix = tmp.join(' ') + ' ';
      } else if (text && (/{{MC/i.test(text) || TalkRoleType === 'TALK_ROLE_PLAYER' || TalkRoleType === 'TALK_ROLE_MATE_AVATAR')) {
        voPrefix = tmp.join(' ') + ' ';
      } else {
        voPrefix = tmp.shift() + tmp.map(x => `<!--${x}-->`).join('') + ' ';
      }
    }
  }
  return voPrefix;
}