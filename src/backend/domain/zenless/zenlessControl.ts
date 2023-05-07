// noinspection JSUnusedGlobalSymbols

import { AbstractControl, AbstractControlState } from '../abstractControl';
import { Request } from '../../util/router';
import { getZenlessDataFilePath } from '../../loadenv';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db';
import { LangCode } from '../../../shared/types/lang-types';
import { normZenlessText } from './zenlessText';

/**
 * State/cache for only a single control
 */
export class ZenlessControlState extends AbstractControlState {

}

export function getZenlessControl(request?: Request) {
  return new ZenlessControl(request);
}

export class ZenlessControl extends AbstractControl<ZenlessControlState> {
  constructor(request?: Request) {
    super('zenless', ZenlessControlState, request);
    this.excelPath = './ExcelConfigData';
    this.disabledLangCodes.add('IT');
    this.disabledLangCodes.add('TR');
  }

  override getDataFilePath(file: string): string {
    return getZenlessDataFilePath(file);
  }

  override normText(text: string, langCode: LangCode, decolor: boolean = false, plaintext: boolean = false): string {
    return normZenlessText(text, langCode, decolor, plaintext);
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