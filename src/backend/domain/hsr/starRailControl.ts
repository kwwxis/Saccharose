// noinspection JSUnusedGlobalSymbols

import { AbstractControl, AbstractControlState } from '../abstractControl';
import { Request } from '../../util/router';
import { getStarRailDataFilePath } from '../../loadenv';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db';
import { LangCode, TextMapHash } from '../../../shared/types/lang-types';
import { normStarRailText } from './starRailText';

/**
 * State/cache for only a single control
 */
export class StarRailControlState extends AbstractControlState {

}

export function getStarRailControl(request?: Request) {
  return new StarRailControl(request);
}

export class StarRailControl extends AbstractControl<StarRailControlState> {
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