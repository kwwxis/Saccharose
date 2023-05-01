import { promises as fs } from 'fs';
import path from 'path';
import { TalkRoleType } from '../../../shared/types/genshin/dialogue-types';
import { DATAFILE_VOICE_ITEMS } from '../../loadenv';

export type VoiceItem = {fileName: string, gender?: 'M' | 'F'};
export type VoiceItemMap = {[dialogueId: string]: VoiceItem[]};

const VoiceItems: VoiceItemMap = {};

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