// noinspection JSUnusedGlobalSymbols

import { AbstractControl, AbstractControlState } from '../abstractControl';
import { DATAFILE_HSR_VOICE_ITEMS, getStarRailDataFilePath } from '../../loadenv';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db';
import {
  LangCode,
  TextMapHash,
  VoiceItem,
  VoiceItemFlatMap,
} from '../../../shared/types/lang-types';
import { __normStarRailText } from './starRailText';
import path from 'path';
import { promises as fs } from 'fs';
import { defaultMap } from '../../../shared/util/genericUtil';
import { LoadingDesc } from '../../../shared/types/hsr/hsr-misc-types';
import { sort } from '../../../shared/util/arrayUtil';
import { NormTextOptions } from '../generic/genericNormalizers';
import { Request } from 'express';
import { logInitData } from '../../util/logger';

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

  override normText(text: string, langCode: LangCode, opts: NormTextOptions = {}): string {
    if (!opts) opts = {};
    if (this.outputLangCode === 'EN') {
      opts.mcPlaceholderForceLangCode = 'EN';
    }
    return __normStarRailText(text, langCode, opts);
  }

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, triggerNormalize);
    }
    const objAsAny = object as any;
    for (let prop in object) {
      if (prop.endsWith('MapHash') || prop.endsWith('MapHashList')) {
        let textProp: string = prop.endsWith('List') ? prop.slice(0, -11) + 'List' : prop.slice(0, -7);
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

  async getLoadingTips(): Promise<{[category: string]: string[]}> {
    const out: {[category: string]: string[]} = defaultMap('Array');

    let loadingTips: LoadingDesc[] = await this.readExcelDataFile('./LoadingDesc.json');
    sort(loadingTips, 'TitleText', 'DescText');

    for (let loadingTip of loadingTips) {
      let title = this.normText(loadingTip.TitleText, this.outputLangCode);
      let desc = this.normText(loadingTip.DescText, this.outputLangCode);

      out[title].push(desc);
    }

    return out;
  }
}

// Voice Items
// --------------------------------------------------------------------------------------------------------------

const HSR_VOICE_ITEMS: VoiceItemFlatMap = {};

export type StarRailVoiceItemType = 'Archive' | 'Cutscene' | 'NPC_Far' | 'NPC_Near' | 'NPC_Normal';

interface StarRailVoiceConfig {
  IsPlayerInvolved: boolean,
  VoiceId: number,
  VoicePath: string,
  VoiceType?: string,
}

export async function loadStarRailVoiceItems(): Promise<void> {
  logInitData('Loading HSR Voice Items -- starting...');

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
  logInitData('Loading HSR Voice Items -- done!');
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