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
import { RoleInfo } from '../../../shared/types/wuwa/role-types.ts';
import { Condition, ConditionGroup, ConditionOp } from '../../../shared/types/wuwa/condition-types.ts';

// region Control State
// --------------------------------------------------------------------------------------------------------------

/**
 * State/cache for only a single control
 */
export class WuwaControlState extends AbstractControlState {
  // Cache:
  roleInfoCache:   {[Id: number]: RoleInfo} = {};

  // Preferences:
  DisableRoleInfoCache: boolean = false;

  // Autoload Preferences:
  AutoloadText: boolean = true;
  AutoloadConditions: boolean = true;
  AutoloadRoleInfo: boolean = true;

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
        let textProp: string = prop.endsWith('Text') ? prop + 'Value' : prop + 'Text';
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
      if (prop === 'RoleId' && typeof objAsAny[prop] === 'number' && this.state.AutoloadRoleInfo) {
        objAsAny.Role = await this.selectRoleInfo(objAsAny[prop]);
      }
      if (prop === 'CondGroupId' && typeof objAsAny[prop] === 'number' && this.state.AutoloadConditions) {
        objAsAny.CondGroup = await this.selectConditionGroup(objAsAny[prop]);
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

  // region RoleInfo
  private async postProcessRoleInfo(roleInfo: RoleInfo): Promise<RoleInfo> {
    return roleInfo;
  }

  async selectAllRoleInfo(): Promise<RoleInfo[]> {
    return this.knex.select('*').from('RoleInfo')
      .then(this.commonLoad)
      .then((roles: RoleInfo[]) => roles.asyncMap(a => this.postProcessRoleInfo(a)));
  }

  async selectRoleInfo(id: number): Promise<RoleInfo> {
    if (this.state.roleInfoCache.hasOwnProperty(id)) {
      return this.state.roleInfoCache[id];
    }
    let avatar: RoleInfo = await this.knex.select('*').from('RoleInfo')
      .where({Id: id}).first().then(this.commonLoadFirst);
    avatar = await this.postProcessRoleInfo(avatar);
    if (!this.state.DisableRoleInfoCache) {
      this.state.roleInfoCache[id] = avatar;
    }
    return avatar;
  }
  // endregion

  // region Conditions
  private async postProcessCondition(cond: Condition): Promise<Condition> {
    if (!cond) return cond;

    const opMap: Record<string, ConditionOp> = {};

    if (cond.LimitParamsOpe) {
      for (let param of cond.LimitParamsOpe) {
        if ((param.Value as string) === 'Ge') {
          param.Value = '>=';
        }
        opMap[param.Key] = param.Value;
      }
    }

    if (!cond.LimitParams) {
      cond.LimitParams = [];
    }
    for (let param of cond.LimitParams) {
      if (opMap[param.Key]) {
        param.Op = opMap[param.Key];
      }
    }

    return cond;
  }

  private async postProcessConditionGroup(group: ConditionGroup): Promise<ConditionGroup> {
    if (!group) return group;

    if (Array.isArray(group.GroupId) && group.GroupId.length) {
      group.Conditions = await this.selectConditions(group.GroupId);
    } else {
      group.Conditions = [];
    }

    return group;
  }

  async selectConditionGroup(conditionGroupId: number): Promise<ConditionGroup> {
    if (conditionGroupId === 0)
      return null;
    return this.knex.select('*').from('ConditionGroup')
      .where({ 'Id': conditionGroupId }).first()
      .then(this.commonLoadFirst).then(x => this.postProcessConditionGroup(x));
  }

  async selectConditions(conditionIds: number[]): Promise<Condition[]> {
    return this.knex.select('*').from('Condition')
      .whereIn('Id', conditionIds)
      .then(this.commonLoad)
      .then((conditions: Condition[]) => conditions.asyncMap(x => this.postProcessCondition(x)));
  }
  // endregion
}
// endregion
