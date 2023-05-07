// noinspection JSUnusedGlobalSymbols

import { AbstractControl, AbstractControlState } from '../abstractControl';
import { Request } from '../../util/router';
import { getStarRailDataFilePath } from '../../loadenv';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db';
import { LangCode } from '../../../shared/types/lang-types';
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

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, triggerNormalize);
    }
    return object;
  }
}