// noinspection JSUnusedGlobalSymbols

import { AbstractControl, AbstractControlState } from '../abstractControl';
import { getZenlessDataFilePath } from '../../loadenv';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db';
import { LangCode } from '../../../shared/types/lang-types';
import { __normZenlessText } from './zenlessText';
import { NormTextOptions } from '../generic/genericNormalizers';
import { Request } from 'express';

// region Control State
// --------------------------------------------------------------------------------------------------------------

/**
 * State/cache for only a single control
 */
export class ZenlessControlState extends AbstractControlState {

}

export function getZenlessControl(request?: Request) {
  return new ZenlessControl(request);
}

// region Control Object
// --------------------------------------------------------------------------------------------------------------
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

  override normText(text: string, langCode: LangCode, opts: NormTextOptions = {}): string {
    return __normZenlessText(text, langCode, opts);
  }

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, triggerNormalize);
    }
    return object;
  }
}
// endregion