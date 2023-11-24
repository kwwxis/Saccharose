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
  override copy(): ZenlessControlState {
    return new ZenlessControlState(this.request);
  }
}

export function getZenlessControl(request?: Request) {
  return new ZenlessControl(request);
}

// region Control Object
// --------------------------------------------------------------------------------------------------------------
export class ZenlessControl extends AbstractControl<ZenlessControlState> {
  constructor(requestOrState?: Request|ZenlessControlState) {
    super('zenless', ZenlessControlState, requestOrState);
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

  override copy(): ZenlessControl {
    return new ZenlessControl(this.state.copy());
  }

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable|boolean, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, typeof triggerNormalize === 'boolean' ? null : triggerNormalize);
    }
    return object;
  }
}
// endregion