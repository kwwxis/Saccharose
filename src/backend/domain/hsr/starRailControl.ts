// noinspection JSUnusedGlobalSymbols

import { AbstractControl, AbstractControlState } from '../abstractControl';
import { Request } from '../../util/router';
import { DATAFILE_HSR_VOICE_ITEMS, getStarRailDataFilePath } from '../../loadenv';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db';
import {
  LangCode,
  TextMapHash,
  VoiceItem,
  VoiceItemArrayMap,
  VoiceItemFlatMap,
} from '../../../shared/types/lang-types';
import { normStarRailText } from './starRailText';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * State/cache for only a single control
 */
export class StarRailControlState extends AbstractControlState {

}

export function getStarRailControl(request?: Request) {
  return new StarRailControl(request);
}

export class StarRailControl extends AbstractControl<StarRailControlState> {
  readonly voice: StarRailVoice;

  constructor(request?: Request) {
    super('hsr', StarRailControlState, request);
    this.excelPath = './ExcelOutput';
    this.disabledLangCodes.add('IT');
    this.disabledLangCodes.add('TR');
  }

  override getDataFilePath(file: string): string {
    return getStarRailDataFilePath(file);
  }

  override normText(text: string, langCode: LangCode, decolor: boolean = false, plaintext: boolean = false): string {
    return normStarRailText(text, langCode, decolor, plaintext);
  }

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, triggerNormalize);
    }
    const objAsAny = object as any;
    for (let prop in object) {
      if (prop.endsWith('Hash') || prop.endsWith('HashList')) {
        let textProp: string = prop.endsWith('HashList') ? prop.slice(0, -8) + 'List' : prop.slice(0, -4);
        if (Array.isArray(object[prop])) {
          let newOriginalArray = [];
          object[textProp] = [];
          for (let id of <any[]>object[prop]) {
            let text = await this.getTextMapItem(this.outputLangCode, id);
            if (doNormText) {
              text = this.normText(text, this.outputLangCode);
            }
            if (text) {
              object[textProp].push(text);
              newOriginalArray.push(id);
            }
          }
          objAsAny[prop] = newOriginalArray;
        } else {
          let text = await this.getTextMapItem(this.outputLangCode, <TextMapHash> object[prop]);
          if (doNormText) {
            text = this.normText(text, this.outputLangCode);
          }
          if (!!text) {
            object[textProp] = text;
          }
        }
      }
    }
    return object;
  }
}

const HSR_VOICE_ITEMS: VoiceItemFlatMap = {};

export type StarRailVoiceItemType = 'Archive' | 'Cutscene' | 'NPC_Far' | 'NPC_Near' | 'NPC_Normal';

interface StarRailVoiceConfig {
  IsPlayerInvolved: boolean,
  VoiceId: number,
  VoicePath: string,
  VoiceType?: string,
}

export async function loadStarRailVoiceItems(): Promise<void> {
  console.log('[Init] Loading HSR Voice Items -- starting...');

  const voiceItemsFilePath = path.resolve(process.env.HSR_DATA_ROOT, DATAFILE_HSR_VOICE_ITEMS);
  const result: StarRailVoiceConfig[] = await fs.readFile(voiceItemsFilePath, {encoding: 'utf8'}).then(data => JSON.parse(data));

  for (let item of result) {
    HSR_VOICE_ITEMS[item.VoiceId] = {
      id: item.VoiceId,
      fileName: item.VoicePath.replace(/_/g, ' ').toLowerCase() + '.ogg',
      isGendered: item.IsPlayerInvolved,
      type: item.VoiceType
    };
  }

  Object.freeze(HSR_VOICE_ITEMS);
  console.log('[Init] Loading HSR Voice Items -- done!');
}

export class StarRailVoice {

  getVoiceItemsByType(type: StarRailVoiceItemType): VoiceItem[] {
    let items: VoiceItem[] = [];
    for (let item of Object.values(HSR_VOICE_ITEMS)) {
      if (item.type === type) {
        items.push(item)
      }
    }
    return items;
  }

  getVoiceItemByFile(voFile: string): VoiceItem {
    voFile = voFile.toLowerCase();
    for (let item of Object.values(HSR_VOICE_ITEMS)) {
      if (item.fileName === voFile) {
        return item;
      }
    }
    return null;
  }

  getVoiceItem(id: number|string): VoiceItem {
    return HSR_VOICE_ITEMS[id];
  }

  getVoPrefix(id: number|string, text?: string): string {
    let voItem: VoiceItem = HSR_VOICE_ITEMS[id];
    let voPrefix = '';
    if (voItem) {
      let tmp = [];

      if (voItem.isGendered && (!text || (/{{MC/i.test(text)))) {
        tmp.push(`{{A|${voItem.fileName} M}}`);
        tmp.push(`{{A|${voItem.fileName} F}}`);
      } else {
        tmp.push(`{{A|${voItem.fileName}}}`);
      }

      return tmp.join(' ') + ' ';
    }
    return voPrefix;
  }
}