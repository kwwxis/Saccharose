// noinspection JSUnusedGlobalSymbols

import { AbstractControl } from '../generic/abstractControl.ts';
import { getZenlessDataFilePath } from '../../loadenv.ts';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db.ts';
import { LangCode } from '../../../shared/types/lang-types.ts';
import { __normZenlessText } from './zenlessText.ts';
import { NormTextOptions } from '../generic/genericNormalizers.ts';
import { Request } from 'express';
import { zenless_i18n, ZENLESS_I18N_MAP } from '../generic/i18n.ts';
import { AbstractControlState } from '../generic/abstractControlState.ts';

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
    this.excelPath = './FileCfg';
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

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable | boolean, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, typeof triggerNormalize === 'boolean' ? null : triggerNormalize);
    }
    return object;
  }

  override i18n(key: keyof typeof ZENLESS_I18N_MAP, vars?: Record<string, string>): string {
    return zenless_i18n(key, this.outputLangCode, vars);
  }
}
// endregion
