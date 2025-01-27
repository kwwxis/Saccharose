// noinspection JSUnusedGlobalSymbols

import { AbstractControl } from '../abstract/abstractControl.ts';
import { getZenlessDataFilePath } from '../../loadenv.ts';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db.ts';
import { LangCode, TextMapHash } from '../../../shared/types/lang-types.ts';
import { __normZenlessText, ZenlessNormTextOpts } from './zenlessText.ts';
import { NormTextOptions } from '../abstract/genericNormalizers.ts';
import { Request } from 'express';
import { zenless_i18n, ZENLESS_I18N_MAP } from '../abstract/i18n.ts';
import { AbstractControlState } from '../abstract/abstractControlState.ts';
import { CurrentZenlessVersion, GameVersion, ZenlessVersions } from '../../../shared/types/game-versions.ts';

// region Control State
// --------------------------------------------------------------------------------------------------------------

/**
 * State/cache for only a single control
 */
export class ZenlessControlState extends AbstractControlState {
  // Autoload Preferences:
  AutoloadText: boolean = true;

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
    super('zenless', 'zenless', 'Zenless', ZenlessControlState, requestOrState);
    this.excelPath = './FileCfg';
    this.disabledLangCodes.add('IT');
    this.disabledLangCodes.add('TR');
  }

  override getDataFilePath(file: string): string {
    return getZenlessDataFilePath(file);
  }

  override normText(text: string, langCode: LangCode, opts: NormTextOptions<ZenlessNormTextOpts> = {}): string {
    return __normZenlessText(text, langCode, opts);
  }

  override copy(): ZenlessControl {
    return new ZenlessControl(this.state.copy());
  }

  readonly maybeTextMapHash = (prop: string, x: any) => typeof x === 'string' && /^[a-zA-Z0-9_\-\/\\.]+$/.test(x)
    && !prop.endsWith('Id') && !prop.startsWith('ScriptConfig');

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable | boolean, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, typeof triggerNormalize === 'boolean' ? null : triggerNormalize);
    }
    const objAsAny = object as any;
    for (let prop in object) {
      if (this.state.AutoloadText && (
        this.maybeTextMapHash(prop, object[prop])
        || (Array.isArray(object[prop]) && (<any[]> object[prop]).every(x => this.maybeTextMapHash(prop, x)))
      )) {
        // Default text prop name for obfuscated props:
        let textProp: string = prop + 'Text';

        // For non-obfsucate ending in "Key"
        //   "DialogueKey" -> "DialogueText"
        //   "TextKey" -> "Text"
        if (prop.endsWith('Key')) {
          textProp = prop.slice(0, -3) + 'Text';
          if (textProp.endsWith('TextText')) {
            textProp = textProp.slice(0, -4);
          }
        } else if (prop.endsWith('Keys')) {
          textProp = prop.slice(0, -4) + 'Texts';
          if (textProp.endsWith('TextTexts')) {
            textProp = textProp.slice(0, -5) + 's';
          }
        }

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
          if (!!text && doNormText) {
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

  override i18n(key: keyof typeof ZENLESS_I18N_MAP, vars?: Record<string, string>): string {
    return zenless_i18n(key, this.outputLangCode, vars);
  }

  override selectVersions(): GameVersion[] {
    return ZenlessVersions;
  }

  override selectCurrentVersion(): GameVersion {
    return CurrentZenlessVersion;
  }
}
// endregion
