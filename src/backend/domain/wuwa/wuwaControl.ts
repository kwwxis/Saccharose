// noinspection JSUnusedGlobalSymbols

import { AbstractControl } from '../generic/abstractControl.ts';
import { getWuwaDataFilePath } from '../../loadenv.ts';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db.ts';
import { LangCode, TextMapHash } from '../../../shared/types/lang-types.ts';
import { __normWuwaText } from './wuwaText.ts';
import { NormTextOptions } from '../generic/genericNormalizers.ts';
import { Request } from 'express';
import { wuwa_i18n, WUWA_I18N_MAP } from '../generic/i18n.ts';
import { AbstractControlState } from '../generic/abstractControlState.ts';

// region Control State
// --------------------------------------------------------------------------------------------------------------

/**
 * State/cache for only a single control
 */
export class WuwaControlState extends AbstractControlState {
  // Autoload Preferences:
  AutoloadText: boolean = true;

  override copy(): WuwaControlState {
    return new WuwaControlState(this.request);
  }
}

export function getWuwaControl(request?: Request) {
  return new WuwaControl(request);
}

// region Control Object
// --------------------------------------------------------------------------------------------------------------
export class WuwaControl extends AbstractControl<WuwaControlState> {
  constructor(requestOrState?: Request|WuwaControlState) {
    super('wuwa', WuwaControlState, requestOrState);
    this.excelPath = './ConfigDB';
    this.disabledLangCodes.add('IT');
    this.disabledLangCodes.add('TR');
    this.disabledLangCodes.add('RU');
    this.disabledLangCodes.add('TH');
    this.disabledLangCodes.add('VI');
    this.disabledLangCodes.add('ID');
    this.disabledLangCodes.add('PT');
  }

  override getDataFilePath(file: string): string {
    return getWuwaDataFilePath(file);
  }

  override normText(text: string, langCode: LangCode, opts: NormTextOptions = {}): string {
    return __normWuwaText(text, langCode, opts);
  }

  override copy(): WuwaControl {
    return new WuwaControl(this.state.copy());
  }

  readonly maybeTextMapHash = (x: any) => typeof x === 'string' && /^[a-zA-Z0-9_\-]+$/.test(x);

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable | boolean, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, typeof triggerNormalize === 'boolean' ? null : triggerNormalize);
    }
    const objAsAny = object as any;
    for (let prop in object) {
      if (this.state.AutoloadText && (
        this.maybeTextMapHash(object[prop])
        || (Array.isArray(object[prop]) && (<any[]> object[prop]).every(x => this.maybeTextMapHash(x)))
      )) {
        let textProp: string = prop + 'Text';
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
      if (object[prop] === null || objAsAny[prop] === '') {
        delete object[prop];
      }
    }
    return object;
  }

  override i18n(key: keyof typeof WUWA_I18N_MAP, vars?: Record<string, string>): string {
    return wuwa_i18n(key, this.outputLangCode, vars);
  }
}
// endregion
